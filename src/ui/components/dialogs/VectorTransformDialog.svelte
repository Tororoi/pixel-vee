<script>
  /**
   * @component
   * Toolbar dialog for switching between vector transform modes:
   * Translate, Rotate, and Scale. The dialog's visibility is driven by
   * selection state rather than a dedicated open flag — it shows whenever
   * a vector is selected and closes by calling `actionDeselect`. Each
   * mode switch resets or initialises the boundary box differently
   * because translate and rotate operate on individual control points
   * while scale requires a pre-computed bounding box as its transform
   * origin.
   */
  import { globalState } from '../../../context/state.js'
  import {
    switchVectorTransformMode,
    setVectorShapeBoundaryBox,
  } from '../../../gui/transform.js'
  import { actionDeselect } from '../../../actions/nonPointer/selectionActions.js'
  import { TRANSLATE, ROTATE, SCALE } from '../../../utils/constants.js'
  import { TOOLTIPS } from '../../../utils/tooltips.js'
  import DialogBox from '../DialogBox.svelte'

  const isOpen = $derived(globalState.ui.vectorTransformOpen)
  const mode = $derived(globalState.vector.transformMode)

  /**
   * Closes the transform dialog by deselecting the active vector.
   * `actionDeselect` is the semantic close action here: the dialog's
   * visibility is a function of selection state, so deselecting is the
   * correct way to hide it rather than toggling an open flag directly.
   */
  function handleClose() {
    actionDeselect()
  }

  /**
   * Switches to Translate mode and clears selection properties and the
   * boundary box. Translate operates on individual control points, so
   * any stale boundary box from a previous Scale session would produce
   * incorrect transform origin calculations; resetting it first ensures
   * a clean state.
   */
  function handleTranslate() {
    globalState.selection.resetProperties()
    globalState.selection.resetBoundaryBox()
    switchVectorTransformMode(TRANSLATE)
  }

  /**
   * Switches to Rotate mode and clears selection properties and the
   * boundary box. Mirrors `handleTranslate` — rotation also works on
   * control points and must not inherit a stale boundary box.
   */
  function handleRotate() {
    globalState.selection.resetProperties()
    globalState.selection.resetBoundaryBox()
    switchVectorTransformMode(ROTATE)
  }

  /**
   * Computes the shape's bounding box and switches to Scale mode.
   * Unlike translate/rotate, scale requires an accurate bounding box
   * as its transform origin before the mode switch, so
   * `setVectorShapeBoundaryBox` is called first rather than resetting
   * the box as the other modes do.
   */
  function handleScale() {
    setVectorShapeBoundaryBox()
    switchVectorTransformMode(SCALE)
  }
</script>

<DialogBox
  title="Transform"
  class="vector-transform-ui-container v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
  onclose={handleClose}
>
  <div id="vector-transform-ui-interface" class="vector-transform-ui-interface">
    <div class="vector-transform-modes">
      <button
        type="button"
        class="transform-mode tool move custom-shape{mode === TRANSLATE
          ? ' selected'
          : ''}"
        id="translate"
        aria-label={TOOLTIPS.translate.label}
        data-tooltip={TOOLTIPS.translate.tooltip}
        onclick={handleTranslate}
      ></button>
      <button
        type="button"
        class="transform-mode tool rotate custom-shape{mode === ROTATE
          ? ' selected'
          : ''}"
        id="rotate"
        aria-label={TOOLTIPS.rotate.label}
        data-tooltip={TOOLTIPS.rotate.tooltip}
        onclick={handleRotate}
      ></button>
      <button
        type="button"
        class="transform-mode tool scale custom-shape{mode === SCALE
          ? ' selected'
          : ''}"
        id="scale"
        aria-label={TOOLTIPS.scale.label}
        data-tooltip={TOOLTIPS.scale.tooltip}
        onclick={handleScale}
      ></button>
    </div>
  </div>
</DialogBox>
