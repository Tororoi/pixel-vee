import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderLineVector(vectorProperties, vector) {
  const xOffset = vector ? vector.layer.x + canvas.xOffset : canvas.xOffset
  const yOffset = vector ? vector.layer.y + canvas.yOffset : canvas.yOffset
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  let circleRadius = 8 * lineWidth

  let pointsKeys = [
    { x: "px1", y: "py1" },
    { x: "px2", y: "py2" },
  ]

  if (!vector) {
    vectorGui.drawControlPoints(
      vectorProperties,
      pointsKeys,
      circleRadius,
      false
    )
  }

  vectorGui.drawControlPoints(
    vectorProperties,
    pointsKeys,
    circleRadius / 2,
    true, // modify
    vector
  )
}

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderLinePath(vectorProperties, vector) {
  const { px1, py1, px2, py2 } = vectorProperties
  const xOffset = vector ? vector.layer.x + canvas.xOffset : canvas.xOffset
  const yOffset = vector ? vector.layer.y + canvas.yOffset : canvas.yOffset
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  if (!Number.isInteger(px2)) return

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)
  canvas.vectorGuiCTX.lineTo(xOffset + px2 + 0.5, yOffset + py2 + 0.5)
  canvas.vectorGuiCTX.lineWidth = lineWidth * 3
  canvas.vectorGuiCTX.strokeStyle = "black"
  canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.stroke()
}
