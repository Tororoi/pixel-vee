import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"
import { drawControlPointHandle } from "../utils/guiHelpers.js"

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} action - The vector action to be rendered
 * @param {object} vector - The vector to be rendered
 */
export function renderCurveVector(vectorProperties, action, vector) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  const xOffset = action
    ? action.layer.x + canvas.xOffset
    : canvas.xOffset
  const yOffset = action
    ? action.layer.y + canvas.yOffset
    : canvas.yOffset
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  let circleRadius = 8 * lineWidth
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)

  if (Number.isInteger(px4)) {
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px3, py3)
    drawControlPointHandle(canvas, xOffset, yOffset, px2, py2, px4, py4)
  } else if (Number.isInteger(px3)) {
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px3, py3)
  }

  let pointsKeys = [
    { x: "px1", y: "py1" },
    { x: "px2", y: "py2" },
    { x: "px3", y: "py3" },
    { x: "px4", y: "py4" },
  ]

  if (!action) {
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
    true, // modify
    0,
    action,
    vector
  )
  // Fill points
  canvas.vectorGuiCTX.fill()
}

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} action - The vector action to be rendered
 */
export function renderCurvePath(vectorProperties, action) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  const xOffset = action
    ? action.layer.x + canvas.xOffset
    : canvas.xOffset
  const yOffset = action
    ? action.layer.y + canvas.yOffset
    : canvas.yOffset
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)

  if (Number.isInteger(px4)) {
    canvas.vectorGuiCTX.bezierCurveTo(
      xOffset + px3 + 0.5,
      yOffset + py3 + 0.5,
      xOffset + px4 + 0.5,
      yOffset + py4 + 0.5,
      xOffset + px2 + 0.5,
      yOffset + py2 + 0.5
    )
  } else if (Number.isInteger(px3)) {
    canvas.vectorGuiCTX.quadraticCurveTo(
      xOffset + px3 + 0.5,
      yOffset + py3 + 0.5,
      xOffset + px2 + 0.5,
      yOffset + py2 + 0.5
    )
  } else if (Number.isInteger(px2)) {
    canvas.vectorGuiCTX.lineTo(xOffset + px2 + 0.5, yOffset + py2 + 0.5)
  }
  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()
}
