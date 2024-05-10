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
import { getAngle } from "../utils/trig.js"
import { getOpposingEllipseVertex, findHalf } from "../utils/ellipse.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  updateVectorProperties,
  rotateVectors,
  translateVectors,
  findCentroid,
  findVectorShapeCentroid,
} from "../utils/vectorHelpers.js"
import { transformVectorContent } from "../utils/transformHelpers.js"

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
      vectorGui.selectedPoint = {
        xKey: null,
        yKey: null,
      }
      break
    }
    default:
    //do nothing
  }
}

/**
 * TODO: (High Priority) Currently does not work for ellipses. Angle and radii will have to be recalculated.
 * TODO: (High Priority) Implement locking ratio to maintain aspect ratio while scaling.
 */
function scaleVectorSteps() {
  let currentVector =
    state.vectors[state.selectedVectorIndicesSet.values().next().value]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedPoint.xKey,
        yKey: vectorGui.collidedPoint.yKey,
      }
      state.previousBoundaryBox = { ...state.boundaryBox }
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
      renderCanvas(currentVector.layer, true, state.activeIndexes, true)
      break
    case "pointermove": {
      transformBoundaries()
      let isMirroredHorizontally = false
      let isMirroredVertically = false
      if (vectorGui.selectedPoint.xKey !== "px9") {
        //Don't check for mirroring when moving whole selection
        if (
          state.boundaryBox.xMax === state.previousBoundaryBox.xMin ||
          state.boundaryBox.xMin === state.previousBoundaryBox.xMax
        ) {
          isMirroredHorizontally = !isMirroredHorizontally
        }
        if (
          state.boundaryBox.yMax === state.previousBoundaryBox.yMin ||
          state.boundaryBox.yMin === state.previousBoundaryBox.yMax
        ) {
          isMirroredVertically = !isMirroredVertically
        }
      }
      transformVectorContent(
        state.vectors,
        state.vectorsSavedProperties,
        state.previousBoundaryBox,
        state.boundaryBox,
        isMirroredHorizontally,
        isMirroredVertically
      )
      renderCanvas(currentVector.layer, true, state.activeIndexes)
      break
    }
    case "pointerup":
      state.normalizeSelectProperties()
      state.setBoundaryBox(state.selectProperties)
      renderCanvas(currentVector.layer, true, state.activeIndexes)
      modifyVectorAction(currentVector)
      vectorGui.selectedPoint = {
        xKey: null,
        yKey: null,
      }
      break
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

/**
 * Transform selected area by dragging one of eight control points or move selected area by dragging inside selected area
 * TODO: (Medium Priority) Make shortcuts for maintaining ratio while dragging control points
 */
export function transformBoundaries() {
  //selectedPoint does not correspond to the selectProperties key. Based on selected point, adjust boundaryBox.
  switch (vectorGui.selectedPoint.xKey) {
    case "px1":
      state.selectProperties.px1 = state.cursorX
      state.selectProperties.py1 = state.cursorY
      break
    case "px2":
      state.selectProperties.py1 = state.cursorY
      break
    case "px3":
      state.selectProperties.px2 = state.cursorX
      state.selectProperties.py1 = state.cursorY
      break
    case "px4":
      state.selectProperties.px2 = state.cursorX
      break
    case "px5":
      state.selectProperties.px2 = state.cursorX
      state.selectProperties.py2 = state.cursorY
      break
    case "px6":
      state.selectProperties.py2 = state.cursorY
      break
    case "px7":
      state.selectProperties.px1 = state.cursorX
      state.selectProperties.py2 = state.cursorY
      break
    case "px8":
      state.selectProperties.px1 = state.cursorX
      break
    case "px9": {
      //move selected contents
      const deltaX = state.cursorX - state.previousX
      const deltaY = state.cursorY - state.previousY
      state.selectProperties.px1 += deltaX
      state.selectProperties.py1 += deltaY
      state.selectProperties.px2 += deltaX
      state.selectProperties.py2 += deltaY
      break
    }
    default:
    //do nothing
  }
  state.setBoundaryBox(state.selectProperties)
}

//=======================================//
//======== * * * Adjusters * * * ========//
//=======================================//

//Helper functions for ellipse tool

/**
 * Update the offsets of an ellipse
 * @param {object} vectorProperties - The properties of the vector
 * @param {boolean|null|undefined} overrideForceCircle - force circle if passed in
 * @param {number} angleOffset - angle offset
 */
