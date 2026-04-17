<script>
  import { onMount } from 'svelte'
  import { globalState } from '../../Context/state.js'
  import { swatches } from '../../Context/swatch.js'
  import { Picker } from '../../Swatch/Picker.js'
  import {
    registerPicker,
    confirmColor,
    closePickerWindow,
    addToPalette,
  } from '../../Swatch/events.js'
  import { initializeDragger } from '../../utils/drag.js'

  let ref = $state(null)
  let canvasRef = $state(null)

  const isOpen = $derived(globalState.ui.colorPickerOpen)

  onMount(() => {
    if (!canvasRef) return
    const p = new Picker(canvasRef, 250, 250, swatches.primary.color)
    p.build()
    registerPicker(p)
  })

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)

    // Wire up color ramps collapse
    const ramsCheckbox = ref.querySelector('#ramps-collapse-btn')
    const ramsCollapsible = ref.querySelector('#color-ramps-collapsible')
    if (ramsCheckbox && ramsCollapsible) {
      ramsCheckbox.addEventListener('click', () => {
        ramsCollapsible.style.display = ramsCheckbox.checked ? 'none' : 'flex'
      })
    }

    return () => {
      delete ref?.dataset.dragInitialized
    }
  })
</script>

<div
  bind:this={ref}
  class="picker-container dialog-box v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
>
  <div class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    Color Picker
    <button
      type="button"
      class="close-btn"
      aria-label="Close"
      data-tooltip="Close"
      onclick={closePickerWindow}
    ></button>
  </div>
  <div class="collapsible">
    <div id="color-ramps-section">
      <div class="ramps-header">
        Color Ramps
        <label for="ramps-collapse-btn" class="collapse-btn">
          <input
            type="checkbox"
            class="collapse-checkbox"
            id="ramps-collapse-btn"
          />
          <span class="arrow"></span>
        </label>
      </div>
      <div id="color-ramps-collapsible">
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
          <canvas
            bind:this={canvasRef}
            id="color-picker"
            width="250"
            height="250"
          ></canvas>
          <div class="slider-container">
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
  </div>
</div>
