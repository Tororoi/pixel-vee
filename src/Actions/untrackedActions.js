import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { setInitialZoom } from "../utils/canvasHelpers.js"
import { copySelectedPixels, copySelectedVectors } from "../Menu/edit.js"

/**
 * Zoom the canvas
 * @param {number} z - ratio to multiply zoom by (Float)
 * @param {number} xOriginOffset - additional offset needed to keep zoom centered around cursor (Integer)
 * @param {number} yOriginOffset - additional offset needed to keep zoom centered around cursor (Integer)
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
  canvas.layers.forEach((layer) => {
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0
    )
  })
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  renderCanvas() //render all layers
  vectorGui.render()
}

/**
 * Recenter the canvas
 */
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
  canvas.layers.forEach((layer) => {
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0
    )
  })
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.xOffset = Math.round(
    (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.width) /
      2
  )
  canvas.yOffset = Math.round(
    (canvas.currentLayer.onscreenCvs.height / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.height) /
      2
  )
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  renderCanvas() //render all layers
  vectorGui.render()
}

/**
 * Copy Selection to clipboard
 * Not dependent on pointer events
 */
export function actionCopySelection() {
  if (
    canvas.currentLayer.type === "raster" &&
    (state.boundaryBox.xMax !== null || state.currentVectorIndex || state.selectedVectorIndicesSet.size > 0)
  ) {
    if (state.boundaryBox.xMax !== null) {
      copySelectedPixels()
    } else {
      copySelectedVectors()
    }
  }
}
