import { canvas } from '../context/canvas.js'
import { vectorGui } from './vector.js'
import {
  drawControlPointHandle,
  getGuiLineWidth,
  doubleStroke,
} from '../utils/guiHelpers.js'
import {
  getRenderXOffset,
  getRenderYOffset,
} from '../utils/coordinateHelpers.js'

/**
 * Renders the GUI overlay for an ellipse vector in progress or selected
 * state. Draws handle lines from the center point (px1, py1) to each
 * placed radius endpoint, then renders all control point dots. Handles
 * are only drawn for points that have already been placed — px3 is
 * checked first so that both handles are drawn together once the third
 * point exists, then px2 alone for the intermediate state. Control
 * points are drawn twice: once in the deselected state when there is no
 * active vector, and once in the active/selected state so layering
 * always looks correct.
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderEllipseVector(vectorProperties, vector) {
  const {
    px1,
    py1,
    px2,
    py2,
    px3,
    py3,
    // radA,
    // radB,
    // angle,
    // x1Offset,
    // y1Offset,
  } = vectorProperties
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  // px3 being set means both radius endpoints exist; draw both handles.
  if (Number.isInteger(px3)) {
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px3, py3)
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px2, py2)
  } else if (Number.isInteger(px2)) {
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px2, py2)
  }

  let pointsKeys = [
    { x: 'px1', y: 'py1' },
    { x: 'px2', y: 'py2' },
    { x: 'px3', y: 'py3' },
  ]

  // Draw unselected dots first so they are visible when no vector is
  // active (e.g. during in-progress drawing before a vector object exists).
  if (!vector) {
    vectorGui.drawControlPoints(vectorProperties, pointsKeys, false)
  }

  vectorGui.drawControlPoints(vectorProperties, pointsKeys, true, vector)
}

/**
 * Renders a ghost preview overlay showing where the ellipse control
 * points will land after the current pixel offset is applied. All
 * positions are shifted by half the full offset (x1Offset / 2,
 * y1Offset / 2) so the ghost sits between the original and the final
 * positions, giving the user a mid-point visual cue as they drag.
 * Dashed lines connect the center ghost to each radius endpoint ghost,
 * and small red-filled circles mark each ghost position to distinguish
 * them from normal control point handles.
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderOffsetEllipseVector(vectorProperties, vector) {
  const {
    px1,
    py1,
    px2,
    py2,
    px3,
    py3,
    // radA,
    // radB,
    // angle,
    x1Offset,
    y1Offset,
  } = vectorProperties
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  const lw = getGuiLineWidth()
  const circleRadius = 20 * lw

  /**
   * Draws a small red filled circle to mark a ghost offset position.
   * The radius is derived from circleRadius so the dot stays visually
   * proportional as zoom level (and therefore lw) changes.
   * @param {number} x - center x coordinate
   * @param {number} y - center y coordinate
   */
  function drawOffsetCircle(x, y) {
    const cx = xOffset + x + 0.5
    const cy = yOffset + y + 0.5
    const r = circleRadius / 3
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.arc(cx, cy, r * 0.625, 0, 2 * Math.PI)
    canvas.vectorGuiCTX.lineWidth = lw * 2
    canvas.vectorGuiCTX.strokeStyle = 'black'
    canvas.vectorGuiCTX.stroke()
    canvas.vectorGuiCTX.fillStyle = 'red'
    canvas.vectorGuiCTX.fill()
  }

  // Dashed style signals these are ghost/preview lines, not live handles.
  canvas.vectorGuiCTX.setLineDash([1, 1])
  canvas.vectorGuiCTX.beginPath()
  if (Number.isInteger(px2)) {
    canvas.vectorGuiCTX.moveTo(
      xOffset + px1 + 0.5 + x1Offset / 2,
      yOffset + py1 + 0.5 + y1Offset / 2,
    )
    canvas.vectorGuiCTX.lineTo(
      xOffset + px2 + 0.5 + x1Offset / 2,
      yOffset + py2 + 0.5 + y1Offset / 2,
    )
  }
  if (Number.isInteger(px3)) {
    canvas.vectorGuiCTX.moveTo(
      xOffset + px1 + 0.5 + x1Offset / 2,
      yOffset + py1 + 0.5 + y1Offset / 2,
    )
    canvas.vectorGuiCTX.lineTo(
      xOffset + px3 + 0.5 + x1Offset / 2,
      yOffset + py3 + 0.5 + y1Offset / 2,
    )
  }
  doubleStroke(canvas.vectorGuiCTX, lw, 'black', 'red')
  canvas.vectorGuiCTX.setLineDash([])

  if (Number.isInteger(px2)) {
    drawOffsetCircle(px1 + x1Offset / 2, py1 + y1Offset / 2)
    drawOffsetCircle(px2 + x1Offset / 2, py2 + y1Offset / 2)
  }
  if (Number.isInteger(px3)) {
    drawOffsetCircle(px3 + x1Offset / 2, py3 + y1Offset / 2)
  }
}

/**
 * Renders the actual ellipse outline using the canvas ellipse API.
 * Both the center position and the radii are shifted by half the pixel
 * offset (x1Offset / 2, y1Offset / 2) so the path stays aligned with
 * the offset preview. Radii are clamped to zero rather than allowed to
 * go negative, which would invert the ellipse geometry. When px3 has
 * not been placed yet, the shape is forced to a circle by equating the
 * minor axis to the major axis — this matches the incremental placement
 * UX where only one radius point has been defined. The rotation
 * argument uses `angle + 4 * Math.PI` to keep the value non-negative
 * for any angle; `angle + 2 * Math.PI` as the end angle with start
 * angle 0 ensures the arc always spans a full closed revolution even
 * when angle is negative.
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderEllipsePath(vectorProperties, vector) {
  const {
    px1,
    py1,
    // px2,
    // py2,
    px3,
    // py3,
    radA,
    radB,
    angle,
    x1Offset,
    y1Offset,
  } = vectorProperties
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  const lineWidth = getGuiLineWidth()

  // Clamp to 0 rather than letting a large offset produce a negative
  // radius, which would flip the ellipse axis unexpectedly.
  let majorAxis = radA + x1Offset / 2 > 0 ? radA + x1Offset / 2 : 0
  let minorAxis = radB + y1Offset / 2 > 0 ? radB + y1Offset / 2 : 0

  // Before px3 is placed the user is still defining a circle.
  if (!Number.isInteger(px3)) {
    minorAxis = majorAxis
  }

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.ellipse(
    xOffset + px1 + 0.5 + x1Offset / 2,
    yOffset + py1 + 0.5 + y1Offset / 2,
    majorAxis,
    minorAxis,
    // +4π keeps rotation non-negative; +2π on endAngle closes the arc.
    angle + 4 * Math.PI,
    0,
    angle + 2 * Math.PI,
  )
  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}
