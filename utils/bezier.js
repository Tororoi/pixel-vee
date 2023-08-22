import { getTriangle, getAngle } from "../utils/trig.js"
import { generateRandomRGB } from "../utils/colors.js"

//================================================================//
//== * Thanks to Alois Zingl for curve rasterizing algorithms * ==//
//== * * http://members.chello.at/easyfilter/bresenham.pdf * * ===//
//================================================================//

//====================================//
//=== * * * Bezier Functions * * * ===//
//====================================//

/**
 * 
 * @param {*} condition
 * @param {*} message
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed")
  }
}

/**
 * Bresenham's algorithm for bezier limited to gradients without sign change.
 * @param {*} x0
 * @param {*} y0
 * @param {*} x1
 * @param {*} y1
 * @param {*} x2
 * @param {*} y2
 * @param {*} color
 * @returns
 */
function plotQuadBezierSeg(x0, y0, x1, y1, x2, y2, color) {
  let plotPoints = []
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
      color: `rgba(0,255,30,255)`,
    })
  }
  //fill endpoint
  plotPoints.push({ x: x2, y: y2, color })
  return plotPoints
}

/**
 * Bresenham's algorithm for bezier limited to gradients without sign change.
 * @param {*} x0
 * @param {*} y0
 * @param {*} x1
 * @param {*} y1
 * @param {*} x2
 * @param {*} y2
 * @param {*} x3
 * @param {*} y3
 * @param {*} color
 * @returns
 */
