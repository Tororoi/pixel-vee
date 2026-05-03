import { canvas } from '../context/canvas.js'
import {
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
} from '../controls/events.js'
import { applySnapshot } from './applySnapshot.js'

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
        handlePointerDown(e)
      } else if (action.action === 'pointermove') {
        handlePointerMove(e)
      } else if (action.action === 'pointerup') {
        handlePointerUp(e)
      }
    } else if (action.type === 'ui') {
      document.getElementById(action.targetId)?.click()
    }
  }
}
