import { SCALE } from "../utils/constants.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { keys } from "../Shortcuts/keys.js"
import { modifyVectorAction } from "../Actions/modifyTimeline/modifyTimeline.js"
import {
  vectorGui,
  updateLinkedVectors,
  updateLockedCurrentVectorControlHandle,
  createActiveIndexesForRender,
} from "../GUI/vector.js"
import { getAngle } from "../utils/trig.js"
import {
  getOpposingEllipseVertex,
  findHalf,
  calcEllipseConicsFromVertices,
} from "../utils/ellipse.js"
import { renderCanvas } from "../Canvas/render.js"
import { updateVectorProperties } from "../utils/vectorHelpers.js"
import {
  transformVectorSteps,
  scaleVectorSteps,
  moveVectorRotationPointSteps,
} from "./transform.js"

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
  if (state.tool.current.options.useSubpixels?.active) {
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
 * @param {string} shiftedXKey - The key of the shifted x value
 * @param {string} shiftedYKey - The key of the shifted y value
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
  let conicControlPoints = calcEllipseConicsFromVertices(
    vectorProperties.px1,
    vectorProperties.py1,
    vectorProperties.radA,
    vectorProperties.radB,
    vectorProperties.angle,
    vectorProperties.x1Offset,
    vectorProperties.y1Offset
  )
  vectorProperties.weight = conicControlPoints.weight
  vectorProperties.leftTangentX = conicControlPoints.leftTangentX
  vectorProperties.leftTangentY = conicControlPoints.leftTangentY
  vectorProperties.topTangentX = conicControlPoints.topTangentX
  vectorProperties.topTangentY = conicControlPoints.topTangentY
  vectorProperties.rightTangentX = conicControlPoints.rightTangentX
  vectorProperties.rightTangentY = conicControlPoints.rightTangentY
  vectorProperties.bottomTangentX = conicControlPoints.bottomTangentX
  vectorProperties.bottomTangentY = conicControlPoints.bottomTangentY
}

/**
 * Update ellipse vector properties
 * @param {object} currentVector - The current vector
 */
function updateEllipseVectorProperties(currentVector) {
  syncEllipseProperties(
    state.vector.properties,
    vectorGui.selectedPoint.xKey,
    vectorGui.selectedPoint.yKey,
    state.cursor.x,
    state.cursor.y
  )
  currentVector.vectorProperties = {
    ...state.vector.properties,
  }
  //Keep properties relative to layer offset
  currentVector.vectorProperties.px1 -= currentVector.layer.x
  currentVector.vectorProperties.py1 -= currentVector.layer.y
  currentVector.vectorProperties.px2 -= currentVector.layer.x
  currentVector.vectorProperties.py2 -= currentVector.layer.y
  currentVector.vectorProperties.px3 -= currentVector.layer.x
  currentVector.vectorProperties.py3 -= currentVector.layer.y
  currentVector.vectorProperties.leftTangentX -= currentVector.layer.x
  currentVector.vectorProperties.leftTangentY -= currentVector.layer.y
  currentVector.vectorProperties.topTangentX -= currentVector.layer.x
  currentVector.vectorProperties.topTangentY -= currentVector.layer.y
  currentVector.vectorProperties.rightTangentX -= currentVector.layer.x
  currentVector.vectorProperties.rightTangentY -= currentVector.layer.y
  currentVector.vectorProperties.bottomTangentX -= currentVector.layer.x
  currentVector.vectorProperties.bottomTangentY -= currentVector.layer.y
}

/**
 * Snap the selected endpoint to a colliding vector's nearest control point and
 * optionally align or equalize the tangent handle's angle and length.
 * Only called from adjustVectorSteps pointerup when the snapping conditions are met.
 * @param {object} currentVector - The current vector being adjusted
 */
