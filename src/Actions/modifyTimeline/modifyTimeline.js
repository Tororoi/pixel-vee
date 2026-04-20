import { globalState } from '../../Context/state.js'
import { tools } from '../../Tools/index.js'
import { vectorGui } from '../../GUI/vector.js'
import { addToTimeline } from '../undoRedo/undoRedo.js'
import { renderCanvas } from '../../Canvas/render.js'

import { CURVE_TYPES } from '../../utils/constants.js'

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
  //loop through the object globalState.vector.savedProperties and create an array of objects with the required properties
  let processedActions = []

  for (let vectorIndex in globalState.vector.savedProperties) {
    // Extract the saved properties
    let fromProperties = { ...globalState.vector.savedProperties[vectorIndex] }

    // Extract the new properties
    let vector = globalState.vector.all[vectorIndex]
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
  globalState.vector.savedProperties = {}
  globalState.timeline.clearActiveIndexes()
  globalState.timeline.clearSavedBetweenActionImages()
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
 * @param {object} moddedVector - The vector to be modified
 * @param {number} oldIndex - The dither pattern index before the modification
 * @param {number} newIndex - The dither pattern index after the modification
 */
export function changeActionVectorDitherPattern(
  moddedVector,
  oldIndex,
  newIndex,
) {
  addToTimeline({
    tool: tools.changeDitherPattern.name,
    layer: moddedVector.layer,
    properties: {
      moddedActionIndex: moddedVector.action.index,
      moddedVectorIndex: moddedVector.index,
      from: oldIndex,
      to: newIndex,
    },
  })
}

/**
 * Modify action in the timeline
 * @param {object} moddedVector - The vector to be modified
 * @param {{x: number, y: number}} oldOffset - The dither offset before the modification
 * @param {{x: number, y: number}} newOffset - The dither offset after the modification
 */
export function changeActionVectorDitherOffset(
  moddedVector,
  oldOffset,
  newOffset,
) {
  addToTimeline({
    tool: tools.changeDitherOffset.name,
    layer: moddedVector.layer,
    properties: {
      moddedActionIndex: moddedVector.action.index,
      moddedVectorIndex: moddedVector.index,
      from: oldOffset,
      to: newOffset,
    },
  })
}

/**
 * Modify action in the timeline
 * @param {object} moddedVector - The vector to be modified
 * @param {number} oldSize - The brush size before the modification
 * @param {number} newSize - The brush size after the modification
 */
export function changeActionVectorBrushSize(moddedVector, oldSize, newSize) {
  addToTimeline({
    tool: tools.changeBrushSize.name,
    layer: moddedVector.layer,
    properties: {
      moddedActionIndex: moddedVector.action.index,
      moddedVectorIndex: moddedVector.index,
      from: oldSize,
      to: newSize,
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
 * @param {object|null} oldVectorProperties - Snapshot of vectorProperties before the modification (optional)
 * @param {object|null} newVectorProperties - Snapshot of vectorProperties after the modification (optional)
 */
export function changeActionVectorMode(
  moddedVector,
  oldModes,
  newModes,
  oldVectorProperties = null,
  newVectorProperties = null,
) {
  addToTimeline({
    tool: tools.changeMode.name,
    layer: moddedVector.layer,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      moddedActionIndex: moddedVector.actionIndex,
      moddedVectorIndex: moddedVector.index,
      from: oldModes,
      to: newModes,
      fromVectorProperties: oldVectorProperties,
      toVectorProperties: newVectorProperties,
    },
  })
}

/**
 * Atomically switch a curve vector's curve type (line | quadCurve | cubicCurve),
 * initializing any missing control points and recording the full change for undo/redo.
 * @param {object} targetVector - The curve vector to update
 * @param {string} newCurveType - 'line' | 'quadCurve' | 'cubicCurve'
 */
export function changeActionVectorCurveType(targetVector, newCurveType) {
  const oldModes = { ...targetVector.modes }
  const oldVectorProperties = {
    px3: targetVector.vectorProperties.px3,
    py3: targetVector.vectorProperties.py3,
    px4: targetVector.vectorProperties.px4,
    py4: targetVector.vectorProperties.py4,
  }
  CURVE_TYPES.forEach((curveType) => {
    targetVector.modes[curveType] = curveType === newCurveType
  })
  const vectorProperties = targetVector.vectorProperties
  if (newCurveType === 'quadCurve' || newCurveType === 'cubicCurve') {
    if (vectorProperties.px3 == null || vectorProperties.py3 == null) {
      vectorProperties.px3 = Math.round(
        (vectorProperties.px1 + vectorProperties.px2) / 2,
      )
      vectorProperties.py3 = Math.round(
        (vectorProperties.py1 + vectorProperties.py2) / 2,
      )
    }
  }
  if (newCurveType === 'cubicCurve') {
    if (vectorProperties.px4 == null || vectorProperties.py4 == null) {
      vectorProperties.px4 = Math.round(
        (vectorProperties.px1 + vectorProperties.px2) / 2,
      )
      vectorProperties.py4 = Math.round(
        (vectorProperties.py1 + vectorProperties.py2) / 2,
      )
    }
  }
  const newVectorProperties = {
    px3: targetVector.vectorProperties.px3,
    py3: targetVector.vectorProperties.py3,
    px4: targetVector.vectorProperties.px4,
    py4: targetVector.vectorProperties.py4,
  }
  if (globalState.vector.currentIndex === targetVector.index) {
    const layerX = targetVector.layer.x
    const layerY = targetVector.layer.y
    if (targetVector.vectorProperties.px3 !== undefined) {
      globalState.vector.properties.px3 =
        targetVector.vectorProperties.px3 + layerX
      globalState.vector.properties.py3 =
        targetVector.vectorProperties.py3 + layerY
    }
    if (targetVector.vectorProperties.px4 !== undefined) {
      globalState.vector.properties.px4 =
        targetVector.vectorProperties.px4 + layerX
      globalState.vector.properties.py4 =
        targetVector.vectorProperties.py4 + layerY
    }
  }
  // Render before recording so addToTimeline's snapshot captures the post-render pixels.
  // If snapshot is taken first (pre-render), undoing restores stale pixels.
  renderCanvas(targetVector.layer, true)
  changeActionVectorMode(
    targetVector,
    oldModes,
    { ...targetVector.modes },
    oldVectorProperties,
    newVectorProperties,
  )
  globalState.clearRedoStack()
  vectorGui.render()
}

/**
 * Modify actions in the timeline
 * Sets all actions before it except for action index 0 to removed = true
 * @param {object} layer - The layer with actions to be modified
 */
export function actionClear(layer) {
  let upToIndex = globalState.timeline.undoStack.length - 1
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  globalState.timeline.undoStack.forEach((action) => {
    if (i > upToIndex) {
      return
    }
    i++
    if (action.layer === layer) {
      action.removed = true
      if (action.vectorIndices) {
        action.vectorIndices.forEach((vectorIndex) => {
          globalState.vector.all[vectorIndex].removed = true
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
