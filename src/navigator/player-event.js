import { canvas } from '../context/canvas.js'
import {
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
} from '../controls/events.js'
import { renderCursor } from '../gui/cursor.js'
import { applySnapshot } from './applySnapshot.js'
import { navigatorState } from './navigatorState.js'
import { tools } from '../tools/index.js'
import {
  actionHandlers,
  holdHandlers,
  releaseHandlers,
} from '../controls/shortcuts.js'
import { vectorGui } from '../gui/vector.js'

const DEFAULT_STEP_MS = 32
const CANVAS_STEP_SIZE = 8 // canvas units per travel step
const UI_STEP_SIZE = 10 // viewport px per step (already in screen space)

let cancelFlag = false
let stopResolve = null
let currentShape = null
// animateViewportTravel reads these to interpolate from the current cursor
// position without reading style.left/top back from the DOM.
let curVx = 0
let curVy = 0

/**
 * Returns a promise that resolves after `ms` milliseconds. Used as the
 * per-step delay throughout the playback loop so each simulated action
 * has a visible pause rather than executing instantaneously.
 * @param {number} ms - Milliseconds to wait.
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Builds a minimal synthetic pointer-event object for a canvas-space
 * coordinate. offsetX/Y are converted to the same screen-space values
 * the real browser produces so existing event handlers require no
 * special-casing for simulated input. getCoalescedEvents is deliberately
 * omitted so handlePointerMove's `?.()` returns undefined and falls back
 * to `?? [e]`, processing this event directly rather than an empty list.
 * @param {number} x - Canvas-space X coordinate.
 * @param {number} y - Canvas-space Y coordinate.
 * @returns {object} Synthetic event compatible with pointer handlers.
 */
function makeMockEvent(x, y) {
  return {
    offsetX: (x + canvas.previousXOffset) * canvas.zoom,
    offsetY: (y + canvas.previousYOffset) * canvas.zoom,
    pointerId: 1,
    target: { setPointerCapture: () => {} },
  }
}

/**
 * Converts a canvas-space coordinate to viewport (fixed) coordinates so
 * the body-level sim cursor element can be positioned over the correct
 * spot on the canvas. Reads the overlay's bounding rect at call time
 * rather than caching it because the rect changes on any pan or resize.
 * Returns zeroes when the overlay is absent to fail gracefully before
 * the DOM is mounted.
 * @param {number} x - Canvas-space X coordinate.
 * @param {number} y - Canvas-space Y coordinate.
 * @returns {{ vx: number, vy: number }} Viewport-space coordinates.
 */
function canvasToViewport(x, y) {
  const ov = navigatorState.overlayEl
  if (!ov) return { vx: 0, vy: 0 }
  const rect = ov.getBoundingClientRect()
  return {
    vx: rect.left + (x + canvas.previousXOffset) * canvas.zoom,
    vy: rect.top + (y + canvas.previousYOffset) * canvas.zoom,
  }
}

