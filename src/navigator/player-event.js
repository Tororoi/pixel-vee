import { canvas } from '../context/canvas.js'
import {
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
} from '../controls/events.js'
import { renderCursor } from '../gui/cursor.js'

const DEFAULT_STEP_MS = 32

let cancelFlag = false

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function makeMockEvent(x, y) {
  return {
    offsetX: (x + canvas.previousXOffset) * canvas.zoom,
    offsetY: (y + canvas.previousYOffset) * canvas.zoom,
    pointerId: 1,
    target: { setPointerCapture: () => {} },
    getCoalescedEvents: () => [],
  }
}

// Plays the script in real time with delays between steps so the cursor
// visually moves across the canvas. stepMs controls the pause between each
// pointermove and UI action — lower values play faster.
export async function playEventMode(script, { stepMs = DEFAULT_STEP_MS } = {}) {
  cancelFlag = false

  for (const action of script.actions) {
    if (cancelFlag) break

    if (action.type === 'canvas') {
      const e = makeMockEvent(action.x ?? 0, action.y ?? 0)
      if (action.action === 'pointerdown') {
        handlePointerDown(e)
      } else if (action.action === 'pointermove') {
        handlePointerMove(e)
        renderCursor()
        await sleep(stepMs)
      } else if (action.action === 'pointerup') {
        handlePointerUp(e)
      }
    } else if (action.type === 'ui') {
      document.getElementById(action.targetId)?.click()
      await sleep(stepMs)
    }
  }
}

export function stopEventPlay() {
  cancelFlag = true
}
