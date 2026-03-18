import { calculateBrushDirection } from '../../utils/drawHelpers.js'
import { actionDraw, actionDitherDraw } from './draw.js'

/**
 * Helper function. TODO: (Low Priority) move to external helper file for rendering
 * To render a pixel perfect curve, points are plotted instead of using t values, which are not equidistant.
 * @param {Array} points - array of points to render
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {object} brushStamp - entire brushStamp array with all directions
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {number} brushSize - (Integer)
 * @param {object} layer - the affected layer
 * @param {object} currentModes - modes to be used for rendering
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by vector tools before line is confirmed
 * @param {Array|null} ditherPattern - dither pattern array or null
 * @param {boolean} twoColorMode - whether two-color dither mode is active
 * @param {object|null} secondaryColor - secondary color {color, r, g, b, a} or null
 * @param {boolean} mirrorX - whether to mirror horizontally
 * @param {boolean} mirrorY - whether to mirror vertically
 */
export function renderPoints(
  points,
  boundaryBox,
  brushStamp,
  currentColor,
  brushSize,
  layer,
  currentModes,
  maskSet,
  customContext = null,
  isPreview = false,
  ditherPattern = null,
  twoColorMode = false,
  secondaryColor = null,
  mirrorX = false,
  mirrorY = false,
) {
  const seen = new Set()
  let previousX = Math.floor(points[0].x)
  let previousY = Math.floor(points[0].y)
  for (const { x, y } of points) {
    //rounded values
    let xt = Math.floor(x)
    let yt = Math.floor(y)
    let brushDirection = calculateBrushDirection(xt, yt, previousX, previousY)
    if (ditherPattern) {
      actionDitherDraw(
        xt,
        yt,
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
        xt,
        yt,
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
    previousX = xt
    previousY = yt
  }
}