export function updateEllipseOffsets(
  vectorProperties,
  overrideForceCircle,
  angleOffset = 0
) {
  const forceCircle = overrideForceCircle ?? vectorProperties.forceCircle
  vectorProperties.angle = getAngle(
    vectorProperties.px2 - vectorProperties.px1,
    vectorProperties.py2 - vectorProperties.py1
  )
  if (state.tool.options.useSubpixels?.active) {
    vectorProperties.unifiedOffset = findHalf(
      canvas.subPixelX,
      canvas.subPixelY,
      vectorProperties.angle + angleOffset
    )
  } else {
    vectorProperties.unifiedOffset = 0 // TODO: (Medium Priority) need logic to manually select offset values
  }
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  while (vectorProperties.angle < 0) {
    vectorProperties.angle += 2 * Math.PI
  }
  // Determine the slice in which the angle exists
  let index =
    Math.floor(
      (vectorProperties.angle + angleOffset + Math.PI / 2 + Math.PI / 8) /
        (Math.PI / 4)
    ) % 8
  let compassDir = directions[index]
  //based on direction update x and y offsets in state
  //TODO: (Medium Priority) keep offset consistent during radius adjustment and use another gui element to control the way radius is handled, drawn as a compass, 8 options plus default center which is no offset
  //Direction shrinks opposite side. eg. radius 7 goes from diameter 15 to diameter 14
  //gui element could have 2 sliders, vertical and horizontal with 3 values each, offset -1, 0, 1 (right, none, left)
  //should only x1 and y1 offsets be available since they represent the center point being part of radius or not?
  if (forceCircle) {
    vectorProperties.x1Offset = -vectorProperties.unifiedOffset
    vectorProperties.y1Offset = -vectorProperties.unifiedOffset
  } else {
    switch (compassDir) {
      case "N":
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case "NE":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case "E":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        break
      case "SE":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case "S":
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case "SW":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case "W":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        break
      case "NW":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      default:
      //none
    }
  }
}

/**
 * Update the opposing control points of an ellipse
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} shiftedPoint - The shifted point
 * @param {string} shiftedXKey
 * @param {string} shiftedYKey
 * @param {number} newX - The new x value for the shifted point
 * @param {number} newY - The new y value for the shifted point
 */
export function syncEllipseProperties(
  vectorProperties,
  shiftedXKey,
  shiftedYKey,
  newX,
  newY
) {
  if (shiftedXKey !== "px1") {
    vectorProperties[shiftedXKey] = newX
    vectorProperties[shiftedYKey] = newY
  }
  let dxa = vectorProperties.px2 - vectorProperties.px1
  let dya = vectorProperties.py2 - vectorProperties.py1
  let dxb = vectorProperties.px3 - vectorProperties.px1
  let dyb = vectorProperties.py3 - vectorProperties.py1
  if (shiftedXKey === "px1") {
    //Moving center point, shift other control points to match
    vectorProperties[shiftedXKey] = newX
    vectorProperties[shiftedYKey] = newY
    vectorProperties.px2 = vectorProperties.px1 + dxa
    vectorProperties.py2 = vectorProperties.py1 + dya
    vectorProperties.px3 = vectorProperties.px1 + dxb
    vectorProperties.py3 = vectorProperties.py1 + dyb
  } else if (shiftedXKey === "px2") {
    //Moving px2, adjust radA and px3
    vectorProperties.radA = Math.sqrt(dxa * dxa + dya * dya)
    //radB remains constant while radA changes unless forceCircle is true
    if (vectorProperties.forceCircle) {
      vectorProperties.radB = vectorProperties.radA
    }
    let newVertex = getOpposingEllipseVertex(
      vectorProperties.px1,
      vectorProperties.py1,
      vectorProperties.px2,
      vectorProperties.py2,
      -Math.PI / 2,
      vectorProperties.radB
    )
    vectorProperties.px3 = newVertex.x
    vectorProperties.py3 = newVertex.y
    updateEllipseOffsets(vectorProperties, vectorProperties.forceCircle, 0)
  } else if (shiftedXKey === "px3") {
    //Moving px3, adjust radB and px2
    vectorProperties.radB = Math.sqrt(dxb * dxb + dyb * dyb)
    //radA remains constant while radB changes unless forceCircle is true
    if (vectorProperties.forceCircle) {
      vectorProperties.radA = vectorProperties.radB
    }
    let newVertex = getOpposingEllipseVertex(
      vectorProperties.px1,
      vectorProperties.py1,
      vectorProperties.px3,
      vectorProperties.py3,
      Math.PI / 2,
      vectorProperties.radA
    )
    vectorProperties.px2 = newVertex.x
    vectorProperties.py2 = newVertex.y
    updateEllipseOffsets(
      vectorProperties,
      vectorProperties.forceCircle,
      1.5 * Math.PI
    )
  }
}

/**
 * Update ellipse vector properties
 * @param {object} currentVector - The current vector
 */
