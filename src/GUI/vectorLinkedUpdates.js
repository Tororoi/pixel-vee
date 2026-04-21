import { vectorGui } from './vector.js'
import { globalState } from '../Context/state.js'
import {
  updateVectorProperties,
  calculateCurrentVectorDeltas,
  handleOptionsAndUpdateVector,
} from '../utils/vectorHelpers.js'

/**
 *
 * @param {object} currentVector - The vector action to base other vector handling on
 * @param {boolean} saveVectorProperties - if true, save the properties of the vector
 * quadCurve must run this twice. Two sets of linked vectors should be maintained, one for p1 and one for p2 of the quad curve.
 */
export function updateLinkedVectors(
  currentVector,
  saveVectorProperties = false,
) {
  for (const [linkedVectorIndex, linkedPoints] of Object.entries(
    vectorGui.linkedVectors,
  )) {
    //Values are 0 across the board for p1 or p2 as selected point
    const { currentDeltaX, currentDeltaY, currentDeltaAngle } =
      calculateCurrentVectorDeltas(
        currentVector,
        vectorGui.selectedPoint,
        globalState.tool.current.options,
        globalState.vector.savedProperties,
        linkedPoints.linkingPoint,
      )

    let x = globalState.cursor.x - globalState.canvas.cropOffsetX
    let y = globalState.cursor.y - globalState.canvas.cropOffsetY
    const linkedVector = globalState.vector.all[linkedVectorIndex]

    //As long as linked vector is quadCurve, must propogate linking to connected vectors

    if (saveVectorProperties) {
      globalState.vector.savedProperties[linkedVectorIndex] = {
        ...linkedVector.vectorProperties,
        modes: { ...linkedVector.modes },
      }
    } else if (!globalState.vector.savedProperties[linkedVectorIndex]) {
      //prevent linking vectors during pointermove
      continue
    }
    const savedProperties =
      globalState.vector.savedProperties[linkedVectorIndex]
    handleOptionsAndUpdateVector(
      x,
      y,
      currentDeltaX,
      currentDeltaY,
      currentDeltaAngle,
      vectorGui.selectedPoint.xKey,
      linkedVector,
      linkedPoints,
      savedProperties,
      globalState.tool.current.options,
    )
  }
}

/**
 * Helper function to update vector properties based on the control handle selection.
 * @param {object} currentVector - The vector action to update
 * @param {number} x - The new x coordinate
 * @param {number} y - The new y coordinate
 * @param {object} savedProperties - Previously saved properties of the vector
 * @param {number} currentPointNumber - The number of the currently selected control point
 * @param {number} targetPointNumber - The number of the target control point to update
 */
function updateVectorControl(
  currentVector,
  x,
  y,
  savedProperties,
  currentPointNumber,
  targetPointNumber,
) {
  const currentXKey = `px${currentPointNumber}`
  const currentYKey = `py${currentPointNumber}`
  const targetXKey = `px${targetPointNumber}`
  const targetYKey = `py${targetPointNumber}`
  const xDiff = savedProperties[currentXKey] - savedProperties[targetXKey]
  const yDiff = savedProperties[currentYKey] - savedProperties[targetYKey]
  globalState.vector.properties[targetXKey] = x - xDiff
  globalState.vector.properties[targetYKey] = y - yDiff
  updateVectorProperties(
    currentVector,
    x - xDiff,
    y - yDiff,
    targetXKey,
    targetYKey,
  )
}

/**
 * @param {object} currentVector - The vector action to update
 * @param {number} x - The x coordinate of new endpoint
 * @param {number} y - The y coordinate of new endpoint
 */
export function updateLockedCurrentVectorControlHandle(currentVector, x, y) {
  const savedProperties =
    globalState.vector.savedProperties[globalState.vector.currentIndex]
  let currentPointNumber, targetPointNumber
  if (savedProperties.modes.cubicCurve) {
    currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
    //point 1 holds point 3, point 2 holds point 4, point 3 and 4 don't hold any points
    switch (currentPointNumber) {
      case 1:
        targetPointNumber = 3
        break
      case 2:
        targetPointNumber = 4
        break
      default:
        targetPointNumber = currentPointNumber
    }
  } else if (savedProperties.modes.quadCurve) {
    currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
    //both point 1 and 2 hold point 3
    targetPointNumber = 3
  } else {
    currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
    //point 1 holds point 2, point 2 holds point 1
    targetPointNumber = currentPointNumber === 1 ? 2 : 1
  }
  updateVectorControl(
    currentVector,
    x,
    y,
    savedProperties,
    currentPointNumber,
    targetPointNumber,
  )
}

/**
 * For efficient rendering, create an array of indexes of vectors that need to be re-rendered.
 * Other actions will be saved to between canvases to avoid multiple ununecessary renders in redrawTimelineActions
 * Can't simply save images and draw them for the betweenCvs because this will ignore actions using erase or inject modes.
 * @param {object} currentVector - The vector action to base the active indexes on
 * @param {object} vectorsSavedProperties - will have at least one entry, corresponding to currentVector
 * @returns {Array} activeIndexes
 */
export function createActiveIndexesForRender(
  currentVector,
  vectorsSavedProperties,
) {
  const vectorsSavedPropertiesActionKeys = Object.keys(
    vectorsSavedProperties,
  ).map((key) => globalState.vector.all[key].action.index)
  let startActionIndex = Math.min(...vectorsSavedPropertiesActionKeys)
  let activeIndexes = []

  for (
    let i = startActionIndex;
    i < globalState.timeline.undoStack.length;
    i++
  ) {
    let action = globalState.timeline.undoStack[i]
    if (
      action.layer === currentVector.layer &&
      (action.tool === 'fill' ||
        action.tool === 'cut' ||
        action?.modes?.eraser ||
        action?.modes?.inject ||
        vectorsSavedPropertiesActionKeys.includes(i))
    ) {
      activeIndexes.push(i)
    }
  }
  return activeIndexes
}
