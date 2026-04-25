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
 * Commit all pending vector property edits to the timeline as a single
 * undoable modify action.
 *
 * When the user drags a vector control point, the live changes are stored
 * in `globalState.vector.savedProperties` (a map of vectorIndex → original
 * property snapshot) rather than being immediately committed. When the drag
 * ends, this function:
 *  - Pairs each saved "from" snapshot with the current "to" state.
 *  - Packages them into a `processedActions` array.
 *  - Pushes one timeline entry covering all affected vectors atomically,
 *    so a single undo step reverses every change made in that drag.
 *  - Clears the saved-properties buffer and any active timeline indexes.
 * @param {object} moddedVector - A representative vector from the modified
 *   set; used to supply the layer reference for the timeline entry.
 */
export function modifyVectorAction(moddedVector) {
  // Build a before/after record for every vector that was touched.
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
  // Clear the staging buffer now that the changes are committed.
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
 * Record a dither-pattern change on a vector as an undoable timeline action.
 * @param {object} moddedVector - The vector whose dither pattern was changed.
 * @param {number} oldIndex - The dither pattern index before the change.
 * @param {number} newIndex - The dither pattern index after the change.
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
 * Record a dither-offset change on a vector as an undoable timeline action.
 * The dither offset shifts the repeating dither pattern grid relative to the
 * canvas so that the pattern does not move when a layer is repositioned.
 * @param {object} moddedVector - The vector whose dither offset was changed.
 * @param {{x: number, y: number}} oldOffset - The offset before the change.
 * @param {{x: number, y: number}} newOffset - The offset after the change.
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
 * Record a brush-size change on a vector as an undoable timeline action.
 * The brush size affects how thick the stroke is when the vector is rendered.
 * @param {object} moddedVector - The vector whose brush size was changed.
 * @param {number} oldSize - The brush size before the change.
 * @param {number} newSize - The brush size after the change.
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
 * Record a color change on a vector as an undoable timeline action.
 *
 * Shallow copies of both colors are stored so the timeline entry holds
 * independent snapshots rather than references to objects that may mutate
 * later. Color objects must not contain nested objects or references.
 * @param {object} moddedVector - The vector whose color was changed. The
 *   new color is read from `moddedVector.color` at call time.
 * @param {object} oldColor - The color state before the change.
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
 * Mark a single vector as removed and record the deletion as an undoable
 * timeline action.
 *
 * The `from`/`to` booleans represent the vector's `removed` state: `false`
 * means present, `true` means removed. Undo/redo flips between these values.
 *
 * NOTE: When multiple vectors are removed together (e.g. cut-selection), the
 * operation is routed through `actionCutSelection` instead of this function.
 * @param {object} moddedVector - The vector to remove.
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
 * Record a mode change on a vector as an undoable timeline action.
 *
 * A vector's `modes` object controls rendering flags such as eraser, inject,
 * or curve sub-type. Optionally, if the mode change also altered
 * `vectorProperties` (e.g. curve-type switches that initialize control
 * points), those snapshots can be included so undo fully restores geometry.
 * @param {object} moddedVector - The vector whose modes were changed.
 * @param {object} oldModes - The modes object before the change.
 * @param {object} newModes - The modes object after the change.
 * @param {object|null} oldVectorProperties - Optional snapshot of
 *   vectorProperties before the change (used when modes affect geometry).
 * @param {object|null} newVectorProperties - Optional snapshot of
 *   vectorProperties after the change.
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
 * Switch a curve vector's curve type and record the change as an undoable
 * timeline action.
 *
 * Valid curve types are 'line', 'quadCurve', and 'cubicCurve'. When upgrading
 * to a curve type that requires control points (px3/py3 for quadratic,
 * px4/py4 additionally for cubic), any missing control points are initialized
 * to the midpoint of the two endpoints so the curve starts in a sensible shape.
 *
 * The canvas is rendered BEFORE the timeline entry is recorded so that the
 * snapshot captured by `addToTimeline` reflects the post-change pixels.
 * Snapshotting before rendering would capture stale pixel data and produce
 * incorrect results when undoing.
 * @param {object} targetVector - The curve vector to update.
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
  // Set all curve-type flags to false, then enable only the chosen type.
  CURVE_TYPES.forEach((curveType) => {
    targetVector.modes[curveType] = curveType === newCurveType
  })
  const vectorProperties = targetVector.vectorProperties
  // Initialize the quadratic control point to the line midpoint if absent.
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
  // Initialize the second cubic control point to the line midpoint if absent.
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
  // Keep the live GUI handle positions in sync with the new control points.
  // Handle coords are stored in canvas-space (layer offset applied), whereas
  // vectorProperties stores layer-relative coords.
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
  // Render before recording so addToTimeline's snapshot captures the
  // post-render pixels. Snapshotting first would preserve stale pixels.
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
 * Mark every action on a given layer up to the current stack position as
 * removed, effectively clearing the layer's drawn content, then record the
 * clear as a single undoable timeline entry.
 *
 * Rather than erasing canvas pixels directly, this function sets
 * `action.removed = true` on every matching timeline entry so the renderer
 * skips them when replaying the timeline. Undo reverses all those flags in
 * one step via `handleClearAction`.
 *
 * Any vector indices associated with cleared actions are also flagged as
 * removed so vector rendering stays consistent with the pixel state.
 * @param {object} layer - The layer whose actions should be cleared.
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
