import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { vectorGui } from "../GUI/vector.js"
import { renderRasterGUI } from "../GUI/raster.js"
import { renderCanvas } from "../Canvas/render.js"
import { setInitialZoom } from "../utils/canvasHelpers.js"

/**
 * Zoom the canvas
 * @param {float} z - ratio to multiply zoom by
 * @param {integer} xOriginOffset - additional offset needed to keep zoom centered around cursor
 * @param {integer} yOriginOffset - additional offset needed to keep zoom centered around cursor
 */
export function actionZoom(z, xOriginOffset, yOriginOffset) {
  canvas.zoom *= z
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
    0
  )
  canvas.rasterGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.onScreenCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  renderCanvas()
  renderRasterGUI(state, canvas, swatches)
  vectorGui.render(state, canvas)
}

export function actionRecenter() {
  canvas.zoom = setInitialZoom(
    Math.max(canvas.offScreenCVS.width, canvas.offScreenCVS.height)
  )
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.rasterGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.onScreenCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.xOffset = Math.round(
    (canvas.onScreenCVS.width / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.width) /
      2
  )
  canvas.yOffset = Math.round(
    (canvas.onScreenCVS.height / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.height) /
      2
  )
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  renderCanvas()
  renderRasterGUI(state, canvas, swatches)
  vectorGui.render(state, canvas)
}
