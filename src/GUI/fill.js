import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"

/**
 * Render fill vector gui
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} action - The vector action to be rendered
 * @param {object} vector - The vector to be rendered
 */
export function renderFillVector(vectorProperties, action, vector) {
  let pointsKeys = [{ x: "px1", y: "py1" }]
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  let circleRadius = 8 * lineWidth
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"
  canvas.vectorGuiCTX.beginPath()
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
    true
    // action,
    // vector
  )
  // Fill points
  canvas.vectorGuiCTX.fill()
}
