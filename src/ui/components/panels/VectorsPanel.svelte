<script>
  /**
   * @component
   * Panel listing all valid (non-removed) vectors with controls to
   * select, multi-select (Shift-click), hide, soft-delete, open the
   * color picker, and open per-vector settings. Validity is determined
   * against the current undo stack so vectors from future redo branches
   * are filtered out. Disabled entirely while a pasted layer is active.
   */
  import { globalState } from '../../../context/state.js'
  import { canvas } from '../../../context/canvas.js'
  import { vectorGui } from '../../../gui/vector.js'
  import { renderCanvas } from '../../../canvas/render.js'
  import { updateActiveLayerState } from '../../../canvas/layers.js'
  import { isValidVector } from '../../../utils/vectorHelpers.js'
  import { dom } from '../../../context/dom.js'
  import DialogBox from '../DialogBox.svelte'
  import { switchTool } from '../../../tools/toolbox.js'
  import {
    actionSelectVector,
    actionDeselectVector,
    actionDeselect,
  } from '../../../actions/nonPointer/selectionActions.js'
  import { removeActionVector } from '../../../actions/modifyTimeline/modifyTimeline.js'
  import { keys } from '../../../shortcuts/keys.js'
  import { initializeColorPicker } from '../../../swatch/events.js'
  import VectorThumbnail from './VectorThumbnail.svelte'
  import VectorSettingsPopout from './VectorSettingsPopout.svelte'

  let settingsVector = $state.raw(null)
  let settingsPos = $state({ top: 0, left: 0 })

  const isPasted = $derived(!!canvas.pastedLayer)
  // Build a Set from the undo stack for O(1) membership tests inside
  // isValidVector. A linear scan per vector against the full undo array
  // would be O(n²) and the undo stack can be long.
  const visibleVectors = $derived.by(() => {
    const undoStackSet = new Set(globalState.timeline.undoStack)
    return Object.values(globalState.vector.all).filter((v) =>
      isValidVector(v, undoStackSet),
    )
  })
  const currentVectorIndex = $derived(globalState.vector.currentIndex)
  const selectedIndices = $derived(globalState.vector.selectedIndices)

  /**
   * Handles selection of a vector row. Shift-click toggles multi-
   * selection membership. A plain click while a multi-selection is
   * active first deselects all before proceeding, so clicking a single
   * item always results in exactly one active vector. When the clicked
   * vector differs from the current one, the tool is switched to match
   * the vector's recorded tool and the layer is switched to the vector's
   * host layer, with toolbar button disabled states updated accordingly.
   * @param {MouseEvent} e - The click or keydown event.
   * @param {object} vector - The vector that was clicked.
   */
  function handleVectorClick(e, vector) {
    if (isPasted) {
      e.preventDefault()
      return
    }
    if (keys.ShiftLeft || keys.ShiftRight) {
      if (!globalState.vector.selectedIndices.has(vector.index)) {
        actionSelectVector(vector.index)
      } else {
        actionDeselectVector(vector.index)
      }
    } else if (globalState.vector.selectedIndices.size > 0) {
      actionDeselect()
    }
    if (vector.index !== globalState.vector.currentIndex) {
      switchTool(vector.vectorProperties.tool)
      vectorGui.setVectorProperties(vector)
      canvas.currentLayer.inactiveTools?.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = false
      })
      canvas.currentLayer = vector.layer
      canvas.currentLayer.inactiveTools?.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
      })
    }
    vectorGui.render()
    updateActiveLayerState()
  }

  /**
   * Toggles a vector's visibility and re-renders. Propagation is
   * stopped so the parent row click handler does not also fire and
   * switch the active vector as a side effect of clicking the eye.
   * @param {MouseEvent} e - The click event from the hide button.
   * @param {object} vector - The vector to show or hide.
   */
  function handleHideToggle(e, vector) {
    e.stopPropagation()
    vector.hidden = !vector.hidden
    renderCanvas(vector.layer, true)
  }

  /**
   * Soft-deletes a vector by marking it removed rather than splicing it
   * from the array, preserving undo history. The GUI is reset if the
   * removed vector was active to avoid leaving stale control handles on
   * the canvas.
   * @param {MouseEvent} e - The click event from the remove button.
   * @param {object} vector - The vector to soft-delete.
   */
  function handleRemove(e, vector) {
    e.stopPropagation()
    vector.removed = true
    if (globalState.vector.currentIndex === vector.index) vectorGui.reset()
    renderCanvas(vector.layer, true)
    removeActionVector(vector)
    globalState.clearRedoStack()
  }

  /**
   * Toggles the per-vector settings popout. A second click on the same
   * vector's gear closes the popout. Position is computed from the gear
   * button's bounding rect so it appears anchored to its right edge.
   * @param {MouseEvent} e - The click event from the gear button.
   * @param {object} vector - The vector whose settings to show.
   */
  function handleGearClick(e, vector) {
    e.stopPropagation()
    if (settingsVector === vector) {
      settingsVector = null
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      settingsPos = { top: rect.top + rect.height / 2, left: rect.right + 16 }
      settingsVector = vector
    }
  }

  /**
   * Opens the color picker bound to this vector's primary color slot
   * directly from the row, without opening the full settings popout.
   * Propagation is stopped so the row click handler does not also fire.
   * @param {MouseEvent} e - The click event from the color swatch button.
   * @param {object} vector - The vector whose color to edit.
   */
  function handleColorClick(e, vector) {
    e.stopPropagation()
    initializeColorPicker({
      color: vector.color,
      vector,
      isSecondaryColor: false,
    })
  }