function updateEllipseVectorProperties(currentVector) {
  syncEllipseProperties(
    state.vectorProperties,
    vectorGui.selectedPoint.xKey,
    vectorGui.selectedPoint.yKey,
    state.cursorX,
    state.cursorY
  )
  currentVector.vectorProperties = { ...state.vectorProperties }
  //Keep properties relative to layer offset
  currentVector.vectorProperties.px1 -= currentVector.layer.x
  currentVector.vectorProperties.py1 -= currentVector.layer.y
  currentVector.vectorProperties.px2 -= currentVector.layer.x
  currentVector.vectorProperties.py2 -= currentVector.layer.y
  currentVector.vectorProperties.px3 -= currentVector.layer.x
  currentVector.vectorProperties.py3 -= currentVector.layer.y
}

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
      //TODO: (Medium Priority) If holding shift, add or remove vector from selected vectors set and return
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedPoint.xKey,
        yKey: vectorGui.collidedPoint.yKey,
      }
      state.vectorsSavedProperties[state.currentVectorIndex] = {
        ...currentVector.vectorProperties,
      }
      if (currentVector.vectorProperties.type === "ellipse") {
        if (
          !keys.ShiftLeft &&
          !keys.ShiftRight &&
          vectorGui.selectedPoint.xKey !== "px1"
        ) {
          //if shift key is not being held and selected point is not the center, reset forceCircle
          state.vectorProperties.forceCircle = false
          currentVector.vectorProperties.forceCircle = false
        }
        if (vectorGui.selectedPoint.xKey === "px1") {
          //if center point is selected, use current vector's forceCircle value
          state.vectorProperties.forceCircle =
            currentVector.vectorProperties.forceCircle
        }
        updateEllipseVectorProperties(currentVector)
      } else {
        state.vectorProperties[vectorGui.collidedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedPoint.yKey] = state.cursorY
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
      }
      state.activeIndexes = createActiveIndexesForRender(
        currentVector,
        state.vectorsSavedProperties
      )
      renderCanvas(currentVector.layer, true, state.activeIndexes, true)
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        if (currentVector.vectorProperties.type === "ellipse") {
          updateEllipseVectorProperties(currentVector)
        } else {
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
        }
        renderCanvas(currentVector.layer, true, state.activeIndexes)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        if (currentVector.vectorProperties.type === "ellipse") {
          updateEllipseVectorProperties(currentVector)
        } else {
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
            ["px1", "px2"].includes(vectorGui.selectedPoint.xKey) &&
            state.collidedVectorIndex !== null &&
            state.currentVectorIndex !== null
          ) {
            //snap selected point to collidedVector's control point
            let collidedVector = state.vectors[state.collidedVectorIndex]
            if (
              !["fill", "ellipse"].includes(
                collidedVector.vectorProperties.type
              ) &&
              !["fill", "ellipse"].includes(currentVector.vectorProperties.type)
            ) {
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
                    getAngle(collidedHandleDeltaX, collidedHandleDeltaY) +
                    Math.PI
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

/**
 *
 * @returns {boolean} - True if action is taken, false if not
 */
export function rerouteVectorStepsAction() {
  //for selecting another vector via the canvas, collisionPresent is false since it is currently based on collision with selected vector.
  if (
    state.collidedVectorIndex !== null &&
    !vectorGui.selectedCollisionPresent &&
    state.clickCounter === 0
  ) {
    let collidedVector = state.vectors[state.collidedVectorIndex]
    vectorGui.setVectorProperties(collidedVector)
    //Render new selected vector before running standard render routine
    //First render makes the new selected vector collidable with other vectors and the next render handles the collision normally.
    // renderCurrentVector() //May not be needed after changing order of render calls in renderLayerVectors
    vectorGui.render()
  }
  if (
    ((vectorGui.collidedPoint.xKey === "rotationx" &&
      vectorGui.selectedPoint.xKey === null) ||
      vectorGui.selectedPoint.xKey === "rotationx") &&
    state.clickCounter === 0
  ) {
    moveVectorRotationPointSteps()
    return true
  }
  //TODO: (High Priority) Implement function for handling scaling vector shapes.
  if (
    state.vectorTransformMode === SCALE &&
    state.selectedVectorIndicesSet.size > 0
  ) {
    scaleVectorSteps()
    return true
  }
  if (
    vectorGui.selectedCollisionPresent &&
    state.clickCounter === 0 &&
    state.currentVectorIndex !== null
  ) {
    adjustVectorSteps()
    return true
  }
  //If there are selected vectors, call transformVectorSteps() instead of this function
  if (state.selectedVectorIndicesSet.size > 0) {
    transformVectorSteps()
    return true
  }
  return false
}
