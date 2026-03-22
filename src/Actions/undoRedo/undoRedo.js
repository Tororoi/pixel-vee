import { state } from "../../Context/state.js"
import { canvas } from "../../Context/canvas.js"
import { vectorGui } from "../../GUI/vector.js"
import { setSaveFilesizePreview } from "../../Save/savefile.js"
import { renderToLatestAction } from "./render.js"
import {
  handleModifyAction,
  handleClearAction,
  handlePasteAction,
  handleConfirmPasteAction,
  handleMoveAction,
  handleTransformAction,
} from "./helpers.js"

//====================================//
//========= * * * Core * * * =========//
//====================================//

/**
 * Main pillar of the code structure - command pattern
 * @param {Array} pushStack - The stack to push the action to
 * @param {Array} popStack - The stack to pop the action from
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
export function actionUndoRedo(pushStack, popStack, modType) {
  //latest action is the action about to be undone or redone
  let latestAction = popStack[popStack.length - 1]
  vectorGui.reset()
  //newLatestAction is the action that's about to be the most recent action, if the function is "Undo" ("from")
  let newLatestAction =
    modType === "from" && popStack.length > 1
      ? popStack[popStack.length - 2]
      : null
  if (modType === "from" && popStack.length > 1) {
    if (newLatestAction.tool === "modify") {
      //If action is modif, new latest action will be considered the modded action
      newLatestAction = popStack[newLatestAction.moddedActionIndex]
    }
  }
  if (latestAction.tool === "modify") {
    handleModifyAction(latestAction, modType)
  } else if (latestAction.tool === "changeMode") {
    state.vector.all[latestAction.moddedVectorIndex].modes = {
      ...latestAction[modType],
    }
  } else if (latestAction.tool === "changeDitherPattern") {
    state.vector.all[latestAction.moddedVectorIndex].ditherPatternIndex =
      latestAction[modType]
  } else if (latestAction.tool === "changeDitherOffset") {
    state.vector.all[latestAction.moddedVectorIndex].ditherOffsetX =
      latestAction[modType].x
    state.vector.all[latestAction.moddedVectorIndex].ditherOffsetY =
      latestAction[modType].y
  } else if (latestAction.tool === "changeBrushSize") {
    state.vector.all[latestAction.moddedVectorIndex].brushSize =
      latestAction[modType]
  } else if (latestAction.tool === "changeColor") {
    state.vector.all[latestAction.moddedVectorIndex].color = {
      ...latestAction[modType],
    }
  } else if (latestAction.tool === "remove") {
    if (latestAction.vectorIndices?.length > 0) {
      latestAction.vectorIndices.forEach((vectorIndex) => {
        state.vector.all[vectorIndex].removed = latestAction[modType]
      })
    }
  } else if (latestAction.tool === "clear") {
    handleClearAction(latestAction)
  } else if (latestAction.tool === "addLayer") {
    if (modType === "from") {
      //If undoing addLayer, remove layer from canvas
      latestAction.layer.removed = true
    } else if (modType === "to") {
      //If redoing addLayer, add layer to canvas
      latestAction.layer.removed = false
    }
  } else if (latestAction.tool === "removeLayer") {
    if (modType === "from") {
      //If undoing removeLayer, add layer to canvas
      latestAction.layer.removed = false
    } else if (modType === "to") {
      //If redoing removeLayer, remove layer from canvas
      latestAction.layer.removed = true
    }
  } else if (latestAction.tool === "paste") {
    if (!latestAction.confirmed) {
      handlePasteAction(latestAction, modType)
    } else {
      handleConfirmPasteAction(latestAction, newLatestAction, modType)
    }
  } else if (latestAction.tool === "move") {
    handleMoveAction(latestAction, modType)
  } else if (latestAction.tool === "transform") {
    handleTransformAction(latestAction, newLatestAction, modType)
  }
  pushStack.push(popStack.pop())
  //Render the canvas with the new latest action
  renderToLatestAction(latestAction, modType)
  //Recalculate size of file if save dialog is open
  if (state.ui.saveDialogOpen) {
    setSaveFilesizePreview()
  }
}

/**
 * Undo an action
 */
export function handleUndo() {
  //length 1 prevents initial layer from being undone
  if (state.timeline.undoStack.length > 1) {
    actionUndoRedo(state.timeline.redoStack, state.timeline.undoStack, "from")
  }
}

/**
 * Redo an action
 */
export function handleRedo() {
  if (state.timeline.redoStack.length >= 1) {
    actionUndoRedo(state.timeline.undoStack, state.timeline.redoStack, "to")
  }
}

/**
 * This sets the action which is then pushed to the undoStack for the command pattern
 * action and redoStack are not reset here in order to allow some functionality based around checking if an action was just added to the timeline. TODO: (Low Priority) refactor to use a different method for this
 * @param {object} actionObject - The action object to be added to the timeline
 */
export function addToTimeline(actionObject) {
  const { tool, layer, properties } = actionObject
  //use current state for variables
  //Make selectProperties and selectedVectorIndices part of every action to reduce logic complexity. This means a small decrease in space efficiency for save files.
  let snapshot = layer.type === "raster" ? layer.cvs.toDataURL() : null
  state.timeline.currentAction = {
    index: state.timeline.undoStack.length,
    tool,
    layer,
    ...properties,
    selectProperties: { ...state.selection.properties },
    maskSet: state.selection.maskSet ? Array.from(state.selection.maskSet) : null,
    selectedVectorIndices: Array.from(state.vector.selectedIndices),
    currentVectorIndex: state.vector.currentIndex,
    hidden: false,
    removed: false,
    snapshot,
  }
  state.timeline.undoStack.push(state.timeline.currentAction)
  if (state.ui.saveDialogOpen) {
    //TODO: (Low Priority) refactor to add it to a queue of filesize calculations so that calculations do not happen concurrently
    setSaveFilesizePreview()
  }
}
