import { globalState } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { tools } from '../../Tools/index.js'
import { vectorGui } from '../../GUI/vector.js'
import { addToTimeline } from '../undoRedo/undoRedo.js'
import { renderCanvas } from '../../Canvas/render.js'
import { updateActiveLayerState, removeTempLayer } from '../../DOM/render.js'
import {
  confirmPastedPixels,
  copySelectedPixels,
  copySelectedVectors,
  cutSelectedPixels,
  pasteSelectedPixels,
} from '../../Menu/edit.js'
import { switchTool } from '../../Tools/toolbox.js'
import { dom } from '../../Context/dom.js'
import { SCALE } from '../../utils/constants.js'
import { setVectorShapeBoundaryBox } from '../../GUI/transform.js'

//=============================================//
//=========== * * * Clipboard * * * ===========//
//=============================================//

/**
 * Cut the current selection from the active raster layer.
 *
 * Handles both raster pixel selections and vector selections:
 *  - Raster: erases pixels within the boundary box and, if
 *    `copyToClipboard` is true, copies them to the state clipboard.
 *    The boundary box is adjusted to be layer-relative before being
 *    recorded in the timeline so it remains correct if the layer moves.
 *  - Vector: marks selected vectors as removed and, if `copyToClipboard`
 *    is true, serializes them to the clipboard.
 *
 * Preconditions: current layer must be a non-preview raster layer and
 * there must be an active pixel selection, a current vector, or at least
 * one selected vector index.
 * @param {boolean} [copyToClipboard=true] - Pass `false` to delete the
 *   selection without copying it (used by the Delete key action).
 */
export function actionCutSelection(copyToClipboard = true) {
  if (
    canvas.currentLayer.type === 'raster' &&
    !canvas.currentLayer.isPreview &&
    (globalState.selection.boundaryBox.xMax !== null ||
      globalState.vector.currentIndex !== null ||
      globalState.vector.selectedIndices.size > 0)
  ) {
    if (globalState.selection.boundaryBox.xMax !== null) {
      //Cut raster content
      cutSelectedPixels(copyToClipboard)
      // Store layer-relative coords so the action is portable if the
      // layer is later moved before an undo/redo is triggered.
      const boundaryBox = { ...globalState.selection.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin -= canvas.currentLayer.x
        boundaryBox.xMax -= canvas.currentLayer.x
        boundaryBox.yMin -= canvas.currentLayer.y
        boundaryBox.yMax -= canvas.currentLayer.y
      }
      addToTimeline({
        tool: tools.cut.name,
        layer: canvas.currentLayer,
        properties: {
          boundaryBox,
          originalLayerX: canvas.currentLayer.x,
          originalLayerY: canvas.currentLayer.y,
        },
      })

      globalState.clearRedoStack()
      renderCanvas(canvas.currentLayer)
      vectorGui.render()
    } else if (
      globalState.vector.currentIndex !== null ||
      globalState.vector.selectedIndices.size > 0
    ) {
      //Cut selected vectors (mark as removed)
      if (copyToClipboard) {
        copySelectedVectors()
      }
      let vectorIndices = []
      if (globalState.vector.selectedIndices.size > 0) {
        globalState.vector.selectedIndices.forEach((vectorIndex) => {
          globalState.vector.all[vectorIndex].removed = true
        })
        vectorIndices = Array.from(globalState.vector.selectedIndices)
      } else {
        globalState.vector.all[globalState.vector.currentIndex].removed = true
        vectorIndices = [globalState.vector.currentIndex]
      }
      globalState.deselect()
      renderCanvas(canvas.currentLayer, true)
      addToTimeline({
        tool: tools.remove.name,
        layer: canvas.currentLayer,
        properties: {
          vectorIndices,
          from: false,
          to: true,
        },
      })

      globalState.clearRedoStack()
      vectorGui.render()
    }
  }
}

