import { canvas } from "../Context/canvas.js"
import { getAngle } from "./trig.js"
import { updateVectorProperties } from "./vectorHelpers.js"

/**
 * Transforms raster content by rotating and stretching/shrinking.
 * @param {object} layer - The layer to run the transform on.
 * @param {ImageData} originalPixels - The original pixel data.
 * @param {object} newBoundaryBox - The new boundary box of the content after transformation.
 * @param {number} degrees - The number of degrees to rotate the content (0, 90, 180, 270).
 * @param {boolean} isMirroredHorizontally - Whether to mirror the content horizontally.
 * @param {boolean} isMirroredVertically - Whether to mirror the content vertically.
 * TODO: (Low Priority) Add support for non-90 degree rotations.
 * TODO: (Low Priority) Can this be refactored to only use one for loop that handles both rotation and stretching?
 */
export function transformRasterContent(
  layer,
  originalPixels,
  newBoundaryBox,
  degrees,
  isMirroredHorizontally = false,
  isMirroredVertically = false
) {
  const originalWidth = originalPixels.width
  const originalHeight = originalPixels.height
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  // Calculate rotated width and height
  const rotatedWidth = Math.round(
    Math.abs(originalWidth * cos) + Math.abs(originalHeight * sin)
  )
  const rotatedHeight = Math.round(
    Math.abs(originalWidth * sin) + Math.abs(originalHeight * cos)
  )
  const newWidth = Math.abs(newBoundaryBox.xMax - newBoundaryBox.xMin)
  const newHeight = Math.abs(newBoundaryBox.yMax - newBoundaryBox.yMin)

  layer.ctx.clearRect(0, 0, layer.cvs.width, layer.cvs.height)

  if (newWidth === 0 || newHeight === 0) {
    // If the new width or height is 0, return
    return
  }

  const rotatedPixels = new ImageData(rotatedWidth, rotatedHeight)

  const cx = originalWidth / 2
  const cy = originalHeight / 2
  const nCx = rotatedWidth / 2
  const nCy = rotatedHeight / 2

  // Rotate the original image
  for (let y = 0; y < originalHeight; y++) {
    for (let x = 0; x < originalWidth; x++) {
      // Calculate the position of each pixel relative to the center
      const dx = x - cx
      const dy = y - cy

      // Apply the rotation
      let newX = cos * dx - sin * dy + nCx
      let newY = sin * dx + cos * dy + nCy

      //NOTE: Fixes the issue where the image is not centered after rotation. TODO: (Low Priority) Find a better solution that addresses the problem directly in the calculation.
      if (degrees === 90 || degrees === 180) {
        newX -= 1
      }
      if (degrees === 180 || degrees === 270) {
        newY -= 1
      }

      // Round to get the index of the nearest pixel
      const finalX = Math.round(newX)
      const finalY = Math.round(newY)

      if (
        finalX >= 0 &&
        finalX < rotatedWidth &&
        finalY >= 0 &&
        finalY < rotatedHeight
      ) {
        const newIndex = (finalY * rotatedWidth + finalX) * 4
        const originalIndex = (y * originalWidth + x) * 4

        // Copy the pixel data
        for (let i = 0; i < 4; i++) {
          rotatedPixels.data[newIndex + i] =
            originalPixels.data[originalIndex + i]
        }
      }
    }
  }

  const adjustedPixels = new ImageData(newWidth, newHeight)
  // Adjusting algorithm (stretching or shrinking)
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      let rotatedX = Math.floor(x / (newWidth / rotatedWidth))
      let rotatedY = Math.floor(y / (newHeight / rotatedHeight))
      if (isMirroredHorizontally) {
        rotatedX = rotatedWidth - 1 - rotatedX // Mirror horizontally
      }
      if (isMirroredVertically) {
        rotatedY = rotatedHeight - 1 - rotatedY // Mirror vertically
      }

      const rotatedIndex = (rotatedY * rotatedWidth + rotatedX) * 4
      const newIndex = (y * newWidth + x) * 4

      for (let i = 0; i < 4; i++) {
        adjustedPixels.data[newIndex + i] = rotatedPixels.data[rotatedIndex + i]
      }
    }
  }

  // Place the transformed image back on the canvas
  layer.ctx.putImageData(
    adjustedPixels,
    Math.min(newBoundaryBox.xMin, newBoundaryBox.xMax),
    Math.min(newBoundaryBox.yMin, newBoundaryBox.yMax)
  )
}

