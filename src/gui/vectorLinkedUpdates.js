import { vectorGui } from './vector.js'
import { globalState } from '../context/state.js'
import {
  updateVectorProperties,
  calculateCurrentVectorDeltas,
  handleOptionsAndUpdateVector,
} from '../utils/vectorHelpers.js'
import { getAngle } from '../utils/trig.js'

/**
 * Propagates the current drag delta to every vector recorded in
 * vectorGui.linkedVectors, keeping linked endpoints synchronized during
 * a pointer interaction. Pass saveVectorProperties=true at pointerdown to
 * snapshot each linked vector's state; subsequent pointermove calls use
 * those snapshots to compute deltas. Any linked vector without a saved
 * snapshot is skipped to prevent mid-drag linkage from corrupting state.
 * QuadCurve must call this twice — once per endpoint — because each
 * endpoint maintains its own independent set of linked vectors.
 * @param {object} currentVector - The vector action to base other vector
 *   handling on
 * @param {boolean} saveVectorProperties - When true, snapshot each
 *   linked vector's current properties for delta calculations
 */
export function updateLinkedVectors(
  currentVector,
  saveVectorProperties = false,
) {
  for (const [linkedVectorIndex, linkedPoints] of Object.entries(
    vectorGui.linkedVectors,
  )) {
    // Endpoint deltas are zero for p1/p2; linked vectors at those points
    // update by absolute cursor position, not by a handle offset.
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

    // If the linked vector is a quadCurve, its own linked vectors must
    // also be propagated — that responsibility falls to a separate call.

    if (saveVectorProperties) {
      globalState.vector.savedProperties[linkedVectorIndex] = {
        ...linkedVector.vectorProperties,
        modes: { ...linkedVector.modes },
      }
    } else if (!globalState.vector.savedProperties[linkedVectorIndex]) {
      // Without a pointerdown snapshot, deltas cannot be computed safely.
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
 * Translates a target control point by the same canvas displacement as the
 * point currently being dragged, using the pre-drag offset stored in
 * savedProperties to keep the two points rigidly coupled. Writing directly
 * to globalState.vector.properties before calling updateVectorProperties
 * keeps the live property state consistent with the committed vector state.
 * @param {object} currentVector - The vector action to update
 * @param {number} x - The new x coordinate of the dragged point
 * @param {number} y - The new y coordinate of the dragged point
 * @param {object} savedProperties - Pre-drag snapshot of the vector's
 *   properties
 * @param {number} currentPointNumber - Control point number being dragged
 * @param {number} targetPointNumber - Control point number to keep in sync
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
 * Determines which target control point must move in tandem with the
 * currently dragged endpoint when the "hold" constraint is active, then
 * delegates to updateVectorControl. The mapping differs by curve type:
 * cubicCurve links p1→p3 and p2→p4 (p3/p4 are already at the cursor so
 * they map to themselves); quadCurve links both endpoints to the shared p3
 * handle; lines link p1↔p2 so the opposite endpoint tracks the drag.
 * @param {object} currentVector - The vector action to update
 * @param {number} x - The new x coordinate of the dragged endpoint
 * @param {number} y - The new y coordinate of the dragged endpoint
 */
export function updateLockedCurrentVectorControlHandle(currentVector, x, y) {
  const savedProperties =
    globalState.vector.savedProperties[globalState.vector.currentIndex]
  let currentPointNumber, targetPointNumber
  if (savedProperties.modes.cubicCurve) {
    currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
    // p3 and p4 are handle points; dragging them directly maps to themselves.
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
    // quadCurve has one shared handle (p3) for both endpoints.
    targetPointNumber = 3
  } else {
    currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
    // For lines, dragging one endpoint keeps the other endpoint locked.
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

// Stores metadata for curves linked to the current line's endpoints,
// populated at pointerdown.
let lineLinkedCurvesInfo = []

/**
 * Returns the canvas-absolute coordinates of the chainable endpoint under
 * the cursor, or null if no valid chain target is colliding. Checks the
 * currently selected vector's collided endpoint first (Case A), then falls
 * back to any other colliding vector (Case B). Only curve-tool vectors
 * qualify; lines and fills lack the bezier endpoint structure that chaining
 * depends on.
 * @returns {{ x: number, y: number } | null} Canvas-absolute coordinates
 *   or null
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
 * Snaps the selected endpoint to the collided vector's nearest control point
 * and, when align or equal options are active, adjusts the tangent handle
 * for C1 continuity. Fill and ellipse tools are excluded because they lack
 * the bezier handle structure this function relies on. For a line snapping
 * onto a curve the collided curve's handle is updated (lines have no bezier
 * handle of their own), after which the function returns early to skip the
 * curve-on-curve alignment path. The +Math.PI applied to the angle mirrors
 * the reference direction, producing the opposing tangent needed for a
 * smooth join.
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
    // hold mode locks the handle relative to the endpoint; apply it before
    // align/equal so the handle starts from the correct snapped position.
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
  // Line-to-curve snap: update the collided curve's handle instead of
  // the current (line) vector's
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
    // equal borrows the line's length so handle reach matches the segment.
    const handleLength = globalState.tool.current.options.equal?.active
      ? lineLength
      : Math.sqrt(existingHDX ** 2 + existingHDY ** 2)
    // +π mirrors the direction so the handle points away for a smooth join.
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
  // Compute collided vector's handle delta relative to its snapped endpoint
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
  // equal: borrow the collided handle's magnitude for matching reach.
  const selectedHandleLength = globalState.tool.current.options.equal?.active
    ? Math.sqrt(collidedHandleDeltaX ** 2 + collidedHandleDeltaY ** 2)
    : Math.sqrt(currentHandleDeltaX ** 2 + currentHandleDeltaY ** 2)
  // align takes priority over equal: only the angle is overridden.
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
 * At pointerdown for a line vector, collects every curve whose endpoint
 * coincides with either of the line's endpoints, then snapshots those
 * curves' properties for undo/redo. The first pass covers curves at the
 * selected endpoint by reading from the already-computed
 * vectorGui.linkedVectors; the second pass covers the other endpoint via a
 * spatial scan because linkedVectors only tracks the selected endpoint.
 * Early-exits when neither align nor equal is active, since handle
 * adjustments are only needed for those modes.
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
      // Avoid overwriting a snapshot already captured earlier in this loop.
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
          // Same guard as the first pass: preserve any earlier snapshot.
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
 * Updates the tangent handles of curves linked to the dragged line's
 * endpoints on every pointermove. Align orients each handle in the
 * direction opposite the line at the junction for C1 continuity; equal
 * scales the handle length to match the current line length, but only when
 * dragging the endpoint opposite the curve's junction (dragging the
 * junction itself relocates the attachment without changing line length, so
 * applying equal there would produce incorrect scaling). When hold is
 * active, curves whose junction is not the selected endpoint are skipped
 * because their junction position is fixed.
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
    // hold locks the junction; dragging the far endpoint translates the
    // line without changing tangent, so skip handle updates for those curves.
    if (
      globalState.tool.current.options.hold?.active &&
      selectedXKey !== lineJunctionXKey
    ) {
      continue
    }
    const junctionX = lineJunctionXKey === 'px1' ? px1X : px2X
    const junctionY = lineJunctionXKey === 'px1' ? px1Y : px2Y
    // lineDeltaX is always px2-px1; negate for px2 so dirDelta always
    // points away from the junction toward the other endpoint.
    const dirDeltaX = lineJunctionXKey === 'px1' ? lineDeltaX : -lineDeltaX
    const dirDeltaY = lineJunctionXKey === 'px1' ? lineDeltaY : -lineDeltaY
    // equal scales by line length only when the opposite endpoint is selected
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
 * Builds the minimal list of action indexes that must be actively re-rendered
 * when a vector property changes. Starting from the earliest affected action
 * ensures pixel-level ordering is preserved. Fill, cut, eraser, and inject
 * actions on the same layer are always included even when they are not
 * themselves being edited, because those operations blend pixel data in ways
 * that cannot be safely flattened onto the betweenCvs cache canvas.
 * @param {object} currentVector - The vector action to base the active
 *   indexes on
 * @param {object} vectorsSavedProperties - Saved properties for all vectors
 *   being modified; must contain at least the entry for currentVector
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
