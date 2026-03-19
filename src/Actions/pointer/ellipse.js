import { plotRotatedEllipseConics } from '../../utils/ellipse.js'
import { renderPoints } from './helpers.js'

/**
 * User action for process to set control points for ellipse based on vertices
 * @param {number} weight - (Integer)
 * @param {number} leftTangentX - (Integer)
 * @param {number} leftTangentY - (Integer)
 * @param {number} topTangentX - (Integer)
 * @param {number} topTangentY - (Integer)
 * @param {number} rightTangentX - (Integer)
 * @param {number} rightTangentY - (Integer)
 * @param {number} bottomTangentX - (Integer)
 * @param {number} bottomTangentY - (Integer)
 * @param {object} ctx - StrokeContext
 */
export function actionEllipse(
  weight,
  leftTangentX,
  leftTangentY,
  topTangentX,
  topTangentY,
  rightTangentX,
  rightTangentY,
  bottomTangentX,
  bottomTangentY,
  ctx,
) {
  const plotPoints = plotRotatedEllipseConics(
    weight,
    leftTangentX,
    leftTangentY,
    topTangentX,
    topTangentY,
    rightTangentX,
    rightTangentY,
    bottomTangentX,
    bottomTangentY,
  )
  renderPoints(plotPoints, ctx)
}
