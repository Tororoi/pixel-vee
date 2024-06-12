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
import { transformRasterContent } from "../utils/transformHelpers.js"
import {
  findVectorShapeCentroid,
  updateVectorProperties,
} from "../utils/vectorHelpers.js"
import { modifyVectorAction } from "./modifyTimeline.js"
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
    state.selectProperties.px1 = 0
    state.selectProperties.py1 = 0
    state.selectProperties.px2 = canvas.currentLayer.cvs.width
    state.selectProperties.py2 = canvas.currentLayer.cvs.height
    state.setBoundaryBox(state.selectProperties)
    addToTimeline({
      tool: tools.select.name,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
        // selectProperties: { ...state.selectProperties },
        // selectedVectorIndices: [],
        // preActionSelectedVectorIndices: Array.from(
        //   state.selectedVectorIndicesSet
        // ),
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
  if (!state.selectedVectorIndicesSet.has(vectorIndex)) {
    state.selectedVectorIndicesSet.add(vectorIndex)
    dom.vectorTransformUIContainer.style.display = "flex"
    if (state.vectorTransformMode === SCALE) {
      setVectorShapeBoundaryBox()
    }
    // const selectedVectorIndices = new Set(state.selectedVectorIndicesSet)
    // state.deselect()
    // state.selectedVectorIndicesSet = selectedVectorIndices
    addToTimeline({
      tool: tools.select.name,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
        // selectProperties: { ...state.selectProperties },
        // selectedVectorIndices: Array.from(state.selectedVectorIndicesSet),
        // vectorIndex: state.currentVectorIndex, //should be for all selected vectors
        // maskArray,
      },
    })
    state.clearRedoStack()
    //Update shape center
    const [centerX, centerY] = findVectorShapeCentroid(
      state.selectedVectorIndicesSet,
      state.vectors
    )
    state.shapeCenterX = centerX + canvas.currentLayer.x
    state.shapeCenterY = centerY + canvas.currentLayer.y
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
  if (state.selectedVectorIndicesSet.has(vectorIndex)) {
    state.selectedVectorIndicesSet.delete(vectorIndex)
    if (state.selectedVectorIndicesSet.size === 0) {
      dom.vectorTransformUIContainer.style.display = "none"
      state.deselect()
    } else if (state.selectedVectorIndicesSet.size > 0) {
      if (state.vectorTransformMode === SCALE) {
        setVectorShapeBoundaryBox()
      }
    }
    addToTimeline({
      tool: tools.select.name,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
        // selectProperties: { ...state.selectProperties },
        // selectedVectorIndices: Array.from(state.selectedVectorIndicesSet),
        // vectorIndex: state.currentVectorIndex, //should be for all selected vectors
        // maskArray,
      },
    })
    state.clearRedoStack()
    //Update shape center
    const [centerX, centerY] = findVectorShapeCentroid(
      state.selectedVectorIndicesSet,
      state.vectors
    )
    state.shapeCenterX = centerX + canvas.currentLayer.x
    state.shapeCenterY = centerY + canvas.currentLayer.y
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
    (state.boundaryBox.xMax !== null ||
      state.selectedVectorIndicesSet.size > 0 ||
      state.currentVectorIndex !== null)
  ) {
    // let maskArray = coordArrayFromSet(
    //   state.maskSet,
    //   canvas.currentLayer.x,
    //   canvas.currentLayer.y
    // )
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
    (state.boundaryBox.xMax !== null ||
      state.currentVectorIndex !== null ||
      state.selectedVectorIndicesSet.size > 0)
  ) {
    if (state.boundaryBox.xMax !== null) {
      //Cut raster content
      cutSelectedPixels(copyToClipboard)
      //correct boundary box for layer offset
      const boundaryBox = { ...state.boundaryBox }
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
        },
      })

      state.clearRedoStack()
      renderCanvas(canvas.currentLayer)
      vectorGui.render()
    } else if (
      state.currentVectorIndex !== null ||
      state.selectedVectorIndicesSet.size > 0
    ) {
      //Cut selected vectors (mark as removed)
      if (copyToClipboard) {
        copySelectedVectors()
      }
      let vectorIndices = []
      if (state.selectedVectorIndicesSet.size > 0) {
        state.selectedVectorIndicesSet.forEach((vectorIndex) => {
          state.vectors[vectorIndex].removed = true
        })
        vectorIndices = Array.from(state.selectedVectorIndicesSet)
      } else {
        state.vectors[state.currentVectorIndex].removed = true
        vectorIndices = [state.currentVectorIndex]
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
    (state.selectClipboard.canvas ||
      Object.keys(state.selectClipboard.vectors).length > 0)
  ) {
    //if state.selectClipboard.canvas, run pasteSelectedPixels
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
    if (state.selectClipboard.canvas) {
      //paste selected pixels (creates temporary canvas layer for pasting)
      pasteSelectedPixels(state.selectClipboard, canvas.currentLayer, 0, 0)
      let uniquePastedImageKey = null
      if (state.selectClipboard.canvas) {
        state.highestPastedImageKey += 1
        uniquePastedImageKey = state.highestPastedImageKey
      }
      if (state.selectClipboard.imageData) {
        state.pastedImages[uniquePastedImageKey] = {
          imageData: state.selectClipboard.imageData,
        }
        state.currentPastedImageKey = uniquePastedImageKey
      }
      //clear any selected vectors
      state.selectedVectorIndicesSet.clear()
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
          canvas: state.selectClipboard.canvas,
          canvasProperties: {
            dataUrl: state.selectClipboard.canvas?.toDataURL(),
            width: state.selectClipboard.canvas?.width,
            height: state.selectClipboard.canvas?.height,
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
    } else if (Object.keys(state.selectClipboard.vectors).length > 0) {
      //Make deep copy of clipboard vectors:
      const clipboardVectors = JSON.parse(
        JSON.stringify(state.selectClipboard.vectors)
      )
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
        delete clipboardVectors[vectorIndex] // Remove old key-value pair
        clipboardVectors[uniqueVectorKey] = vector // Assign vector to new key
        //add to state.vectors
        state.vectors[uniqueVectorKey] = vector
      }
      state.selectedVectorIndicesSet.clear()
      const vectorIndices = Object.keys(clipboardVectors)
      vectorIndices.forEach((vectorIndex) => {
        state.selectedVectorIndicesSet.add(parseInt(vectorIndex))
      })
      if (state.selectedVectorIndicesSet.size > 0) {
        dom.vectorTransformUIContainer.style.display = "flex"
        if (state.vectorTransformMode === SCALE) {
          setVectorShapeBoundaryBox()
        }
      } else {
        dom.vectorTransformUIContainer.style.display = "none"
      }
      //TODO: (High Priority) Need to render onto canvas to remove need to redraw timeline
      // renderCanvas(canvas.currentLayer)
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
        state.vectors[vectorIndex].action = state.action
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
  for (let i = state.undoStack.length - 1; i >= 0; i--) {
    if (state.undoStack[i].tool === "paste" && !state.undoStack[i].confirmed) {
      lastPasteAction = state.undoStack[i]
      break // Stop searching once the first 'paste' action is found
    }
  }
  if (canvas.currentLayer.type === "raster" && lastPasteAction) {
    const xOffset = canvas.tempLayer.x
    const yOffset = canvas.tempLayer.y
    //adjust boundaryBox for layer offset
    // const boundaryBox = { ...lastPasteAction.boundaryBox }
    // const boundaryBox = { ...state.boundaryBox }
    // if (boundaryBox.xMax !== null) {
    //   boundaryBox.xMin += xOffset - canvas.pastedLayer.x
    //   boundaryBox.xMax += xOffset - canvas.pastedLayer.x
    //   boundaryBox.yMin += yOffset - canvas.pastedLayer.y
    //   boundaryBox.yMax += yOffset - canvas.pastedLayer.y
    // }
    // // // const selectProperties = { ...lastPasteAction.selectProperties }
    // const selectProperties = { ...state.selectProperties }
    // if (selectProperties.px2 !== null) {
    //   selectProperties.px1 += xOffset - canvas.pastedLayer.x
    //   selectProperties.px2 += xOffset - canvas.pastedLayer.x
    //   selectProperties.py1 += yOffset - canvas.pastedLayer.y
    //   selectProperties.py2 += yOffset - canvas.pastedLayer.y
    // }
    const boundaryBox = { ...state.boundaryBox }
    const selectProperties = { ...state.selectProperties }
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
        pastedImageKey: state.currentPastedImageKey, //needed for reference on undo?
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
    state.currentPastedImageKey = null
    state.transformationRotationDegrees = 0
    state.isMirroredHorizontally = false
    state.isMirroredVertically = false
    //render
    vectorGui.render()
    renderCanvas(canvas.currentLayer)
    renderLayersToDOM()
    renderVectorsToDOM()
    enableActionsForNoPaste()
  }
}

//=============================================//
//======== * * * Raster Transform * * * =======//
//=============================================//

/**
 * Helper function to add a transform action to the timeline
 */
export function addTransformToTimeline() {
  //save to timeline
  const boundaryBox = { ...state.boundaryBox }
  //create canvas with transformed pixels
  const transformedCanvas = document.createElement("canvas")
  transformedCanvas.width = boundaryBox.xMax - boundaryBox.xMin
  transformedCanvas.height = boundaryBox.yMax - boundaryBox.yMin
  const transformedCtx = transformedCanvas.getContext("2d")
  transformedCtx.putImageData(
    canvas.currentLayer.ctx.getImageData(
      boundaryBox.xMin,
      boundaryBox.yMin,
      boundaryBox.xMax - boundaryBox.xMin,
      boundaryBox.yMax - boundaryBox.yMin
    ),
    0,
    0
  )
  if (boundaryBox.xMax !== null) {
    boundaryBox.xMin -= canvas.currentLayer.x
    boundaryBox.xMax -= canvas.currentLayer.x
    boundaryBox.yMin -= canvas.currentLayer.y
    boundaryBox.yMax -= canvas.currentLayer.y
  }
  const selectProperties = { ...state.selectProperties }
  if (state.selectProperties.px2 !== null) {
    selectProperties.px1 -= canvas.currentLayer.x
    selectProperties.px2 -= canvas.currentLayer.x
    selectProperties.py1 -= canvas.currentLayer.y
    selectProperties.py2 -= canvas.currentLayer.y
  }
  addToTimeline({
    tool: tools.transform.name,
    layer: canvas.currentLayer,
    properties: {
      boundaryBox,
      selectProperties,
      pastedImageKey: state.currentPastedImageKey,
      transformationRotationDegrees: state.transformationRotationDegrees,
      isMirroredHorizontally: state.isMirroredHorizontally,
      isMirroredVertically: state.isMirroredVertically,
    },
  })
  state.clearRedoStack()
}

/**
 * Stretch Layer Content
 * Not dependent on pointer events
 * Conditions: Layer is a raster layer, layer is a preview layer, and there is a selection
 * @param {boolean} flipHorizontally - Whether to flip horizontally
 */
export function actionFlipPixels(flipHorizontally) {
  //raster flip
  if (canvas.currentLayer.isPreview) {
    //flip pixels
    const transformedBoundaryBox = { ...state.boundaryBox }
    if (flipHorizontally) {
      transformedBoundaryBox.xMin = state.boundaryBox.xMax
      transformedBoundaryBox.xMax = state.boundaryBox.xMin
      state.isMirroredHorizontally = !state.isMirroredHorizontally
    } else {
      transformedBoundaryBox.yMin = state.boundaryBox.yMax
      transformedBoundaryBox.yMax = state.boundaryBox.yMin
      state.isMirroredVertically = !state.isMirroredVertically
    }
    transformRasterContent(
      canvas.currentLayer,
      state.pastedImages[state.currentPastedImageKey].imageData,
      transformedBoundaryBox,
      state.transformationRotationDegrees % 360,
      state.isMirroredHorizontally,
      state.isMirroredVertically
    )
    addTransformToTimeline()
    renderCanvas(canvas.currentLayer)
  } else if (
    state.currentVectorIndex !== null ||
    state.selectedVectorIndicesSet.size > 0
  ) {
    //vector flip
    actionFlipVectors(flipHorizontally)
  }
}

/**
 *
 */
export function actionRotatePixels() {
  if (canvas.currentLayer.isPreview) {
    const rotateBoundaryBox90Clockwise = (boundaryBox) => {
      const { xMin, xMax, yMin, yMax } = boundaryBox
      const centerX = Math.floor((xMin + xMax) / 2)
      const centerY = Math.floor((yMin + yMax) / 2)
      //if side is odd, center is the middle pixel
      //if side is even, center is the pixel to the left and above the middle

      // Calculate distances of the original edges from the center
      const width = xMax - xMin
      const height = yMax - yMin

      // After rotation, the box's width becomes its height and vice versa
      const px1 = centerX - Math.floor(height / 2)
      const px2 = centerX + Math.ceil(height / 2)
      const py1 = centerY - Math.floor(width / 2)
      const py2 = centerY + Math.ceil(width / 2)

      return {
        px1,
        px2,
        py1,
        py2,
      }
    }

    state.selectProperties = rotateBoundaryBox90Clockwise(state.boundaryBox)
    state.setBoundaryBox(state.selectProperties)
    state.transformationRotationDegrees += 90
    if (state.isMirroredHorizontally) {
      state.transformationRotationDegrees += 180
    }
    if (state.isMirroredVertically) {
      state.transformationRotationDegrees += 180
    }
    transformRasterContent(
      canvas.currentLayer,
      state.pastedImages[state.currentPastedImageKey].imageData,
      state.boundaryBox,
      state.transformationRotationDegrees % 360,
      state.isMirroredHorizontally,
      state.isMirroredVertically
    )
    addTransformToTimeline()
    vectorGui.render()
    renderCanvas(canvas.currentLayer)
  } else if (
    state.currentVectorIndex !== null ||
    state.selectedVectorIndicesSet.size > 0
  ) {
    //vector flip
    actionRotateVectors(90)
  }
}

//=============================================//
//======== * * * Vector Transform * * * =======//
//=============================================//

/**
 * Flip selected vectors horizontally around point at center of min and max bounds of selected vectors
 * @param {boolean} flipHorizontally - Whether to flip horizontally
 */
export function actionFlipVectors(flipHorizontally) {
  //get bounding box of all vectors
  let [xMin, xMax, yMin, yMax] = [null, null, null, null]
  const vectorIndicesSet = new Set(state.selectedVectorIndicesSet)
  if (vectorIndicesSet.size === 0) {
    vectorIndicesSet.add(state.currentVectorIndex)
  }
  for (const vectorIndex of vectorIndicesSet) {
    const vector = state.vectors[vectorIndex]
    const vectorXPoints = []
    const vectorYPoints = []

    for (let i = 1; i <= 4; i++) {
      if (
        "px" + i in vector.vectorProperties &&
        "py" + i in vector.vectorProperties
      ) {
        vectorXPoints.push(vector.vectorProperties[`px${i}`])
        vectorYPoints.push(vector.vectorProperties[`py${i}`])
      }
    }

    xMin = Math.min(xMin ?? Infinity, ...vectorXPoints)
    xMax = Math.max(xMax ?? -Infinity, ...vectorXPoints)
    yMin = Math.min(yMin ?? Infinity, ...vectorYPoints)
    yMax = Math.max(yMax ?? -Infinity, ...vectorYPoints)
  }
  //get center point of selected vectors
  const centerX = (xMin + xMax) / 2
  const centerY = (yMin + yMax) / 2
  let referenceVector
  //flip vectors horizontally around center point
  for (const vectorIndex of vectorIndicesSet) {
    const vector = state.vectors[vectorIndex]
    referenceVector = vector //TODO: (Low Priority) Determine a better method for setting a reference vector or remove the need for one.
    state.vectorsSavedProperties[vectorIndex] = {
      ...vector.vectorProperties,
    }
    for (let i = 1; i <= 4; i++) {
      if (
        "px" + i in vector.vectorProperties &&
        "py" + i in vector.vectorProperties
      ) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        let newX = vector.vectorProperties[xKey]
        let newY = vector.vectorProperties[yKey]
        if (flipHorizontally) {
          newX = Math.round(2 * centerX) - vector.vectorProperties[xKey]
        } else {
          newY = Math.round(2 * centerY) - vector.vectorProperties[yKey]
        }
        updateVectorProperties(vector, newX, newY, xKey, yKey)
      }
    }
    if (vectorIndex === state.currentVectorIndex) {
      vectorGui.setVectorProperties(vector)
    }
  }
  renderCanvas(canvas.currentLayer, true)
  //Get any selected vector to use for modifyVectorAction
  modifyVectorAction(referenceVector)
  state.clearRedoStack()
  vectorGui.render()
}

/**
 * Freely rotate selected vectors at any angle around origin point (default center of vectors bounding box)
 * @param {number} degrees - The number of degrees to rotate the vectors
 */
export function actionRotateVectors(degrees) {
  //get bounding box of all vectors
  const vectorIndicesSet = new Set(state.selectedVectorIndicesSet)
  if (vectorIndicesSet.size === 0) {
    vectorIndicesSet.add(state.currentVectorIndex)
  }
  //get center point of selected vectors
  if (state.shapeCenterX === null) {
    //Update shape center
    const [centerX, centerY] = findVectorShapeCentroid(
      vectorIndicesSet,
      state.vectors
    )
    state.shapeCenterX = centerX + canvas.currentLayer.x
    state.shapeCenterY = centerY + canvas.currentLayer.y
  }
  const rotationOriginX = state.shapeCenterX
  const rotationOriginY = state.shapeCenterY
  let referenceVector
  for (const vectorIndex of vectorIndicesSet) {
    const vector = state.vectors[vectorIndex]
    referenceVector = vector //TODO: (Low Priority) Determine a better method for setting a reference vector or remove the need for one.
    state.vectorsSavedProperties[vectorIndex] = {
      ...vector.vectorProperties,
    }
    for (let i = 1; i <= 4; i++) {
      if (
        "px" + i in vector.vectorProperties &&
        "py" + i in vector.vectorProperties
      ) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        let newX = vector.vectorProperties[xKey]
        let newY = vector.vectorProperties[yKey]
        const radians = (degrees * Math.PI) / 180
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)
        newX = Math.floor(
          cos * (vector.vectorProperties[xKey] - rotationOriginX) -
            sin * (vector.vectorProperties[yKey] - rotationOriginY) +
            rotationOriginX
        )
        newY = Math.floor(
          sin * (vector.vectorProperties[xKey] - rotationOriginX) +
            cos * (vector.vectorProperties[yKey] - rotationOriginY) +
            rotationOriginY
        )
        updateVectorProperties(vector, newX, newY, xKey, yKey)
      }
    }
    if (vectorIndex === state.currentVectorIndex) {
      vectorGui.setVectorProperties(vector)
    }
  }
  renderCanvas(canvas.currentLayer, true)
  //Get any selected vector to use for modifyVectorAction
  modifyVectorAction(referenceVector)
  state.clearRedoStack()
  vectorGui.render()
}

/**
 * Scale selected vectors by a factor calculated from the given x and y minimum and maximum points
 */
export function actionScaleVectors() {
  //IN PROGRESS
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
      //TODO: (Medium Priority) Reference layer selection should be deselected when switching to raster layer
      canvas.currentLayer = canvas.layers.find(
        (l) => l.type === "raster" && !l.removed
      )
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
