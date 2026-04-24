import { canvas } from '../Context/canvas.js'
import { dom } from '../Context/dom.js'
import { globalState } from '../Context/state.js'
import { resizeOffScreenCanvas } from '../Canvas/render.js'
import {
  stopMarchingAnts,
  startMarchingAnts,
  strokeMarchingAnts,
  renderSelectionCVS,
  drawSelectControlPoints,
} from '../GUI/select.js'
import { vectorGui } from '../GUI/vector.js'
import { renderSelectionDimOverlay } from '../utils/guiHelpers.js'
import { MINIMUM_DIMENSION, MAXIMUM_DIMENSION } from '../utils/constants.js'
import { brush } from '../Tools/brush.js'
import {
  applyDitherOffset,
  applyDitherOffsetControl,
} from '../DOM/renderBrush.js'

// Map handle ID to the pxN key pair used by drawSelectControlPoints
const HANDLE_TO_KEYS = {
  tl: { x: 'px1', y: 'py1' },
  t: { x: 'px2', y: 'py2' },
  tr: { x: 'px3', y: 'py3' },
  r: { x: 'px4', y: 'py4' },
  br: { x: 'px5', y: 'py5' },
  b: { x: 'px6', y: 'py6' },
  bl: { x: 'px7', y: 'py7' },
  l: { x: 'px8', y: 'py8' },
}

// Map anchor name to [xFactor, yFactor]: 0 = left/top, 0.5 = center, 1 = right/bottom
const ANCHOR_FACTORS = {
  'top-left': [0, 0],
  top: [0.5, 0],
  'top-right': [1, 0],
  left: [0, 0.5],
  center: [0.5, 0.5],
  right: [1, 0.5],
  'bottom-left': [0, 1],
  bottom: [0.5, 1],
  'bottom-right': [1, 1],
}

export const resizeOverlay = {
  newWidth: 0,
  newHeight: 0,
  // Where existing art's top-left corner sits in the new canvas (canvas pixels)
  contentOffsetX: 0,
  contentOffsetY: 0,
  anchor: 'top-left',
  dragHandle: null, // null | 'tl'|'t'|'tr'|'r'|'br'|'b'|'bl'|'l'|'move'
  prevCx: 0,
  prevCy: 0,
}

/**
 * Returns the bounding coordinates of the proposed new canvas box in
 * canvas-space (pre-zoom logical units). `left` is derived by subtracting
 * `contentOffsetX` from `canvas.xOffset` because `contentOffsetX` tracks
 * how far the existing art's top-left has shifted inside the new canvas —
 * the new canvas left edge is that many pixels to the left of where the art
 * currently sits.
 * @returns {{left: number, top: number, right: number, bottom: number,
 *   newWidth: number, newHeight: number}} The box's bounding coordinates
 *   and dimensions
 */
function getBoxCoords() {
  const { newWidth, newHeight, contentOffsetX, contentOffsetY } = resizeOverlay
  const left = canvas.xOffset - contentOffsetX
  const top = canvas.yOffset - contentOffsetY
  return {
    left,
    top,
    right: left + newWidth,
    bottom: top + newHeight,
    newWidth,
    newHeight,
  }
}

/**
 * Returns the hit-test radius for handles in canvas-space pixels. At high
 * zoom, `8 / canvas.zoom` keeps the handle target area a consistent
 * physical size on screen; at low zoom the value is clamped to 5 so
 * handles remain usable even when the canvas is very small.
 * @returns {number} The radius within which a pointer hits a handle
 */
function getHandleRadius() {
  return Math.max(5, 8 / canvas.zoom)
}

/**
 * Returns the eight handle positions in canvas-space for the current resize
 * box. Positions are in pre-zoom logical units to match the coordinate space
 * used by the rendering context, which already has the zoom transform
 * applied.
 * @returns {Array<{id: string, x: number, y: number}>} Handle descriptors
 *   with their canvas-space coordinates
 */
function getHandlePositions() {
  const { left, top, right, bottom } = getBoxCoords()
  const midX = (left + right) / 2
  const midY = (top + bottom) / 2
  return [
    { id: 'tl', x: left, y: top },
    { id: 't', x: midX, y: top },
    { id: 'tr', x: right, y: top },
    { id: 'r', x: right, y: midY },
    { id: 'br', x: right, y: bottom },
    { id: 'b', x: midX, y: bottom },
    { id: 'bl', x: left, y: bottom },
    { id: 'l', x: left, y: midY },
  ]
}

