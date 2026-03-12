import { canvas } from '../Context/canvas.js'
import { vectorGui } from './vector.js'
import { getGuiLineWidth } from '../utils/guiHelpers.js'

/**
 * Render fill vector gui
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderFillVector(vectorProperties, vector) {
  let pointsKeys = [{ x: 'px1', y: 'py1' }]
  const lineWidth = getGuiLineWidth()
  const circleRadius = 20 * lineWidth
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
