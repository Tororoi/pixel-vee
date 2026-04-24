import { globalState } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { tools } from '../../Tools/index.js'
import { vectorGui } from '../../GUI/vector.js'
import { addToTimeline } from '../undoRedo/undoRedo.js'
import { createRasterLayer, createReferenceLayer } from '../../Canvas/layers.js'
import { renderCanvas } from '../../Canvas/render.js'
import { updateActiveLayerState } from '../../DOM/render.js'
import { dom } from '../../Context/dom.js'

//=============================================//
//============ * * * Layers * * * =============//
//=============================================//

/**
 * Upload an image file and create a new reference layer from it.
 *
 * Reference layers are read-only image overlays used for tracing or visual
 * reference. They cannot be painted on directly. `canvas.layers` is rendered
 * from index 0 (bottom) to the last index (top), so prepending via `unshift`
 * places the reference layer below all raster layers visually. This function
 * is intended to be bound as a `change` event handler on an
 * `<input type="file">` element, which is why it accesses `this.files`.
 * `this` is the file input element that triggered the event.
 * @this {HTMLInputElement}
 */
export function addReferenceLayer() {
  // A paste in progress uses a temporary layer; modifying the layer stack
  // at this point would corrupt that state. Wait until it is resolved.
  if (canvas.pastedLayer) {
    return
  }
  let reader
  let img = new Image()

  if (this.files && this.files[0]) {
    reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target.result
      img.onload = () => {
        const layer = createReferenceLayer(img)
        // Layers render from index 0 upward; prepending places the reference
        // image below all raster layers so it acts as a background guide.
        canvas.layers.unshift(layer)
        addToTimeline({
          tool: tools.addLayer.name,
          layer,
        })
        globalState.clearRedoStack()
        updateActiveLayerState()
        renderCanvas()
      }
    }

    reader.readAsDataURL(this.files[0])
  }
}

/**
 * Create a new blank raster layer and append it to the layer stack.
 *
 * Raster layers are the primary drawable surfaces. The new layer starts
 * fully transparent. `canvas.layers` renders from index 0 (bottom) to the
 * last index (top), so appending via `push` places the new raster layer on
 * top of all existing layers, making it immediately active for drawing.
 * No canvas re-render is triggered because the layer starts empty.
 */
export function addRasterLayer() {
  // A paste in progress uses a temporary layer; modifying the layer stack
  // at this point would corrupt that state. Wait until it is resolved.
  if (canvas.pastedLayer) {
    return
  }
  // Once a layer is drawn on and recorded in the timeline it cannot be
  // fully deleted — only flagged as removed so undo can restore it.
  const layer = createRasterLayer()
  canvas.layers.push(layer)
  addToTimeline({
    tool: tools.addLayer.name,
    layer,
  })
  globalState.clearRedoStack()
  updateActiveLayerState()
}

/**
 * Mark a layer as logically removed without destroying its underlying data.
 *
 * Layers are never permanently deleted during a session. Setting
 * `removed: true` lets the undo/redo system restore a layer by toggling
 * the flag back — no data reconstruction is needed. The layer object stays
 * in `canvas.layers` and is simply skipped during rendering.
 *
 * If the removed layer is the currently active layer, this function also
 * transfers focus to the next available raster layer, re-enables any tool
 * buttons the removed layer had disabled, and resets the vector GUI.
 *
 * Removal is silently blocked when the target is the last remaining
 * non-removed raster layer, preventing the user from ending up with no
 * drawable surface. Reference layers can always be removed.
 * @param {object} layer - The layer to remove. Must be a live reference to
 *   an entry in `canvas.layers` (raster or reference).
 */
export function removeLayer(layer) {
  if (canvas.activeLayerCount > 1 || layer.type !== 'raster') {
    layer.removed = true
    if (layer === canvas.currentLayer) {
      // Reference layers don't support selections; clear any active one.
      if (layer.type === 'reference') {
        globalState.deselect()
      }
      // Re-enable tools that the removed layer had marked as inactive.
      layer.inactiveTools.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = false
      })
      // Switch to the nearest surviving raster layer.
      canvas.currentLayer = canvas.layers.find(
        (l) => l.type === 'raster' && !l.removed,
      )
      // Disable tools incompatible with the newly active layer.
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
      })
      // Clear any vector control-point handles tied to the old layer.
      vectorGui.reset()
    }
    addToTimeline({
      tool: tools.removeLayer.name,
      layer,
    })
    globalState.clearRedoStack()
    updateActiveLayerState()
  }
}