// SVG shapes keyed by CSS cursor string. Each entry has the SVG markup and a
// CSS transform that places the hotspot of the cursor at the element's origin
// (left/top), matching what the real browser cursor does for each cursor type.
// Each shape has w×h in CSS px, a hotspot transform, and the SVG markup.
// Sized to match a typical OS cursor (~14px tall). w and h are applied as
// inline styles on the div to guarantee the size regardless of CSS overrides.
const CURSOR_SHAPES = {
  // Gap crosshair, 13×13, hotspot at center
  crosshair: {
    w: 13,
    h: 13,
    transform: 'translate(-7px, -7px)',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" style="display:block;width:13px;height:13px">
      <line x1="6.5" y1="0.5" x2="6.5" y2="4.5"  stroke="rgba(0,0,0,0.85)" stroke-width="2"/>
      <line x1="6.5" y1="8.5" x2="6.5" y2="12.5" stroke="rgba(0,0,0,0.85)" stroke-width="2"/>
      <line x1="0.5" y1="6.5" x2="4.5" y2="6.5"  stroke="rgba(0,0,0,0.85)" stroke-width="2"/>
      <line x1="8.5" y1="6.5" x2="12.5" y2="6.5" stroke="rgba(0,0,0,0.85)" stroke-width="2"/>
      <line x1="6.5" y1="0.5" x2="6.5" y2="4.5"  stroke="white" stroke-width="0.75"/>
      <line x1="6.5" y1="8.5" x2="6.5" y2="12.5" stroke="white" stroke-width="0.75"/>
      <line x1="0.5" y1="6.5" x2="4.5" y2="6.5"  stroke="white" stroke-width="0.75"/>
      <line x1="8.5" y1="6.5" x2="12.5" y2="6.5" stroke="white" stroke-width="0.75"/>
    </svg>`,
  },
  // Classic arrow, 9×14, tip at top-left
  pointer: {
    w: 9,
    h: 14,
    transform: 'translate(-1px, -1px)',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="14" viewBox="0 0 9 14" style="display:block;width:9px;height:14px">
      <path d="M1.5 1.5 L1.5 10.5 L3.5 8.5 L5 12.5 L6.5 12 L5 8 L8 8 Z"
        fill="white" stroke="rgba(0,0,0,0.8)" stroke-width="1"
        stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`,
  },
  // Open grab hand, 13×14, hotspot at upper-center
  grab: {
    w: 13,
    h: 14,
    transform: 'translate(-6px, -7px)',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="14" viewBox="0 0 13 14" style="display:block;width:13px;height:14px">
      <rect x="1.5" y="3.5" width="2" height="5.5" rx="1"   fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9"/>
      <rect x="4"   y="1.5" width="2" height="7"   rx="1"   fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9"/>
      <rect x="6.5" y="2"   width="2" height="6.5" rx="1"   fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9"/>
      <rect x="9.5" y="5"   width="2" height="4"   rx="1"   fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9"/>
      <rect x="1"   y="8"   width="11" height="5.5" rx="2"  fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9"/>
    </svg>`,
  },
  // Closed grab hand — same shape for simplicity
  grabbing: {
    w: 13,
    h: 14,
    transform: 'translate(-6px, -7px)',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="14" viewBox="0 0 13 14" style="display:block;width:13px;height:14px">
      <rect x="1.5" y="3.5" width="2" height="5.5" rx="1"   fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9"/>
      <rect x="4"   y="1.5" width="2" height="7"   rx="1"   fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9"/>
      <rect x="6.5" y="2"   width="2" height="6.5" rx="1"   fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9"/>
      <rect x="9.5" y="5"   width="2" height="4"   rx="1"   fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9"/>
      <rect x="1"   y="8"   width="11" height="5.5" rx="2"  fill="white" stroke="rgba(0,0,0,0.75)" stroke-width="0.9"/>
    </svg>`,
  },
  // Four-way move arrows, 13×13, hotspot at center
  move: {
    w: 13,
    h: 13,
    transform: 'translate(-7px, -7px)',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" style="display:block;width:13px;height:13px">
      <polygon points="6.5,0.5 4,4   9,4"   fill="white" stroke="rgba(0,0,0,0.8)" stroke-width="0.75" stroke-linejoin="round"/>
      <polygon points="6.5,12.5 4,9  9,9"   fill="white" stroke="rgba(0,0,0,0.8)" stroke-width="0.75" stroke-linejoin="round"/>
      <polygon points="0.5,6.5 4,4   4,9"   fill="white" stroke="rgba(0,0,0,0.8)" stroke-width="0.75" stroke-linejoin="round"/>
      <polygon points="12.5,6.5 9,4  9,9"   fill="white" stroke="rgba(0,0,0,0.8)" stroke-width="0.75" stroke-linejoin="round"/>
    </svg>`,
  },
  // Default arrow — select/magic-wand tools
  default: {
    w: 9,
    h: 14,
    transform: 'translate(-1px, -1px)',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="14" viewBox="0 0 9 14" style="display:block;width:9px;height:14px">
      <path d="M1.5 1.5 L1.5 10.5 L3.5 8.5 L5 12.5 L6.5 12 L5 8 L8 8 Z"
        fill="white" stroke="rgba(0,0,0,0.8)" stroke-width="1"
        stroke-linejoin="round" stroke-linecap="round"/>
    </svg>`,
  },
}
// eyedropper uses cursor:'none' (renders its own pixel cursor) — fall back to crosshair
CURSOR_SHAPES.none = CURSOR_SHAPES.crosshair

