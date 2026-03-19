import { state } from "../../Context/state.js"
import { canvas } from "../../Context/canvas.js"
import { tools } from "../../Tools/index.js"
import { vectorGui } from "../../GUI/vector.js"
import { addToTimeline } from "../undoRedo/undoRedo.js"
import { renderVectorsToDOM } from "../../DOM/render.js"
import { findVectorShapeCentroid } from "../../utils/vectorHelpers.js"
import { dom } from "../../Context/dom.js"
import { SCALE } from "../../utils/constants.js"
import { setVectorShapeBoundaryBox } from "../../GUI/transform.js"
import { actionCutSelection } from "./clipboardActions.js"

//=============================================//
//=========== * * * Selection * * * ===========//
//=============================================//

/**
 * Select All
 * Not dependent on pointer events
 * Conditions: Layer is a raster layer, layer is not a preview layer
 */
export function actionSelectAll() {
  if (canvas.pastedLayer) {
    //if there is a pasted layer active, do not perform action
    return
  }
  //select all pixels on canvas
  if (canvas.currentLayer.type === "raster" && !canvas.currentLayer.isPreview) {
    state.deselect()
    //set initial properties
    state.selection.properties.px1 = 0
    state.selection.properties.py1 = 0
    state.selection.properties.px2 = canvas.currentLayer.cvs.width
    state.selection.properties.py2 = canvas.currentLayer.cvs.height
    state.selection.setBoundaryBox(state.selection.properties)
    addToTimeline({
      tool: tools.select.name,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
      },
    })
    state.clearRedoStack()
    //re-render vectors in DOM and GUI
    renderVectorsToDOM()
    vectorGui.render()
  }
}

/**
 *
 * @param {number} vectorIndex - The vector index
 */
export function actionSelectVector(vectorIndex) {
  if (!state.vector.selectedIndices.has(vectorIndex)) {
    state.vector.addSelected(vectorIndex)
    dom.vectorTransformUIContainer.style.display = "flex"
    if (state.vector.transformMode === SCALE) {
      setVectorShapeBoundaryBox()
    }
    addToTimeline({
      tool: tools.select.name,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
      },
    })
    state.clearRedoStack()
    //Update shape center
    const [centerX, centerY] = findVectorShapeCentroid(
      state.vector.selectedIndices,
      state.vector.all
    )
    state.vector.shapeCenterX = centerX + canvas.currentLayer.x
    state.vector.shapeCenterY = centerY + canvas.currentLayer.y
    //reset vectorGui mother object
    vectorGui.mother.newRotation = 0
    vectorGui.mother.currentRotation = 0
  }
}

/**
 *
 * @param {number} vectorIndex - The vector index
 */
export function actionDeselectVector(vectorIndex) {
  if (state.vector.selectedIndices.has(vectorIndex)) {
    state.vector.removeSelected(vectorIndex)
    if (state.vector.selectedIndices.size === 0) {
      dom.vectorTransformUIContainer.style.display = "none"
      state.deselect()
    } else if (state.vector.selectedIndices.size > 0) {
      if (state.vector.transformMode === SCALE) {
        setVectorShapeBoundaryBox()
      }
    }
    addToTimeline({
      tool: tools.select.name,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
      },
    })
    state.clearRedoStack()
    //Update shape center
    const [centerX, centerY] = findVectorShapeCentroid(
      state.vector.selectedIndices,
      state.vector.all
    )
    state.vector.shapeCenterX = centerX + canvas.currentLayer.x
    state.vector.shapeCenterY = centerY + canvas.currentLayer.y
    //reset vectorGui mother object
    vectorGui.mother.newRotation = 0
    vectorGui.mother.currentRotation = 0
  }
}

/**
 * Deselect
 * Not dependent on pointer events
 * Conditions: Layer is not a preview layer, and there is a selection
 */
export function actionDeselect() {
  if (
    !canvas.currentLayer.isPreview &&
    (state.selection.boundaryBox.xMax !== null ||
      state.vector.selectedIndices.size > 0 ||
      state.vector.currentIndex !== null)
  ) {
    state.deselect()
    addToTimeline({
      tool: tools.select.name,
      layer: canvas.currentLayer,
      properties: {},
    })

    state.clearRedoStack()
    vectorGui.render()
    renderVectorsToDOM()
  }
}

/**
 *
 */
export function actionDeleteSelection() {
  //1. check for selected raster or vector
  //2. if raster, cut selection passing false to not copy to clipboard
  //3. if vector, mark selected vectors as removed
  actionCutSelection(false)
}
