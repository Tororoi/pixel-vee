/**
 *
 * @param {object} layer - The layer to run the transform on
 * @param {object} boundaryBox - The boundary box of the content to be transformed
 * @param {object} angleDegrees - The angle to rotate the content counter clockwise
 */
export function rotateRasterContent(layer, boundaryBox, angleDegrees) {
  // Calculate dimensions and center of the boundaryBox
  const originalWidth = boundaryBox.xMax - boundaryBox.xMin
  const originalHeight = boundaryBox.yMax - boundaryBox.yMin
  const centerX = originalWidth / 2
  const centerY = originalHeight / 2
  const angleRadians = (angleDegrees * Math.PI) / 180

  // Get the original pixel data within the boundaryBox
  const originalPixels = layer.ctx.getImageData(
    boundaryBox.xMin,
    boundaryBox.yMin,
    originalWidth,
    originalHeight
  )
  const rotatedPixels = layer.ctx.createImageData(originalWidth, originalHeight)

  // Calculate the rotated position for each pixel
  for (let y = 0; y < originalHeight; y++) {
    for (let x = 0; x < originalWidth; x++) {
      const adjustedX = x - centerX
      const adjustedY = y - centerY

      // Apply rotation matrix to each pixel position
      const newX =
        Math.cos(angleRadians) * adjustedX -
        Math.sin(angleRadians) * adjustedY +
        centerX
      const newY =
        Math.sin(angleRadians) * adjustedX +
        Math.cos(angleRadians) * adjustedY +
        centerY

      if (
        newX >= 0 &&
        newX < originalWidth &&
        newY >= 0 &&
        newY < originalHeight
      ) {
        const originalIndex =
          (Math.floor(newY) * originalWidth + Math.floor(newX)) * 4
        const newIndex = (y * originalWidth + x) * 4

        // Copy the pixel data
        for (let i = 0; i < 4; i++) {
          rotatedPixels.data[newIndex + i] =
            originalPixels.data[originalIndex + i]
        }
      }
    }
  }

  // Clear the area where the rotated image will be placed
  layer.ctx.clearRect(
    boundaryBox.xMin,
    boundaryBox.yMin,
    originalWidth,
    originalHeight
  )

  // Place the rotated image back on the canvas at the original boundaryBox position
  layer.ctx.putImageData(rotatedPixels, boundaryBox.xMin, boundaryBox.yMin)
}

/**
 *
 * @param {object} layer - The layer to run the transform on
 * @param {ImageData} originalPixels - The original pixel data to be stretched or shrunk
 * @param {object} originalBoundaryBox - The original boundary box of the content to be transformed
 * @param {object} newBoundaryBox - The new boundary box of the content to be transformed
 */
export function stretchRasterContent(
  layer,
  originalPixels,
  originalBoundaryBox,
  newBoundaryBox
) {
  const originalWidth = originalBoundaryBox.xMax - originalBoundaryBox.xMin
  const originalHeight = originalBoundaryBox.yMax - originalBoundaryBox.yMin
  const newWidth = newBoundaryBox.xMax - newBoundaryBox.xMin
  const newHeight = newBoundaryBox.yMax - newBoundaryBox.yMin

  if (newWidth === 0 || newHeight === 0) {
    // If the new width or height is 0, return
    return
  }
  // Create a new ImageData object to hold the stretched or shrunk image
  const adjustedPixels = layer.ctx.createImageData(newWidth, newHeight)

  // Adjusting algorithm (stretching or shrinking)
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const originalX = Math.floor(x / (newWidth / originalWidth))
      const originalY = Math.floor(y / (newHeight / originalHeight))
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
    newBoundaryBox.xMin,
    newBoundaryBox.yMin
  )

  //TODO: (High Priority) Add to timeline, store adjusted pixels either as image data array or store layer.cvs as dataURL
}

/**
 *
 * @param {object} layer - The layer to run the transform on
 * @param {object} boundaryBox - The boundary box of the content to be transformed
 * @param {boolean} flipHorizontally - Whether to flip horizontally or vertically
 */
export function flipRasterContent(
  layer,
  boundaryBox,
  flipHorizontally
) {
  const tempCanvas = document.createElement("canvas")
  const tempCTX = tempCanvas.getContext("2d", {
    willReadFrequently: true,
  })
  tempCanvas.width = boundaryBox.xMax - boundaryBox.xMin
  tempCanvas.height = boundaryBox.yMax - boundaryBox.yMin
  if (flipHorizontally) {
    //flip horizontally
    tempCTX.setTransform(-1, 0, 0, 1, tempCanvas.width, 0)
  } else {
    //flip vertically
    tempCTX.setTransform(1, 0, 0, -1, 0, tempCanvas.height)
  }
  tempCTX.drawImage(
    layer.cvs,
    boundaryBox.xMin,
    boundaryBox.yMin,
    tempCanvas.width,
    tempCanvas.height,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  )
  layer.ctx.clearRect(
    boundaryBox.xMin,
    boundaryBox.yMin,
    tempCanvas.width,
    tempCanvas.height
  )
  layer.ctx.drawImage(
    tempCanvas,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height,
    boundaryBox.xMin,
    boundaryBox.yMin,
    tempCanvas.width,
    tempCanvas.height
  )
}
