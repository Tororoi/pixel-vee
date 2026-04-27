import { plotRotatedEllipseConics } from '../../utils/ellipse.js'
import { renderPoints } from './helpers.js'

/**
 * Render a pixel-perfect rotated ellipse defined by four tangent points.
 *
 * The ellipse is described by the four points where it touches its bounding
 * diamond: left, top, right, and bottom tangent points. These map to the
 * leftmost, topmost, rightmost, and bottommost pixels of the ellipse outline,
 * allowing the tool to support both axis-aligned and freely rotated ellipses.
 *
 * `plotRotatedEllipseConics` computes the discrete pixel coordinates of the
 * outline using conic section math, and the resulting point list is passed
 * to `renderPoints` which applies the brush stamp at each position with
 * dither support if enabled.
 * @param {number} weight - Conic weight controlling the ellipse shape.
 * @param {number} leftTangentX - X of the left tangent point (integer).
 * @param {number} leftTangentY - Y of the left tangent point (integer).
 * @param {number} topTangentX - X of the top tangent point (integer).
 * @param {number} topTangentY - Y of the top tangent point (integer).
 * @param {number} rightTangentX - X of the right tangent point (integer).
 * @param {number} rightTangentY - Y of the right tangent point (integer).
 * @param {number} bottomTangentX - X of the bottom tangent point (integer).
 * @param {number} bottomTangentY - Y of the bottom tangent point (integer).
 * @param {object} strokeCtx - StrokeContext for this render pass.
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
  strokeCtx,
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
  renderPoints(plotPoints, strokeCtx)
}
