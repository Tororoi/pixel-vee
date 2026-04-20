import { renderPoints } from './helpers.js'

/**
 * Plot a line segment using Bresenham's algorithm and collect points.
 * @param {number} x0 - start x
 * @param {number} y0 - start y
 * @param {number} x1 - end x
 * @param {number} y1 - end y
 * @param {Function} addPoint - called with (x, y) for each pixel
 */
function plotSegment(x0, y0, x1, y1, addPoint) {
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  while (x0 !== x1 || y0 !== y1) {
    addPoint(x0, y0)
    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }
  addPoint(x0, y0)
}

/**
 * Draw a quadrilateral outline through 4 corners in order.
 * Works for axis-aligned polygons and rotated quads.
 * @param {number} px1 - corner 1 x
 * @param {number} py1 - corner 1 y
 * @param {number} px2 - corner 2 x
 * @param {number} py2 - corner 2 y
 * @param {number} px3 - corner 3 x
 * @param {number} py3 - corner 3 y
 * @param {number} px4 - corner 4 x
 * @param {number} py4 - corner 4 y
 * @param {object} strokeCtx - StrokeContext
 */
export function actionPolygon(
  px1,
  py1,
  px2,
  py2,
  px3,
  py3,
  px4,
  py4,
  strokeCtx,
) {
  const points = []
  const seen = new Set()

  /**
   * @param {number} x - pixel x
   * @param {number} y - pixel y
   */
  function addPoint(x, y) {
    const key = (y << 16) | (x & 0xffff)
    if (!seen.has(key)) {
      seen.add(key)
      points.push({ x, y })
    }
  }

  plotSegment(px1, py1, px2, py2, addPoint)
  plotSegment(px2, py2, px3, py3, addPoint)
  plotSegment(px3, py3, px4, py4, addPoint)
  plotSegment(px4, py4, px1, py1, addPoint)

  if (points.length > 0) {
    renderPoints(points, strokeCtx)
  }
}