function snapEndpointToCollidedVector(currentVector) {
  let collidedVector = state.vector.all[state.vector.collidedIndex]
  if (
    ["fill", "ellipse"].includes(collidedVector.vectorProperties.type) ||
    ["fill", "ellipse"].includes(currentVector.vectorProperties.type)
  ) {
    return
  }
  // Snap the selected endpoint to the collided vector's nearest control point
  let snappedToX =
    collidedVector.vectorProperties[vectorGui.otherCollidedKeys.xKey] +
    collidedVector.layer.x
  let snappedToY =
    collidedVector.vectorProperties[vectorGui.otherCollidedKeys.yKey] +
    collidedVector.layer.y
  state.vector.properties[vectorGui.selectedPoint.xKey] = snappedToX
  state.vector.properties[vectorGui.selectedPoint.yKey] = snappedToY
  updateVectorProperties(
    currentVector,
    snappedToX,
    snappedToY,
    vectorGui.selectedPoint.xKey,
    vectorGui.selectedPoint.yKey
  )
  if (state.tool.current.options.hold?.active) {
    updateLockedCurrentVectorControlHandle(currentVector, snappedToX, snappedToY)
  }
  // Handle align/equal options: adjust tangent handle after snapping
  if (
    !(
      state.tool.current.options.align?.active ||
      state.tool.current.options.equal?.active
    ) ||
    !["px1", "px2"].includes(vectorGui.selectedPoint.xKey)
  ) {
    return
  }
  // Determine the endpoint and handle key pairs for the current vector
  let selectedEndpointXKey, selectedEndpointYKey, selectedHandleXKey, selectedHandleYKey
  if (vectorGui.selectedPoint.xKey === "px1") {
    selectedEndpointXKey = "px1"
    selectedEndpointYKey = "py1"
    selectedHandleXKey = "px3"
    selectedHandleYKey = "py3"
  } else {
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
  // Compute deltas for handle length and angle calculations
  const savedCurrentProperties = state.vector.savedProperties[currentVector.index]
  const currentHandleDeltaX =
    savedCurrentProperties[selectedEndpointXKey] -
    savedCurrentProperties[selectedHandleXKey]
  const currentHandleDeltaY =
    savedCurrentProperties[selectedEndpointYKey] -
    savedCurrentProperties[selectedHandleYKey]
  const selectedHandleDeltaX =
    state.vector.properties[selectedHandleXKey] -
    state.vector.properties[selectedEndpointXKey]
  const selectedHandleDeltaY =
    state.vector.properties[selectedHandleYKey] -
    state.vector.properties[selectedEndpointYKey]
  // Compute the collided vector's handle delta (relative to its snapped endpoint)
  let collidedHandleDeltaX, collidedHandleDeltaY
  if (vectorGui.otherCollidedKeys.xKey === "px1") {
    collidedHandleDeltaX =
      collidedVector.vectorProperties.px3 - collidedVector.vectorProperties.px1
    collidedHandleDeltaY =
      collidedVector.vectorProperties.py3 - collidedVector.vectorProperties.py1
  } else if (vectorGui.otherCollidedKeys.xKey === "px2") {
    if (collidedVector.vectorProperties.type === "quadCurve") {
      collidedHandleDeltaX =
        collidedVector.vectorProperties.px3 - collidedVector.vectorProperties.px2
      collidedHandleDeltaY =
        collidedVector.vectorProperties.py3 - collidedVector.vectorProperties.py2
    } else {
      collidedHandleDeltaX =
        collidedVector.vectorProperties.px4 - collidedVector.vectorProperties.px2
      collidedHandleDeltaY =
        collidedVector.vectorProperties.py4 - collidedVector.vectorProperties.py2
    }
  }
  // Handle length: equal mode uses collided handle length, otherwise maintain current
  const selectedHandleLength = state.tool.current.options.equal?.active
    ? Math.sqrt(collidedHandleDeltaX ** 2 + collidedHandleDeltaY ** 2)
    : Math.sqrt(currentHandleDeltaX ** 2 + currentHandleDeltaY ** 2)
  // Handle angle: align takes priority over equal
  const newSelectedAngle = state.tool.current.options.align?.active
    ? getAngle(collidedHandleDeltaX, collidedHandleDeltaY) + Math.PI
    : getAngle(selectedHandleDeltaX, selectedHandleDeltaY)
  const newSelectedHandleDeltaX = -Math.round(
    Math.cos(newSelectedAngle) * selectedHandleLength
  )
  const newSelectedHandleDeltaY = -Math.round(
    Math.sin(newSelectedAngle) * selectedHandleLength
  )
  state.vector.properties[selectedHandleXKey] =
    state.vector.properties[selectedEndpointXKey] - newSelectedHandleDeltaX
  state.vector.properties[selectedHandleYKey] =
    state.vector.properties[selectedEndpointYKey] - newSelectedHandleDeltaY
  updateVectorProperties(
    currentVector,
    state.vector.properties[selectedHandleXKey],
    state.vector.properties[selectedHandleYKey],
    selectedHandleXKey,
    selectedHandleYKey
  )
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
  let currentVector = state.vector.all[state.vector.currentIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //TODO: (Medium Priority) If holding shift, add or remove vector from selected vectors set and return
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedPoint.xKey,
        yKey: vectorGui.collidedPoint.yKey,
      }
      state.vector.savedProperties[state.vector.currentIndex] = {
        ...currentVector.vectorProperties,
      }
      if (currentVector.vectorProperties.type === "ellipse") {
        if (
          !keys.ShiftLeft &&
          !keys.ShiftRight &&
          vectorGui.selectedPoint.xKey !== "px1"
        ) {
          //if shift key is not being held and selected point is not the center, reset forceCircle
          state.vector.properties.forceCircle = false
          currentVector.vectorProperties.forceCircle = false
        }
        if (vectorGui.selectedPoint.xKey === "px1") {
          //if center point is selected, use current vector's forceCircle value
          state.vector.properties.forceCircle =
            currentVector.vectorProperties.forceCircle
        }
        updateEllipseVectorProperties(currentVector)
      } else {
        state.vector.properties[vectorGui.collidedPoint.xKey] = state.cursor.x
        state.vector.properties[vectorGui.collidedPoint.yKey] = state.cursor.y
        //save linked vectors too
        updateVectorProperties(
          currentVector,
          state.cursor.x,
          state.cursor.y,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        if (state.tool.current.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            state.cursor.x,
            state.cursor.y
          )
        }
        if (state.tool.current.options.link?.active) {
          updateLinkedVectors(currentVector, true)
        }
      }
      state.timeline.activeIndexes = createActiveIndexesForRender(
        currentVector,
        state.vector.savedProperties
      )
      renderCanvas(currentVector.layer, true, state.timeline.activeIndexes, true)
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        if (currentVector.vectorProperties.type === "ellipse") {
          updateEllipseVectorProperties(currentVector)
        } else {
          state.vector.properties[vectorGui.selectedPoint.xKey] = state.cursor.x
          state.vector.properties[vectorGui.selectedPoint.yKey] = state.cursor.y
          updateVectorProperties(
            currentVector,
            state.cursor.x,
            state.cursor.y,
            vectorGui.selectedPoint.xKey,
            vectorGui.selectedPoint.yKey
          )
          if (state.tool.current.options.hold?.active) {
            updateLockedCurrentVectorControlHandle(
              currentVector,
              state.cursor.x,
              state.cursor.y
            )
          }
          if (state.tool.current.options.link?.active) {
            updateLinkedVectors(currentVector)
          }
        }
        renderCanvas(currentVector.layer, true, state.timeline.activeIndexes)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        if (currentVector.vectorProperties.type === "ellipse") {
          updateEllipseVectorProperties(currentVector)
        } else {
          state.vector.properties[vectorGui.selectedPoint.xKey] = state.cursor.x
          state.vector.properties[vectorGui.selectedPoint.yKey] = state.cursor.y
          updateVectorProperties(
            currentVector,
            state.cursor.x,
            state.cursor.y,
            vectorGui.selectedPoint.xKey,
            vectorGui.selectedPoint.yKey
          )
          if (state.tool.current.options.hold?.active) {
            updateLockedCurrentVectorControlHandle(
              currentVector,
              state.cursor.x,
              state.cursor.y
            )
          }
          if (state.tool.current.options.link?.active) {
            updateLinkedVectors(currentVector)
          }
          //Handle snapping p1 or p2 to other control points. Only snap when there are no linked vectors to selected vector.
          if (
            (state.tool.current.options.align?.active ||
              state.tool.current.options.equal?.active ||
              state.tool.current.options.link?.active) &&
            Object.keys(state.vector.savedProperties).length === 1 &&
            ["px1", "px2"].includes(vectorGui.selectedPoint.xKey) &&
            state.vector.collidedIndex !== null &&
            state.vector.currentIndex !== null
          ) {
            snapEndpointToCollidedVector(currentVector)
          }
        }
        renderCanvas(currentVector.layer, true, state.timeline.activeIndexes)
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
 * Dispatches to the appropriate vector interaction step function based on current state.
 * @returns {boolean} - True if an action was taken, false if not
 */
export function rerouteVectorStepsAction() {
  //for selecting another vector via the canvas, collisionPresent is false since it is currently based on collision with selected vector.
  if (
    state.vector.collidedIndex !== null &&
    !vectorGui.selectedCollisionPresent &&
    state.tool.clickCounter === 0
  ) {
    let collidedVector = state.vector.all[state.vector.collidedIndex]
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
    state.tool.clickCounter === 0
  ) {
    moveVectorRotationPointSteps()
    return true
  }
  if (
    state.vector.transformMode === SCALE &&
    state.vector.selectedIndices.size > 0
  ) {
    scaleVectorSteps()
    return true
  }
  if (
    vectorGui.selectedCollisionPresent &&
    state.tool.clickCounter === 0 &&
    state.vector.currentIndex !== null
  ) {
    adjustVectorSteps()
    return true
  }
  //If there are selected vectors, call transformVectorSteps() instead of this function
  if (state.vector.selectedIndices.size > 0) {
    transformVectorSteps()
    return true
  }
  return false
}
