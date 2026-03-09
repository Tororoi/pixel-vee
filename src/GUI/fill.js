import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"

/**
 * Render fill vector gui
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderFillVector(vectorProperties, vector) {
  let pointsKeys = [{ x: "px1", y: "py1" }]
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  let circleRadius = 8 * lineWidth
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
    true,
    vector
  )
}
