<script>
  /**
   * @component
   * Dialog for resizing the canvas. Supports manual numeric input and
   * an interactive drag-handle overlay. An anchor grid lets the user
   * choose which corner or edge of the canvas stays fixed during the
   * resize. The component registers its DOM refs into the shared `dom`
   * context so the overlay module can reference them imperatively.
   */
  import { onMount } from 'svelte'
  import { globalState } from '../../../context/state.js'
  import { canvas } from '../../../context/canvas.js'
  import {
    resizeOverlay,
    applyFromInputs,
    applyResize,
    setAnchor,
    deactivateResizeOverlay,
  } from '../../../canvas/resizeOverlay.js'
  import { resizeOffScreenCanvas } from '../../../canvas/render.js'
  import { dom } from '../../../context/dom.js'
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
  let width = $state(canvas.offScreenCVS?.width ?? 0)
  let height = $state(canvas.offScreenCVS?.height ?? 0)
  let widthFocused = false
  let heightFocused = false

  const isOpen = $derived(globalState.ui.canvasSizeOpen)

  // Reset to the actual canvas dimensions on each open rather than
  // persisting stale values from a previous session. The leading-edge
  // guard (open && !prevOpen) prevents the reset from firing on close,
  // so values aren't cleared while the dialog is animating out.
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

  // Keep the numeric inputs in sync with drag-handle changes when the
  // overlay is active. The focused guards are essential: without them,
  // a reactive write would overwrite a value the user is actively
  // editing, causing cursor-jump and confusing UX.
  $effect(() => {
    if (!globalState.canvas.resizeOverlayActive) return
    if (!widthFocused) width = resizeOverlay.newWidth
    if (!heightFocused) height = resizeOverlay.newHeight
  })

  /**
   * Registers the canvas dimension inputs and anchor grid in the shared
   * `dom` context so the resize-overlay module can reference them
   * imperatively. This wiring is deferred to `onMount` because the
   * refs are null during component initialization before the DOM
   * elements exist.
   */
  onMount(() => {
    dom.canvasWidth = widthInputRef
    dom.canvasHeight = heightInputRef
    dom.anchorGrid = anchorGridRef
  })

  /**
   * Handles live width input, updating local state and pushing the new
   * dimensions to the resize overlay when it is active. The overlay is
   * only notified while active because sending updates before the
   * overlay exists would be a no-op at best and an error at worst.
   * @param {Event} e - The native input event from the width field.
   */
  function handleWidthChange(e) {
    width = e.target.value
    // Input values are strings; applyFromInputs requires numbers.
    if (globalState.canvas.resizeOverlayActive) applyFromInputs(+width, +height)
  }

  /**
   * Handles live height input, mirroring `handleWidthChange`. See that
   * function for the rationale behind the overlay-active guard and the
   * numeric coercion.
   * @param {Event} e - The native input event from the height field.
   */
  function handleHeightChange(e) {
    height = e.target.value
    if (globalState.canvas.resizeOverlayActive) applyFromInputs(+width, +height)
  }

  /**
   * Clamps the width field to the valid range when the user leaves the
   * input. Clamping on blur rather than on every keystroke lets the
   * user type intermediate out-of-range values (e.g. clearing the
   * field before entering a new number) without interference. Clearing
   * `widthFocused` re-enables overlay-to-input sync suppressed during
   * active editing.
   * @param {FocusEvent} e - The blur event from the width input.
   */
  function handleWidthBlur(e) {
    let val = +e.target.value
    if (val > MAXIMUM_DIMENSION) val = MAXIMUM_DIMENSION
    else if (val < MINIMUM_DIMENSION) val = MINIMUM_DIMENSION
    width = val
    widthFocused = false
  }

  /**
   * Clamps the height field to the valid range on blur. Mirrors
   * `handleWidthBlur` — see that function for the full rationale.
   * @param {FocusEvent} e - The blur event from the height input.
   */
  function handleHeightBlur(e) {
    let val = +e.target.value
    if (val > MAXIMUM_DIMENSION) val = MAXIMUM_DIMENSION
    else if (val < MINIMUM_DIMENSION) val = MINIMUM_DIMENSION
    height = val
    heightFocused = false
  }

  /**
   * Sets the resize anchor point and keeps local UI state in sync with
   * the overlay module. The anchor determines which corner or edge of
   * the canvas remains fixed as dimensions change, so both the visual
   * grid highlight and the overlay's internal origin calculation must
   * agree.
   * @param {string} anchor - One of the nine ANCHORS position strings.
   */
  function handleAnchorClick(anchor) {
    activeAnchor = anchor
    // Propagate immediately so the overlay recalculates its origin
    // before the next drag or submit, not just on form submit.
    setAnchor(anchor)
  }

  /**
   * Commits the canvas resize on form submission via one of two paths.
   * When the interactive overlay is active its already-computed
   * geometry is applied via `applyResize`, which may reflect drag-
   * handle positions that differ from the numeric inputs (e.g. the
   * user dragged a handle and then typed a correction). When the
   * overlay is inactive the raw numeric inputs are used directly. The
   * dialog closes unconditionally after either path.
   * @param {SubmitEvent} e - The form submit event.
   */
  function handleSubmit(e) {
    e.preventDefault()
    if (globalState.canvas.resizeOverlayActive) {
      // The overlay tracks its own geometry; commit that state rather
      // than recomputing from inputs, which may lag behind drag moves.
      applyResize()
    } else {
      resizeOffScreenCanvas(+width, +height)
    }
    globalState.ui.canvasSizeOpen = false
  }

  /**
   * Cancels the resize and closes the dialog without applying any
   * changes. The overlay must be explicitly deactivated here because
   * simply hiding the dialog leaves its DOM handles on the canvas,
   * which would interfere with subsequent canvas interactions.
   */
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
              if (globalState.canvas.resizeOverlayActive)
                applyFromInputs(val, +height)
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
              if (globalState.canvas.resizeOverlayActive)
                applyFromInputs(+width, val)
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
        onclick={handleClose}
      >
        Cancel
      </button>
    </div>
  </form>
</DialogBox>
