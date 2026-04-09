import { SCALE } from '../utils/constants.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { keys } from '../Shortcuts/keys.js'
import { modifyVectorAction } from '../Actions/modifyTimeline/modifyTimeline.js'
import {
  vectorGui,
  updateLinkedVectors,
  updateLockedCurrentVectorControlHandle,
  createActiveIndexesForRender,
} from '../GUI/vector.js'
import { getAngle } from '../utils/trig.js'
import { renderCanvas } from '../Canvas/render.js'
import { updateVectorProperties } from '../utils/vectorHelpers.js'
import { updateEllipseVectorProperties } from './ellipse.js'
import { updatePolygonVectorProperties, getUniformCtx } from './polygon.js'
import {
  transformVectorSteps,
  scaleVectorSteps,
  moveVectorRotationPointSteps,
} from './transform.js'
import {
  getCropNormalizedCursorX,
  getCropNormalizedCursorY,
} from '../utils/coordinateHelpers.js'

//=======================================//
//======== * * * Adjusters * * * ========//
//=======================================//

/**
 * Returns the canvas-absolute coordinates of the chainable endpoint under the
 * cursor, or null if no valid chain target is colliding.
 * Checks the currently selected vector's endpoint first, then any other vector.
 * @returns {{ x: number, y: number } | null} Canvas-absolute coordinates or null
 */