</script>

<DialogBox
  title="Vectors"
  class="vectors-interface draggable v-drag settings-box smooth-shift{isPasted
    ? ' disabled'
    : ''}"
  collapsible
>
  <div class="vectors-container">
    <div class="vectors">
      {#each visibleVectors as vector (vector.index)}
        {@const isVectorHidden = vector.hidden}
        {@const isSelected =
          vector.index === currentVectorIndex ||
          selectedIndices.has(vector.index)}
        {@const toolName = vector.vectorProperties?.tool ?? ''}
        {@const isSettingsOpen = settingsVector === vector}
        <div
          class="vector{isSelected ? ' selected' : ''}"
          role="button"
          tabindex="0"
          onclick={(e) => handleVectorClick(e, vector)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleVectorClick(e, vector)
          }}
        >
          <VectorThumbnail {vector} />
          <div class="left">
            <button
              type="button"
              class="tool {toolName}"
              aria-label={toolName}
              data-tooltip={toolName}
              onclick={(e) => e.stopPropagation()}
            ></button>
            <button
              type="button"
              class="actionColor primary-color"
              aria-label="Action Color"
              data-tooltip="Action Color"
              onclick={(e) => handleColorClick(e, vector)}
            >
              <div
                class="swatch"
                style="background-color: {vector.color?.color}"
              ></div>
            </button>
            <button
              type="button"
              class="hide {isVectorHidden ? 'eyeclosed' : 'eyeopen'}"
              aria-label={isVectorHidden ? 'Show Vector' : 'Hide Vector'}
              data-tooltip={isVectorHidden ? 'Show Vector' : 'Hide Vector'}
              onclick={(e) => handleHideToggle(e, vector)}
            ></button>
            <button
              type="button"
              class="trash"
              aria-label="Remove Vector"
              data-tooltip="Remove Vector"
              onclick={(e) => handleRemove(e, vector)}
            ></button>
          </div>
          <button
            type="button"
            class="gear{isSettingsOpen ? ' active' : ''}"
            aria-label="Vector Settings"
            data-tooltip="Vector Settings"
            onclick={(e) => handleGearClick(e, vector)}
          ></button>
        </div>
      {/each}
    </div>
  </div>
  {#if settingsVector}
    <VectorSettingsPopout
      bind:vector={settingsVector}
      pos={settingsPos}
      onclose={() => {
        settingsVector = null
      }}
    />
  {/if}
</DialogBox>
