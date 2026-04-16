<script>
  import { onMount } from 'svelte'
  import { getVersion, bump } from '../../hooks/appState.svelte.js'
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
  import { initializeDragger } from '../../utils/drag.js'

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

  let ref = $state(null)
  let activeAnchor = $state('top-left')
  let width = $state(canvas.offScreenCVS.width)
  let height = $state(canvas.offScreenCVS.height)
  let widthFocused = false
  let heightFocused = false

  const isOpen = $derived(getVersion() >= 0 && globalState.ui.canvasSizeOpen)

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

  // Sync from resize overlay drag handles on bump()
  $effect(() => {
    getVersion()
    if (!globalState.canvas.resizeOverlayActive) return
    if (!widthFocused) width = resizeOverlay.newWidth
    if (!heightFocused) height = resizeOverlay.newHeight
  })

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
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

  function handleWidthSpin(e) {
    const id = e.target.id || e.target.closest('[id]')?.id
    let val = Math.floor(+width)
    if (id === 'inc' && val < MAXIMUM_DIMENSION) val++
    else if (id === 'dec' && val > MINIMUM_DIMENSION) val--
    width = val
    if (globalState.canvas.resizeOverlayActive) applyFromInputs(val, +height)
  }

  function handleHeightSpin(e) {
    const id = e.target.id || e.target.closest('[id]')?.id
    let val = Math.floor(+height)
    if (id === 'inc' && val < MAXIMUM_DIMENSION) val++
    else if (id === 'dec' && val > MINIMUM_DIMENSION) val--
    height = val
    if (globalState.canvas.resizeOverlayActive) applyFromInputs(+width, val)
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
    bump()
  }

  function handleCancel() {
    deactivateResizeOverlay()
    globalState.ui.canvasSizeOpen = false
    bump()
  }

  function handleClose() {
    deactivateResizeOverlay()
    globalState.ui.canvasSizeOpen = false
    bump()
  }
</script>

<div
  bind:this={ref}
  class="size-container dialog-box draggable v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
>
  <div id="size-header" class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    Canvas Size
    <button
      type="button"
      class="close-btn"
      aria-label="Close"
      data-tooltip="Close"
      onclick={handleClose}
    ></button>
  </div>
  <div class="collapsible">
    <form class="dimensions-form" onsubmit={handleSubmit}>
      <div class="inputs">
        <label for="canvas-width">
          Width:
          <span class="input">
            <input
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
            <span class="spin-btn" role="group" onpointerdown={handleWidthSpin}>
              <span id="inc" class="channel-btn"
                ><span class="spin-content">+</span></span
              >
              <span id="dec" class="channel-btn"
                ><span class="spin-content">-</span></span
              >
            </span>
          </span>
        </label>
        <label for="canvas-height">
          Height:
          <span class="input">
            <input
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
            <span
              class="spin-btn"
              role="group"
              onpointerdown={handleHeightSpin}
            >
              <span id="inc" class="channel-btn"
                ><span class="spin-content">+</span></span
              >
              <span id="dec" class="channel-btn"
                ><span class="spin-content">-</span></span
              >
            </span>
          </span>
        </label>
      </div>
      <div class="anchor-section">
        <span class="anchor-label">Anchor:</span>
        <div class="anchor-grid" id="anchor-grid">
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
  </div>
</div>
