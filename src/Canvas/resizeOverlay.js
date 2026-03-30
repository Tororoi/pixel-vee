import { canvas } from '../Context/canvas.js'
import { dom } from '../Context/dom.js'
import { state } from '../Context/state.js'
import { resizeOffScreenCanvas } from '../Canvas/render.js'
import { stopMarchingAnts, renderSelectionCVS } from '../GUI/select.js'


// Map anchor name to [xFactor, yFactor]: 0 = left/top, 0.5 = center, 1 = right/bottom
const ANCHOR_FACTORS = {
  'top-left':     [0,   0  ],
  'top':          [0.5, 0  ],
  'top-right':    [1,   0  ],
  'left':         [0,   0.5],
  'center':       [0.5, 0.5],
  'right':        [1,   0.5],
  'bottom-left':  [0,   1  ],
  'bottom':       [0.5, 1  ],
  'bottom-right': [1,   1  ],
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

function getBoxCoords() {
  const { newWidth, newHeight, contentOffsetX, contentOffsetY } = resizeOverlay
  const left = canvas.xOffset - contentOffsetX
  const top = canvas.yOffset - contentOffsetY
  return { left, top, right: left + newWidth, bottom: top + newHeight, newWidth, newHeight }
}

function getHandleRadius() {
  return Math.max(5, 8 / canvas.zoom)
}

function getHandlePositions() {
  const { left, top, right, bottom } = getBoxCoords()
  const midX = (left + right) / 2
  const midY = (top + bottom) / 2
  return [
    { id: 'tl', x: left,  y: top    },
    { id: 't',  x: midX,  y: top    },
    { id: 'tr', x: right, y: top    },
    { id: 'r',  x: right, y: midY   },
    { id: 'br', x: right, y: bottom },
    { id: 'b',  x: midX,  y: bottom },
    { id: 'bl', x: left,  y: bottom },
    { id: 'l',  x: left,  y: midY   },
  ]
}

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

function getCursorForHandle(handle) {
  switch (handle) {
    case 'tl': case 'br': return 'nwse-resize'
    case 'tr': case 'bl': return 'nesw-resize'
    case 't':  case 'b':  return 'ns-resize'
    case 'l':  case 'r':  return 'ew-resize'
    case 'move': return 'move'
    default: return 'default'
  }
}

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

function syncFormInputs() {
  dom.canvasWidth.value = Math.round(resizeOverlay.newWidth)
  dom.canvasHeight.value = Math.round(resizeOverlay.newHeight)
}

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

export function render() {
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

function animate() {
  resizeOverlay.dashOffset = (resizeOverlay.dashOffset + 0.2) % 8
  render()
  resizeOverlay.animId = requestAnimationFrame(animate)
}

export function activate() {
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
  dom.anchorGrid.querySelectorAll('.anchor-btn').forEach((b) =>
    b.classList.remove('active'),
  )
  const topLeftBtn = dom.anchorGrid.querySelector('[data-anchor="top-left"]')
  if (topLeftBtn) topLeftBtn.classList.add('active')

  syncFormInputs()
  resizeOverlay.animId = requestAnimationFrame(animate)
}

export function deactivate() {
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

export function resizeOverlayPointerUp(e) {
  resizeOverlay.dragHandle = null
  const cx = Math.floor(e.offsetX / canvas.zoom)
  const cy = Math.floor(e.offsetY / canvas.zoom)
  const hit = hitTestHandles(cx, cy)
  canvas.vectorGuiCVS.style.cursor = getCursorForHandle(hit)
}

export function setAnchor(anchorName) {
  resizeOverlay.anchor = anchorName
}

export function applyFromInputs(w, h) {
  const MIN = 8,
    MAX = 1024
  const newWidth = Math.max(MIN, Math.min(MAX, Math.round(w) || MIN))
  const newHeight = Math.max(MIN, Math.min(MAX, Math.round(h) || MIN))
  const [xFactor, yFactor] = ANCHOR_FACTORS[resizeOverlay.anchor] ?? [0, 0]
  // Shift the offset by the delta scaled by the anchor factor so the anchored
  // edge stays fixed rather than jumping back to the canonical anchor position.
  resizeOverlay.contentOffsetX = Math.round(
    resizeOverlay.contentOffsetX + (newWidth - resizeOverlay.newWidth) * xFactor,
  )
  resizeOverlay.contentOffsetY = Math.round(
    resizeOverlay.contentOffsetY + (newHeight - resizeOverlay.newHeight) * yFactor,
  )
  resizeOverlay.newWidth = newWidth
  resizeOverlay.newHeight = newHeight
  syncFormInputs()
}

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

  deactivate()
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
    from: { width: fromWidth, height: fromHeight, cropOffsetX: fromCropOffsetX, cropOffsetY: fromCropOffsetY },
    to: { width: w, height: h, cropOffsetX: toCropOffsetX, cropOffsetY: toCropOffsetY },
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
