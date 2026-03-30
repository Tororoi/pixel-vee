import { dom } from '../Context/dom.js'
import { swatches } from '../Context/swatch.js'
import { customBrushStamp } from '../Context/brushStamps.js'
import { brush } from '../Tools/brush.js'
import { renderBrushStampToDOM } from './renderBrush.js'

//====================================//
//=== * * * Stamp Editor * * * =======//
//====================================//

const STAMP_SIZE = 32
const CELL_SIZE = 10 // px per cell in the editor canvas (32 * 10 = 320)
const GRID_COLOR = '#333333'

// Working copy while the editor is open — Map<"x,y", rgba_string>
const editorPixels = new Map()

// Track pointer state
let isDragging = false
let uiPaintMode = 'draw' // "draw" | "erase" | "move"
let paintMode = 'draw' // resolved per-event (right-click always erases)

// Move tool drag state — tracked in grid cells
let lastMoveCellX = 0
let lastMoveCellY = 0

// The continuous-mode tool buttons (for clearing .selected)
const TOOL_BTNS = () => [dom.stampDrawBtn, dom.stampEraseBtn, dom.stampMoveBtn]

//====================================//
//=== * * * Rendering * * * ==========//
//====================================//

/**
 * Redraw the 320×320 editor canvas from editorPixels.
 */
function renderEditorCanvas() {
  const canvas = dom.stampEditorCanvas
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw pixels
  for (const [key, color] of editorPixels) {
    const [x, y] = key.split(',').map(Number)
    ctx.fillStyle = color
    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
  }

  // Draw grid lines
  ctx.strokeStyle = GRID_COLOR
  ctx.lineWidth = 0.5
  for (let i = 0; i <= STAMP_SIZE; i++) {
    ctx.beginPath()
    ctx.moveTo(i * CELL_SIZE, 0)
    ctx.lineTo(i * CELL_SIZE, STAMP_SIZE * CELL_SIZE)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * CELL_SIZE)
    ctx.lineTo(STAMP_SIZE * CELL_SIZE, i * CELL_SIZE)
    ctx.stroke()
  }
}

/**
 * Redraw the 32×32 preview canvas from editorPixels.
 */
function renderPreviewCanvas() {
  const canvas = dom.stampPreviewCanvas
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const [key, color] of editorPixels) {
    const [x, y] = key.split(',').map(Number)
    ctx.fillStyle = color
    ctx.fillRect(x, y, 1, 1)
  }
}

//====================================//
//=== * * * Drawing * * * ============//
//====================================//

/**
 * Paint or erase the cell at editor canvas coordinates (ex, ey).
 * @param {number} ex - x in editor canvas pixels
 * @param {number} ey - y in editor canvas pixels
 * @param {"draw"|"erase"} mode - Whether to add or remove a pixel at the target cell
 */
function paintCell(ex, ey, mode) {
  const x = Math.floor(ex / CELL_SIZE)
  const y = Math.floor(ey / CELL_SIZE)
  if (x < 0 || x >= STAMP_SIZE || y < 0 || y >= STAMP_SIZE) return
  const key = `${x},${y}`
  if (mode === 'erase') {
    editorPixels.delete(key)
  } else {
    editorPixels.set(key, swatches.primary.color.color)
  }
  renderEditorCanvas()
  renderPreviewCanvas()
}

/**
 * Shift all pixels by (dx, dy), wrapping at stamp edges.
 * @param {number} dx - Horizontal shift in cells
 * @param {number} dy - Vertical shift in cells
 */
function movePixels(dx, dy) {
  if (dx === 0 && dy === 0) return
  const moved = new Map()
  for (const [key, color] of editorPixels) {
    const [x, y] = key.split(',').map(Number)
    const nx = (((x + dx) % STAMP_SIZE) + STAMP_SIZE) % STAMP_SIZE
    const ny = (((y + dy) % STAMP_SIZE) + STAMP_SIZE) % STAMP_SIZE
    moved.set(`${nx},${ny}`, color)
  }
  editorPixels.clear()
  for (const [key, color] of moved) {
    editorPixels.set(key, color)
  }
  renderEditorCanvas()
  renderPreviewCanvas()
}

/**
 * Mirror all pixels horizontally (flip x).
 */
function mirrorH() {
  const mirrored = new Map()
  for (const [key, color] of editorPixels) {
    const [x, y] = key.split(',').map(Number)
    mirrored.set(`${STAMP_SIZE - 1 - x},${y}`, color)
  }
  editorPixels.clear()
  for (const [key, color] of mirrored) {
    editorPixels.set(key, color)
  }
  renderEditorCanvas()
  renderPreviewCanvas()
}

/**
 * Mirror all pixels vertically (flip y).
 */
function mirrorV() {
  const mirrored = new Map()
  for (const [key, color] of editorPixels) {
    const [x, y] = key.split(',').map(Number)
    mirrored.set(`${x},${STAMP_SIZE - 1 - y}`, color)
  }
  editorPixels.clear()
  for (const [key, color] of mirrored) {
    editorPixels.set(key, color)
  }
  renderEditorCanvas()
  renderPreviewCanvas()
}

