<script>
  /**
   * @component
   * Panel listing all visible (non-removed, non-preview) canvas layers
   * with controls to add raster layers, upload reference images, delete,
   * toggle visibility, reorder via drag-and-drop, and open per-layer
   * settings. All controls are disabled while a paste operation is
   * active to prevent structural changes mid-paste.
   */
  import { globalState } from '../../../context/state.js'
  import { canvas } from '../../../context/canvas.js'
  import { vectorGui } from '../../../gui/vector.js'
  import { renderCanvas } from '../../../canvas/render.js'
  import { updateActiveLayerState } from '../../../canvas/layers.js'
  import {
    addRasterLayer,
    addReferenceLayer,
    removeLayer,
  } from '../../../actions/layer/layerActions.js'
  import { switchTool } from '../../../tools/toolbox.js'
  import { dom } from '../../../context/dom.js'
  import LayerSettingsPopout from './LayerSettingsPopout.svelte'
  import DialogBox from '../DialogBox.svelte'

  let uploadRef = $state(null)
  let settingsLayer = $state.raw(null)
  let settingsPos = $state({ top: 0, left: 0 })
  let dragIndex = $state(null)

  const isPasted = $derived(!!canvas.pastedLayer)
  const visibleLayers = $derived(
    canvas.layers.filter((l) => !l.removed && !l.isPreview),
  )
  const canDelete = $derived(
    !isPasted &&
      (canvas.activeLayerCount > 1 || canvas.currentLayer?.type !== 'raster'),
  )
  const currentLayer = $derived(canvas.currentLayer)

  /**
   * Adds a new raster layer, guarded against paste state to prevent
   * structural changes while a paste operation is in progress.
   */
  function handleAddLayer() {
    if (isPasted) return
    addRasterLayer()
  }

  /**
   * Triggers a reference layer upload after a file is selected.
   * `addReferenceLayer` is called with `uploadRef` as `this` because
   * the function reads the file from `this.files` rather than taking it
   * as an argument. The input value is cleared after each upload so
   * selecting the same file again re-triggers the change event.
   * @param {Event} e - The change event from the file input.
   */
  function handleUploadRef(e) {
    if (e.target.files?.[0]) {
      addReferenceLayer.call(uploadRef)
      e.target.value = null
    }
  }

  /**
   * Removes the current layer and re-renders. The paste guard prevents
   * deletion mid-paste, which would leave the paste layer in an invalid
   * state with no target to commit to.
   */
  function handleDeleteLayer() {
    if (isPasted) return
    const layer = canvas.currentLayer
    removeLayer(layer)
    renderCanvas(layer)
  }

  /**
   * Switches the active canvas layer. Deselects vector state when
   * leaving a reference layer because reference layers cannot host
   * vectors, so any active selection would be invalid on the new layer.
   * Re-enables tool buttons disabled by the previous layer's
   * `inactiveTools` list before disabling those of the incoming layer,
   * so the toolbar always reflects exactly the new layer's constraints.
   * Forces 'move' tool when the target is a reference layer because
   * drawing tools have no effect on reference layers.
   * @param {object} layer - The layer object to activate.
   */
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
    updateActiveLayerState()

    renderCanvas(layer)
  }

  /**
   * Toggles a layer's visibility and re-renders. Propagation is stopped
   * so the parent layer-row click handler does not also fire and switch
   * the active layer as a side effect of clicking the eye button.
   * @param {MouseEvent} e - The click event from the hide button.
   * @param {object} layer - The layer to show or hide.
   */
  function handleHideToggle(e, layer) {
    e.stopPropagation()
    layer.hidden = !layer.hidden
    renderCanvas(layer)
  }

  /**
   * Toggles the per-layer settings popout. A second click on the same
   * layer's gear closes the popout rather than reopening it. Popout
   * position is computed from the gear button's bounding rect so it
   * appears anchored to the right of the button regardless of scroll
   * position.
   * @param {MouseEvent} e - The click event from the gear button.
   * @param {object} layer - The layer whose settings to show.
   */
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

  /**
   * Begins a drag-reorder gesture by recording the layer's index and
   * writing it to dataTransfer for retrieval in `handleDrop`. Prevented
   * during paste state to avoid reordering while a commit is pending.
   * @param {DragEvent} e - The dragstart event.
   * @param {object} layer - The layer being dragged.
   */
  function handleDragStart(e, layer) {
    if (isPasted) {
      e.preventDefault()
      return
    }
    dragIndex = canvas.layers.indexOf(layer)
    e.dataTransfer.setData('text', String(dragIndex))
  }

  /**
   * Allows drops by preventing the browser's default reject behavior.
   * Without this, ondrop never fires on the target element.
   * @param {DragEvent} e - The dragover event.
   */
  function handleDragOver(e) {
    e.preventDefault()
  }

  /**
   * Reorders the layer data array and the corresponding DOM canvas
   * stack in a single operation. Both must stay in sync because the
   * compositor renders layers in DOM order; reordering only the data
   * array would leave the visual stack unchanged until a full page
   * reload.
   * @param {DragEvent} e - The drop event on the target layer row.
   * @param {object} targetLayer - The layer at the drop target position.
   */
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
    updateActiveLayerState()
  }
</script>

<DialogBox
  title="Layers"
  class="layers-interface draggable v-drag settings-box smooth-shift{isPasted
    ? ' disabled'
    : ''}"
  collapsible
>
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
      onclick={(e) => {
        e.target.value = null
      }}
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
        {@const isHidden = layer.hidden}
        {@const isSelected = layer === currentLayer}
        {@const isSettingsOpen = settingsLayer === layer}
        <div
          class="layer {layer.type}{isSelected ? ' selected' : ''}"
          role="button"
          tabindex="0"
          draggable={!isPasted}
          ondragstart={(e) => handleDragStart(e, layer)}
          ondragover={handleDragOver}
          ondrop={(e) => handleDrop(e, layer)}
          onclick={() => handleLayerClick(layer)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleLayerClick(layer)
          }}
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
  {#if settingsLayer}
    {#key settingsLayer}
      <LayerSettingsPopout
        bind:layer={settingsLayer}
        pos={settingsPos}
        onclose={() => {
          settingsLayer = null
        }}
      />
    {/key}
  {/if}
</DialogBox>
