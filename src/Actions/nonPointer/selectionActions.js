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
 * Select the entire drawable area of the current raster layer.
 *
 * Sets the selection boundary to cover every pixel on the layer canvas
 * (0,0 to canvas width/height), clears any existing selection first, and
 * records a timeline entry so the action can be undone.
 *
 * Preconditions: no paste in progress, current layer must be a non-preview
 * raster layer.
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
 * Add a vector to the active selection set.
 *
 * If the vector is not already selected, it is added to
 * `globalState.vector.selectedIndices` and the transform UI panel is shown.
 * In SCALE transform mode the bounding box is recalculated to include the
 * newly added vector. The shape centroid is also recalculated so that
 * rotation and scale operations use the correct geometric center.
 * @param {number} vectorIndex - The index into `globalState.vector.all` of
 *   the vector to add to the selection.
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
    // Recompute the centroid with the newly added vector included so that
    // rotation and scale transforms pivot around the correct center point.
    const [centerX, centerY] = findVectorShapeCentroid(
      globalState.vector.selectedIndices,
      globalState.vector.all,
    )
    globalState.vector.shapeCenterX = centerX + canvas.currentLayer.x
    globalState.vector.shapeCenterY = centerY + canvas.currentLayer.y
    // Reset rotation tracking so the next drag starts from a clean angle.
    vectorGui.mother.newRotation = 0
    vectorGui.mother.currentRotation = 0
  }
}

/**
 * Remove a vector from the active selection set.
 *
 * If the vector is currently selected, it is removed from
 * `globalState.vector.selectedIndices`. When the selection set becomes
 * empty the transform UI panel is hidden and the full selection is cleared.
 * If vectors remain selected in SCALE mode the bounding box is recalculated
 * to exclude the deselected vector. The shape centroid is updated either way.
 * @param {number} vectorIndex - The index into `globalState.vector.all` of
 *   the vector to remove from the selection.
 */
export function actionDeselectVector(vectorIndex) {
  if (globalState.vector.selectedIndices.has(vectorIndex)) {
    globalState.vector.removeSelected(vectorIndex)
    if (globalState.vector.selectedIndices.size === 0) {
      // No vectors remain selected — hide the transform UI entirely.
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
    // Recompute the centroid without the deselected vector so transforms
    // remain anchored to the correct center of the remaining selection.
    const [centerX, centerY] = findVectorShapeCentroid(
      globalState.vector.selectedIndices,
      globalState.vector.all,
    )
    globalState.vector.shapeCenterX = centerX + canvas.currentLayer.x
    globalState.vector.shapeCenterY = centerY + canvas.currentLayer.y
    vectorGui.mother.newRotation = 0
    vectorGui.mother.currentRotation = 0
  }
}

/**
 * Clear the current pixel or vector selection.
 *
 * Resets `globalState.selection` and clears any active vector selection
 * indices, then records a select timeline entry. The canvas is re-rendered
 * to remove any selection overlay indicators.
 *
 * Preconditions: current layer must not be a preview layer and there must
 * be an active selection (boundary box, selected vector indices, or a
 * current vector index).
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
 * Delete the current pixel or vector selection without copying it.
 *
 * Delegates to `actionCutSelection` with `copyToClipboard = false` so the
 * selected content is erased but the clipboard is left unchanged.
 */
export function actionDeleteSelection() {
  //1. check for selected raster or vector
  //2. if raster, cut selection passing false to not copy to clipboard
  //3. if vector, mark selected vectors as removed
  actionCutSelection(false)
}
