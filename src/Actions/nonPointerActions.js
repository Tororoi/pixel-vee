import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { renderCanvas } from "../Canvas/render.js"
import { renderLayersToDOM, renderVectorsToDOM } from "../DOM/render.js"
import {
  confirmPastedPixels,
  copySelectedVectors,
  cutSelectedPixels,
  pasteSelectedPixels,
} from "../Menu/edit.js"
import { switchTool } from "../Tools/toolbox.js"
import { removeTempLayerFromDOM } from "../DOM/renderLayers.js"
import {
  disableActionsForPaste,
  enableActionsForNoPaste,
  enableActionsForSelection,
} from "../DOM/disableDomElements.js"
import { findVectorShapeCentroid } from "../utils/vectorHelpers.js"
import { dom } from "../Context/dom.js"
import { SCALE } from "../utils/constants.js"
import { setVectorShapeBoundaryBox } from "../GUI/transform.js"

//=============================================//
//====== * * * Non Pointer Actions * * * ======//
//=============================================//

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
 * Cut Selection
 * Not dependent on pointer events
 * Conditions: Layer is a raster layer, layer is not a preview layer, and there is a selection
 * @param {boolean} copyToClipboard - Whether to copy the selection to the clipboard (delete action doesn't copy)
 */
export function actionCutSelection(copyToClipboard = true) {
  if (
    canvas.currentLayer.type === "raster" &&
    !canvas.currentLayer.isPreview &&
    (state.selection.boundaryBox.xMax !== null ||
      state.vector.currentIndex !== null ||
      state.vector.selectedIndices.size > 0)
  ) {
    if (state.selection.boundaryBox.xMax !== null) {
      //Cut raster content
      cutSelectedPixels(copyToClipboard)
      //correct boundary box for layer offset
      const boundaryBox = { ...state.selection.boundaryBox }
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

      state.clearRedoStack()
      renderCanvas(canvas.currentLayer)
      vectorGui.render()
    } else if (
      state.vector.currentIndex !== null ||
      state.vector.selectedIndices.size > 0
    ) {
      //Cut selected vectors (mark as removed)
      if (copyToClipboard) {
        copySelectedVectors()
      }
      let vectorIndices = []
      if (state.vector.selectedIndices.size > 0) {
        state.vector.selectedIndices.forEach((vectorIndex) => {
          state.vector.all[vectorIndex].removed = true
        })
        vectorIndices = Array.from(state.vector.selectedIndices)
      } else {
        state.vector.all[state.vector.currentIndex].removed = true
        vectorIndices = [state.vector.currentIndex]
      }
      state.deselect()
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

      state.clearRedoStack()
      vectorGui.render()
      renderVectorsToDOM()
    }
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
    canvas.currentLayer.type === "raster" &&
    !canvas.currentLayer.isPreview &&
    (state.clipboard.select.canvas ||
      Object.keys(state.clipboard.select.vectors).length > 0)
  ) {
    //if state.clipboard.select.canvas, run pasteSelectedPixels
    //Compute layer-relative coords by subtracting the layer offset AT COPY TIME (not now).
    //This keeps the paste anchored to the same layer-relative position as the copied pixels,
    //so moving the layer between copy and paste shifts the paste with the content.
    const clipboardLayerX = state.clipboard.select.layerX ?? 0
    const clipboardLayerY = state.clipboard.select.layerY ?? 0
    const boundaryBox = { ...state.clipboard.select.boundaryBox }
    if (boundaryBox.xMax !== null) {
      boundaryBox.xMin -= clipboardLayerX
      boundaryBox.xMax -= clipboardLayerX
      boundaryBox.yMin -= clipboardLayerY
      boundaryBox.yMax -= clipboardLayerY
    }
    const selectProperties = {
      ...state.clipboard.select.selectProperties,
    }
    if (selectProperties.px2 !== null) {
      selectProperties.px1 -= clipboardLayerX
      selectProperties.px2 -= clipboardLayerX
      selectProperties.py1 -= clipboardLayerY
      selectProperties.py2 -= clipboardLayerY
    }
    if (state.clipboard.select.canvas) {
      //paste selected pixels (creates temporary canvas layer for pasting)
      //Pass adjusted clipboard and current layer offset so the live paste draws at the
      //correct canvas position (layer-relative + current layer.x = canvas position)
      const adjustedClipboard = {
        ...state.clipboard.select,
        boundaryBox,
        selectProperties,
      }
      pasteSelectedPixels(adjustedClipboard, canvas.currentLayer, canvas.currentLayer.x, canvas.currentLayer.y)
      let uniquePastedImageKey = null
      if (state.clipboard.select.canvas) {
        state.clipboard.highestPastedImageKey += 1
        uniquePastedImageKey = state.clipboard.highestPastedImageKey
      }
      if (state.clipboard.select.imageData) {
        state.clipboard.pastedImages[uniquePastedImageKey] = {
          imageData: state.clipboard.select.imageData,
        }
        state.clipboard.currentPastedImageKey = uniquePastedImageKey
      }
      //clear any selected vectors
      state.vector.clearSelected()
      dom.vectorTransformUIContainer.style.display = "none"
      //add to timeline
      addToTimeline({
        tool: tools.paste.name,
        layer: canvas.currentLayer,
        properties: {
          confirmed: false,
          boundaryBox,
          selectProperties,
          pastedImageKey: uniquePastedImageKey,
          canvas: state.clipboard.select.canvas,
          canvasProperties: {
            dataUrl: state.clipboard.select.canvas?.toDataURL(),
            width: state.clipboard.select.canvas?.width,
            height: state.clipboard.select.canvas?.height,
          },
          pastedLayer: canvas.pastedLayer, //important to know intended target layer for pasting, will be used by undo/redo
        },
      })

      state.clearRedoStack()

      renderCanvas(canvas.currentLayer)
      switchTool("move") //TODO: (Medium Priority) Instead of move tool being selected, automatically use temporary transform tool which is not in the toolbox.
      renderLayersToDOM()
      renderVectorsToDOM()
      disableActionsForPaste()
    } else if (Object.keys(state.clipboard.select.vectors).length > 0) {
      //Make deep copy of clipboard vectors:
      const clipboardVectors = JSON.parse(
        JSON.stringify(state.clipboard.select.vectors)
      )
      //correct offset coords for vectors to make agnostic to layer coords
      for (const [vectorIndex, vector] of Object.entries(clipboardVectors)) {
        vector.layer = canvas.currentLayer
        //update vector index and action index
        const uniqueVectorKey = state.vector.nextKey()
        vector.index = uniqueVectorKey
        delete clipboardVectors[vectorIndex] // Remove old key-value pair
        clipboardVectors[uniqueVectorKey] = vector // Assign vector to new key
        //add to state.vector.all
        state.vector.all[uniqueVectorKey] = vector
      }
      state.vector.clearSelected()
      const vectorIndices = Object.keys(clipboardVectors)
      vectorIndices.forEach((vectorIndex) => {
        state.vector.addSelected(parseInt(vectorIndex))
      })
      if (state.vector.selectedIndices.size > 0) {
        dom.vectorTransformUIContainer.style.display = "flex"
        if (state.vector.transformMode === SCALE) {
          setVectorShapeBoundaryBox()
        }
      } else {
        dom.vectorTransformUIContainer.style.display = "none"
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
        state.vector.all[vectorIndex].action = state.timeline.currentAction
      })
      state.clearRedoStack()
      renderCanvas(canvas.currentLayer, true) //Must occur after adding to timeline. Once direct render is implemented, render canvas can be before add to timeline
      renderLayersToDOM()
      renderVectorsToDOM()
      enableActionsForSelection()
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
  for (let i = state.timeline.undoStack.length - 1; i >= 0; i--) {
    if (state.timeline.undoStack[i].tool === "paste" && !state.timeline.undoStack[i].confirmed) {
      lastPasteAction = state.timeline.undoStack[i]
      break // Stop searching once the first 'paste' action is found
    }
  }
  if (canvas.currentLayer.type === "raster" && lastPasteAction) {
    const xOffset = canvas.tempLayer.x
    const yOffset = canvas.tempLayer.y
    const boundaryBox = { ...state.selection.boundaryBox }
    const selectProperties = { ...state.selection.properties }
    //create copy of current canvas
    const confirmedCanvas = document.createElement("canvas")
    confirmedCanvas.width = boundaryBox.xMax - boundaryBox.xMin
    confirmedCanvas.height = boundaryBox.yMax - boundaryBox.yMin
    const confirmedCTX = confirmedCanvas.getContext("2d")
    confirmedCTX.drawImage(
      canvas.currentLayer.cvs,
      boundaryBox.xMin,
      boundaryBox.yMin,
      confirmedCanvas.width,
      confirmedCanvas.height,
      0,
      0,
      confirmedCanvas.width,
      confirmedCanvas.height
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
    removeTempLayerFromDOM()
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
        pastedImageKey: state.clipboard.currentPastedImageKey, //needed for reference on undo?
        canvas: confirmedCanvas,
        canvasProperties: {
          dataUrl: confirmedCanvas?.toDataURL(),
          width: confirmedCanvas?.width,
          height: confirmedCanvas?.height,
        },
      },
    })
    state.clearRedoStack()
    //Reset transform properties
    state.clipboard.currentPastedImageKey = null
    state.transform.rotationDegrees = 0
    state.transform.isMirroredHorizontally = false
    state.transform.isMirroredVertically = false
    //render
    vectorGui.render()
    renderCanvas(canvas.currentLayer)
    renderLayersToDOM()
    renderVectorsToDOM()
    enableActionsForNoPaste()
  }
}
