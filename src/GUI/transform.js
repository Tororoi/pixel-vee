import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { vectorGui } from './vector.js'
import { getAngle } from '../utils/trig.js'
import {
  checkSquarePointCollision,
  doubleStroke,
  getGuiLineWidth,
} from '../utils/guiHelpers.js'
// import { drawSelectControlPoints, renderSelectionBoxOutline } from "./select.js"
import { findVectorShapeBoundaryBox } from '../utils/vectorTransformHelpers.js'

/**
 * Updates the rotation angle while the user is dragging.
 */
function updateRotationAngle() {
  //for now, mother ui is always in the shape center
  vectorGui.mother.rotationOrigin.x = globalState.vector.shapeCenterX
  vectorGui.mother.rotationOrigin.y = globalState.vector.shapeCenterY
  if (
    globalState.cursor.clicked &&
    globalState.vector.grabStartAngle !== null
  ) {
    // rotationOrigin is layer-absolute; cursor is canvas-pixel. Normalize cursor to match.
    vectorGui.mother.newRotation =
      getAngle(
        vectorGui.mother.rotationOrigin.x -
          (globalState.cursor.x - globalState.canvas.cropOffsetX),
        vectorGui.mother.rotationOrigin.y -
          (globalState.cursor.y - globalState.canvas.cropOffsetY),
      ) -
      globalState.vector.grabStartAngle +
      vectorGui.mother.currentRotation
  }
}

/**
 * Checks hover/selected state for the rotation control, sets collision and cursor if active.
 * @param {object} motherPoints - Object with rotationx and rotationy canvas coordinates
 * @param {number} r - Collision radius
 * @returns {boolean} - True if the control is hovered or selected
 */
function resolveRotationActiveState(motherPoints, r) {
  const isSelected = vectorGui.selectedPoint.xKey === 'rotationx'
  // motherPoints coords are layer-absolute; cursor is canvas-pixel. Add cropOffset to match.
  const isHovered =
    !isSelected &&
    checkSquarePointCollision(
      globalState.cursor.x,
      globalState.cursor.y,
      motherPoints.rotationx + globalState.canvas.cropOffsetX,
      motherPoints.rotationy + globalState.canvas.cropOffsetY,
      r,
    )
  const isActive = isSelected || isHovered
  if (isActive) {
    vectorGui.setCollision({ x: 'rotationx', y: 'rotationy' })
    canvas.vectorGuiCVS.style.cursor = globalState.cursor.clicked
      ? 'grabbing'
      : 'grab'
  }
  return isActive
}

/**
 * Draws the Archimedean spiral that represents the rotation control.
 * @param {number} cx - Center x in canvas pixel space
 * @param {number} cy - Center y in canvas pixel space
 * @param {number} lineWidth - Base GUI line width
 * @param {number} minRadius - Inner radius of spiral
 * @param {number} maxRadius - Outer radius of spiral
 */
function drawRotationSpiral(cx, cy, lineWidth, minRadius, maxRadius) {
  const spiralTurns = 2
  const totalSegments = Math.round(spiralTurns * 48)
  canvas.vectorGuiCTX.beginPath()
  for (let i = 0; i <= totalSegments; i++) {
    const t = i / totalSegments
    const angle = t * spiralTurns * 2 * Math.PI
    const spiralRadius = minRadius + t * (maxRadius - minRadius)
    const x = cx + Math.cos(angle) * spiralRadius
    const y = cy + Math.sin(angle) * spiralRadius
    if (i === 0) {
      canvas.vectorGuiCTX.moveTo(x, y)
    } else {
      canvas.vectorGuiCTX.lineTo(x, y)
    }
  }
  doubleStroke(canvas.vectorGuiCTX, lineWidth * 2, 'black', 'white')
}

/**
 * Draws a small filled circle at the spiral's origin point.
 * @param {number} cx - Center x in canvas pixel space
 * @param {number} cy - Center y in canvas pixel space
 * @param {number} lineWidth - Base GUI line width
 */
function drawRotationOriginDot(cx, cy, lineWidth) {
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.arc(cx, cy, lineWidth * 6, 0, 2 * Math.PI)
  canvas.vectorGuiCTX.lineWidth = lineWidth * 4
  canvas.vectorGuiCTX.strokeStyle = 'black'
  canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.fillStyle = 'white'
  canvas.vectorGuiCTX.fill()
}

