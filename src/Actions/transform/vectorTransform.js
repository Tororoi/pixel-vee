import { state } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { vectorGui } from '../../GUI/vector.js'
import { renderCanvas } from '../../Canvas/render.js'
import {
  findVectorShapeCentroid,
  updateVectorProperties,
} from '../../utils/vectorHelpers.js'
import { modifyVectorAction } from '../modifyTimeline/modifyTimeline.js'

//=============================================//
//======== * * * Vector Transform * * * =======//
//=============================================//

/**
 * Flip selected vectors horizontally around point at center of min and max bounds of selected vectors
 * @param {boolean} flipHorizontally - Whether to flip horizontally
 */
export function actionFlipVectors(flipHorizontally) {
  //get bounding box of all vectors
  let [xMin, xMax, yMin, yMax] = [null, null, null, null]
  const vectorIndicesSet = new Set(state.vector.selectedIndices)
  if (vectorIndicesSet.size === 0) {
    vectorIndicesSet.add(state.vector.currentIndex)
  }
  for (const vectorIndex of vectorIndicesSet) {
    const vector = state.vector.all[vectorIndex]
    const vectorXPoints = []
    const vectorYPoints = []

    for (let i = 1; i <= 4; i++) {
      if (
        'px' + i in vector.vectorProperties &&
        'py' + i in vector.vectorProperties
      ) {
        vectorXPoints.push(vector.vectorProperties[`px${i}`])
        vectorYPoints.push(vector.vectorProperties[`py${i}`])
      }
    }

    xMin = Math.min(xMin ?? Infinity, ...vectorXPoints)
    xMax = Math.max(xMax ?? -Infinity, ...vectorXPoints)
    yMin = Math.min(yMin ?? Infinity, ...vectorYPoints)
    yMax = Math.max(yMax ?? -Infinity, ...vectorYPoints)
  }
  //get center point of selected vectors
  const centerX = (xMin + xMax) / 2
  const centerY = (yMin + yMax) / 2
  let referenceVector
  //flip vectors horizontally around center point
  for (const vectorIndex of vectorIndicesSet) {
    const vector = state.vector.all[vectorIndex]
    referenceVector = vector //TODO: (Low Priority) Determine a better method for setting a reference vector or remove the need for one.
    state.vector.savedProperties[vectorIndex] = {
      ...vector.vectorProperties,
      modes: { ...vector.modes },
    }
    for (let i = 1; i <= 4; i++) {
      if (
        'px' + i in vector.vectorProperties &&
        'py' + i in vector.vectorProperties
      ) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        let newX = vector.vectorProperties[xKey]
        let newY = vector.vectorProperties[yKey]
        if (flipHorizontally) {
          newX = Math.round(2 * centerX) - vector.vectorProperties[xKey]
        } else {
          newY = Math.round(2 * centerY) - vector.vectorProperties[yKey]
        }
        updateVectorProperties(vector, newX, newY, xKey, yKey)
      }
    }
    if (vectorIndex === state.vector.currentIndex) {
      vectorGui.setVectorProperties(vector)
    }
  }
  renderCanvas(canvas.currentLayer, true)
  //Get any selected vector to use for modifyVectorAction
  modifyVectorAction(referenceVector)
  state.clearRedoStack()
  vectorGui.render()
}

/**
 * Freely rotate selected vectors at any angle around origin point (default center of vectors bounding box)
 * @param {number} degrees - The number of degrees to rotate the vectors
 */
export function actionRotateVectors(degrees) {
  //get bounding box of all vectors
  const vectorIndicesSet = new Set(state.vector.selectedIndices)
  if (vectorIndicesSet.size === 0) {
    vectorIndicesSet.add(state.vector.currentIndex)
  }
  //get center point of selected vectors
  if (state.vector.shapeCenterX === null) {
    //Update shape center
    const [centerX, centerY] = findVectorShapeCentroid(
      vectorIndicesSet,
      state.vector.all,
    )
    state.vector.shapeCenterX = centerX + canvas.currentLayer.x
    state.vector.shapeCenterY = centerY + canvas.currentLayer.y
  }
  const rotationOriginX = state.vector.shapeCenterX
  const rotationOriginY = state.vector.shapeCenterY
  let referenceVector
  for (const vectorIndex of vectorIndicesSet) {
    const vector = state.vector.all[vectorIndex]
    referenceVector = vector //TODO: (Low Priority) Determine a better method for setting a reference vector or remove the need for one.
    state.vector.savedProperties[vectorIndex] = {
      ...vector.vectorProperties,
      modes: { ...vector.modes },
    }
    for (let i = 1; i <= 4; i++) {
      if (
        'px' + i in vector.vectorProperties &&
        'py' + i in vector.vectorProperties
      ) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        let newX = vector.vectorProperties[xKey]
        let newY = vector.vectorProperties[yKey]
        const radians = (degrees * Math.PI) / 180
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)
        newX = Math.floor(
          cos * (vector.vectorProperties[xKey] - rotationOriginX) -
            sin * (vector.vectorProperties[yKey] - rotationOriginY) +
            rotationOriginX,
        )
        newY = Math.floor(
          sin * (vector.vectorProperties[xKey] - rotationOriginX) +
            cos * (vector.vectorProperties[yKey] - rotationOriginY) +
            rotationOriginY,
        )
        updateVectorProperties(vector, newX, newY, xKey, yKey)
      }
    }
    if (vectorIndex === state.vector.currentIndex) {
      vectorGui.setVectorProperties(vector)
    }
  }
  renderCanvas(canvas.currentLayer, true)
  //Get any selected vector to use for modifyVectorAction
  modifyVectorAction(referenceVector)
  state.clearRedoStack()
  vectorGui.render()
}

/**
 * Scale selected vectors by a factor calculated from the given x and y minimum and maximum points
 */
export function actionScaleVectors() {
  //IN PROGRESS
}
