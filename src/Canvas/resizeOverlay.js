import { canvas } from '../Context/canvas.js'
import { dom } from '../Context/dom.js'
import { state } from '../Context/state.js'
import { bump } from '../hooks/useAppState.js'
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
 * Returns the new canvas box coordinates in canvas-space (pre-zoom units).
 * @returns {{left: number, top: number, right: number, bottom: number, newWidth: number, newHeight: number}} The box's bounding coordinates and dimensions
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
 * Returns the hit-test radius for handles in canvas-space pixels.
 * @returns {number} The radius within which a pointer is considered to have hit a handle
 */
function getHandleRadius() {
  return Math.max(5, 8 / canvas.zoom)
}

/**
 * Returns the 8 handle positions (canvas-space) for the current resize box.
 * @returns {Array<{id: string, x: number, y: number}>} The handle descriptors with their canvas-space coordinates
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
 * Hit-tests a canvas-space point against the 8 handles and box interior.
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
 * Applies a drag delta to resizeOverlay state for the given handle.
 * Enforces minimum and maximum dimensions.
 * @param {string} handle - handle id ('tl', 'r', 'move', etc.)
 * @param {number} dx - horizontal delta in canvas pixels
 * @param {number} dy - vertical delta in canvas pixels
 * @returns {{effectiveDx: number, effectiveDy: number}} the delta actually applied (0 when clamped)
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
 * Writes the current overlay width/height into the canvas size form inputs.
 */
function syncFormInputs() {
  if (dom.canvasWidth) dom.canvasWidth.value = Math.round(resizeOverlay.newWidth)
  if (dom.canvasHeight) dom.canvasHeight.value = Math.round(resizeOverlay.newHeight)
  bump()
}

/**
 * Renders the resize overlay onto resizeOverlayCVS:
 * dims the viewport with a hole for the new canvas area, draws the
 * marching-ants border around the new bounds, and draws the 8 drag handles.
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
  const circleRadius = zoom <= 4 ? 8 / zoom : 1.5
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
 * Activates the resize overlay: initializes state from the current canvas size,
 * resets the anchor grid UI to top-left, syncs form inputs, and starts the
 * shared marching-ants loop pointed at renderResizeOverlayCVS.
 */
