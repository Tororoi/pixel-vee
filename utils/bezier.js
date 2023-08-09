import { getTriangle, getAngle } from "../utils/trig.js"
import { generateRandomRGB } from "../utils/colors.js"

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed")
  }
}

/**
 *
 * @param {*} x0 - startX
 * @param {*} y0 - startY
 * @param {*} x1 - ctrlX
 * @param {*} y1 - ctrlY
 * @param {*} x2 - endX
 * @param {*} y2 - endY
 * @returns
 */
export function plotQuadBezier(x0, y0, x1, y1, x2, y2) {
  let plotPoints = []
  //Bresenham's algorithm for bezier limited to gradients without sign change.
  function plotQuadBezierSeg(x0, y0, x1, y1, x2, y2, color) {
    //difference between endpoint and control point
    let sx = x2 - x1,
      sy = y2 - y1
    //difference between start point and control point
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
    /* plot remaining part to end
     * This is for the last segment, typically a straight or diagonal line
     */
    let angle = getAngle(x2 - x0, y2 - y0) // angle of line
    let tri = getTriangle(x0, y0, x2, y2, angle)

    for (let i = 0; i < tri.long; i++) {
      let thispoint = {
        x: Math.round(x0 + tri.x * i),
        y: Math.round(y0 + tri.y * i),
      }
      // for each point along the line
      plotPoints.push({
        x: thispoint.x,
        y: thispoint.y,
        color,
      })
    }
    //fill endpoint
    plotPoints.push({ x: x2, y: y2, color })
  }
  /* plot any quadratic Bezier curve */
  let deltaX = x0 - x1,
    deltaY = y0 - y1
  let t = x0 - 2 * x1 + x2,
    r
  /* sign change in the x coordinates */
  if (deltaX * (x2 - x1) > 0) {
    /* horizontal cut at P4? */
    if (deltaY * (y2 - y1) > 0)
      if (Math.abs(((y0 - 2 * y1 + y2) * deltaX) / t) > Math.abs(deltaY)) {
        /* vertical cut at P6 too? */
        /* which first? */
        x0 = x2
        x2 = deltaX + x1
        y0 = y2
        y2 = deltaY + y1 /* swap points */
      } /* now horizontal cut at P4 comes first */
    t = (x0 - x1) / t
    r = (1 - t) * ((1 - t) * y0 + 2.0 * t * y1) + t * t * y2 /* By(t=P4) */
    t = ((x0 * x2 - x1 * x1) * t) / (x0 - x1) /* gradient dP4/dx=0 */
    deltaX = Math.floor(t + 0.5)
    deltaY = Math.floor(r + 0.5)
    r = ((y1 - y0) * (t - x0)) / (x1 - x0) + y0 /* intersect P3 | P0 P1 */
    plotQuadBezierSeg(
      x0,
      y0,
      deltaX,
      Math.floor(r + 0.5),
      deltaX,
      deltaY,
      `rgba(255,0,0,255)`
    )
    //plot control point for segment
    plotPoints.push({
      x: deltaX,
      y: Math.floor(r + 0.5),
      color: `rgba(255,150,0,255)`,
    })
    r = ((y1 - y2) * (t - x2)) / (x1 - x2) + y2 /* intersect P4 | P1 P2 */
    x0 = x1 = deltaX
    y0 = deltaY
    y1 = Math.floor(r + 0.5) /* P0 = P4, P1 = P8 */
  }
  /* sign change in the y coordinates */
  if ((y0 - y1) * (y2 - y1) > 0) {
    /* vertical cut at P6? */
    t = y0 - 2 * y1 + y2
    t = (y0 - y1) / t
    r = (1 - t) * ((1 - t) * x0 + 2.0 * t * x1) + t * t * x2 /* Bx(t=P6) */
    t = ((y0 * y2 - y1 * y1) * t) / (y0 - y1) /* gradient dP6/dy=0 */
    deltaX = Math.floor(r + 0.5)
    deltaY = Math.floor(t + 0.5)
    r = ((x1 - x0) * (t - y0)) / (y1 - y0) + x0 /* intersect P6 | P0 P1 */
    plotQuadBezierSeg(
      x0,
      y0,
      Math.floor(r + 0.5),
      deltaY,
      deltaX,
      deltaY,
      `rgba(0,255,0,255)`
    )
    //plot control point for segment
    plotPoints.push({
      x: Math.floor(r + 0.5),
      y: deltaY,
      color: `rgba(0,255,150,255)`,
    })
    r = ((x1 - x2) * (t - y2)) / (y1 - y2) + x2 /* intersect P7 | P1 P2 */
    x0 = deltaX
    x1 = Math.floor(r + 0.5)
    y0 = y1 = deltaY /* P0 = P6, P1 = P7 */
  }
  /* if no sign changes in x or y coordinates, only this segment will be generated */
  plotQuadBezierSeg(x0, y0, x1, y1, x2, y2, `rgba(0,0,255,255)`)
  //plot control point for segment
  plotPoints.push({
    x: x1,
    y: y1,
    color: `rgba(150,0,255,255)`,
  })
  /* remaining part */
  return plotPoints
}