export function getChainStartPoint() {
  const endpointKeys = ['px1', 'px2']
  // Case A: current selected vector's endpoint
  if (
    vectorGui.selectedCollisionPresent &&
    state.vector.currentIndex !== null &&
    endpointKeys.includes(vectorGui.collidedPoint.xKey)
  ) {
    const currentVector = state.vector.all[state.vector.currentIndex]
    if (currentVector && currentVector.vectorProperties.type === 'vector') {
      return {
        x:
          currentVector.vectorProperties[vectorGui.collidedPoint.xKey] +
          currentVector.layer.x,
        y:
          currentVector.vectorProperties[vectorGui.collidedPoint.yKey] +
          currentVector.layer.y,
      }
    }
  }
  // Case B: another vector's endpoint (otherCollidedKeys always set for px1/px2)
  if (
    state.vector.collidedIndex !== null &&
    endpointKeys.includes(vectorGui.otherCollidedKeys.xKey)
  ) {
    const collidedVector = state.vector.all[state.vector.collidedIndex]
    if (collidedVector && collidedVector.vectorProperties.type === 'vector') {
      return {
        x:
          collidedVector.vectorProperties[vectorGui.otherCollidedKeys.xKey] +
          collidedVector.layer.x,
        y:
          collidedVector.vectorProperties[vectorGui.otherCollidedKeys.yKey] +
          collidedVector.layer.y,
      }
    }
  }
  return null
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
    ['fill', 'ellipse'].includes(collidedVector.vectorProperties.type) ||
    ['fill', 'ellipse'].includes(currentVector.vectorProperties.type)
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
    vectorGui.selectedPoint.yKey,
  )
  if (state.tool.current.options.hold?.active) {
    updateLockedCurrentVectorControlHandle(
      currentVector,
      snappedToX,
      snappedToY,
    )
  }
  // Handle align/equal options: adjust tangent handle after snapping
  if (
    !(
      state.tool.current.options.align?.active ||
      state.tool.current.options.equal?.active
    ) ||
    !['px1', 'px2'].includes(vectorGui.selectedPoint.xKey) ||
    state.tool.current.modes.line
  ) {
    return
  }
  // Determine the endpoint and handle key pairs for the current vector
  let selectedEndpointXKey,
    selectedEndpointYKey,
    selectedHandleXKey,
    selectedHandleYKey
  if (vectorGui.selectedPoint.xKey === 'px1') {
    selectedEndpointXKey = 'px1'
    selectedEndpointYKey = 'py1'
    selectedHandleXKey = 'px3'
    selectedHandleYKey = 'py3'
  } else {
    selectedEndpointXKey = 'px2'
    selectedEndpointYKey = 'py2'
    if (currentVector.modes.quadCurve) {
      selectedHandleXKey = 'px3'
      selectedHandleYKey = 'py3'
    } else {
      selectedHandleXKey = 'px4'
      selectedHandleYKey = 'py4'
    }
  }
  // Compute deltas for handle length and angle calculations
  const savedCurrentProperties =
    state.vector.savedProperties[currentVector.index]
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
  if (vectorGui.otherCollidedKeys.xKey === 'px1') {
    collidedHandleDeltaX =
      collidedVector.vectorProperties.px3 - collidedVector.vectorProperties.px1
    collidedHandleDeltaY =
      collidedVector.vectorProperties.py3 - collidedVector.vectorProperties.py1
  } else if (vectorGui.otherCollidedKeys.xKey === 'px2') {
    if (collidedVector.modes.quadCurve) {
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
  // Handle length: equal mode uses collided handle length, otherwise maintain current
  const selectedHandleLength = state.tool.current.options.equal?.active
    ? Math.sqrt(collidedHandleDeltaX ** 2 + collidedHandleDeltaY ** 2)
    : Math.sqrt(currentHandleDeltaX ** 2 + currentHandleDeltaY ** 2)
  // Handle angle: align takes priority over equal
  const newSelectedAngle = state.tool.current.options.align?.active
    ? getAngle(collidedHandleDeltaX, collidedHandleDeltaY) + Math.PI
    : getAngle(selectedHandleDeltaX, selectedHandleDeltaY)
  const newSelectedHandleDeltaX = -Math.round(
    Math.cos(newSelectedAngle) * selectedHandleLength,
  )
  const newSelectedHandleDeltaY = -Math.round(
    Math.sin(newSelectedAngle) * selectedHandleLength,
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
    selectedHandleYKey,
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
  const normalizedX = getCropNormalizedCursorX()
  const normalizedY = getCropNormalizedCursorY()
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      //TODO: (Medium Priority) If holding shift, add or remove vector from selected vectors set and return
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedPoint.xKey,
        yKey: vectorGui.collidedPoint.yKey,
      }
      state.vector.savedProperties[state.vector.currentIndex] = {
        ...currentVector.vectorProperties,
      }
      if (currentVector.vectorProperties.type === 'ellipse') {
        if (
          !keys.ShiftLeft &&
          !keys.ShiftRight &&
          vectorGui.selectedPoint.xKey !== 'px1'
        ) {
          //if shift key is not being held and selected point is not the center, reset forceCircle
          state.vector.properties.forceCircle = false
          currentVector.vectorProperties.forceCircle = false
        }
        if (vectorGui.selectedPoint.xKey === 'px1') {
          //if center point is selected, use current vector's forceCircle value
          state.vector.properties.forceCircle =
            currentVector.vectorProperties.forceCircle
        }
        updateEllipseVectorProperties(currentVector, normalizedX, normalizedY)
      } else if (currentVector.vectorProperties.type === 'polygon') {
        if (
          !keys.ShiftLeft &&
          !keys.ShiftRight &&
          vectorGui.selectedPoint.xKey !== 'px0'
        ) {
          state.vector.properties.forceSquare = false
          currentVector.vectorProperties.forceSquare = false
        }
        if (
          state.tool.current.options.uniform?.active &&
          vectorGui.selectedPoint.xKey !== 'px0'
        ) {
          state.vector.savedProperties[state.vector.currentIndex].uniformCtx =
            getUniformCtx(vectorGui.selectedPoint.xKey)
        }
        updatePolygonVectorProperties(currentVector, normalizedX, normalizedY)
      } else {
        state.vector.properties[vectorGui.collidedPoint.xKey] = normalizedX
        state.vector.properties[vectorGui.collidedPoint.yKey] = normalizedY
        //save linked vectors too
        updateVectorProperties(
          currentVector,
          normalizedX,
          normalizedY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey,
        )
        if (state.tool.current.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            normalizedX,
            normalizedY,
          )
        }
        if (state.tool.current.options.link?.active) {
          updateLinkedVectors(currentVector, true)
        }
      }
      state.timeline.activeIndexes = createActiveIndexesForRender(
        currentVector,
        state.vector.savedProperties,
      )
      renderCanvas(
        currentVector.layer,
        true,
        state.timeline.activeIndexes,
        true,
      )
      break
    case 'pointermove':
      if (vectorGui.selectedPoint.xKey) {
        if (currentVector.vectorProperties.type === 'ellipse') {
          updateEllipseVectorProperties(currentVector, normalizedX, normalizedY)
        } else if (currentVector.vectorProperties.type === 'polygon') {
          updatePolygonVectorProperties(currentVector, normalizedX, normalizedY)
        } else {
          state.vector.properties[vectorGui.selectedPoint.xKey] = normalizedX
          state.vector.properties[vectorGui.selectedPoint.yKey] = normalizedY
          updateVectorProperties(
            currentVector,
            normalizedX,
            normalizedY,
            vectorGui.selectedPoint.xKey,
            vectorGui.selectedPoint.yKey,
          )
          if (state.tool.current.options.hold?.active) {
            updateLockedCurrentVectorControlHandle(
              currentVector,
              normalizedX,
              normalizedY,
            )
          }
          if (state.tool.current.options.link?.active) {
            updateLinkedVectors(currentVector)
          }
        }
        renderCanvas(currentVector.layer, true, state.timeline.activeIndexes)
      }
      break
    case 'pointerup':
      if (vectorGui.selectedPoint.xKey) {
        if (currentVector.vectorProperties.type === 'ellipse') {
          updateEllipseVectorProperties(currentVector, normalizedX, normalizedY)
        } else if (currentVector.vectorProperties.type === 'polygon') {
          updatePolygonVectorProperties(currentVector, normalizedX, normalizedY)
        } else {
          state.vector.properties[vectorGui.selectedPoint.xKey] = normalizedX
          state.vector.properties[vectorGui.selectedPoint.yKey] = normalizedY
          updateVectorProperties(
            currentVector,
            normalizedX,
            normalizedY,
            vectorGui.selectedPoint.xKey,
            vectorGui.selectedPoint.yKey,
          )
          if (state.tool.current.options.hold?.active) {
            updateLockedCurrentVectorControlHandle(
              currentVector,
              normalizedX,
              normalizedY,
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
            ['px1', 'px2'].includes(vectorGui.selectedPoint.xKey) &&
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
    ((vectorGui.collidedPoint.xKey === 'rotationx' &&
      vectorGui.selectedPoint.xKey === null) ||
      vectorGui.selectedPoint.xKey === 'rotationx') &&
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
