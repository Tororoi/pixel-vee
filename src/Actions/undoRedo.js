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
  const moddedAction =
    state.undoStack[latestAction.properties.moddedActionIndex]
  moddedAction.properties.vectorProperties = {
    ...latestAction.properties[modType],
  }
  if (state.tool.name === moddedAction.tool.name) {
    vectorGui.reset()
    state.vectorProperties = { ...latestAction.properties[modType] }
    //Keep properties relative to layer offset
    state.vectorProperties.px1 += moddedAction.layer.x
    state.vectorProperties.py1 += moddedAction.layer.y
    if (
      moddedAction.tool.name === "quadCurve" ||
      moddedAction.tool.name === "cubicCurve" ||
      moddedAction.tool.name === "ellipse"
    ) {
      state.vectorProperties.px2 += moddedAction.layer.x
      state.vectorProperties.py2 += moddedAction.layer.y

      state.vectorProperties.px3 += moddedAction.layer.x
      state.vectorProperties.py3 += moddedAction.layer.y
    }

    if (moddedAction.tool.name === "cubicCurve") {
      state.vectorProperties.px4 += moddedAction.layer.x
      state.vectorProperties.py4 += moddedAction.layer.y
    }
    canvas.currentVectorIndex = moddedAction.index
    vectorGui.render()
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
  vectorGui.reset()
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
  vectorGui.render()
}

/**
 *
 * @param {Object} latestAction
 * @param {String} modType
 */
function handleMoveAction(latestAction, modType) {
  let deltaX = latestAction.properties[modType].x - latestAction.layer.x
  let deltaY = latestAction.properties[modType].y - latestAction.layer.y
  //set layer x and y to modType
  latestAction.layer.x = latestAction.properties[modType].x
  latestAction.layer.y = latestAction.properties[modType].y
  latestAction.layer.scale = latestAction.properties[modType].scale
  //Keep properties relative to layer offset
  if (state.vectorProperties.px1) {
    state.vectorProperties.px1 += deltaX
    state.vectorProperties.py1 += deltaY
  }
  if (state.vectorProperties.px2) {
    state.vectorProperties.px2 += deltaX
    state.vectorProperties.py2 += deltaY
  }
  if (state.vectorProperties.px3) {
    state.vectorProperties.px3 += deltaX
    state.vectorProperties.py3 += deltaY
  }
  if (state.vectorProperties.px4) {
    state.vectorProperties.px4 += deltaX
    state.vectorProperties.py4 += deltaY
  }
  vectorGui.render()
}

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
  } else if (latestAction.tool.name === "changeMode") {
    state.undoStack[latestAction.properties.moddedActionIndex].modes = {
      ...latestAction.properties[modType],
    }
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
  } else if (latestAction.tool.name === "move") {
    handleMoveAction(latestAction, modType)
  } else if (
    latestAction.tool.name === state.tool.name &&
    latestAction.tool.type === "vector"
  ) {
    //When redoing a vector's initial action while the matching tool is selected, set vectorProperties
    vectorGui.reset()
    if (modType === "to") {
      state.vectorProperties = { ...latestAction.properties.vectorProperties }
      //Keep properties relative to layer offset
      state.vectorProperties.px1 += latestAction.layer.x
      state.vectorProperties.py1 += latestAction.layer.y
      if (
        latestAction.tool.name === "quadCurve" ||
        latestAction.tool.name === "cubicCurve" ||
        latestAction.tool.name === "ellipse"
      ) {
        state.vectorProperties.px2 += latestAction.layer.x
        state.vectorProperties.py2 += latestAction.layer.y

        state.vectorProperties.px3 += latestAction.layer.x
        state.vectorProperties.py3 += latestAction.layer.y
      }

      if (latestAction.tool.name === "cubicCurve") {
        state.vectorProperties.px4 += latestAction.layer.x
        state.vectorProperties.py4 += latestAction.layer.y
      }
      canvas.currentVectorIndex = latestAction.index //currently only vectors have an index property, set during renderVectorsToDOM
      vectorGui.render()
    }
  }
  //For undo, if new latest action or new latest modded action will be a vector and its tool is currently selected, set vector properties to match
  if (newLatestAction) {
    if (
      newLatestAction.tool.name === state.tool.name &&
      newLatestAction.tool.type === "vector"
    ) {
      //When redoing a vector's initial action while the matching tool is selected, set vectorProperties
      vectorGui.reset()
      state.vectorProperties = {
        ...newLatestAction.properties.vectorProperties,
      }
      //Keep properties relative to layer offset
      state.vectorProperties.px1 += newLatestAction.layer.x
      state.vectorProperties.py1 += newLatestAction.layer.y
      if (
        newLatestAction.tool.name === "quadCurve" ||
        newLatestAction.tool.name === "cubicCurve" ||
        newLatestAction.tool.name === "ellipse"
      ) {
        state.vectorProperties.px2 += newLatestAction.layer.x
        state.vectorProperties.py2 += newLatestAction.layer.y

        state.vectorProperties.px3 += newLatestAction.layer.x
        state.vectorProperties.py3 += newLatestAction.layer.y
      }

      if (newLatestAction.tool.name === "cubicCurve") {
        state.vectorProperties.px4 += newLatestAction.layer.x
        state.vectorProperties.py4 += newLatestAction.layer.y
      }
      canvas.currentVectorIndex = newLatestAction.index //currently only vectors have an index property, set during renderVectorsToDOM
      vectorGui.render()
    }
  }

  pushStack.push(popStack.pop())
  //clear all layers in preparation to redraw them.
  //DRY: do all layers and actions need to be rerendered for redo?
  renderCanvas(latestAction.layer, true) //should be based on layer of affected action
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
