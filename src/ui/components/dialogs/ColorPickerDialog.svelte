<script>
  /**
   * @component
   * Full-featured HSL/RGB/hex/alpha color picker dialog. All picker logic
   * previously in Picker.js lives here as reactive Svelte state. Core color
   * values (rgb, hsl, alpha) are plain variables updated imperatively through
   * the propagate* functions; $state variables drive the channel input
   * displays and color ramp swatches. A picker interface object is registered
   * with events.js on mount so external callers can update and confirm colors
   * without coupling to Svelte internals.
   */
  import { onMount } from 'svelte'
  import { globalState } from '../../../context/state.js'
  import { swatches } from '../../../context/swatch.js'
  import {
    RGBToHSL,
    HSLToRGB,
    hexToRGB,
    RGBToHex,
    getLuminance,
  } from '../../../utils/colorConversion.js'
  import {
    calcHSLSelectorCoordinates,
    drawSelector,
    drawHSLGradient,
  } from '../../../utils/pickerHelpers.js'
  import {
    calcShadowHighlightRamp,
    interpolateCustomRamp,
    makeColor,
  } from '../../../swatch/colorRamps.js'
  import {
    registerPicker,
    confirmColor,
    closePickerWindow,
    addToPalette,
  } from '../../../swatch/events.js'
  import DialogBox from '../DialogBox.svelte'

  const WIDTH = 250
  const HEIGHT = 250

  // ── Canvas ──────────────────────────────────────────────────────────────────
  let canvasRef = $state(null)
  let ctx = null

  // ── Core color state (plain vars — mutated imperatively, not reactive) ──────
  let rgb = { red: 0, green: 0, blue: 0 }
  let hsl = { hue: 0, saturation: 0, lightness: 0 }
  let alpha = 255
  let hexcode = '000000'
  let luminance = 0
  let initialColor = null
  let pickerCircle = { x: 10, y: 10, width: 6, height: 6 }

  // ── Display state ($state — written by updateColor, read by template) ────────
  let rVal = $state(0)
  let gVal = $state(0)
  let bVal = $state(0)
  let aVal = $state(255)
  let hVal = $state(0)
  let sVal = $state(0)
  let lVal = $state(0)
  let hexVal = $state('000000')
  let lumiVal = $state('0')
  let hueSliderVal = $state(0)
  let alphaSliderVal = $state(255)

  // ── Color ramp state ─────────────────────────────────────────────────────────
  let customRampKeys = { start: null, mid: null, end: null }
  let selectedCustomKey = $state(null)
  let editingCustomKey = $state(null)
  let shadowColors = $state([])
  let customColors = $state([])

  // ── Pointer / spin tracking ──────────────────────────────────────────────────
  let pointerState = 'none'
  let clickedCanvas = false

  // ── UI ───────────────────────────────────────────────────────────────────────
  let rampsCollapsed = $state(false)
  const isOpen = $derived(globalState.ui.colorPickerOpen)

  // ── External swatch target (set by events.js via picker.swatch = ...) ────────
  let _swatch = null

  // ─────────────────────────────────────────────────────────────────────────────
  // Color-space propagation
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Derives all non-RGB representations from the current `rgb` object and
   * flushes every value to the display. Call this whenever RGB is the
   * authoritative source — e.g. after RGBA inputs change or a ramp swatch
   * is clicked.
   */
  function propagateRGBColorSpace() {
    hsl = RGBToHSL(rgb)
    hexcode = RGBToHex(rgb)
    luminance = getLuminance(rgb)
    updateColor()
  }

  /**
   * Derives all non-HSL representations from the current `hsl` object and
   * flushes every value to the display. Called whenever HSL is authoritative
   * — e.g. after the hue slider moves or the canvas gradient is dragged.
   */
  function propagateHSLColorSpace() {
    rgb = HSLToRGB(hsl)
    hexcode = RGBToHex(rgb)
    luminance = getLuminance(rgb)
    updateColor()
  }

  /**
   * Parses `hexcode` back into RGB and HSL, recomputes luminance, then
   * flushes display state. Hex cannot be derived from the other two spaces
   * without a round-trip parse, so it has its own propagation path.
   */
  function propagateHexColorSpace() {
    rgb = hexToRGB(hexcode)
    hsl = RGBToHSL(rgb)
    luminance = getLuminance(rgb)
    updateColor()
  }

  /**
   * Commits the four $state display variables (rVal, gVal, bVal, aVal) into
   * the core `rgb` and `alpha` plain vars before propagating. The indirection
   * is necessary because number inputs bind to the $state vars, not to the
   * plain vars that the propagation chain reads.
   */
  function updateRGBA() {
    rgb = { red: rVal, green: gVal, blue: bVal }
    alpha = aVal
    propagateRGBColorSpace()
  }

  /**
   * Commits the three HSL $state display variables into the core `hsl`
   * object before propagating. Same two-tier pattern as updateRGBA: $state
   * vars are bound to inputs; core vars drive all canvas and ramp logic.
   */
  function updateHSL() {
    hsl = { hue: hVal, saturation: sVal, lightness: lVal }
    propagateHSLColorSpace()
  }

  /**
   * Commits the hex $state display variable into the core `hexcode` string
   * before propagating. The hex input binds to hexVal, not hexcode, so the
   * copy is required before the propagation chain can read the new value.
   */
  function updateHex() {
    hexcode = hexVal
    propagateHexColorSpace()
  }

  /**
   * Responds to hue-slider input events by writing hsl.hue directly from
   * the event value and repropagating through HSL space. The hue slider
   * drives HSL rather than RGB because the canvas gradient is rendered in
   * HSL space, making hue a first-class independent axis.
   * @param {Event} e - Input event from the hue range slider.
   */
  function updateHue(e) {
    hsl.hue = +e.target.value
    propagateHSLColorSpace()
  }

  /**
   * Responds to alpha-slider input events. Alpha is stored separately from
   * rgb and hsl and is not recalculated by any propagate* function, so it
   * must be synced to both the core var and the two display vars before
   * calling updateColor directly — full propagation is unnecessary here.
   * @param {Event} e - Input event from the alpha range slider.
   */
  function updateAlpha(e) {
    alpha = +e.target.value
    aVal = alpha
    alphaSliderVal = alpha
    updateColor()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Canvas draw + display sync
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Central display-sync function: redraws the HSL gradient canvas and
   * selector, updates the CSS custom properties that drive the new-color
   * swatch, and writes every $state display variable. All propagate*
   * functions terminate here. The ctx guard prevents calls that arrive
   * before onMount has initialized the canvas context.
   */
  function updateColor() {
    if (!ctx) return
    drawHSLGradient(ctx, WIDTH, HEIGHT, hsl.hue)
    pickerCircle = calcHSLSelectorCoordinates(pickerCircle, hsl, WIDTH, HEIGHT)
    drawSelector(ctx, pickerCircle)

    const { hue, saturation, lightness } = hsl
    const { red, green, blue } = rgb
    // CSS vars drive the new-color swatch via the template; writing them
    // here ensures every color-change path (RGB, HSL, hex) keeps the swatch
    // in sync without duplicating the style write in each propagate* call.
    document.documentElement.style.setProperty(
      '--new-swatch-color',
      `${red},${green},${blue}`,
    )
    document.documentElement.style.setProperty(
      '--new-swatch-alpha',
      `${alpha / 255}`,
    )

    rVal = red
    gVal = green
    bVal = blue
    aVal = alpha
    hVal = hue
    sVal = saturation
    lVal = lightness
    hexVal = hexcode
    lumiVal = String(luminance)
    hueSliderVal = hue
    alphaSliderVal = alpha
    renderColorRamps()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Color ramps
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Recomputes the shadow/highlight ramp from the current HSL+alpha and,
   * when a custom key is being live-edited, bakes the current RGB+alpha into
   * that key slot before regenerating the interpolated custom ramp. The key
   * update must precede interpolation so the ramp immediately reflects the
   * in-progress edit rather than the previously committed key value.
   */
  function renderColorRamps() {
    shadowColors = calcShadowHighlightRamp(hsl, alpha)

    if (editingCustomKey) {
      // Bake the live picker color into the active key before interpolating
      // so the custom ramp tracks the picker in real time during live-edit.
      customRampKeys[editingCustomKey] = {
        r: rgb.red,
        g: rgb.green,
        b: rgb.blue,
        a: alpha,
      }
    }
    const { start, mid, end } = customRampKeys
    if (start && mid && end) {
      customColors = interpolateCustomRamp(start, mid, end)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Ramp swatch click handlers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Loads a shadow/highlight ramp color into the picker by overwriting rgb
   * and alpha and repropagating through RGB space. No ramp-key state changes
   * are needed because shadow swatches are not part of the custom ramp cycle.
   * @param {{ r: number, g: number, b: number, a: number }} color - RGBA color.
   */
  function handleShadowSwatchClick(color) {
    rgb = { red: color.r, green: color.g, blue: color.b }
    alpha = color.a
    propagateRGBColorSpace()
  }

  /**
   * Implements a three-state click cycle for custom ramp key swatches: first
   * click selects (highlights) the key, second click activates live editing
   * so the ramp tracks the picker color in real time, third click deactivates
   * it. Non-key swatches (key === null) bypass the cycle and simply load the
   * color. The early return on the second click prevents the picker from
   * jumping to the key's stored color when live-edit mode is being entered.
   * @param {{ r: number, g: number, b: number, a: number }} color - RGBA color.
   * @param {string | null} key - 'start' | 'mid' | 'end' | null
   */
  function handleCustomSwatchClick(color, key) {
    if (key) {
      if (editingCustomKey === key) {
        // 3rd click: deactivate
        editingCustomKey = null
        selectedCustomKey = null
      } else if (selectedCustomKey === key) {
        // 2nd click: activate live editing, don't change picker color
        editingCustomKey = key
        renderColorRamps()
        return
      } else {
        // 1st click: select
        selectedCustomKey = key
        editingCustomKey = null
      }
      renderColorRamps()
    }
    rgb = { red: color.r, green: color.g, blue: color.b }
    alpha = color.a
    propagateRGBColorSpace()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Canvas pointer interaction
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Begins drag selection on the HSL canvas. Pointer capture is set so that
   * move and up events are routed to this element even when the pointer
   * leaves the canvas bounds, preventing drag selection from stalling
   * mid-gesture.
   * @param {PointerEvent} e - Pointer event from the canvas element.
   */
  function handleCanvasPointerDown(e) {
    // Capture keeps move/up events on this target after the pointer leaves
    // the canvas so drag selection continues when the cursor exits the edge.
    e.target.setPointerCapture(e.pointerId)
    clickedCanvas = true
    selectSL(e.offsetX, e.offsetY)
  }

  /**
   * Continues drag selection while the pointer button is held. Uses
   * pageX/pageY plus bounding-rect math rather than offsetX/offsetY because
   * pointer capture routes events with coordinates relative to the capturing
   * element even when the pointer is outside it — offsetX/offsetY become
   * unreliable in that situation. Clamps coordinates to canvas bounds so
   * dragging outside does not produce out-of-range S/L values.
   * @param {PointerEvent} e - Pointer event from the canvas element.
   */
  function handleCanvasPointerMove(e) {
    if (!clickedCanvas) return
    // offsetX/offsetY are unreliable under pointer capture when the cursor
    // has left the element; pageX/pageY + bounding rect give stable coords.
    const rect = canvasRef.getBoundingClientRect()
    const docRect = document.documentElement.getBoundingClientRect()
    const x = e.pageX - (rect.left - docRect.left)
    const y = e.pageY - (rect.top - docRect.top)
    selectSL(
      Math.min(Math.max(x, 0), WIDTH),
      Math.min(Math.max(y, 0), HEIGHT),
    )
  }

  /**
   * Ends drag selection by clearing the clickedCanvas flag. The pointerup
   * event arrives reliably here because pointer capture set in
   * handleCanvasPointerDown keeps all pointer events on this target.
   */
  function handleCanvasPointerUp() {
    clickedCanvas = false
  }

  /**
   * Maps raw pixel coordinates from the HSL canvas to saturation (x-axis)
   * and lightness (y-axis), then repropagates through HSL space. Rounding
   * to the nearest integer keeps all channel display values as whole numbers.
   * @param {number} x - Pixel x within [0, WIDTH].
   * @param {number} y - Pixel y within [0, HEIGHT].
   */
  function selectSL(x, y) {
    hsl.saturation = Math.round((x / WIDTH) * 100)
    hsl.lightness = Math.round((y / HEIGHT) * 100)
    propagateHSLColorSpace()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Channel spin buttons (with auto-repeat while held)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Returns the next integer step in `direction` for `value`, clamped to
   * [0, max]. Flooring before stepping prevents a fractional value typed
   * into a channel input from expanding by a fraction rather than a whole
   * unit on the first spin press.
   * @param {number} value - Current channel value (may be fractional).
   * @param {number} max - Upper bound (inclusive).
   * @param {'inc' | 'dec'} direction - Which direction to step.
   * @returns {number} Next stepped value, clamped within range.
   */
  function clampedStep(value, max, direction) {
    const v = Math.floor(value)
    if (direction === 'inc') return v < max ? v + 1 : v
    return v > 0 ? v - 1 : v
  }

  /**
   * Starts an auto-repeating increment/decrement tick for an RGB or alpha
   * channel when a spin button is held. The inner tick function reschedules
   * itself at 150 ms intervals and exits when pointerState is no longer
   * 'pointerdown'. A single shared pointerState string ensures only one spin
   * loop is active at a time — starting a new spin implicitly cancels the
   * previous one.
   * @param {'r' | 'g' | 'b' | 'a'} channel - Channel to spin.
   * @param {'inc' | 'dec'} direction - Direction of the spin.
   */
  function handleRGBSpinDown(channel, direction) {
    pointerState = 'pointerdown'
    function tick() {
      if (pointerState !== 'pointerdown') return
      if (channel === 'r') rVal = clampedStep(rVal, 255, direction)
      else if (channel === 'g') gVal = clampedStep(gVal, 255, direction)
      else if (channel === 'b') bVal = clampedStep(bVal, 255, direction)
      else if (channel === 'a') aVal = clampedStep(aVal, 255, direction)
      updateRGBA()
      setTimeout(tick, 150)
    }
    tick()
  }

  /**
   * Starts an auto-repeating increment/decrement tick for an HSL channel.
   * Shares the same pointerState sentinel and 150 ms cadence as
   * handleRGBSpinDown. The channel-to-max map is defined locally so callers
   * cannot accidentally spin an HSL channel past its valid range.
   * @param {'h' | 's' | 'l'} channel - Channel to spin.
   * @param {'inc' | 'dec'} direction - Direction of the spin.
   */
  function handleHSLSpinDown(channel, direction) {
    pointerState = 'pointerdown'
    const maxVals = { h: 359, s: 100, l: 100 }
    function tick() {
      if (pointerState !== 'pointerdown') return
      const max = maxVals[channel]
      if (channel === 'h') hVal = clampedStep(hVal, max, direction)
      else if (channel === 's') sVal = clampedStep(sVal, max, direction)
      else if (channel === 'l') lVal = clampedStep(lVal, max, direction)
      updateHSL()
      setTimeout(tick, 150)
    }
    tick()
  }

  /**
   * Breaks any active auto-repeat loop by setting pointerState to
   * 'pointerup'. Both onpointerup and onpointerout bind to this so that
   * releasing the pointer or moving outside a spin button both terminate
   * the loop, preventing runaway increments when the cursor drifts off.
   */
  function stopSpin() {
    pointerState = 'pointerup'
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Restore initial color (old-color button)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Reverts the picker to the color captured when `update` was last called.
   * The null guard prevents a crash during the brief window between component
   * mount and the first `update` call when initialColor is not yet set.
   */
  function restoreInitialColor() {
    if (!initialColor) return
    rgb = { red: initialColor.r, green: initialColor.g, blue: initialColor.b }
    alpha = initialColor.a
    propagateRGBColorSpace()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // External API (registered with events.js)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Loads a reference color into the picker and stores it as the initial
   * color so restoreInitialColor can revert to it. Custom ramp keys are
   * seeded from this color only when all three are null (the very first
   * open), preserving any ramp the user has already built. The
   * --old-swatch-color and --old-swatch-alpha CSS vars are written here
   * rather than in updateColor because they must reflect the reference
   * color, not the live picker color.
   * @param {{ r: number, g: number, b: number, a: number }} reference - Color.
   */
  function update(reference) {
    initialColor = reference
    rgb = { red: reference.r, green: reference.g, blue: reference.b }
    alpha = reference.a
    if (customRampKeys.start === null) {
      // Seed all three keys from the reference color only on first open so
      // a previously built custom ramp is not reset on subsequent opens.
      const c = makeColor(reference.r, reference.g, reference.b, reference.a)
      customRampKeys = { start: c, mid: { ...c }, end: { ...c } }
    }
    propagateRGBColorSpace()
    document.documentElement.style.setProperty(
      '--old-swatch-color',
      `${reference.r},${reference.g},${reference.b}`,
    )
    document.documentElement.style.setProperty(
      '--old-swatch-alpha',
      `${reference.a / 255}`,
    )
  }

  onMount(() => {
    if (!canvasRef) return
    // willReadFrequently avoids GPU/CPU round-trips; the gradient is redrawn
    // on every color change so a CPU-backed context is appropriate here.
    ctx = canvasRef.getContext('2d', { willReadFrequently: true })

    // Register a live-getter object so events.js always reads current state
    // rather than holding a stale snapshot of picker values at mount time.
    registerPicker({
      get rgb() {
        return rgb
      },
      get alpha() {
        return alpha
      },
      get swatch() {
        return _swatch
      },
      set swatch(v) {
        _swatch = v
      },
      get selectedCustomKey() {
        return selectedCustomKey
      },
      set selectedCustomKey(v) {
        selectedCustomKey = v
      },
      get editingCustomKey() {
        return editingCustomKey
      },
      set editingCustomKey(v) {
        editingCustomKey = v
      },
      update,
    })

    update(swatches.primary.color)
  })
</script>

<!-- display:none/flex rather than {#if isOpen} keeps the canvas context and all
     channel inputs alive across open/close cycles so state is preserved. -->
<DialogBox
  title="Color Picker"
  class="picker-container v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
  onclose={closePickerWindow}
>
  <div id="color-ramps-section">
    <div class="ramps-header">
      Color Ramps
      <label class="collapse-btn">
        <input
          type="checkbox"
          class="collapse-checkbox"
          checked={rampsCollapsed}
          onchange={(e) => {
            rampsCollapsed = e.target.checked
          }}
        />
        <span class="arrow"></span>
      </label>
    </div>
    <div
      id="color-ramps-collapsible"
      style="display: {rampsCollapsed ? 'none' : 'flex'}"
    >
      <div class="color-group" data-group="shadow">
        <div class="ramp-label">Shadow / Highlight</div>
        <div class="ramp-row">
          <div class="ramp-swatches">
            {#each shadowColors as color, i}
              <button
                type="button"
                class="swatch ramp-swatch{i === 3 ? ' ramp-base' : ''}"
                style="background-color: rgba({color.r},{color.g},{color.b},{color.a /
                  255})"
                aria-label="Select color rgb({color.r},{color.g},{color.b})"
                onclick={() => handleShadowSwatchClick(color)}
              ></button>
            {/each}
          </div>
        </div>
      </div>
      <div class="color-group" data-group="custom">
        <div class="ramp-label">Custom Ramp</div>
        <div class="ramp-row">
          <div class="ramp-swatches">
            {#each customColors as color, i}
              {@const keyMap = { 0: 'start', 3: 'mid', 6: 'end' }}
              {@const key = keyMap[i] ?? null}
              <button
                type="button"
                class="swatch ramp-swatch{key
                  ? ' ramp-key'
                  : ''}{key === selectedCustomKey
                  ? ' selected'
                  : ''}{key === editingCustomKey ? ' active' : ''}"
                style="background-color: rgba({color.r},{color.g},{color.b},{color.a /
                  255})"
                aria-label="Select color rgb({color.r},{color.g},{color.b})"
                data-key={key}
                onclick={() => handleCustomSwatchClick(color, key)}
              ></button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="picker-interface">
    <div id="left">
      <div id="picker">
        <canvas
          bind:this={canvasRef}
          id="color-picker"
          width={WIDTH}
          height={HEIGHT}
          onpointerdown={handleCanvasPointerDown}
          onpointermove={handleCanvasPointerMove}
          onpointerup={handleCanvasPointerUp}
        ></canvas>
        <div class="slider-container">
          <input
            type="range"
            id="hueslider"
            class="picker-slider"
            min="0"
            max="359"
            value={hueSliderVal}
            oninput={updateHue}
            style="background: linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
          />
          <input
            type="range"
            id="alphaslider"
            class="picker-slider"
            min="0"
            max="255"
            value={alphaSliderVal}
            oninput={updateAlpha}
          />
        </div>
      </div>
      <div id="buttons">
        <button type="button" class="btn" id="confirm-btn" onclick={confirmColor}
          >OK</button
        >
        <button
          type="button"
          class="btn"
          id="cancel-btn"
          onclick={closePickerWindow}>Cancel</button
        >
      </div>
    </div>
    <div id="right">
      <div id="colors">
        <div class="color">
          <h5>New</h5>
          <button
            type="button"
            class="swatch"
            id="newcolor-btn"
            aria-label="New color – click to add to palette"
            onclick={addToPalette}
          >
            <div class="swatch-color" id="newcolor"></div>
            <div id="newcolor-plus"></div>
          </button>
        </div>
        <div class="color">
          <h5>Old</h5>
          <button
            type="button"
            class="swatch"
            id="oldcolor-btn"
            aria-label="Old color"
            onpointerdown={restoreInitialColor}
          >
            <div class="swatch-color" id="oldcolor"></div>
          </button>
        </div>
      </div>
      <div id="rgbahsl">
        <div class="channel-container" id="rgba-container">
          <label
            >R <input
              type="number"
              id="r"
              min="0"
              max="255"
              bind:value={rVal}
              onchange={updateRGBA}
            />
            <div class="spin-btn">
              <button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleRGBSpinDown('r', 'inc')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">+</span></button
              ><button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleRGBSpinDown('r', 'dec')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
          <label
            >G <input
              type="number"
              id="g"
              min="0"
              max="255"
              bind:value={gVal}
              onchange={updateRGBA}
            />
            <div class="spin-btn">
              <button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleRGBSpinDown('g', 'inc')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">+</span></button
              ><button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleRGBSpinDown('g', 'dec')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
          <label
            >B <input
              type="number"
              id="b"
              min="0"
              max="255"
              bind:value={bVal}
              onchange={updateRGBA}
            />
            <div class="spin-btn">
              <button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleRGBSpinDown('b', 'inc')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">+</span></button
              ><button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleRGBSpinDown('b', 'dec')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
          <label
            >A <input
              type="number"
              id="a"
              min="0"
              max="255"
              bind:value={aVal}
              onchange={updateRGBA}
            />
            <div class="spin-btn">
              <button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleRGBSpinDown('a', 'inc')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">+</span></button
              ><button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleRGBSpinDown('a', 'dec')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
        </div>
        <div class="channel-container" id="hsl-container">
          <label
            >H <input
              type="number"
              id="h"
              min="0"
              max="359"
              bind:value={hVal}
              onchange={updateHSL}
            />
            <div class="spin-btn">
              <button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleHSLSpinDown('h', 'inc')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">+</span></button
              ><button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleHSLSpinDown('h', 'dec')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
          <label
            >S <input
              type="number"
              id="s"
              min="0"
              max="100"
              bind:value={sVal}
              onchange={updateHSL}
            />
            <div class="spin-btn">
              <button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleHSLSpinDown('s', 'inc')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">+</span></button
              ><button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleHSLSpinDown('s', 'dec')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
          <label
            >L <input
              type="number"
              id="l"
              min="0"
              max="100"
              bind:value={lVal}
              onchange={updateHSL}
            />
            <div class="spin-btn">
              <button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleHSLSpinDown('l', 'inc')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">+</span></button
              ><button
                type="button"
                class="channel-btn"
                onpointerdown={() => handleHSLSpinDown('l', 'dec')}
                onpointerup={stopSpin}
                onpointerout={stopSpin}
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
        </div>
      </div>
      <div id="hex">
        <label
          >Hex <input
            type="text"
            id="hexcode"
            bind:value={hexVal}
            onchange={updateHex}
          /></label
        >
      </div>
      <div id="lumi">
        <label>Lumi <input type="text" id="luminance" readonly value={lumiVal} /></label>
      </div>
    </div>
  </div>
</DialogBox>
