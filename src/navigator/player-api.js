import { canvas } from '../context/canvas.js'
import {
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
} from '../controls/events.js'
import { applySnapshot } from './applySnapshot.js'
import { actionHandlers, holdHandlers, releaseHandlers } from '../controls/shortcuts.js'
import { vectorGui } from '../gui/vector.js'

/**
 * Builds a minimal synthetic pointer event accepted by the pointer
 * handlers. offsetX/offsetY are back-calculated from canvas-space
 * coordinates by inverting the formula setCoordinates() applies, so
 * handlers see the intended pixel position without needing a real DOM
 * event. getCoalescedEvents is intentionally omitted so
 * handlePointerMove's coalesced-event path falls back to processing
 * this event itself rather than an empty list.
 * @param {number} x - Canvas-space x coordinate.
 * @param {number} y - Canvas-space y coordinate.
 * @returns {{offsetX: number, offsetY: number, pointerId: number,
 *   target: {setPointerCapture: Function}}} Synthetic event object.
 */
function makeMockEvent(x, y) {
  return {
    offsetX: (x + canvas.previousXOffset) * canvas.zoom,
    offsetY: (y + canvas.previousYOffset) * canvas.zoom,
    pointerId: 1,
    target: { setPointerCapture: () => {} },
    // Omitting getCoalescedEvents so handlePointerMove's `?.()` returns
    // undefined and falls back to `?? [e]`, processing this event itself.
    // Returning [] would make the fallback never fire and skip all moves.
  }
}

/**
 * Replays a recorded script by dispatching each action through the
 * same handlers the live UI uses, so tool logic runs identically to
 * real input. Canvas actions use synthetic pointer events rather than
 * DOM events to avoid dependency on layout or focus state. UI actions
 * drive DOM elements directly because they target specific element IDs
 * rather than pointer coordinates, making them layout-independent.
 * Shortcut, hold, and release actions call handler maps directly so
 * keyboard modifiers and focus state cannot interfere with replay.
 * @param {{actions: Array<object>}} script - Parsed action script
 *   whose actions array contains typed action descriptors.
 * @returns {void}
 */
export function playApiMode(script) {
  for (const action of script.actions) {
    if (action.type === 'canvas') {
      const e = makeMockEvent(action.x ?? 0, action.y ?? 0)
      if (action.action === 'pointerdown') {
        applySnapshot(action.snapshot)
        // Update cursor position then force a full vectorGui render so
        // collision state (collidedPoint, selectedCollisionPresent,
        // collidedIndex) is fresh at the target position.
        // handlePointerMove alone skips vectorGui.render() when cursor
        // coordinates haven't changed, leaving stale
        // selectedCollisionPresent=true from the previous stroke's
        // last control point and causing the curve tool to adjust the
        // wrong vector.
        handlePointerMove(e)
        vectorGui.render()
        handlePointerDown(e)
      } else if (action.action === 'pointermove') {
        handlePointerMove(e)
      } else if (action.action === 'pointerup') {
        handlePointerUp(e)
      }
    } else if (action.type === 'ui') {
      if (action.action === 'input') {
        const el = document.getElementById(action.targetId)
        if (el) {
          el.value = action.value
          el.dispatchEvent(new Event('input', { bubbles: true }))
        }
      } else {
        document.getElementById(action.targetId)?.click()
      }
    } else if (action.type === 'shortcut') {
      actionHandlers[action.action]?.(action)
    } else if (action.type === 'hold') {
      holdHandlers[action.key]?.()
    } else if (action.type === 'release') {
      releaseHandlers[action.key]?.()
    }
  }
}
