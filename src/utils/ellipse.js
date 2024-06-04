import { getAngle } from "../utils/trig.js"
import { assert, plotConicBezierSeg } from "./bezier.js"

//================================================================//
//== * Thanks to Alois Zingl for curve rasterizing algorithms * ==//
//== * * http://members.chello.at/easyfilter/bresenham.pdf * * ===//
//================================================================//

//=====================================//
//=== * * * Ellipse Functions * * * ===//
//=====================================//

/**
 * Plot an ellipse
 * @param {number} xm - x-coordinate of the center
 * @param {number} ym - y-coordinate of the center
 * @param {number} a - semi-major axis
 * @param {number} b - semi-minor axis
 * @returns {Array} - Array of points
 */
export function plotEllipse(xm, ym, a, b) {
  let plotPoints = []
  let x = -a,
    y = 0 /* II. quadrant from bottom left to top right */
  let e2,
    dx = (1 + 2 * x) * b * b /* error increment  */
  let dy = x * x,
    err = dx + dy /* error of 1.step */

  do {
    plotPoints.push({ x: xm - x, y: ym + y }) /*   I. Quadrant */
    plotPoints.push({ x: xm + x, y: ym + y }) /*  II. Quadrant */
    plotPoints.push({ x: xm + x, y: ym - y }) /* III. Quadrant */
    plotPoints.push({ x: xm - x, y: ym - y }) /*  IV. Quadrant */
    e2 = 2 * err
    if (e2 >= dx) {
      x++
      err += dx += 2 * b * b
    } /* x step */
    if (e2 <= dy) {
      y++
      err += dy += 2 * a * a
    } /* y step */
  } while (x <= 0)

  while (y++ < b) {
    /* too early stop for flat ellipses with a=1, */
    plotPoints.push({ x: xm, y: ym + y }) /* -> finish tip of ellipse */
    plotPoints.push({ x: xm, y: ym - y })
  }
  //remove duplicate coordinates
  const seen = new Set()
  plotPoints = plotPoints.filter((point) => {
    let key = `${point.x},${point.y}`
    if (seen.has(key)) {
      return false // skip this item
    }
    seen.add(key)
    return true // keep this item
  })
  return plotPoints
}

// export function plotCircle(xm, ym, r, offset) {
//   let plotPoints = []
//   let x = -r,
//     y = 0,
//     err = 2 - 2 * r /* bottom left to top right */
//   //offset when subpixel is nearer to center
//   // offset = 1
//   do {
//     plotPoints.push({
//       x: xm - x - offset,
//       y: ym + y - offset,
//     }) /*   I. Quadrant +x +y */
//     plotPoints.push({ x: xm - y, y: ym - x - offset }) /*  II. Quadrant -x +y */
//     plotPoints.push({ x: xm + x, y: ym - y }) /* III. Quadrant -x -y */
//     plotPoints.push({ x: xm + y - offset, y: ym + x }) /*  IV. Quadrant +x -y */
//     r = err
//     if (r <= y) err += ++y * 2 + 1 /* y step */
//     if (r > x || err > y) err += ++x * 2 + 1 /* x step */
//   } while (x < 0)
//   //remove duplicate coordinates
//   const seen = new Set()
//   plotPoints = plotPoints.filter((point) => {
//     let key = `${point.x},${point.y}`
//     if (seen.has(key)) {
//       return false // skip this item
//     }
//     seen.add(key)
//     return true // keep this item
//   })
//   return plotPoints
// }

/**
 * Plot a circle
 * @param {number} xm - x-coordinate of the center
 * @param {number} ym - y-coordinate of the center
 * @param {number} r - radius
 * @param {number} offset - subpixel offset
 * @returns {Array} - Array of points
 */
