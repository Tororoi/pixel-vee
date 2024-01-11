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
 */
export const isOutOfBounds = (x, y, brushSize, layer, bounds, isInversed) => {
  // Precomputed values for efficiency
  const halfBrushSize = Math.floor(brushSize / 2)
  const xOutOfBounds =
    x >= layer.cvs.width + halfBrushSize || x < -halfBrushSize
  const yOutOfBounds =
    y >= layer.cvs.height + halfBrushSize || y < -halfBrushSize

  // Early exit if out of canvas bounds
  if (xOutOfBounds || yOutOfBounds) return true

  // Check bounds if defined
  if (bounds.xMin !== null) {
    if (isInversed) {
      if (
        x >= bounds.xMin + brushSize / 2 &&
        x < bounds.xMax - brushSize / 2 &&
        y >= bounds.yMin + brushSize / 2 &&
        y < bounds.yMax - brushSize / 2
      ) {
        return true
      }
    } else if (
      x >= bounds.xMax + brushSize / 2 ||
      x < bounds.xMin - brushSize / 2 ||
      y >= bounds.yMax + brushSize / 2 ||
      y < bounds.yMin - brushSize / 2
    ) {
      return true
    }
  }
  return false
}
