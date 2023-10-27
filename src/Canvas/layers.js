import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"

//====================================//
//======== * * * Layers * * * ========//
//====================================//

/**
 * Draw all layers onto offscreen canvas to prepare for sampling or export
 */
export function consolidateLayers() {
  canvas.offScreenCTX.clearRect(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
  canvas.layers.forEach((layer) => {
    if (
      layer.type === "raster" &&
      !layer.hidden &&
      !layer.removed &&
      layer.opacity > 0
    ) {
      canvas.offScreenCTX.save()
      canvas.offScreenCTX.globalAlpha = layer.opacity
      canvas.offScreenCTX.drawImage(
        layer.cvs,
        layer.x,
        layer.y,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      canvas.offScreenCTX.restore()
    }
  })
}

/**
 * Create a new raster layer
 * @param {String} name
 * @returns {Object} layer
 */
export function createNewRasterLayer(name) {
  //TODO: create onscreen canvas for the layer as well as the offscreen one
  let offscreenLayerCVS = document.createElement("canvas")
  let offscreenLayerCTX = offscreenLayerCVS.getContext("2d")
  offscreenLayerCTX.willReadFrequently = true
  offscreenLayerCVS.width = canvas.offScreenCVS.width
  offscreenLayerCVS.height = canvas.offScreenCVS.height
  let onscreenLayerCVS = document.createElement("canvas")
  let onscreenLayerCTX = onscreenLayerCVS.getContext("2d")
  onscreenLayerCTX.willReadFrequently = true
  onscreenLayerCTX.scale(
    canvas.sharpness * canvas.zoom,
    canvas.sharpness * canvas.zoom
  )
  onscreenLayerCVS.className = "onscreen-layer"
  dom.canvasLayers.appendChild(onscreenLayerCVS)
  onscreenLayerCVS.width = onscreenLayerCVS.offsetWidth * canvas.sharpness
  onscreenLayerCVS.height = onscreenLayerCVS.offsetHeight * canvas.sharpness
  onscreenLayerCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  let layer = {
    type: "raster",
    title: name,
    cvs: offscreenLayerCVS,
    ctx: offscreenLayerCTX,
    onscreenCvs: onscreenLayerCVS,
    onscreenCtx: onscreenLayerCTX,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    inactiveTools: [],
    hidden: false,
    removed: false,
  }
  return layer
}
