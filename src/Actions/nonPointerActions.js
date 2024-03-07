import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { createRasterLayer, createReferenceLayer } from "../Canvas/layers.js"
import { renderCanvas } from "../Canvas/render.js"
import { renderLayersToDOM, renderVectorsToDOM } from "../DOM/render.js"
import {
  confirmPastedPixels,
  cutSelectedPixels,
  pasteSelectedPixels,
} from "../Menu/edit.js"
import { switchTool } from "../Tools/toolbox.js"
import { removeTempLayerFromDOM } from "../DOM/renderLayers.js"
import {
  disableActionsForPaste,
  enableActionsForNoPaste,
} from "../DOM/disableDomElements.js"

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
    state.selectProperties.px1 = 0
    state.selectProperties.py1 = 0
    state.selectProperties.px2 = canvas.currentLayer.cvs.width
    state.selectProperties.py2 = canvas.currentLayer.cvs.height
    state.setBoundaryBox(state.selectProperties)
    addToTimeline({
      tool: tools.select,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
        invertSelection: state.selectionInversed,
        selectProperties: { ...state.selectProperties },
      },
    })
    state.action = null
    state.redoStack = []
    vectorGui.render()
  }
}

/**
 * Deselect
 * Not dependent on pointer events
 * Conditions: Layer is not a preview layer, and there is a selection
 */
export function actionDeselect() {
  console.log("deselect", state.currentVectorIndex)
  if (
    !canvas.currentLayer.isPreview &&
    (state.boundaryBox.xMax !== null || state.currentVectorIndex !== null)
  ) {
    // let maskArray = coordArrayFromSet(
    //   state.maskSet,
    //   canvas.currentLayer.x,
    //   canvas.currentLayer.y
    // )
    addToTimeline({
      tool: tools.select,
      layer: canvas.currentLayer,
      properties: {
        deselect: true,
        invertSelection: state.selectionInversed,
        selectProperties: { ...state.selectProperties },
        // vectorIndex: state.currentVectorIndex, //should be for all selected vectors
        // maskArray,
      },
    })
    console.log("deselect")
    state.action = null
    state.redoStack = []
    state.deselect()
    vectorGui.render()
    renderVectorsToDOM()
    canvas.rasterGuiCTX.clearRect(
      0,
      0,
      canvas.rasterGuiCVS.width,
      canvas.rasterGuiCVS.height
    )
  }
}

/**
 * Invert Selection
 * Not dependent on pointer events
 * Conditions: Layer is a raster layer, layer is not a preview layer, and there is a selection
 */
export function actionInvertSelection() {
  if (
    canvas.currentLayer.type === "raster" &&
    !canvas.currentLayer.isPreview &&
    state.boundaryBox.xMax !== null
  ) {
    addToTimeline({
      tool: tools.select,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
        invertSelection: !state.selectionInversed,
        selectProperties: { ...state.selectProperties },
      },
    })
    state.action = null
    state.redoStack = []
    state.invertSelection()
    vectorGui.render()
  }
}

/**
 * Cut Selection
 * Not dependent on pointer events
 * Conditions: Layer is a raster layer, layer is not a preview layer, and there is a selection
 */