/**
 * Calculates the bounding box of an ellipse after rotation.
 * @param {object} properties - The properties of the ellipse.
 * @param {number} properties.px1 - The x-coordinate of the center of the ellipse.
 * @param {number} properties.py1 - The y-coordinate of the center of the ellipse.
 * @param {number} properties.radA - The semi-major axis of the ellipse.
 * @param {number} properties.radB - The semi-minor axis of the ellipse.
 * @param {number} properties.angle - The angle of rotation in radians.
 * @returns {object} The bounding box of the ellipse after rotation.
 */
export function calculateEllipseBoundingBox(properties) {
  // Destructure the properties from the object
  const { px1, py1, radA, radB, angle, x1Offset, y1Offset } = properties

  // Use the angle directly as it is already in radians
  const theta = angle

  // Calculate the maximum x and y displacements (semi-axis lengths of the bounding box)
  const cosTheta = Math.cos(theta)
  const sinTheta = Math.sin(theta)
  const xMaxFromCenter = Math.sqrt(
    radA * radA * cosTheta * cosTheta + radB * radB * sinTheta * sinTheta
  )
  const yMaxFromCenter = Math.sqrt(
    radA * radA * sinTheta * sinTheta + radB * radB * cosTheta * cosTheta
  )

  // Calculate the bounding box by translating these maxima by the ellipse's center coordinates
  const xMin = Math.round(px1 - xMaxFromCenter)
  const xMax = Math.round(px1 + xMaxFromCenter + x1Offset + 1)
  const yMin = Math.round(py1 - yMaxFromCenter)
  const yMax = Math.round(py1 + yMaxFromCenter + y1Offset + 1)

  // Return the bounding box as an object
  return { xMin, yMin, xMax, yMax }
}

/**
 * Calculates the semi-major and semi-minor axes of a rotated ellipse within a given rectangle
 * @param ellipseBoundingBox - aligned with x and y axis. Not rotated.
 * @param angle - angle of rotation in radians of the ellipse along one axis
 */
function calculateEllipseAxes(ellipseBoundingBox, angle) {
  const { xMin, xMax, yMin, yMax } = ellipseBoundingBox

  // Calculate the half-widths of the bounding box
  const width = xMax - xMin
  const height = yMax - yMin

  const kk = Math.pow(1 / 2, 3 / 2) // * (1/k)
  const ww = width * width
  const hh = height * height
  let cos2Theta = Math.cos(2 * angle)
  // Prevent division by zero
  if (cos2Theta === 0) {
    cos2Theta = 0.0000001
  }

  // Calculate the semi-major and semi-minor axes
  const radA = kk * Math.sqrt(ww + hh + (ww - hh) / cos2Theta)
  const radB = kk * Math.sqrt(ww + hh - (ww - hh) / cos2Theta)
  // Return the calculated semi-major and semi-minor axes
  return { radA, radB }
}

/**
 *
 * @param W
 * @param H
 * @param T1y
 */
function calculateEllipseInclination(W, H, T1y) {
  // Helper function to convert degrees to radians
  // /**
  //  *
  //  * @param degrees
  //  */
  // function degToRad(degrees) {
  //   return (degrees * Math.PI) / 180
  // }

  // Calculate the denominator |W^2 - H^2|
  let denominator = Math.abs(W * W - H * H)

  // Calculate the numerator 2 * W * (2 * T1y - H)
  let numerator = 2 * W * (2 * T1y - H)

  // Calculate theta in radians
  let thetaRadians = 0.5 * Math.atan(numerator / denominator)

  // Convert theta to degrees
  // let thetaDegrees = thetaRadians * (180 / Math.PI)

  // Edge case: When W == H, theta should be 45 degrees or -45 degrees based on the sign of (2 * T1y - H)
  if (W === H) {
    // thetaDegrees = 2 * T1y - H >= 0 ? 45 : -45
    thetaRadians = Math.PI / 4
  }

  return 2 * Math.PI - thetaRadians
}

/**
 *
 * @param p1
 * @param p2
 * @param p3
 * @param p4
 * @param center
 */
