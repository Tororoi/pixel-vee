import { plotCubicBezier, plotQuadBezier } from '../../utils/bezier.js'
import { actionLine } from './line.js'
import { renderPoints } from './helpers.js'

/**
 * Render a curve (line, quadratic bezier, or cubic bezier) to the canvas.
 *
 * The shape drawn depends on `stepNum`, which corresponds to how many
 * control points the user has placed so far during the curve tool interaction:
 *  - stepNum 1: only start and end points exist → draw a straight line.
 *  - stepNum 2: one control point set → draw a quadratic bezier curve.
 *  - stepNum 3: two control points set → draw a cubic bezier curve.
 *
 * The bezier utilities return a list of pixel coordinates that are then
 * rendered through `renderPoints`, which applies the brush stamp at each
 * position with dither support if enabled.
 * @param {number} startx - X coordinate of the curve start point (integer).
 * @param {number} starty - Y coordinate of the curve start point (integer).
 * @param {number} endx - X coordinate of the curve end point (integer).
 * @param {number} endy - Y coordinate of the curve end point (integer).
 * @param {number} controlx1 - X coordinate of the first control point
 *   (integer). Used in stepNum 2 and 3.
 * @param {number} controly1 - Y coordinate of the first control point
 *   (integer). Used in stepNum 2 and 3.
 * @param {number} controlx2 - X coordinate of the second control point
 *   (integer). Used only in stepNum 3.
 * @param {number} controly2 - Y coordinate of the second control point
 *   (integer). Used only in stepNum 3.
 * @param {number} stepNum - Which stage of the curve tool interaction
 *   this render represents (1, 2, or 3).
 * @param {object} strokeCtx - StrokeContext containing brush, color, layer,
 *   and dither settings for this render pass.
 */
export function actionCurve(
  startx,
  starty,
  endx,
  endy,
  controlx1,
  controly1,
  controlx2,
  controly2,
  stepNum,
  strokeCtx,
) {
  if (stepNum === 1) {
    actionLine(startx, starty, endx, endy, strokeCtx)
  } else if (stepNum === 2) {
    let plotPoints = plotQuadBezier(
      startx,
      starty,
      controlx1,
      controly1,
      endx,
      endy,
    )
    renderPoints(plotPoints, strokeCtx)
  } else if (stepNum === 3) {
    let plotPoints = plotCubicBezier(
      startx,
      starty,
      controlx1,
      controly1,
      controlx2,
      controly2,
      endx,
      endy,
    )
    renderPoints(plotPoints, strokeCtx)
  }
}
