import { ZOOM_LEVELS } from './constants.js'

/**
 * Find the largest zoom level where the canvas fits entirely within the container.
 * @param {number} canvasWidth - art canvas width in pixels (Integer)
 * @param {number} canvasHeight - art canvas height in pixels (Integer)
 * @param {number} containerWidth - available container width in CSS pixels (Integer)
 * @param {number} containerHeight - available container height in CSS pixels (Integer)
 * @returns {number} - zoom level (Float)
 */
export const setInitialZoom = (
  canvasWidth,
  canvasHeight,
  containerWidth,
  containerHeight,
) => {
  for (let i = ZOOM_LEVELS.length - 1; i >= 0; i--) {
    const zoom = ZOOM_LEVELS[i]
    if (
      canvasWidth * zoom <= containerWidth &&
      canvasHeight * zoom <= containerHeight
    ) {
      return zoom
    }
  }
  return ZOOM_LEVELS[0]
}

/**
 * Check if point is outside bounds
 * Used for reducing cost to render points and to restrict rendering outside selection
 * @param {number} x - (Integer)
 * @param {number} y - (Integer)
 * @param {number} brushSize - (Integer)
 * @param {object} layer - used for canvas dimensions
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @returns {boolean} - true if point is outside bounds
 */
export const isOutOfBounds = (x, y, brushSize, layer, boundaryBox) => {
  // Precomputed values for efficiency
  const halfBrushSize = Math.floor(brushSize / 2)
  const xOutOfBounds =
    x >= layer.cvs.width + halfBrushSize || x < -halfBrushSize
  const yOutOfBounds =
    y >= layer.cvs.height + halfBrushSize || y < -halfBrushSize

  // Early exit if out of canvas bounds
  if (xOutOfBounds || yOutOfBounds) return true

  // Check bounds if defined
  if (boundaryBox.xMin !== null) {
    if (
      x >= boundaryBox.xMax + brushSize / 2 ||
      x < boundaryBox.xMin - brushSize / 2 ||
      y >= boundaryBox.yMax + brushSize / 2 ||
      y < boundaryBox.yMin - brushSize / 2
    ) {
      return true
    }
  }
  return false
}

/**
 * @param {number|null} value - (Integer)
 * @param {number} minValue - (Integer)
 * @returns {number} - (Integer)
 */
export function minLimit(value, minValue) {
  return Math.max(minValue, value)
}

/**
 * @param {number|null} value - (Integer)
 * @param {number} maxValue - (Integer)
 * @returns {number} - (Integer)
 */
export function maxLimit(value, maxValue) {
  if (value !== null) {
    return Math.min(maxValue, value)
  }
  return maxValue
}
