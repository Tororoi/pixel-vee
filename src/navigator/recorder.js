import { canvas } from '../context/canvas.js'
import { globalState } from '../context/state.js'
import { snapshotToolsState } from '../tools/index.js'
import { snapshotSwatches } from '../context/swatch.svelte.js'
import { keyBindings } from '../controls/shortcuts.js'

let recording = false
let isDrawing = false
let script = null

// Captures complete tool configuration using the same snapshot functions used
// by canvasSwap.js, so any new tool property added to the tools object is
// automatically captured without updating this function.
function captureSnapshot() {
  return {
    selectedName: globalState.tool.selectedName,
    toolsState: snapshotToolsState(),
    swatches: snapshotSwatches(),
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

// Capture-phase keydown listener for modifier-key shortcuts that affect canvas
// state. These never appear as click events so they must be recorded separately.
// We record only the logical action name, not the raw key, so playback calls the
// action function directly and is immune to the conditional onclick bindings in
// the NavBar (hasSelection, hasClipboard, etc.).
function onDocKeydown(e) {
  if (!recording) return
  if (e.repeat) return
  // Don't capture shortcuts while the user is typing in a text field.
  const active = document.activeElement
  if (active?.tagName === 'INPUT' && active.type === 'text') return
  if (active?.tagName === 'TEXTAREA') return

  const meta = e.metaKey || e.ctrlKey
  const shift = e.shiftKey
  const specific = `${meta ? 'meta+' : ''}${shift ? 'shift+' : ''}${e.code}`
  const general  = `${meta ? 'meta+' : ''}${e.code}`
  const action = keyBindings[specific] ?? keyBindings[general]
  if (!action) return

  script.actions.push({ type: 'shortcut', action })
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

// Capture-phase input listener for range sliders. Clicks on range inputs don't
// fire a `click` event — they fire `input`. Recording the value here means
// playback can restore slider state between strokes, ensuring brush size,
// opacity, etc. are correct even when no stroke follows the slider change.
function onDocInput(e) {
  if (!recording) return
  const target = e.target
  if (target.type !== 'range') return
  if (target.closest?.('.navigator-container')) return
  const id = target.id || target.closest?.('[id]')?.id
  if (!id) return
  script.actions.push({ type: 'ui', action: 'input', targetId: id, value: target.value })
}

export function startRecording(scriptObj) {
  script = scriptObj
  recording = true
  canvas.vectorGuiCVS.addEventListener('pointerdown', onPointerDown)
  canvas.vectorGuiCVS.addEventListener('pointermove', onPointerMove)
  canvas.vectorGuiCVS.addEventListener('pointerup', onPointerUp)
  document.addEventListener('keydown', onDocKeydown, true)
  document.addEventListener('click', onDocClick, true)
  document.addEventListener('input', onDocInput, true)
}

export function stopRecording() {
  recording = false
  isDrawing = false
  canvas.vectorGuiCVS.removeEventListener('pointerdown', onPointerDown)
  canvas.vectorGuiCVS.removeEventListener('pointermove', onPointerMove)
  canvas.vectorGuiCVS.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('keydown', onDocKeydown, true)
  document.removeEventListener('click', onDocClick, true)
  document.removeEventListener('input', onDocInput, true)
  const result = script
  script = null
  return result
}

export function isRecording() {
  return recording
}