/**
 * Draws 4 outward-pointing rounded triangles to indicate the control can be moved.
 * @param {number} cx - Center x in canvas pixel space
 * @param {number} cy - Center y in canvas pixel space
 * @param {number} lineWidth - Base GUI line width
 * @param {number} maxRadius - Outer radius of spiral, used to position arrows
 */
function drawRotationDirectionArrows(cx, cy, lineWidth, maxRadius) {
  const arrowDist = maxRadius + lineWidth * 8
  const arrowHeight = lineWidth * 12
  const arrowHalfWidth = lineWidth * 12
  const cornerRadius = lineWidth * 2
  // [dirX, dirY] for each cardinal direction
  const directions = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ]
  for (const [dx, dy] of directions) {
    // Perpendicular axis for the arrow base
    const perpX = -dy
    const perpY = dx
    const tip = {
      x: cx + dx * (arrowDist + arrowHeight),
      y: cy + dy * (arrowDist + arrowHeight),
    }
    const left = {
      x: cx + dx * arrowDist + perpX * arrowHalfWidth,
      y: cy + dy * arrowDist + perpY * arrowHalfWidth,
    }
    const right = {
      x: cx + dx * arrowDist - perpX * arrowHalfWidth,
      y: cy + dy * arrowDist - perpY * arrowHalfWidth,
    }
    // Rounded triangle via arcTo at each vertex
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.moveTo((right.x + tip.x) / 2, (right.y + tip.y) / 2)
    canvas.vectorGuiCTX.arcTo(tip.x, tip.y, left.x, left.y, cornerRadius)
    canvas.vectorGuiCTX.arcTo(left.x, left.y, right.x, right.y, cornerRadius)
    canvas.vectorGuiCTX.arcTo(right.x, right.y, tip.x, tip.y, cornerRadius)
    canvas.vectorGuiCTX.closePath()
    canvas.vectorGuiCTX.fillStyle = 'white'
    canvas.vectorGuiCTX.fill()
    canvas.vectorGuiCTX.lineWidth = lineWidth * 2
    canvas.vectorGuiCTX.strokeStyle = 'black'
    canvas.vectorGuiCTX.stroke()
  }
}

/**
 *
 */
export function renderVectorRotationControl() {
  updateRotationAngle()

  const lineWidth = getGuiLineWidth(0.5)
  const circleRadius = 48 * lineWidth
  const motherPoints = {
    rotationx: vectorGui.mother.rotationOrigin.x,
    rotationy: vectorGui.mother.rotationOrigin.y,
  }
  // rotationOrigin is layer-absolute; add cropOffset to reach canvas-pixel space for rendering.
  const cx =
    canvas.xOffset +
    motherPoints.rotationx +
    globalState.canvas.cropOffsetX +
    0.5
  const cy =
    canvas.yOffset +
    motherPoints.rotationy +
    globalState.canvas.cropOffsetY +
    0.5
  const minRadius = lineWidth
  const maxRadius = circleRadius - lineWidth * 2

  const isActive = resolveRotationActiveState(motherPoints, circleRadius * 0.75)

  canvas.vectorGuiCTX.save()
  canvas.vectorGuiCTX.lineCap = 'round'
  drawRotationSpiral(cx, cy, lineWidth, minRadius, maxRadius)
  drawRotationOriginDot(cx, cy, lineWidth)
  if (isActive) {
    drawRotationDirectionArrows(cx, cy, lineWidth, maxRadius)
  }
  canvas.vectorGuiCTX.restore()
}

/**
 *
 */
export function setVectorShapeBoundaryBox() {
  //Update shape boundary box
  const shapeBoundaryBox = findVectorShapeBoundaryBox(
    globalState.vector.selectedIndices,
    globalState.vector.all,
  )
  const { cropOffsetX, cropOffsetY } = globalState.canvas
  globalState.selection.properties.px1 = shapeBoundaryBox.xMin + cropOffsetX
  globalState.selection.properties.py1 = shapeBoundaryBox.yMin + cropOffsetY
  globalState.selection.properties.px2 = shapeBoundaryBox.xMax + 1 + cropOffsetX
  globalState.selection.properties.py2 = shapeBoundaryBox.yMax + 1 + cropOffsetY
  globalState.selection.setBoundaryBox(globalState.selection.properties)
}
