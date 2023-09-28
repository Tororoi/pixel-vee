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
export function assert(condition, message) {
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
      if (x0 == x2 && y0 == y2)
        return plotPoints /* last pixel -> curve finished */
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
 * Plot any rational quadratic bezier segment
 * @param {*} x0 - startX
 * @param {*} y0 - startY
 * @param {*} x1 - ctrlX1
 * @param {*} y1 - ctrlY1
 * @param {*} x2 - endX
 * @param {*} y2 - endY
 * @param {*} w - weight
 * @returns
 */
export function plotConicBezierSeg(x0, y0, x1, y1, x2, y2, w) {
  let plotPoints = []
  /* plot a limited rational Bezier segment, squared weight */
  var sx = x2 - x1,
    sy = y2 - y1 /* relative values for checks */
  var dx = x0 - x2,
    dy = y0 - y2,
    xx = x0 - x1,
    yy = y0 - y1
  var xy = xx * sy + yy * sx,
    cur = xx * sy - yy * sx,
    err /* curvature */

  assert(
    xx * sx <= 0.0 && yy * sy <= 0.0
  ) /* sign of gradient must not change */

  if (cur != 0.0 && w > 0.0) {
    /* no straight line */
    if (sx * sx + sy * sy > xx * xx + yy * yy) {
      /* begin with shorter part */
      x2 = x0
      x0 -= dx
      y2 = y0
      y0 -= dy
      cur = -cur /* swap P0 P2 */
    }
    xx = 2.0 * (4.0 * w * sx * xx + dx * dx) /* differences 2nd degree */
    yy = 2.0 * (4.0 * w * sy * yy + dy * dy)
    sx = x0 < x2 ? 1 : -1 /* x step direction */
    sy = y0 < y2 ? 1 : -1 /* y step direction */
    xy = -2.0 * sx * sy * (2.0 * w * xy + dx * dy)

    if (cur * sx * sy < 0.0) {
      /* negated curvature? */
      xx = -xx
      yy = -yy
      xy = -xy
      cur = -cur
    }
    dx =
      4.0 * w * (x1 - x0) * sy * cur +
      xx / 2.0 +
      xy /* differences 1st degree */
    dy = 4.0 * w * (y0 - y1) * sx * cur + yy / 2.0 + xy

    if (w < 0.5 && (dy > xy || dx < xy)) {
      /* flat ellipse, algorithm fails */
      cur = (w + 1.0) / 2.0
      w = Math.sqrt(w)
      xy = 1.0 / (w + 1.0)
      sx = Math.floor(
        ((x0 + 2.0 * w * x1 + x2) * xy) / 2.0 + 0.5
      ) /*subdivide curve in half */
      sy = Math.floor(((y0 + 2.0 * w * y1 + y2) * xy) / 2.0 + 0.5)
      dx = Math.floor((w * x1 + x0) * xy + 0.5)
      dy = Math.floor((y1 * w + y0) * xy + 0.5)
      plotPoints = [
        ...plotPoints,
        ...plotConicBezierSeg(x0, y0, dx, dy, sx, sy, cur),
      ] /* plot separately */
      dx = Math.floor((w * x1 + x2) * xy + 0.5)
      dy = Math.floor((y1 * w + y2) * xy + 0.5)
      plotPoints = [
        ...plotPoints,
        ...plotConicBezierSeg(sx, sy, dx, dy, x2, y2, cur),
      ]
      return plotPoints
    }
    err = dx + dy - xy /* error 1.step */
    do {
      plotPoints.push({ x: x0, y: y0 }) /* plot curve */
      if (x0 == x2 && y0 == y2)
        return plotPoints /* last pixel -> curve finished */
      x1 = 2 * err > dy
      y1 = 2 * (err + yy) < -dy /* save value for test of x step */
      if (2 * err < dx || y1) {
        y0 += sy
        dy += xy
        err += dx += xx
      } /* y step */
      if (2 * err > dx || x1) {
        x0 += sx
        dx += xy
        err += dy += yy
      } /* x step */
    } while (dy <= xy && dx >= xy) /* gradient negates -> algorithm fails */
  }

  /* plot remaining needle to end
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
    })
  }
  //fill endpoint
  plotPoints.push({ x: x2, y: y2 })
  return plotPoints
}

/**
 * Rasterize any quad bezier
 * @param {*} x0 - startX
 * @param {*} y0 - startY
 * @param {*} x1 - ctrlX1
 * @param {*} y1 - ctrlY1
 * @param {*} x2 - endX
 * @param {*} y2 - endY
 * @returns
 */
export function plotQuadBezier(x0, y0, x1, y1, x2, y2) {
  let plotPoints = []
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
    plotPoints = [
      ...plotPoints,
      ...plotQuadBezierSeg(
        x0,
        y0,
        deltaX,
        Math.floor(r + 0.5),
        deltaX,
        deltaY,
        `rgba(255,0,0,255)`
      ),
    ]
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
    plotPoints = [
      ...plotPoints,
      ...plotQuadBezierSeg(
        x0,
        y0,
        Math.floor(r + 0.5),
        deltaY,
        deltaX,
        deltaY,
        `rgba(0,255,0,255)`
      ),
    ]
    r = ((x1 - x2) * (t - y2)) / (y1 - y2) + x2 /* intersect P7 | P1 P2 */
    x0 = deltaX
    x1 = Math.floor(r + 0.5)
    y0 = y1 = deltaY /* P0 = P6, P1 = P7 */
  }
  plotPoints = [
    ...plotPoints,
    ...plotQuadBezierSeg(x0, y0, x1, y1, x2, y2, `rgba(0,0,255,255)`),
  ]

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
  // function plotCubicBezierBasic(x0, y0, x1, y1, x2, y2, x3, y3) {
  //   function calculateBezier(t, p0, p1, p2, p3) {
  //     const u = 1 - t
  //     const tt = t * t
  //     const uu = u * u
  //     const uuu = uu * u
  //     const ttt = tt * t
  //     return uuu * p0 + 3 * uu * t * p1 + 3 * u * tt * p2 + ttt * p3
  //   }

  //   function bezierPixels(x0, y0, x1, y1, x2, y2, x3, y3) {
  //     const steps = 25 // Adjust this for more or fewer points
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
  // return plotCubicBezierBasic(x0, y0, x1, y1, x2, y2, x3, y3)
}

/**
 * Plot any rational quadratic bezier
 * @param {*} x0 - startX
 * @param {*} y0 - startY
 * @param {*} x1 - ctrlX1
 * @param {*} y1 - ctrlY1
 * @param {*} x2 - endX
 * @param {*} y2 - endY
 * @param {*} w - weight
 * @returns
 */
export function plotConicBezier(x0, y0, x1, y1, x2, y2, w) {
  let plotPoints = []
  /* plot any quadratic rational Bezier curve */
  var x = x0 - 2 * x1 + x2,
    y = y0 - 2 * y1 + y2
  var xx = x0 - x1,
    yy = y0 - y1,
    ww,
    t,
    q

  assert(w >= 0.0)

  if (xx * (x2 - x1) > 0) {
    /* horizontal cut at P4? */
    if (yy * (y2 - y1) > 0)
      if (Math.abs(xx * y) > Math.abs(yy * x)) {
        /* vertical cut at P6 too? */
        /* which first? */
        x0 = x2
        x2 = xx + x1
        y0 = y2
        y2 = yy + y1 /* swap points */
      } /* now horizontal cut at P4 comes first */
    if (x0 == x2 || w == 1.0) t = (x0 - x1) / x
    else {
      /* non-rational or rational case */
      q = Math.sqrt(4.0 * w * w * (x0 - x1) * (x2 - x1) + (x2 - x0) * (x2 - x0))
      if (x1 < x0) q = -q
      t =
        (2.0 * w * (x0 - x1) - x0 + x2 + q) /
        (2.0 * (1.0 - w) * (x2 - x0)) /* t at P4 */
    }
    q = 1.0 / (2.0 * t * (1.0 - t) * (w - 1.0) + 1.0) /* sub-divide at t */
    xx =
      (t * t * (x0 - 2.0 * w * x1 + x2) + 2.0 * t * (w * x1 - x0) + x0) *
      q /* = P4 */
    yy = (t * t * (y0 - 2.0 * w * y1 + y2) + 2.0 * t * (w * y1 - y0) + y0) * q
    ww = t * (w - 1.0) + 1.0
    ww *= ww * q /* squared weight P3 */
    w = ((1.0 - t) * (w - 1.0) + 1.0) * Math.sqrt(q) /* weight P8 */
    x = Math.floor(xx + 0.5)
    y = Math.floor(yy + 0.5) /* P4 */
    yy = ((xx - x0) * (y1 - y0)) / (x1 - x0) + y0 /* intersect P3 | P0 P1 */
    plotPoints = [
      ...plotPoints,
      ...plotConicBezierSeg(x0, y0, x, Math.floor(yy + 0.5), x, y, ww),
    ]
    yy = ((xx - x2) * (y1 - y2)) / (x1 - x2) + y2 /* intersect P4 | P1 P2 */
    y1 = Math.floor(yy + 0.5)
    x0 = x1 = x
    y0 = y /* P0 = P4, P1 = P8 */
  }
  if ((y0 - y1) * (y2 - y1) > 0) {
    /* vertical cut at P6? */
    if (y0 == y2 || w == 1.0) t = (y0 - y1) / (y0 - 2.0 * y1 + y2)
    else {
      /* non-rational or rational case */
      q = Math.sqrt(4.0 * w * w * (y0 - y1) * (y2 - y1) + (y2 - y0) * (y2 - y0))
      if (y1 < y0) q = -q
      t =
        (2.0 * w * (y0 - y1) - y0 + y2 + q) /
        (2.0 * (1.0 - w) * (y2 - y0)) /* t at P6 */
    }
    q = 1.0 / (2.0 * t * (1.0 - t) * (w - 1.0) + 1.0) /* sub-divide at t */
    xx =
      (t * t * (x0 - 2.0 * w * x1 + x2) + 2.0 * t * (w * x1 - x0) + x0) *
      q /* = P6 */
    yy = (t * t * (y0 - 2.0 * w * y1 + y2) + 2.0 * t * (w * y1 - y0) + y0) * q
    ww = t * (w - 1.0) + 1.0
    ww *= ww * q /* squared weight P5 */
    w = ((1.0 - t) * (w - 1.0) + 1.0) * Math.sqrt(q) /* weight P7 */
    x = Math.floor(xx + 0.5)
    y = Math.floor(yy + 0.5) /* P6 */
    xx = ((x1 - x0) * (yy - y0)) / (y1 - y0) + x0 /* intersect P6 | P0 P1 */
    plotPoints = [
      ...plotPoints,
      ...plotConicBezierSeg(x0, y0, Math.floor(xx + 0.5), y, x, y, ww),
    ]
    xx = ((x1 - x2) * (yy - y2)) / (y1 - y2) + x2 /* intersect P7 | P1 P2 */
    x1 = Math.floor(xx + 0.5)
    x0 = x
    y0 = y1 = y /* P0 = P6, P1 = P7 */
  }
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(x0, y0, x1, y1, x2, y2, w * w),
  ] /* remaining */
  return plotPoints
}