//IN PROGRESS
//NEXT STEP: subdivide the curve into segments (each a cubic bezier)
//where each segment does not have any sign changes for x or y.
//Then, based on whether there is more x or y values (based on slope), plot each point for a given x or y value.
//It is important that for at least one axis, there are no repeating values.
// export function plotCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3) {
//   function calculateBezier(t, p0, p1, p2, p3) {
//     const u = 1 - t
//     const tt = t * t
//     const uu = u * u
//     const uuu = uu * u
//     const ttt = tt * t
//     return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3
//   }

//   function bezierPixels(x0, y0, x1, y1, x2, y2, x3, y3) {
//     const steps = 100 // Adjust this for more or fewer points
//     const deltaT = 1 / steps
//     let points = []
//     for (let i = 0; i <= steps; i++) {
//       let t = deltaT * i
//       let x = Math.round(calculateBezier(t, x0, x1, x2, x3))
//       let y = Math.round(calculateBezier(t, y0, y1, y2, y3))
//       points.push({ x, y })
//     }
//     return points
//   }

//   // Test
//   return bezierPixels(x0, y0, x1, y1, x2, y2, x3, y3)
// }

/**
 *
 * @param {*} x0 - startX
 * @param {*} y0 - startY
 * @param {*} x1 - ctrlX1
 * @param {*} y1 - ctrlY1
 * @param {*} x2 - ctrlX2
 * @param {*} y2 - ctrlY2
 * @param {*} x3 - endX
 * @param {*} y3 - endY
 * @returns
 */
