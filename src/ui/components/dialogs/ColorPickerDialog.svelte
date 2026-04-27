<script>
  /**
   * @component
   * Full-featured HSL/RGB/hex/alpha color picker dialog. Wraps an
   * imperative Picker class that owns a canvas gradient and all channel
   * inputs (R/G/B/A, H/S/L, hex, luminance). The Picker is constructed
   * once on mount and reused across open/close cycles; `display:none`
   * toggling rather than conditional rendering keeps the canvas context
   * and all wired inputs alive so the Picker never needs to be rebuilt.
   * Opened and closed externally via `events.js` through the registered
   * Picker instance.
   */
  import { onMount } from 'svelte'
  import { globalState } from '../../../context/state.js'
  import { swatches } from '../../../context/swatch.js'
  import { Picker } from '../../../swatch/Picker.js'
  import {
    registerPicker,
    confirmColor,
    closePickerWindow,
    addToPalette,
  } from '../../../swatch/events.js'
  import DialogBox from '../DialogBox.svelte'

  let canvasRef = $state(null)
  let rampsCollapsed = $state(false)

  const isOpen = $derived(globalState.ui.colorPickerOpen)

  /**
   * Instantiate and wire the Picker once the canvas is in the DOM. Picker's
   * constructor immediately queries channel inputs by ID (hueslider,
   * alphaslider, r/g/b/a, h/s/l, hexcode, etc.), so the canvas bind must
   * resolve before Picker is built. Seeding from swatches.primary.color
   * sets the correct "old color" reference for whichever swatch was active
   * at mount time. Registering via registerPicker lets events.js drive
   * open/close/confirm without coupling to Svelte internals.
   */
  onMount(() => {
    // Defensive: bind:this resolves before onMount in the browser, but
    // SSR or a failed binding would yield null here.
    if (canvasRef) {
      const p = new Picker(canvasRef, 250, 250, swatches.primary.color)
      p.build()
      registerPicker(p)
    }
  })
</script>

<!-- display:none/flex rather than {#if isOpen} keeps the Picker's DOM event
     listeners alive across open/close cycles. Conditional rendering would
     destroy the canvas and all wired channel inputs on close, requiring a
     full Picker rebuild on every open. -->
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
        <!-- Svelte's reactive style binding owns visibility here; Picker.js
             reads colorRampsCollapsible only to query child swatches, it
             does not toggle display itself. -->
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
          <div class="ramp-swatches"></div>
        </div>
      </div>
      <div class="color-group" data-group="custom">
        <div class="ramp-label">Custom Ramp</div>
        <div class="ramp-row">
          <div class="ramp-swatches"></div>
        </div>
      </div>
    </div>
  </div>
  <div class="picker-interface">
    <div id="left">
      <div id="picker">
        <!-- bind:this passes the element directly to the Picker constructor
             so it can acquire the 2D context. The id="color-picker" is not
             queried by Picker.js — it exists for CSS targeting only. -->
        <canvas bind:this={canvasRef} id="color-picker" width="250" height="250"
        ></canvas>
        <div class="slider-container">
          <!-- Picker.js fetches these elements by id in its constructor;
               renaming them breaks hue and alpha tracking. -->
          <input
            type="range"
            id="hueslider"
            class="picker-slider"
            min="0"
            max="359"
            value="0"
          />
          <input
            type="range"
            id="alphaslider"
            class="picker-slider"
            min="0"
            max="255"
            value="255"
          />
        </div>
      </div>
      <div id="buttons">
        <button
          type="button"
          class="btn"
          id="confirm-btn"
          onclick={confirmColor}>OK</button
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
          >
            <div class="swatch-color" id="oldcolor"></div>
          </button>
        </div>
      </div>
      <!-- All channel input ids (r, g, b, a, h, s, l, hexcode, luminance)
           and container ids (rgba-container, hsl-container) are fetched by
           Picker.js at construction time via getElementById. The HTML initial
           values are placeholder seeds; Picker.update() overwrites them on
           every open. -->
      <div id="rgbahsl">
        <div class="channel-container" id="rgba-container">
          <label
            >R <input type="number" id="r" min="0" max="255" value="0" />
            <div class="spin-btn">
              <button type="button" class="channel-btn" id="inc"
                ><span class="spin-content">+</span></button
              ><button type="button" class="channel-btn" id="dec"
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
          <label
            >G <input type="number" id="g" min="0" max="255" value="0" />
            <div class="spin-btn">
              <button type="button" class="channel-btn" id="inc"
                ><span class="spin-content">+</span></button
              ><button type="button" class="channel-btn" id="dec"
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
          <label
            >B <input type="number" id="b" min="0" max="255" value="0" />
            <div class="spin-btn">
              <button type="button" class="channel-btn" id="inc"
                ><span class="spin-content">+</span></button
              ><button type="button" class="channel-btn" id="dec"
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
          <label
            >A <input type="number" id="a" min="0" max="255" value="255" />
            <div class="spin-btn">
              <button type="button" class="channel-btn" id="inc"
                ><span class="spin-content">+</span></button
              ><button type="button" class="channel-btn" id="dec"
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
        </div>
        <div class="channel-container" id="hsl-container">
          <label
            >H <input type="number" id="h" min="0" max="359" value="0" />
            <div class="spin-btn">
              <button type="button" class="channel-btn" id="inc"
                ><span class="spin-content">+</span></button
              ><button type="button" class="channel-btn" id="dec"
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
          <label
            >S <input type="number" id="s" min="0" max="100" value="0" />
            <div class="spin-btn">
              <button type="button" class="channel-btn" id="inc"
                ><span class="spin-content">+</span></button
              ><button type="button" class="channel-btn" id="dec"
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
          <label
            >L <input type="number" id="l" min="0" max="100" value="0" />
            <div class="spin-btn">
              <button type="button" class="channel-btn" id="inc"
                ><span class="spin-content">+</span></button
              ><button type="button" class="channel-btn" id="dec"
                ><span class="spin-content">-</span></button
              >
            </div></label
          >
        </div>
      </div>
      <div id="hex">
        <label>Hex <input type="text" id="hexcode" value="000000" /></label>
      </div>
      <div id="lumi">
        <label
          >Lumi <input type="text" id="luminance" readonly value="0" /></label
        >
      </div>
    </div>
  </div>
</DialogBox>