/**
 * Paste the contents of the state clipboard onto the current raster layer.
 *
 * Handles two clipboard formats:
 *  - Pixel clipboard (`globalState.clipboard.select.canvas`): creates a
 *    temporary floating canvas layer so the user can reposition the pasted
 *    content before confirming. The paste is stored as unconfirmed in the
 *    timeline until `actionConfirmPastedPixels` is called.
 *  - Vector clipboard (`globalState.clipboard.select.vectors`): deep-copies
 *    the serialized vectors, assigns them new unique indices, adds them to
 *    `globalState.vector.all`, and records the paste as a timeline action.
 *
 * Boundary box and select-property coordinates are adjusted to be
 * layer-relative at the time of copy (using the layer offset that was
 * active when the content was copied) so that moving the layer between
 * copy and paste does not shift the pasted content unexpectedly.
 *
 * Preconditions: current layer must be a non-preview raster layer and
 * the clipboard must contain pixels or vectors.
 */
export function actionPasteSelection() {
  if (
    canvas.currentLayer.type === 'raster' &&
    !canvas.currentLayer.isPreview &&
    (globalState.clipboard.select.canvas ||
      Object.keys(globalState.clipboard.select.vectors).length > 0)
  ) {
    //if globalState.clipboard.select.canvas, run pasteSelectedPixels
    // Use the layer offset that was active at copy time so the paste lands
    // at the same layer-relative position regardless of where the layer is now.
    const clipboardLayerX = globalState.clipboard.select.layerX ?? 0
    const clipboardLayerY = globalState.clipboard.select.layerY ?? 0
    const boundaryBox = { ...globalState.clipboard.select.boundaryBox }
    if (boundaryBox.xMax !== null) {
      boundaryBox.xMin -= clipboardLayerX
      boundaryBox.xMax -= clipboardLayerX
      boundaryBox.yMin -= clipboardLayerY
      boundaryBox.yMax -= clipboardLayerY
    }
    const selectProperties = {
      ...globalState.clipboard.select.selectProperties,
    }
    if (selectProperties.px2 !== null) {
      selectProperties.px1 -= clipboardLayerX
      selectProperties.px2 -= clipboardLayerX
      selectProperties.py1 -= clipboardLayerY
      selectProperties.py2 -= clipboardLayerY
    }
    if (globalState.clipboard.select.canvas) {
      //paste selected pixels (creates temporary canvas layer for pasting)
      //Pass adjusted clipboard and current layer offset so the live paste draws at the
      //correct canvas position (layer-relative + current layer.x = canvas position)
      const adjustedClipboard = {
        ...globalState.clipboard.select,
        boundaryBox,
        selectProperties,
      }
      pasteSelectedPixels(
        adjustedClipboard,
        canvas.currentLayer,
        canvas.currentLayer.x,
        canvas.currentLayer.y,
      )
      // Assign a unique key to this paste so undo/redo can retrieve the
      // correct pixel snapshot even if multiple pastes occur in a session.
      let uniquePastedImageKey = null
      if (globalState.clipboard.select.canvas) {
        globalState.clipboard.highestPastedImageKey += 1
        uniquePastedImageKey = globalState.clipboard.highestPastedImageKey
      }
      if (globalState.clipboard.select.imageData) {
        globalState.clipboard.pastedImages[uniquePastedImageKey] = {
          imageData: globalState.clipboard.select.imageData,
        }
        globalState.clipboard.currentPastedImageKey = uniquePastedImageKey
      }
      //clear any selected vectors
      globalState.vector.clearSelected()
      globalState.ui.vectorTransformOpen = false
      if (dom.vectorTransformUIContainer)
        dom.vectorTransformUIContainer.style.display = 'none'
      //add to timeline
      addToTimeline({
        tool: tools.paste.name,
        layer: canvas.currentLayer,
        properties: {
          confirmed: false,
          boundaryBox,
          selectProperties,
          pastedImageKey: uniquePastedImageKey,
          canvas: globalState.clipboard.select.canvas,
          canvasProperties: {
            dataUrl: globalState.clipboard.select.canvas?.toDataURL(),
            width: globalState.clipboard.select.canvas?.width,
            height: globalState.clipboard.select.canvas?.height,
          },
          pastedLayer: canvas.pastedLayer, //important to know intended target layer for pasting, will be used by undo/redo
        },
      })

      globalState.clearRedoStack()

      renderCanvas(canvas.currentLayer)
      switchTool('move') //TODO: (Medium Priority) Instead of move tool being selected, automatically use temporary transform tool which is not in the toolbox.
      updateActiveLayerState()
    } else if (Object.keys(globalState.clipboard.select.vectors).length > 0) {
      //Make deep copy of clipboard vectors:
      const clipboardVectors = JSON.parse(
        JSON.stringify(globalState.clipboard.select.vectors),
      )
      // Re-key every pasted vector with a fresh unique index so it does not
      // collide with existing vectors from a prior copy or undo cycle.
      for (const [vectorIndex, vector] of Object.entries(clipboardVectors)) {
        vector.layer = canvas.currentLayer
        //update vector index and action index
        const uniqueVectorKey = globalState.vector.nextKey()
        vector.index = uniqueVectorKey
        delete clipboardVectors[vectorIndex] // Remove old key-value pair
        clipboardVectors[uniqueVectorKey] = vector // Assign vector to new key
        //add to globalState.vector.all
        globalState.vector.all[uniqueVectorKey] = vector
      }
      globalState.vector.clearSelected()
      const vectorIndices = Object.keys(clipboardVectors)
      vectorIndices.forEach((vectorIndex) => {
        globalState.vector.addSelected(parseInt(vectorIndex))
      })
      if (globalState.vector.selectedIndices.size > 0) {
        globalState.ui.vectorTransformOpen = true
        if (dom.vectorTransformUIContainer)
          dom.vectorTransformUIContainer.style.display = 'flex'
        if (globalState.vector.transformMode === SCALE) {
          setVectorShapeBoundaryBox()
        }
      } else {
        globalState.ui.vectorTransformOpen = false
        if (dom.vectorTransformUIContainer)
          dom.vectorTransformUIContainer.style.display = 'none'
      }
      //add to timeline
      addToTimeline({
        tool: tools.vectorPaste.name,
        layer: canvas.currentLayer,
        properties: {
          boundaryBox,
          selectProperties,
          vectorIndices,
        },
      })
      vectorIndices.forEach((vectorIndex) => {
        globalState.vector.all[vectorIndex].action =
          globalState.timeline.currentAction
      })
      globalState.clearRedoStack()
      renderCanvas(canvas.currentLayer, true) //Must occur after adding to timeline. Once direct render is implemented, render canvas can be before add to timeline
      updateActiveLayerState()
      vectorGui.render()
    }
  }
}

