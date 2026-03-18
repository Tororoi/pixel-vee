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
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {number} stepNum - (Integer)
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} layer - the affected layer
 * @param {object} currentModes - modes to be used for rendering
 * @param {object} brushStamp - entire brushStamp array with all directions
 * @param {number} brushSize - (Integer)
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by vector tools before line is confirmed
 * @param {object} [ditherPattern] - pattern object from ditherPatterns; when provided uses dither drawing
 * @param {boolean} [twoColorMode] - if true, "off" dither pixels use secondaryColor
 * @param {object} [secondaryColor] - {color, r, g, b, a} for two-color dither mode
 * @param {boolean} [mirrorX] - flip the dither pattern horizontally
 * @param {boolean} [mirrorY] - flip the dither pattern vertically
 */
export function actionQuadraticCurve(
  startx,
  starty,
  endx,
  endy,
  controlx,
  controly,
  boundaryBox,
  stepNum,
  currentColor,
  layer,
  currentModes,
  brushStamp,
  brushSize,
  maskSet,
  customContext = null,
  isPreview = false,
  ditherPattern = null,
  twoColorMode = false,
  secondaryColor = null,
  mirrorX = false,
  mirrorY = false,
) {
  if (stepNum === 1) {
    actionLine(
      startx,
      starty,
      endx,
      endy,
      boundaryBox,
      currentColor,
      layer,
      currentModes,
      brushStamp,
      brushSize,
      maskSet,
      null,
      customContext,
      isPreview,
      ditherPattern,
      twoColorMode,
      secondaryColor,
      mirrorX,
      mirrorY,
    )
  } else if (stepNum === 2) {
    let plotPoints = plotQuadBezier(
      startx,
      starty,
      controlx,
      controly,
      endx,
      endy,
    )
    renderPoints(
      plotPoints,
      boundaryBox,
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
      customContext,
      isPreview,
      ditherPattern,
      twoColorMode,
      secondaryColor,
      mirrorX,
      mirrorY,
    )
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
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {number} stepNum - (Integer)
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} layer - the affected layer
 * @param {object} currentModes - modes to be used for rendering
 * @param {object} brushStamp - entire brushStamp array with all directions
 * @param {number} brushSize - (Integer)
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by vector tools before line is confirmed
 * @param {object} [ditherPattern] - pattern object from ditherPatterns; when provided uses dither drawing
 * @param {boolean} [twoColorMode] - if true, "off" dither pixels use secondaryColor
 * @param {object} [secondaryColor] - {color, r, g, b, a} for two-color dither mode
 * @param {boolean} [mirrorX] - flip the dither pattern horizontally
 * @param {boolean} [mirrorY] - flip the dither pattern vertically
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
  boundaryBox,
  stepNum,
  currentColor,
  layer,
  currentModes,
  brushStamp,
  brushSize,
  maskSet,
  customContext = null,
  isPreview = false,
  ditherPattern = null,
  twoColorMode = false,
  secondaryColor = null,
  mirrorX = false,
  mirrorY = false,
) {
  if (stepNum === 1) {
    actionLine(
      startx,
      starty,
      endx,
      endy,
      boundaryBox,
      currentColor,
      layer,
      currentModes,
      brushStamp,
      brushSize,
      maskSet,
      null,
      customContext,
      isPreview,
      ditherPattern,
      twoColorMode,
      secondaryColor,
      mirrorX,
      mirrorY,
    )
  } else if (stepNum === 2) {
    let plotPoints = plotQuadBezier(
      startx,
      starty,
      controlx1,
      controly1,
      endx,
      endy,
    )
    renderPoints(
      plotPoints,
      boundaryBox,
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
      customContext,
      isPreview,
      ditherPattern,
      twoColorMode,
      secondaryColor,
      mirrorX,
      mirrorY,
    )
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
    renderPoints(
      plotPoints,
      boundaryBox,
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
      customContext,
      isPreview,
      ditherPattern,
      twoColorMode,
      secondaryColor,
      mirrorX,
      mirrorY,
    )
  }
}
