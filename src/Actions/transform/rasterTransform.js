import { globalState } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { tools } from '../../Tools/index.js'
import { vectorGui } from '../../GUI/vector.js'
import { addToTimeline } from '../undoRedo/undoRedo.js'
import { renderCanvas } from '../../Canvas/render.js'
import { transformRasterContent } from '../../utils/transformHelpers.js'
import { actionFlipVectors, actionRotateVectors } from './vectorTransform.js'

//=============================================//
//======== * * * Raster Transform * * * =======//
//=============================================//

/**
 * Helper function to add a transform action to the timeline
 */
export function addTransformToTimeline() {
  //save to timeline
  const boundaryBox = { ...globalState.selection.boundaryBox }
  //create canvas with transformed pixels
  const transformedCanvas = document.createElement('canvas')
  transformedCanvas.width = boundaryBox.xMax - boundaryBox.xMin
  transformedCanvas.height = boundaryBox.yMax - boundaryBox.yMin
  const transformedCtx = transformedCanvas.getContext('2d')
  transformedCtx.putImageData(
    canvas.currentLayer.ctx.getImageData(
      boundaryBox.xMin,
      boundaryBox.yMin,
      boundaryBox.xMax - boundaryBox.xMin,
      boundaryBox.yMax - boundaryBox.yMin,
    ),
    0,
    0,
  )
  if (boundaryBox.xMax !== null) {
    boundaryBox.xMin -= canvas.currentLayer.x
    boundaryBox.xMax -= canvas.currentLayer.x
    boundaryBox.yMin -= canvas.currentLayer.y
    boundaryBox.yMax -= canvas.currentLayer.y
  }
  const selectProperties = { ...globalState.selection.properties }
  if (globalState.selection.properties.px2 !== null) {
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
      pastedImageKey: globalState.clipboard.currentPastedImageKey,
      transformationRotationDegrees: globalState.transform.rotationDegrees,
      isMirroredHorizontally: globalState.transform.isMirroredHorizontally,
      isMirroredVertically: globalState.transform.isMirroredVertically,
    },
  })
  globalState.clearRedoStack()
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
    const transformedBoundaryBox = { ...globalState.selection.boundaryBox }
    if (flipHorizontally) {
      transformedBoundaryBox.xMin = globalState.selection.boundaryBox.xMax
      transformedBoundaryBox.xMax = globalState.selection.boundaryBox.xMin
      globalState.transform.isMirroredHorizontally =
        !globalState.transform.isMirroredHorizontally
    } else {
      transformedBoundaryBox.yMin = globalState.selection.boundaryBox.yMax
      transformedBoundaryBox.yMax = globalState.selection.boundaryBox.yMin
      globalState.transform.isMirroredVertically =
        !globalState.transform.isMirroredVertically
    }
    transformRasterContent(
      canvas.currentLayer,
      globalState.clipboard.pastedImages[
        globalState.clipboard.currentPastedImageKey
      ].imageData,
      transformedBoundaryBox,
      globalState.transform.rotationDegrees % 360,
      globalState.transform.isMirroredHorizontally,
      globalState.transform.isMirroredVertically,
    )
    addTransformToTimeline()
    renderCanvas(canvas.currentLayer)
  } else if (
    globalState.vector.currentIndex !== null ||
    globalState.vector.selectedIndices.size > 0
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

    globalState.selection.properties = rotateBoundaryBox90Clockwise(
      globalState.selection.boundaryBox,
    )
    globalState.selection.setBoundaryBox(globalState.selection.properties)
    globalState.transform.rotationDegrees += 90
    if (globalState.transform.isMirroredHorizontally) {
      globalState.transform.rotationDegrees += 180
    }
    if (globalState.transform.isMirroredVertically) {
      globalState.transform.rotationDegrees += 180
    }
    transformRasterContent(
      canvas.currentLayer,
      globalState.clipboard.pastedImages[
        globalState.clipboard.currentPastedImageKey
      ].imageData,
      globalState.selection.boundaryBox,
      globalState.transform.rotationDegrees % 360,
      globalState.transform.isMirroredHorizontally,
      globalState.transform.isMirroredVertically,
    )
    addTransformToTimeline()
    vectorGui.render()
    renderCanvas(canvas.currentLayer)
  } else if (
    globalState.vector.currentIndex !== null ||
    globalState.vector.selectedIndices.size > 0
  ) {
    //vector flip
    actionRotateVectors(90)
  }
}
