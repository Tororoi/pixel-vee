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
 * @param {object} moddedVector - The vector action that was modified
 */
export function modifyVectorAction(moddedVector) {
  //loop through the object state.vectorsSavedProperties and create an array of objects with the required properties
  let processedActions = []

  for (let vectorIndex in state.vectorsSavedProperties) {
    // Extract the saved properties
    let fromProperties = { ...state.vectorsSavedProperties[vectorIndex] }

    // Extract the new properties
    let vector = state.vectors[vectorIndex]
    let toProperties = {
      ...vector.vectorProperties,
    }

    // Create the new object with the required properties
    // Add the new object to the processedActions array
    processedActions.push({
      moddedActionIndex: vector.action.index,
      moddedVectorIndex: vectorIndex,
      from: fromProperties,
      to: toProperties,
    })
  }
  state.vectorsSavedProperties = {}
  state.activeIndexes = []
  state.savedBetweenActionImages = []
  addToTimeline({
    tool: tools.modify.name,
    layer: moddedVector.layer,
    properties: {
      moddedActionIndex: moddedVector.action.index,
      moddedVectorIndex: moddedVector.index,
      processedActions,
    },
  })
}

/**
 * Modify action in the timeline
 * Only good for vector parameters
 * @param {object} moddedVector - The vector to be modified
 * @param {object} oldColor - The color before the modification
 */
export function changeActionVectorColor(moddedVector, oldColor) {
  let previousColor = {
    ...oldColor,
  } //shallow copy, color must not contain any objects or references as values
  let modifiedColor = {
    ...moddedVector.color,
  } //shallow copy, must make deep copy, at least for x, y and properties
  addToTimeline({
    tool: tools.changeColor.name,
    layer: moddedVector.layer,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      moddedActionIndex: moddedVector.action.index,
      moddedVectorIndex: moddedVector.index,
      from: previousColor,
      to: modifiedColor,
    },
  })
}

/**
 * Modify action in the timeline
 * @param {object} moddedVector - The vector to be removed
 * NOTE: When multiple vectors are removed, currently routed through cut selection action. TODO: (Low Priority) Refactor to use same function for single and multiple vector removal
 */
export function removeActionVector(moddedVector) {
  addToTimeline({
    tool: tools.remove.name,
    layer: moddedVector.layer,
    properties: {
      vectorIndices: [moddedVector.index],
      from: false,
      to: true,
    },
  })
}

/**
 * Modify action in the timeline
 * @param {object} moddedVector - The vector to be modified
 * @param {object} oldModes - The modes before the modification
 * @param {object} newModes - The modes after the modification
 */
export function changeActionVectorMode(moddedVector, oldModes, newModes) {
  addToTimeline({
    tool: tools.changeMode.name,
    layer: moddedVector.layer,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      moddedActionIndex: moddedVector.actionIndex,
      moddedVectorIndex: moddedVector.index,
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
      if (action.vectorIndices) {
        action.vectorIndices.forEach((vectorIndex) => {
          state.vectors[vectorIndex].removed = true
        })
      }
      //TODO: (Low Priority) Should group actions also have each sub action removed set to true?
    }
  })
  addToTimeline({
    tool: tools.clear.name,
    layer: layer,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      upToIndex,
    },
  })
}
