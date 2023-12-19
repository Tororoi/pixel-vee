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
//   var x = -r,
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

export function plotCircle(xm, ym, r, offset) {
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

  function plotQuadrant(xm, ym, r, offset, quadrant) {
    var x = -r,
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
    4 * zd * Math.cos(angle),
    x === xa || y === ya,
    x1Offset,
    y1Offset
  )
}

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
  let plotPoints = []
  /* rectangle enclosing the ellipse, integer rotation angle */
  var xd = x1 - x0,
    yd = y1 - y0,
    w = xd * yd
  // if (Math.abs(zd) == 0) //original algorithm, only works for radius at 0 degrees
  if (isRightAngle) return plotEllipseRect(x0, y0, x1, y1) /* looks nicer */
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

//helper functions
/**
 *
 * @param {*} cx
 * @param {*} cy
 * @param {*} r
 * @param {*} a
 * @returns
 */
function pointOnCircle(cx, cy, r, a) {
  let x = Math.round(cx + r * Math.cos(a))
  let y = Math.round(cy + r * Math.sin(a))
  return { x, y }
}

/**
 *
 * @param {*} px1
 * @param {*} py1
 * @param {*} px2
 * @param {*} py2
 * @param {*} radians
 * @param {*} opposingRadius
 * @returns
 */
export function updateEllipseVertex(
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
 * @param {*} x - subpixel coordinate
 * @param {*} y - subpixel coordinate
 * @param {*} angle - radians
 * @param {boolean} inverse - inverse result
 * @param {boolean} perpendicular - rotate angle 90 degrees
 * @returns
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

//Helper functions that affect state

/**
 *
 * @param {*} state
 * @param {*} canvas
 * @param {*} px1
 * @param {*} py1
 * @param {*} px2
 * @param {*} py2
 * @param {*} angleOffset
 */
export function updateEllipseOffsets(
  state,
  canvas,
  forceCircle = false,
  angleOffset = 0
) {
  state.vectorProperties.angle = getAngle(
    state.vectorProperties.px2 - state.vectorProperties.px1,
    state.vectorProperties.py2 - state.vectorProperties.py1
  )
  if (state.tool.options.useSubpixels?.active) {
    state.vectorProperties.offset = findHalf(
      canvas.subPixelX,
      canvas.subPixelY,
      state.vectorProperties.angle + angleOffset
    )
  } else {
    state.vectorProperties.offset = 0 // TODO: need logic to manually select offset values
  }
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  while (state.vectorProperties.angle < 0) {
    state.vectorProperties.angle += 2 * Math.PI
  }
  // Determine the slice in which the angle exists
  let index =
    Math.floor(
      (state.vectorProperties.angle + angleOffset + Math.PI / 2 + Math.PI / 8) /
        (Math.PI / 4)
    ) % 8
  let compassDir = directions[index]
  //based on direction update x and y offsets in state
  //TODO: keep offset consistent during radius adjustment and use another gui element to control the way radius is handled, drawn as a compass, 8 options plus default center which is no offset
  //Direction shrinks opposite side. eg. radius 7 goes from diameter 15 to diameter 14
  //gui element could have 2 sliders, vertical and horizontal with 3 values each, offset -1, 0, 1 (right, none, left)
  //should only x1 and y1 offsets be available since they represent the center point being part of radius or not?
  if (state.clickCounter === 1 || forceCircle) {
    state.vectorProperties.x1Offset = -state.vectorProperties.offset
    state.vectorProperties.y1Offset = -state.vectorProperties.offset
  } else {
    switch (compassDir) {
      case "N":
        state.vectorProperties.y1Offset = -state.vectorProperties.offset
        break
      case "NE":
        state.vectorProperties.x1Offset = -state.vectorProperties.offset
        state.vectorProperties.y1Offset = -state.vectorProperties.offset
        break
      case "E":
        state.vectorProperties.x1Offset = -state.vectorProperties.offset
        break
      case "SE":
        state.vectorProperties.x1Offset = -state.vectorProperties.offset
        state.vectorProperties.y1Offset = -state.vectorProperties.offset
        break
      case "S":
        state.vectorProperties.y1Offset = -state.vectorProperties.offset
        break
      case "SW":
        state.vectorProperties.x1Offset = -state.vectorProperties.offset
        state.vectorProperties.y1Offset = -state.vectorProperties.offset
        break
      case "W":
        state.vectorProperties.x1Offset = -state.vectorProperties.offset
        break
      case "NW":
        state.vectorProperties.x1Offset = -state.vectorProperties.offset
        state.vectorProperties.y1Offset = -state.vectorProperties.offset
        break
      default:
      //none
    }
  }
}

export function updateEllipseControlPoints(state, canvas, vectorGui) {
  if (vectorGui.selectedPoint.xKey !== "px1") {
    state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
    state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
  }
  let dxa = state.vectorProperties.px2 - state.vectorProperties.px1
  let dya = state.vectorProperties.py2 - state.vectorProperties.py1
  let dxb = state.vectorProperties.px3 - state.vectorProperties.px1
  let dyb = state.vectorProperties.py3 - state.vectorProperties.py1
  if (vectorGui.selectedPoint.xKey === "px1") {
    state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
    state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
  }
  if (vectorGui.selectedPoint.xKey === "px1") {
    state.vectorProperties.px2 = state.vectorProperties.px1 + dxa
    state.vectorProperties.py2 = state.vectorProperties.py1 + dya
    state.vectorProperties.px3 = state.vectorProperties.px1 + dxb
    state.vectorProperties.py3 = state.vectorProperties.py1 + dyb
  } else if (vectorGui.selectedPoint.xKey === "px2") {
    state.vectorProperties.radA = Math.floor(Math.sqrt(dxa * dxa + dya * dya))
    if (state.vectorProperties.forceCircle) {
      state.vectorProperties.radB = state.vectorProperties.radA
    }
    let newVertex = updateEllipseVertex(
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px2,
      state.vectorProperties.py2,
      -Math.PI / 2,
      state.vectorProperties.radB
    )
    state.vectorProperties.px3 = newVertex.x
    state.vectorProperties.py3 = newVertex.y
    updateEllipseOffsets(state, canvas, state.vectorProperties.forceCircle, 0)
  } else if (vectorGui.selectedPoint.xKey === "px3") {
    state.vectorProperties.radB = Math.floor(Math.sqrt(dxb * dxb + dyb * dyb))
    if (state.vectorProperties.forceCircle) {
      state.vectorProperties.radA = state.vectorProperties.radB
    }
    let newVertex = updateEllipseVertex(
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px3,
      state.vectorProperties.py3,
      Math.PI / 2,
      state.vectorProperties.radA
    )
    state.vectorProperties.px2 = newVertex.x
    state.vectorProperties.py2 = newVertex.y
    updateEllipseOffsets(
      state,
      canvas,
      state.vectorProperties.forceCircle,
      1.5 * Math.PI
    )
  }
}
