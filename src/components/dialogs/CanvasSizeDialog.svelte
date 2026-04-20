<script>
  import { onMount } from 'svelte'
  import { globalState } from '../../Context/state.js'
  import { canvas } from '../../Context/canvas.js'
  import {
    resizeOverlay,
    applyFromInputs,
    applyResize,
    setAnchor,
    deactivateResizeOverlay,
  } from '../../Canvas/resizeOverlay.js'
  import { resizeOffScreenCanvas } from '../../Canvas/render.js'
  import { dom } from '../../Context/dom.js'
  import DialogBox from '../DialogBox.svelte'
  import SpinInput from '../shared/SpinInput.svelte'

  const MINIMUM_DIMENSION = 8
  const MAXIMUM_DIMENSION = 1024

  const ANCHORS = [
    'top-left',
    'top',
    'top-right',
    'left',
    'center',
    'right',
    'bottom-left',
    'bottom',
    'bottom-right',
  ]

  let widthInputRef = $state(null)
  let heightInputRef = $state(null)
  let anchorGridRef = $state(null)
  let activeAnchor = $state('top-left')
  let width = $state(canvas.offScreenCVS.width)
  let height = $state(canvas.offScreenCVS.height)
  let widthFocused = false
  let heightFocused = false

  const isOpen = $derived(globalState.ui.canvasSizeOpen)

  // Track when dialog opens to reset dimensions
  let prevOpen = false
  $effect(() => {
    const open = isOpen
    if (open && !prevOpen) {
      width = canvas.offScreenCVS.width
      height = canvas.offScreenCVS.height
      activeAnchor = 'top-left'
    }
    prevOpen = open
  })

  // Sync from resize overlay drag handles
  $effect(() => {
    if (!globalState.canvas.resizeOverlayActive) return
    if (!widthFocused) width = resizeOverlay.newWidth
    if (!heightFocused) height = resizeOverlay.newHeight
  })

  onMount(() => {
    dom.canvasWidth = widthInputRef
    dom.canvasHeight = heightInputRef
    dom.anchorGrid = anchorGridRef
  })

  function handleWidthChange(e) {
    width = e.target.value
    if (globalState.canvas.resizeOverlayActive) applyFromInputs(+width, +height)
  }

  function handleHeightChange(e) {
    height = e.target.value
    if (globalState.canvas.resizeOverlayActive) applyFromInputs(+width, +height)
  }

  function handleWidthBlur(e) {
    let val = +e.target.value
    if (val > MAXIMUM_DIMENSION) val = MAXIMUM_DIMENSION
    else if (val < MINIMUM_DIMENSION) val = MINIMUM_DIMENSION
    width = val
    widthFocused = false
  }

  function handleHeightBlur(e) {
    let val = +e.target.value
    if (val > MAXIMUM_DIMENSION) val = MAXIMUM_DIMENSION
    else if (val < MINIMUM_DIMENSION) val = MINIMUM_DIMENSION
    height = val
    heightFocused = false
  }

  function handleAnchorClick(anchor) {
    activeAnchor = anchor
    setAnchor(anchor)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (globalState.canvas.resizeOverlayActive) {
      applyResize()
    } else {
      resizeOffScreenCanvas(+width, +height)
    }
    globalState.ui.canvasSizeOpen = false
  }

  function handleCancel() {
    deactivateResizeOverlay()
    globalState.ui.canvasSizeOpen = false
  }

  function handleClose() {
    deactivateResizeOverlay()
    globalState.ui.canvasSizeOpen = false
  }
</script>

<DialogBox
  title="Canvas Size"
  class="size-container draggable v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
  onclose={handleClose}
>
    <form class="dimensions-form" onsubmit={handleSubmit}>
      <div class="inputs">
        <label for="canvas-width">
          Width:
          <span class="input">
            <input
              bind:this={widthInputRef}
              type="number"
              id="canvas-width"
              min="8"
              max="1024"
              value={width}
              oninput={handleWidthChange}
              onfocus={() => {
                widthFocused = true
              }}
              onblur={handleWidthBlur}
            />
            <SpinInput
              bind:value={width}
              min={MINIMUM_DIMENSION}
              max={MAXIMUM_DIMENSION}
              onspin={(val) => {
                if (globalState.canvas.resizeOverlayActive) applyFromInputs(val, +height)
              }}
            />
          </span>
        </label>
        <label for="canvas-height">
          Height:
          <span class="input">
            <input
              bind:this={heightInputRef}
              type="number"
              id="canvas-height"
              min="8"
              max="1024"
              value={height}
              oninput={handleHeightChange}
              onfocus={() => {
                heightFocused = true
              }}
              onblur={handleHeightBlur}
            />
            <SpinInput
              bind:value={height}
              min={MINIMUM_DIMENSION}
              max={MAXIMUM_DIMENSION}
              onspin={(val) => {
                if (globalState.canvas.resizeOverlayActive) applyFromInputs(+width, val)
              }}
            />
          </span>
        </label>
      </div>
      <div class="anchor-section">
        <span class="anchor-label">Anchor:</span>
        <div bind:this={anchorGridRef} class="anchor-grid" id="anchor-grid">
          {#each ANCHORS as anchor (anchor)}
            <button
              type="button"
              class="anchor-btn{activeAnchor === anchor ? ' active' : ''}"
              data-anchor={anchor}
              aria-label="Anchor {anchor}"
              onclick={() => handleAnchorClick(anchor)}
            ></button>
          {/each}
        </div>
      </div>
      <div class="buttons-container">
        <button
          type="submit"
          id="update-size"
          class="update-size"
          aria-label="Update Canvas Size"
        >
          Submit
        </button>
        <button
          type="button"
          id="cancel-resize-button"
          class="update-size"
          aria-label="Close canvas resize dialog box"
          onclick={handleCancel}
        >
          Cancel
        </button>
      </div>
    </form>
</DialogBox>
