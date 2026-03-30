import { canvas } from '../Context/canvas.js'
import { dom } from '../Context/dom.js'
import { state } from '../Context/state.js'
import { resizeOffScreenCanvas } from '../Canvas/render.js'
import { stopMarchingAnts, renderSelectionCVS } from '../GUI/select.js'

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
  active: false,
  newWidth: 0,
  newHeight: 0,
  // Where existing art's top-left corner sits in the new canvas (canvas pixels)
  contentOffsetX: 0,
  contentOffsetY: 0,
  anchor: 'top-left',
  dragHandle: null, // null | 'tl'|'t'|'tr'|'r'|'br'|'b'|'bl'|'l'|'move'
  prevCx: 0,
  prevCy: 0,
  dashOffset: 0,
  animId: null,
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
  for (const h of getHandlePositions()) {
    if (Math.abs(cx - h.x) <= r && Math.abs(cy - h.y) <= r) {
      return h.id
    }
  }
  const { left, top, right, bottom } = getBoxCoords()
  if (cx >= left && cx <= right && cy >= top && cy <= bottom) return 'move'
  return null
}

/**
 * Returns the CSS cursor string for a given handle id.
 * @param {string|null} handle - Handle id ('tl', 'r', 'move', etc.) or null for no hit
 * @returns {string} The CSS cursor value appropriate for the hovered handle
 */
function getCursorForHandle(handle) {
  switch (handle) {
    case 'tl':
    case 'br':
      return 'nwse-resize'
    case 'tr':
    case 'bl':
      return 'nesw-resize'
    case 't':
    case 'b':
      return 'ns-resize'
    case 'l':
    case 'r':
      return 'ew-resize'
    case 'move':
      return 'move'
    default:
      return 'default'
  }
}

/**
 * Applies a drag delta to resizeOverlay state for the given handle.
 * Enforces a minimum dimension of 8px.
 * @param {string} handle - handle id ('tl', 'r', 'move', etc.)
 * @param {number} dx - horizontal delta in canvas pixels
 * @param {number} dy - vertical delta in canvas pixels
 */
function applyDrag(handle, dx, dy) {
  const ro = resizeOverlay
  const MIN = 8

  if (handle === 'l' || handle === 'tl' || handle === 'bl') {
    const newW = ro.newWidth - dx
    if (newW >= MIN) {
      ro.contentOffsetX -= dx
      ro.newWidth = newW
    }
  }
  if (handle === 'r' || handle === 'tr' || handle === 'br') {
    const newW = ro.newWidth + dx
    if (newW >= MIN) ro.newWidth = newW
  }
  if (handle === 't' || handle === 'tl' || handle === 'tr') {
    const newH = ro.newHeight - dy
    if (newH >= MIN) {
      ro.contentOffsetY -= dy
      ro.newHeight = newH
    }
  }
  if (handle === 'b' || handle === 'bl' || handle === 'br') {
    const newH = ro.newHeight + dy
    if (newH >= MIN) ro.newHeight = newH
  }
  if (handle === 'move') {
    ro.contentOffsetX -= dx
    ro.contentOffsetY -= dy
  }
}

/**
 * Writes the current overlay width/height into the canvas size form inputs.
 */
function syncFormInputs() {
  dom.canvasWidth.value = Math.round(resizeOverlay.newWidth)
  dom.canvasHeight.value = Math.round(resizeOverlay.newHeight)
}

/**
 * Draws a single resize handle onto the given context.
 * Corner handles are squares; edge handles are diamonds.
 * @param {CanvasRenderingContext2D} ctx - The rendering context to draw onto
 * @param {number} cx - center x in canvas-space
 * @param {number} cy - center y in canvas-space
 * @param {number} r - handle radius
 * @param {boolean} isCorner - true for corner handles (square), false for edge (diamond)
 * @param {number} lw - base line width in canvas-space
 */
function drawHandle(ctx, cx, cy, r, isCorner, lw) {
  ctx.lineWidth = lw * 2
  if (isCorner) {
    ctx.beginPath()
    ctx.rect(cx - r, cy - r, r * 2, r * 2)
    ctx.strokeStyle = 'black'
    ctx.stroke()
    ctx.fillStyle = 'white'
    ctx.fill()
  } else {
    const dr = r * Math.SQRT2
    ctx.beginPath()
    ctx.moveTo(cx, cy - dr)
    ctx.lineTo(cx + dr, cy)
    ctx.lineTo(cx, cy + dr)
    ctx.lineTo(cx - dr, cy)
    ctx.closePath()
    ctx.strokeStyle = 'black'
    ctx.stroke()
    ctx.fillStyle = 'white'
    ctx.fill()
  }
}

/**
 * Renders the resize overlay onto the selection GUI canvas:
 * dims the viewport, reveals the new canvas area, draws the animated
 * border around the new bounds, and draws the 8 drag handles.
 */
