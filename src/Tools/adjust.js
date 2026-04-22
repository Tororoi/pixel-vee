import { SCALE } from '../utils/constants.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { keys } from '../Shortcuts/keys.js'
import { modifyVectorAction } from '../Actions/modifyTimeline/modifyTimeline.js'
import { vectorGui } from '../GUI/vector.js'
import {
  updateLinkedVectors,
  updateLockedCurrentVectorControlHandle,
  createActiveIndexesForRender,
  snapEndpointToCollidedVector,
  initLineLinkedCurvesInfo,
  updateLineLinkedCurveHandles,
} from '../GUI/vectorLinkedUpdates.js'
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
 * Used for line, quadCurve, and cubicCurve tools
 * Used automatically by vector tools after curve is completed.
 * TODO: (Low Priority) create distinct tool for adjusting that won't create a new curve when clicking.
 * Ideally a user should be able to click on a curve and render it's vector UI that way.
 * TODO: (Medium Priority) for linking fill vector, fill would be limited by active linked vectors as borders, position unchanged
 * How should fill vector be linked, since it won't be via positioning?
 * BUG: cut selection not rendered properly in timeline
 */
export function adjustVectorSteps() {
  let currentVector = globalState.vector.all[globalState.vector.currentIndex]
  const normalizedX = getCropNormalizedCursorX()
  const normalizedY = getCropNormalizedCursorY()
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      //TODO: (Medium Priority) If holding shift, add or remove vector from selected vectors set and return
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedPoint.xKey,
        yKey: vectorGui.collidedPoint.yKey,
      }
      globalState.vector.savedProperties[globalState.vector.currentIndex] = {
        ...currentVector.vectorProperties,
        modes: { ...currentVector.modes },
      }
      if (currentVector.vectorProperties.tool === 'ellipse') {
        if (
          !keys.ShiftLeft &&
          !keys.ShiftRight &&
          vectorGui.selectedPoint.xKey !== 'px1'
        ) {
          //if shift key is not being held and selected point is not the center, reset forceCircle
          globalState.vector.properties.forceCircle = false
          currentVector.vectorProperties.forceCircle = false
        }
        if (vectorGui.selectedPoint.xKey === 'px1') {
          //if center point is selected, use current vector's forceCircle value
          globalState.vector.properties.forceCircle =
            currentVector.vectorProperties.forceCircle
        }
        updateEllipseVectorProperties(currentVector, normalizedX, normalizedY)
      } else if (currentVector.vectorProperties.tool === 'polygon') {
        if (
          !keys.ShiftLeft &&
          !keys.ShiftRight &&
          vectorGui.selectedPoint.xKey !== 'px0'
        ) {
          globalState.vector.properties.forceSquare = false
          currentVector.vectorProperties.forceSquare = false
        }
        if (
          globalState.tool.current.options.uniform?.active &&
          vectorGui.selectedPoint.xKey !== 'px0'
        ) {
          globalState.vector.savedProperties[
            globalState.vector.currentIndex
          ].uniformCtx = getUniformCtx(vectorGui.selectedPoint.xKey)
        }
        updatePolygonVectorProperties(currentVector, normalizedX, normalizedY)
      } else {
        globalState.vector.properties[vectorGui.collidedPoint.xKey] =
          normalizedX
        globalState.vector.properties[vectorGui.collidedPoint.yKey] =
          normalizedY
        //save linked vectors too
        updateVectorProperties(
          currentVector,
          normalizedX,
          normalizedY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey,
        )
        if (globalState.tool.current.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            normalizedX,
            normalizedY,
          )
        }
        if (globalState.tool.current.options.link?.active) {
          updateLinkedVectors(currentVector, true)
        }
        if (currentVector.modes?.line) {
          initLineLinkedCurvesInfo(currentVector)
          updateLineLinkedCurveHandles(currentVector)
        }
      }
      globalState.timeline.activeIndexes = createActiveIndexesForRender(
        currentVector,
        globalState.vector.savedProperties,
      )
      renderCanvas(
        currentVector.layer,
        true,
        globalState.timeline.activeIndexes,
        true,
      )
      break
    case 'pointermove':
      if (vectorGui.selectedPoint.xKey) {
        if (currentVector.vectorProperties.tool === 'ellipse') {
          updateEllipseVectorProperties(currentVector, normalizedX, normalizedY)
        } else if (currentVector.vectorProperties.tool === 'polygon') {
          updatePolygonVectorProperties(currentVector, normalizedX, normalizedY)
        } else {
          globalState.vector.properties[vectorGui.selectedPoint.xKey] =
            normalizedX
          globalState.vector.properties[vectorGui.selectedPoint.yKey] =
            normalizedY
          updateVectorProperties(
            currentVector,
            normalizedX,
            normalizedY,
            vectorGui.selectedPoint.xKey,
            vectorGui.selectedPoint.yKey,
          )
          if (globalState.tool.current.options.hold?.active) {
            updateLockedCurrentVectorControlHandle(
              currentVector,
              normalizedX,
              normalizedY,
            )
          }
          if (globalState.tool.current.options.link?.active) {
            updateLinkedVectors(currentVector)
          }
          if (currentVector.modes?.line) {
            updateLineLinkedCurveHandles(currentVector)
          }
        }
        renderCanvas(
          currentVector.layer,
          true,
          globalState.timeline.activeIndexes,
        )
      }
      break
    case 'pointerup':
      if (vectorGui.selectedPoint.xKey) {
        if (currentVector.vectorProperties.tool === 'ellipse') {
          updateEllipseVectorProperties(currentVector, normalizedX, normalizedY)
        } else if (currentVector.vectorProperties.tool === 'polygon') {
          updatePolygonVectorProperties(currentVector, normalizedX, normalizedY)
        } else {
          globalState.vector.properties[vectorGui.selectedPoint.xKey] =
            normalizedX
          globalState.vector.properties[vectorGui.selectedPoint.yKey] =
            normalizedY
          updateVectorProperties(
            currentVector,
            normalizedX,
            normalizedY,
            vectorGui.selectedPoint.xKey,
            vectorGui.selectedPoint.yKey,
          )
          if (globalState.tool.current.options.hold?.active) {
            updateLockedCurrentVectorControlHandle(
              currentVector,
              normalizedX,
              normalizedY,
            )
          }
          if (globalState.tool.current.options.link?.active) {
            updateLinkedVectors(currentVector)
          }
          if (currentVector.modes?.line) {
            updateLineLinkedCurveHandles(currentVector)
          }
          //Handle snapping p1 or p2 to other control points. Only snap when there are no linked vectors to selected vector.
          if (
            (globalState.tool.current.options.align?.active ||
              globalState.tool.current.options.equal?.active ||
              globalState.tool.current.options.link?.active) &&
            Object.keys(globalState.vector.savedProperties).length === 1 &&
            ['px1', 'px2'].includes(vectorGui.selectedPoint.xKey) &&
            globalState.vector.collidedIndex !== null &&
            globalState.vector.currentIndex !== null
          ) {
            snapEndpointToCollidedVector(currentVector)
          }
        }
        renderCanvas(
          currentVector.layer,
          true,
          globalState.timeline.activeIndexes,
        )
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
 * Dispatches to the appropriate vector interaction step function based on current globalState.
 * @returns {boolean} - True if an action was taken, false if not
 */
export function rerouteVectorStepsAction() {
  //for selecting another vector via the canvas, collisionPresent is false since it is currently based on collision with selected vector.
  if (
    globalState.vector.collidedIndex !== null &&
    !vectorGui.selectedCollisionPresent &&
    globalState.tool.clickCounter === 0
  ) {
    let collidedVector =
      globalState.vector.all[globalState.vector.collidedIndex]
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
    globalState.tool.clickCounter === 0
  ) {
    moveVectorRotationPointSteps()
    return true
  }
  if (
    globalState.vector.transformMode === SCALE &&
    globalState.vector.selectedIndices.size > 0
  ) {
    scaleVectorSteps()
    return true
  }
  if (
    vectorGui.selectedCollisionPresent &&
    globalState.tool.clickCounter === 0 &&
    globalState.vector.currentIndex !== null
  ) {
    adjustVectorSteps()
    return true
  }
  //If there are selected vectors, call transformVectorSteps() instead of this function
  if (globalState.vector.selectedIndices.size > 0) {
    transformVectorSteps()
    return true
  }
  return false
}