/**
 * Swaps the sim cursor element's SVG to match the given CSS cursor string.
 * Falls back to 'crosshair' for unknown or falsy values, including 'none'
 * (used by the eyedropper's own pixel cursor). The early-return on an
 * unchanged shape avoids redundant innerHTML writes during high-frequency
 * pointermove sequences where the cursor type rarely changes.
 * @param {string} cursorStr - CSS cursor value to represent.
 */
function setSimCursorShape(cursorStr) {
  const el = navigatorState.simCursorEl
  const key = cursorStr && CURSOR_SHAPES[cursorStr] ? cursorStr : 'crosshair'
  if (!el || currentShape === key) return
  currentShape = key
  const shape = CURSOR_SHAPES[key]
  el.innerHTML = shape.html
  el.style.transform = shape.transform
  // Enforce pixel dimensions as inline styles — overrides any CSS that would
  // otherwise expand a block-level fixed element to the viewport width.
  el.style.width = shape.w + 'px'
  el.style.height = shape.h + 'px'
}

/**
 * Positions the sim cursor element at the given viewport-space coordinates
 * and records them in curVx/curVy so animateViewportTravel can interpolate
 * from the current position. Uses left/top rather than transform because
 * the hotspot offset is already baked into each shape's own transform
 * property, and stacking a second translate would double-apply it.
 * @param {number} vx - Viewport X (left) in CSS pixels.
 * @param {number} vy - Viewport Y (top) in CSS pixels.
 */
function moveSimCursor(vx, vy) {
  const el = navigatorState.simCursorEl
  if (!el) return
  el.style.left = vx + 'px'
  el.style.top = vy + 'px'
  curVx = vx
  curVy = vy
}

/**
 * Prepares the UI for simulated playback by enabling pointer-event capture
 * on the overlay element so real mouse input is blocked from reaching the
 * canvas. The sim cursor is shown and reset to a known initial shape because
 * currentShape may hold a stale value from the previous playback run,
 * which would cause setSimCursorShape's no-op guard to skip the first
 * shape assignment.
 */
function beginPlayback() {
  const ov = navigatorState.overlayEl
  if (ov) ov.style.pointerEvents = 'all'
  currentShape = null
  setSimCursorShape('crosshair')
  const sc = navigatorState.simCursorEl
  if (sc) sc.style.display = 'block'
}

/**
 * Tears down the playback state once a run completes or is cancelled.
 * Restores pass-through pointer events on the overlay so the user can
 * interact with the canvas normally, and hides the sim cursor. Resetting
 * currentShape ensures the next beginPlayback always re-renders the
 * initial cursor shape rather than treating it as a no-op if the shape
 * happened to match the stale value.
 */
function endPlayback() {
  const ov = navigatorState.overlayEl
  if (ov) ov.style.pointerEvents = 'none'
  const sc = navigatorState.simCursorEl
  if (sc) sc.style.display = 'none'
  currentShape = null
}

/**
 * Animates the sim cursor from (x1,y1) to (x2,y2) in canvas space, firing
 * handlePointerMove at each step so tools that rely on continuous move
 * events (e.g. line preview, pixel cursor tracking) update in sync with
 * the visible cursor. Step count is capped at 120 so very long drags
 * finish in a reasonable time; CANVAS_STEP_SIZE controls granularity.
 * @param {number} x1 - Start X in canvas coordinates.
 * @param {number} y1 - Start Y in canvas coordinates.
 * @param {number} x2 - End X in canvas coordinates.
 * @param {number} y2 - End Y in canvas coordinates.
 * @param {number} stepMs - Milliseconds to wait between steps.
 * @returns {Promise<void>}
 */