export function actionCutSelection() {
  if (
    canvas.currentLayer.type === "raster" &&
    !canvas.currentLayer.isPreview &&
    state.boundaryBox.xMax !== null
  ) {
    cutSelectedPixels()
    //correct boundary box for layer offset
    const boundaryBox = { ...state.boundaryBox }
    if (boundaryBox.xMax !== null) {
      boundaryBox.xMin -= canvas.currentLayer.x
      boundaryBox.xMax -= canvas.currentLayer.x
      boundaryBox.yMin -= canvas.currentLayer.y
      boundaryBox.yMax -= canvas.currentLayer.y
    }
    addToTimeline({
      tool: tools.cut,
      layer: canvas.currentLayer,
      properties: {
        selectionInversed: state.selectionInversed,
        boundaryBox,
      },
    })
    state.action = null
    state.redoStack = []
    renderCanvas(canvas.currentLayer)
    vectorGui.render()
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
    canvas.currentLayer.type === "raster" &&
    !canvas.currentLayer.isPreview &&
    (state.selectClipboard.canvas ||
      Object.keys(state.selectClipboard.vectors).length > 0)
  ) {
    //if state.selectClipboard.canvas, run pasteSelectedPixels
    // Store whether selection was active before paste action
    let prePasteSelectProperties = { ...state.selectProperties }
    let prePasteInvertSelection = state.selectionInversed
    //paste selected pixels
    pasteSelectedPixels(state.selectClipboard, canvas.currentLayer)
    //adjust boundaryBox for layer offset
    const boundaryBox = { ...state.selectClipboard.boundaryBox }
    if (boundaryBox.xMax !== null) {
      boundaryBox.xMin -= canvas.currentLayer.x
      boundaryBox.xMax -= canvas.currentLayer.x
      boundaryBox.yMin -= canvas.currentLayer.y
      boundaryBox.yMax -= canvas.currentLayer.y
    }
    const selectProperties = {
      ...state.selectClipboard.selectProperties,
    }
    if (selectProperties.px2 !== null) {
      selectProperties.px1 -= canvas.currentLayer.x
      selectProperties.px2 -= canvas.currentLayer.x
      selectProperties.py1 -= canvas.currentLayer.y
      selectProperties.py2 -= canvas.currentLayer.y
    }
    //Make deep copy of clipboard vectors:
    const clipboardVectors = JSON.parse(
      JSON.stringify(state.selectClipboard.vectors)
    )
    if (Object.keys(clipboardVectors).length !== 0) {
      //correct offset coords for vectors to make agnostic to layer coords
      for (const [vectorIndex, vector] of Object.entries(clipboardVectors)) {
        vector.layer = canvas.currentLayer
        vector.vectorProperties.px1 += canvas.currentLayer.x
        vector.vectorProperties.py1 += canvas.currentLayer.y
        vector.vectorProperties.px2 += canvas.currentLayer.x
        vector.vectorProperties.py2 += canvas.currentLayer.y
        vector.vectorProperties.px3 += canvas.currentLayer.x
        vector.vectorProperties.py3 += canvas.currentLayer.y
        vector.vectorProperties.px4 += canvas.currentLayer.x
        vector.vectorProperties.py4 += canvas.currentLayer.y
        //update vector index and action index
        state.highestVectorKey += 1
        let uniqueVectorKey = state.highestVectorKey
        vector.index = uniqueVectorKey
        vector.actionIndex = state.undoStack.length
        delete clipboardVectors[vectorIndex] // Remove old key-value pair
        clipboardVectors[uniqueVectorKey] = vector // Assign vector to new key
        //add to state.vectors
        state.vectors[uniqueVectorKey] = vector
      }
    }
    //add to timeline
    addToTimeline({
      tool:
        Object.keys(state.selectClipboard.vectors).length === 0
          ? tools.paste
          : tools.vectorPaste,
      layer: canvas.currentLayer,
      properties: {
        confirmed: false,
        prePasteInvertSelection,
        prePasteSelectProperties,
        boundaryBox,
        selectProperties,
        invertSelection: state.selectionInversed,
        canvas: state.selectClipboard.canvas,
        canvasProperties: {
          dataUrl: state.selectClipboard.canvas?.toDataURL(),
          width: state.selectClipboard.canvas?.width,
          height: state.selectClipboard.canvas?.height,
        },
        vectorIndices: Object.keys(clipboardVectors),
        // vectors: clipboardVectors,
        pastedLayer: canvas.pastedLayer, //important to know intended target layer for pasting, will be used by undo/redo
      },
    })
    state.action = null
    state.redoStack = []

    renderCanvas(canvas.currentLayer)
    renderLayersToDOM()
    switchTool("move")
    disableActionsForPaste()
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
  for (let i = state.undoStack.length - 1; i >= 0; i--) {
    if (
      (state.undoStack[i].tool.name === "paste" ||
        state.undoStack[i].tool.name === "vectorPaste") &&
      !state.undoStack[i].confirmed
    ) {
      lastPasteAction = state.undoStack[i]
      break // Stop searching once the first 'paste' action is found
    }
  }
  if (canvas.currentLayer.type === "raster" && lastPasteAction) {
    const xOffset = canvas.tempLayer.x
    const yOffset = canvas.tempLayer.y
    //adjust boundaryBox for layer offset
    const boundaryBox = { ...lastPasteAction.boundaryBox }
    if (boundaryBox.xMax !== null) {
      boundaryBox.xMin += xOffset - canvas.pastedLayer.x
      boundaryBox.xMax += xOffset - canvas.pastedLayer.x
      boundaryBox.yMin += yOffset - canvas.pastedLayer.y
      boundaryBox.yMax += yOffset - canvas.pastedLayer.y
    }
    const selectProperties = { ...lastPasteAction.selectProperties }
    if (selectProperties.px2 !== null) {
      selectProperties.px1 += xOffset - canvas.pastedLayer.x
      selectProperties.px2 += xOffset - canvas.pastedLayer.x
      selectProperties.py1 += yOffset - canvas.pastedLayer.y
      selectProperties.py2 += yOffset - canvas.pastedLayer.y
    }
    let clipboardVectors = {}
    if (lastPasteAction.vectorIndices) {
      lastPasteAction.vectorIndices.forEach((vectorIndex) => {
        clipboardVectors[vectorIndex] = state.vectors[vectorIndex]
      })
      //Make deep copy of clipboard vectors:
      clipboardVectors = JSON.parse(JSON.stringify(clipboardVectors))
      //correct offset coords for vectors to make agnostic to layer coords
      for (const [vectorIndex, vector] of Object.entries(clipboardVectors)) {
        vector.layer = canvas.pastedLayer
        vector.vectorProperties.px1 += xOffset - canvas.pastedLayer.x
        vector.vectorProperties.py1 += yOffset - canvas.pastedLayer.y
        vector.vectorProperties.px2 += xOffset - canvas.pastedLayer.x
        vector.vectorProperties.py2 += yOffset - canvas.pastedLayer.y
        vector.vectorProperties.px3 += xOffset - canvas.pastedLayer.x
        vector.vectorProperties.py3 += yOffset - canvas.pastedLayer.y
        vector.vectorProperties.px4 += xOffset - canvas.pastedLayer.x
        vector.vectorProperties.py4 += yOffset - canvas.pastedLayer.y
        //update vector index and action index
        state.highestVectorKey += 1
        let uniqueVectorKey = state.highestVectorKey
        vector.index = uniqueVectorKey
        vector.actionIndex = state.undoStack.length
        delete clipboardVectors[vectorIndex] // Remove old key-value pair
        clipboardVectors[uniqueVectorKey] = vector // Assign vector to new key
        //add to state.vectors
        state.vectors[uniqueVectorKey] = vector
      }
    }
    confirmPastedPixels(lastPasteAction, canvas.pastedLayer, xOffset, yOffset)
    //remove temp layer from DOM and restore current layer
    removeTempLayerFromDOM()
    //add to timeline
    addToTimeline({
      tool:
        Object.keys(state.selectClipboard.vectors).length === 0
          ? tools.paste
          : tools.vectorPaste,
      layer: canvas.currentLayer,
      properties: {
        confirmed: true,
        boundaryBox,
        selectProperties,
        invertSelection: lastPasteAction.invertSelection,
        canvas: lastPasteAction.canvas,
        canvasProperties: {
          dataUrl: lastPasteAction.canvas?.toDataURL(),
          width: lastPasteAction.canvas?.width,
          height: lastPasteAction.canvas?.height,
        },
        vectorIndices: Object.keys(clipboardVectors),
        // vectors: clipboardVectors,
      },
    })
    state.action = null
    state.redoStack = []
    //render
    vectorGui.render()
    renderCanvas()
    renderLayersToDOM()
    renderVectorsToDOM()
    enableActionsForNoPaste()
  }
}

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
          tool: tools.addLayer,
          layer,
        })
        state.action = null
        state.redoStack = []
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
    tool: tools.addLayer,
    layer,
  })
  state.action = null
  state.redoStack = []
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
      canvas.currentLayer = canvas.layers.find(
        (l) => l.type === "raster" && !l.removed
      )
      vectorGui.reset()
    }
    addToTimeline({
      tool: tools.removeLayer,
      layer,
    })
    state.action = null
    state.redoStack = []
    renderLayersToDOM()
    renderVectorsToDOM()
  }
}
