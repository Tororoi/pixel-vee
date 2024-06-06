import { calcEllipseParamsFromConics } from "./ellipse.js"
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
  const xMax = Math.round(px1 + xMaxFromCenter + x1Offset)
  const yMin = Math.round(py1 - yMaxFromCenter)
  const yMax = Math.round(py1 + yMaxFromCenter + y1Offset)

  // Return the bounding box as an object
  return { xMin, yMin, xMax, yMax }
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
    previousBoundaryBox.xMax - 1 - previousBoundaryBox.xMin
  )
  const originalHeight = Math.abs(
    previousBoundaryBox.yMax - 1 - previousBoundaryBox.yMin
  )
  const newWidth = Math.abs(newBoundaryBox.xMax - 1 - newBoundaryBox.xMin)
  const newHeight = Math.abs(newBoundaryBox.yMax - 1 - newBoundaryBox.yMin)

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
    if (originalProperties.type === "ellipse") {
      // Calculate the new tangent points
      transformControlPoint(
        vector,
        originalProperties,
        "leftTangentX",
        "leftTangentY",
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
        "topTangentX",
        "topTangentY",
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
        "rightTangentX",
        "rightTangentY",
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
        "bottomTangentX",
        "bottomTangentY",
        scaleX,
        scaleY,
        xOffset,
        yOffset,
        isMirroredHorizontally,
        isMirroredVertically
      )
      if ((originalProperties.angle % Math.PI) / 2 === 0) {
        //For right angles, angle remains the same and vertices can be stretched same way as center point
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
        //recalculate radA and radB
        let dxa = vector.vectorProperties.px2 - vector.vectorProperties.px1
        let dya = vector.vectorProperties.py2 - vector.vectorProperties.py1
        vector.vectorProperties.radA = Math.sqrt(dxa * dxa + dya * dya)
        let dxb = vector.vectorProperties.px3 - vector.vectorProperties.px1
        let dyb = vector.vectorProperties.py3 - vector.vectorProperties.py1
        vector.vectorProperties.radB = Math.sqrt(dxb * dxb + dyb * dyb)
      } else {
        const px1 = Math.round(
          vector.vectorProperties.leftTangentX +
            (vector.vectorProperties.rightTangentX -
              vector.vectorProperties.leftTangentX) /
              2
        )
        const py1 = Math.round(
          vector.vectorProperties.topTangentY +
            (vector.vectorProperties.bottomTangentY -
              vector.vectorProperties.topTangentY) /
              2
        )
        const { px2, py2, px3, py3 } = calcEllipseParamsFromConics(
          vector.vectorProperties.weight,
          vector.vectorProperties.leftTangentX,
          vector.vectorProperties.leftTangentY,
          vector.vectorProperties.topTangentX,
          vector.vectorProperties.topTangentY,
          vector.vectorProperties.rightTangentX,
          vector.vectorProperties.rightTangentY,
          vector.vectorProperties.bottomTangentX,
          vector.vectorProperties.bottomTangentY,
          px1,
          py1,
          originalProperties.angle
        )
        //Don't need to use updateVectorProperties function as values are already corrected for the layer offsets
        vector.vectorProperties.px1 = px1
        vector.vectorProperties.py1 = py1
        vector.vectorProperties.px2 = px2
        vector.vectorProperties.py2 = py2
        vector.vectorProperties.px3 = px3
        vector.vectorProperties.py3 = py3
        //new radA is length between p2 and p1
        let dxa = px2 - px1
        let dya = py2 - py1
        vector.vectorProperties.radA = Math.sqrt(dxa * dxa + dya * dya)
        // new radB is length between p3 and p1
        let dxb = px3 - px1
        let dyb = py3 - py1
        vector.vectorProperties.radB = Math.sqrt(dxb * dxb + dyb * dyb)
        // new angle is angle between p2 and p1
        let updatedAngle = getAngle(dxa, dya)
        while (updatedAngle < 0) {
          updatedAngle += 2 * Math.PI
        }
        vector.vectorProperties.angle = updatedAngle
      }
      //adjust offsets TODO: (High Priority) Currently adjusting vector after transformation may change the min/max values of the bounding box even without changing the position of control points. Unknown what best approach to solve this is.
      vector.vectorProperties.x1Offset =
        (vector.vectorProperties.rightTangentX -
          vector.vectorProperties.leftTangentX) %
          2 ===
        0
          ? 0
          : -1
      vector.vectorProperties.y1Offset =
        (vector.vectorProperties.bottomTangentY -
          vector.vectorProperties.topTangentY) %
          2 ===
        0
          ? 0
          : -1
      vector.vectorProperties.unifiedOffset =
        vector.vectorProperties.x1Offset * vector.vectorProperties.y1Offset
    } else {
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
      let originalX = originalProperties[xKey] + vector.layer.x
      let originalY = originalProperties[yKey] + vector.layer.y
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