/**
 * Confirm and commit the active floating paste to the target raster layer.
 *
 * While a paste is unconfirmed, the pasted pixels live on a temporary canvas
 * layer (`canvas.tempLayer`) so the user can move them freely. Confirming
 * merges the visible pasted content into the permanent layer, removes the
 * temporary layer, and records the confirmed state in the timeline.
 *
 * The clipboard used here is derived from the most recent unconfirmed paste
 * action in the undo stack — NOT from the live state clipboard. This
 * decouples confirmation from whatever the user may have copied since then,
 * and ensures undo/redo restores the correct pixels.
 *
 * Transform state (rotation, mirror flags) is reset to defaults after
 * confirmation because the transformation has now been baked into pixels.
 *
 * Preconditions: current layer must be a raster layer and there must be
 * at least one unconfirmed paste action in the undo stack.
 */
export function actionConfirmPastedPixels() {
  // Walk the undo stack in reverse to find the most recent unconfirmed paste.
  let lastPasteAction = null
  for (let i = globalState.timeline.undoStack.length - 1; i >= 0; i--) {
    if (
      globalState.timeline.undoStack[i].tool === 'paste' &&
      !globalState.timeline.undoStack[i].confirmed
    ) {
      lastPasteAction = globalState.timeline.undoStack[i]
      break // Stop searching once the first 'paste' action is found
    }
  }
  if (canvas.currentLayer.type === 'raster' && lastPasteAction) {
    const xOffset = canvas.tempLayer.x
    const yOffset = canvas.tempLayer.y
    const boundaryBox = { ...globalState.selection.boundaryBox }
    const selectProperties = { ...globalState.selection.properties }
    // Capture the merged pixel content from the permanent layer canvas
    // so it can be restored accurately on undo.
    const confirmedCanvas = document.createElement('canvas')
    confirmedCanvas.width = boundaryBox.xMax - boundaryBox.xMin
    confirmedCanvas.height = boundaryBox.yMax - boundaryBox.yMin
    const confirmedCTX = confirmedCanvas.getContext('2d')
    confirmedCTX.drawImage(
      canvas.currentLayer.cvs,
      boundaryBox.xMin,
      boundaryBox.yMin,
      confirmedCanvas.width,
      confirmedCanvas.height,
      0,
      0,
      confirmedCanvas.width,
      confirmedCanvas.height,
    )
    // Convert to layer-relative coords before storing in the timeline so the
    // action remains correct if the layer is moved later.
    if (boundaryBox.xMax !== null) {
      boundaryBox.xMin -= canvas.pastedLayer.x
      boundaryBox.xMax -= canvas.pastedLayer.x
      boundaryBox.yMin -= canvas.pastedLayer.y
      boundaryBox.yMax -= canvas.pastedLayer.y
    }
    if (selectProperties.px2 !== null) {
      selectProperties.px1 -= canvas.pastedLayer.x
      selectProperties.px2 -= canvas.pastedLayer.x
      selectProperties.py1 -= canvas.pastedLayer.y
      selectProperties.py2 -= canvas.pastedLayer.y
    }
    const confirmedClipboard = {
      boundaryBox,
      selectProperties,
      canvas: confirmedCanvas,
    }
    confirmPastedPixels(confirmedClipboard, canvas.pastedLayer)
    //remove temp layer from DOM and restore current layer
    removeTempLayer()
    //add to timeline
    addToTimeline({
      tool: tools.paste.name,
      layer: canvas.currentLayer,
      properties: {
        confirmed: true,
        preConfirmXOffset: xOffset,
        preConfirmYOffset: yOffset,
        boundaryBox,
        selectProperties,
        pastedImageKey: globalState.clipboard.currentPastedImageKey, //needed for reference on undo?
        canvas: confirmedCanvas,
        canvasProperties: {
          dataUrl: confirmedCanvas?.toDataURL(),
          width: confirmedCanvas?.width,
          height: confirmedCanvas?.height,
        },
      },
    })
    globalState.clearRedoStack()
    //Reset transform properties
    globalState.clipboard.currentPastedImageKey = null
    globalState.transform.rotationDegrees = 0
    globalState.transform.isMirroredHorizontally = false
    globalState.transform.isMirroredVertically = false
    //render
    vectorGui.render()
    renderCanvas(canvas.currentLayer)
    updateActiveLayerState()
  }
}

/**
 * Copy the current pixel or vector selection to the state clipboard.
 *
 * Does not modify the canvas or timeline — copy is not an undoable action.
 * Delegates to `copySelectedPixels` for raster selections or
 * `copySelectedVectors` for vector selections.
 *
 * Preconditions: current layer must be a raster layer and there must be
 * either an active boundary-box selection, a current vector, or at least
 * one selected vector index.
 */
export function actionCopySelection() {
  if (
    canvas.currentLayer.type === 'raster' &&
    (globalState.selection.boundaryBox.xMax !== null ||
      globalState.vector.currentIndex !== null ||
      globalState.vector.selectedIndices.size > 0)
  ) {
    if (globalState.selection.boundaryBox.xMax !== null) {
      copySelectedPixels()
    } else {
      copySelectedVectors()
    }
  }
}
