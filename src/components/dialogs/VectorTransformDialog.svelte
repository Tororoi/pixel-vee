<script>
  import { globalState } from '../../Context/state.js'
  import { switchVectorTransformMode } from '../../GUI/events.js'
  import { setVectorShapeBoundaryBox } from '../../GUI/transform.js'
  import { actionDeselect } from '../../Actions/nonPointer/selectionActions.js'
  import { TRANSLATE, ROTATE, SCALE } from '../../utils/constants.js'
  import DialogBox from '../DialogBox.svelte'

  const isOpen = $derived(globalState.ui.vectorTransformOpen)
  const mode = $derived(globalState.vector.transformMode)

  function handleClose() {
    actionDeselect()
  }

  function handleTranslate() {
    globalState.selection.resetProperties()
    globalState.selection.resetBoundaryBox()
    switchVectorTransformMode(TRANSLATE)
  }

  function handleRotate() {
    globalState.selection.resetProperties()
    globalState.selection.resetBoundaryBox()
    switchVectorTransformMode(ROTATE)
  }

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
  <div
    id="vector-transform-ui-interface"
    class="vector-transform-ui-interface"
  >
    <div class="vector-transform-modes">
      <button
        type="button"
        class="transform-mode tool move custom-shape{mode === TRANSLATE
          ? ' selected'
          : ''}"
        id="translate"
        aria-label="Translate"
        data-tooltip="Translate"
        onclick={handleTranslate}
      ></button>
      <button
        type="button"
        class="transform-mode tool rotate custom-shape{mode === ROTATE
          ? ' selected'
          : ''}"
        id="rotate"
        aria-label="Rotate"
        data-tooltip="Rotate"
        onclick={handleRotate}
      ></button>
      <button
        type="button"
        class="transform-mode tool scale custom-shape{mode === SCALE
          ? ' selected'
          : ''}"
        id="scale"
        aria-label="Scale"
        data-tooltip="Scale"
        onclick={handleScale}
      ></button>
    </div>
  </div>
</DialogBox>
