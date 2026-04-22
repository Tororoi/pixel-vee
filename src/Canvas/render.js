import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { vectorGui } from '../GUI/vector.js'
import { redrawTimelineActions } from './redrawTimeline.js'

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
 * Draw the canvas layers
 * @param {object} layer - The layer to be drawn
 */
function drawLayer(layer) {
  layer.onscreenCtx.save()

  if (!layer.removed && !layer.hidden) {
    if (layer.type === 'reference') {
      layer.onscreenCtx.globalAlpha = layer.opacity
      //layer.x, layer.y need to be normalized to the pixel grid
      layer.onscreenCtx.drawImage(
        layer.img,
        canvas.xOffset +
          (layer.x * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
        canvas.yOffset +
          (layer.y * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
        layer.img.width * layer.scale,
        layer.img.height * layer.scale,
      )
    } else {
      layer.onscreenCtx.beginPath()
      layer.onscreenCtx.rect(
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height,
      )
      layer.onscreenCtx.clip()
      layer.onscreenCtx.globalAlpha = layer.opacity
      layer.onscreenCtx.drawImage(
        layer.cvs,
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height,
      )
    }
  }
  layer.onscreenCtx.restore()
}

/**
 * Draw canvas layer onto its onscreen canvas
 * @param {object} layer - The layer to be drawn
 */
export function drawCanvasLayer(layer) {
  //Prevent blurring
  layer.onscreenCtx.imageSmoothingEnabled = false
  //clear onscreen canvas
  layer.onscreenCtx.clearRect(
    0,
    0,
    layer.onscreenCvs.width / canvas.zoom,
    layer.onscreenCvs.height / canvas.zoom,
  )
  drawLayer(layer)
  //draw border
  layer.onscreenCtx.beginPath()
  layer.onscreenCtx.rect(
    canvas.xOffset - 1,
    canvas.yOffset - 1,
    canvas.offScreenCVS.width + 2,
    canvas.offScreenCVS.height + 2,
  )
  layer.onscreenCtx.lineWidth = 2
  layer.onscreenCtx.strokeStyle = canvas.borderColor
  layer.onscreenCtx.stroke()
}

/**
 * Render background canvas
 */
function renderBackgroundCanvas() {
  //clear canvas
  canvas.backgroundCTX.clearRect(
    0,
    0,
    canvas.backgroundCVS.width / canvas.zoom,
    canvas.backgroundCVS.height / canvas.zoom,
  )
  //fill background with neutral gray
  canvas.backgroundCTX.fillStyle = canvas.bgColor
  canvas.backgroundCTX.fillRect(
    0,
    0,
    canvas.backgroundCVS.width / canvas.zoom,
    canvas.backgroundCVS.height / canvas.zoom,
  )
  //clear drawing space
  canvas.backgroundCTX.clearRect(
    canvas.xOffset,
    canvas.yOffset,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height,
  )
}

/**
 * Clear offscreen canvas layers as needed
 * @param {object} activeLayer - The layer to be cleared. If not passed in, all layers will be cleared.
 */
export function clearOffscreenCanvas(activeLayer = null) {
  if (activeLayer) {
    //clear one offscreen layer
    if (activeLayer.type === 'raster') {
      activeLayer.ctx.clearRect(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height,
      )
    }
  } else {
    //clear all offscreen layers
    canvas.layers.forEach((layer) => {
      if (layer.type === 'raster') {
        layer.ctx.clearRect(
          0,
          0,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height,
        )
      }
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
  // Skip the clear+redraw when the timeline is empty — this preserves pixel data
  // that was baked directly into layer canvases (e.g. after a content-shift resize).
  if (redrawTimeline && globalState.timeline.undoStack.length > 0) {
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
 * Apply new canvas dimensions: resize all canvases, recalculate transforms,
 * adjust canvas position to stay stable, and resize raster layer canvases (clearing their pixel data).
 * Called by resizeOffScreenCanvas and the undo/redo resize handler.
 * @param {number} width - (Integer)
 * @param {number} height - (Integer)
 * @param {number} [contentOffsetX] - how far the existing art shifted right in the new canvas (canvas pixels)
 * @param {number} [contentOffsetY] - how far the existing art shifted down in the new canvas (canvas pixels)
 */
export function applyCanvasDimensions(
  width,
  height,
  contentOffsetX = 0,
  contentOffsetY = 0,
) {
  canvas.offScreenCVS.width = width
  canvas.offScreenCVS.height = height
  canvas.previewCVS.width = width
  canvas.previewCVS.height = height
  const t = canvas.sharpness * canvas.zoom
  canvas.vectorGuiCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.selectionGuiCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.resizeOverlayCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.cursorCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.layers.forEach((layer) => {
    layer.onscreenCtx.setTransform(t, 0, 0, t, 0, 0)
  })
  canvas.backgroundCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.xOffset = Math.round(canvas.xOffset - contentOffsetX)
  canvas.yOffset = Math.round(canvas.yOffset - contentOffsetY)
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  canvas.subPixelX = null
  canvas.subPixelY = null
  canvas.zoomPixelX = null
  canvas.zoomPixelY = null
  // Resize raster layer canvases (this clears their pixel data)
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
}

/**
 * Resize the offscreen canvas and all layers.
 * @param {number} width - (Integer)
 * @param {number} height - (Integer)
 * @param {number} [contentOffsetX] - how far the existing art shifted right in the new canvas (canvas pixels)
 * @param {number} [contentOffsetY] - how far the existing art shifted down in the new canvas (canvas pixels)
 */
export const resizeOffScreenCanvas = (
  width,
  height,
  contentOffsetX = 0,
  contentOffsetY = 0,
) => {
  applyCanvasDimensions(width, height, contentOffsetX, contentOffsetY)

  renderCanvas(null, true)
  vectorGui.render()
}
