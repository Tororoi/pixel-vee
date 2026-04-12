import { vectorGui } from './vector.js'

/**
 * Render fill vector gui
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderFillVector(vectorProperties, vector) {
  let pointsKeys = [{ x: 'px1', y: 'py1' }]
  if (!vector) {
    vectorGui.drawControlPoints(vectorProperties, pointsKeys, false)
  }
  vectorGui.drawControlPoints(vectorProperties, pointsKeys, true, vector)
}
