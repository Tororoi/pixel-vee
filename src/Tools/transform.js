import { TRANSLATE, ROTATE } from '../utils/constants.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { modifyVectorAction } from '../Actions/modifyTimeline/modifyTimeline.js'
import { vectorGui } from '../GUI/vector.js'
import { createActiveIndexesForRender } from '../GUI/vectorLinkedUpdates.js'
import { getAngle } from '../utils/trig.js'
import { renderCanvas } from '../Canvas/render.js'
import {
  rotateVectors,
  translateVectors,
} from '../utils/vectorTransformHelpers.js'
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
    globalState.vector.all[
      globalState.vector.selectedIndices.values().next().value
    ]
  switch (canvas.pointerEvent) {
    case 'pointerdown': {
      //Incrementing click counter stops vector adjustment from triggering when cursor hovers over a vector control point while transforming. TODO: (Low Priority) Implement a clearer way to handle this specific to transform.
      globalState.tool.clickCounter += 1
      globalState.tool.grabStartX = globalState.cursor.x
      globalState.tool.grabStartY = globalState.cursor.y
      globalState.vector.grabStartShapeCenterX = globalState.vector.shapeCenterX
      globalState.vector.grabStartShapeCenterY = globalState.vector.shapeCenterY
      //reset current vector properties (this also resets the globalState.vector.currentIndex if there is one)
      vectorGui.reset()
      //Set globalState.vector.savedProperties for all selected vectors
      globalState.vector.savedProperties = {}
      globalState.vector.selectedIndices.forEach((index) => {
        const vector = globalState.vector.all[index]
        const vectorProperties = vector.vectorProperties
        globalState.vector.savedProperties[index] = {
          ...vectorProperties,
          modes: { ...vector.modes },
        }
      })
      //Set activeIndexes for all selected vectors
      globalState.timeline.activeIndexes = createActiveIndexesForRender(
        currentVector,
        globalState.vector.savedProperties,
      )
      if (globalState.vector.transformMode === ROTATE) {
        //Rotation
        // grabStartX/Y are in canvas-pixel space (includes cropOffset); shapeCenterX/Y is in
        // layer-absolute space (no cropOffset). Normalize cursor to layer-absolute before comparing.
        globalState.vector.grabStartAngle = getAngle(
          globalState.vector.shapeCenterX -
            (globalState.tool.grabStartX - globalState.canvas.cropOffsetX),
          globalState.vector.shapeCenterY -
            (globalState.tool.grabStartY - globalState.canvas.cropOffsetY),
        )
      }
      renderCanvas(
        currentVector.layer,
        true,
        globalState.timeline.activeIndexes,
        true,
      )
      break
    }
    case 'pointermove': {
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Based on the action being taken, update the vector properties for all selected vectors.
      if (globalState.vector.transformMode === ROTATE) {
        //Rotation
        // Normalize canvas-pixel cursor positions to layer-absolute space to match shapeCenterX/Y.
        rotateVectors(
          currentVector.layer,
          globalState.vector.savedProperties,
          globalState.vector.all,
          globalState.cursor.x - globalState.canvas.cropOffsetX,
          globalState.cursor.y - globalState.canvas.cropOffsetY,
          globalState.tool.grabStartX - globalState.canvas.cropOffsetX,
          globalState.tool.grabStartY - globalState.canvas.cropOffsetY,
          globalState.vector.shapeCenterX,
          globalState.vector.shapeCenterY,
        )
      } else if (globalState.vector.transformMode === TRANSLATE) {
        //Translation
        const xDiff = globalState.cursor.x - globalState.tool.grabStartX
        const yDiff = globalState.cursor.y - globalState.tool.grabStartY
        translateVectors(
          currentVector.layer,
          globalState.vector.savedProperties,
          globalState.vector.all,
          xDiff,
          yDiff,
        )
        //Update shape center
        globalState.vector.shapeCenterX =
          globalState.vector.grabStartShapeCenterX + xDiff
        globalState.vector.shapeCenterY =
          globalState.vector.grabStartShapeCenterY + yDiff
      }
      renderCanvas(
        currentVector.layer,
        true,
        globalState.timeline.activeIndexes,
      )
      break
    }
    case 'pointerup': {
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Based on the action being taken, update the vector properties for all selected vectors.
      if (globalState.vector.transformMode === ROTATE) {
        //Rotation
        rotateVectors(
          currentVector.layer,
          globalState.vector.savedProperties,
          globalState.vector.all,
          globalState.cursor.x - globalState.canvas.cropOffsetX,
          globalState.cursor.y - globalState.canvas.cropOffsetY,
          globalState.tool.grabStartX - globalState.canvas.cropOffsetX,
          globalState.tool.grabStartY - globalState.canvas.cropOffsetY,
          globalState.vector.shapeCenterX,
          globalState.vector.shapeCenterY,
        )
        vectorGui.mother.currentRotation = vectorGui.mother.newRotation
        globalState.vector.grabStartAngle = null
      } else if (globalState.vector.transformMode === TRANSLATE) {
        //Translation
        const xDiff = globalState.cursor.x - globalState.tool.grabStartX
        const yDiff = globalState.cursor.y - globalState.tool.grabStartY
        translateVectors(
          currentVector.layer,
          globalState.vector.savedProperties,
          globalState.vector.all,
          xDiff,
          yDiff,
        )
        //Update shape center
        globalState.vector.shapeCenterX =
          globalState.vector.grabStartShapeCenterX + xDiff
        globalState.vector.shapeCenterY =
          globalState.vector.grabStartShapeCenterY + yDiff
      }
      globalState.vector.grabStartShapeCenterX = null
      globalState.vector.grabStartShapeCenterY = null
      globalState.tool.clickCounter = 0
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
    globalState.vector.all[
      globalState.vector.selectedIndices.values().next().value
    ]
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedPoint.xKey,
        yKey: vectorGui.collidedPoint.yKey,
      }
      globalState.selection.previousBoundaryBox = {
        ...globalState.selection.boundaryBox,
      }
      //reset current vector properties (this also resets the globalState.vector.currentIndex if there is one)
      vectorGui.reset()
      //Set globalState.vector.savedProperties for all selected vectors
      globalState.vector.savedProperties = {}
      globalState.vector.selectedIndices.forEach((index) => {
        const vector = globalState.vector.all[index]
        const vectorProperties = vector.vectorProperties
        globalState.vector.savedProperties[index] = {
          ...vectorProperties,
          modes: { ...vector.modes },
        }
      })
      //Set activeIndexes for all selected vectors
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
    case 'pointermove': {
      transformBoundaries()
      let isMirroredHorizontally = false
      let isMirroredVertically = false
      if (vectorGui.selectedPoint.xKey !== 'px9') {
        //Don't check for mirroring when moving whole selection
        if (
          globalState.selection.boundaryBox.xMax ===
            globalState.selection.previousBoundaryBox.xMin ||
          globalState.selection.boundaryBox.xMin ===
            globalState.selection.previousBoundaryBox.xMax
        ) {
          isMirroredHorizontally = !isMirroredHorizontally
        }
        if (
          globalState.selection.boundaryBox.yMax ===
            globalState.selection.previousBoundaryBox.yMin ||
          globalState.selection.boundaryBox.yMin ===
            globalState.selection.previousBoundaryBox.yMax
        ) {
          isMirroredVertically = !isMirroredVertically
        }
      }
      // boundaryBoxes are in canvas-pixel space; transformVectorContent uses stored+layer.x
      // (layer-absolute). Subtract cropOffset so both sides are in the same space.
      const cox = globalState.canvas.cropOffsetX
      const coy = globalState.canvas.cropOffsetY
      const prevBB = {
        xMin: globalState.selection.previousBoundaryBox.xMin - cox,
        yMin: globalState.selection.previousBoundaryBox.yMin - coy,
        xMax: globalState.selection.previousBoundaryBox.xMax - cox,
        yMax: globalState.selection.previousBoundaryBox.yMax - coy,
      }
      const newBB = {
        xMin: globalState.selection.boundaryBox.xMin - cox,
        yMin: globalState.selection.boundaryBox.yMin - coy,
        xMax: globalState.selection.boundaryBox.xMax - cox,
        yMax: globalState.selection.boundaryBox.yMax - coy,
      }
      transformVectorContent(
        globalState.vector.all,
        globalState.vector.savedProperties,
        prevBB,
        newBB,
        isMirroredHorizontally,
        isMirroredVertically,
      )
      renderCanvas(
        currentVector.layer,
        true,
        globalState.timeline.activeIndexes,
      )
      break
    }
    case 'pointerup':
      globalState.selection.normalize()
      globalState.selection.setBoundaryBox(globalState.selection.properties)
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
      // shapeCenterX/Y is kept in layer-absolute space; subtract cropOffset to normalize cursor.
      globalState.vector.shapeCenterX =
        globalState.cursor.x - globalState.canvas.cropOffsetX
      globalState.vector.shapeCenterY =
        globalState.cursor.y - globalState.canvas.cropOffsetY
      break
    case 'pointermove':
      globalState.vector.shapeCenterX =
        globalState.cursor.x - globalState.canvas.cropOffsetX
      globalState.vector.shapeCenterY =
        globalState.cursor.y - globalState.canvas.cropOffsetY
      break
    case 'pointerup':
      globalState.vector.shapeCenterX =
        globalState.cursor.x - globalState.canvas.cropOffsetX
      globalState.vector.shapeCenterY =
        globalState.cursor.y - globalState.canvas.cropOffsetY
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
      globalState.selection.properties.px1 = globalState.cursor.x
      globalState.selection.properties.py1 = globalState.cursor.y
      break
    case 'px2':
      globalState.selection.properties.py1 = globalState.cursor.y
      break
    case 'px3':
      globalState.selection.properties.px2 = globalState.cursor.x
      globalState.selection.properties.py1 = globalState.cursor.y
      break
    case 'px4':
      globalState.selection.properties.px2 = globalState.cursor.x
      break
    case 'px5':
      globalState.selection.properties.px2 = globalState.cursor.x
      globalState.selection.properties.py2 = globalState.cursor.y
      break
    case 'px6':
      globalState.selection.properties.py2 = globalState.cursor.y
      break
    case 'px7':
      globalState.selection.properties.px1 = globalState.cursor.x
      globalState.selection.properties.py2 = globalState.cursor.y
      break
    case 'px8':
      globalState.selection.properties.px1 = globalState.cursor.x
      break
    case 'px9': {
      //move selected contents
      const deltaX = globalState.cursor.x - globalState.cursor.prevX
      const deltaY = globalState.cursor.y - globalState.cursor.prevY
      globalState.selection.properties.px1 += deltaX
      globalState.selection.properties.py1 += deltaY
      globalState.selection.properties.px2 += deltaX
      globalState.selection.properties.py2 += deltaY
      break
    }
    default:
    //do nothing
  }
  globalState.selection.setBoundaryBox(globalState.selection.properties)
}
