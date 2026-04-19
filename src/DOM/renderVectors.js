import { canvas } from '../Context/canvas.js'
import { createDitherPatternSVG } from './renderBrush.js'

/**
 * Check if a vector action should be shown in the vectors list.
 * @param {object} vector - The vector action to check
 * @param {Set} undoStackSet - Set of actions currently in the undo stack
 * @returns {boolean} True if the vector should be displayed
 */
export const isValidVector = (vector, undoStackSet) =>
  !vector.removed &&
  !vector.layer?.removed &&
  undoStackSet.has(vector.action) &&
  (vector.layer === canvas.currentLayer ||
    (vector.layer === canvas.pastedLayer && canvas.currentLayer?.isPreview))

/**
 * Build an SVG thumbnail for a vector's dither pattern.
 * @param {object} pattern - pattern from ditherPatterns
 * @param {object} vector - the vector object
 * @returns {SVGElement} SVG element showing the dither pattern
 */
export function createVectorDitherPatternSVG(pattern, vector) {
  const offsetX = vector.ditherOffsetX ?? 0
  const offsetY = vector.ditherOffsetY ?? 0
  return createDitherPatternSVG(pattern, offsetX, offsetY)
}
