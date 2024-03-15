/**
 *
 * @param {object} layer - The layer to run the transform on
 * @param {ImageData} originalPixels - The original pixel data to be rotated
 * @param {object} originalBoundaryBox - The boundary box of the content to be transformed
 * @param {object} newBoundaryBox - The new boundary box of the content after rotation
 * @param {number} degrees - The number of degrees to rotate the content
 */
export function rotateRasterContent90DegreesClockwise(
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

  // Calculate new dimensions and rotation factor based on the degrees of rotation
  let rotationFactor
  switch (degrees % 360) {
    case 90:
      rotationFactor = (x, y) => ({ newX: originalHeight - 1 - y, newY: x })
      break
    case 180:
      rotationFactor = (x, y) => ({
        newX: originalWidth - 1 - x,
        newY: originalHeight - 1 - y,
      })
      break
    case 270:
      rotationFactor = (x, y) => ({ newX: y, newY: originalWidth - 1 - x })
      break
    default: // Assumes 0 degrees or invalid input, resulting in no rotation.
      rotationFactor = (x, y) => ({ newX: x, newY: y })
      break
  }

  const adjustedPixels = layer.ctx.createImageData(newWidth, newHeight)

  // Rotate each pixel
  for (let y = 0; y < originalHeight; y++) {
    for (let x = 0; x < originalWidth; x++) {
      const { newX, newY } = rotationFactor(x, y)
      const newIndex = (newY * newWidth + newX) * 4
      const originalIndex = (y * originalWidth + x) * 4
      // Copy the pixel data
      for (let i = 0; i < 4; i++) {
        adjustedPixels.data[newIndex + i] =
          originalPixels.data[originalIndex + i]
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
  const newWidth = Math.abs(newBoundaryBox.xMax - newBoundaryBox.xMin)
  const newHeight = Math.abs(newBoundaryBox.yMax - newBoundaryBox.yMin)

  let rotationFactor
  switch (degrees % 360) {
    case 90:
      // For 90 degrees rotation, (x, y) goes to (newHeight-y-1, x)
      rotationFactor = (x, y, oWidth, oHeight, nWidth, nHeight) => ({
        newX: nHeight - 1 - y,
        newY: x,
      })
      break
    case 180:
      // For 180 degrees rotation, (x, y) goes to (oWidth-x-1, oHeight-y-1)
      rotationFactor = (x, y, oWidth, oHeight, nWidth, nHeight) => ({
        newX: oWidth - 1 - x,
        newY: oHeight - 1 - y,
      })
      break
    case 270:
      // For 270 degrees rotation, (x, y) goes to (y, oWidth-x-1)
      rotationFactor = (x, y, oWidth, oHeight, nWidth, nHeight) => ({
        newX: y,
        newY: oWidth - 1 - x,
      })
      break
    default: // Assumes 0 degrees or invalid input, resulting in no rotation.
      rotationFactor = (x, y, oWidth, oHeight, nWidth, nHeight) => ({
        newX: x,
        newY: y,
      })
      break
  }

  layer.ctx.clearRect(0, 0, layer.cvs.width, layer.cvs.height)

  if (newWidth === 0 || newHeight === 0) {
    // If the new width or height is 0, return
    return
  }

  const adjustedPixels = new ImageData(newWidth, newHeight)

  // Apply transformations
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      // Adjust coordinates for stretching/shrinking
      let originalX = Math.floor(x / (newWidth / originalWidth))
      let originalY = Math.floor(y / (newHeight / originalHeight))
      if (isMirroredHorizontally) {
        originalX = originalWidth - 1 - originalX
      }
      if (isMirroredVertically) {
        originalY = originalHeight - 1 - originalY
      }

      const originalIndex = (originalY * originalWidth + originalX) * 4
      // Apply rotation
      const { newX, newY } = rotationFactor(
        x,
        y,
        originalWidth,
        originalHeight,
        newWidth,
        newHeight
      )

      const newIndex = (newY * newWidth + newX) * 4
      // Copy the pixel data
      for (let i = 0; i < 4; i++) {
        adjustedPixels.data[newIndex + i] =
          originalPixels.data[originalIndex + i]
      }
    }
  }

  // layer.ctx.clearRect(0, 0, layer.cvs.width, layer.cvs.height)
  // Place the transformed image back on the canvas
  layer.ctx.putImageData(
    adjustedPixels,
    newBoundaryBox.xMin,
    newBoundaryBox.yMin
  )
}
