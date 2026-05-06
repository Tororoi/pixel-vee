import { canvas } from '../context/canvas.js'
import { globalState } from '../context/state.js'
import { snapshotToolsState } from '../tools/index.js'
import { snapshotSwatches } from '../context/swatch.svelte.js'
import { swatches } from '../context/swatch.js'
import { keyBindings, holdHandlers } from '../controls/shortcuts.js'
import { vectorGui } from '../gui/vector.js'

let recording = false
let isDrawing = false
let script = null

/**
 * Builds a point-in-time snapshot of tool, swatch, and vector-GUI state.
 * Delegates to the same helpers used by canvasSwap.js so any new tool
 * property is captured automatically without updating this function.
 * selectedCollisionPoint is read after the caller's queueMicrotask fires,
 * meaning handlePointerDown has already settled and the grabbed control
 * point is known — playback restores it directly, bypassing
 * position-ambiguous collision detection.
 * @returns {{ selectedName: string, toolsState: object, swatches: object,
 *   vectorCurrentIndex: number,
 *   selectedCollisionPoint: {xKey: string, yKey: string}|null }} Current
 *   tool/swatch/vector state frozen at the moment of the call.
 */
function captureSnapshot() {
  const snap = {
    selectedName: globalState.tool.selectedName,
    toolsState: snapshotToolsState(),
    swatches: snapshotSwatches(),
    vectorCurrentIndex: globalState.vector.currentIndex,
    // Captured after handlePointerDown runs (Svelte listener fires first), so
    // selectedPoint already reflects the grabbed control point. Playback
    // restores this directly, bypassing position-ambiguous collision detection.
    selectedCollisionPoint: vectorGui.selectedPoint.xKey
      ? { xKey: vectorGui.selectedPoint.xKey, yKey: vectorGui.selectedPoint.yKey }
      : null,
  }
  return snap
}

/**
 * Converts a pointer event's offset coords to integer canvas-space coords.
 * Mirrors the formula in controls/events.js setCoordinates() exactly so
 * recorded coordinates are always in canvas space, independent of the
 * zoom or pan values at record time.
 * @param {PointerEvent} e - The source pointer event.
 * @returns {{ x: number, y: number }} Canvas-space pixel coordinates.
 */
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

/**
 * Records the start of a stroke when a pointer is pressed on the canvas.
 * Sets isDrawing so subsequent move events are captured. Snapshot capture
 * is deferred with queueMicrotask so Svelte's handlePointerDown and
 * rerouteVectorStepsAction have fully settled, ensuring vectorCurrentIndex
 * and selectedPoint reflect the post-event state rather than the
 * pre-event state.
 * @param {PointerEvent} e - The canvas pointerdown event.
 */
function onPointerDown(e) {
  if (!recording) return
  isDrawing = true
  const coords = computeCanvasCoords(e)
  // Defer snapshot capture until after all synchronous event handlers (including
  // Svelte's handlePointerDown / rerouteVectorStepsAction) have run, so that
  // vectorCurrentIndex and selectedPoint reflect the post-switch state.
  queueMicrotask(() => {
    if (!recording) return
    script.actions.push({
      type: 'canvas',
      action: 'pointerdown',
      ...coords,
      snapshot: captureSnapshot(),
    })
  })
}

/**
 * Records coalesced pointer-move events while a stroke is in progress.
 * Guards on isDrawing so idle cursor movement between strokes is not
 * stored. Uses getCoalescedEvents when available to capture all sub-frame
 * positions. Consecutive duplicate canvas-space pixels are skipped to keep
 * script size down without affecting visual fidelity.
 * @param {PointerEvent} e - The canvas pointermove event.
 */
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

/**
 * Records the end of a stroke and clears the isDrawing flag. No snapshot
 * is taken here because pointer-up does not mutate tool or swatch state;
 * the snapshot from the preceding pointerdown covers the full stroke.
 * @param {PointerEvent} e - The canvas pointerup event.
 */
function onPointerUp(e) {
  if (!recording) return
  isDrawing = false
  const coords = computeCanvasCoords(e)
  script.actions.push({ type: 'canvas', action: 'pointerup', ...coords })
}

