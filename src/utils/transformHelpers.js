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

  /**
   *
   * @param vector
   * @param properties
   * @param xProp
   * @param yProp
   * @param scaleX
   * @param scaleY
   * @param xOffset
   * @param yOffset
   * @param isMirroredHorizontally
   * @param isMirroredVertically
   */
  function transformControlPoint(
    vector,
    properties,
    xProp,
    yProp,
    scaleX,
    scaleY,
    xOffset,
    yOffset,
    isMirroredHorizontally,
    isMirroredVertically
  ) {
    if (Object.hasOwn(properties, xProp)) {
      let originalX = properties[xProp]
      let originalY = properties[yProp]
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
      updateVectorProperties(vector, newX, newY, xProp, yProp)
    }
  }
}
