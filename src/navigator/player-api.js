import { canvas } from '../context/canvas.js'
import {
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
} from '../controls/events.js'
import { applySnapshot } from './applySnapshot.js'
import { actionHandlers, holdHandlers, releaseHandlers } from '../controls/shortcuts.js'
import { vectorGui } from '../gui/vector.js'

// Builds a minimal event-like object accepted by the pointer handlers.
// offsetX/offsetY are the values setCoordinates() reads, computed by
// inverting the canvas-space formula: offsetX = (x + previousXOffset) * zoom.
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

export function playApiMode(script) {
  for (const action of script.actions) {
    if (action.type === 'canvas') {
      const e = makeMockEvent(action.x ?? 0, action.y ?? 0)
      if (action.action === 'pointerdown') {
        applySnapshot(action.snapshot)
        // Update cursor position then force a full vectorGui render so collision
        // state (collidedPoint, selectedCollisionPresent, collidedIndex) is freshly
        // computed at the target position. handlePointerMove alone is not enough —
        // it skips vectorGui.render() when cursor coordinates haven't changed, which
        // leaves stale selectedCollisionPresent=true from the previous stroke's last
        // control point, causing the curve tool to adjust the wrong vector.
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