/**
 * Capture-phase keydown listener that records keyboard shortcuts and hold
 * keys. Records the logical action name rather than the raw key so
 * playback calls the action function directly and is immune to conditional
 * NavBar bindings (hasSelection, hasClipboard, etc.). Repeated keydown
 * events and keypresses inside text inputs are ignored. KeyR (randomize
 * color) is recorded via queueMicrotask so the snapshot captures the
 * post-randomization color rather than the pre-randomization value.
 * @param {KeyboardEvent} e - The document keydown event.
 */
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
  if (action) {
    script.actions.push({ type: 'shortcut', action })
    return
  }

  if (holdHandlers[e.code]) {
    script.actions.push({ type: 'hold', key: e.code })
    return
  }

  // Plain KeyR = randomize color. Use queueMicrotask so the snapshot is taken
  // after the app's keydown handler (not capture phase) has run randomizeColor.
  if (e.code === 'KeyR' && !meta) {
    queueMicrotask(() => {
      if (!recording) return
      script.actions.push({
        type: 'shortcut',
        action: 'setPrimaryColor',
        color: { ...swatches.primary.swatch },
      })
    })
  }
}

/**
 * Capture-phase keyup listener that records the release of held modifier
 * keys. Only fires when the released key is registered in holdHandlers,
 * keeping the script free of unrelated keyup noise.
 * @param {KeyboardEvent} e - The document keyup event.
 */
function onDocKeyup(e) {
  if (!recording) return
  if (holdHandlers[e.code]) {
    script.actions.push({ type: 'release', key: e.code })
  }
}

/**
 * Capture-phase click listener for UI button interactions. Records the
 * nearest ancestor element ID so playback can locate the element without
 * hardcoded coordinates. Ignores clicks on the vector-GUI canvas (handled
 * by pointer listeners) and clicks inside the navigator dialog itself to
 * avoid recording meta-interactions that would corrupt the script.
 * @param {MouseEvent} e - The document click event.
 */
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

/**
 * Capture-phase input listener for range sliders. Range inputs emit
 * `input` rather than `click`, so they require a dedicated listener. The
 * recorded value lets playback restore slider state between strokes,
 * ensuring brush size, opacity, etc. are correct even when no stroke
 * immediately follows a slider change.
 * @param {InputEvent} e - The document input event.
 */
function onDocInput(e) {
  if (!recording) return
  const target = e.target
  if (target.type !== 'range') return
  if (target.closest?.('.navigator-container')) return
  const id = target.id || target.closest?.('[id]')?.id
  if (!id) return
  script.actions.push({ type: 'ui', action: 'input', targetId: id, value: target.value })
}

/**
 * Attaches all capture-phase event listeners and marks the module as
 * actively recording. The caller owns scriptObj; this module only appends
 * action entries to its actions array. All listeners use capture phase so
 * they fire before any stopPropagation calls inside the app.
 * @param {object} scriptObj - Script object with an empty actions array.
 */
export function startRecording(scriptObj) {
  script = scriptObj
  recording = true
  canvas.vectorGuiCVS.addEventListener('pointerdown', onPointerDown)
  canvas.vectorGuiCVS.addEventListener('pointermove', onPointerMove)
  canvas.vectorGuiCVS.addEventListener('pointerup', onPointerUp)
  document.addEventListener('keydown', onDocKeydown, true)
  document.addEventListener('keyup', onDocKeyup, true)
  document.addEventListener('click', onDocClick, true)
  document.addEventListener('input', onDocInput, true)
}

/**
 * Detaches all event listeners, clears module state, and returns the
 * populated script object. Nulling script after capturing the return
 * value prevents any in-flight queueMicrotask callbacks from appending
 * to the script after recording has stopped.
 * @returns {object} The completed script object.
 */
export function stopRecording() {
  recording = false
  isDrawing = false
  canvas.vectorGuiCVS.removeEventListener('pointerdown', onPointerDown)
  canvas.vectorGuiCVS.removeEventListener('pointermove', onPointerMove)
  canvas.vectorGuiCVS.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('keydown', onDocKeydown, true)
  document.removeEventListener('keyup', onDocKeyup, true)
  document.removeEventListener('click', onDocClick, true)
  document.removeEventListener('input', onDocInput, true)
  const result = script
  script = null
  return result
}

/**
 * Returns whether a recording session is currently active. Exposed for
 * other modules that need to suppress or gate behavior during recording,
 * such as the player skipping undo stack manipulation.
 * @returns {boolean} True if a recording session is currently active.
 */
export function isRecording() {
  return recording
}
