import { TRANSLATE, ROTATE } from '../utils/constants.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { modifyVectorAction } from '../Actions/modifyTimeline/modifyTimeline.js'
import { vectorGui, createActiveIndexesForRender } from '../GUI/vector.js'
import { getAngle } from '../utils/trig.js'
import { renderCanvas } from '../Canvas/render.js'
import { rotateVectors, translateVectors } from '../utils/vectorHelpers.js'
import { transformVectorContent } from '../utils/transformHelpers.js'

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
    state.vector.all[state.vector.selectedIndices.values().next().value]
  switch (canvas.pointerEvent) {
    case 'pointerdown': {
      //Incrementing click counter stops vector adjustment from triggering when cursor hovers over a vector control point while transforming. TODO: (Low Priority) Implement a clearer way to handle this specific to transform.
      state.tool.clickCounter += 1
      state.tool.grabStartX = state.cursor.x
      state.tool.grabStartY = state.cursor.y
      state.vector.grabStartShapeCenterX = state.vector.shapeCenterX
      state.vector.grabStartShapeCenterY = state.vector.shapeCenterY
      //reset current vector properties (this also resets the state.vector.currentIndex if there is one)
      vectorGui.reset()
      //Set state.vector.savedProperties for all selected vectors
      state.vector.savedProperties = {}
      state.vector.selectedIndices.forEach((index) => {
        const vector = state.vector.all[index]
        const vectorProperties = vector.vectorProperties
        state.vector.savedProperties[index] = {
          ...vectorProperties,
          modes: { ...vector.modes },
        }
      })
      //Set activeIndexes for all selected vectors
      state.timeline.activeIndexes = createActiveIndexesForRender(
        currentVector,
        state.vector.savedProperties,
      )
      if (state.vector.transformMode === ROTATE) {
        //Rotation
        state.vector.grabStartAngle = getAngle(
          state.vector.shapeCenterX - state.tool.grabStartX,
          state.vector.shapeCenterY - state.tool.grabStartY,
        )
      }
      renderCanvas(
        currentVector.layer,
        true,
        state.timeline.activeIndexes,
        true,
      )
      break
    }
    case 'pointermove': {
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Based on the action being taken, update the vector properties for all selected vectors.
      if (state.vector.transformMode === ROTATE) {
        //Rotation
        rotateVectors(
          currentVector.layer,
          state.vector.savedProperties,
          state.vector.all,
          state.cursor.x,
          state.cursor.y,
          state.tool.grabStartX,
          state.tool.grabStartY,
          state.vector.shapeCenterX,
          state.vector.shapeCenterY,
        )
      } else if (state.vector.transformMode === TRANSLATE) {
        //Translation
        const xDiff = state.cursor.x - state.tool.grabStartX
        const yDiff = state.cursor.y - state.tool.grabStartY
        translateVectors(
          currentVector.layer,
          state.vector.savedProperties,
          state.vector.all,
          xDiff,
          yDiff,
        )
        //Update shape center
        state.vector.shapeCenterX = state.vector.grabStartShapeCenterX + xDiff
        state.vector.shapeCenterY = state.vector.grabStartShapeCenterY + yDiff
      }
      renderCanvas(currentVector.layer, true, state.timeline.activeIndexes)
      break
    }
    case 'pointerup': {
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Based on the action being taken, update the vector properties for all selected vectors.
      if (state.vector.transformMode === ROTATE) {
        //Rotation
        rotateVectors(
          currentVector.layer,
          state.vector.savedProperties,
          state.vector.all,
          state.cursor.x,
          state.cursor.y,
          state.tool.grabStartX,
          state.tool.grabStartY,
          state.vector.shapeCenterX,
          state.vector.shapeCenterY,
        )
        vectorGui.mother.currentRotation = vectorGui.mother.newRotation
        state.vector.grabStartAngle = null
      } else if (state.vector.transformMode === TRANSLATE) {
        //Translation
        const xDiff = state.cursor.x - state.tool.grabStartX
        const yDiff = state.cursor.y - state.tool.grabStartY
        translateVectors(
          currentVector.layer,
          state.vector.savedProperties,
          state.vector.all,
          xDiff,
          yDiff,
        )
        //Update shape center
        state.vector.shapeCenterX = state.vector.grabStartShapeCenterX + xDiff
        state.vector.shapeCenterY = state.vector.grabStartShapeCenterY + yDiff
      }
      state.vector.grabStartShapeCenterX = null
      state.vector.grabStartShapeCenterY = null
      state.tool.clickCounter = 0
      renderCanvas(currentVector.layer, true, state.timeline.activeIndexes)
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
 * Transform selected vectors by scaling
 * TODO: (High Priority) Implement locking ratio to maintain aspect ratio while scaling.
 */
export function scaleVectorSteps() {
  let currentVector =
    state.vector.all[state.vector.selectedIndices.values().next().value]
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedPoint.xKey,
        yKey: vectorGui.collidedPoint.yKey,
      }
      state.selection.previousBoundaryBox = { ...state.selection.boundaryBox }
      //reset current vector properties (this also resets the state.vector.currentIndex if there is one)
      vectorGui.reset()
      //Set state.vector.savedProperties for all selected vectors
      state.vector.savedProperties = {}
      state.vector.selectedIndices.forEach((index) => {
        const vector = state.vector.all[index]
        const vectorProperties = vector.vectorProperties
        state.vector.savedProperties[index] = {
          ...vectorProperties,
          modes: { ...vector.modes },
        }
      })
      //Set activeIndexes for all selected vectors
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
    case 'pointermove': {
      transformBoundaries()
      let isMirroredHorizontally = false
      let isMirroredVertically = false
      if (vectorGui.selectedPoint.xKey !== 'px9') {
        //Don't check for mirroring when moving whole selection
        if (
          state.selection.boundaryBox.xMax ===
            state.selection.previousBoundaryBox.xMin ||
          state.selection.boundaryBox.xMin ===
            state.selection.previousBoundaryBox.xMax
        ) {
          isMirroredHorizontally = !isMirroredHorizontally
        }
        if (
          state.selection.boundaryBox.yMax ===
            state.selection.previousBoundaryBox.yMin ||
          state.selection.boundaryBox.yMin ===
            state.selection.previousBoundaryBox.yMax
        ) {
          isMirroredVertically = !isMirroredVertically
        }
      }
      transformVectorContent(
        state.vector.all,
        state.vector.savedProperties,
        state.selection.previousBoundaryBox,
        state.selection.boundaryBox,
        isMirroredHorizontally,
        isMirroredVertically,
      )
      renderCanvas(currentVector.layer, true, state.timeline.activeIndexes)
      break
    }
    case 'pointerup':
      state.selection.normalize()
      state.selection.setBoundaryBox(state.selection.properties)
      renderCanvas(currentVector.layer, true, state.timeline.activeIndexes)
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
    case 'pointerdown':
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedPoint.xKey,
        yKey: vectorGui.collidedPoint.yKey,
      }
      state.vector.shapeCenterX = state.cursor.x
      state.vector.shapeCenterY = state.cursor.y
      break
    case 'pointermove':
      state.vector.shapeCenterX = state.cursor.x
      state.vector.shapeCenterY = state.cursor.y
      break
    case 'pointerup':
      state.vector.shapeCenterX = state.cursor.x
      state.vector.shapeCenterY = state.cursor.y
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
    case 'px1':
      state.selection.properties.px1 = state.cursor.x
      state.selection.properties.py1 = state.cursor.y
      break
    case 'px2':
      state.selection.properties.py1 = state.cursor.y
      break
    case 'px3':
      state.selection.properties.px2 = state.cursor.x
      state.selection.properties.py1 = state.cursor.y
      break
    case 'px4':
      state.selection.properties.px2 = state.cursor.x
      break
    case 'px5':
      state.selection.properties.px2 = state.cursor.x
      state.selection.properties.py2 = state.cursor.y
      break
    case 'px6':
      state.selection.properties.py2 = state.cursor.y
      break
    case 'px7':
      state.selection.properties.px1 = state.cursor.x
      state.selection.properties.py2 = state.cursor.y
      break
    case 'px8':
      state.selection.properties.px1 = state.cursor.x
      break
    case 'px9': {
      //move selected contents
      const deltaX = state.cursor.x - state.cursor.prevX
      const deltaY = state.cursor.y - state.cursor.prevY
      state.selection.properties.px1 += deltaX
      state.selection.properties.py1 += deltaY
      state.selection.properties.px2 += deltaX
      state.selection.properties.py2 += deltaY
      break
    }
    default:
    //do nothing
  }
  state.selection.setBoundaryBox(state.selection.properties)
}
