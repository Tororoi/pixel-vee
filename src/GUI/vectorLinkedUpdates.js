import { vectorGui } from './vector.js'
import { globalState } from '../Context/state.js'
import {
  updateVectorProperties,
  calculateCurrentVectorDeltas,
  handleOptionsAndUpdateVector,
} from '../utils/vectorHelpers.js'
import { getAngle } from '../utils/trig.js'

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

// Stores metadata for curves linked to the current line's endpoints, populated at pointerdown.
let lineLinkedCurvesInfo = []

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
    globalState.vector.currentIndex !== null &&
    endpointKeys.includes(vectorGui.collidedPoint.xKey)
  ) {
    const currentVector =
      globalState.vector.all[globalState.vector.currentIndex]
    if (currentVector && currentVector.vectorProperties.tool === 'curve') {
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
    globalState.vector.collidedIndex !== null &&
    endpointKeys.includes(vectorGui.otherCollidedKeys.xKey)
  ) {
    const collidedVector =
      globalState.vector.all[globalState.vector.collidedIndex]
    if (collidedVector && collidedVector.vectorProperties.tool === 'curve') {
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
export function snapEndpointToCollidedVector(currentVector) {
  let collidedVector = globalState.vector.all[globalState.vector.collidedIndex]
  if (
    ['fill', 'ellipse'].includes(collidedVector.vectorProperties.tool) ||
    ['fill', 'ellipse'].includes(currentVector.vectorProperties.tool)
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
  globalState.vector.properties[vectorGui.selectedPoint.xKey] = snappedToX
  globalState.vector.properties[vectorGui.selectedPoint.yKey] = snappedToY
  updateVectorProperties(
    currentVector,
    snappedToX,
    snappedToY,
    vectorGui.selectedPoint.xKey,
    vectorGui.selectedPoint.yKey,
  )
  if (globalState.tool.current.options.hold?.active) {
    updateLockedCurrentVectorControlHandle(
      currentVector,
      snappedToX,
      snappedToY,
    )
  }
  // Handle align/equal options: adjust tangent handle after snapping
  if (
    !(
      globalState.tool.current.options.align?.active ||
      globalState.tool.current.options.equal?.active
    ) ||
    !['px1', 'px2'].includes(vectorGui.selectedPoint.xKey)
  ) {
    return
  }
  // Line-to-curve snap: update the collided curve's handle instead of the current (line) vector's
  if (globalState.tool.current.modes.line) {
    if (
      collidedVector.modes.line ||
      collidedVector.vectorProperties.tool !== 'curve'
    )
      return
    const otherXKey = vectorGui.selectedPoint.xKey === 'px1' ? 'px2' : 'px1'
    const otherYKey = vectorGui.selectedPoint.yKey === 'py1' ? 'py2' : 'py1'
    const otherX = globalState.vector.properties[otherXKey]
    const otherY = globalState.vector.properties[otherYKey]
    const lineDeltaX = otherX - snappedToX
    const lineDeltaY = otherY - snappedToY
    const lineLength = Math.sqrt(lineDeltaX ** 2 + lineDeltaY ** 2)
    if (lineLength === 0) return
    const collidedEpXKey = vectorGui.otherCollidedKeys.xKey
    const collidedEpYKey = vectorGui.otherCollidedKeys.yKey
    const collidedHandleXKey =
      collidedEpXKey === 'px1'
        ? 'px3'
        : collidedVector.modes.quadCurve
          ? 'px3'
          : 'px4'
    const collidedHandleYKey =
      collidedEpXKey === 'px1'
        ? 'py3'
        : collidedVector.modes.quadCurve
          ? 'py3'
          : 'py4'
    // Save collided vector's properties for undo/redo
    globalState.vector.savedProperties[collidedVector.index] = {
      ...collidedVector.vectorProperties,
      modes: { ...collidedVector.modes },
    }
    const existingHDX =
      collidedVector.vectorProperties[collidedHandleXKey] -
      collidedVector.vectorProperties[collidedEpXKey]
    const existingHDY =
      collidedVector.vectorProperties[collidedHandleYKey] -
      collidedVector.vectorProperties[collidedEpYKey]
    const handleLength = globalState.tool.current.options.equal?.active
      ? lineLength
      : Math.sqrt(existingHDX ** 2 + existingHDY ** 2)
    const handleAngle = globalState.tool.current.options.align?.active
      ? getAngle(lineDeltaX, lineDeltaY) + Math.PI
      : getAngle(existingHDX, existingHDY)
    updateVectorProperties(
      collidedVector,
      snappedToX + Math.round(Math.cos(handleAngle) * handleLength),
      snappedToY + Math.round(Math.sin(handleAngle) * handleLength),
      collidedHandleXKey,
      collidedHandleYKey,
    )
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
    globalState.vector.savedProperties[currentVector.index]
  const currentHandleDeltaX =
    savedCurrentProperties[selectedEndpointXKey] -
    savedCurrentProperties[selectedHandleXKey]
  const currentHandleDeltaY =
    savedCurrentProperties[selectedEndpointYKey] -
    savedCurrentProperties[selectedHandleYKey]
  const selectedHandleDeltaX =
    globalState.vector.properties[selectedHandleXKey] -
    globalState.vector.properties[selectedEndpointXKey]
  const selectedHandleDeltaY =
    globalState.vector.properties[selectedHandleYKey] -
    globalState.vector.properties[selectedEndpointYKey]
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
  const selectedHandleLength = globalState.tool.current.options.equal?.active
    ? Math.sqrt(collidedHandleDeltaX ** 2 + collidedHandleDeltaY ** 2)
    : Math.sqrt(currentHandleDeltaX ** 2 + currentHandleDeltaY ** 2)
  // Handle angle: align takes priority over equal
  const newSelectedAngle = globalState.tool.current.options.align?.active
    ? getAngle(collidedHandleDeltaX, collidedHandleDeltaY) + Math.PI
    : getAngle(selectedHandleDeltaX, selectedHandleDeltaY)
  const newSelectedHandleDeltaX = -Math.round(
    Math.cos(newSelectedAngle) * selectedHandleLength,
  )
  const newSelectedHandleDeltaY = -Math.round(
    Math.sin(newSelectedAngle) * selectedHandleLength,
  )
  globalState.vector.properties[selectedHandleXKey] =
    globalState.vector.properties[selectedEndpointXKey] -
    newSelectedHandleDeltaX
  globalState.vector.properties[selectedHandleYKey] =
    globalState.vector.properties[selectedEndpointYKey] -
    newSelectedHandleDeltaY
  updateVectorProperties(
    currentVector,
    globalState.vector.properties[selectedHandleXKey],
    globalState.vector.properties[selectedHandleYKey],
    selectedHandleXKey,
    selectedHandleYKey,
  )
}

/**
 * At pointerdown for a line vector with align/equal active, collect all curves whose
 * endpoints coincide with the line's endpoints. Saves their properties for undo/redo
 * and populates lineLinkedCurvesInfo for use in updateLineLinkedCurveHandles.
 * @param {object} currentVector - The current line vector being adjusted
 */
export function initLineLinkedCurvesInfo(currentVector) {
  lineLinkedCurvesInfo = []
  if (
    !globalState.tool.current.options.align?.active &&
    !globalState.tool.current.options.equal?.active
  ) {
    return
  }
  const selectedXKey = vectorGui.selectedPoint.xKey
  if (!['px1', 'px2'].includes(selectedXKey)) return
  const otherXKey = selectedXKey === 'px1' ? 'px2' : 'px1'
  const otherYKey = selectedXKey === 'px1' ? 'py2' : 'py1'
  const otherX =
    currentVector.vectorProperties[otherXKey] + currentVector.layer.x
  const otherY =
    currentVector.vectorProperties[otherYKey] + currentVector.layer.y

  // Curves at the selected endpoint — already tracked in vectorGui.linkedVectors
  for (const [linkedVectorIndex, linkedPoints] of Object.entries(
    vectorGui.linkedVectors,
  )) {
    const linkedVector = globalState.vector.all[linkedVectorIndex]
    if (
      !linkedVector ||
      linkedVector.modes.line ||
      linkedVector.vectorProperties.tool !== 'curve'
    ) {
      continue
    }
    let curveEndpointXKey, curveHandleXKey, curveHandleYKey
    if (linkedPoints.px1) {
      curveEndpointXKey = 'px1'
      curveHandleXKey = 'px3'
      curveHandleYKey = 'py3'
    } else if (linkedPoints.px2) {
      curveEndpointXKey = 'px2'
      curveHandleXKey = linkedVector.modes.quadCurve ? 'px3' : 'px4'
      curveHandleYKey = linkedVector.modes.quadCurve ? 'py3' : 'py4'
    } else {
      continue
    }
    lineLinkedCurvesInfo.push({
      vector: linkedVector,
      lineJunctionXKey: selectedXKey,
      curveEndpointXKey,
      curveHandleXKey,
      curveHandleYKey,
    })
    if (!globalState.vector.savedProperties[linkedVector.index]) {
      globalState.vector.savedProperties[linkedVector.index] = {
        ...linkedVector.vectorProperties,
        modes: { ...linkedVector.modes },
      }
    }
  }

  // Curves at the OTHER endpoint — scan all vectors for spatial coincidence
  for (const vector of Object.values(globalState.vector.all)) {
    if (
      vector.index === currentVector.index ||
      vector.removed ||
      vector.modes.line ||
      vector.vectorProperties.tool !== 'curve'
    ) {
      continue
    }
    for (const [epXKey, epYKey] of [
      ['px1', 'py1'],
      ['px2', 'py2'],
    ]) {
      const vx = vector.vectorProperties[epXKey] + vector.layer.x
      const vy = vector.vectorProperties[epYKey] + vector.layer.y
      if (vx === otherX && vy === otherY) {
        const curveHandleXKey =
          epXKey === 'px1' ? 'px3' : vector.modes.quadCurve ? 'px3' : 'px4'
        const curveHandleYKey =
          epXKey === 'px1' ? 'py3' : vector.modes.quadCurve ? 'py3' : 'py4'
        lineLinkedCurvesInfo.push({
          vector,
          lineJunctionXKey: otherXKey,
          curveEndpointXKey: epXKey,
          curveHandleXKey,
          curveHandleYKey,
        })
        if (!globalState.vector.savedProperties[vector.index]) {
          globalState.vector.savedProperties[vector.index] = {
            ...vector.vectorProperties,
            modes: { ...vector.modes },
          }
        }
        break
      }
    }
  }
}

/**
 * Updates control handles of curves linked to the current line's endpoints.
 * Align adjusts the handle angle to be opposite the line direction.
 * Equal adjusts the handle length to match the line length (only when the opposite
 * endpoint from the curve's junction is selected).
 * @param {object} currentVector - The current line vector being adjusted
 */
export function updateLineLinkedCurveHandles(currentVector) {
  if (!lineLinkedCurvesInfo.length) return
  const px1X = currentVector.vectorProperties.px1 + currentVector.layer.x
  const px1Y = currentVector.vectorProperties.py1 + currentVector.layer.y
  const px2X = currentVector.vectorProperties.px2 + currentVector.layer.x
  const px2Y = currentVector.vectorProperties.py2 + currentVector.layer.y
  const lineDeltaX = px2X - px1X
  const lineDeltaY = px2Y - px1Y
  const lineLength = Math.sqrt(lineDeltaX ** 2 + lineDeltaY ** 2)
  if (lineLength === 0) return
  const selectedXKey = vectorGui.selectedPoint.xKey
  for (const {
    vector: linkedVector,
    lineJunctionXKey,
    curveEndpointXKey,
    curveHandleXKey,
    curveHandleYKey,
  } of lineLinkedCurvesInfo) {
    const savedProps = globalState.vector.savedProperties[linkedVector.index]
    if (!savedProps) continue
    // When hold is active, moving the opposite endpoint should not affect the linked curve
    if (
      globalState.tool.current.options.hold?.active &&
      selectedXKey !== lineJunctionXKey
    ) {
      continue
    }
    const junctionX = lineJunctionXKey === 'px1' ? px1X : px2X
    const junctionY = lineJunctionXKey === 'px1' ? px1Y : px2Y
    // Line direction from the junction toward the other endpoint
    const dirDeltaX = lineJunctionXKey === 'px1' ? lineDeltaX : -lineDeltaX
    const dirDeltaY = lineJunctionXKey === 'px1' ? lineDeltaY : -lineDeltaY
    // Equal applies only when the selected endpoint is the opposite of the junction
    const applyEqual =
      globalState.tool.current.options.equal?.active &&
      selectedXKey !== lineJunctionXKey
    const curveEndpointYKey = curveEndpointXKey.replace('px', 'py')
    const savedHDX = savedProps[curveHandleXKey] - savedProps[curveEndpointXKey]
    const savedHDY = savedProps[curveHandleYKey] - savedProps[curveEndpointYKey]
    const handleLength = applyEqual
      ? lineLength
      : Math.sqrt(savedHDX ** 2 + savedHDY ** 2)
    const handleAngle = globalState.tool.current.options.align?.active
      ? getAngle(dirDeltaX, dirDeltaY) + Math.PI
      : getAngle(savedHDX, savedHDY)
    updateVectorProperties(
      linkedVector,
      junctionX + Math.round(Math.cos(handleAngle) * handleLength),
      junctionY + Math.round(Math.sin(handleAngle) * handleLength),
      curveHandleXKey,
      curveHandleYKey,
    )
  }
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
