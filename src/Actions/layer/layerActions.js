import { state } from "../../Context/state.js"
import { canvas } from "../../Context/canvas.js"
import { tools } from "../../Tools/index.js"
import { vectorGui } from "../../GUI/vector.js"
import { addToTimeline } from "../undoRedo/undoRedo.js"
import { createRasterLayer, createReferenceLayer } from "../../Canvas/layers.js"
import { renderCanvas } from "../../Canvas/render.js"
import { renderLayersToDOM, renderVectorsToDOM } from "../../DOM/render.js"
import { dom } from "../../Context/dom.js"

//=============================================//
//============ * * * Layers * * * =============//
//=============================================//

/**
 * Upload an image and create a new reference layer
 * Conditions: No active paste action (temporary layer)
 */
export function addReferenceLayer() {
  if (canvas.pastedLayer) {
    //if there is a pasted layer, temporary layer is active and layers configuration should not be messed with
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
        canvas.layers.unshift(layer)
        addToTimeline({
          tool: tools.addLayer.name,
          layer,
        })
        state.clearRedoStack()
        renderLayersToDOM()
        renderCanvas()
      }
    }

    reader.readAsDataURL(this.files[0])
  }
}

/**
 * Add layer
 * Add a new raster layer
 * Conditions: No active paste action (temporary layer)
 */
export function addRasterLayer() {
  if (canvas.pastedLayer) {
    //if there is a pasted layer, temporary layer is active and layers configuration should not be messed with
    return
  }
  //once layer is added to timeline and drawn on, can no longer be deleted
  const layer = createRasterLayer()
  canvas.layers.push(layer)
  addToTimeline({
    tool: tools.addLayer.name,
    layer,
  })
  state.clearRedoStack()
  renderLayersToDOM()
}

/**
 * Mark a layer as removed
 * @param {object} layer - The layer to be removed
 */
export function removeLayer(layer) {
  //set "removed" flag to true on selected layer.
  if (canvas.activeLayerCount > 1 || layer.type !== "raster") {
    layer.removed = true
    if (layer === canvas.currentLayer) {
      if (layer.type === "reference") {
        state.deselect()
      }
      layer.inactiveTools.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = false
      })
      canvas.currentLayer = canvas.layers.find(
        (l) => l.type === "raster" && !l.removed
      )
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
      })
      vectorGui.reset()
    }
    addToTimeline({
      tool: tools.removeLayer.name,
      layer,
    })
    state.clearRedoStack()
    renderLayersToDOM()
    renderVectorsToDOM()
  }
}
