import { canvas } from '../Context/canvas.js'
import { vectorGui } from './vector.js'
import {
  drawControlPointHandle,
  getGuiLineWidth,
  doubleStroke,
} from '../utils/guiHelpers.js'

/**
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
  const xOffset = vector ? vector.layer.x + canvas.xOffset : canvas.xOffset
  const yOffset = vector ? vector.layer.y + canvas.yOffset : canvas.yOffset
  const lineWidth = getGuiLineWidth()
  let circleRadius = 20 * lineWidth

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

  if (!vector) {
    vectorGui.drawControlPoints(
      vectorProperties,
      pointsKeys,
      circleRadius,
      false,
    )
  }

  vectorGui.drawControlPoints(
    vectorProperties,
    pointsKeys,
    circleRadius / 3,
    true,
    vector,
  )
}

/**
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
  const xOffset = vector ? vector.layer.x + canvas.xOffset : canvas.xOffset
  const yOffset = vector ? vector.layer.y + canvas.yOffset : canvas.yOffset
  const lw = getGuiLineWidth()
  const circleRadius = 20 * lw

  /**
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
  const xOffset = vector ? vector.layer.x + canvas.xOffset : canvas.xOffset
  const yOffset = vector ? vector.layer.y + canvas.yOffset : canvas.yOffset
  const lineWidth = getGuiLineWidth()

  //Don't let radii be negative with offset
  let majorAxis = radA + x1Offset / 2 > 0 ? radA + x1Offset / 2 : 0
  let minorAxis = radB + y1Offset / 2 > 0 ? radB + y1Offset / 2 : 0

  if (!Number.isInteger(px3)) {
    minorAxis = majorAxis
  }

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.ellipse(
    xOffset + px1 + 0.5 + x1Offset / 2,
    yOffset + py1 + 0.5 + y1Offset / 2,
    majorAxis,
    minorAxis,
    angle + 4 * Math.PI,
    0,
    angle + 2 * Math.PI,
  )
  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}
