import { calculateBrushDirection } from '../../utils/drawHelpers.js'
import { actionDraw, actionDitherDraw } from './draw.js'

/**
 * Render a series of pre-computed points using the brush stamp.
 * Used by curve and ellipse actions for pixel-perfect rendering.
 * @param {Array} points - array of {x, y} points to render
 * @param {object} strokeCtx - StrokeContext (brushStamp used to select direction per step)
 */
export function renderPoints(points, strokeCtx) {
  const { brushStamp, ditherPattern } = strokeCtx
  const seen = new Set()
  const innerCtx = { ...strokeCtx, seenPixelsSet: seen }
  let previousX = Math.floor(points[0].x)
  let previousY = Math.floor(points[0].y)
  for (const { x, y } of points) {
    //rounded values
    let xt = Math.floor(x)
    let yt = Math.floor(y)
    let brushDirection = calculateBrushDirection(xt, yt, previousX, previousY)
    if (ditherPattern) {
      actionDitherDraw(xt, yt, brushStamp[brushDirection], innerCtx)
    } else {
      actionDraw(xt, yt, brushStamp[brushDirection], innerCtx)
    }
    previousX = xt
    previousY = yt
  }
}