async function animateCanvasTravel(x1, y1, x2, y2, stepMs) {
  const dist = Math.hypot(x2 - x1, y2 - y1)
  if (dist < 1) return
  const steps = Math.min(120, Math.ceil(dist / CANVAS_STEP_SIZE))
  for (let i = 1; i <= steps; i++) {
    if (cancelFlag) return
    const t = i / steps
    const x = Math.round(x1 + (x2 - x1) * t)
    const y = Math.round(y1 + (y2 - y1) * t)
    handlePointerMove(makeMockEvent(x, y))
    renderCursor()
    const { vx, vy } = canvasToViewport(x, y)
    moveSimCursor(vx, vy)
    await sleep(stepMs)
  }
}

/**
 * Moves the sim cursor from its current viewport position to (vx2, vy2)
 * without firing any canvas pointer events. Used for canvas-to-UI,
 * UI-to-canvas, and UI-to-UI transitions where only the visible cursor
 * position should change. The start coordinates are snapshotted into
 * locals at call time so that a re-entrant call cannot corrupt the
 * interpolation start point mid-animation.
 * @param {number} vx2 - Target viewport X in CSS pixels.
 * @param {number} vy2 - Target viewport Y in CSS pixels.
 * @param {number} stepMs - Milliseconds to wait between steps.
 * @returns {Promise<void>}
 */
async function animateViewportTravel(vx2, vy2, stepMs) {
  const dist = Math.hypot(vx2 - curVx, vy2 - curVy)
  if (dist < 1) return
  const steps = Math.min(120, Math.ceil(dist / UI_STEP_SIZE))
  const startVx = curVx
  const startVy = curVy
  for (let i = 1; i <= steps; i++) {
    if (cancelFlag) return
    const t = i / steps
    moveSimCursor(startVx + (vx2 - startVx) * t, startVy + (vy2 - startVy) * t)
    await sleep(stepMs)
  }
}

/**
 * Plays a recorded script of canvas and UI actions in real time, animating
 * the sim cursor between each interaction to mirror natural user movement.
 * beginPlayback blocks real pointer input for the duration, and endPlayback
 * runs in a finally block to guarantee cleanup even when cancelled.
 * prevWasCanvas tracks which coordinate space the preceding action used so
 * travel animates via handlePointerMove (canvas) or viewport interpolation
 * (UI/off-canvas). The cursor is seeded at the first pointerdown location
 * so it appears on-canvas from the first frame rather than teleporting in
 * from (0,0).
 * @param {object} script - Recorded script with an `actions` array.
 * @param {object} [options] - Playback timing options.
 * @param {number} [options.stepMs] - Per-step delay in milliseconds.
 * @returns {Promise<void>}
 */
