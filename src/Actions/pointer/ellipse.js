import { plotRotatedEllipseConics } from '../../utils/ellipse.js'
import { renderPoints } from './helpers.js'

/**
 * User action for process to set control points for ellipse based on vertices
 * @param {number} weight - (Integer)
 * @param {number} leftTangentX - (Integer)
 * @param {number} leftTangentY - (Integer)
 * @param {number} topTangentX - (Integer)
 * @param {number} topTangentY - (Integer)
 * @param {number} rightTangentX - (Integer)
 * @param {number} rightTangentY - (Integer)
 * @param {number} bottomTangentX - (Integer)
 * @param {number} bottomTangentY - (Integer)
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
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
export function actionEllipse(
  weight,
  leftTangentX,
  leftTangentY,
  topTangentX,
  topTangentY,
  rightTangentX,
  rightTangentY,
  bottomTangentX,
  bottomTangentY,
  boundaryBox,
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
  const plotPoints = plotRotatedEllipseConics(
    weight,
    leftTangentX,
    leftTangentY,
    topTangentX,
    topTangentY,
    rightTangentX,
    rightTangentY,
    bottomTangentX,
    bottomTangentY,
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
