import { canvas } from '../../Context/canvas.js'
import { globalState } from '../../Context/state.js'
import { vectorGui } from '../../GUI/vector.js'
import { renderCanvas } from '../../Canvas/render.js'
import { setInitialZoom } from '../../utils/canvasHelpers.js'

/**
 * Set the canvas zoom level and viewport offset, then re-render everything.
 *
 * Updates the zoom on the `canvas` object and applies a new transform matrix
 * to every rendering context (vector GUI, selection GUI, resize overlay,
 * cursor, all layer canvases, and the background). The transform matrix
 * combines `canvas.sharpness` (for high-DPI displays) with the target zoom.
 *
 * After the transforms are applied, GUI metrics that depend on zoom are
 * recalculated: `lineWidth` is scaled down at higher zoom so overlay lines
 * remain thin, and `collisionRadius` is expanded on touch devices so control
 * point handles are easier to hit.
 *
 * This action is "untracked" — it does not push to the undo/redo timeline
 * because view changes are not content edits.
 * @param {number} targetZoom - The new zoom level to apply (float, e.g. 2.0
 *   for 2× magnification).
 * @param {number} xOriginOffset - Viewport X offset in canvas pixels, used
 *   to keep the zoom centered around the cursor (integer).
 * @param {number} yOriginOffset - Viewport Y offset in canvas pixels, used
 *   to keep the zoom centered around the cursor (integer).
 */
export function actionZoom(targetZoom, xOriginOffset, yOriginOffset) {
  canvas.zoom = targetZoom
  canvas.xOffset = Math.round(xOriginOffset)
  canvas.yOffset = Math.round(yOriginOffset)
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  //re scale canvas
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.selectionGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.resizeOverlayCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.cursorCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.layers.forEach((layer) => {
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0,
    )
  })
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  // At zoom levels ≤ 8 scale the line width inversely so GUI overlay lines
  // stay at a visually consistent sub-pixel thickness.
  canvas.gui.lineWidth = canvas.zoom <= 8 ? 0.5 / canvas.zoom : 0.5 / 8
  // Expand the hit radius on touch devices so control point handles remain
  // easy to tap; halve it at high zoom where precision is available.
  canvas.gui.collisionRadius =
    (canvas.zoom <= 8 ? 1 : 0.5) * (globalState.tool.touch ? 2 : 1)
  renderCanvas() //render all layers
  vectorGui.render()
}

/**
 * Reset the canvas zoom and offset so the entire artwork fits in the viewport.
 *
 * Computes the largest zoom level at which the full off-screen canvas fits
 * within the visible vector GUI canvas area using `setInitialZoom`, then
 * applies the same transform matrix update as `actionZoom`. The viewport
 * offset is recalculated to center the artwork within the available space.
 *
 * This action is "untracked" — it does not push to the undo/redo timeline.
 */
export function actionRecenter() {
  // Calculate the zoom that fits the whole artwork in the current viewport.
  canvas.zoom = setInitialZoom(
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height,
    canvas.vectorGuiCVS.offsetWidth,
    canvas.vectorGuiCVS.offsetHeight,
  )
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.selectionGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.resizeOverlayCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.cursorCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.layers.forEach((layer) => {
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0,
    )
  })
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  // Center the viewport: compute the offset that places the artwork in the
  // middle of the available onscreen canvas area.
  canvas.xOffset = Math.round(
    (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.width) /
      2,
  )
  canvas.yOffset = Math.round(
    (canvas.currentLayer.onscreenCvs.height / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.height) /
      2,
  )
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  canvas.gui.lineWidth = canvas.zoom <= 8 ? 0.5 / canvas.zoom : 0.5 / 8
  canvas.gui.collisionRadius =
    (canvas.zoom <= 6 ? 1 : 0.5) * (globalState.tool.touch ? 2 : 1)
  renderCanvas() //render all layers
  vectorGui.render()
}