/**
 * Get editor-local coordinates from a pointer event on the editor canvas.
 * @param {PointerEvent} e - The pointer event fired on the editor canvas
 * @returns {{ex: number, ey: number}} The pointer position in editor canvas pixels
 */
function getEditorCoords(e) {
  const rect = dom.stampEditorCanvas.getBoundingClientRect()
  const scaleX = dom.stampEditorCanvas.width / rect.width
  const scaleY = dom.stampEditorCanvas.height / rect.height
  return {
    ex: (e.clientX - rect.left) * scaleX,
    ey: (e.clientY - rect.top) * scaleY,
  }
}

//====================================//
//=== * * * Toolbar * * * ============//
//====================================//

/**
 * Activate a continuous-mode tool button.
 * @param {HTMLElement} btn - The toolbar button element to mark as selected
 * @param {"draw"|"erase"|"move"} mode - The tool mode to activate
 */
function setToolMode(btn, mode) {
  uiPaintMode = mode
  for (const b of TOOL_BTNS()) b?.classList.remove('selected')
  btn?.classList.add('selected')
  dom.stampEditorCanvas.style.cursor = mode === 'move' ? 'grab' : 'crosshair'
}

//====================================//
//=== * * * Public API * * * =========//
//====================================//

/**
 * Open the stamp editor dialog, loading the current custom stamp data.
 */
export function openStampEditor() {
  setToolMode(dom.stampDrawBtn, 'draw')
  editorPixels.clear()
  for (const [key, color] of customBrushStamp.colorMap) {
    editorPixels.set(key, color)
  }
  dom.stampEditorContainer.style.display = 'flex'
  renderEditorCanvas()
  renderPreviewCanvas()
}

/**
 * Apply the editor's working copy to customBrushStamp and close the dialog.
 */
function applyStamp() {
  customBrushStamp.pixels = []
  customBrushStamp.pixelSet = new Set()
  customBrushStamp.colorMap = new Map()

  for (const [key, color] of editorPixels) {
    const [x, y] = key.split(',').map(Number)
    customBrushStamp.pixels.push({ x, y })
    customBrushStamp.pixelSet.add((y << 16) | x)
    customBrushStamp.colorMap.set(key, color)
  }

  dom.stampEditorContainer.style.display = 'none'

  if (brush.brushType === 'custom') {
    renderBrushStampToDOM()
  }
}

/**
 * Clear all pixels from the working copy.
 */
function clearStamp() {
  editorPixels.clear()
  renderEditorCanvas()
  renderPreviewCanvas()
}

//====================================//
//=== * * * Initialization * * * =====//
//====================================//

/**
 * Set up all stamp editor event listeners. Call once during app init.
 */
export function initStampEditor() {
  const editorCanvas = dom.stampEditorCanvas
  if (!editorCanvas) return

  editorCanvas.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    isDragging = true
    editorCanvas.setPointerCapture(e.pointerId)
    const { ex, ey } = getEditorCoords(e)
    if (uiPaintMode === 'move') {
      lastMoveCellX = Math.floor(ex / CELL_SIZE)
      lastMoveCellY = Math.floor(ey / CELL_SIZE)
      editorCanvas.style.cursor = 'grabbing'
    } else {
      paintMode = e.button === 2 ? 'erase' : uiPaintMode
      paintCell(ex, ey, paintMode)
    }
  })

  editorCanvas.addEventListener('pointermove', (e) => {
    if (!isDragging) return
    const { ex, ey } = getEditorCoords(e)
    if (uiPaintMode === 'move') {
      const cellX = Math.floor(ex / CELL_SIZE)
      const cellY = Math.floor(ey / CELL_SIZE)
      const dx = cellX - lastMoveCellX
      const dy = cellY - lastMoveCellY
      if (dx !== 0 || dy !== 0) {
        movePixels(dx, dy)
        lastMoveCellX = cellX
        lastMoveCellY = cellY
      }
    } else {
      paintCell(ex, ey, paintMode)
    }
  })

  editorCanvas.addEventListener('pointerup', () => {
    isDragging = false
    if (uiPaintMode === 'move') editorCanvas.style.cursor = 'grab'
  })

  editorCanvas.addEventListener('pointercancel', () => {
    isDragging = false
    if (uiPaintMode === 'move') editorCanvas.style.cursor = 'grab'
  })

  editorCanvas.addEventListener('contextmenu', (e) => e.preventDefault())

  // Continuous-mode tool buttons
  dom.stampDrawBtn?.addEventListener('click', () =>
    setToolMode(dom.stampDrawBtn, 'draw'),
  )
  dom.stampEraseBtn?.addEventListener('click', () =>
    setToolMode(dom.stampEraseBtn, 'erase'),
  )
  dom.stampMoveBtn?.addEventListener('click', () =>
    setToolMode(dom.stampMoveBtn, 'move'),
  )

  // Single-click action buttons
  dom.stampMirrorHBtn?.addEventListener('click', mirrorH)
  dom.stampMirrorVBtn?.addEventListener('click', mirrorV)
  dom.stampEditorApplyBtn?.addEventListener('click', applyStamp)
  dom.stampEditorClearBtn?.addEventListener('click', clearStamp)
}