/**
 * Hit-tests a canvas-space point against the eight handles and the box
 * interior. Corner handles are checked first and use a tight square hit
 * zone so they take priority over the edge strips that run the full length
 * of each side. Edge handles test the full strip rather than just the
 * midpoint, making them easier to grab on large canvases where the midpoint
 * mark is far from the corners.
 * @param {number} cx - canvas-space x
 * @param {number} cy - canvas-space y
 * @returns {string|null} handle id, 'move', or null
 */
function hitTestHandles(cx, cy) {
  const r = getHandleRadius()
  const { left, top, right, bottom } = getBoxCoords()

  // Corner handles take priority over edge strips
  for (const h of getHandlePositions()) {
    if (
      ['tl', 'tr', 'br', 'bl'].includes(h.id) &&
      Math.abs(cx - h.x) <= r &&
      Math.abs(cy - h.y) <= r
    ) {
      return h.id
    }
  }

  // Edge handles: hit anywhere along the edge strip
  if (Math.abs(cy - top) <= r && cx >= left - r && cx <= right + r) return 't'
  if (Math.abs(cy - bottom) <= r && cx >= left - r && cx <= right + r)
    return 'b'
  if (Math.abs(cx - left) <= r && cy >= top - r && cy <= bottom + r) return 'l'
  if (Math.abs(cx - right) <= r && cy >= top - r && cy <= bottom + r) return 'r'

  // Interior
  if (cx >= left && cx <= right && cy >= top && cy <= bottom) return 'move'
  return null
}

/**
 * Applies a drag delta to the `resizeOverlay` state for the given handle,
 * clamping dimensions between `MINIMUM_DIMENSION` and `MAXIMUM_DIMENSION`.
 * Left and top edge drags adjust `contentOffset` as well as the dimension
 * so the art stays stationary while the canvas boundary moves around it.
 * The return value reports the delta that was actually consumed after
 * clamping; the pointer handler uses this to advance `prevCx`/`prevCy` by
 * only the effective amount, preventing drift when the canvas is at its
 * min or max size.
 * @param {string} handle - handle id ('tl', 'r', 'move', etc.)
 * @param {number} dx - horizontal delta in canvas pixels
 * @param {number} dy - vertical delta in canvas pixels
 * @returns {{effectiveDx: number, effectiveDy: number}} the delta actually
 *   applied (0 when clamped at a dimension limit)
 */
function applyDrag(handle, dx, dy) {
  let effectiveDx = 0
  let effectiveDy = 0

  // Left edge: moving right shrinks canvas; shift content to keep art in place
  if (handle === 'l' || handle === 'tl' || handle === 'bl') {
    const oldW = resizeOverlay.newWidth
    const newW = Math.max(
      MINIMUM_DIMENSION,
      Math.min(MAXIMUM_DIMENSION, oldW - dx),
    )
    // contentOffsetX tracks how much the art has shifted inside the new canvas;
    // shrinking from the left shifts the boundary without moving the art.
    const consumed = oldW - newW
    resizeOverlay.contentOffsetX -= consumed
    resizeOverlay.newWidth = newW
    effectiveDx = consumed
  }
  // Right edge: moving right grows canvas
  if (handle === 'r' || handle === 'tr' || handle === 'br') {
    const oldW = resizeOverlay.newWidth
    const newW = Math.max(
      MINIMUM_DIMENSION,
      Math.min(MAXIMUM_DIMENSION, oldW + dx),
    )
    resizeOverlay.newWidth = newW
    effectiveDx = newW - oldW
  }
  // Top edge: moving down shrinks canvas; shift content to keep art in place
  if (handle === 't' || handle === 'tl' || handle === 'tr') {
    const oldH = resizeOverlay.newHeight
    const newH = Math.max(
      MINIMUM_DIMENSION,
      Math.min(MAXIMUM_DIMENSION, oldH - dy),
    )
    const consumed = oldH - newH
    resizeOverlay.contentOffsetY -= consumed
    resizeOverlay.newHeight = newH
    effectiveDy = consumed
  }
  // Bottom edge: moving down grows canvas
  if (handle === 'b' || handle === 'bl' || handle === 'br') {
    const oldH = resizeOverlay.newHeight
    const newH = Math.max(
      MINIMUM_DIMENSION,
      Math.min(MAXIMUM_DIMENSION, oldH + dy),
    )
    resizeOverlay.newHeight = newH
    effectiveDy = newH - oldH
  }
  // Move: shift the entire canvas box without changing its dimensions
  if (handle === 'move') {
    resizeOverlay.contentOffsetX -= dx
    resizeOverlay.contentOffsetY -= dy
    effectiveDx = dx
    effectiveDy = dy
  }

  return { effectiveDx, effectiveDy }
}

