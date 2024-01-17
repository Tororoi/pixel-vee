import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"

//====================================//
//======== * * * Layers * * * ========//
//====================================//

/**
 * Draw all layers onto offscreen canvas to prepare for sampling or export
 * @param {Boolean} includeReference - whether to include reference layers as part of consolidated canvas
 */
export function consolidateLayers(includeReference = false) {
  canvas.offScreenCTX.clearRect(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
  canvas.offScreenCTX.imageSmoothingEnabled = false
  canvas.layers.forEach((layer) => {
    if (!layer.hidden && !layer.removed && layer.opacity > 0) {
      canvas.offScreenCTX.save()
      canvas.offScreenCTX.globalAlpha = layer.opacity
      if (layer.type === "raster") {
        canvas.offScreenCTX.drawImage(
          layer.cvs,
          0,
          0,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height
        )
      } else if (includeReference && layer.type === "reference") {
        canvas.offScreenCTX.drawImage(
          layer.img,
          layer.x,
          layer.y,
          layer.img.width * layer.scale,
          layer.img.height * layer.scale
        )
      }
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
  let offscreenLayerCVS = document.createElement("canvas")
  let offscreenLayerCTX = offscreenLayerCVS.getContext("2d", {
    willReadFrequently: true,
  })
  offscreenLayerCVS.width = canvas.offScreenCVS.width
  offscreenLayerCVS.height = canvas.offScreenCVS.height
  let onscreenLayerCVS = document.createElement("canvas")
  let onscreenLayerCTX = onscreenLayerCVS.getContext("2d", {
    willReadFrequently: true,
  })
  onscreenLayerCVS.className = "onscreen-canvas"
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
  let highestId = canvas.layers.reduce(
    (max, layer) => (layer.id > max ? layer.id : max),
    0
  )
  let layer = {
    id: highestId + 1,
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
