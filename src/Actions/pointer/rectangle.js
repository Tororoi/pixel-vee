import { renderPoints } from './helpers.js'

/**
 * Plot the 4 sides of an axis-aligned rectangle outline.
 * @param {number} px1 - first corner x
 * @param {number} py1 - first corner y
 * @param {number} px2 - opposite corner x
 * @param {number} py2 - opposite corner y
 * @param {object} strokeCtx - StrokeContext
 */
export function actionRectangle(px1, py1, px2, py2, strokeCtx) {
  const xMin = Math.min(px1, px2)
  const xMax = Math.max(px1, px2)
  const yMin = Math.min(py1, py2)
  const yMax = Math.max(py1, py2)

  const points = []
  const seen = new Set()

  /**
   * @param {number} x
   * @param {number} y
   */
  function addPoint(x, y) {
    const key = (y << 16) | (x & 0xffff)
    if (!seen.has(key)) {
      seen.add(key)
      points.push({ x, y })
    }
  }

  // Top edge: left to right
  for (let x = xMin; x <= xMax; x++) addPoint(x, yMin)
  // Right edge: top+1 to bottom
  for (let y = yMin + 1; y <= yMax; y++) addPoint(xMax, y)
  // Bottom edge: right-1 to left (only if different row)
  if (yMax !== yMin) {
    for (let x = xMax - 1; x >= xMin; x--) addPoint(x, yMax)
  }
  // Left edge: bottom-1 to top+1 (only if different column)
  if (xMax !== xMin) {
    for (let y = yMax - 1; y >= yMin + 1; y--) addPoint(xMin, y)
  }

  if (points.length > 0) {
    renderPoints(points, strokeCtx)
  }
}
