/**
 *
 * @param {object} layer - The layer to run the transform on
 * @param {ImageData} originalPixels - The original pixel data to be rotated
 * @param {object} originalBoundaryBox - The boundary box of the content to be transformed
 * @param {object} newBoundaryBox - The new boundary box of the content after rotation
 * @param {number} degrees - The number of degrees to rotate the content
 */
export function rotateRasterContent(
  layer,
  originalPixels,
  originalBoundaryBox,
  newBoundaryBox,
  degrees
) {
  // Calculate dimensions of the originalBoundaryBox
  const originalWidth = originalBoundaryBox.xMax - originalBoundaryBox.xMin
  const originalHeight = originalBoundaryBox.yMax - originalBoundaryBox.yMin
  const newWidth = Math.abs(newBoundaryBox.xMax - newBoundaryBox.xMin)
  const newHeight = Math.abs(newBoundaryBox.yMax - newBoundaryBox.yMin)

  // Convert degrees to radians for trigonometric functions
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(-radians)
  const sin = Math.sin(-radians)

  const adjustedPixels = layer.ctx.createImageData(newWidth, newHeight)

  // Calculate the center of the image
  const cx = originalWidth / 2
  const cy = originalHeight / 2
  const nCx = newWidth / 2
  const nCy = newHeight / 2

  // Iterate through new dimensions and calculate the corresponding pixel in the original image
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      // Calculate the position of each pixel relative to the center of the new image
      const dx = x - nCx
      const dy = y - nCy

      // Apply the inverse rotation to find the corresponding original pixel
      const originalX = cos * dx - sin * dy + cx
      const originalY = sin * dx + cos * dy + cy

      // Round to get the index of the nearest pixel in the original image
      const finalX = Math.round(originalX)
      const finalY = Math.round(originalY)

      if (
        finalX >= 0 &&
        finalX < originalWidth &&
        finalY >= 0 &&
        finalY < originalHeight
      ) {
        const newIndex = (y * newWidth + x) * 4
        const originalIndex = (finalY * originalWidth + finalX) * 4

        // Copy the pixel data from the original image to the new position in the adjusted image
        for (let i = 0; i < 4; i++) {
          adjustedPixels.data[newIndex + i] =
            originalPixels.data[originalIndex + i]
        }
      }
    }
  }

  layer.ctx.clearRect(0, 0, layer.cvs.width, layer.cvs.height)
  // Place the rotated image back on the canvas, aligning with the top left corner of the original boundaryBox
  layer.ctx.putImageData(
    adjustedPixels,
    newBoundaryBox.xMin,
    newBoundaryBox.yMin
  )
}

/**
 *
 * @param {object} layer - The layer to run the transform on
 * @param {ImageData} originalPixels - The original pixel data to be stretched or shrunk
 * @param {object} originalBoundaryBox - The original boundary box of the content to be transformed
 * @param {object} newBoundaryBox - The new boundary box of the content to be transformed
 * @param {boolean} isMirroredHorizontally - Whether to mirror horizontally
 * @param {boolean} isMirroredVertically - Whether to mirror vertically
 */
export function stretchRasterContent(
  layer,
  originalPixels,
  originalBoundaryBox,
  newBoundaryBox,
  isMirroredHorizontally = false,
  isMirroredVertically = false
) {
  const originalWidth = originalBoundaryBox.xMax - originalBoundaryBox.xMin
  const originalHeight = originalBoundaryBox.yMax - originalBoundaryBox.yMin
  const newWidth = Math.abs(newBoundaryBox.xMax - newBoundaryBox.xMin)
  const newHeight = Math.abs(newBoundaryBox.yMax - newBoundaryBox.yMin)

  if (newWidth === 0 || newHeight === 0) {
    // If the new width or height is 0, return
    return
  }
  // Create a new ImageData object to hold the stretched or shrunk image
  const adjustedPixels = layer.ctx.createImageData(newWidth, newHeight)

  // Adjusting algorithm (stretching or shrinking)
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      let originalX = Math.floor(x / (newWidth / originalWidth))
      let originalY = Math.floor(y / (newHeight / originalHeight))
      if (isMirroredHorizontally) {
        originalX = originalWidth - 1 - originalX // Mirror horizontally
      }
      if (isMirroredVertically) {
        originalY = originalHeight - 1 - originalY // Mirror vertically
      }

      const originalIndex = (originalY * originalWidth + originalX) * 4
      const newIndex = (y * newWidth + x) * 4

      for (let i = 0; i < 4; i++) {
        adjustedPixels.data[newIndex + i] =
          originalPixels.data[originalIndex + i]
      }
    }
  }

  //clear entire canvas (layer should be temporary layer and therefore have no other content)
  layer.ctx.clearRect(0, 0, layer.cvs.width, layer.cvs.height)
  // Place the adjusted image back on the canvas
  layer.ctx.putImageData(
    adjustedPixels,
    Math.min(newBoundaryBox.xMin, newBoundaryBox.xMax),
    Math.min(newBoundaryBox.yMin, newBoundaryBox.yMax)
  )
}

/**
 * Transforms raster content by rotating and stretching/shrinking.
 * @param {object} layer - The layer to run the transform on.
 * @param {ImageData} originalPixels - The original pixel data.
 * @param {object} originalBoundaryBox - The original boundary box of the content to be transformed.
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
  originalBoundaryBox,
  newBoundaryBox,
  degrees,
  isMirroredHorizontally = false,
  isMirroredVertically = false
) {
  const originalWidth = originalBoundaryBox.xMax - originalBoundaryBox.xMin
  const originalHeight = originalBoundaryBox.yMax - originalBoundaryBox.yMin
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
      const newX = cos * dx - sin * dy + nCx
      const newY = sin * dx + cos * dy + nCy

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