function calculateEllipseOrientation(p1, p2, p3, p4, center) {
  // Helper function to calculate the midpoint between two points
  /**
   *
   * @param pointA
   * @param pointB
   */
  function midpoint(pointA, pointB) {
    return {
      x: (pointA.x + pointB.x) / 2,
      y: (pointA.y + pointB.y) / 2,
    }
  }

  // Calculate the midpoints of each side of the quadrilateral
  let m12 = midpoint(p1, p2)
  let m23 = midpoint(p2, p3)
  let m34 = midpoint(p3, p4)
  let m41 = midpoint(p4, p1)

  // Calculate the slopes of the lines through midpoints
  // Slope of the line through M12 and M34
  let m12_34 = (m34.y - m12.y) / (m34.x - m12.x)

  // Slope of the line through M23 and M41
  let m23_41 = (m41.y - m23.y) / (m41.x - m23.x)

  // Determine the major axis based on the spread of midpoints
  let majorAxisSlope
  if (Math.abs(m34.x - m12.x) > Math.abs(m41.x - m23.x)) {
    majorAxisSlope = m12_34
  } else {
    majorAxisSlope = m23_41
  }

  // Calculate the orientation angle of the ellipse's major axis
  let theta = Math.atan(majorAxisSlope)

  return theta
}

/**
 *
 * @param p1
 * @param p2
 * @param p3
 * @param p4
 * @param center
 */
function calculateEllipseDetails(p1, p2, p3, p4, center) {
  // Helper function to calculate the midpoint between two points
  /**
   *
   * @param pointA
   * @param pointB
   */
  function midpoint(pointA, pointB) {
    return {
      x: (pointA.x + pointB.x) / 2,
      y: (pointA.y + pointB.y) / 2,
    }
  }

  // Helper function to calculate the distance between two points
  /**
   *
   * @param pointA
   * @param pointB
   */
  function distance(pointA, pointB) {
    return Math.sqrt(
      Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2)
    )
  }

  // Calculate the midpoints of each side of the quadrilateral
  let m12 = midpoint(p1, p2)
  let m23 = midpoint(p2, p3)
  let m34 = midpoint(p3, p4)
  let m41 = midpoint(p4, p1)

  // Calculate the slopes of the lines through midpoints
  // Slope of the line through M12 and M34
  let m12_34 = (m34.y - m12.y) / (m34.x - m12.x)

  // Slope of the line through M23 and M41
  let m23_41 = (m41.y - m23.y) / (m41.x - m23.x)

  // Determine the major and minor axes based on the spread of midpoints
  let majorAxisSlope, minorAxisSlope
  let aMidpoints, bMidpoints
  if (Math.abs(m34.x - m12.x) > Math.abs(m41.x - m23.x)) {
    majorAxisSlope = m12_34
    minorAxisSlope = m23_41
    aMidpoints = [m12, m34]
    bMidpoints = [m23, m41]
  } else {
    majorAxisSlope = m23_41
    minorAxisSlope = m12_34
    aMidpoints = [m23, m41]
    bMidpoints = [m12, m34]
  }

  // Calculate the orientation angle of the ellipse's major axis
  let theta = Math.atan(majorAxisSlope)

  // Calculate the lengths of the semi-major and semi-minor axes
  let a = 0.5 * distance(aMidpoints[0], aMidpoints[1])
  let b = 0.5 * distance(bMidpoints[0], bMidpoints[1])

  return {
    theta: theta,
    semiMajorAxis: a,
    semiMinorAxis: b,
  }
}

/**
 * Plug the result of this function into the parametric equation for an ellipse to get the x and y values of the semi-major axis
 * @param {number} radA - semi-major axis
 * @param {number} radB - semi-minor axis
 * @param {number} scaleX - scaling factor along x-axis
 * @param {number} scaleY - scaling factor along y-axis
 * @param {number} radians - angle of rotation in radians
 * @returns {number} - time at first axis
 */