export function plotCircle(xm, ym, r, offset) {
  r = Math.round(r)
  let plotPoints = []

  // I. Quadrant (+x, +y)
  plotQuadrant(xm, ym, r, offset, 1)

  // II. Quadrant (-x, +y)
  plotQuadrant(xm, ym, r, offset, 2)

  // III. Quadrant (-x, -y)
  plotQuadrant(xm, ym, r, offset, 3)

  // IV. Quadrant (+x, -y)
  plotQuadrant(xm, ym, r, offset, 4)

  // Deduplicate coordinates
  const seen = new Set()
  plotPoints = plotPoints.filter((point) => {
    let key = `${point.x},${point.y}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return plotPoints

  /**
   * Plot a quadrant of a circle
   * @param {number} xm - x-coordinate of the center
   * @param {number} ym - y-coordinate of the center
   * @param {number} r - radius
   * @param {number} offset - subpixel offset
   * @param {number} quadrant - quadrant number
   */
  function plotQuadrant(xm, ym, r, offset, quadrant) {
    let x = -r,
      y = 0,
      err = 2 - 2 * r

    do {
      switch (quadrant) {
        case 1:
          plotPoints.push({ x: xm - x - offset, y: ym + y - offset })
          break
        case 2:
          plotPoints.push({ x: xm - y, y: ym - x - offset })
          break
        case 3:
          plotPoints.push({ x: xm + x, y: ym - y })
          break
        case 4:
          plotPoints.push({ x: xm + y - offset, y: ym + x })
          break
      }

      r = err
      if (r <= y) err += ++y * 2 + 1
      if (r > x || err > y) err += ++x * 2 + 1
    } while (x < 0)
  }
}

/**
 * Plot an ellipse with a rectangular parameter
 * @param {number} x0 - x-coordinate of the top-left corner of the rectangle
 * @param {number} y0 - y-coordinate of the top-left corner of the rectangle
 * @param {number} x1 - x-coordinate of the bottom-right corner of the rectangle
 * @param {number} y1 - y-coordinate of the bottom-right corner of the rectangle
 * @returns {Array} - Array of points
 */
export function plotEllipseRect(x0, y0, x1, y1) {
  let plotPoints = []
  /* rectangular parameter enclosing the ellipse */
  let a = Math.abs(x1 - x0),
    b = Math.abs(y1 - y0),
    b1 = b & 1 /* diameter */
  let dx = 4 * (1.0 - a) * b * b,
    dy = 4 * (b1 + 1) * a * a /* error increment */
  let err = dx + dy + b1 * a * a,
    e2 /* error of 1.step */

  if (x0 > x1) {
    x0 = x1
    x1 += a
  } /* if called with swapped points */
  if (y0 > y1) y0 = y1 /* .. exchange them */
  y0 += (b + 1) >> 1
  y1 = y0 - b1 /* starting pixel */
  a = 8 * a * a
  b1 = 8 * b * b
  do {
    plotPoints.push({ x: x1, y: y0 }) /*   I. Quadrant */
    plotPoints.push({ x: x0, y: y0 }) /*  II. Quadrant */
    plotPoints.push({ x: x0, y: y1 }) /* III. Quadrant */
    plotPoints.push({ x: x1, y: y1 }) /*  IV. Quadrant */
    e2 = 2 * err
    if (e2 <= dy) {
      y0++
      y1--
      err += dy += a
    } /* y step */
    if (e2 >= dx || 2 * err > dy) {
      x0++
      x1--
      err += dx += b1
    } /* x */
  } while (x0 <= x1)

  while (y0 - y1 <= b) {
    /* too early stop of flat ellipses a=1 */
    plotPoints.push({
      x: x0 - 1,
      y: y0,
    }) /* -> finish tip of ellipse */
    plotPoints.push({ x: x1 + 1, y: y0++ })
    plotPoints.push({ x: x0 - 1, y: y1 })
    plotPoints.push({ x: x1 + 1, y: y1-- })
  }
  //remove duplicate coordinates
  const seen = new Set()
  plotPoints = plotPoints.filter((point) => {
    let key = `${point.x},${point.y}`
    if (seen.has(key)) {
      return false // skip this item
    }
    seen.add(key)
    return true // keep this item
  })

  return plotPoints
}

/**
 * Plot a rotated ellipse without a rectangular parameter
 * @param {number} x - x-coordinate of the center
 * @param {number} y - y-coordinate of the center
 * @param {number} a - semi-major axis
 * @param {number} b - semi-minor axis
 * @param {number} angle - angle in radians
 * @param {number} xa - x-coordinate of the first control point
 * @param {number} ya - y-coordinate of the first control point
 * @param {number} x1Offset - x direction offset
 * @param {number} y1Offset - y direction offset
 * @returns {Array} - Array of points
 */
export function plotRotatedEllipse(
  x,
  y,
  a,
  b,
  angle,
  xa,
  ya,
  x1Offset,
  y1Offset
) {
  /* plot ellipse rotated by angle (radian) */
  let xd = a * a,
    yd = b * b
  let s = Math.sin(angle),
    zd = (xd - yd) * s /* ellipse rotation */
  ;(xd = Math.sqrt(xd - zd * s)),
    (yd = Math.sqrt(yd + zd * s)) /* surrounding rect */
  a = Math.floor(xd + 0.5)
  b = Math.floor(yd + 0.5)
  zd = (zd * a * b) / (xd * yd)
  return plotRotatedEllipseRect(
    x - a,
    y - b,
    x + a,
    y + b,
    4 * zd * Math.cos(angle),
    x === xa || y === ya,
    x1Offset,
    y1Offset
  )
}

/**
 * Calculate conic segments from vertices of an ellipse. Length of axes and angle of rotation are given, having already been calculated from the vertices.
 * @param {number} x - x-coordinate of the center
 * @param {number} y - y-coordinate of the center
 * @param {number} a - semi-major axis
 * @param {number} b - semi-minor axis
 * @param {number} angle - angle in radians
 * @param {number} x1Offset - x direction offset
 * @param {number} y1Offset - y direction offset
 * @returns {object} - {weight, leftTangentX, leftTangentY, topTangentX, topTangentY, rightTangentX, rightTangentY, bottomTangentX, bottomTangentY}
 */
export function calcEllipseConicsFromVertices(
  x,
  y,
  a,
  b,
  angle,
  x1Offset,
  y1Offset
) {
  let aa = a * a,
    bb = b * b
  let s = Math.sin(angle),
    zd = (aa - bb) * s /* ellipse rotation */
  ;(aa = Math.sqrt(aa - zd * s)),
    (bb = Math.sqrt(bb + zd * s)) /* surrounding rect */
  a = Math.floor(aa + 0.5)
  b = Math.floor(bb + 0.5)
  zd = (zd * a * b) / (aa * bb)
  zd = 4 * zd * Math.cos(angle)
  let x0 = x - a,
    y0 = y - b,
    x1 = x + a + x1Offset,
    y1 = y + b + y1Offset
  let xd = x1 - x0,
    yd = y1 - y0,
    w = xd * yd
  if (w != 0.0) w = (w - zd) / (w + w) /* squared weight of P1 */
  //Breaks down at smaller radii, need enforced minimum where offset is not applied? if assertion fails, try again after w is calculated without offset
  if (!(w <= 1.0 && w >= 0.0)) {
    //if assertion expected to fail with offsets, remove offsets and reset vars before trying assert
    x1 = x1 - x1Offset
    y1 = y1 - y1Offset
    xd = x1 - x0
    yd = y1 - y0
    w = xd * yd
    if (w != 0.0) w = (w - zd) / (w + w) /* squared weight of P1 */
  }
  assert(w <= 1.0 && w >= 0.0) /* limit angle to |zd|<=xd*yd */
  xd = Math.floor(xd * w + 0.5)
  yd = Math.floor(yd * w + 0.5) /* snap to int */
  return {
    weight: w,
    leftTangentX: x0,
    leftTangentY: y0 + yd,
    topTangentX: x0 + xd,
    topTangentY: y0,
    rightTangentX: x1,
    rightTangentY: y1 - yd,
    bottomTangentX: x1 - xd,
    bottomTangentY: y1,
  }
}

/**
 * Calculate the semi-major axis, semi-minor axis, and angle of rotation from conic segments.
 * @param {number} weight - squared weight of P1
 * @param {number} leftTangentX - x-coordinate of the left tangent
 * @param {number} leftTangentY - y-coordinate of the left tangent
 * @param {number} topTangentX - x-coordinate of the top tangent
 * @param {number} topTangentY - y-coordinate of the top tangent
 * @param {number} rightTangentX - x-coordinate of the right tangent
 * @param {number} rightTangentY - y-coordinate of the right tangent
 * @param {number} bottomTangentX - x-coordinate of the bottom tangent
 * @param {number} bottomTangentY - y-coordinate of the bottom tangent
 * @param {number} centerX - x-coordinate of the center of the ellipse
 * @param {number} centerY - y-coordinate of the center of the ellipse
 * @param {number} originalAngle - original angle of ellipse before transformation. Used to know the quadrants to check for the vertices
 * @returns {object} - {a, b, angle}
 */
export function calcEllipseParamsFromConics(
  weight,
  leftTangentX,
  leftTangentY,
  topTangentX,
  topTangentY,
  rightTangentX,
  rightTangentY,
  bottomTangentX,
  bottomTangentY,
  centerX,
  centerY,
  originalAngle
) {
  //top-left corner
  const topLeftVertex = () =>
    findConicSegmentVertex(
      1 - weight,
      leftTangentX,
      leftTangentY,
      leftTangentX,
      topTangentY,
      topTangentX,
      topTangentY,
      centerX,
      centerY
    )
  //top-right corner
  const topRightVertex = () =>
    findConicSegmentVertex(
      weight,
      topTangentX,
      topTangentY,
      rightTangentX,
      topTangentY,
      rightTangentX,
      rightTangentY,
      centerX,
      centerY
    )
  //bottom-right corner
  const bottomRightVertex = () =>
    findConicSegmentVertex(
      1 - weight,
      rightTangentX,
      rightTangentY,
      rightTangentX,
      bottomTangentY,
      bottomTangentX,
      bottomTangentY,
      centerX,
      centerY
    )
  //bottom-left corner
  const bottomLeftVertex = () =>
    findConicSegmentVertex(
      weight,
      bottomTangentX,
      bottomTangentY,
      leftTangentX,
      bottomTangentY,
      leftTangentX,
      leftTangentY,
      centerX,
      centerY
    )
  let px2, py2, px3, py3, vertexA, vertexB
  switch (true) {
    case originalAngle <= Math.PI / 2: {
      //bottom-right corner
      vertexA = bottomRightVertex()
      vertexB = topRightVertex()
      break
    }
    case originalAngle <= Math.PI: {
      //bottom-left corner
      vertexA = bottomLeftVertex()
      vertexB = bottomRightVertex()
      break
    }
    case originalAngle <= (3 * Math.PI) / 2: {
      //top-left corner
      vertexA = topLeftVertex()
      vertexB = bottomLeftVertex()
      break
    }
    case originalAngle <= 2 * Math.PI: {
      //top-right corner
      vertexA = topRightVertex()
      vertexB = topLeftVertex()
      break
    }
    default:
      //
      console.log("Invalid angle", originalAngle <= Math.PI / 2)
  }
  if (vertexA.majorRadius > vertexB.majorRadius) {
    px2 = Math.round(vertexA.majorX)
    py2 = Math.round(vertexA.majorY)
    px3 = Math.round(vertexB.minorX)
    py3 = Math.round(vertexB.minorY)
  } else {
    px2 = Math.round(vertexA.minorX)
    py2 = Math.round(vertexA.minorY)
    px3 = Math.round(vertexB.majorX)
    py3 = Math.round(vertexB.majorY)
  }

  return {
    px2,
    py2,
    px3,
    py3,
  }
}

/**
 * Golden-section search to find the minimum radius of curvature
 * @param a - lower bound of the search interval
 * @param b - upper bound of the search interval
 * @param f - function whose minimum value we're searching for
 * @param tol - tolerance for the search precision (default is 1e-5)
 */
function goldenSectionSearchMin(a, b, f, tol = 1e-5) {
  const gr = (Math.sqrt(5) + 1) / 2
  let c = b - (b - a) / gr
  let d = a + (b - a) / gr

  while (Math.abs(c - d) > tol) {
    if (f(c) < f(d)) {
      b = d
    } else {
      a = c
    }
    c = b - (b - a) / gr
    d = a + (b - a) / gr
  }

  return (b + a) / 2
}

/**
 * Golden-section search to find the maximum radius of curvature
 * @param a - lower bound of the search interval
 * @param b - upper bound of the search interval
 * @param f - function whose maximum value we're searching for
 * @param tol - tolerance for the search precision (default is 1e-5)
 */
function goldenSectionSearchMax(a, b, f, tol = 1e-5) {
  const gr = (Math.sqrt(5) + 1) / 2
  let c = b - (b - a) / gr
  let d = a + (b - a) / gr

  while (Math.abs(c - d) > tol) {
    if (f(c) > f(d)) {
      b = d
    } else {
      a = c
    }
    c = b - (b - a) / gr
    d = a + (b - a) / gr
  }

  return (b + a) / 2
}

/**
 * Evaluate the conic Bézier curve at parameter t
 * @param t - parameter value at which to evaluate the curve
 * @param px0 - x-coordinate of the first control point
 * @param py0 - y-coordinate of the first control point
 * @param px1 - x-coordinate of the second control point
 * @param py1 - y-coordinate of the second control point
 * @param px2 - x-coordinate of the third control point
 * @param py2 - y-coordinate of the third control point
 * @param weight - squared weight of the middle control point
 */
function evaluateBezier(t, px0, py0, px1, py1, px2, py2, weight) {
  const w = Math.sqrt(weight)
  const mt = 1 - t

  const denominator = mt * mt + 2 * w * mt * t + t * t

  const x = (mt * mt * px0 + 2 * w * mt * t * px1 + t * t * px2) / denominator
  const y = (mt * mt * py0 + 2 * w * mt * t * py1 + t * t * py2) / denominator

  return { x, y }
}

/**
 * Find the points of highest and lowest curvature on a conic Bézier curve
 * @param weight - squared weight of P1
 * @param px0 - x-coordinate of the first control point
 * @param py0 - y-coordinate of the first control point
 * @param px1 - x-coordinate of the second control point
 * @param py1 - y-coordinate of the second control point
 * @param px2 - x-coordinate of the third control point
 * @param py2 - y-coordinate of the third control point
 * @param centerX
 * @param centerY
 */
function findConicSegmentVertex(
  weight,
  px0,
  py0,
  px1,
  py1,
  px2,
  py2,
  centerX,
  centerY
) {
  /**
   * Check radius of ellipse at given t on the conic segment
   * @param {*} t
   * @returns
   */
  const radiusFunction = (t) => {
    const pointOnCurve = evaluateBezier(t, px0, py0, px1, py1, px2, py2, weight)
    const distanceToPointFromCenter = Math.sqrt(
      (pointOnCurve.x - centerX) ** 2 + (pointOnCurve.y - centerY) ** 2
    )
    return distanceToPointFromCenter
  }

  // Search for largest distance to center
  const majorT = goldenSectionSearchMax(0, 1, radiusFunction, 1e-5)

  // Search for smallest distance to center
  const minorT = goldenSectionSearchMin(0, 1, radiusFunction, 1e-5)

  // Calculate the coordinates at the points of highest and lowest curvature
  const majorPoint = evaluateBezier(
    majorT,
    px0,
    py0,
    px1,
    py1,
    px2,
    py2,
    weight
  )
  const minorPoint = evaluateBezier(
    minorT,
    px0,
    py0,
    px1,
    py1,
    px2,
    py2,
    weight
  )

  return {
    majorRadius: radiusFunction(majorT),
    majorX: majorPoint.x,
    majorY: majorPoint.y,
    minorRadius: radiusFunction(minorT),
    minorX: minorPoint.x,
    minorY: minorPoint.y,
  }
}

/**
 * Plot a rotated ellipse with conic segments
 * @param {number} weight - weight of the conic segment
 * @param {number} leftTangentX - x-coordinate of the left tangent point
 * @param {number} leftTangentY - y-coordinate of the left tangent point
 * @param {number} topTangentX - x-coordinate of the top tangent point
 * @param {number} topTangentY - y-coordinate of the top tangent point
 * @param {number} rightTangentX - x-coordinate of the right tangent point
 * @param {number} rightTangentY - y-coordinate of the right tangent point
 * @param {number} bottomTangentX - x-coordinate of the bottom tangent point
 * @param {number} bottomTangentY - y-coordinate of the bottom tangent point
 * @returns {Array} - Array of points
 */
export function plotRotatedEllipseConics(
  weight,
  leftTangentX,
  leftTangentY,
  topTangentX,
  topTangentY,
  rightTangentX,
  rightTangentY,
  bottomTangentX,
  bottomTangentY
) {
  //weight is 0.5 for rotation angles multiple of pi/2
  if (weight === 0.5)
    return plotEllipseRect(
      leftTangentX,
      topTangentY,
      rightTangentX,
      bottomTangentY
    ) /* looks nicer */
  let plotPoints = []
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(
      leftTangentX,
      leftTangentY,
      leftTangentX,
      topTangentY,
      topTangentX,
      topTangentY,
      1.0 - weight
    ), //top-left corner
  ]
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(
      leftTangentX,
      leftTangentY,
      leftTangentX,
      bottomTangentY,
      bottomTangentX,
      bottomTangentY,
      weight
    ), //top-right corner
  ]
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(
      rightTangentX,
      rightTangentY,
      rightTangentX,
      bottomTangentY,
      bottomTangentX,
      bottomTangentY,
      1.0 - weight
    ), //bottom-right corner
  ]
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(
      rightTangentX,
      rightTangentY,
      rightTangentX,
      topTangentY,
      topTangentX,
      topTangentY,
      weight
    ), //bottom-left corner
  ]
  // plotPoints.push({ x: leftTangentX, y: leftTangentY }) // left tangent point
  // plotPoints.push({ x: leftTangentX, y: topTangentY }) // control point 1
  // plotPoints.push({ x: topTangentX, y: topTangentY }) // top tangent point
  // plotPoints.push({ x: leftTangentX, y: bottomTangentY }) // control point 2
  // plotPoints.push({ x: bottomTangentX, y: bottomTangentY }) // bottom tangent point
  // plotPoints.push({ x: rightTangentX, y: bottomTangentY }) // control point 3
  // plotPoints.push({ x: rightTangentX, y: rightTangentY }) // right tangent point
  // plotPoints.push({ x: rightTangentX, y: topTangentY }) // control point 4
  // plotPoints.push({ x: x0, y: y0 }) // top-left corner
  // plotPoints.push({ x: x1, y: y0 }) // top-right corner
  // plotPoints.push({ x: x1, y: y1 }) // bottom-right corner
  // plotPoints.push({ x: x0, y: y1 }) // bottom-left corner
  //remove duplicate coordinates
  const seen = new Set()
  plotPoints = plotPoints.filter((point) => {
    let key = `${point.x},${point.y}`
    if (seen.has(key)) {
      return false // skip this item
    }
    // //remove tangent points for visibility (temporary)
    // if (key === `${leftTangentX},${leftTangentY}`) {
    //   return false
    // }
    // if (key === `${topTangentX},${topTangentY}`) {
    //   return false
    // }
    // if (key === `${rightTangentX},${rightTangentY}`) {
    //   return false
    // }
    // if (key === `${bottomTangentX},${bottomTangentY}`) {
    //   return false
    // }
    seen.add(key)
    return true // keep this item
  })
  return plotPoints
}

/**
 * Plot a rotated ellipse with a rectangular parameter
 * @param {number} x0 - x-coordinate of the top-left corner of the rectangle
 * @param {number} y0 - y-coordinate of the top-left corner of the rectangle
 * @param {number} x1 - x-coordinate of the bottom-right corner of the rectangle
 * @param {number} y1 - y-coordinate of the bottom-right corner of the rectangle
 * @param {number} zd - angle in radians
 * @param {boolean} isRightAngle - is right angle
 * @param {number} x1Offset - x direction offset
 * @param {number} y1Offset - y direction offset
 * @returns {Array} - Array of points
 */
function plotRotatedEllipseRect(
  x0,
  y0,
  x1,
  y1,
  zd,
  isRightAngle,
  x1Offset,
  y1Offset
) {
  x1 = x1 + x1Offset
  y1 = y1 + y1Offset
  if (isRightAngle) return plotEllipseRect(x0, y0, x1, y1) /* looks nicer */

  /* rectangle enclosing the ellipse, integer rotation angle */
  let xd = x1 - x0,
    yd = y1 - y0,
    w = xd * yd
  if (w != 0.0) w = (w - zd) / (w + w) /* squared weight of P1 */
  //Breaks down at smaller radii, need enforced minimum where offset is not applied? if assertion fails, try again after w is calculated without offset
  if (!(w <= 1.0 && w >= 0.0)) {
    //if assertion expected to fail with offsets, remove offsets and reset vars before trying assert
    x1 = x1 - x1Offset
    y1 = y1 - y1Offset
    xd = x1 - x0
    yd = y1 - y0
    w = xd * yd
    if (w != 0.0) w = (w - zd) / (w + w) /* squared weight of P1 */
  }
  assert(w <= 1.0 && w >= 0.0) /* limit angle to |zd|<=xd*yd */
  xd = Math.floor(xd * w + 0.5)
  yd = Math.floor(yd * w + 0.5) /* snap to int */
  // w = 0.5 //for circle
  let plotPoints = []
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(x0, y0 + yd, x0, y0, x0 + xd, y0, 1.0 - w), //top-left corner
  ]
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(x0, y0 + yd, x0, y1, x1 - xd, y1, w), //top-right corner
  ]
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(x1, y1 - yd, x1, y1, x1 - xd, y1, 1.0 - w), //bottom-right corner
  ]
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(x1, y1 - yd, x1, y0, x0 + xd, y0, w), //bottom-left corner
  ]
  plotPoints.push({ x: x0, y: y0 + yd }) // left tangent point
  plotPoints.push({ x: x0, y: y0 }) // control point 1
  plotPoints.push({ x: x0 + xd, y: y0 }) // top tangent point
  plotPoints.push({ x: x0, y: y1 }) // control point 2
  plotPoints.push({ x: x1 - xd, y: y1 }) // bottom tangent point
  plotPoints.push({ x: x1, y: y1 }) // control point 3
  plotPoints.push({ x: x1, y: y1 - yd }) // right tangent point
  plotPoints.push({ x: x1, y: y0 }) // control point 4
  // plotPoints.push({ x: x0, y: y0 }) // top-left corner
  // plotPoints.push({ x: x1, y: y0 }) // top-right corner
  // plotPoints.push({ x: x1, y: y1 }) // bottom-right corner
  // plotPoints.push({ x: x0, y: y1 }) // bottom-left corner
  //remove duplicate coordinates
  const seen = new Set()
  plotPoints = plotPoints.filter((point) => {
    let key = `${point.x},${point.y}`
    if (seen.has(key)) {
      return false // skip this item
    }
    //remove tangent points for visibility (temporary)
    if (key === `${x0},${y0 + yd}`) {
      return false
    }
    if (key === `${x0 + xd},${y0}`) {
      return false
    }
    if (key === `${x1 - xd},${y1}`) {
      return false
    }
    if (key === `${x1},${y1 - yd}`) {
      return false
    }
    seen.add(key)
    return true // keep this item
  })
  return plotPoints
}

//helper functions
/**
 * Get a point on a circle
 * @param {number} cx - x-coordinate of the center
 * @param {number} cy - y-coordinate of the center
 * @param {number} r - radius
 * @param {number} a - angle in radians
 * @returns {object} - Object with x and y properties
 */
function pointOnCircle(cx, cy, r, a) {
  let x = Math.round(cx + r * Math.cos(a))
  let y = Math.round(cy + r * Math.sin(a))
  return { x, y }
}

/**
 * Update the vertex of an ellipse
 * @param {number} px1 - x-coordinate of the first control point
 * @param {number} py1 - y-coordinate of the first control point
 * @param {number} px2 - x-coordinate of the second control point
 * @param {number} py2 - y-coordinate of the second control point
 * @param {number} radians - angle in radians
 * @param {number} opposingRadius - opposing radius
 * @returns {object} - Object with x and y properties
 */
export function getOpposingEllipseVertex(
  px1,
  py1,
  px2,
  py2,
  radians,
  opposingRadius
) {
  let angle = getAngle(px2 - px1, py2 - py1)
  let newVertex = pointOnCircle(px1, py1, opposingRadius, angle + radians)
  return newVertex
}

/**
 * Find half of pixel that current subpixel exists in given an angle of a vector to the current pixel
 * determine subpixel close or far from origin based on angle.
 * @param {number} x - (Integer) subpixel coordinate
 * @param {number} y - (Integer) subpixel coordinate
 * @param {number} angle - (Float) radians
 * @returns {number} - 0 if far, 1 if close
 */
export function findHalf(x, y, angle) {
  // Convert angle in degrees to slope m using tan function
  const mGiven = Math.tan(angle)
  // Calculate the perpendicular slope
  const m = mGiven !== 0 ? -1 / mGiven : 90000000
  // Calculate y-intercept b using midpoint (4, 4)
  const b = 7 - m * 7
  // Calculate the y-value of the line at the given x-coordinate
  const yOnLine = m * x + b

  //0 = far, 1 = close
  angle = angle % (2 * Math.PI)
  if (y > yOnLine) {
    return angle <= Math.PI && angle > 0 ? 0 : 1
  } else {
    return angle <= Math.PI && angle > 0 ? 1 : 0
  }
}
