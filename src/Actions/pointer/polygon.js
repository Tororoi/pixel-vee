import { renderPoints } from './helpers.js'

/**
 * Rasterize a single line segment using Bresenham's algorithm.
 *
 * Walks from (x0, y0) to (x1, y1) and calls `addPoint` for every pixel on
 * the ideal line, including both endpoints. The Bresenham error accumulator
 * ensures each step advances by exactly one pixel in the dominant axis,
 * producing a connected, gap-free segment with no floating-point artifacts.
 * @param {number} x0 - Start X (integer).
 * @param {number} y0 - Start Y (integer).
 * @param {number} x1 - End X (integer).
 * @param {number} y1 - End Y (integer).
 * @param {Function} addPoint - Called with `(x, y)` for each pixel on the
 *   segment. Responsible for deduplication and collecting the result.
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
 * Draw the outline of a quadrilateral through four corner points.
 *
 * Traces the four edges of the quad in order (1→2, 2→3, 3→4, 4→1) using
 * Bresenham's line algorithm for each segment. A shared deduplication set
 * ensures corner pixels shared by two adjacent segments are only rendered
 * once, which matters for dither consistency at join points.
 *
 * Works for any quadrilateral: axis-aligned rectangles, rotated rectangles,
 * parallelograms, and arbitrary convex or concave quads.
 * @param {number} px1 - X of corner 1 (integer).
 * @param {number} py1 - Y of corner 1 (integer).
 * @param {number} px2 - X of corner 2 (integer).
 * @param {number} py2 - Y of corner 2 (integer).
 * @param {number} px3 - X of corner 3 (integer).
 * @param {number} py3 - Y of corner 3 (integer).
 * @param {number} px4 - X of corner 4 (integer).
 * @param {number} py4 - Y of corner 4 (integer).
 * @param {object} strokeCtx - StrokeContext for this render pass.
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
   * Collect a pixel coordinate, skipping duplicates so corner pixels shared
   * by two segments are not stamped twice.
   * @param {number} x - pixel x
   * @param {number} y - pixel y
   */
  function addPoint(x, y) {
    // Pack x and y into a single integer key for O(1) deduplication.
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
