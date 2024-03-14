/**
 *
 * @param {object} layer - The layer to run the transform on
 * @param {object} boundaryBox - The boundary box of the content to be transformed
 * @param {object} angleDegrees - The angle to rotate the content counter clockwise
 * @param {object} rotatedBoundaryBox - The new boundary box of the content after rotation
 */
export function rotateRasterContent90DegreesClockwise(
  layer,
  boundaryBox,
  rotatedBoundaryBox
) {
  // Calculate dimensions of the boundaryBox
  const originalWidth = boundaryBox.xMax - boundaryBox.xMin
  const originalHeight = boundaryBox.yMax - boundaryBox.yMin

  // Since rotation is always 90 degrees clockwise, swap dimensions
  const rotatedWidth = originalHeight
  const rotatedHeight = originalWidth

  // Get the original pixel data within the boundaryBox
  const originalPixels = layer.ctx.getImageData(
    boundaryBox.xMin,
    boundaryBox.yMin,
    originalWidth,
    originalHeight
  )
  const rotatedPixels = layer.ctx.createImageData(rotatedWidth, rotatedHeight)

  // Rotate each pixel
  for (let y = 0; y < originalHeight; y++) {
    for (let x = 0; x < originalWidth; x++) {
      const newIndex = (x * rotatedWidth + (originalHeight - 1 - y)) * 4
      const originalIndex = (y * originalWidth + x) * 4

      // Copy the pixel data
      for (let i = 0; i < 4; i++) {
        rotatedPixels.data[newIndex + i] =
          originalPixels.data[originalIndex + i]
      }
    }
  }

  layer.ctx.clearRect(0, 0, layer.cvs.width, layer.cvs.height)
  // Place the rotated image back on the canvas, aligning with the top left corner of the original boundaryBox
  layer.ctx.putImageData(
    rotatedPixels,
    rotatedBoundaryBox.xMin,
    rotatedBoundaryBox.yMin
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

      const originalIndex = (originalX + originalY * originalWidth) * 4
      const newIndex = (x + y * newWidth) * 4

      adjustedPixels.data[newIndex] = originalPixels.data[originalIndex] // R
      adjustedPixels.data[newIndex + 1] = originalPixels.data[originalIndex + 1] // G
      adjustedPixels.data[newIndex + 2] = originalPixels.data[originalIndex + 2] // B
      adjustedPixels.data[newIndex + 3] = originalPixels.data[originalIndex + 3] // A
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

  //TODO: (High Priority) Add to timeline, store adjusted pixels either as image data array or store layer.cvs as dataURL
}
