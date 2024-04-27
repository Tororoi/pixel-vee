import { TRANSLATE, ROTATE, SCALE } from "../utils/constants.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { keys } from "../Shortcuts/keys.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import {
  vectorGui,
  updateLinkedVectors,
  updateLockedCurrentVectorControlHandle,
  createActiveIndexesForRender,
} from "../GUI/vector.js"
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

//=======================================//
//======== * * * Adjusters * * * ========//
//=======================================//

/**
 * Used for line, quadCurve, and cubicCurve tools
 * Used automatically by vector tools after curve is completed.
 * TODO: (Low Priority) create distinct tool for adjusting that won't create a new curve when clicking.
 * Ideally a user should be able to click on a curve and render it's vector UI that way.
 * TODO: (Medium Priority) for linking fill vector, fill would be limited by active linked vectors as borders, position unchanged
 * How should fill vector be linked, since it won't be via positioning?
 * BUG: cut selection not rendered properly in timeline
 */
export function adjustVectorSteps() {
  let currentVector = state.vectors[state.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
        //TODO: (Medium Priority) If holding shift, add or remove vector from selected vectors set and return
        state.vectorProperties[vectorGui.collidedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedPoint.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedPoint.xKey,
          yKey: vectorGui.collidedPoint.yKey,
        }
        state.vectorsSavedProperties[state.currentVectorIndex] = {
          ...currentVector.vectorProperties,
        }
        //save linked vectors too
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        if (state.tool.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            state.cursorX,
            state.cursorY
          )
        }
        if (state.tool.options.link?.active) {
          updateLinkedVectors(currentVector, true)
        }
        state.activeIndexes = createActiveIndexesForRender(
          currentVector,
          state.vectorsSavedProperties
        )
        renderCanvas(currentVector.layer, true, state.activeIndexes, true)
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        if (state.tool.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            state.cursorX,
            state.cursorY
          )
        }
        if (state.tool.options.link?.active) {
          updateLinkedVectors(currentVector)
        }
        renderCanvas(currentVector.layer, true, state.activeIndexes)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        if (state.tool.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            state.cursorX,
            state.cursorY
          )
        }
        if (state.tool.options.link?.active) {
          updateLinkedVectors(currentVector)
        }
        //Handle snapping p1 or p2 to other control points. Only snap when there are no linked vectors to selected vector.
        if (
          (state.tool.options.align?.active ||
            state.tool.options.equal?.active ||
            state.tool.options.link?.active) &&
          Object.keys(state.vectorsSavedProperties).length === 1 &&
          ["px1", "px2"].includes(vectorGui.selectedPoint.xKey)
        ) {
          //snap selected point to collidedVector's control point
          if (
            state.collidedVectorIndex !== null &&
            state.currentVectorIndex !== null
          ) {
            let collidedVector = state.vectors[state.collidedVectorIndex]
            let snappedToX =
              collidedVector.vectorProperties[
                vectorGui.otherCollidedKeys.xKey
              ] + collidedVector.layer.x
            let snappedToY =
              collidedVector.vectorProperties[
                vectorGui.otherCollidedKeys.yKey
              ] + collidedVector.layer.y
            state.vectorProperties[vectorGui.selectedPoint.xKey] = snappedToX
            state.vectorProperties[vectorGui.selectedPoint.yKey] = snappedToY
            updateVectorProperties(
              currentVector,
              snappedToX,
              snappedToY,
              vectorGui.selectedPoint.xKey,
              vectorGui.selectedPoint.yKey
            )
            if (state.tool.options.hold?.active) {
              updateLockedCurrentVectorControlHandle(
                currentVector,
                snappedToX,
                snappedToY
              )
            }
            //Handle options behavior on snapping, currently only viable for quadCurve and cubicCurve
            if (
              (state.tool.options.align?.active ||
                state.tool.options.equal?.active) &&
              ["px1", "px2"].includes(vectorGui.selectedPoint.xKey)
            ) {
              //Set selected keys
              let selectedEndpointXKey,
                selectedEndpointYKey,
                selectedHandleXKey,
                selectedHandleYKey
              //if control point is p1, handle is line to p3, if control point is p2, handle is line to p4
              if (vectorGui.selectedPoint.xKey === "px1") {
                selectedEndpointXKey = "px1"
                selectedEndpointYKey = "py1"
                selectedHandleXKey = "px3"
                selectedHandleYKey = "py3"
              } else if (vectorGui.selectedPoint.xKey === "px2") {
                selectedEndpointXKey = "px2"
                selectedEndpointYKey = "py2"
                if (currentVector.vectorProperties.type === "quadCurve") {
                  selectedHandleXKey = "px3"
                  selectedHandleYKey = "py3"
                } else {
                  selectedHandleXKey = "px4"
                  selectedHandleYKey = "py4"
                }
              }
              //Set selected deltas
              const savedCurrentProperties =
                state.vectorsSavedProperties[currentVector.index]
              const currentHandleDeltaX =
                savedCurrentProperties[selectedEndpointXKey] -
                savedCurrentProperties[selectedHandleXKey]
              const currentHandleDeltaY =
                savedCurrentProperties[selectedEndpointYKey] -
                savedCurrentProperties[selectedHandleYKey]
              const selectedHandleDeltaX =
                state.vectorProperties[selectedHandleXKey] -
                state.vectorProperties[selectedEndpointXKey]
              const selectedHandleDeltaY =
                state.vectorProperties[selectedHandleYKey] -
                state.vectorProperties[selectedEndpointYKey]
              //Set collided deltas
              let collidedHandleDeltaX, collidedHandleDeltaY
              if (vectorGui.otherCollidedKeys.xKey === "px1") {
                collidedHandleDeltaX =
                  collidedVector.vectorProperties.px3 -
                  collidedVector.vectorProperties.px1
                collidedHandleDeltaY =
                  collidedVector.vectorProperties.py3 -
                  collidedVector.vectorProperties.py1
              } else if (vectorGui.otherCollidedKeys.xKey === "px2") {
                if (collidedVector.vectorProperties.type === "quadCurve") {
                  collidedHandleDeltaX =
                    collidedVector.vectorProperties.px3 -
                    collidedVector.vectorProperties.px2
                  collidedHandleDeltaY =
                    collidedVector.vectorProperties.py3 -
                    collidedVector.vectorProperties.py2
                } else {
                  collidedHandleDeltaX =
                    collidedVector.vectorProperties.px4 -
                    collidedVector.vectorProperties.px2
                  collidedHandleDeltaY =
                    collidedVector.vectorProperties.py4 -
                    collidedVector.vectorProperties.py2
                }
              }
              let selectedHandleLength
              if (state.tool.options.equal?.active) {
                //Make selected handle length equal to collided vector's handle length
                selectedHandleLength = Math.sqrt(
                  collidedHandleDeltaX ** 2 + collidedHandleDeltaY ** 2
                )
              } else {
                //Maintain selected handle length
                selectedHandleLength = Math.sqrt(
                  currentHandleDeltaX ** 2 + currentHandleDeltaY ** 2
                )
              }
              let newSelectedAngle
              //Priority for angle is align > equal
              if (state.tool.options.align?.active) {
                //Align angle of selected control handle opposite of collided vector control handle
                newSelectedAngle =
                  getAngle(collidedHandleDeltaX, collidedHandleDeltaY) + Math.PI
              } else if (state.tool.options.equal?.active) {
                //Maintain absolute angle of selected control handle
                newSelectedAngle = getAngle(
                  selectedHandleDeltaX,
                  selectedHandleDeltaY
                )
              }
              const newSelectedHandleDeltaX = -Math.round(
                Math.cos(newSelectedAngle) * selectedHandleLength
              )
              const newSelectedHandleDeltaY = -Math.round(
                Math.sin(newSelectedAngle) * selectedHandleLength
              )
              state.vectorProperties[selectedHandleXKey] =
                state.vectorProperties[selectedEndpointXKey] -
                newSelectedHandleDeltaX
              state.vectorProperties[selectedHandleYKey] =
                state.vectorProperties[selectedEndpointYKey] -
                newSelectedHandleDeltaY
              updateVectorProperties(
                currentVector,
                state.vectorProperties[selectedHandleXKey],
                state.vectorProperties[selectedHandleYKey],
                selectedHandleXKey,
                selectedHandleYKey
              )
            }
          }
        }
        renderCanvas(currentVector.layer, true, state.activeIndexes)
        // renderCanvas(currentVector.layer, true)
        modifyVectorAction(currentVector)
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
      }
      break
    default:
    //do nothing
  }
}
