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
    //reset selected vectors
    state.selectedVectorIndicesSet.clear()
    renderVectorsToDOM()
    //set initial properties
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

    state.clearRedoStack()
    vectorGui.render()
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
    (state.boundaryBox.xMax !== null ||
      state.selectedVectorIndicesSet.size > 0 ||
      state.currentVectorIndex !== null)
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

    state.clearRedoStack()
    state.deselect()
    vectorGui.render()
    renderVectorsToDOM()
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

    state.clearRedoStack()
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

    state.clearRedoStack()
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
    let offsetX = 0
    let offsetY = 0
    if (Object.keys(state.selectClipboard.vectors).length > 0) {
      offsetX = canvas.currentLayer.x
      offsetY = canvas.currentLayer.y
    }
    //paste selected pixels
    pasteSelectedPixels(
      state.selectClipboard,
      canvas.currentLayer,
      offsetX,
      offsetY
    )
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
        // vector.vectorProperties.px1 += canvas.currentLayer.x
        // vector.vectorProperties.py1 += canvas.currentLayer.y
        // if (Object.hasOwn(vector.vectorProperties, "px2")) {
        //   vector.vectorProperties.px2 += canvas.currentLayer.x
        //   vector.vectorProperties.py2 += canvas.currentLayer.y
        // }
        // if (Object.hasOwn(vector.vectorProperties, "px3")) {
        //   vector.vectorProperties.px3 += canvas.currentLayer.x
        //   vector.vectorProperties.py3 += canvas.currentLayer.y
        // }
        // if (Object.hasOwn(vector.vectorProperties, "px4")) {
        //   vector.vectorProperties.px4 += canvas.currentLayer.x
        //   vector.vectorProperties.py4 += canvas.currentLayer.y
        // }
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
        prePasteSelectedVectorIndices: Array.from(
          state.selectedVectorIndicesSet
        ),
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
        pastedLayer: canvas.pastedLayer, //important to know intended target layer for pasting, will be used by undo/redo
      },
    })
    state.selectedVectorIndicesSet.clear()
    state.action.vectorIndices.forEach((vectorIndex) => {
      state.vectors[vectorIndex].action = state.action
      state.selectedVectorIndicesSet.add(vectorIndex)
    })

    state.clearRedoStack()

    renderCanvas(canvas.currentLayer)
    switchTool("move") //TODO: (High Priority) Instead of move tool being selected, automatically use temporary transform tool which is not in the toolbox.
    renderLayersToDOM()
    renderVectorsToDOM()
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
    let vectors = {}
    if (lastPasteAction.vectorIndices.length !== 0) {
      lastPasteAction.vectorIndices.forEach((vectorIndex) => {
        vectors[vectorIndex] = state.vectors[vectorIndex]
      })
      //Make deep copy of clipboard vectors:
      vectors = JSON.parse(JSON.stringify(vectors))
      //correct offset coords for vectors to make agnostic to layer coords
      for (const [vectorIndex, vector] of Object.entries(vectors)) {
        vector.layer = canvas.pastedLayer
        vector.vectorProperties.px1 += xOffset - canvas.pastedLayer.x
        vector.vectorProperties.py1 += yOffset - canvas.pastedLayer.y
        if (Object.hasOwn(vector.vectorProperties, "px2")) {
          vector.vectorProperties.px2 += xOffset - canvas.pastedLayer.x
          vector.vectorProperties.py2 += yOffset - canvas.pastedLayer.y
        }
        if (Object.hasOwn(vector.vectorProperties, "px3")) {
          vector.vectorProperties.px3 += xOffset - canvas.pastedLayer.x
          vector.vectorProperties.py3 += yOffset - canvas.pastedLayer.y
        }
        if (Object.hasOwn(vector.vectorProperties, "px4")) {
          vector.vectorProperties.px4 += xOffset - canvas.pastedLayer.x
          vector.vectorProperties.py4 += yOffset - canvas.pastedLayer.y
        }
        //update vector index and action index
        state.highestVectorKey += 1
        let uniqueVectorKey = state.highestVectorKey
        vector.index = uniqueVectorKey
        vector.actionIndex = state.undoStack.length
        delete vectors[vectorIndex] // Remove old key-value pair
        vectors[uniqueVectorKey] = vector // Assign vector to new key
        //add to state.vectors
        state.vectors[uniqueVectorKey] = vector
      }
    }
    const confirmedClipboard = {
      boundaryBox,
      selectProperties,
      vectors,
      canvas: lastPasteAction.canvas,
    }
    confirmPastedPixels(confirmedClipboard, canvas.pastedLayer)
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
        preConfirmPasteSelectedVectorIndices: Array.from(
          state.selectedVectorIndicesSet
        ),
        preConfirmXOffset: xOffset,
        preConfirmYOffset: yOffset,
        boundaryBox,
        selectProperties,
        invertSelection: lastPasteAction.invertSelection,
        canvas: lastPasteAction.canvas,
        canvasProperties: {
          dataUrl: lastPasteAction.canvas?.toDataURL(),
          width: lastPasteAction.canvas?.width,
          height: lastPasteAction.canvas?.height,
        },
        vectorIndices: Object.keys(vectors),
      },
    })
    state.selectedVectorIndicesSet.clear()
    state.action.vectorIndices.forEach((vectorIndex) => {
      state.vectors[vectorIndex].action = state.action
      state.selectedVectorIndicesSet.add(vectorIndex)
    })
    state.clearRedoStack()
    //render
    vectorGui.render()
    renderCanvas(canvas.currentLayer)
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
    tool: tools.addLayer,
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
      canvas.currentLayer = canvas.layers.find(
        (l) => l.type === "raster" && !l.removed
      )
      vectorGui.reset()
    }
    addToTimeline({
      tool: tools.removeLayer,
      layer,
    })
    state.clearRedoStack()
    renderLayersToDOM()
    renderVectorsToDOM()
  }
}