function getTimeAtFirstAxis(radA, radB, scaleX, scaleY, radians) {
  let a = radA
  let b = radB
  let c = scaleX
  let d = scaleY
  let phi = radians
  let a2 = a * a
  let b2 = b * b
  let c2 = c * c
  let d2 = d * d
  let term1 = a2 * c2 - b2 * d2
  let term2 = -b2 * c2 + a2 * d2
  let term3 = b2 * c2 - a2 * d2
  let term4 =
    (Math.pow(a, 4) * c2 * d2 +
      Math.pow(b, 4) * c2 * d2 +
      a2 * b2 * (Math.pow(c, 4) - 4 * c2 * d2 + Math.pow(d, 4))) *
    Math.pow(Math.sin(2 * phi), 2)
  let arctanYNumerator =
    term1 * Math.pow(Math.cos(phi), 2) + term2 * Math.pow(Math.sin(phi), 2)
  let arctanYDenominator = Math.sqrt(
    term1 * term1 * Math.pow(Math.cos(phi), 4) +
      term3 * term3 * Math.pow(Math.sin(phi), 4) +
      0.5 * term4
  )
  let arctanY = arctanYNumerator / arctanYDenominator
  let arctanXNumerator = 2 * a * b * (c2 - d2) * Math.sin(2 * phi)
  let arctanXDenominator = Math.sqrt(
    4 * term1 * term1 * Math.pow(Math.cos(phi), 4) +
      4 * term3 * term3 * Math.pow(Math.sin(phi), 4) +
      2 * term4
  )
  let arctanX = -arctanXNumerator / arctanXDenominator
  //Arctan[arctanY,arctanX]
  let timeAtFirstAxis = 0.5 * Math.atan2(arctanX, arctanY)
  return timeAtFirstAxis
}

/**
 * Transforms vector content by stretching/shrinking.
 * @param {object} vectors - The vectors associated with the content.
 * @param {object} vectorsSavedProperties - The saved properties of the vectors.
 * @param {object} previousBoundaryBox - The previous boundary box of the content before transformation.
 * @param {object} newBoundaryBox - The new boundary box of the content after transformation.
 * @param {boolean} isMirroredHorizontally - Whether to mirror the content horizontally.
 * @param {boolean} isMirroredVertically - Whether to mirror the content vertically.
 */
