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
  let layerCVS = document.createElement("canvas")
  let layerCTX = layerCVS.getContext("2d")
  layerCTX.willReadFrequently = true
  layerCVS.width = canvas.offScreenCVS.width
  layerCVS.height = canvas.offScreenCVS.height
  let layer = {
    type: "raster",
    title: name,
    cvs: layerCVS,
    ctx: layerCTX,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    inactiveTools: ["move"],
    hidden: false,
    removed: false,
  }
  return layer
}