/**
 * Writes the current overlay dimensions into the canvas size form inputs.
 * These are uncontrolled DOM inputs — the React dialog does not own them in
 * the resize flow, so state is pushed directly to avoid a full re-render on
 * every drag event.
 */
function syncFormInputs() {
  if (dom.canvasWidth)
    dom.canvasWidth.value = Math.round(resizeOverlay.newWidth)
  if (dom.canvasHeight)
    dom.canvasHeight.value = Math.round(resizeOverlay.newHeight)
}

/**
 * Renders the resize overlay onto `resizeOverlayCVS`: dims the surrounding
 * viewport with a transparent hole cut for the proposed canvas area, draws
 * a marching-ants border around the new bounds, and draws the eight drag
 * handles. The selection canvas is re-rendered at the end so its outline
 * stays visible during the resize interaction; its dim layer is suppressed
 * separately via `resizeOverlayActive` so the two dim layers do not stack.
 * Handle coordinates are translated from canvas-space to art-relative
 * coordinates before being passed to `drawSelectControlPoints` because that
 * function expects coordinates relative to the canvas origin, not the
 * viewport origin.
 */
export function renderResizeOverlayCVS() {
  const ctx = canvas.resizeOverlayCTX
  const cvs = canvas.resizeOverlayCVS
  const { left, top, right, bottom, newWidth, newHeight } = getBoxCoords()
  const zoom = canvas.zoom

  ctx.save()
  ctx.clearRect(0, 0, cvs.width, cvs.height)

  const artBoundaryBox = {
    xMin: left - canvas.xOffset,
    yMin: top - canvas.yOffset,
    xMax: right - canvas.xOffset,
    yMax: bottom - canvas.yOffset,
  }

  // Dim the viewport with a hole for the new canvas area
  renderSelectionDimOverlay(ctx, artBoundaryBox)

  // Marching-ants border for new canvas box (shared with select tool)
  ctx.save()
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.rect(left, top, newWidth, newHeight)
  strokeMarchingAnts(ctx)
  ctx.restore()

  // Draw 8 handles using the same function as the select tool (hover enlargement included)
  const pointsKeys = [
    { x: 'px1', y: 'py1' },
    { x: 'px2', y: 'py2' },
    { x: 'px3', y: 'py3' },
    { x: 'px4', y: 'py4' },
    { x: 'px5', y: 'py5' },
    { x: 'px6', y: 'py6' },
    { x: 'px7', y: 'py7' },
    { x: 'px8', y: 'py8' },
  ]
  // At low zoom handle circles stay at 1.5 logical pixels; at high zoom they
  // shrink proportionally so they do not cover too many art pixels.
  const circleRadius = zoom <= 4 ? 8 / zoom : 1.5
  // Reset collision before drawing so the cursor style is based only on the
  // current frame's hit state, not a stale result from the previous frame.
  vectorGui.resetCollision()
  drawSelectControlPoints(
    artBoundaryBox,
    pointsKeys,
    circleRadius / 2,
    true,
    0.5,
    null,
    canvas.resizeOverlayCTX,
  )
  if (!vectorGui.selectedCollisionPresent) {
    canvas.vectorGuiCVS.style.cursor = 'default'
  }

  ctx.restore()

  // Keep the selection outline visible during resize (dim suppressed via resizeOverlayActive)
  renderSelectionCVS()
}

/**
 * Activates the resize overlay: initialises state from the current canvas
 * dimensions, resets the anchor to top-left, syncs the form inputs, and
 * starts the shared marching-ants animation loop pointed at
 * `renderResizeOverlayCVS`. Any pre-existing marching-ants loop is stopped
 * first to prevent two concurrent animation loops from running in parallel.
 * The anchor is reset to top-left every time the overlay opens so the form
 * inputs start from a deterministic state regardless of what was last
 * selected.
 */
