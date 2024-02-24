import { state } from "../Context/state.js"
import { tools } from "../Tools/index.js"
import { addToTimeline } from "./undoRedo.js"

//====================================//
//==== * * * Modify Actions * * * ====//
//====================================//

//"Actions" are user-initiated events that are reversible through the undo button.
//This file holds the functions used for reversible actions as the result of modifying the timeline.

/**
 * Modify action in the timeline
 * Only good for vector parameters
 * @param {object} moddedAction - The vector action that was modified
 */
export function modifyVectorAction(moddedAction) {
  //loop through the object state.vectorsSavedProperties and for each key which represents an action index and value which is a shallow object with various properties, create an object with properties moddedActionIndex, from (the saved properties), and to (the new properties found on state.undoStack[vectorIndex].properties.vectorProperties)
  let processedActions = []

  for (let vectorIndex in state.vectorsSavedProperties) {
    // Extract the saved properties
    let fromProperties = { ...state.vectorsSavedProperties[vectorIndex] }

    // Extract the new properties
    let toProperties = {
      ...state.undoStack[vectorIndex].properties.vectorProperties,
    }

    // Create the new object with the required properties
    // Add the new object to the processedActions array
    processedActions.push({
      moddedActionIndex: vectorIndex,
      from: fromProperties,
      to: toProperties,
    })
  }
  state.vectorsSavedProperties = {}
  state.activeIndexes = []
  state.savedBetweenActionImages = []
  addToTimeline({
    tool: tools.modify,
    layer: moddedAction.layer,
    properties: {
      moddedActionIndex: moddedAction.index,
      processedActions,
    },
  })
}

/**
 * Modify action in the timeline
 * Only good for vector parameters
 * @param {object} moddedAction - The action to be modified
 * @param {object} oldColor - The color before the modification
 */
export function changeActionColor(moddedAction, oldColor) {
  let previousColor = {
    ...oldColor,
  } //shallow copy, color must not contain any objects or references as values
  let modifiedColor = {
    ...moddedAction.properties.color,
  } //shallow copy, must make deep copy, at least for x, y and properties
  addToTimeline({
    tool: tools.changeColor,
    layer: moddedAction.layer,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      moddedActionIndex: moddedAction.index,
      from: previousColor,
      to: modifiedColor,
    },
  })
}

/**
 * Modify action in the timeline
 * @param {object} moddedAction - The action to be modified
 */
export function removeAction(moddedAction) {
  addToTimeline({
    tool: tools.remove,
    layer: moddedAction.layer,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      moddedActionIndex: moddedAction.index,
      from: false,
      to: true,
    },
  })
}

/**
 * Modify action in the timeline
 * @param {object} moddedAction - The action to be modified
 * @param {object} oldModes - The modes before the modification
 * @param {object} newModes - The modes after the modification
 */
export function changeActionMode(moddedAction, oldModes, newModes) {
  addToTimeline({
    tool: tools.changeMode,
    layer: moddedAction.layer,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      moddedActionIndex: moddedAction.index,
      from: oldModes,
      to: newModes,
    },
  })
}

/**
 * Modify actions in the timeline
 * Sets all actions before it except for action index 0 to removed = true
 * @param {object} layer - The layer with actions to be modified
 */
export function actionClear(layer) {
  let upToIndex = state.undoStack.length - 1
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    if (i > upToIndex) {
      return
    }
    i++
    if (action.layer === layer) {
      action.removed = true
      //TODO: (Low Priority) Should group actions also have each sub action removed set to true?
    }
  })
  addToTimeline({
    tool: tools.clear,
    layer: layer,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      upToIndex,
    },
  })
}
