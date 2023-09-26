import { dom } from "../DOM/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"

//====================================//
//======== * * * Layers * * * ========//
//====================================//

//Draw all layers onto offscreen canvas to prepare for sampling or export
export function consolidateLayers() {
  canvas.layers.forEach((l) => {
    if (l.type === "raster" && l.opacity > 0) {
      canvas.offScreenCTX.save()
      canvas.offScreenCTX.globalAlpha = l.opacity
      canvas.offScreenCTX.drawImage(
        l.cvs,
        l.x,
        l.y,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      canvas.offScreenCTX.restore()
    }
  })
}

export function createNewRasterLayer(name) {
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
    removed: false,
  }
  return layer
}