export async function playEventMode(script, { stepMs = DEFAULT_STEP_MS } = {}) {
  cancelFlag = false
  beginPlayback()

  try {
    const firstDown = script.actions.find(
      (a) => a.type === 'canvas' && a.action === 'pointerdown',
    )
    let lastX = firstDown?.x ?? 0
    let lastY = firstDown?.y ?? 0
    // Avoids a visible teleport from (0,0) when the overlay first appears.
    const { vx: initVx, vy: initVy } = canvasToViewport(lastX, lastY)
    moveSimCursor(initVx, initVy)

    // Canvas-space travel fires handlePointerMove; viewport travel does
    // not — the preceding action's space determines which path to take.
    let prevWasCanvas = true
    // Tool cursor from the last pointerdown snapshot — used at pointerup to
    // restore the non-dragging state (e.g. grab after grabbing).
    let lastToolCursor = 'crosshair'

    for (const action of script.actions) {
      if (cancelFlag) break

      if (action.type === 'canvas') {
        const x = action.x ?? 0
        const y = action.y ?? 0

        if (action.action === 'pointerdown') {
          const toolCursor =
            tools[action.snapshot?.toolName]?.cursor ?? 'crosshair'
          lastToolCursor = toolCursor
          setSimCursorShape(toolCursor === 'grab' ? 'grabbing' : toolCursor)
          if (prevWasCanvas) {
            // Canvas-to-canvas: handlePointerMove keeps the pixel cursor live.
            await animateCanvasTravel(lastX, lastY, x, y, stepMs)
          } else {
            // UI-to-canvas: cursor is in viewport space, not canvas space.
            const { vx, vy } = canvasToViewport(x, y)
            await animateViewportTravel(vx, vy, stepMs)
          }
          if (cancelFlag) break
          applySnapshot(action.snapshot)
          // Position the canvas cursor at the target before rendering.
          // When the previous action was a UI click, animateViewportTravel
          // ran instead of animateCanvasTravel, so canvas.x/y were never
          // updated. Without this move, vectorGui.render() uses a stale
          // cursor position and rerouteVectorStepsAction misses the correct
          // collision, sending the adjustment to the wrong vector.
          handlePointerMove(makeMockEvent(x, y))
          vectorGui.render()
          handlePointerDown(makeMockEvent(x, y))
          const { vx, vy } = canvasToViewport(x, y)
          moveSimCursor(vx, vy)
          lastX = x
          lastY = y
          prevWasCanvas = true
        } else if (action.action === 'pointermove') {
          handlePointerMove(makeMockEvent(x, y))
          renderCursor()
          const { vx, vy } = canvasToViewport(x, y)
          moveSimCursor(vx, vy)
          await sleep(stepMs)
          lastX = x
          lastY = y
        } else if (action.action === 'pointerup') {
          // Restore non-dragging cursor (grab after grabbing, etc.)
          setSimCursorShape(lastToolCursor)
          handlePointerUp(makeMockEvent(x, y))
          const { vx, vy } = canvasToViewport(x, y)
          moveSimCursor(vx, vy)
          lastX = x
          lastY = y
          prevWasCanvas = true
        }
      } else if (action.type === 'ui') {
        setSimCursorShape('pointer')
        // Cursor must visually arrive before the click to feel authentic.
        const targetEl = document.getElementById(action.targetId)
        if (targetEl) {
          const rect = targetEl.getBoundingClientRect()
          const vx = rect.left + rect.width / 2
          const vy = rect.top + rect.height / 2
          await animateViewportTravel(vx, vy, stepMs)
          if (cancelFlag) break
        }
        if (action.action === 'input') {
          const el = document.getElementById(action.targetId)
          if (el) {
            el.value = action.value
            el.dispatchEvent(new Event('input', { bubbles: true }))
          }
        } else {
          document.getElementById(action.targetId)?.click()
        }
        await sleep(stepMs)
        prevWasCanvas = false
      } else if (action.type === 'shortcut') {
        // Execute directly — no cursor travel needed for keyboard shortcuts.
        actionHandlers[action.action]?.(action)
        await sleep(stepMs)
      } else if (action.type === 'hold') {
        holdHandlers[action.key]?.()
        setSimCursorShape(canvas.vectorGuiCVS.style.cursor || 'crosshair')
        await sleep(stepMs)
      } else if (action.type === 'release') {
        releaseHandlers[action.key]?.()
        setSimCursorShape(canvas.vectorGuiCVS.style.cursor || 'crosshair')
        await sleep(stepMs)
      }
    }
  } finally {
    endPlayback()
    stopResolve?.()
    stopResolve = null
  }
}

/**
 * Signals the active playback loop to stop by setting cancelFlag and returns
 * a promise that resolves once endPlayback has run. Callers must await this
 * before restoring the real canvas so no queued actions can fire on it after
 * the snapshot is replaced. stopResolve is cleared inside playEventMode's
 * finally block so the promise is never left dangling if the loop exits
 * naturally before stopEventPlay is called.
 * @returns {Promise<void>}
 */
export function stopEventPlay() {
  cancelFlag = true
  return new Promise((r) => {
    stopResolve = r
  })
}
