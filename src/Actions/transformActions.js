import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { renderCanvas } from "../Canvas/render.js"
import { transformRasterContent } from "../utils/transformHelpers.js"
import {
  findVectorShapeCentroid,
  updateVectorProperties,
} from "../utils/vectorHelpers.js"
import { modifyVectorAction } from "./modifyTimeline.js"

//=============================================//
//======== * * * Raster Transform * * * =======//
//=============================================//

/**
 * Helper function to add a transform action to the timeline
 */
export function addTransformToTimeline() {
  //save to timeline
  const boundaryBox = { ...state.selection.boundaryBox }
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
  const selectProperties = { ...state.selection.properties }
  if (state.selection.properties.px2 !== null) {
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
      pastedImageKey: state.clipboard.currentPastedImageKey,
      transformationRotationDegrees: state.transform.rotationDegrees,
      isMirroredHorizontally: state.transform.isMirroredHorizontally,
      isMirroredVertically: state.transform.isMirroredVertically,
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
    const transformedBoundaryBox = { ...state.selection.boundaryBox }
    if (flipHorizontally) {
      transformedBoundaryBox.xMin = state.selection.boundaryBox.xMax
      transformedBoundaryBox.xMax = state.selection.boundaryBox.xMin
      state.transform.isMirroredHorizontally = !state.transform.isMirroredHorizontally
    } else {
      transformedBoundaryBox.yMin = state.selection.boundaryBox.yMax
      transformedBoundaryBox.yMax = state.selection.boundaryBox.yMin
      state.transform.isMirroredVertically = !state.transform.isMirroredVertically
    }
    transformRasterContent(
      canvas.currentLayer,
      state.clipboard.pastedImages[state.clipboard.currentPastedImageKey].imageData,
      transformedBoundaryBox,
      state.transform.rotationDegrees % 360,
      state.transform.isMirroredHorizontally,
      state.transform.isMirroredVertically
    )
    addTransformToTimeline()
    renderCanvas(canvas.currentLayer)
  } else if (
    state.vector.currentIndex !== null ||
    state.vector.selectedIndices.size > 0
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

    state.selection.properties = rotateBoundaryBox90Clockwise(state.selection.boundaryBox)
    state.selection.setBoundaryBox(state.selection.properties)
    state.transform.rotationDegrees += 90
    if (state.transform.isMirroredHorizontally) {
      state.transform.rotationDegrees += 180
    }
    if (state.transform.isMirroredVertically) {
      state.transform.rotationDegrees += 180
    }
    transformRasterContent(
      canvas.currentLayer,
      state.clipboard.pastedImages[state.clipboard.currentPastedImageKey].imageData,
      state.selection.boundaryBox,
      state.transform.rotationDegrees % 360,
      state.transform.isMirroredHorizontally,
      state.transform.isMirroredVertically
    )
    addTransformToTimeline()
    vectorGui.render()
    renderCanvas(canvas.currentLayer)
  } else if (
    state.vector.currentIndex !== null ||
    state.vector.selectedIndices.size > 0
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
  const vectorIndicesSet = new Set(state.vector.selectedIndices)
  if (vectorIndicesSet.size === 0) {
    vectorIndicesSet.add(state.vector.currentIndex)
  }
  for (const vectorIndex of vectorIndicesSet) {
    const vector = state.vector.all[vectorIndex]
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
    const vector = state.vector.all[vectorIndex]
    referenceVector = vector //TODO: (Low Priority) Determine a better method for setting a reference vector or remove the need for one.
    state.vector.savedProperties[vectorIndex] = {
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
    if (vectorIndex === state.vector.currentIndex) {
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
  const vectorIndicesSet = new Set(state.vector.selectedIndices)
  if (vectorIndicesSet.size === 0) {
    vectorIndicesSet.add(state.vector.currentIndex)
  }
  //get center point of selected vectors
  if (state.vector.shapeCenterX === null) {
    //Update shape center
    const [centerX, centerY] = findVectorShapeCentroid(
      vectorIndicesSet,
      state.vector.all
    )
    state.vector.shapeCenterX = centerX + canvas.currentLayer.x
    state.vector.shapeCenterY = centerY + canvas.currentLayer.y
  }
  const rotationOriginX = state.vector.shapeCenterX
  const rotationOriginY = state.vector.shapeCenterY
  let referenceVector
  for (const vectorIndex of vectorIndicesSet) {
    const vector = state.vector.all[vectorIndex]
    referenceVector = vector //TODO: (Low Priority) Determine a better method for setting a reference vector or remove the need for one.
    state.vector.savedProperties[vectorIndex] = {
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
    if (vectorIndex === state.vector.currentIndex) {
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
