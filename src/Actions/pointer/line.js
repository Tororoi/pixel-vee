import { getTriangle, getAngle } from '../../utils/trig.js'
import { calculateBrushDirection } from '../../utils/drawHelpers.js'
import { actionDraw, actionDitherDraw } from './draw.js'

/**
 * Draws a pixel perfect line from point a to point b
 * @param {number} sx - (Integer)
 * @param {number} sy - (Integer)
 * @param {number} tx - (Integer)
 * @param {number} ty - (Integer)
 * @param {object} strokeCtx - StrokeContext (brushStamp used to select direction per step)
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
      actionDitherDraw(thispoint.x, thispoint.y, brushStamp[brushDirection], innerCtx)
    } else {
      actionDraw(thispoint.x, thispoint.y, brushStamp[brushDirection], innerCtx)
    }
    previousX = thispoint.x
    previousY = thispoint.y
  }
  //fill endpoint
  brushDirection = calculateBrushDirection(tx, ty, previousX, previousY)
  if (ditherPattern) {
    actionDitherDraw(tx, ty, brushStamp[brushDirection], innerCtx)
  } else {
    actionDraw(tx, ty, brushStamp[brushDirection], innerCtx)
  }
}
