import { plotCubicBezier, plotQuadBezier } from '../../utils/bezier.js'
import { actionLine } from './line.js'
import { renderPoints } from './helpers.js'

/**
 * User action for process to set control points for quadratic bezier
 * @param {number} startx - (Integer)
 * @param {number} starty - (Integer)
 * @param {number} endx - (Integer)
 * @param {number} endy - (Integer)
 * @param {number} controlx - (Integer)
 * @param {number} controly - (Integer)
 * @param {number} stepNum - (Integer)
 * @param {object} ctx - StrokeContext
 */
export function actionQuadraticCurve(
  startx,
  starty,
  endx,
  endy,
  controlx,
  controly,
  stepNum,
  ctx,
) {
  if (stepNum === 1) {
    actionLine(startx, starty, endx, endy, ctx)
  } else if (stepNum === 2) {
    let plotPoints = plotQuadBezier(startx, starty, controlx, controly, endx, endy)
    renderPoints(plotPoints, ctx)
  }
}

/**
 * User action for process to set control points for cubic bezier
 * @param {number} startx - (Integer)
 * @param {number} starty - (Integer)
 * @param {number} endx - (Integer)
 * @param {number} endy - (Integer)
 * @param {number} controlx1 - (Integer)
 * @param {number} controly1 - (Integer)
 * @param {number} controlx2 - (Integer)
 * @param {number} controly2 - (Integer)
 * @param {number} stepNum - (Integer)
 * @param {object} ctx - StrokeContext
 */
export function actionCubicCurve(
  startx,
  starty,
  endx,
  endy,
  controlx1,
  controly1,
  controlx2,
  controly2,
  stepNum,
  ctx,
) {
  if (stepNum === 1) {
    actionLine(startx, starty, endx, endy, ctx)
  } else if (stepNum === 2) {
    let plotPoints = plotQuadBezier(startx, starty, controlx1, controly1, endx, endy)
    renderPoints(plotPoints, ctx)
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
    renderPoints(plotPoints, ctx)
  }
}
