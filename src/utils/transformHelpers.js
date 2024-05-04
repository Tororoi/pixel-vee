import { canvas } from "../Context/canvas.js"
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
      // Update angle based on the scaling factors. updated angle should always exist in same quadrant as original angle
      let updatedAngle = Math.atan2(
        scaleY * Math.sin(angle),
        scaleX * Math.cos(angle)
      )
      // let updatedAngle = -Math.PI / 3

      // Consider mirroring effects on angle
      if (isMirroredHorizontally) updatedAngle = Math.PI - updatedAngle
      if (isMirroredVertically) updatedAngle = -updatedAngle

      //reverse engineer plotRotatedEllipse function to get new radii and angle. ellipse boundaries are known after transformation. p1 is the center point so calculate the boundary of the ellipse
      const originalEllipseBoundingBox =
        calculateEllipseBoundingBox(originalProperties)
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

      const newEllipseValues = calculateEllipseAxes(
        transformedEllipseBoundingBox,
        updatedAngle
      )
      // Calculate new radii
      let radA = newEllipseValues.radA
      let radB = newEllipseValues.radB
      // Calculate points on the ellipse's axes after transformation
      let p2 = {
        x: Math.round(
          vector.vectorProperties.px1 + radA * Math.cos(updatedAngle)
        ),
        y: Math.round(
          vector.vectorProperties.py1 + radA * Math.sin(updatedAngle)
        ),
      }
      let p3 = {
        x: Math.round(
          vector.vectorProperties.px1 +
            radB * Math.cos(updatedAngle - Math.PI / 2)
        ),
        y: Math.round(
          vector.vectorProperties.py1 +
            radB * Math.sin(updatedAngle - Math.PI / 2)
        ),
      }

      updateVectorProperties(vector, p2.x, p2.y, "px2", "py2")
      updateVectorProperties(vector, p3.x, p3.y, "px3", "py3")
      vector.vectorProperties.angle = updatedAngle
      vector.vectorProperties.radA = radA
      vector.vectorProperties.radB = radB
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
