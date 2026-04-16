<script>
  import { onMount } from 'svelte'
  import { getVersion, bump } from '../../hooks/appState.svelte.js'
  import { globalState } from '../../Context/state.js'
  import { switchVectorTransformMode } from '../../GUI/events.js'
  import { setVectorShapeBoundaryBox } from '../../GUI/transform.js'
  import { actionDeselect } from '../../Actions/nonPointer/selectionActions.js'
  import { TRANSLATE, ROTATE, SCALE } from '../../utils/constants.js'
  import { initializeDragger } from '../../utils/drag.js'

  let ref = $state(null)

  const isOpen = $derived(getVersion() >= 0 && globalState.ui.vectorTransformOpen)
  const mode = $derived(getVersion() >= 0 ? globalState.vector.transformMode : null)

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })

  function handleClose() {
    actionDeselect()
    bump()
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

<div
  bind:this={ref}
  class="vector-transform-ui-container dialog-box v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
>
  <div id="vector-transform-ui-header" class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    <span>Transform</span>
    <button type="button" class="close-btn" aria-label="Close" data-tooltip="Close" onclick={handleClose}></button>
  </div>
  <div class="collapsible">
    <div id="vector-transform-ui-interface" class="vector-transform-ui-interface">
      <div class="vector-transform-modes">
        <button
          type="button"
          class="transform-mode tool move custom-shape{mode === TRANSLATE ? ' selected' : ''}"
          id="translate"
          aria-label="Translate"
          data-tooltip="Translate"
          onclick={handleTranslate}
        ></button>
        <button
          type="button"
          class="transform-mode tool rotate custom-shape{mode === ROTATE ? ' selected' : ''}"
          id="rotate"
          aria-label="Rotate"
          data-tooltip="Rotate"
          onclick={handleRotate}
        ></button>
        <button
          type="button"
          class="transform-mode tool scale custom-shape{mode === SCALE ? ' selected' : ''}"
          id="scale"
          aria-label="Scale"
          data-tooltip="Scale"
          onclick={handleScale}
        ></button>
      </div>
    </div>
  </div>
</div>
