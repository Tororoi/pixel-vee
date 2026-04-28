<script>
  /**
   * @component
   * Full-featured HSL/RGB/hex/alpha color picker dialog. All picker logic
   * previously in Picker.js lives here as reactive Svelte state. Core color
   * values (rgb, hsl, alpha) are plain variables updated imperatively through
   * the propagate* functions; $state variables drive the channel input displays
   * and color ramp swatches. A picker interface object is registered with
   * events.js on mount so external callers can update and confirm colors without
   * coupling to Svelte internals.
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

  function propagateRGBColorSpace() {
    hsl = RGBToHSL(rgb)
    hexcode = RGBToHex(rgb)
    luminance = getLuminance(rgb)
    updateColor()
  }

  function propagateHSLColorSpace() {
    rgb = HSLToRGB(hsl)
    hexcode = RGBToHex(rgb)
    luminance = getLuminance(rgb)
    updateColor()
  }

  function propagateHexColorSpace() {
    rgb = hexToRGB(hexcode)
    hsl = RGBToHSL(rgb)
    luminance = getLuminance(rgb)
    updateColor()
  }

  function updateRGBA() {
    rgb = { red: rVal, green: gVal, blue: bVal }
    alpha = aVal
    propagateRGBColorSpace()
  }

  function updateHSL() {
    hsl = { hue: hVal, saturation: sVal, lightness: lVal }
    propagateHSLColorSpace()
  }

  function updateHex() {
    hexcode = hexVal
    propagateHexColorSpace()
  }

  function updateHue(e) {
    hsl.hue = +e.target.value
    propagateHSLColorSpace()
  }

  function updateAlpha(e) {
    alpha = +e.target.value
    aVal = alpha
    alphaSliderVal = alpha
    updateColor()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Canvas draw + display sync
  // ─────────────────────────────────────────────────────────────────────────────

  function updateColor() {
    if (!ctx) return
    drawHSLGradient(ctx, WIDTH, HEIGHT, hsl.hue)
    pickerCircle = calcHSLSelectorCoordinates(pickerCircle, hsl, WIDTH, HEIGHT)
    drawSelector(ctx, pickerCircle)

    const { hue, saturation, lightness } = hsl
    const { red, green, blue } = rgb
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

  function renderColorRamps() {
    shadowColors = calcShadowHighlightRamp(hsl, alpha)

    if (editingCustomKey) {
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

  function handleShadowSwatchClick(color) {
    rgb = { red: color.r, green: color.g, blue: color.b }
    alpha = color.a
    propagateRGBColorSpace()
  }

  // key is null for non-key custom swatches
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

  function handleCanvasPointerDown(e) {
    e.target.setPointerCapture(e.pointerId)
    clickedCanvas = true
    selectSL(e.offsetX, e.offsetY)
  }

  function handleCanvasPointerMove(e) {
    if (!clickedCanvas) return
    const rect = canvasRef.getBoundingClientRect()
    const docRect = document.documentElement.getBoundingClientRect()
    const x = e.pageX - (rect.left - docRect.left)
    const y = e.pageY - (rect.top - docRect.top)
    selectSL(
      Math.min(Math.max(x, 0), WIDTH),
      Math.min(Math.max(y, 0), HEIGHT),
    )
  }

  function handleCanvasPointerUp() {
    clickedCanvas = false
  }

  function selectSL(x, y) {
    hsl.saturation = Math.round((x / WIDTH) * 100)
    hsl.lightness = Math.round((y / HEIGHT) * 100)
    propagateHSLColorSpace()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Channel spin buttons (with auto-repeat while held)
  // ─────────────────────────────────────────────────────────────────────────────

  function clampedStep(value, max, direction) {
    const v = Math.floor(value)
    if (direction === 'inc') return v < max ? v + 1 : v
    return v > 0 ? v - 1 : v
  }

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

  function stopSpin() {
    pointerState = 'pointerup'
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Restore initial color (old-color button)
  // ─────────────────────────────────────────────────────────────────────────────

  function restoreInitialColor() {
    if (!initialColor) return
    rgb = { red: initialColor.r, green: initialColor.g, blue: initialColor.b }
    alpha = initialColor.a
    propagateRGBColorSpace()
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // External API (registered with events.js)
  // ─────────────────────────────────────────────────────────────────────────────

  function update(reference) {
    initialColor = reference
    rgb = { red: reference.r, green: reference.g, blue: reference.b }
    alpha = reference.a
    if (customRampKeys.start === null) {
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
    ctx = canvasRef.getContext('2d', { willReadFrequently: true })

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
