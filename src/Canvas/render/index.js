import { canvas } from '../../Context/canvas.js'
import { vectorGui } from '../../GUI/vector.js'
import { setInitialZoom } from '../../utils/canvasHelpers.js'
import {
  drawCanvasLayer,
  renderBackgroundCanvas,
  clearOffscreenCanvas,
} from '../layers/render.js'
import { redrawTimelineActions } from './timeline.js'

export { clearOffscreenCanvas, drawCanvasLayer } from '../layers/render.js'
export { redrawTimelineActions, performAction } from './timeline.js'

// rAF batching for brush stroke renders
let _scheduledLayer = null
let _rafId = null

/**
 * Schedule a renderCanvas call for the next animation frame.
 * Multiple calls before the frame fires collapse into one render,
 * eliminating wasted redraws on high-frequency pointermove events.
 * Only use this when the offscreen canvas is already up-to-date and
 * you just need to blit it to the onscreen canvas (no preview draw follows).
 * @param {object} layer - the layer to render (passed through to renderCanvas)
 */
export function scheduleRender(layer) {
  _scheduledLayer = layer
  if (_rafId === null) {
    _rafId = requestAnimationFrame(() => {
      _rafId = null
      renderCanvas(_scheduledLayer)
      _scheduledLayer = null
    })
  }
}

/**
 * Main render function for the canvas
 * @param {object} activeLayer - pass in a layer to render only that layer
 * @param {boolean} redrawTimeline - pass true to redraw all previous actions
 * @param {Array} activeIndexes - pass in an array of indexes to render only those actions
 * @param {boolean} setImages - pass true to set images for actions between indexes
 */
export function renderCanvas(
  activeLayer = null,
  redrawTimeline = false,
  activeIndexes = null,
  setImages = false,
) {
  //Handle offscreen canvases
  if (redrawTimeline) {
    //clear offscreen layers
    clearOffscreenCanvas(activeLayer)
    //render all previous actions
    redrawTimelineActions(activeLayer, activeIndexes, setImages)
  }
  //Handle onscreen canvases
  //render background canvas
  renderBackgroundCanvas()
  //draw offscreen canvases onto onscreen canvases
  if (activeLayer) {
    drawCanvasLayer(activeLayer)
  } else {
    canvas.layers.forEach((layer) => {
      drawCanvasLayer(layer, null)
    })
  }
}

/**
 * Resize the offscreen canvas and all layers
 * @param {number} width - (Integer)
 * @param {number} height - (Integer)
 */
export const resizeOffScreenCanvas = (width, height) => {
  canvas.offScreenCVS.width = width
  canvas.offScreenCVS.height = height
  canvas.previewCVS.width = width
  canvas.previewCVS.height = height
  // canvas.thumbnailCVS.width = canvas.offScreenCVS.width
  // canvas.thumbnailCVS.height = canvas.offScreenCVS.height
  //reset canvas state
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
  canvas.subPixelX = null
  canvas.subPixelY = null
  canvas.zoomPixelX = null
  canvas.zoomPixelY = null
  //resize layers. Per function, it's cheaper to run this inside the existing iterator in drawLayers, but since drawLayers runs so often, it's preferable to only run this here where it's needed.
  canvas.layers.forEach((layer) => {
    if (layer.type === 'raster') {
      if (
        layer.cvs.width !== canvas.offScreenCVS.width ||
        layer.cvs.height !== canvas.offScreenCVS.height
      ) {
        layer.cvs.width = canvas.offScreenCVS.width
        layer.cvs.height = canvas.offScreenCVS.height
      }
    }
  })
  renderCanvas(null, true) //render all layers and redraw timeline
  vectorGui.render()
}