export function plotCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3) {
  let plotPoints = []
  //Bresenham's algorithm for bezier limited to gradients without sign change.
  function plotQuadBezierSeg(x0, y0, x1, y1, x2, y2, color) {
    //difference between endpoint and control point
    let sx = x2 - x1,
      sy = y2 - y1
    //difference between start point and control point
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
    /* plot remaining part to end
     * This is for the last segment, typically a straight or diagonal line
     */
    let angle = getAngle(x2 - x0, y2 - y0) // angle of line
    let tri = getTriangle(x0, y0, x2, y2, angle)

    for (let i = 0; i < tri.long; i++) {
      let thispoint = {
        x: Math.round(x0 + tri.x * i),
        y: Math.round(y0 + tri.y * i),
      }
      // for each point along the line
      plotPoints.push({
        x: thispoint.x,
        y: thispoint.y,
        color,
      })
    }
    //fill endpoint
    plotPoints.push({ x: x2, y: y2, color })
  }
  //Bresenham's algorithm for bezier limited to gradients without sign change.
  function plotCubicBezierSeg(x0, y0, x1, y1, x2, y2, x3, y3, color) {
    let f,
      fx,
      fy,
      leg = 1
    let sx = x0 < x3 ? 1 : -1,
      sy = y0 < y3 ? 1 : -1 // step direction
    let xc = -Math.abs(x0 + x1 - x2 - x3)
    let xa = xc - 4 * sx * (x1 - x2)
    let xb = sx * (x0 - x1 - x2 + x3)
    let yc = -Math.abs(y0 + y1 - y2 - y3)
    let ya = yc - 4 * sy * (y1 - y2)
    let yb = sy * (y0 - y1 - y2 + y3)
    let ab,
      ac,
      bc,
      cb,
      xx,
      xy,
      yy,
      dx,
      dy,
      ex,
      pxy,
      EP = 0.01

    // check for curve restrains
    if (
      !(
        (x1 - x0) * (x2 - x3) < EP &&
        ((x3 - x0) * (x1 - x2) < EP || xb * xb < xa * xc + EP)
      )
    ) {
      throw new Error("Curve constraint violation")
    }

    if (
      !(
        (y1 - y0) * (y2 - y3) < EP &&
        ((y3 - y0) * (y1 - y2) < EP || yb * yb < ya * yc + EP)
      )
    ) {
      throw new Error("Curve constraint violation")
    }

    if (xa === 0 && ya === 0) {
      // quadratic Bezier
      sx = Math.floor((3 * x1 - x0 + 1) / 2)
      sy = Math.floor((3 * y1 - y0 + 1) / 2)
      return plotQuadBezierSeg(x0, y0, sx, sy, x3, y3, color)
    }

    x1 = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + 1
    x2 = (x2 - x3) * (x2 - x3) + (y2 - y3) * (y2 - y3) + 1

    do {
      ab = xa * yb - xb * ya
      ac = xa * yc - xc * ya
      bc = xb * yc - xc * yb
      ex = ab * (ab + ac - 3 * bc) + ac * ac
      f = ex > 0 ? 1 : Math.sqrt(1 + 1024 / x1)

      ab *= f
      ac *= f
      bc *= f
      ex *= f * f
      xy = (9 * (ab + ac + bc)) / 8
      cb = 8 * (xa - ya)
      dx =
        (27 * (8 * ab * (yb * yb - ya * yc) + ex * (ya + 2 * yb + yc))) / 64 -
        ya * ya * (xy - ya)
      dy =
        (27 * (8 * ab * (xb * xb - xa * xc) - ex * (xa + 2 * xb + xc))) / 64 -
        xa * xa * (xy + xa)
      xx =
        (3 *
          (3 * ab * (3 * yb * yb - ya * ya - 2 * ya * yc) -
            ya * (3 * ac * (ya + yb) + ya * cb))) /
        4
      yy =
        (3 *
          (3 * ab * (3 * xb * xb - xa * xa - 2 * xa * xc) -
            xa * (3 * ac * (xa + xb) + xa * cb))) /
        4

      xy = xa * ya * (6 * ab + 6 * ac - 3 * bc + cb)
      ac = ya * ya
      cb = xa * xa

      xy =
        (3 * (xy + 9 * f * (cb * yb * yc - xb * xc * ac) - 18 * xb * yb * ab)) /
        8

      if (ex < 0) {
        dx = -dx
        dy = -dy
        xx = -xx
        yy = -yy
        xy = -xy
        ac = -ac
        cb = -cb
      }

      ab = 6 * ya * ac
      ac = -6 * xa * ac
      bc = 6 * ya * cb
      cb = -6 * xa * cb

      dx += xy
      ex = dx + dy
      dy += xy

      for (pxy = xy, fx = fy = f; x0 !== x3 && y0 !== y3; ) {
        plotPoints.push({
          x: x0,
          y: y0,
          color,
        })

        do {
          if (dx > pxy || dy < pxy) break

          y1 = 2 * ex - dy
          if (2 * ex >= dx) {
            fx--
            ex += dx += xx
            dy += xy += ac
            yy += bc
            xx += ab
          }

          if (y1 <= 0) {
            fy--
            ex += dy += yy
            dx += xy += bc
            xx += ac
            yy += cb
          }
        } while (fx > 0 && fy > 0)

        if (!(2 * fx <= f) && !(2 * fy <= f)) {
          break
        }

        if (2 * fx <= f) {
          x0 += sx
          fx += f
        }

        if (2 * fy <= f) {
          y0 += sy
          fy += f
        }

        if (pxy === xy && dx < 0 && dy > 0) pxy = EP
      }

      xx = x0
      x0 = x3
      x3 = xx
      sx = -sx
      xb = -xb
      yy = y0
      y0 = y3
      y3 = yy
      sy = -sy
      yb = -yb
      x1 = x2
    } while (leg--)

    /* plot remaining part to end
     * This is for the last segment, typically a straight or diagonal line
     */
    let angle = getAngle(x3 - x0, y3 - y0) // angle of line
    let tri = getTriangle(x0, y0, x3, y3, angle)

    for (let i = 0; i < tri.long; i++) {
      let thispoint = {
        x: Math.round(x0 + tri.x * i),
        y: Math.round(y0 + tri.y * i),
      }
      // for each point along the line
      plotPoints.push({
        x: thispoint.x,
        y: thispoint.y,
        color,
      })
    }
    //fill endpoint
    plotPoints.push({ x: x3, y: y3, color })
  }
  let n = 0,
    i = 0
  let xc = x0 + x1 - x2 - x3,
    xa = xc - 4 * (x1 - x2)
  let xb = x0 - x1 - x2 + x3,
    xd = xb + 4 * (x1 + x2)
  let yc = y0 + y1 - y2 - y3,
    ya = yc - 4 * (y1 - y2)
  let yb = y0 - y1 - y2 + y3,
    yd = yb + 4 * (y1 + y2)
  let fx0 = x0,
    fx1,
    fx2,
    fx3,
    fy0 = y0,
    fy1,
    fy2,
    fy3
  let t1 = xb * xb - xa * xc,
    t2,
    t = Array(5).fill(0)

  if (xa === 0) {
    if (Math.abs(xc) < 2 * Math.abs(xb)) t[n++] = xc / (2.0 * xb)
  } else if (t1 > 0.0) {
    t2 = Math.sqrt(t1)
    t1 = (xb - t2) / xa
    if (Math.abs(t1) < 1.0) t[n++] = t1
    t1 = (xb + t2) / xa
    if (Math.abs(t1) < 1.0) t[n++] = t1
  }

  t1 = yb * yb - ya * yc
  if (ya === 0) {
    if (Math.abs(yc) < 2 * Math.abs(yb)) t[n++] = yc / (2.0 * yb)
  } else if (t1 > 0.0) {
    t2 = Math.sqrt(t1)
    t1 = (yb - t2) / ya
    if (Math.abs(t1) < 1.0) t[n++] = t1
    t1 = (yb + t2) / ya
    if (Math.abs(t1) < 1.0) t[n++] = t1
  }

  for (i = 1; i < n; i++) {
    if ((t1 = t[i - 1]) > t[i]) {
      t[i - 1] = t[i]
      t[i] = t1
      i = 0
    }
  }

  t1 = -1.0
  t[n] = 1.0

  for (i = 0; i <= n; i++) {
    t2 = t[i]
    fx1 =
      (t1 * (t1 * xb - 2 * xc) - t2 * (t1 * (t1 * xa - 2 * xb) + xc) + xd) / 8 -
      fx0
    fy1 =
      (t1 * (t1 * yb - 2 * yc) - t2 * (t1 * (t1 * ya - 2 * yb) + yc) + yd) / 8 -
      fy0
    fx2 =
      (t2 * (t2 * xb - 2 * xc) - t1 * (t2 * (t2 * xa - 2 * xb) + xc) + xd) / 8 -
      fx0
    fy2 =
      (t2 * (t2 * yb - 2 * yc) - t1 * (t2 * (t2 * ya - 2 * yb) + yc) + yd) / 8 -
      fy0
    fx0 -= fx3 = (t2 * (t2 * (3 * xb - t2 * xa) - 3 * xc) + xd) / 8
    fy0 -= fy3 = (t2 * (t2 * (3 * yb - t2 * ya) - 3 * yc) + yd) / 8
    x3 = Math.floor(fx3 + 0.5)
    y3 = Math.floor(fy3 + 0.5)
    if (fx0 !== 0.0) {
      fx1 *= fx0 = (x0 - x3) / fx0
      fx2 *= fx0
    }
    if (fy0 !== 0.0) {
      fy1 *= fy0 = (y0 - y3) / fy0
      fy2 *= fy0
    }
    if (x0 !== x3 || y0 !== y3) {
      let color = `rgba(0,255,0,255)`
      // let color = generateRandomRGB().color
      plotCubicBezierSeg(
        x0,
        y0,
        x0 + fx1,
        y0 + fy1,
        x0 + fx2,
        y0 + fy2,
        x3,
        y3,
        color
      )
    }
    x0 = x3
    y0 = y3
    fx0 = fx3
    fy0 = fy3
    t1 = t2
  }
  /* remaining part */
  return plotPoints
}
