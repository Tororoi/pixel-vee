import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"

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
  vectorGui.reset(canvas)
  let latestAction = popStack[popStack.length - 1][0]
  if (latestAction.tool.name === "modify") {
    state.undoStack[latestAction.properties.moddedActionIndex][0].properties = {
      ...latestAction.properties[modType],
    }
    if (
      state.tool.name ===
      state.undoStack[latestAction.properties.moddedActionIndex][0].tool.name
    ) {
      state.vectorProperties = { ...latestAction.properties[modType] }
      canvas.currentVectorIndex =
        state.undoStack[latestAction.properties.moddedActionIndex][0].index
      vectorGui.render(state, canvas)
    }
  } else if (
    latestAction.tool.name === state.tool.name &&
    latestAction.tool.type === "vector" &&
    modType === "to"
  ) {
    //When redoing a vector's initial action while the matching tool is selected, set vectorProperties
    state.vectorProperties = { ...latestAction.properties }
    canvas.currentVectorIndex = latestAction.index //currently only vectors have an index property, set during renderVectorsToDOM
    vectorGui.render(state, canvas)
  }
  pushStack.push(popStack.pop())
  //clear all layers in preparation to redraw them.
  //DRY: do all layers and actions need to be rerendered for redo?
  canvas.render()
  state.reset()
}
