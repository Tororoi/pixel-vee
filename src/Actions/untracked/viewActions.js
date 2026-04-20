import { canvas } from '../../Context/canvas.js'
import { globalState } from '../../Context/state.js'
import { vectorGui } from '../../GUI/vector.js'
import { renderCanvas } from '../../Canvas/render.js'
import { setInitialZoom } from '../../utils/canvasHelpers.js'

/**
 * Zoom the canvas
 * @param {number} targetZoom - the zoom level to set (Float)
 * @param {number} xOriginOffset - additional offset needed to keep zoom centered around cursor (Integer)
 * @param {number} yOriginOffset - additional offset needed to keep zoom centered around cursor (Integer)
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
  canvas.gui.lineWidth = canvas.zoom <= 8 ? 0.5 / canvas.zoom : 0.5 / 8
  canvas.gui.collisionRadius =
    (canvas.zoom <= 8 ? 1 : 0.5) * (globalState.tool.touch ? 2 : 1)
  renderCanvas() //render all layers
  vectorGui.render()
}

/**
 * Recenter the canvas
 */
export function actionRecenter() {
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
