import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { vectorGui } from '../GUI/vector.js'
import { redrawTimelineActions } from './redrawTimeline.js'

// rAF batching for brush stroke renders
let _scheduledLayer = null
let _rafId = null

/**
 * Schedules a `renderCanvas` call for the next animation frame, coalescing
 * multiple calls that arrive within the same frame into a single render.
 * This prevents wasted redraws on high-frequency pointermove events where
 * the offscreen canvas is already up to date and only needs to be blitted
 * to the onscreen canvas. `_scheduledLayer` is overwritten on each call so
 * the latest layer wins; a stale layer from an earlier call in the same
 * frame would render the wrong target. Only use this function when the
 * offscreen canvas is already up to date — do not use it when a preview
 * draw follows immediately, as that would produce a visible stale frame.
 * @param {object} layer - the layer to render (passed through to renderCanvas)
 */
export function scheduleRender(layer) {
  // Overwrite on every call so the latest layer is used when the frame fires.
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
 * Draws a single layer from its offscreen canvas onto its paired onscreen
 * canvas. Raster layers are clipped to the offscreen canvas bounds so pixel
 * data cannot bleed outside the drawing area, which matters when the
 * onscreen canvas is larger than the art. Reference layers skip clipping
 * because their image can legitimately extend beyond the canvas boundary.
 * Opacity is applied via `globalAlpha` inside a save/restore pair so the
 * setting does not leak into subsequent draw calls.
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
      // Clip to the offscreen canvas bounds so raster pixels cannot bleed
      // outside the art area into the surrounding viewport.
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
 * Clears the onscreen canvas, blits the layer from its offscreen source,
 * and draws the 1px border that marks the canvas boundary. The border is
 * drawn after the content so it always sits on top of pixel data and stays
 * visible regardless of what colors are painted near the edge. The clear
 * uses `width / canvas.zoom` because the context transform already scales
 * by zoom, so logical canvas-space units must be passed rather than physical
 * pixels.
 * @param {object} layer - The layer to be drawn
 */
export function drawCanvasLayer(layer) {
  // Disable smoothing to preserve hard pixel edges when the zoom is not 1:1.
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
 * Fills the background canvas with the neutral gray surround color and then
 * punches a transparent hole where the drawing area sits. The hole is
 * necessary so the layer canvases stacked below the background in the DOM
 * composite are visible through the background — without it the background
 * would obscure all art.
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
  // Punch out the art area so the layer canvases are visible through the
  // background surround.
  canvas.backgroundCTX.clearRect(
    canvas.xOffset,
    canvas.yOffset,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height,
  )
}

/**
 * Clears the offscreen pixel buffer for one layer or all raster layers.
 * Only raster layers are cleared because reference layers hold an img
 * element rather than mutable pixel data — clearing the reference layer's
 * offscreen buffer (which does not exist) would be a no-op or error. This
 * is called before timeline replay so each layer starts from a blank slate.
 * @param {object} activeLayer - The layer to be cleared. If not passed in,
 *   all layers will be cleared.
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
 * Main render function: rebuilds offscreen layer content from the timeline
 * if requested, then composites everything onto the onscreen canvases.
 * The clear-then-redraw step is skipped when the undo stack is empty to
 * preserve pixel data baked directly into layer canvases (for example,
 * after a content-shift resize that writes art without recording an action).
 * The rendering order — clear offscreen, replay timeline, render background,
 * blit layers — must be maintained: blitting before replay would show stale
 * data, and rendering the background before clearing would incorrectly
 * composite against dirty offscreen content.
 * @param {object} activeLayer - pass in a layer to render only that layer
 * @param {boolean} redrawTimeline - pass true to redraw all previous actions
 * @param {Array} activeIndexes - pass in an array of indexes to render only
 *   those actions
 * @param {boolean} setImages - pass true to set images for actions between
 *   indexes
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
 * Applies new pixel dimensions to all canvases in the stack, reapplies the
 * sharpness×zoom transform to every context (dimension assignment resets
 * it), shifts the viewport offset so the art stays visually stable, and
 * resizes each raster layer's offscreen buffer (clearing its pixel data in
 * the process). Sub-pixel and zoom-pixel caches are invalidated because they
 * were computed for the old dimensions. Only layers whose buffer size
 * actually changed are resized to avoid unnecessarily clearing unchanged
 * canvases. Called by `resizeOffScreenCanvas` and the undo/redo resize
 * handler.
 * @param {number} width - (Integer)
 * @param {number} height - (Integer)
 * @param {number} [contentOffsetX] - how far the existing art shifted right
 *   in the new canvas (canvas pixels)
 * @param {number} [contentOffsetY] - how far the existing art shifted down
 *   in the new canvas (canvas pixels)
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
  // Dimension assignment resets context transforms; reapply sharpness×zoom.
  const t = canvas.sharpness * canvas.zoom
  canvas.vectorGuiCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.selectionGuiCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.resizeOverlayCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.cursorCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.layers.forEach((layer) => {
    layer.onscreenCtx.setTransform(t, 0, 0, t, 0, 0)
  })
  canvas.backgroundCTX.setTransform(t, 0, 0, t, 0, 0)
  // Subtract contentOffset so the art appears at the same screen position
  // after the resize; Math.round avoids sub-pixel blurring.
  canvas.xOffset = Math.round(canvas.xOffset - contentOffsetX)
  canvas.yOffset = Math.round(canvas.yOffset - contentOffsetY)
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  // These cached values were computed for the old canvas dimensions and
  // would produce incorrect cursor or zoom positions if not cleared.
  canvas.subPixelX = null
  canvas.subPixelY = null
  canvas.zoomPixelX = null
  canvas.zoomPixelY = null
  // Resize raster layer canvases (this clears their pixel data)
  canvas.layers.forEach((layer) => {
    if (layer.type === 'raster') {
      // Skip if dimensions are already correct to avoid an unnecessary clear.
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
 * Applies new canvas dimensions and then immediately replays the timeline
 * and re-renders the vector GUI. The three calls must happen in this order:
 * `applyCanvasDimensions` first so the new crop offset is reflected in the
 * canvas state before the timeline replay reads it, then `renderCanvas` to
 * rebuild pixel content, then `vectorGui.render` to update overlay geometry
 * against the new dimensions.
 * @param {number} width - (Integer)
 * @param {number} height - (Integer)
 * @param {number} [contentOffsetX] - how far the existing art shifted right
 *   in the new canvas (canvas pixels)
 * @param {number} [contentOffsetY] - how far the existing art shifted down
 *   in the new canvas (canvas pixels)
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
