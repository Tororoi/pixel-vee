import { getTriangle, getAngle } from "../utils/trig.js"

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed")
  }
}

export function plotQuadBezier(x0, y0, x1, y1, x2, y2) {
  let plotPoints = []
  //Bresenham's algorithm for bezier limited to gradients without sign change.
  function plotQuadBezierSeg(x0, y0, x1, y1, x2, y2, color) {
    let sx = x2 - x1,
      sy = y2 - y1
    let xx = x0 - x1,
      yy = y0 - y1,
      xy /* relative values for checks */
    let dx,
      dy,
      err,
      cur = xx * sy - yy * sx /* curvature */

    assert(
      xx * sx <= 0 && yy * sy <= 0,
      "sign of gradient must not change"
    ) /* sign of gradient must not change */

    if (sx * sx + sy * sy > xx * xx + yy * yy) {
      /* begin with longer part */
      x2 = x0
      x0 = sx + x1
      y2 = y0
      y0 = sy + y1
      cur = -cur /* swap P0 P2 */
    }
    if (cur != 0) {
      /* no straight line */
      xx += sx
      xx *= sx = x0 < x2 ? 1 : -1 /* x step direction */
      yy += sy
      yy *= sy = y0 < y2 ? 1 : -1 /* y step direction */
      xy = 2 * xx * yy
      xx *= xx
      yy *= yy /* differences 2nd degree */
      if (cur * sx * sy < 0) {
        /* negated curvature? */
        xx = -xx
        yy = -yy
        xy = -xy
        cur = -cur
      }
      dx = 4.0 * sy * cur * (x1 - x0) + xx - xy /* differences 1st degree */
      dy = 4.0 * sx * cur * (y0 - y1) + yy - xy
      xx += xx
      yy += yy
      err = dx + dy + xy /* error 1st step */
      while (dy < dx) {
        /* gradient negates -> algorithm fails */
        // plot(x0, y0) /* plot curve */
        plotPoints.push({ x: x0, y: y0, color })
        if (x0 == x2 && y0 == y2) return /* last pixel -> curve finished */
        y1 = 2 * err < dx /* save value for test of y step */
        if (2 * err > dy) {
          x0 += sx
          dx -= xy
          err += dy += yy
        } /* x step */
        if (y1) {
          y0 += sy
          dy -= xy
          err += dx += xx
        } /* y step */
      }
    }
    /* plot remaining part to end */
    let angle = getAngle(x2 - x0, y2 - y0) // angle of line
    let tri = getTriangle(x0, y0, x2, y2, angle)

    for (let i = 0; i < tri.long; i++) {
      let thispoint = {
        x: Math.round(x0 + tri.x * i),
        y: Math.round(y0 + tri.y * i),
      }
      // for each point along the line
      // plot(thispoint.x, thispoint.y)
      plotPoints.push({
        x: thispoint.x,
        y: thispoint.y,
        color,
      })
    }
    //fill endpoint
    // plot(x2, y2)
    plotPoints.push({ x: x2, y: y2, color })
  }
  /* plot any quadratic Bezier curve */
  let x = x0 - x1,
    y = y0 - y1
  let t = x0 - 2 * x1 + x2,
    r
  if (x * (x2 - x1) > 0) {
    /* horizontal cut at P4? */
    if (y * (y2 - y1) > 0)
      if (Math.abs(((y0 - 2 * y1 + y2) * x) / t) > Math.abs(y)) {
        /* vertical cut at P6 too? */
        /* which first? */
        x0 = x2
        x2 = x + x1
        y0 = y2
        y2 = y + y1 /* swap points */
      } /* now horizontal cut at P4 comes first */
    t = (x0 - x1) / t
    r = (1 - t) * ((1 - t) * y0 + 2.0 * t * y1) + t * t * y2 /* By(t=P4) */
    t = ((x0 * x2 - x1 * x1) * t) / (x0 - x1) /* gradient dP4/dx=0 */
    x = Math.floor(t + 0.5)
    y = Math.floor(r + 0.5)
    r = ((y1 - y0) * (t - x0)) / (x1 - x0) + y0 /* intersect P3 | P0 P1 */
    plotQuadBezierSeg(x0, y0, x, Math.floor(r + 0.5), x, y, `rgba(255,0,0,255)`)
    r = ((y1 - y2) * (t - x2)) / (x1 - x2) + y2 /* intersect P4 | P1 P2 */
    x0 = x1 = x
    y0 = y
    y1 = Math.floor(r + 0.5) /* P0 = P4, P1 = P8 */
  }
  if ((y0 - y1) * (y2 - y1) > 0) {
    /* vertical cut at P6? */
    t = y0 - 2 * y1 + y2
    t = (y0 - y1) / t
    r = (1 - t) * ((1 - t) * x0 + 2.0 * t * x1) + t * t * x2 /* Bx(t=P6) */
    t = ((y0 * y2 - y1 * y1) * t) / (y0 - y1) /* gradient dP6/dy=0 */
    x = Math.floor(r + 0.5)
    y = Math.floor(t + 0.5)
    r = ((x1 - x0) * (t - y0)) / (y1 - y0) + x0 /* intersect P6 | P0 P1 */
    plotQuadBezierSeg(x0, y0, Math.floor(r + 0.5), y, x, y, `rgba(0,255,0,255)`)
    r = ((x1 - x2) * (t - y2)) / (y1 - y2) + x2 /* intersect P7 | P1 P2 */
    x0 = x
    x1 = Math.floor(r + 0.5)
    y0 = y1 = y /* P0 = P6, P1 = P7 */
  }
  plotQuadBezierSeg(x0, y0, x1, y1, x2, y2, `rgba(0,0,255,255)`)
  /* remaining part */
  return plotPoints
}
