import { globalState } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { tools } from '../../Tools/index.js'
import { vectorGui } from '../../GUI/vector.js'
import { addToTimeline } from '../undoRedo/undoRedo.js'
import { renderCanvas } from '../../Canvas/render.js'
import {
  updateActiveLayerState,
  removeTempLayer,
} from '../../DOM/render.js'
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
 * Cut Selection
 * Not dependent on pointer events
 * Conditions: Layer is a raster layer, layer is not a preview layer, and there is a selection
 * @param {boolean} copyToClipboard - Whether to copy the selection to the clipboard (delete action doesn't copy)
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
      //correct boundary box for layer offset
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
 * Paste Selection
 * Not dependent on pointer events
 * Action will not fire if there is no selection in the clipboard,
 * the current layer is not a raster layer, or if the current layer is a preview layer
 * Always uses the state clipboard for pasting, which is the last clipboard used for copying or cutting
 * Conditions: Layer is a raster layer, layer is not a preview layer, and there is something in the clipboard to be pasted
 */
export function actionPasteSelection() {
  if (
    canvas.currentLayer.type === 'raster' &&
    !canvas.currentLayer.isPreview &&
    (globalState.clipboard.select.canvas ||
      Object.keys(globalState.clipboard.select.vectors).length > 0)
  ) {
    //if globalState.clipboard.select.canvas, run pasteSelectedPixels
    //Compute layer-relative coords by subtracting the layer offset AT COPY TIME (not now).
    //This keeps the paste anchored to the same layer-relative position as the copied pixels,
    //so moving the layer between copy and paste shifts the paste with the content.
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
      //correct offset coords for vectors to make agnostic to layer coords
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
 * Confirm Pasted Pixels
 * Not dependent on pointer events
 * Action will not fire if the current layer is not a raster layer
 * or if there is no selection in the clipboard
 * clipboard used is from last paste action in order to decouple from the state clipboard, which may be empty when using undo/redo to go to an unconfirmed paste action.
 * Alternatively, the state clipboard may have other content which the user should not have overridden without them explicitly copying the new content.
 * Conditions: Layer is a raster layer, and the most recent paste action is unconfirmed
 */
export function actionConfirmPastedPixels() {
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
    //create copy of current canvas
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
    //adjust boundaryBox for layer offset
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
 * Copy Selection to clipboard
 * Not dependent on pointer events
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
