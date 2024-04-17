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
} from "../utils/vectorHelpers.js"

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
    state.vectors[state.selectedVectorIndicesSet.values().next().value] ||
    state.vectors[state.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown": {
      state.grabStartX = state.cursorX
      state.grabStartY = state.cursorY
      //reset current vector properties
      vectorGui.reset()
      //Set state.vectorsSavedProperties for all selected vectors
      state.vectorsSavedProperties = {}
      const vectorPoints = []
      const vectorIndicesSet = new Set(state.selectedVectorIndicesSet)
      if (vectorIndicesSet.size === 0) {
        vectorIndicesSet.add(state.currentVectorIndex)
      }
      vectorIndicesSet.forEach((index) => {
        const vectorProperties = state.vectors[index].vectorProperties
        state.vectorsSavedProperties[index] = {
          ...vectorProperties,
        }
        //Get points for center point calculation. TODO: (Medium Priority) For better consistency, set upon selection and translation instead of transform, which will be slightly off after rotation
        for (let i = 1; i <= 4; i++) {
          if ("px" + i in vectorProperties && "py" + i in vectorProperties) {
            const xKey = `px${i}`
            const yKey = `py${i}`
            vectorPoints.push([vectorProperties[xKey], vectorProperties[yKey]])
          }
        }
      })
      const [centerX, centerY] = findCentroid(vectorPoints)
      state.shapeCenterX = centerX
      state.shapeCenterY = centerY
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Translation

      //Set activeIndexes for all selected vectors
      state.activeIndexes = createActiveIndexesForRender(
        currentVector,
        state.vectorsSavedProperties
      )
      renderCanvas(currentVector.layer, true, state.activeIndexes, true)
      break
    }
    case "pointermove": {
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Based on the action being taken, update the vector properties for all selected vectors.
      //Translation
      // translateVectors(currentVector.layer, state.vectorsSavedProperties, state.vectors, state.cursorX, state.cursorY, state.grabStartX, state.grabStartY)
      //Rotation
      if (keys.ShiftRight || keys.ShiftLeft) {
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
      } else {
        translateVectors(
          currentVector.layer,
          state.vectorsSavedProperties,
          state.vectors,
          state.cursorX,
          state.cursorY,
          state.grabStartX,
          state.grabStartY
        )
      }
      if (currentVector.index === state.currentVectorIndex) {
        vectorGui.setVectorProperties(currentVector)
      }
      renderCanvas(currentVector.layer, true, state.activeIndexes)
      break
    }
    case "pointerup": {
      //Determine action being taken somehow (rotation, scaling, translation), default is translation. Special UI will be implemented for scaling and rotation.
      //Based on the action being taken, update the vector properties for all selected vectors.
      //Translation
      // translateVectors(currentVector.layer, state.vectorsSavedProperties, state.vectors, state.cursorX, state.cursorY, state.grabStartX, state.grabStartY)
      //Rotation
      if (keys.ShiftRight || keys.ShiftLeft) {
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
      } else {
        translateVectors(
          currentVector.layer,
          state.vectorsSavedProperties,
          state.vectors,
          state.cursorX,
          state.cursorY,
          state.grabStartX,
          state.grabStartY
        )
      }
      if (currentVector.index === state.currentVectorIndex) {
        vectorGui.setVectorProperties(currentVector)
      }
      renderCanvas(currentVector.layer, true, state.activeIndexes)
      modifyVectorAction(currentVector)
      break
    }
    default:
    //do nothing
  }
}