function plotCubicBezierSeg(x0, y0, x1, y1, x2, y2, x3, y3, color) {
  let plotPoints = []
  let f,
    fx,
    fy,
    leg = 1
  let sx = x0 < x3 ? 1 : -1,
    sy = y0 < y3 ? 1 : -1 /* step direction */
  let xc = -Math.abs(x0 + x1 - x2 - x3),
    xa = xc - 4 * sx * (x1 - x2),
    xb = sx * (x0 - x1 - x2 + x3)
  let yc = -Math.abs(y0 + y1 - y2 - y3),
    ya = yc - 4 * sy * (y1 - y2),
    yb = sy * (y0 - y1 - y2 + y3)
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
  /* check for curve restraints */
  /* slope P0-P1 == P2-P3 and (P0-P3 == P1-P2 or no slope change) */
  assert(
    (x1 - x0) * (x2 - x3) < EP &&
      ((x3 - x0) * (x1 - x2) < EP || xb * xb < xa * xc + EP),
    "Curve constraint violation"
  )
  assert(
    (y1 - y0) * (y2 - y3) < EP &&
      ((y3 - y0) * (y1 - y2) < EP || yb * yb < ya * yc + EP),
    "Curve constraint violation"
  )

  if (xa == 0 && ya == 0)
    /* quadratic Bezier */
    return plotQuadBezierSeg(
      x0,
      y0,
      (3 * x1 - x0) >> 1,
      (3 * y1 - y0) >> 1,
      x3,
      y3,
      color
    )
  x1 = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + 1 /* line lengths */
  x2 = (x2 - x3) * (x2 - x3) + (y2 - y3) * (y2 - y3) + 1

  do {
    /* loop over both ends */
    ab = xa * yb - xb * ya
    ac = xa * yc - xc * ya
    bc = xb * yc - xc * yb
    ex =
      ab * (ab + ac - 3 * bc) + ac * ac /* P0 part of self-intersection loop? */
    f = ex > 0 ? 1 : Math.floor(Math.sqrt(1 + 1024 / x1)) /* calc resolution */
    ab *= f
    ac *= f
    bc *= f
    ex *= f * f /* increase resolution */
    xy = (9 * (ab + ac + bc)) / 8
    cb = 8 * (xa - ya) /* init differences of 1st degree */
    dx =
      (27 * (8 * ab * (yb * yb - ya * yc) + ex * (ya + 2 * yb + yc))) / 64 -
      ya * ya * (xy - ya)
    dy =
      (27 * (8 * ab * (xb * xb - xa * xc) - ex * (xa + 2 * xb + xc))) / 64 -
      xa * xa * (xy + xa)
    /* init differences of 2nd degree */
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
      (3 * (xy + 9 * f * (cb * yb * yc - xb * xc * ac) - 18 * xb * yb * ab)) / 8

    if (ex < 0) {
      /* negate values if inside self-intersection loop */
      dx = -dx
      dy = -dy
      xx = -xx
      yy = -yy
      xy = -xy
      ac = -ac
      cb = -cb
    } /* init differences of 3rd degree */
    ab = 6 * ya * ac
    ac = -6 * xa * ac
    bc = 6 * ya * cb
    cb = -6 * xa * cb
    dx += xy
    ex = dx + dy
    dy += xy /* error of 1st step */
    exit: for (pxy = 0, fx = fy = f; x0 != x3 && y0 != y3; ) {
      /* plot curve */
      plotPoints.push({
        x: x0,
        y: y0,
        color,
      })
      do {
        /* move sub-steps of one pixel */
        if (pxy == 0) if (dx > xy || dy < xy) break exit /* confusing */
        if (pxy == 1) if (dx > 0 || dy < 0) break exit /* values */
        y1 = 2 * ex - dy /* save value for test of y step */
        if (2 * ex >= dx) {
          /* x sub-step */
          fx--
          ex += dx += xx
          dy += xy += ac
          yy += bc
          xx += ab
        } else if (y1 > 0) break exit
        if (y1 <= 0) {
          /* y sub-step */
          fy--
          ex += dy += yy
          dx += xy += bc
          xx += ac
          yy += cb
        }
      } while (fx > 0 && fy > 0) /* pixel complete? */
      if (2 * fx <= f) {
        x0 += sx
        fx += f
      } /* x step */
      if (2 * fy <= f) {
        y0 += sy
        fy += f
      } /* y step */
      if (pxy == 0 && dx < 0 && dy > 0) pxy = 1 /* pixel ahead valid */
    }
    xx = x0
    x0 = x3
    x3 = xx
    sx = -sx
    xb = -xb /* swap legs */
    yy = y0
    y0 = y3
    y3 = yy
    sy = -sy
    yb = -yb
    x1 = x2
  } while (leg--) /* try other end */

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
      color: `rgba(0,255,30,255)`,
    })
  }
  //fill endpoint
  plotPoints.push({ x: x3, y: y3, color })
  return plotPoints
}

/**
 * Rasterize any cubic bezier
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

  let colorShifts = [
    `rgba(216,24,24,255)`,
    `rgba(35,199,197,255)`,
    `rgba(255,0,255,255)`,
    `rgba(255,213,0,255)`,
    `rgba(35,101,199,255)`,
  ]

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
    x3 = Math.trunc(fx3 + 0.5)
    y3 = Math.trunc(fy3 + 0.5)
    if (fx0 !== 0.0) {
      fx1 *= fx0 = (x0 - x3) / fx0
      fx2 *= fx0
    }
    if (fy0 !== 0.0) {
      fy1 *= fy0 = (y0 - y3) / fy0
      fy2 *= fy0
    }
    if (x0 !== x3 || y0 !== y3) {
      // let color = `rgba(0,255,0,255)`
      // let color = generateRandomRGB().color
      plotPoints = [
        ...plotPoints,
        ...plotCubicBezierSeg(
          x0,
          y0,
          x0 + fx1,
          y0 + fy1,
          x0 + fx2,
          y0 + fy2,
          x3,
          y3,
          colorShifts[i]
        ),
      ]
    }
    x0 = x3
    y0 = y3
    fx0 = fx3
    fy0 = fy3
    t1 = t2
  }

  return plotPoints
}

/**
 * Function for debugging purposes only to allow stepping through curve rendering algorithm
 * @param {*} x0
 * @param {*} y0
 * @param {*} x1
 * @param {*} y1
 * @param {*} x2
 * @param {*} y2
 * @param {*} x3
 * @param {*} y3
 * @param {*} maxSteps
 * @returns
 */
