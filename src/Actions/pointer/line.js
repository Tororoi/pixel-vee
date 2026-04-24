import { getTriangle, getAngle } from '../../utils/trig.js'
import { calculateBrushDirection } from '../../utils/drawHelpers.js'
import { actionDraw, actionDitherDraw } from './draw.js'

/**
 * Draw a pixel-perfect line from point (sx, sy) to point (tx, ty).
 *
 * Steps along the line using a triangle/angle parameterization: the angle
 * between start and end is computed, then each step advances by the fractional
 * x and y increments that correspond to one pixel along that angle. This
 * produces an evenly-spaced, gap-free line.
 *
 * At each point the brush direction is recalculated from the previous point
 * so that directional brush stamps rotate to follow the stroke angle. The
 * endpoint (tx, ty) is always stamped explicitly after the loop to ensure
 * it is never dropped due to rounding at the end of the last step.
 *
 * A private seen-pixels set is used so that overdraw from large brush stamps
 * on overlapping steps is prevented, without mutating the caller's set. If
 * the caller provided a seenPixelsSet it is used as the initial seed for
 * the private set so that deduplication spans the full composite operation.
 *
 * Delegates to `actionDitherDraw` when `strokeCtx.ditherPattern` is set,
 * otherwise to `actionDraw`.
 * @param {number} sx - X coordinate of the line start point (integer).
 * @param {number} sy - Y coordinate of the line start point (integer).
 * @param {number} tx - X coordinate of the line end point (integer).
 * @param {number} ty - Y coordinate of the line end point (integer).
 * @param {object} strokeCtx - StrokeContext for this render pass.
 */
export function actionLine(sx, sy, tx, ty, strokeCtx) {
  const { brushStamp, seenPixelsSet, ditherPattern } = strokeCtx
  // actionLine manages its own seen set — it's either a fresh set or a copy of
  // the caller's seen set so that deduplication works but the caller's set is
  // not mutated by the line draw.
  const seen = seenPixelsSet ? new Set(seenPixelsSet) : new Set()
  const innerCtx = { ...strokeCtx, seenPixelsSet: seen }

  let angle = getAngle(tx - sx, ty - sy) // angle of line
  let tri = getTriangle(sx, sy, tx, ty, angle)
  let previousX = sx
  let previousY = sy
  let brushDirection = '0,0'
  for (let i = 0; i < tri.long; i++) {
    let thispoint = {
      x: Math.round(sx + tri.x * i),
      y: Math.round(sy + tri.y * i),
    }
    brushDirection = calculateBrushDirection(
      thispoint.x,
      thispoint.y,
      previousX,
      previousY,
    )
    // for each point along the line
    if (ditherPattern) {
      actionDitherDraw(
        thispoint.x,
        thispoint.y,
        brushStamp[brushDirection],
        innerCtx,
      )
    } else {
      actionDraw(thispoint.x, thispoint.y, brushStamp[brushDirection], innerCtx)
    }
    previousX = thispoint.x
    previousY = thispoint.y
  }
  // Explicitly stamp the endpoint to guarantee it is never skipped when
  // rounding causes the final loop iteration to land one pixel short.
  brushDirection = calculateBrushDirection(tx, ty, previousX, previousY)
  if (ditherPattern) {
    actionDitherDraw(tx, ty, brushStamp[brushDirection], innerCtx)
  } else {
    actionDraw(tx, ty, brushStamp[brushDirection], innerCtx)
  }
}
