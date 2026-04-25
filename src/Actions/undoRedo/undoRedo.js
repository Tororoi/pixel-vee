import { globalState } from '../../Context/state.js'
import { vectorGui } from '../../GUI/vector.js'
import { setSaveFilesizePreview } from '../../Save/savefile.js'
import { renderToLatestAction } from './render.js'
import {
  handleModifyAction,
  handleClearAction,
  handlePasteAction,
  handleConfirmPasteAction,
  handleMoveAction,
  handleTransformAction,
  handleResizeAction,
} from './helpers.js'
import { brush, rebuildBuildUpDensityMap } from '../../Tools/brush.js'

//====================================//
//========= * * * Core * * * =========//
//====================================//

/**
 * Core undo/redo engine implementing the command pattern.
 *
 * Pops the top action from `popStack`, applies the state change described by
 * that action in the direction specified by `modType`, pushes the action onto
 * `pushStack`, and then delegates to `renderToLatestAction` to update the
 * canvas and UI.
 *
 * The `modType` string controls which snapshot a reversible action uses:
 *  - `"from"` → undo: restore the state that existed BEFORE the action.
 *  - `"to"`   → redo: restore the state that existed AFTER the action.
 *
 * Most tool-specific side effects (modify, paste, move, transform, resize,
 * etc.) are handled by the dedicated helpers imported from `./helpers.js`.
 * Simpler reversals (addLayer, removeLayer, remove, changeDitherPattern, etc.)
 * are handled inline because they require only a single property assignment.
 *
 * `newLatestAction` is the action that will sit at the top of the undo stack
 * after the pop, i.e. the new "current" state when undoing. Some helpers
 * (confirmPaste, transform) need it to reconstruct intermediate states.
 * @param {Array} pushStack - The stack to push the processed action onto
 *   (redo stack when undoing; undo stack when redoing).
 * @param {Array} popStack - The stack to pop the action from
 *   (undo stack when undoing; redo stack when redoing).
 * @param {string} modType - `"from"` for undo; `"to"` for redo.
 */
export function actionUndoRedo(pushStack, popStack, modType) {
  //latest action is the action about to be undone or redone
  let latestAction = popStack[popStack.length - 1]
  vectorGui.reset()
  //newLatestAction is the action that's about to be the most recent action, if the function is "Undo" ("from")
  let newLatestAction =
    modType === 'from' && popStack.length > 1
      ? popStack[popStack.length - 2]
      : null
  if (modType === 'from' && popStack.length > 1) {
    if (newLatestAction.tool === 'modify') {
      // When the action beneath the one being undone is itself a "modify",
      // the relevant state is the action that was modified, not the modify
      // action wrapper — look it up by its recorded index.
      newLatestAction = popStack[newLatestAction.moddedActionIndex]
    }
  }
  if (latestAction.tool === 'modify') {
    handleModifyAction(latestAction, modType)
  } else if (latestAction.tool === 'changeMode') {
    // Restore the modes object for the affected vector.
    globalState.vector.all[latestAction.moddedVectorIndex].modes = {
      ...latestAction[modType],
    }
    // If the mode change also stored a geometry snapshot (e.g. a curve type
    // switch that initialized new control points), restore those too.
    const vectorPropertiesSnapshot =
      modType === 'from'
        ? latestAction.fromVectorProperties
        : latestAction.toVectorProperties
    if (vectorPropertiesSnapshot) {
      Object.assign(
        globalState.vector.all[latestAction.moddedVectorIndex].vectorProperties,
        vectorPropertiesSnapshot,
      )
    }
  } else if (latestAction.tool === 'changeDitherPattern') {
    globalState.vector.all[latestAction.moddedVectorIndex].ditherPatternIndex =
      latestAction[modType]
  } else if (latestAction.tool === 'changeDitherOffset') {
    globalState.vector.all[latestAction.moddedVectorIndex].ditherOffsetX =
      latestAction[modType].x
    globalState.vector.all[latestAction.moddedVectorIndex].ditherOffsetY =
      latestAction[modType].y
  } else if (latestAction.tool === 'changeBrushSize') {
    globalState.vector.all[latestAction.moddedVectorIndex].brushSize =
      latestAction[modType]
  } else if (latestAction.tool === 'changeColor') {
    globalState.vector.all[latestAction.moddedVectorIndex].color = {
      ...latestAction[modType],
    }
  } else if (latestAction.tool === 'remove') {
    // Flip the `removed` flag on each affected vector to the stored value.
    if (latestAction.vectorIndices?.length > 0) {
      latestAction.vectorIndices.forEach((vectorIndex) => {
        globalState.vector.all[vectorIndex].removed = latestAction[modType]
      })
    }
  } else if (latestAction.tool === 'clear') {
    handleClearAction(latestAction)
  } else if (latestAction.tool === 'addLayer') {
    if (modType === 'from') {
      //If undoing addLayer, remove layer from canvas
      latestAction.layer.removed = true
    } else if (modType === 'to') {
      //If redoing addLayer, add layer to canvas
      latestAction.layer.removed = false
    }
  } else if (latestAction.tool === 'removeLayer') {
    if (modType === 'from') {
      //If undoing removeLayer, add layer to canvas
      latestAction.layer.removed = false
    } else if (modType === 'to') {
      //If redoing removeLayer, remove layer from canvas
      latestAction.layer.removed = true
    }
  } else if (latestAction.tool === 'paste') {
    if (!latestAction.confirmed) {
      handlePasteAction(latestAction, modType)
    } else {
      handleConfirmPasteAction(latestAction, newLatestAction, modType)
    }
  } else if (latestAction.tool === 'move') {
    handleMoveAction(latestAction, modType)
  } else if (latestAction.tool === 'transform') {
    handleTransformAction(latestAction, newLatestAction, modType)
  } else if (latestAction.tool === 'resize') {
    handleResizeAction(latestAction, modType)
  }
  pushStack.push(popStack.pop())
  //Render the canvas with the new latest action
  renderToLatestAction(latestAction, modType)
  // Keep the build-up density map in sync after every undo/redo so the cursor
  // preview reflects the correct density step without waiting for pointerdown.
  if (brush.modes?.buildUpDither) {
    rebuildBuildUpDensityMap()
  }
  //Recalculate size of file if save dialog is open
  if (globalState.ui.saveDialogOpen) {
    setSaveFilesizePreview()
  }
}

