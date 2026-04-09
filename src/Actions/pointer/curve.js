import { plotCubicBezier, plotQuadBezier } from '../../utils/bezier.js'
import { actionLine } from './line.js'
import { renderPoints } from './helpers.js'

/**
 * User action for process to set control points for curve (line, quadratic, cubic bezier)
 * @param {number} startx - (Integer)
 * @param {number} starty - (Integer)
 * @param {number} endx - (Integer)
 * @param {number} endy - (Integer)
 * @param {number} controlx1 - (Integer)
 * @param {number} controly1 - (Integer)
 * @param {number} controlx2 - (Integer)
 * @param {number} controly2 - (Integer)
 * @param {number} stepNum - (Integer)
 * @param {object} strokeCtx - StrokeContext
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
