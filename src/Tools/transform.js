import { TRANSLATE, ROTATE, SCALE } from "../utils/constants.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { keys } from "../Shortcuts/keys.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import { vectorGui, createActiveIndexesForRender } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  updateVectorProperties,
  rotateVectors,
  translateVectors,
  findCentroid,
  findVectorShapeCentroid,
} from "../utils/vectorHelpers.js"
import { getAngle } from "../utils/trig.js"

//=======================================//
//======== * * * Transform * * * ========//
//=======================================//

//NOTE: There is no dedicated tool for transform. This code is used in the vector tools.

/**
 * Transform selected vectors
 * Ignore all tool options
 * This is for full vector rotation, scaling, and translation
 */
export function transformVectorSteps() {
  //Doesn't really matter which selected vector is used since all selected vectors will be transformed, but one is needed for keeping track of the right layer, etc. so use the first one.
  let currentVector =
    state.vectors[state.selectedVectorIndicesSet.values().next().value]
  switch (canvas.pointerEvent) {
    case "pointerdown": {
      //Incrementing click counter stops vector adjustment from triggering when cursor hovers over a vector control point while transforming. TODO: (Low Priority) Implement a clearer way to handle this specific to transform.
      state.clickCounter += 1
      state.grabStartX = state.cursorX
      state.grabStartY = state.cursorY
      state.grabStartShapeCenterX = state.shapeCenterX
      state.grabStartShapeCenterY = state.shapeCenterY
      //reset current vector properties (this also resets the state.currentVectorIndex if there is one)
      vectorGui.reset()
      //Set state.vectorsSavedProperties for all selected vectors
      state.vectorsSavedProperties = {}
      state.selectedVectorIndicesSet.forEach((index) => {
        const vectorProperties = state.vectors[index].vectorProperties
        state.vectorsSavedProperties[index] = {
          ...vectorProperties,
        }
      })
      //Set activeIndexes for all selected vectors
      state.activeIndexes = createActiveIndexesForRender(
        currentVector,
        state.vectorsSavedProperties
      )
      if (state.vectorTransformMode === ROTATE) {
        //Rotation
        state.grabStartAngle = getAngle(
          state.shapeCenterX - state.grabStartX,
          state.shapeCenterY - state.grabStartY
        )
      }
      renderCanvas(currentVector.layer, true, state.activeIndexes, true)
      break
    }
    case "pointermove": {
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Based on the action being taken, update the vector properties for all selected vectors.
      if (state.vectorTransformMode === ROTATE) {
        //Rotation
        rotateVectors(
          currentVector.layer,
          state.vectorsSavedProperties,
          state.vectors,
          state.cursorX,
          state.cursorY,
          state.grabStartX,
          state.grabStartY,
          state.shapeCenterX,
          state.shapeCenterY
        )
      } else if (state.vectorTransformMode === TRANSLATE) {
        //Translation
        const xDiff = state.cursorX - state.grabStartX
        const yDiff = state.cursorY - state.grabStartY
        translateVectors(
          currentVector.layer,
          state.vectorsSavedProperties,
          state.vectors,
          xDiff,
          yDiff
        )
        //Update shape center
        state.shapeCenterX = state.grabStartShapeCenterX + xDiff
        state.shapeCenterY = state.grabStartShapeCenterY + yDiff
      }
      renderCanvas(currentVector.layer, true, state.activeIndexes)
      break
    }
    case "pointerup": {
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Based on the action being taken, update the vector properties for all selected vectors.
      if (state.vectorTransformMode === ROTATE) {
        //Rotation
        rotateVectors(
          currentVector.layer,
          state.vectorsSavedProperties,
          state.vectors,
          state.cursorX,
          state.cursorY,
          state.grabStartX,
          state.grabStartY,
          state.shapeCenterX,
          state.shapeCenterY
        )
        vectorGui.mother.currentRotation = vectorGui.mother.newRotation
        state.grabStartAngle = null
      } else if (state.vectorTransformMode === TRANSLATE) {
        //Translation
        const xDiff = state.cursorX - state.grabStartX
        const yDiff = state.cursorY - state.grabStartY
        translateVectors(
          currentVector.layer,
          state.vectorsSavedProperties,
          state.vectors,
          xDiff,
          yDiff
        )
        //Update shape center
        state.shapeCenterX = state.grabStartShapeCenterX + xDiff
        state.shapeCenterY = state.grabStartShapeCenterY + yDiff
      }
      state.grabStartShapeCenterX = null
      state.grabStartShapeCenterY = null
      state.clickCounter = 0
      renderCanvas(currentVector.layer, true, state.activeIndexes)
      modifyVectorAction(currentVector)
      break
    }
    default:
    //do nothing
  }
}

/**
 * Move rotation point for vectors (rotate around a point)
 * TODO: (Medium Priority) Track shape center in timeline for transformations to keep translate consistent. No need to track it in this code block until shapes are added as a feature.
 * Alternatively just recalculate center when undoing/ redoing transformations.
 */
export function moveVectorRotationPointSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedPoint.xKey,
        yKey: vectorGui.collidedPoint.yKey,
      }
      state.shapeCenterX = state.cursorX
      state.shapeCenterY = state.cursorY
      break
    case "pointermove":
      state.shapeCenterX = state.cursorX
      state.shapeCenterY = state.cursorY
      break
    case "pointerup":
      state.shapeCenterX = state.cursorX
      state.shapeCenterY = state.cursorY
      vectorGui.selectedPoint = {
        xKey: null,
        yKey: null,
      }
      break
    default:
    //do nothing
  }
}
