import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { renderVectorsToDOM } from "../DOM/render.js"

//====================================//
//========= * * * Core * * * =========//
//====================================//

/**
 * @param {Object} latestAction
 * @param {String} modType
 */
function handleModifyAction(latestAction, modType) {
  state.undoStack[
    latestAction.properties.moddedActionIndex
  ].properties.vectorProperties = {
    ...latestAction.properties[modType],
  }
  if (
    state.tool.name ===
    state.undoStack[latestAction.properties.moddedActionIndex].tool.name
  ) {
    vectorGui.reset(canvas)
    state.vectorProperties = { ...latestAction.properties[modType] }
    canvas.currentVectorIndex =
      state.undoStack[latestAction.properties.moddedActionIndex].index
    vectorGui.render(state, canvas)
  }
}

/**
 * @param {Object} latestAction
 */
function handleClearAction(latestAction) {
  let upToIndex = latestAction.properties.upToIndex
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    if (i > upToIndex) {
      return
    }
    i++
    if (action.layer === canvas.currentLayer) {
      action.removed = !action.removed
    }
  })
  vectorGui.reset(canvas)
}

/**
 * @param {Object} latestAction
 * @param {Object} newLatestAction
 * @param {String} modType
 */
function handleSelectAction(latestAction, newLatestAction, modType) {
  if (modType === "to") {
    if (latestAction.properties.deselect) {
      state.resetSelectProperties()
    } else {
      //set select properties
      state.selectProperties = {
        ...latestAction.properties.selectProperties,
      }
      //set maskset
      state.maskSet = latestAction.maskSet
    }
  } else if (modType === "from") {
    if (latestAction.properties.deselect) {
      //set select properties
      state.selectProperties = {
        ...latestAction.properties.selectProperties,
      }
      //set maskset
      state.maskSet = latestAction.maskSet
    } else if (
      newLatestAction?.tool?.name === "select" &&
      !newLatestAction?.properties?.deselect
    ) {
      //If the action before the one being undone is a select tool, set context - may need to separate this from latestAction also being the "select" tool
      //set select properties
      state.selectProperties = {
        ...newLatestAction.properties.selectProperties,
      }
      //set maskset
      state.maskSet = newLatestAction.maskSet
    } else {
      state.resetSelectProperties()
    }
  }
  vectorGui.render(state, canvas)
}

//TODO: handleMoveAction

/**
 * Main pillar of the code structure - command pattern
 * @param {Array} pushStack
 * @param {Array} popStack
 * @param {String} modType - "from" or "to", used for modify actions
 */
export function actionUndoRedo(pushStack, popStack, modType) {
  //latest action is the action about to be undone or redone
  let latestAction = popStack[popStack.length - 1]
  //newLatestAction is the action that's about to be the most recent action, if the function is "Undo" ("from")
  let newLatestAction =
    modType === "from" && popStack.length > 1
      ? popStack[popStack.length - 2]
      : null
  if (modType === "from" && popStack.length > 1) {
    if (newLatestAction.tool.name === "modify") {
      //If action is modif, new latest action will be considered the modded action
      newLatestAction = popStack[newLatestAction.properties.moddedActionIndex]
    }
  }
  if (latestAction.tool.name === "modify") {
    handleModifyAction(latestAction, modType)
  } else if (latestAction.tool.name === "changeColor") {
    state.undoStack[latestAction.properties.moddedActionIndex].color = {
      ...latestAction.properties[modType],
    }
  } else if (latestAction.tool.name === "remove") {
    state.undoStack[latestAction.properties.moddedActionIndex].removed =
      latestAction.properties[modType]
  } else if (latestAction.tool.name === "clear") {
    handleClearAction(latestAction)
  } else if (latestAction.tool.name === "select") {
    //TODO: maybe selection should just be a modification on every action instead of separate select actions.
    //Right now, undoing a select action when the newLatestAction isn't also a select tool means the earlier select action won't be rendered even if it should be
    //By saving it as a modded action with from and to we can set the selectProperties to the "from" values on undo and "to" on redo
    handleSelectAction(latestAction, newLatestAction, modType)
  } else if (
    latestAction.tool.name === state.tool.name &&
    latestAction.tool.type === "vector"
  ) {
    //When redoing a vector's initial action while the matching tool is selected, set vectorProperties
    vectorGui.reset(canvas)
    if (modType === "to") {
      state.vectorProperties = { ...latestAction.properties.vectorProperties }
      canvas.currentVectorIndex = latestAction.index //currently only vectors have an index property, set during renderVectorsToDOM
      vectorGui.render(state, canvas)
    }
  }
  //For undo, if new latest action or new latest modded action will be a vector and its tool is currently selected, set vector properties to match
  if (newLatestAction) {
    if (
      newLatestAction.tool.name === state.tool.name &&
      newLatestAction.tool.type === "vector"
    ) {
      //When redoing a vector's initial action while the matching tool is selected, set vectorProperties
      vectorGui.reset(canvas)
      state.vectorProperties = {
        ...newLatestAction.properties.vectorProperties,
      }
      canvas.currentVectorIndex = newLatestAction.index //currently only vectors have an index property, set during renderVectorsToDOM
      vectorGui.render(state, canvas)
    }
  }

  pushStack.push(popStack.pop())
  //clear all layers in preparation to redraw them.
  //DRY: do all layers and actions need to be rerendered for redo?
  renderCanvas(null, true, true)
  renderVectorsToDOM()
  state.reset()
}

/**
 * Undo an action
 */
export function handleUndo() {
  //length 1 prevents initial layer from being undone
  if (state.undoStack.length > 1) {
    actionUndoRedo(state.redoStack, state.undoStack, "from")
  }
}

/**
 * Redo an action
 */
export function handleRedo() {
  if (state.redoStack.length >= 1) {
    actionUndoRedo(state.undoStack, state.redoStack, "to")
  }
}
