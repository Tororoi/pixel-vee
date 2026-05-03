import { canvas } from '../context/canvas.js'
import { globalState } from '../context/state.js'
import { swatches } from '../context/swatch.js'

let recording = false
let isDrawing = false
let script = null

function captureSnapshot() {
  const tool = globalState.tool.current
  return {
    toolName: globalState.tool.selectedName,
    modes: tool?.modes ? { ...tool.modes } : {},
    brushSize: tool?.brushSize ?? null,
    brushType: tool?.brushType ?? null,
    ditherPatternIndex: tool?.ditherPatternIndex ?? null,
    primaryColor: { ...swatches.primary.color },
    secondaryColor: { ...swatches.secondary.color },
  }
}

// Mirrors setCoordinates() in controls/events.js — same formula so recorded
// coords are always in canvas space, independent of zoom or pan at record time.
function computeCanvasCoords(e) {
  const x = Math.floor(e.offsetX)
  const y = Math.floor(e.offsetY)
  const zoom = canvas.zoom
  const xOverZoom = Math.floor(x / zoom)
  const yOverZoom = Math.floor(y / zoom)
  return {
    x: Math.round(xOverZoom - canvas.previousXOffset),
    y: Math.round(yOverZoom - canvas.previousYOffset),
  }
}

function onPointerDown(e) {
  if (!recording) return
  isDrawing = true
  const coords = computeCanvasCoords(e)
  script.actions.push({
    type: 'canvas',
    action: 'pointerdown',
    ...coords,
    snapshot: captureSnapshot(),
  })
}

function onPointerMove(e) {
  // Only record moves that are part of an active stroke. Idle cursor movement
  // between actions is not stored — playback interpolates it instead.
  if (!recording || !isDrawing) return
  const events = e.getCoalescedEvents?.() ?? [e]
  for (const evt of events) {
    const coords = computeCanvasCoords(evt)
    const last = script.actions[script.actions.length - 1]
    if (
      last?.action === 'pointermove' &&
      last.x === coords.x &&
      last.y === coords.y
    )
      continue
    script.actions.push({ type: 'canvas', action: 'pointermove', ...coords })
  }
}

function onPointerUp(e) {
  if (!recording) return
  isDrawing = false
  const coords = computeCanvasCoords(e)
  script.actions.push({ type: 'canvas', action: 'pointerup', ...coords })
}

// Capture-phase click listener for UI interactions. Records the nearest
// ancestor element ID so playback can locate the element by ID without
// hardcoded coordinates.
function onDocClick(e) {
  if (!recording) return
  const target = e.target
  // Canvas pointer events are captured by the pointer listeners above
  if (
    canvas.vectorGuiCVS &&
    (target === canvas.vectorGuiCVS || canvas.vectorGuiCVS.contains(target))
  )
    return
  // Skip clicks inside the navigator dialog itself
  if (target.closest?.('.navigator-container')) return
  const id = target.id || target.closest?.('[id]')?.id
  if (!id) return
  script.actions.push({ type: 'ui', action: 'click', targetId: id })
}

export function startRecording(scriptObj) {
  script = scriptObj
  recording = true
  canvas.vectorGuiCVS.addEventListener('pointerdown', onPointerDown)
  canvas.vectorGuiCVS.addEventListener('pointermove', onPointerMove)
  canvas.vectorGuiCVS.addEventListener('pointerup', onPointerUp)
  document.addEventListener('click', onDocClick, true)
}

export function stopRecording() {
  recording = false
  isDrawing = false
  canvas.vectorGuiCVS.removeEventListener('pointerdown', onPointerDown)
  canvas.vectorGuiCVS.removeEventListener('pointermove', onPointerMove)
  canvas.vectorGuiCVS.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('click', onDocClick, true)
  const result = script
  script = null
  return result
}

export function isRecording() {
  return recording
}