export function activateResizeOverlay() {
  // Stop any existing marching-ants loop (e.g. an active selection) before
  // starting a new one so they do not run concurrently.
  stopMarchingAnts()
  globalState.canvas.resizeOverlayActive = true
  resizeOverlay.newWidth = canvas.offScreenCVS.width
  resizeOverlay.newHeight = canvas.offScreenCVS.height
  resizeOverlay.contentOffsetX = 0
  resizeOverlay.contentOffsetY = 0
  resizeOverlay.anchor = 'top-left'
  resizeOverlay.dragHandle = null

  // Reset anchor grid UI (legacy DOM path; React dialog handles this via state)
  if (dom.anchorGrid) {
    dom.anchorGrid
      .querySelectorAll('.anchor-btn')
      .forEach((b) => b.classList.remove('active'))
    const topLeftBtn = dom.anchorGrid.querySelector('[data-anchor="top-left"]')
    if (topLeftBtn) topLeftBtn.classList.add('active')
  }

  syncFormInputs()
  // Re-render selection canvas without dim (dim suppressed while resize is active)
  renderSelectionCVS()
  startMarchingAnts(renderResizeOverlayCVS)
}

/**
 * Deactivates the resize overlay: stops the marching-ants animation, clears
 * the overlay canvas, resets collision so tools do not read stale hover
 * state after the overlay closes, and restores the selection canvas and
 * cursor to their normal states. The selection canvas must be re-rendered
 * here because its dim layer was suppressed while `resizeOverlayActive` was
 * true and would not have redrawn itself.
 */
export function deactivateResizeOverlay() {
  stopMarchingAnts()
  globalState.canvas.resizeOverlayActive = false
  resizeOverlay.dragHandle = null
  // Clear the resize overlay canvas
  canvas.resizeOverlayCTX.clearRect(
    0,
    0,
    canvas.resizeOverlayCVS.width,
    canvas.resizeOverlayCVS.height,
  )
  // Clear stale collision from the last animation frame so tools don't misread it
  vectorGui.resetCollision()
  // Restore the selection canvas and restart its animation if needed
  renderSelectionCVS()
  // Restore cursor
  canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
}

/**
 * Handles `pointerdown` on the vector GUI canvas while the resize overlay
 * is active. Converts the screen-space event coordinates to canvas-space,
 * hit-tests against the handles to determine what was clicked, and captures
 * the pointer so that `pointermove` and `pointerup` continue firing even if
 * the pointer leaves the element mid-drag. `vectorGui.selectedPoint` is set
 * so `drawSelectControlPoints` enlarges the active handle on the next frame.
 * @param {PointerEvent} e - The pointerdown event from the vector GUI canvas
 */
export function resizeOverlayPointerDown(e) {
  const cx = Math.floor(e.offsetX / canvas.zoom)
  const cy = Math.floor(e.offsetY / canvas.zoom)
  globalState.cursor.x = Math.round(cx - canvas.previousXOffset)
  globalState.cursor.y = Math.round(cy - canvas.previousYOffset)
  const hit = hitTestHandles(cx, cy)
  resizeOverlay.dragHandle = hit
  resizeOverlay.prevCx = cx
  resizeOverlay.prevCy = cy
  if (hit) {
    const keys = HANDLE_TO_KEYS[hit]
    vectorGui.selectedPoint = keys
      ? { xKey: keys.x, yKey: keys.y }
      : { xKey: null, yKey: null }
    // Capture the pointer so drag events fire even if the cursor leaves the element.
    e.target.setPointerCapture(e.pointerId)
  }
}

/**
 * Handles `pointermove` on the vector GUI canvas while the resize overlay
 * is active. When a drag is in progress, the delta since the last event is
 * passed to `applyDrag` and `prevCx`/`prevCy` are advanced by the effective
 * delta rather than the raw delta. This prevents accumulated position error
 * when the canvas dimension is clamped at its min or max limit — if the
 * pointer keeps moving but the size cannot change, `prevCx`/`prevCy` must
 * not advance either. Cursor updates are deferred to the animation frame
 * inside `drawSelectControlPoints` to avoid layout thrash per move event.
 * @param {PointerEvent} e - The pointermove event from the vector GUI canvas
 */
