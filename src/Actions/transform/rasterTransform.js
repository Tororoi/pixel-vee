import { state } from "../../Context/state.js"
import { canvas } from "../../Context/canvas.js"
import { tools } from "../../Tools/index.js"
import { vectorGui } from "../../GUI/vector.js"
import { addToTimeline } from "../undoRedo/undoRedo.js"
import { renderCanvas } from "../../Canvas/render.js"
import { transformRasterContent } from "../../utils/transformHelpers.js"
import { actionFlipVectors, actionRotateVectors } from "./vectorTransform.js"

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