export function transformVectorContent(
  vectors,
  vectorsSavedProperties,
  previousBoundaryBox,
  newBoundaryBox,
  isMirroredHorizontally = false,
  isMirroredVertically = false
) {
  const originalWidth = Math.abs(
    previousBoundaryBox.xMax - previousBoundaryBox.xMin
  )
  const originalHeight = Math.abs(
    previousBoundaryBox.yMax - previousBoundaryBox.yMin
  )
  const newWidth = Math.abs(newBoundaryBox.xMax - newBoundaryBox.xMin)
  const newHeight = Math.abs(newBoundaryBox.yMax - newBoundaryBox.yMin)

  // Check if the original dimensions are zero
  if (originalWidth === 0 || originalHeight === 0) {
    //Original width or height is zero, transformation skipped.
    return
  }

  const scaleX = newWidth / originalWidth
  const scaleY = newHeight / originalHeight

  const xOffset = newBoundaryBox.xMin - previousBoundaryBox.xMin * scaleX
  const yOffset = newBoundaryBox.yMin - previousBoundaryBox.yMin * scaleY

  for (let vectorIndex in vectorsSavedProperties) {
    let originalProperties = { ...vectorsSavedProperties[vectorIndex] }
    let vector = vectors[vectorIndex]
    // Transform each control point
    transformControlPoint(
      vector,
      originalProperties,
      "px1",
      "py1",
      scaleX,
      scaleY,
      xOffset,
      yOffset,
      isMirroredHorizontally,
      isMirroredVertically
    )
    if (originalProperties.type === "ellipse") {
      //calculate new angle and length of radii. originalProperties has angle in radians, radA and radB as length in pixels
      // Recalculate the angle considering mirroring effects
      let angle = originalProperties.angle
      // // Update angle based on the scaling factors. updated angle should always exist in same quadrant as original angle
      // let newAngle = Math.atan2(
      //   scaleY * Math.sin(angle),
      //   scaleX * Math.cos(angle)
      // )
      // // let updatedAngle = -Math.PI / 3

      // // Consider mirroring effects on angle
      // if (isMirroredHorizontally) updatedAngle = Math.PI - updatedAngle
      // if (isMirroredVertically) updatedAngle = -updatedAngle

      //reverse engineer plotRotatedEllipse function to get new radii and angle. ellipse boundaries are known after transformation. p1 is the center point so calculate the boundary of the ellipse
      const originalEllipseBoundingBox =
        calculateEllipseBoundingBox(originalProperties)
      //TODO: (High Priority) Take a different approach to ellipse transformation. Find the minimum bounding rectangle (rotated at same angle as ellipse) then apply scaling to corners of rectangle. Before transformation, vertices are tangent to rectangle.
      const transformedEllipseBoundingBox = {
        xMin: Math.round(originalEllipseBoundingBox.xMin * scaleX + xOffset),
        xMax: Math.round(originalEllipseBoundingBox.xMax * scaleX + xOffset),
        yMin: Math.round(originalEllipseBoundingBox.yMin * scaleY + yOffset),
        yMax: Math.round(originalEllipseBoundingBox.yMax * scaleY + yOffset),
      }

      //TODO: (High Priority) In order to transform the ellipse,
      // 1. calculate the tangent points on the original bounding box,
      // 2. use scaleX and scaleY to move those points.
      // 3. calculate the new axis lengths and angle from the tangent points
      /**
       * The tangent points (x,y) can be expressed as:
       * Top: ( px1 + radA * cos(angle) , py1 + radB * cos(angle) )
       * Right: ( px1 + radA * sin(angle) , py1 + radB * sin(angle) )
       * Bottom: ( px1 - radA * cos(angle) , py1 - radB * cos(angle) )
       * Left: ( px1 - radA * sin(angle) , py1 - radB * sin(angle) )
       */
      /* plot ellipse rotated by angle (radian) */
      // console.log(originalProperties.x1Offset, originalProperties.y1Offset)
      // let a = originalProperties.radA
      // let b = originalProperties.radB
      // var xd = a * a,
      //   yd = b * b
      // var s = Math.sin(angle),
      //   zd = (xd - yd) * s /* ellipse rotation */
      // ;(xd = Math.sqrt(xd - zd * s)),
      //   (yd = Math.sqrt(yd + zd * s)) /* surrounding rect */
      // a = Math.floor(xd + 0.5)
      // b = Math.floor(yd + 0.5)
      // zd = (zd * a * b) / (xd * yd)
      // let x0 = originalProperties.px1 - a
      // let y0 = originalProperties.py1 - b
      // let x1 = originalProperties.px1 + a
      // let y1 = originalProperties.py1 + b
      // // x1 = x1 + originalProperties.x1Offset
      // // y1 = y1 + originalProperties.y1Offset
      // xd = x1 - x0
      // yd = y1 - y0
      // let w = xd * yd
      // if (w != 0.0) w = (w - zd) / (w + w) /* squared weight of P1 */
      // //Breaks down at smaller radii, need enforced minimum where offset is not applied? if assertion fails, try again after w is calculated without offset
      // if (!(w <= 1.0 && w >= 0.0)) {
      //   //if assertion expected to fail with offsets, remove offsets and reset vars before trying assert
      //   // x1 = x1 - originalProperties.x1Offset
      //   // y1 = y1 - originalProperties.y1Offset
      //   xd = x1 - x0
      //   yd = y1 - y0
      //   w = xd * yd
      //   if (w != 0.0) w = (w - zd) / (w + w) /* squared weight of P1 */
      // }
      // xd = Math.floor(xd * w + 0.5)
      // yd = Math.floor(yd * w + 0.5) /* snap to int */
      // const topTangent = {
      //   x: x0 + xd,
      //   y: y0,
      // }
      // const rightTangent = {
      //   x: x1,
      //   y: y1 - yd,
      // }
      // const bottomTangent = {
      //   x: x1 - xd,
      //   y: y1,
      // }
      // const leftTangent = {
      //   x: x0,
      //   y: y0 + yd,
      // }

      // // Calculate the new tangent points
      // const newTopTangent = {
      //   x: topTangent.x * scaleX + xOffset,
      //   y: topTangent.y * scaleY + yOffset,
      // }
      // const newRightTangent = {
      //   x: rightTangent.x * scaleX + xOffset,
      //   y: rightTangent.y * scaleY + yOffset,
      // }
      // const newBottomTangent = {
      //   x: bottomTangent.x * scaleX + xOffset,
      //   y: bottomTangent.y * scaleY + yOffset,
      // }
      // const newLeftTangent = {
      //   x: leftTangent.x * scaleX + xOffset,
      //   y: leftTangent.y * scaleY + yOffset,
      // }

      /////////////////////////////////
      // let centerX = vector.vectorProperties.px1
      // let centerY = vector.vectorProperties.py1
      // let radB =

      //////////////////////////////

      // // Calculate the new axis lengths
      // let updatedRadA = Math.abs((newRightTangent.x - newLeftTangent.x) / 2)
      // let updatedRadB = Math.abs((newTopTangent.y - newBottomTangent.y) / 2)

      // // Calculate the new angle
      // let updatedAngle = Math.atan2(
      //   newTopTangent.y - vector.vectorProperties.py1,
      //   newTopTangent.x - vector.vectorProperties.px1
      // )

      // Calculate the new axis lengths (formula not correct)
      // console.log(
      //   originalEllipseBoundingBox.xMax - originalEllipseBoundingBox.xMin,
      //   originalEllipseBoundingBox.yMax - originalEllipseBoundingBox.yMin,
      //   rightTangent.x - leftTangent.x,
      //   topTangent.y - bottomTangent.y
      // )

      // const width =
      //   transformedEllipseBoundingBox.xMax - transformedEllipseBoundingBox.xMin
      // const height =
      //   transformedEllipseBoundingBox.yMax - transformedEllipseBoundingBox.yMin
      // const center = {
      //   x: vector.vectorProperties.px1,
      //   y: vector.vectorProperties.py1,
      // }
      // let newEllipseDetails = calculateEllipseDetails(
      //   newLeftTangent,
      //   newTopTangent,
      //   newRightTangent,
      //   newBottomTangent,
      //   center
      // )
      // let updatedAngle = newEllipseDetails.theta
      // let updatedRadA = newEllipseDetails.semiMajorAxis
      // let updatedRadB = newEllipseDetails.semiMinorAxis
      // console.log(updatedRadA, updatedRadB)
      // console.log(angle * (180 / Math.PI), updatedAngle * (180 / Math.PI))
      // let denominator =
      //   Math.cos(updatedAngle) * Math.cos(updatedAngle) -
      //   Math.sin(updatedAngle) * Math.sin(updatedAngle)
      // let numerator = width * width - height * height
      // let k = numerator / denominator
      // let c = width * width + height * height
      // console.log(c + k, c - k)
      // let updatedRadA = Math.pow(0.5, 3 / 2) * Math.sqrt(Math.abs(c + k))
      // let updatedRadB = Math.pow(0.5, 3 / 2) * Math.sqrt(Math.abs(c - k))
      // console.log(updatedRadA, updatedRadB)
      // console.log(
      //   originalProperties.radA,
      //   updatedRadA,
      //   originalProperties.radB,
      //   updatedRadB
      // )

      // // Calculate the new angle (formula probably correct)
      // let updatedAngle =
      //   2 * Math.PI -
      //   Math.atan2(
      //     topTangent.y - originalProperties.py1,
      //     topTangent.x - originalProperties.px1
      //   )
      // // Calculate differences for both coordinates
      // let deltaX = x1 - x0
      // let deltaY = y1 - y0 - 2 * yd

      // // Calculate the angle in radians
      // let updatedAngle = Math.atan2(deltaY, deltaX)

      // // If yd > xd, we need to adjust the angle by 90 degrees (or pi/2 radians)
      // // because the semi-major axis is closer to being vertical.
      // if (yd > xd) {
      //   updatedAngle += Math.PI / 2
      // }

      // console.log(
      //   "updatedAngle: ",
      //   updatedAngle,
      //   "original angle: ",
      //   originalProperties.angle
      // )

      // const newEllipseValues = calculateEllipseAxes(
      //   transformedEllipseBoundingBox,
      //   updatedAngle
      // )
      // Calculate new radii
      // let radA = updatedRadA
      // let radB = updatedRadB
      let radA = originalProperties.radA
      let radB = originalProperties.radB

      ///////////////////////////
      const timeAtAxisA = getTimeAtFirstAxis(radA, radB, scaleX, scaleY, angle)
      console.log(
        timeAtAxisA,
        "radA: ",
        radA,
        "radB: ",
        radB,
        "scaleX: ",
        scaleX,
        "scaleY: ",
        scaleY,
        "angle: ",
        angle
      )
      //Plug in time to parametric equations for ellipse to get x and y values of semi-major axis vertex and length of axis
      let px2 =
        scaleX *
        (originalProperties.px1 +
          radA * Math.cos(timeAtAxisA) * Math.cos(angle) -
          radB * Math.sin(timeAtAxisA) * Math.sin(angle))
      let py2 =
        scaleY *
        (originalProperties.py1 +
          radB * Math.sin(timeAtAxisA) * Math.cos(angle) +
          radA * Math.cos(timeAtAxisA) * Math.sin(angle))

      let px3 =
        scaleX *
        (originalProperties.px1 +
          radA * Math.cos(timeAtAxisA - Math.PI / 2) * Math.cos(angle) -
          radB * Math.sin(timeAtAxisA - Math.PI / 2) * Math.sin(angle))
      let py3 =
        scaleY *
        (originalProperties.py1 +
          radB * Math.sin(timeAtAxisA - Math.PI / 2) * Math.cos(angle) +
          radA * Math.cos(timeAtAxisA - Math.PI / 2) * Math.sin(angle))

      //////////////////////›////
      // Calculate points on the ellipse's axes after transformation
      let p2 = {
        x: Math.round(px2),
        y: Math.round(py2),
      }
      let p3 = {
        x: Math.round(px3),
        y: Math.round(py3),
      }

      updateVectorProperties(vector, p2.x, p2.y, "px2", "py2")
      updateVectorProperties(vector, p3.x, p3.y, "px3", "py3")
      let dxa = p2.x - vector.vectorProperties.px1
      let dya = p2.y - vector.vectorProperties.py1
      let updatedAngle = getAngle(dxa, dya)
      vector.vectorProperties.angle = updatedAngle
      //new radA is length between p2 and p1
      vector.vectorProperties.radA = Math.sqrt(dxa * dxa + dya * dya)
      //new radB is length between p3 and p1
      let dxb = p3.x - vector.vectorProperties.px1
      let dyb = p3.y - vector.vectorProperties.py1
      vector.vectorProperties.radB = Math.sqrt(dxb * dxb + dyb * dyb)
      // vector.vectorProperties.radA = newRadA
      // vector.vectorProperties.radB = newRadB
      // vector.vectorProperties.angle = updatedAngle
    } else {
      transformControlPoint(
        vector,
        originalProperties,
        "px2",
        "py2",
        scaleX,
        scaleY,
        xOffset,
        yOffset,
        isMirroredHorizontally,
        isMirroredVertically
      )
      transformControlPoint(
        vector,
        originalProperties,
        "px3",
        "py3",
        scaleX,
        scaleY,
        xOffset,
        yOffset,
        isMirroredHorizontally,
        isMirroredVertically
      )
      transformControlPoint(
        vector,
        originalProperties,
        "px4",
        "py4",
        scaleX,
        scaleY,
        xOffset,
        yOffset,
        isMirroredHorizontally,
        isMirroredVertically
      )
    }
  }

  /**
   * Used for line control points and ellipse center point
   * @param {object} vector - The vector to transform.
   * @param {object} originalProperties - The saved properties of the vector.
   * @param {string} xKey - The x key of the control point. (String)
   * @param {string} yKey - The y key of the control point. (String)
   * @param {number} scaleX - The scaling factor in the x direction. (Float)
   * @param {number} scaleY - The scaling factor in the y direction. (Float)
   * @param {number} xOffset - The x offset. (Float)
   * @param {number} yOffset - The y offset. (Float)
   * @param {boolean} isMirroredHorizontally - Whether to mirror the content horizontally.
   * @param {boolean} isMirroredVertically - Whether to mirror the content vertically.
   */
  function transformControlPoint(
    vector,
    originalProperties,
    xKey,
    yKey,
    scaleX,
    scaleY,
    xOffset,
    yOffset,
    isMirroredHorizontally,
    isMirroredVertically
  ) {
    if (Object.hasOwn(originalProperties, xKey)) {
      let originalX = originalProperties[xKey]
      let originalY = originalProperties[yKey]
      let newX = originalX * scaleX + xOffset
      let newY = originalY * scaleY + yOffset

      // Apply mirroring if necessary
      if (isMirroredHorizontally) {
        newX = newBoundaryBox.xMax - newX + newBoundaryBox.xMin
      }
      if (isMirroredVertically) {
        newY = newBoundaryBox.yMax - newY + newBoundaryBox.yMin
      }
      newX = Math.round(newX)
      newY = Math.round(newY)
      // Update vector properties
      updateVectorProperties(vector, newX, newY, xKey, yKey)
    }
  }
}