/**
 * Undo the most recent undoable action.
 *
 * Pops from the undo stack and pushes onto the redo stack. The initial
 * "empty canvas" action at index 0 is never undone so there is always at
 * least one entry remaining.
 */
export function handleUndo() {
  //length 1 prevents initial layer from being undone
  if (globalState.timeline.undoStack.length > 1) {
    actionUndoRedo(
      globalState.timeline.redoStack,
      globalState.timeline.undoStack,
      'from',
    )
  }
}

/**
 * Redo the most recently undone action.
 *
 * Pops from the redo stack and pushes back onto the undo stack. The redo
 * stack is cleared whenever a new action is added, so this only has entries
 * if the user has previously undone without performing any new actions.
 */
export function handleRedo() {
  if (globalState.timeline.redoStack.length >= 1) {
    actionUndoRedo(
      globalState.timeline.undoStack,
      globalState.timeline.redoStack,
      'to',
    )
  }
}

/**
 * Record a new action on the undo/redo timeline (the command pattern push).
 *
 * Constructs a timeline entry from the provided tool, layer, and properties,
 * enriched with the current selection state, mask, vector selection, and a
 * pixel snapshot of the layer canvas. The snapshot enables fast undo/redo
 * without replaying the full timeline.
 *
 * The constructed action is stored as `globalState.timeline.currentAction`
 * and pushed onto the undo stack. Some calling code checks `currentAction`
 * immediately after this call to associate newly-created vectors with their
 * originating action, so `currentAction` is intentionally not reset here.
 *
 * NOTE: redo stack clearing is NOT done here — callers are expected to call
 * `globalState.clearRedoStack()` after `addToTimeline` so that some code can
 * inspect whether an action was just added before the stack is cleared.
 * @param {object} actionObject - Descriptor for the new action.
 * @param {string} actionObject.tool - Tool name string (e.g. `'draw'`).
 * @param {object} actionObject.layer - The layer this action belongs to.
 * @param {object} [actionObject.properties] - Additional tool-specific
 *   properties to merge into the timeline entry.
 */
export function addToTimeline(actionObject) {
  const { tool, layer, properties } = actionObject
  // Snapshot the raster layer pixels now so undo/redo can restore them
  // without replaying the full timeline. Reference layers store null
  // because their content is the original image and never changes.
  let snapshot = layer.type === 'raster' ? layer.cvs.toDataURL() : null
  globalState.timeline.currentAction = {
    index: globalState.timeline.undoStack.length,
    tool,
    layer,
    ...properties,
    // Embed selection state in every action so undo/redo can restore the
    // exact selection that existed when the action was recorded.
    selectProperties: { ...globalState.selection.properties },
    maskSet: globalState.selection.maskSet
      ? Array.from(globalState.selection.maskSet)
      : null,
    selectedVectorIndices: Array.from(globalState.vector.selectedIndices),
    currentVectorIndex: globalState.vector.currentIndex,
    hidden: false,
    removed: false,
    snapshot,
  }
  globalState.timeline.undoStack.push(globalState.timeline.currentAction)
  if (globalState.ui.saveDialogOpen) {
    //TODO: (Low Priority) refactor to add it to a queue of filesize calculations so that calculations do not happen concurrently
    setSaveFilesizePreview()
  }
}
