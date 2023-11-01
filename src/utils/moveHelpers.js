/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Integer} dx
 * @param {Integer} dy
 */
export function translateAndWrap(ctx, dx, dy) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  // Get current image data
  const srcData = ctx.getImageData(0, 0, width, height)
  // Create an empty image data to store the result
  const destData = ctx.createImageData(width, height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate source index
      const srcIndex = (y * width + x) * 4

      // Calculate the new position with wrapping
      const newX = (x + dx + width) % width
      const newY = (y + dy + height) % height

      // Calculate destination index
      const destIndex = (newY * width + newX) * 4

      // Copy pixel data
      destData.data[destIndex] = srcData.data[srcIndex] // Red
      destData.data[destIndex + 1] = srcData.data[srcIndex + 1] // Green
      destData.data[destIndex + 2] = srcData.data[srcIndex + 2] // Blue
      destData.data[destIndex + 3] = srcData.data[srcIndex + 3] // Alpha
    }
  }

  // Put the translated image data onto the canvas
  ctx.putImageData(destData, 0, 0)
}

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Integer} dx
 * @param {Integer} dy
 */
export function translateWithoutWrap(ctx, dx, dy) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  // Get current image data
  const srcData = ctx.getImageData(0, 0, width, height)
  // Create an empty image data to store the result
  const destData = ctx.createImageData(width, height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate source index
      const srcIndex = (y * width + x) * 4

      // Calculate the new position
      const newX = x + dx
      const newY = y + dy

      // If the new position is within bounds, copy pixel data
      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        const destIndex = (newY * width + newX) * 4

        destData.data[destIndex] = srcData.data[srcIndex] // Red
        destData.data[destIndex + 1] = srcData.data[srcIndex + 1] // Green
        destData.data[destIndex + 2] = srcData.data[srcIndex + 2] // Blue
        destData.data[destIndex + 3] = srcData.data[srcIndex + 3] // Alpha
      }
    }
  }

  // Put the translated image data onto the canvas
  ctx.putImageData(destData, 0, 0)
}
