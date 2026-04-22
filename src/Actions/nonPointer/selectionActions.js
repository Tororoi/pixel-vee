import { globalState } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { tools } from '../../Tools/index.js'
import { vectorGui } from '../../GUI/vector.js'
import { addToTimeline } from '../undoRedo/undoRedo.js'

import { findVectorShapeCentroid } from '../../utils/vectorTransformHelpers.js'
import { dom } from '../../Context/dom.js'
import { SCALE } from '../../utils/constants.js'
import { setVectorShapeBoundaryBox } from '../../GUI/transform.js'
import { actionCutSelection } from './clipboardActions.js'

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
  if (canvas.currentLayer.type === 'raster' && !canvas.currentLayer.isPreview) {
    globalState.deselect()
    //set initial properties
    globalState.selection.properties.px1 = 0
    globalState.selection.properties.py1 = 0
    globalState.selection.properties.px2 = canvas.currentLayer.cvs.width
    globalState.selection.properties.py2 = canvas.currentLayer.cvs.height
    globalState.selection.setBoundaryBox(globalState.selection.properties)
    addToTimeline({
      tool: tools.select.name,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
      },
    })
    globalState.clearRedoStack()
    vectorGui.render()
  }
}

/**
 *
 * @param {number} vectorIndex - The vector index
 */
export function actionSelectVector(vectorIndex) {
  if (!globalState.vector.selectedIndices.has(vectorIndex)) {
    globalState.vector.addSelected(vectorIndex)
    globalState.ui.vectorTransformOpen = true
    if (dom.vectorTransformUIContainer)
      dom.vectorTransformUIContainer.style.display = 'flex'
    if (globalState.vector.transformMode === SCALE) {
      setVectorShapeBoundaryBox()
    }
    addToTimeline({
      tool: tools.select.name,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
      },
    })
    globalState.clearRedoStack()
    //Update shape center
    const [centerX, centerY] = findVectorShapeCentroid(
      globalState.vector.selectedIndices,
      globalState.vector.all,
    )
    globalState.vector.shapeCenterX = centerX + canvas.currentLayer.x
    globalState.vector.shapeCenterY = centerY + canvas.currentLayer.y
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
  if (globalState.vector.selectedIndices.has(vectorIndex)) {
    globalState.vector.removeSelected(vectorIndex)
    if (globalState.vector.selectedIndices.size === 0) {
      globalState.ui.vectorTransformOpen = false
      if (dom.vectorTransformUIContainer)
        dom.vectorTransformUIContainer.style.display = 'none'
      globalState.deselect()
    } else if (globalState.vector.selectedIndices.size > 0) {
      if (globalState.vector.transformMode === SCALE) {
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
    globalState.clearRedoStack()
    //Update shape center
    const [centerX, centerY] = findVectorShapeCentroid(
      globalState.vector.selectedIndices,
      globalState.vector.all,
    )
    globalState.vector.shapeCenterX = centerX + canvas.currentLayer.x
    globalState.vector.shapeCenterY = centerY + canvas.currentLayer.y
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
    (globalState.selection.boundaryBox.xMax !== null ||
      globalState.vector.selectedIndices.size > 0 ||
      globalState.vector.currentIndex !== null)
  ) {
    globalState.deselect()
    addToTimeline({
      tool: tools.select.name,
      layer: canvas.currentLayer,
      properties: {},
    })

    globalState.clearRedoStack()
    vectorGui.render()
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
