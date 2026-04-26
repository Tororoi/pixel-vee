import { dom } from './dom.js'
import { tools } from '../tools/index.js'
import { cursorStore } from '../ui/stores/cursor.svelte.js'
import { toolStore } from '../ui/stores/tool.svelte.js'
import { vectorStore } from '../ui/stores/vector.svelte.js'
import { selectionStore } from '../ui/stores/selection.svelte.js'
import { timelineStore } from '../ui/stores/timeline.svelte.js'
import { uiStore } from '../ui/stores/ui.svelte.js'
import { clipboardStore } from '../ui/stores/clipboard.svelte.js'
import { transformStore } from '../ui/stores/transform.svelte.js'
import { drawingStore } from '../ui/stores/drawing.svelte.js'
import { canvasOffsetsStore } from '../ui/stores/canvasOffsets.svelte.js'

//====================================//
//======== * * * State * * * =========//
//====================================//

export const globalState = {
  cursor: cursorStore,
  tool: toolStore,
  vector: vectorStore,
  selection: selectionStore,
  timeline: timelineStore,
  ui: uiStore,
  clipboard: clipboardStore,
  transform: transformStore,
  drawing: drawingStore,
  canvas: canvasOffsetsStore,
  // Cross-domain methods
  reset,
  deselect,
  clearRedoStack,
}

// Internal alias so method bodies can reference the object by its original name
const state = globalState

// ─── Circular dependency injection ────────────────────────────────────────────
let _vectorGui = null
/**
 * Register the vectorGui object. Called once at app startup from main.js.
 * @param {object} vg - the vectorGui singleton
 */
export function registerVectorGui(vg) {
  _vectorGui = vg
}

// ─── State methods ─────────────────────────────────────────────────────────────

/** @returns {void} */
function reset() {
  state.tool.clickCounter = 0
  if (state.vector.properties.forceCircle) {
    state.vector.properties.forceCircle = false
  }
}

/** @returns {void} */
function deselect() {
  state.selection.resetProperties()
  state.selection.resetBoundaryBox()
  state.vector.properties = {}
  if (_vectorGui) {
    _vectorGui.selectedPoint = {
      xKey: null,
      yKey: null,
    }
    _vectorGui.resetCollision()
  }
  state.vector.setCurrentIndex(null)
  state.vector.clearSelected()
  state.ui.vectorTransformOpen = false
  if (dom.vectorTransformUIContainer)
    dom.vectorTransformUIContainer.style.display = 'none'
  if (_vectorGui) {
    _vectorGui.mother.newRotation = 0
    _vectorGui.mother.currentRotation = 0
    _vectorGui.mother.rotationOrigin.x = null
    _vectorGui.mother.rotationOrigin.y = null
  }
}

/** @returns {void} */
function clearRedoStack() {
  state.timeline.currentAction = null
  for (const action of state.timeline.redoStack) {
    if (action.vectorIndices && tools[action.tool].type === 'vector') {
      action.vectorIndices.forEach((index) => {
        delete state.vector.all[index]
      })
    }
    if (action.pastedImageKey && action.tool === 'paste' && !action.confirmed) {
      delete state.clipboard.pastedImages[action.pastedImageKey]
    }
  }
  state.timeline.redoStack = []
}
