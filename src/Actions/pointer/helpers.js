import { calculateBrushDirection } from '../../utils/drawHelpers.js'
import { actionDraw, actionDitherDraw } from './draw.js'

/**
 * Render a pre-computed list of pixel coordinates using the brush stamp.
 *
 * Used by `actionCurve` and `actionEllipse` to paint the point arrays
 * returned by their respective math utilities. For each point the brush
 * direction is recalculated from the movement delta relative to the previous
 * point so the directional brush stamp (e.g. a diagonal brush shape) rotates
 * to match the stroke direction.
 *
 * A shared `seenPixelsSet` is maintained across all points in the list to
 * prevent the same pixel from being stamped more than once — important for
 * curved paths where adjacent stamps can overlap significantly.
 *
 * Delegates to `actionDitherDraw` when `strokeCtx.ditherPattern` is set,
 * otherwise to `actionDraw` for solid rendering.
 * @param {Array<{x: number, y: number}>} points - Ordered list of pixel
 *   coordinates to render, as returned by the bezier / ellipse plotters.
 * @param {object} strokeCtx - StrokeContext for this render pass. The
 *   `brushStamp` and `ditherPattern` fields are used here.
 */
export function renderPoints(points, strokeCtx) {
  const { brushStamp, ditherPattern } = strokeCtx
  const seen = new Set()
  // Shallow-copy the context so the caller's seenPixelsSet is not mutated,
  // but all points in this call share one seen set to avoid overdraw.
  const innerCtx = { ...strokeCtx, seenPixelsSet: seen }
  let previousX = Math.floor(points[0].x)
  let previousY = Math.floor(points[0].y)
  for (const { x, y } of points) {
    //rounded values
    let truncatedX = Math.floor(x)
    let truncatedY = Math.floor(y)
    let brushDirection = calculateBrushDirection(
      truncatedX,
      truncatedY,
      previousX,
      previousY,
    )
    if (ditherPattern) {
      actionDitherDraw(
        truncatedX,
        truncatedY,
        brushStamp[brushDirection],
        innerCtx,
      )
    } else {
      actionDraw(truncatedX, truncatedY, brushStamp[brushDirection], innerCtx)
    }
    previousX = truncatedX
    previousY = truncatedY
  }
}
