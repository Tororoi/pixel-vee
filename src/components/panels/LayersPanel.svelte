<script>
  import { onMount } from 'svelte'
  import { getVersion, bump } from '../../hooks/appState.svelte.js'
  import { globalState } from '../../Context/state.js'
  import { canvas } from '../../Context/canvas.js'
  import { vectorGui } from '../../GUI/vector.js'
  import { renderCanvas } from '../../Canvas/render.js'
  import { renderLayersToDOM, renderVectorsToDOM } from '../../DOM/render.js'
  import { addRasterLayer, addReferenceLayer, removeLayer } from '../../Actions/layer/layerActions.js'
  import { switchTool } from '../../Tools/toolbox.js'
  import { initializeDragger, initializeCollapser } from '../../utils/drag.js'
  import { dom } from '../../Context/dom.js'
  import LayerSettingsPopout from './LayerSettingsPopout.svelte'

  let ref = $state(null)
  let uploadRef = $state(null)
  let settingsLayer = $state.raw(null)
  let settingsPos = $state({ top: 0, left: 0 })
  let dragIndex = null

  const isPasted = $derived(getVersion() >= 0 && !!canvas.pastedLayer)
  const visibleLayers = $derived(
    getVersion() >= 0
      ? canvas.layers.filter((l) => !l.removed && !l.isPreview)
      : [],
  )
  const canDelete = $derived(
    !isPasted &&
      (canvas.activeLayerCount > 1 || canvas.currentLayer?.type !== 'raster'),
  )
  const currentLayer = $derived(getVersion() >= 0 ? canvas.currentLayer : null)

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    initializeCollapser(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })

  function handleAddLayer() {
    if (isPasted) return
    addRasterLayer()
  }

  function handleUploadRef(e) {
    if (e.target.files?.[0]) {
      addReferenceLayer.call(uploadRef)
      e.target.value = null
    }
  }

  function handleDeleteLayer() {
    if (isPasted) return
    const layer = canvas.currentLayer
    removeLayer(layer)
    renderCanvas(layer)
  }

  function handleLayerClick(layer) {
    if (isPasted) return
    if (layer === canvas.currentLayer) return
    if (canvas.currentLayer.type === 'reference') {
      globalState.deselect()
    }
    canvas.currentLayer.inactiveTools?.forEach((tool) => {
      if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = false
    })
    canvas.currentLayer = layer
    canvas.currentLayer.inactiveTools?.forEach((tool) => {
      if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
    })
    vectorGui.reset()
    vectorGui.render()
    if (layer.type === 'reference') {
      switchTool('move')
    }
    renderLayersToDOM()
    renderVectorsToDOM()
    renderCanvas(layer)
  }

  function handleHideToggle(e, layer) {
    e.stopPropagation()
    layer.hidden = !layer.hidden
    renderCanvas(layer)
    bump()
  }

  function handleGearClick(e, layer) {
    e.stopPropagation()
    if (settingsLayer === layer) {
      settingsLayer = null
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      settingsPos = { top: rect.top + rect.height / 2, left: rect.right + 16 }
      settingsLayer = layer
    }
  }

  function handleDragStart(e, layer) {
    if (isPasted) { e.preventDefault(); return }
    dragIndex = canvas.layers.indexOf(layer)
    e.dataTransfer.setData('text', String(dragIndex))
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDrop(e, targetLayer) {
    e.preventDefault()
    const draggedIndex = parseInt(e.dataTransfer.getData('text'))
    const heldLayer = canvas.layers[draggedIndex]
    const newIndex = canvas.layers.indexOf(targetLayer)
    if (heldLayer === targetLayer) return

    canvas.layers.splice(draggedIndex, 1)
    canvas.layers.splice(newIndex, 0, heldLayer)

    dom.canvasLayers?.removeChild(heldLayer.onscreenCvs)
    if (newIndex >= dom.canvasLayers?.children.length) {
      dom.canvasLayers?.appendChild(heldLayer.onscreenCvs)
    } else {
      dom.canvasLayers?.insertBefore(
        heldLayer.onscreenCvs,
        dom.canvasLayers.children[newIndex],
      )
    }
    renderLayersToDOM()
  }
</script>

<div
  bind:this={ref}
  class="layers-interface dialog-box draggable v-drag settings-box smooth-shift{isPasted ? ' disabled' : ''}"
>
  <div class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    Layers
    <label for="layers-collapse-btn" class="collapse-btn" data-tooltip="Collapse/ Expand">
      <input
        type="checkbox"
        aria-label="Collapse or Expand"
        class="collapse-checkbox"
        id="layers-collapse-btn"
      />
      <span class="arrow"></span>
    </label>
  </div>
  <div class="collapsible">
    <div class="layers-control">
      <button
        type="button"
        class="add-layer"
        aria-label="New Layer"
        data-tooltip="New Layer"
        disabled={isPasted}
        onclick={handleAddLayer}
      ></button>
      <label
        for="file-upload"
        class="reference{isPasted ? ' disabled' : ''}"
        aria-label="Add Reference Layer"
        data-tooltip="Add Reference Layer"
      ></label>
      <input
        type="file"
        id="file-upload"
        bind:this={uploadRef}
        accept="image/*"
        disabled={isPasted}
        onchange={handleUploadRef}
        onclick={(e) => { e.target.value = null }}
      />
      <button
        type="button"
        id="delete-layer"
        class="trash"
        aria-label="Delete Layer"
        data-tooltip="Delete Layer"
        disabled={!canDelete}
        onclick={handleDeleteLayer}
      ></button>
    </div>
    <div class="layers-container">
      <div class="layers">
        {#each visibleLayers as layer (layer.id ?? layer.title)}
          {@const isHidden = getVersion() >= 0 && layer.hidden}
          {@const isSelected = layer === currentLayer}
          {@const isSettingsOpen = settingsLayer === layer}
          <div
            class="layer {layer.type}{isSelected ? ' selected' : ''}"
            draggable={!isPasted}
            ondragstart={(e) => handleDragStart(e, layer)}
            ondragover={handleDragOver}
            ondrop={(e) => handleDrop(e, layer)}
            onclick={() => handleLayerClick(layer)}
          >
            <button
              type="button"
              class="hide {isHidden ? 'eyeclosed' : 'eyeopen'}"
              aria-label={isHidden ? 'Show Layer' : 'Hide Layer'}
              data-tooltip={isHidden ? 'Show Layer' : 'Hide Layer'}
              onclick={(e) => handleHideToggle(e, layer)}
            ></button>
            <span class="layer-title">{layer.title}</span>
            <button
              type="button"
              class="gear{isSettingsOpen ? ' active' : ''}"
              aria-label="Layer Settings"
              data-tooltip="Layer Settings"
              onclick={(e) => handleGearClick(e, layer)}
            ></button>
          </div>
        {/each}
      </div>
    </div>
  </div>
  {#if settingsLayer}
    <LayerSettingsPopout
      layer={settingsLayer}
      pos={settingsPos}
      onclose={() => { settingsLayer = null }}
    />
  {/if}
</div>