export function debugPlotCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3, maxSteps) {
  let plotPoints = []
  let steps = 0
  //Bresenham's algorithm for bezier limited to gradients without sign change.
  function plotQuadBezierSeg2(x0, y0, x1, y1, x2, y2, color) {
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
        steps++
        if (steps >= maxSteps) return
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
        color: `rgba(0,255,30,255)`,
      })
      steps++
      if (steps >= maxSteps) return
    }
    //fill endpoint
    plotPoints.push({ x: x2, y: y2, color })
    steps++
    if (steps >= maxSteps) return
  }
  //Bresenham's algorithm for bezier limited to gradients without sign change.
  function plotCubicBezierSeg2(x0, y0, x1, y1, x2, y2, x3, y3, color) {
    let f,
      fx,
      fy,
      leg = 1
    let sx = x0 < x3 ? 1 : -1,
      sy = y0 < y3 ? 1 : -1 /* step direction */
    let xc = -Math.abs(x0 + x1 - x2 - x3),
      xa = xc - 4 * sx * (x1 - x2),
      xb = sx * (x0 - x1 - x2 + x3)
    let yc = -Math.abs(y0 + y1 - y2 - y3),
      ya = yc - 4 * sy * (y1 - y2),
      yb = sy * (y0 - y1 - y2 + y3)
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

    /* check for curve restraints */
    /* slope P0-P1 == P2-P3    and  (P0-P3 == P1-P2      or  no slope change)  */
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

    if (xa == 0 && ya == 0)
      /* quadratic Bezier */
      return plotQuadBezierSeg2(
        x0,
        y0,
        (3 * x1 - x0) >> 1,
        (3 * y1 - y0) >> 1,
        x3,
        y3,
        color
      )
    x1 = (x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0) + 1 /* line lengths */
    x2 = (x2 - x3) * (x2 - x3) + (y2 - y3) * (y2 - y3) + 1

    do {
      /* loop over both ends */
      ab = xa * yb - xb * ya
      ac = xa * yc - xc * ya
      bc = xb * yc - xc * yb
      ex =
        ab * (ab + ac - 3 * bc) +
        ac * ac /* P0 part of self-intersection loop? */
      f =
        ex > 0 ? 1 : Math.floor(Math.sqrt(1 + 1024 / x1)) /* calc resolution */
      ab *= f
      ac *= f
      bc *= f
      ex *= f * f /* increase resolution */
      xy = (9 * (ab + ac + bc)) / 8
      cb = 8 * (xa - ya) /* init differences of 1st degree */
      dx =
        (27 * (8 * ab * (yb * yb - ya * yc) + ex * (ya + 2 * yb + yc))) / 64 -
        ya * ya * (xy - ya)
      dy =
        (27 * (8 * ab * (xb * xb - xa * xc) - ex * (xa + 2 * xb + xc))) / 64 -
        xa * xa * (xy + xa)
      /* init differences of 2nd degree */
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
        /* negate values if inside self-intersection loop */
        dx = -dx
        dy = -dy
        xx = -xx
        yy = -yy
        xy = -xy
        ac = -ac
        cb = -cb
      } /* init differences of 3rd degree */
      ab = 6 * ya * ac
      ac = -6 * xa * ac
      bc = 6 * ya * cb
      cb = -6 * xa * cb
      dx += xy
      ex = dx + dy
      dy += xy /* error of 1st step */
      exit: for (pxy = 0, fx = fy = f; x0 != x3 && y0 != y3; ) {
        /* plot curve */
        plotPoints.push({
          x: x0,
          y: y0,
          color,
        })
        steps++
        if (steps >= maxSteps) return
        do {
          /* move sub-steps of one pixel */
          if (pxy == 0) if (dx > xy || dy < xy) break exit /* confusing */
          if (pxy == 1) if (dx > 0 || dy < 0) break exit /* values */
          y1 = 2 * ex - dy /* save value for test of y step */
          if (2 * ex >= dx) {
            /* x sub-step */
            fx--
            ex += dx += xx
            dy += xy += ac
            yy += bc
            xx += ab
          } else if (y1 > 0) break exit
          if (y1 <= 0) {
            /* y sub-step */
            fy--
            ex += dy += yy
            dx += xy += bc
            xx += ac
            yy += cb
          }
        } while (fx > 0 && fy > 0) /* pixel complete? */
        if (2 * fx <= f) {
          x0 += sx
          fx += f
        } /* x step */
        if (2 * fy <= f) {
          y0 += sy
          fy += f
        } /* y step */
        if (pxy == 0 && dx < 0 && dy > 0) pxy = 1 /* pixel ahead valid */
      }
      xx = x0
      x0 = x3
      x3 = xx
      sx = -sx
      xb = -xb /* swap legs */
      yy = y0
      y0 = y3
      y3 = yy
      sy = -sy
      yb = -yb
      x1 = x2
    } while (leg--) /* try other end */

    //plot remaining part in case of cusp or crunode
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
        color: `rgba(0,255,30,255)`,
      })
      steps++
      if (steps >= maxSteps) return
    }
    //fill endpoint
    plotPoints.push({ x: x3, y: y3, color })
    steps++
    if (steps >= maxSteps) return
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
  function plotCubicBezier2(x0, y0, x1, y1, x2, y2, x3, y3) {
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

    let colorShifts = [
      `rgba(216,24,24,255)`,
      `rgba(35,199,197,255)`,
      `rgba(255,0,255,255)`,
      `rgba(255,213,0,255)`,
      `rgba(35,101,199,255)`,
    ]

    for (i = 0; i <= n; i++) {
      t2 = t[i]
      fx1 =
        (t1 * (t1 * xb - 2 * xc) - t2 * (t1 * (t1 * xa - 2 * xb) + xc) + xd) /
          8 -
        fx0
      fy1 =
        (t1 * (t1 * yb - 2 * yc) - t2 * (t1 * (t1 * ya - 2 * yb) + yc) + yd) /
          8 -
        fy0
      fx2 =
        (t2 * (t2 * xb - 2 * xc) - t1 * (t2 * (t2 * xa - 2 * xb) + xc) + xd) /
          8 -
        fx0
      fy2 =
        (t2 * (t2 * yb - 2 * yc) - t1 * (t2 * (t2 * ya - 2 * yb) + yc) + yd) /
          8 -
        fy0
      fx0 -= fx3 = (t2 * (t2 * (3 * xb - t2 * xa) - 3 * xc) + xd) / 8
      fy0 -= fy3 = (t2 * (t2 * (3 * yb - t2 * ya) - 3 * yc) + yd) / 8
      x3 = Math.trunc(fx3 + 0.5)
      y3 = Math.trunc(fy3 + 0.5)
      if (fx0 !== 0.0) {
        fx1 *= fx0 = (x0 - x3) / fx0
        fx2 *= fx0
      }
      if (fy0 !== 0.0) {
        fy1 *= fy0 = (y0 - y3) / fy0
        fy2 *= fy0
      }
      if (x0 !== x3 || y0 !== y3) {
        // let color = `rgba(0,255,0,255)`
        // let color = generateRandomRGB().color
        plotCubicBezierSeg2(
          x0,
          y0,
          x0 + fx1,
          y0 + fy1,
          x0 + fx2,
          y0 + fy2,
          x3,
          y3,
          colorShifts[i]
        )
        if (steps >= maxSteps) return
      }
      x0 = x3
      y0 = y3
      fx0 = fx3
      fy0 = fy3
      t1 = t2
    }
  }
  plotCubicBezier2(x0, y0, x1, y1, x2, y2, x3, y3)
  return plotPoints
}
