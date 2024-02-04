/**
 *
 * @param {Integer} width
 * @returns
 */
export const setInitialZoom = (width) => {
  const ratio = 256 / width
  switch (true) {
    case ratio >= 8:
      return 16
    case ratio >= 4:
      return 8
    case ratio >= 2:
      return 4
    case ratio >= 1:
      return 2
    case ratio >= 0.5:
      return 1
    default:
      return 0.5
  }
}

/**
 * Check if point is outside bounds
 * Used for reducing cost to render points and to restrict rendering outside selection
 * @param {Integer} x
 * @param {Integer} y
 * @param {Integer} brushSize
 * @param {Object} layer
 * @param {Object} boundaryBox
 * @param {Boolean} isInversed
 */
export const isOutOfBounds = (
  x,
  y,
  brushSize,
  layer,
  boundaryBox,
  isInversed
) => {
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
    if (isInversed) {
      if (
        x >= boundaryBox.xMin + brushSize / 2 &&
        x < boundaryBox.xMax - brushSize / 2 &&
        y >= boundaryBox.yMin + brushSize / 2 &&
        y < boundaryBox.yMax - brushSize / 2
      ) {
        return true
      }
    } else if (
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
 * @param {Integer|null} value
 * @param {Integer} minValue
 * @returns {Integer}
 */
export function minLimit(value, minValue) {
  return Math.max(minValue, value)
}

/**
 * @param {Integer|null} value
 * @param {Integer} maxValue
 * @returns {Integer}
 */
export function maxLimit(value, maxValue) {
  if (value !== null) {
    return Math.min(maxValue, value)
  }
  return maxValue
}