export function resizeOverlayPointerMove(e) {
  const cx = Math.floor(e.offsetX / canvas.zoom)
  const cy = Math.floor(e.offsetY / canvas.zoom)
  globalState.cursor.x = Math.round(cx - canvas.previousXOffset)
  globalState.cursor.y = Math.round(cy - canvas.previousYOffset)
  const { dragHandle, prevCx, prevCy } = resizeOverlay
  if (dragHandle) {
    const dx = cx - prevCx
    const dy = cy - prevCy
    const { effectiveDx, effectiveDy } = applyDrag(dragHandle, dx, dy)
    // Advance prev by the effective delta (not the raw delta) so position
    // does not drift when dimensions are clamped at min/max.
    resizeOverlay.prevCx += effectiveDx
    resizeOverlay.prevCy += effectiveDy
    syncFormInputs()
  }
  // Cursor is now set by setSelectionCursorStyle inside drawSelectControlPoints on each animation frame
}

/**
 * Handles `pointerup` on the vector GUI canvas while the resize overlay is
 * active. Clears the drag state and the selected point so the next animation
 * frame does not render a handle as active. The cursor is updated on the
 * next animation frame rather than immediately, consistent with the move
 * handler.
 * @param {PointerEvent} e - The pointerup event from the vector GUI canvas
 */
export function resizeOverlayPointerUp(e) {
  resizeOverlay.dragHandle = null
  vectorGui.selectedPoint = { xKey: null, yKey: null }
  const cx = Math.floor(e.offsetX / canvas.zoom)
  const cy = Math.floor(e.offsetY / canvas.zoom)
  globalState.cursor.x = Math.round(cx - canvas.previousXOffset)
  globalState.cursor.y = Math.round(cy - canvas.previousYOffset)
  // Cursor will be updated on next animation frame by drawSelectControlPoints
}

/**
 * Records the active anchor without repositioning the overlay box. The
 * anchor determines which edge of the canvas stays fixed when the user
 * types new dimensions via `applyFromInputs`; it has no effect on drag
 * operations, which always move the boundary relative to the drag handle.
 * @param {string} anchorName - one of the ANCHOR_FACTORS keys
 */
export function setAnchor(anchorName) {
  resizeOverlay.anchor = anchorName
}

/**
 * Updates the overlay dimensions from typed form input values, adjusting
 * `contentOffsetX`/`Y` so the currently anchored edge remains stationary.
 * The `xFactor`/`yFactor` from `ANCHOR_FACTORS` represent the fractional
 * position of the anchor within the canvas (0 = left/top, 1 = right/bottom);
 * multiplying the dimension delta by these factors shifts the art by the
 * correct amount for each anchor position. Inputs are rounded and clamped
 * before use; `Math.round(w) || MINIMUM_DIMENSION` also handles `NaN` from
 * an empty input field.
 * @param {number} w - desired new width
 * @param {number} h - desired new height
 */
export function applyFromInputs(w, h) {
  const newWidth = Math.max(
    MINIMUM_DIMENSION,
    Math.min(MAXIMUM_DIMENSION, Math.round(w) || MINIMUM_DIMENSION),
  )
  const newHeight = Math.max(
    MINIMUM_DIMENSION,
    Math.min(MAXIMUM_DIMENSION, Math.round(h) || MINIMUM_DIMENSION),
  )
  const [xFactor, yFactor] = ANCHOR_FACTORS[resizeOverlay.anchor] ?? [0, 0]
  // Shift the offset by the delta scaled by the anchor factor so the anchored
  // edge stays fixed rather than jumping back to the canonical anchor position.
  resizeOverlay.contentOffsetX = Math.round(
    resizeOverlay.contentOffsetX +
      (newWidth - resizeOverlay.newWidth) * xFactor,
  )
  resizeOverlay.contentOffsetY = Math.round(
    resizeOverlay.contentOffsetY +
      (newHeight - resizeOverlay.newHeight) * yFactor,
  )
  resizeOverlay.newWidth = newWidth
  resizeOverlay.newHeight = newHeight
  syncFormInputs()
}

/**
 * Commits the resize: snapshots the current canvas state for the undo
 * record, deactivates the overlay, updates the cumulative crop offset in
 * global state, adjusts the brush dither offset so the pattern stays
 * locked to art pixels after the content shift, resizes the canvas (which
 * internally replays the entire timeline with the new crop delta applied),
 * remaps the active selection into the new canvas coordinate space, and
 * pushes a resize action onto the undo stack. The crop offset must be
 * updated in state before `resizeOffScreenCanvas` is called because the
 * timeline replay reads `globalState.canvas.cropOffsetX/Y` to position
 * every recorded action correctly.
 */
