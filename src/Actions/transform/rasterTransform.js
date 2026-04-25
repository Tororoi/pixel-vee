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
 * Snapshot the current transformed pixel content and push a transform action
 * onto the undo/redo timeline.
 *
 * Called after every flip or rotate operation to record the resulting pixel
 * state. It captures the pixels inside the current selection boundary into a
 * temporary canvas (used for undo reconstruction), converts the boundary box
 * and selection properties to layer-relative coordinates, and then writes the
 * full transform metadata (rotation degrees, mirror flags, pasted-image key)
 * to the timeline so undo/redo can reconstruct any transform state exactly.
 */
export function addTransformToTimeline() {
  const boundaryBox = { ...globalState.selection.boundaryBox }
  // Capture the current pixel content within the selection so it can be
  // restored accurately when this action is undone.
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
  // Convert to layer-relative coords before storing in the timeline so the
  // action remains correct if the layer is moved after this operation.
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
 * Flip the current selection or selected vectors horizontally or vertically.
 *
 * Raster path: operates only when the current layer is a preview layer
 * (i.e. an active paste is in progress). The boundary box is inverted on
 * the relevant axis, the cumulative mirror flag is toggled, and then
 * `transformRasterContent` re-draws the pasted image with the new flip state
 * applied on top of any existing rotation. A timeline entry is recorded.
 *
 * Vector path: delegates to `actionFlipVectors` when no preview layer is
 * active but one or more vectors are selected or focused.
 * @param {boolean} flipHorizontally - `true` to flip left/right;
 *   `false` to flip top/bottom.
 */
export function actionFlipPixels(flipHorizontally) {
  //raster flip
  if (canvas.currentLayer.isPreview) {
    const transformedBoundaryBox = { ...globalState.selection.boundaryBox }
    if (flipHorizontally) {
      // Swap xMin and xMax to signal a horizontal reflection to the renderer.
      transformedBoundaryBox.xMin = globalState.selection.boundaryBox.xMax
      transformedBoundaryBox.xMax = globalState.selection.boundaryBox.xMin
      globalState.transform.isMirroredHorizontally =
        !globalState.transform.isMirroredHorizontally
    } else {
      // Swap yMin and yMax to signal a vertical reflection.
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
 * Rotate the current selection or selected vectors 90 degrees clockwise.
 *
 * Raster path: operates only when the current layer is a preview layer.
 * Computes the new bounding box after a 90-degree clockwise rotation around
 * the center of the current box (width and height swap, and the center is
 * preserved). Mirror flags are taken into account — when the content is
 * already mirrored, an additional 180-degree adjustment is applied to keep
 * the perceived direction consistent. The pixel content is then re-rendered
 * via `transformRasterContent` and a timeline entry is recorded.
 *
 * Vector path: delegates to `actionRotateVectors(90)` when no preview layer
 * is active but one or more vectors are selected or focused.
 */
export function actionRotatePixels() {
  if (canvas.currentLayer.isPreview) {
    const rotateBoundaryBox90Clockwise = (boundaryBox) => {
      const { xMin, xMax, yMin, yMax } = boundaryBox
      const centerX = Math.floor((xMin + xMax) / 2)
      const centerY = Math.floor((yMin + yMax) / 2)
      // For odd-sized dimensions the center is the true middle pixel.
      // For even-sized dimensions the center is the pixel just left of / above
      // the mathematical midpoint — this keeps the selection stable.

      const width = xMax - xMin
      const height = yMax - yMin

      // After a 90-degree rotation the former width becomes the new height
      // and vice versa. Recalculate the box edges from the preserved center.
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
    // Mirror transforms affect the visual rotation direction. Compensate so
    // that "rotate 90 CW" always appears clockwise to the user regardless of
    // the current mirror state.
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
