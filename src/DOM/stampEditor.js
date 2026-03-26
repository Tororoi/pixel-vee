import { dom } from "../Context/dom.js"
import { swatches } from "../Context/swatch.js"
import { customBrushStamp } from "../Context/brushStamps.js"
import { brush } from "../Tools/brush.js"
import { renderBrushStampToDOM } from "./renderBrush.js"

//====================================//
//=== * * * Stamp Editor * * * =======//
//====================================//

const STAMP_SIZE = 32
const CELL_SIZE = 10 // px per cell in the editor canvas (32 * 10 = 320)
const GRID_COLOR = "#333333"

// Working copy while the editor is open — Map<"x,y", rgba_string>
const editorPixels = new Map()

// Track pointer state for drag-painting
let isPainting = false
let paintMode = "draw" // "draw" | "erase"

//====================================//
//=== * * * Rendering * * * ==========//
//====================================//

/**
 * Redraw the 320×320 editor canvas from editorPixels.
 */
function renderEditorCanvas() {
  const canvas = dom.stampEditorCanvas
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw pixels
  for (const [key, color] of editorPixels) {
    const [x, y] = key.split(",").map(Number)
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
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (const [key, color] of editorPixels) {
    const [x, y] = key.split(",").map(Number)
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
 * @param {"draw"|"erase"} mode
 */
function paintCell(ex, ey, mode) {
  const x = Math.floor(ex / CELL_SIZE)
  const y = Math.floor(ey / CELL_SIZE)
  if (x < 0 || x >= STAMP_SIZE || y < 0 || y >= STAMP_SIZE) return
  const key = `${x},${y}`
  if (mode === "erase") {
    editorPixels.delete(key)
  } else {
    editorPixels.set(key, swatches.primary.color.color)
  }
  renderEditorCanvas()
  renderPreviewCanvas()
}

/**
 * Get editor-local coordinates from a pointer event on the editor canvas.
 * @param {PointerEvent} e
 * @returns {{ex: number, ey: number}}
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
//=== * * * Public API * * * =========//
//====================================//

/**
 * Open the stamp editor dialog, loading the current custom stamp data.
 */
export function openStampEditor() {
  // Load existing stamp into working copy
  editorPixels.clear()
  for (const [key, color] of customBrushStamp.colorMap) {
    editorPixels.set(key, color)
  }
  dom.stampEditorContainer.style.display = "flex"
  renderEditorCanvas()
  renderPreviewCanvas()
}

/**
 * Apply the editor's working copy to customBrushStamp and close the dialog.
 */
function applyStamp() {
  // Rebuild customBrushStamp from editorPixels
  customBrushStamp.pixels = []
  customBrushStamp.pixelSet = new Set()
  customBrushStamp.colorMap = new Map()

  for (const [key, color] of editorPixels) {
    const [x, y] = key.split(",").map(Number)
    customBrushStamp.pixels.push({ x, y })
    customBrushStamp.pixelSet.add((y << 16) | x)
    customBrushStamp.colorMap.set(key, color)
  }

  dom.stampEditorContainer.style.display = "none"

  // Update brush preview if custom type is currently active
  if (brush.brushType === "custom") {
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

  // Pointer events for drawing/erasing
  editorCanvas.addEventListener("pointerdown", (e) => {
    e.preventDefault()
    isPainting = true
    paintMode = e.button === 2 ? "erase" : "draw"
    editorCanvas.setPointerCapture(e.pointerId)
    const { ex, ey } = getEditorCoords(e)
    paintCell(ex, ey, paintMode)
  })

  editorCanvas.addEventListener("pointermove", (e) => {
    if (!isPainting) return
    const { ex, ey } = getEditorCoords(e)
    paintCell(ex, ey, paintMode)
  })

  editorCanvas.addEventListener("pointerup", () => {
    isPainting = false
  })

  editorCanvas.addEventListener("pointercancel", () => {
    isPainting = false
  })

  // Suppress right-click context menu on the editor canvas
  editorCanvas.addEventListener("contextmenu", (e) => e.preventDefault())

  // Buttons
  dom.stampEditorApplyBtn?.addEventListener("click", applyStamp)
  dom.stampEditorClearBtn?.addEventListener("click", clearStamp)
}
