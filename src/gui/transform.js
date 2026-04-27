import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
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
 * Sets the active vector transform mode and immediately re-renders the
 * vector GUI so that mode-specific controls appear without waiting for
 * the next interaction event.
 * @param {string} mode - One of "translate", "rotate", or "scale"
 */
export function switchVectorTransformMode(mode) {
  globalState.vector.transformMode = mode
  vectorGui.render()
}

/**
 * Keeps the rotation origin pinned to the shape center and recomputes
 * the pending rotation angle whenever the user is actively dragging. The
 * new angle is the cursor's current angle from the origin, adjusted by
 * the angle at which the grab began and offset by the pre-drag rotation,
 * so the shape does not snap on mouse-down.
 */
function updateRotationAngle() {
  //for now, mother ui is always in the shape center
  vectorGui.mother.rotationOrigin.x = globalState.vector.shapeCenterX
  vectorGui.mother.rotationOrigin.y = globalState.vector.shapeCenterY
  if (
    globalState.cursor.clicked &&
    globalState.vector.grabStartAngle !== null
  ) {
    // rotationOrigin is layer-absolute; cursor is canvas-pixel.
    // Subtract cropOffset so both are in the same coordinate space.
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
 * Resolves whether the rotation control is active (hovered or selected),
 * registers the collision point with the GUI, and sets the canvas cursor.
 * The selected check runs first to skip the collision math when the point
 * is already being manipulated.
 * @param {object} motherPoints - Object with rotationx and rotationy in
 *   layer-absolute coordinates
 * @param {number} r - Collision radius in canvas pixels
 * @returns {boolean} True if the control is hovered or selected
 */
function resolveRotationActiveState(motherPoints, r) {
  const isSelected = vectorGui.selectedPoint.xKey === 'rotationx'
  // motherPoints are layer-absolute; add cropOffset so the collision
  // check operates in the same canvas-pixel space as the cursor.
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
 * Draws the Archimedean spiral that serves as the visual glyph for the
 * rotation control. Two full turns are approximated with 96 line segments
 * for smoothness. The doubleStroke call renders a white outline beneath
 * the black stroke so the glyph stays legible on both light and dark
 * backgrounds.
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
 * Draws a small filled circle at the spiral's origin to anchor the glyph
 * visually. White fill with a black ring keeps it visible regardless of
 * the canvas background color.
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
 * Draws four outward-pointing rounded triangles at the cardinal directions
 * around the rotation spiral to signal that the control can be dragged.
 * Each arrow is built with arcTo so the vertices are softened rather than
 * sharp, making the arrows feel lighter at small line widths.
 * @param {number} cx - Center x in canvas pixel space
 * @param {number} cy - Center y in canvas pixel space
 * @param {number} lineWidth - Base GUI line width
 * @param {number} maxRadius - Outer radius of spiral, used to place arrows
 *   just beyond the glyph edge
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
 * Top-level render entry point for the rotation transform control. Updates
 * the live rotation angle from the current cursor position, resolves the
 * active (hovered/selected) state, then composites the spiral glyph,
 * origin dot, and—when the control is active—four directional arrows. The
 * canvas context is saved and restored so that the lineCap override does
 * not leak into other GUI draws.
 */
export function renderVectorRotationControl() {
  updateRotationAngle()

  const lineWidth = getGuiLineWidth(0.5)
  const circleRadius = 48 * lineWidth
  const motherPoints = {
    rotationx: vectorGui.mother.rotationOrigin.x,
    rotationy: vectorGui.mother.rotationOrigin.y,
  }
  // rotationOrigin is layer-absolute; add cropOffset to reach canvas-pixel
  // space. The +0.5 aligns to a pixel boundary so strokes stay sharp at 1x.
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

  // Use 75% of the visual radius as the hit area so the control remains
  // easy to grab near the outermost edge of the spiral.
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
 * Recomputes the bounding box enclosing all selected vector shapes and
 * writes it into the selection state in canvas-pixel space. The helper
 * returns last-occupied pixel indices (inclusive), so xMax and yMax are
 * each incremented by one to produce the exclusive upper bound that the
 * selection system expects.
 */
export function setVectorShapeBoundaryBox() {
  const shapeBoundaryBox = findVectorShapeBoundaryBox(
    globalState.vector.selectedIndices,
    globalState.vector.all,
  )
  const { cropOffsetX, cropOffsetY } = globalState.canvas
  // Crop offsets convert layer-absolute indices to canvas-pixel space.
  globalState.selection.properties.px1 = shapeBoundaryBox.xMin + cropOffsetX
  globalState.selection.properties.py1 = shapeBoundaryBox.yMin + cropOffsetY
  globalState.selection.properties.px2 = shapeBoundaryBox.xMax + 1 + cropOffsetX
  globalState.selection.properties.py2 = shapeBoundaryBox.yMax + 1 + cropOffsetY
  globalState.selection.setBoundaryBox(globalState.selection.properties)
}