export function renderResizeOverlay() {
  const ctx = canvas.selectionGuiCTX
  const cvs = canvas.selectionGuiCVS
  const { left, top, newWidth, newHeight } = getBoxCoords()
  const zoom = canvas.zoom
  // Use cvs physical dimensions — intentional overflow is clipped by canvas bounds
  const fullW = cvs.width
  const fullH = cvs.height

  ctx.save()
  ctx.clearRect(0, 0, fullW, fullH)

  // Dim the entire viewport
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)'
  ctx.fillRect(0, 0, fullW, fullH)

  // Reveal the new canvas area (clear the dim)
  ctx.clearRect(left, top, newWidth, newHeight)

  // Existing canvas boundary (dashed reference)
  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 1 / zoom
  ctx.setLineDash([4 / zoom, 4 / zoom])
  ctx.strokeRect(
    canvas.xOffset + 0.5 / zoom,
    canvas.yOffset + 0.5 / zoom,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height,
  )
  ctx.restore()

  // Animated border for new canvas box (two-pass: white + black offset)
  const lw = 1 / zoom
  ctx.lineWidth = lw
  ctx.setLineDash([4 / zoom, 4 / zoom])

  ctx.strokeStyle = 'white'
  ctx.lineDashOffset = resizeOverlay.dashOffset / zoom
  ctx.strokeRect(left + lw, top + lw, newWidth - lw * 2, newHeight - lw * 2)

  ctx.strokeStyle = 'black'
  ctx.lineDashOffset = (resizeOverlay.dashOffset + 4) / zoom
  ctx.strokeRect(left + lw, top + lw, newWidth - lw * 2, newHeight - lw * 2)

  ctx.setLineDash([])

  // Draw 8 handles
  const r = getHandleRadius()
  for (const h of getHandlePositions()) {
    const isCorner = ['tl', 'tr', 'br', 'bl'].includes(h.id)
    drawHandle(ctx, h.x, h.y, r, isCorner, lw)
  }

  ctx.restore()
}

/**
 * Animation loop: advances the marching-ants dash offset and schedules the next frame.
 */
function animateResizeOverlay() {
  resizeOverlay.dashOffset = (resizeOverlay.dashOffset + 0.2) % 8
  renderResizeOverlay()
  resizeOverlay.animId = requestAnimationFrame(animateResizeOverlay)
}

/**
 * Activates the resize overlay: initializes state from the current canvas size,
 * resets the anchor grid UI to top-left, syncs form inputs, and starts the animation loop.
 */
export function activateResizeOverlay() {
  stopMarchingAnts()
  resizeOverlay.active = true
  resizeOverlay.newWidth = canvas.offScreenCVS.width
  resizeOverlay.newHeight = canvas.offScreenCVS.height
  resizeOverlay.contentOffsetX = 0
  resizeOverlay.contentOffsetY = 0
  resizeOverlay.anchor = 'top-left'
  resizeOverlay.dragHandle = null
  resizeOverlay.dashOffset = 0

  // Reset anchor grid UI
  dom.anchorGrid
    .querySelectorAll('.anchor-btn')
    .forEach((b) => b.classList.remove('active'))
  const topLeftBtn = dom.anchorGrid.querySelector('[data-anchor="top-left"]')
  if (topLeftBtn) topLeftBtn.classList.add('active')

  syncFormInputs()
  resizeOverlay.animId = requestAnimationFrame(animateResizeOverlay)
}

/**
 * Deactivates the resize overlay: stops the animation, restores the selection
 * GUI canvas to its normal state, and resets the cursor.
 */
export function deactivateResizeOverlay() {
  if (resizeOverlay.animId !== null) {
    cancelAnimationFrame(resizeOverlay.animId)
    resizeOverlay.animId = null
  }
  resizeOverlay.active = false
  resizeOverlay.dragHandle = null
  // Restore the selection GUI canvas to its normal state
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
  const hit = hitTestHandles(cx, cy)
  resizeOverlay.dragHandle = hit
  resizeOverlay.prevCx = cx
  resizeOverlay.prevCy = cy
  if (hit) {
    canvas.vectorGuiCVS.style.cursor = getCursorForHandle(hit)
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
  const { dragHandle, prevCx, prevCy } = resizeOverlay
  if (dragHandle) {
    const dx = cx - prevCx
    const dy = cy - prevCy
    applyDrag(dragHandle, dx, dy)
    resizeOverlay.prevCx = cx
    resizeOverlay.prevCy = cy
    syncFormInputs()
  } else {
    const hit = hitTestHandles(cx, cy)
    canvas.vectorGuiCVS.style.cursor = getCursorForHandle(hit)
  }
}

/**
 * Handles pointerup on the vector GUI canvas while the resize overlay is active.
 * Releases the drag and updates the cursor.
 * @param {PointerEvent} e - The pointerup event from the vector GUI canvas
 */
export function resizeOverlayPointerUp(e) {
  resizeOverlay.dragHandle = null
  const cx = Math.floor(e.offsetX / canvas.zoom)
  const cy = Math.floor(e.offsetY / canvas.zoom)
  const hit = hitTestHandles(cx, cy)
  canvas.vectorGuiCVS.style.cursor = getCursorForHandle(hit)
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
  const MIN = 8,
    MAX = 1024
  const newWidth = Math.max(MIN, Math.min(MAX, Math.round(w) || MIN))
  const newHeight = Math.max(MIN, Math.min(MAX, Math.round(h) || MIN))
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

  // Resize the canvas — applyCanvasDimensions clears layer cvs, then
  // renderCanvas(null, true) replays the timeline with the new crop delta applied
  resizeOffScreenCanvas(w, h)

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
    maskSet: null,
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
