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
 * @returns {Object} layer
 */
export function createNewRasterLayer() {
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
  return {
    id: highestId + 1,
    type: "raster",
    title: `Layer ${highestId + 1}`,
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
}

/**
 * Create a new reference layer
 * @param {Object} img - image object
 * @returns {Object} layer
 */
export function createNewReferenceLayer(img) {
  let onscreenLayerCVS = document.createElement("canvas")
  let onscreenLayerCTX = onscreenLayerCVS.getContext("2d", {
    willReadFrequently: true,
  })
  onscreenLayerCVS.className = "onscreen-canvas"
  dom.canvasLayers.insertBefore(onscreenLayerCVS, dom.canvasLayers.children[0])
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
  //constrain background image to canvas with scale
  let scale =
    canvas.offScreenCVS.width / img.width >
    canvas.offScreenCVS.height / img.height
      ? canvas.offScreenCVS.height / img.height
      : canvas.offScreenCVS.width / img.width //TODO: should be method, not var so width and height can be adjusted without having to set scale again
  let highestId = canvas.layers.reduce(
    (max, layer) => (layer.id > max ? layer.id : max),
    0
  )
  return {
    id: highestId + 1,
    type: "reference",
    title: `Reference ${highestId + 1}`,
    img: img,
    dataUrl: img.src,
    onscreenCvs: onscreenLayerCVS,
    onscreenCtx: onscreenLayerCTX,
    x: 0,
    y: 0,
    scale: scale,
    opacity: 1,
    inactiveTools: [
      "brush",
      "fill",
      "line",
      "quadCurve",
      "cubicCurve",
      "ellipse",
      "select",
    ],
    hidden: false,
    removed: false,
  }
}
