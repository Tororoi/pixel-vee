<script>
  import { onMount } from 'svelte'
  import { getVersion, bump } from '../../hooks/appState.svelte.js'
  import { globalState } from '../../Context/state.js'
  import { canvas } from '../../Context/canvas.js'
  import { vectorGui } from '../../GUI/vector.js'
  import { renderCanvas } from '../../Canvas/render.js'
  import { renderLayersToDOM, renderVectorsToDOM } from '../../DOM/render.js'
  import { isValidVector } from '../../DOM/renderVectors.js'
  import { initializeDragger, initializeCollapser } from '../../utils/drag.js'
  import { dom } from '../../Context/dom.js'
  import { switchTool } from '../../Tools/toolbox.js'
  import {
    actionSelectVector,
    actionDeselectVector,
    actionDeselect,
  } from '../../Actions/nonPointer/selectionActions.js'
  import { removeActionVector } from '../../Actions/modifyTimeline/modifyTimeline.js'
  import { keys } from '../../Shortcuts/keys.js'
  import { initializeColorPicker } from '../../Swatch/events.js'
  import VectorThumbnail from './VectorThumbnail.svelte'
  import VectorSettingsPopout from './VectorSettingsPopout.svelte'

  let ref = $state(null)
  let settingsVector = $state(null)
  let settingsPos = $state({ top: 0, left: 0 })

  const isPasted = $derived(getVersion() >= 0 && !!canvas.pastedLayer)
  const visibleVectors = $derived.by(() => {
    getVersion()
    const undoStackSet = new Set(globalState.timeline.undoStack)
    return Object.values(globalState.vector.all).filter((v) => isValidVector(v, undoStackSet))
  })
  const currentVectorIndex = $derived(getVersion() >= 0 ? globalState.vector.currentIndex : null)
  const selectedIndices = $derived(getVersion() >= 0 ? globalState.vector.selectedIndices : new Set())

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    initializeCollapser(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })

  function handleVectorClick(e, vector) {
    if (isPasted) { e.preventDefault(); return }
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
    renderLayersToDOM()
    renderVectorsToDOM()
  }

  function handleHideToggle(e, vector) {
    e.stopPropagation()
    vector.hidden = !vector.hidden
    renderCanvas(vector.layer, true)
    bump()
  }

  function handleRemove(e, vector) {
    e.stopPropagation()
    vector.removed = true
    if (globalState.vector.currentIndex === vector.index) vectorGui.reset()
    renderCanvas(vector.layer, true)
    removeActionVector(vector)
    globalState.clearRedoStack()
    renderVectorsToDOM()
  }

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

  function handleColorClick(e, vector) {
    e.stopPropagation()
    initializeColorPicker({ color: vector.color, vector, isSecondaryColor: false })
  }
</script>

<div
  bind:this={ref}
  class="vectors-interface dialog-box draggable v-drag settings-box smooth-shift{isPasted ? ' disabled' : ''}"
>
  <div class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    Vectors
    <label for="vectors-collapse-btn" class="collapse-btn" data-tooltip="Collapse/ Expand">
      <input
        type="checkbox"
        aria-label="Collapse or Expand"
        class="collapse-checkbox"
        id="vectors-collapse-btn"
      />
      <span class="arrow"></span>
    </label>
  </div>
  <div class="collapsible">
    <div class="vectors-container">
      <div class="vectors">
        {#each visibleVectors as vector (vector.index)}
          {@const isSelected =
            vector.index === currentVectorIndex ||
            selectedIndices.has(vector.index)}
          {@const toolName = vector.vectorProperties?.tool ?? ''}
          {@const isSettingsOpen = settingsVector === vector}
          <div
            class="vector{isSelected ? ' selected' : ''}"
            onclick={(e) => handleVectorClick(e, vector)}
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
                <div class="swatch" style="background-color: {vector.color?.color}"></div>
              </button>
              <button
                type="button"
                class="hide {vector.hidden ? 'eyeclosed' : 'eyeopen'}"
                aria-label={vector.hidden ? 'Show Vector' : 'Hide Vector'}
                data-tooltip={vector.hidden ? 'Show Vector' : 'Hide Vector'}
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
  </div>
  {#if settingsVector}
    <VectorSettingsPopout
      vector={settingsVector}
      pos={settingsPos}
      onclose={() => { settingsVector = null }}
    />
  {/if}
</div>
