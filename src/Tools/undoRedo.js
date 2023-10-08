import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas, renderVectorsToDOM } from "../Canvas/render.js"

//====================================//
//========= * * * Core * * * =========//
//====================================//

/**
 * Main pillar of the code structure
 * @param {*} pushStack
 * @param {*} popStack
 * @param {*} modType - "from" or "to", used for modify actions
 */
export function actionUndoRedo(pushStack, popStack, modType) {
  let latestAction = popStack[popStack.length - 1]
  let newLatestAction
  if (modType === "from" && popStack.length > 1) {
    newLatestAction = popStack[popStack.length - 2]
    if (newLatestAction.tool.name === "modify") {
      newLatestAction = popStack[newLatestAction.properties.moddedActionIndex]
    }
  }
  if (latestAction.tool.name === "modify") {
    state.undoStack[latestAction.properties.moddedActionIndex].properties = {
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
  } else if (latestAction.tool.name === "changeColor") {
    state.undoStack[latestAction.properties.moddedActionIndex].color = {
      ...latestAction.properties[modType],
    }
  } else if (latestAction.tool.name === "remove") {
    state.undoStack[latestAction.properties.moddedActionIndex].removed =
      latestAction.properties[modType]
  } else if (latestAction.tool.name === "clear") {
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
    renderVectorsToDOM()
  } else if (
    latestAction.tool.name === state.tool.name &&
    latestAction.tool.type === "vector"
  ) {
    //When redoing a vector's initial action while the matching tool is selected, set vectorProperties
    vectorGui.reset(canvas)
    if (modType === "to") {
      state.vectorProperties = { ...latestAction.properties }
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
      state.vectorProperties = { ...newLatestAction.properties }
      canvas.currentVectorIndex = newLatestAction.index //currently only vectors have an index property, set during renderVectorsToDOM
      vectorGui.render(state, canvas)
    }
  }
  pushStack.push(popStack.pop())
  //clear all layers in preparation to redraw them.
  //DRY: do all layers and actions need to be rerendered for redo?
  renderCanvas(true, true)
  state.reset()
}

export function handleUndo() {
  //length 1 prevents initial layer from being undone
  if (state.undoStack.length > 1) {
    actionUndoRedo(state.redoStack, state.undoStack, "from")
  }
}

export function handleRedo() {
  if (state.redoStack.length >= 1) {
    actionUndoRedo(state.undoStack, state.redoStack, "to")
  }
}