export function activateResizeOverlay() {
  stopMarchingAnts()
  state.canvas.resizeOverlayActive = true
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
 * Deactivates the resize overlay: stops the animation, clears the overlay canvas,
 * restores the selection GUI canvas to its normal state, and resets the cursor.
 */
export function deactivateResizeOverlay() {
  stopMarchingAnts()
  state.canvas.resizeOverlayActive = false
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
  canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
}

/**
 * Handles pointerdown on the vector GUI canvas while the resize overlay is active.
 * Hit-tests handles, begins a drag, and captures the pointer.
 * @param {PointerEvent} e - The pointerdown event from the vector GUI canvas
 */
export function resizeOverlayPointerDown(e) {
  const cx = Math.floor(e.offsetX / canvas.zoom)
  const cy = Math.floor(e.offsetY / canvas.zoom)
  state.cursor.x = Math.round(cx - canvas.previousXOffset)
  state.cursor.y = Math.round(cy - canvas.previousYOffset)
  const hit = hitTestHandles(cx, cy)
  resizeOverlay.dragHandle = hit
  resizeOverlay.prevCx = cx
  resizeOverlay.prevCy = cy
  if (hit) {
    const keys = HANDLE_TO_KEYS[hit]
    vectorGui.selectedPoint = keys
      ? { xKey: keys.x, yKey: keys.y }
      : { xKey: null, yKey: null }
    e.target.setPointerCapture(e.pointerId)
  }
}

/**
 * Handles pointermove on the vector GUI canvas while the resize overlay is active.
 * Applies drag deltas when dragging, or updates the cursor on hover.
 * @param {PointerEvent} e - The pointermove event from the vector GUI canvas
 */
export function resizeOverlayPointerMove(e) {
  const cx = Math.floor(e.offsetX / canvas.zoom)
  const cy = Math.floor(e.offsetY / canvas.zoom)
  state.cursor.x = Math.round(cx - canvas.previousXOffset)
  state.cursor.y = Math.round(cy - canvas.previousYOffset)
  const { dragHandle, prevCx, prevCy } = resizeOverlay
  if (dragHandle) {
    const dx = cx - prevCx
    const dy = cy - prevCy
    const { effectiveDx, effectiveDy } = applyDrag(dragHandle, dx, dy)
    resizeOverlay.prevCx += effectiveDx
    resizeOverlay.prevCy += effectiveDy
    syncFormInputs()
  }
  // Cursor is now set by setSelectionCursorStyle inside drawSelectControlPoints on each animation frame
}

/**
 * Handles pointerup on the vector GUI canvas while the resize overlay is active.
 * Releases the drag and updates the cursor.
 * @param {PointerEvent} e - The pointerup event from the vector GUI canvas
 */
export function resizeOverlayPointerUp(e) {
  resizeOverlay.dragHandle = null
  vectorGui.selectedPoint = { xKey: null, yKey: null }
  const cx = Math.floor(e.offsetX / canvas.zoom)
  const cy = Math.floor(e.offsetY / canvas.zoom)
  state.cursor.x = Math.round(cx - canvas.previousXOffset)
  state.cursor.y = Math.round(cy - canvas.previousYOffset)
  // Cursor will be updated on next animation frame by drawSelectControlPoints
}

/**
 * Sets the active anchor without repositioning the overlay box.
 * The anchor is used by applyFromInputs to determine which edge stays fixed
 * when the user types new dimensions.
 * @param {string} anchorName - one of the ANCHOR_FACTORS keys
 */
export function setAnchor(anchorName) {
  resizeOverlay.anchor = anchorName
}

/**
 * Updates resizeOverlay dimensions from typed form input values, shifting
 * contentOffsetX/Y so the currently anchored edge remains fixed.
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
 * Commits the resize: deactivates the overlay, updates the cumulative crop offset
 * in state, resizes the canvas (which replays the timeline with the new offset),
 * and pushes a resize action onto the undo stack.
 */
export function applyResize() {
  const w = Math.round(resizeOverlay.newWidth)
  const h = Math.round(resizeOverlay.newHeight)
  const contentOffsetX = Math.round(resizeOverlay.contentOffsetX)
  const contentOffsetY = Math.round(resizeOverlay.contentOffsetY)

  // Snapshot current canvas state for the "from" side of the action
  const fromWidth = canvas.offScreenCVS.width
  const fromHeight = canvas.offScreenCVS.height
  const fromCropOffsetX = state.canvas.cropOffsetX
  const fromCropOffsetY = state.canvas.cropOffsetY

  // The content offset from the overlay is additive to the cumulative crop offset
  const toCropOffsetX = fromCropOffsetX + contentOffsetX
  const toCropOffsetY = fromCropOffsetY + contentOffsetY

  deactivateResizeOverlay()
  dom.sizeContainer.style.display = 'none'

  // Update the crop offset before resizing so the timeline replay uses the new values
  state.canvas.cropOffsetX = toCropOffsetX
  state.canvas.cropOffsetY = toCropOffsetY

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

  // Shift selection coordinates to match the new canvas space
  if (state.selection.properties.px1 !== null) {
    state.selection.properties.px1 += contentOffsetX
    state.selection.properties.py1 += contentOffsetY
    state.selection.properties.px2 += contentOffsetX
    state.selection.properties.py2 += contentOffsetY
    state.selection.setBoundaryBox(state.selection.properties)
  }
  if (state.selection.maskSet) {
    const newMaskSet = new Set()
    for (const key of state.selection.maskSet) {
      const nx = (key & 0xffff) + contentOffsetX
      const ny = ((key >> 16) & 0xffff) + contentOffsetY
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        newMaskSet.add((ny << 16) | nx)
      }
    }
    state.selection.maskSet = newMaskSet
  }

  // Push a resize action so the operation can be undone/redone
  const resizeAction = {
    index: state.timeline.undoStack.length,
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
    selectProperties: { ...state.selection.properties },
    maskSet: state.selection.maskSet
      ? Array.from(state.selection.maskSet)
      : null,
    selectedVectorIndices: Array.from(state.vector.selectedIndices),
    currentVectorIndex: state.vector.currentIndex,
    hidden: false,
    removed: false,
    snapshot: null,
    boundaryBox: { xMin: 0, yMin: 0, xMax: w, yMax: h },
    recordedCropOffsetX: toCropOffsetX,
    recordedCropOffsetY: toCropOffsetY,
  }
  state.timeline.undoStack.push(resizeAction)
  state.timeline.currentAction = resizeAction
}
