import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"
import { drawCirclePath, drawControlPointHandle } from "../utils/guiHelpers.js"

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
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  let circleRadius = 8 * lineWidth
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)

  if (Number.isInteger(px3)) {
    canvas.vectorGuiCTX.beginPath()
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px3, py3)
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px2, py2)
  } else if (Number.isInteger(px2)) {
    canvas.vectorGuiCTX.beginPath()
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px2, py2)
  }

  let pointsKeys = [
    { x: "px1", y: "py1" },
    { x: "px2", y: "py2" },
    { x: "px3", y: "py3" },
  ]

  if (!vector) {
    vectorGui.drawControlPoints(
      vectorProperties,
      pointsKeys,
      circleRadius,
      false
    )
  }

  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  vectorGui.drawControlPoints(
    vectorProperties,
    pointsKeys,
    circleRadius / 2,
    true,
    vector
  )
  // Fill points
  canvas.vectorGuiCTX.fill()
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
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  let circleRadius = 8 * lineWidth
  canvas.vectorGuiCTX.strokeStyle = "red"
  canvas.vectorGuiCTX.fillStyle = "red"
  canvas.vectorGuiCTX.beginPath()
  if (Number.isInteger(px2)) {
    drawCirclePath(
      canvas.vectorGuiCTX,
      xOffset,
      yOffset,
      px1 + x1Offset / 2,
      py1 + y1Offset / 2,
      circleRadius / 2
    )
    drawCirclePath(
      canvas.vectorGuiCTX,
      xOffset,
      yOffset,
      px2 + x1Offset / 2,
      py2 + y1Offset / 2,
      circleRadius / 2
    )
  }
  if (Number.isInteger(px3)) {
    drawCirclePath(
      canvas.vectorGuiCTX,
      xOffset,
      yOffset,
      px3 + x1Offset / 2,
      py3 + y1Offset / 2,
      circleRadius / 2
    )
  }
  canvas.vectorGuiCTX.fill()
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.setLineDash([1, 1])
  if (Number.isInteger(px2)) {
    canvas.vectorGuiCTX.moveTo(
      xOffset + px1 + 0.5 + x1Offset / 2,
      yOffset + py1 + 0.5 + y1Offset / 2
    )
    canvas.vectorGuiCTX.lineTo(
      xOffset + px2 + 0.5 + x1Offset / 2,
      yOffset + py2 + 0.5 + y1Offset / 2
    )
  }
  if (Number.isInteger(px3)) {
    canvas.vectorGuiCTX.moveTo(
      xOffset + px1 + 0.5 + x1Offset / 2,
      yOffset + py1 + 0.5 + y1Offset / 2
    )
    canvas.vectorGuiCTX.lineTo(
      xOffset + px3 + 0.5 + x1Offset / 2,
      yOffset + py3 + 0.5 + y1Offset / 2
    )
  }

  canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.setLineDash([])
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
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"

  canvas.vectorGuiCTX.beginPath()

  //Don't let radii be negative with offset
  let majorAxis = radA + x1Offset / 2 > 0 ? radA + x1Offset / 2 : 0
  let minorAxis = radB + y1Offset / 2 > 0 ? radB + y1Offset / 2 : 0

  if (!Number.isInteger(px3)) {
    minorAxis = majorAxis
  }

  canvas.vectorGuiCTX.ellipse(
    xOffset + px1 + 0.5 + x1Offset / 2,
    yOffset + py1 + 0.5 + y1Offset / 2,
    majorAxis,
    minorAxis,
    angle + 4 * Math.PI,
    0,
    angle + 2 * Math.PI
  )
  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()
}
