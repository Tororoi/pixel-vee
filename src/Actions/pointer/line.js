import { getTriangle, getAngle } from '../../utils/trig.js'
import { calculateBrushDirection } from '../../utils/drawHelpers.js'
import { actionDraw, actionDitherDraw } from './draw.js'

/**
 * Draws a pixel perfect line from point a to point b
 * @param {number} sx - (Integer)
 * @param {number} sy - (Integer)
 * @param {number} tx - (Integer)
 * @param {number} ty - (Integer)
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} layer - the affected layer
 * @param {object} currentModes - modes to be used for rendering
 * @param {object} brushStamp - entire brushStamp array with all directions
 * @param {number} brushSize - (Integer)
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {Set} seenPixelsSet - set of coordinates already drawn on
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by line tool and brush tool before line is confirmed
 * @param {object} [ditherPattern] - pattern object from ditherPatterns; when provided uses dither drawing
 * @param {boolean} [twoColorMode] - if true, "off" dither pixels use secondaryColor
 * @param {object} [secondaryColor] - {color, r, g, b, a} for two-color dither mode
 * @param {boolean} [mirrorX] - flip the dither pattern horizontally
 * @param {boolean} [mirrorY] - flip the dither pattern vertically
 */
export function actionLine(
  sx,
  sy,
  tx,
  ty,
  boundaryBox,
  currentColor,
  layer,
  currentModes,
  brushStamp,
  brushSize,
  maskSet,
  seenPixelsSet = null,
  customContext = null,
  isPreview = false,
  ditherPattern = null,
  twoColorMode = false,
  secondaryColor = null,
  mirrorX = false,
  mirrorY = false,
) {
  let angle = getAngle(tx - sx, ty - sy) // angle of line
  let tri = getTriangle(sx, sy, tx, ty, angle)
  const seen = seenPixelsSet ? new Set(seenPixelsSet) : new Set()
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
        boundaryBox,
        currentColor,
        brushStamp[brushDirection],
        brushSize,
        layer,
        currentModes,
        maskSet,
        seen,
        ditherPattern,
        twoColorMode,
        secondaryColor,
        mirrorX,
        mirrorY,
        customContext,
        isPreview,
      )
    } else {
      actionDraw(
        thispoint.x,
        thispoint.y,
        boundaryBox,
        currentColor,
        brushStamp[brushDirection],
        brushSize,
        layer,
        currentModes,
        maskSet,
        seen,
        customContext,
        isPreview,
      )
    }
    previousX = thispoint.x
    previousY = thispoint.y
  }
  //fill endpoint
  brushDirection = calculateBrushDirection(tx, ty, previousX, previousY)
  if (ditherPattern) {
    actionDitherDraw(
      tx,
      ty,
      boundaryBox,
      currentColor,
      brushStamp[brushDirection],
      brushSize,
      layer,
      currentModes,
      maskSet,
      seen,
      ditherPattern,
      twoColorMode,
      secondaryColor,
      mirrorX,
      mirrorY,
      customContext,
      isPreview,
    )
  } else {
    actionDraw(
      tx,
      ty,
      boundaryBox,
      currentColor,
      brushStamp[brushDirection],
      brushSize,
      layer,
      currentModes,
      maskSet,
      seen,
      customContext,
      isPreview,
    )
  }
}
