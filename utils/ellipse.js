import { getTriangle, getAngle } from "../utils/trig.js"
import { generateRandomRGB } from "../utils/colors.js"
import { assert, plotConicBezierSeg } from "./bezier.js"

//================================================================//
//== * Thanks to Alois Zingl for curve rasterizing algorithms * ==//
//== * * http://members.chello.at/easyfilter/bresenham.pdf * * ===//
//================================================================//

//=====================================//
//=== * * * Ellipse Functions * * * ===//
//=====================================//

export function plotEllipse(xm, ym, a, b) {
  let plotPoints = []
  var x = -a,
    y = 0 /* II. quadrant from bottom left to top right */
  var e2,
    dx = (1 + 2 * x) * b * b /* error increment  */
  var dy = x * x,
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
  return plotPoints
}

export function plotCircle(xm, ym, r) {
  let plotPoints = []
  var x = -r,
    y = 0,
    err = 2 - 2 * r /* bottom left to top right */
  do {
    plotPoints.push({ x: xm - x, y: ym + y }) /*   I. Quadrant +x +y */
    plotPoints.push({ x: xm - y, y: ym - x }) /*  II. Quadrant -x +y */
    plotPoints.push({ x: xm + x, y: ym - y }) /* III. Quadrant -x -y */
    plotPoints.push({ x: xm + y, y: ym + x }) /*  IV. Quadrant +x -y */
    r = err
    if (r <= y) err += ++y * 2 + 1 /* y step */
    if (r > x || err > y) err += ++x * 2 + 1 /* x step */
  } while (x < 0)
  return plotPoints
}

export function plotEllipseRect(x0, y0, x1, y1) {
  let plotPoints = []
  /* rectangular parameter enclosing the ellipse */
  var a = Math.abs(x1 - x0),
    b = Math.abs(y1 - y0),
    b1 = b & 1 /* diameter */
  var dx = 4 * (1.0 - a) * b * b,
    dy = 4 * (b1 + 1) * a * a /* error increment */
  var err = dx + dy + b1 * a * a,
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
    plotPoints.push({ x: x0 - 1, y: y0 }) /* -> finish tip of ellipse */
    plotPoints.push({ x: x1 + 1, y: y0++ })
    plotPoints.push({ x: x0 - 1, y: y1 })
    plotPoints.push({ x: x1 + 1, y: y1-- })
  }
  return plotPoints
}

export function plotRotatedEllipse(x, y, a, b, angle) {
  /* plot ellipse rotated by angle (radian) */
  var xd = a * a,
    yd = b * b
  var s = Math.sin(angle),
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
    4 * zd * Math.cos(angle)
  )
}

function plotRotatedEllipseRect(x0, y0, x1, y1, zd) {
  let plotPoints = []
  /* rectangle enclosing the ellipse, integer rotation angle */
  var xd = x1 - x0,
    yd = y1 - y0,
    w = xd * yd
  if (zd == 0) return plotEllipseRect(x0, y0, x1, y1) /* looks nicer */
  if (w != 0.0) w = (w - zd) / (w + w) /* squared weight of P1 */
  assert(w <= 1.0 && w >= 0.0) /* limit angle to |zd|<=xd*yd */
  xd = Math.floor(xd * w + 0.5)
  yd = Math.floor(yd * w + 0.5) /* snap to int */
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(x0, y0 + yd, x0, y0, x0 + xd, y0, 1.0 - w),
  ]
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(x0, y0 + yd, x0, y1, x1 - xd, y1, w),
  ]
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(x1, y1 - yd, x1, y1, x1 - xd, y1, 1.0 - w),
  ]
  plotPoints = [
    ...plotPoints,
    ...plotConicBezierSeg(x1, y1 - yd, x1, y0, x0 + xd, y0, w),
  ]
  return plotPoints
}