export function applyResize() {
  const w = Math.round(resizeOverlay.newWidth)
  const h = Math.round(resizeOverlay.newHeight)
  const contentOffsetX = Math.round(resizeOverlay.contentOffsetX)
  const contentOffsetY = Math.round(resizeOverlay.contentOffsetY)

  // Snapshot current canvas state for the "from" side of the action
  const fromWidth = canvas.offScreenCVS.width
  const fromHeight = canvas.offScreenCVS.height
  const fromCropOffsetX = globalState.canvas.cropOffsetX
  const fromCropOffsetY = globalState.canvas.cropOffsetY

  // The overlay's contentOffset is additive to the running crop offset that
  // accumulates across all resize operations since the session started.
  const toCropOffsetX = fromCropOffsetX + contentOffsetX
  const toCropOffsetY = fromCropOffsetY + contentOffsetY

  deactivateResizeOverlay()
  if (dom.sizeContainer) dom.sizeContainer.style.display = 'none'

  // Update the crop offset before resizing so the timeline replay uses the new values
  globalState.canvas.cropOffsetX = toCropOffsetX
  globalState.canvas.cropOffsetY = toCropOffsetY

  // Adjust brush dither offset so the pattern stays locked to art pixels after the content shift
  brush.ditherOffsetX = (((brush.ditherOffsetX - contentOffsetX) % 8) + 8) % 8
  brush.ditherOffsetY = (((brush.ditherOffsetY - contentOffsetY) % 8) + 8) % 8
  const picker = document.querySelector('.dither-picker-container')
  if (picker)
    applyDitherOffset(picker, brush.ditherOffsetX, brush.ditherOffsetY)
  const preview = document.querySelector('.dither-preview')
  if (preview)
    applyDitherOffset(preview, brush.ditherOffsetX, brush.ditherOffsetY)
  const control = document.querySelector('.dither-offset-control')
  if (control)
    applyDitherOffsetControl(
      control.parentElement,
      brush.ditherOffsetX,
      brush.ditherOffsetY,
    )

  // Resize the canvas — applyCanvasDimensions clears layer cvs, then
  // renderCanvas(null, true) replays the timeline with the new crop delta applied
  resizeOffScreenCanvas(w, h, contentOffsetX, contentOffsetY)

  // Remap selection corner points into the new canvas coordinate space.
  if (globalState.selection.properties.px1 !== null) {
    globalState.selection.properties.px1 += contentOffsetX
    globalState.selection.properties.py1 += contentOffsetY
    globalState.selection.properties.px2 += contentOffsetX
    globalState.selection.properties.py2 += contentOffsetY
    globalState.selection.setBoundaryBox(globalState.selection.properties)
  }
  // Remap individual mask pixels; drop any that fall outside the new bounds.
  if (globalState.selection.maskSet) {
    const newMaskSet = new Set()
    for (const key of globalState.selection.maskSet) {
      const nx = (key & 0xffff) + contentOffsetX
      const ny = ((key >> 16) & 0xffff) + contentOffsetY
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        newMaskSet.add((ny << 16) | nx)
      }
    }
    globalState.selection.maskSet = newMaskSet
  }

  // Push a resize action so the operation can be undone/redone
  const resizeAction = {
    index: globalState.timeline.undoStack.length,
    tool: 'resize',
    layer: canvas.currentLayer,
    from: {
      width: fromWidth,
      height: fromHeight,
      cropOffsetX: fromCropOffsetX,
      cropOffsetY: fromCropOffsetY,
    },
    to: {
      width: w,
      height: h,
      cropOffsetX: toCropOffsetX,
      cropOffsetY: toCropOffsetY,
    },
    selectProperties: { ...globalState.selection.properties },
    maskSet: globalState.selection.maskSet
      ? Array.from(globalState.selection.maskSet)
      : null,
    selectedVectorIndices: Array.from(globalState.vector.selectedIndices),
    currentVectorIndex: globalState.vector.currentIndex,
    hidden: false,
    removed: false,
    snapshot: null,
    boundaryBox: { xMin: 0, yMin: 0, xMax: w, yMax: h },
    recordedCropOffsetX: toCropOffsetX,
    recordedCropOffsetY: toCropOffsetY,
  }
  globalState.timeline.undoStack.push(resizeAction)
  globalState.timeline.currentAction = resizeAction
}
