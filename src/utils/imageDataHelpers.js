/**
 * @param {ImageData} imageData - array of color channels r,g,b,a,r,g,b,a,etc.
 * @param {number} pixelPos - index in image data (Integer)
 * @param {object} currentColor - {color,r,g,b,a}
 */
export function colorPixel(imageData, pixelPos, currentColor) {
  imageData.data[pixelPos] = currentColor.r
  imageData.data[pixelPos + 1] = currentColor.g
  imageData.data[pixelPos + 2] = currentColor.b
  imageData.data[pixelPos + 3] = currentColor.a
}

/**
 * @param {ImageData} imageData - array of color channels r,g,b,a,r,g,b,a,etc.
 * @param {number} pixelPos - index in image data (Integer)
 * @param {object} startColor - {color,r,g,b,a}
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {boolean} selectionInversed - {true/false}
 * @returns {boolean} - true if pixel matches startColor
 */
export function matchStartColor(
  imageData,
  pixelPos,
  startColor,
  boundaryBox,
  selectionInversed
) {
  if (selectionInversed) {
    //check if pixel is inside of boundaryBox and return false if it is
    // Calculate x and y from pixelPos
    const x = (pixelPos / 4) % imageData.width
    const y = Math.floor(pixelPos / 4 / imageData.width)

    // Check if the pixel is inside the boundary box
    const insideBoundary =
      x >= boundaryBox.xMin &&
      x < boundaryBox.xMax &&
      y >= boundaryBox.yMin &&
      y < boundaryBox.yMax
    if (insideBoundary) {
      return false
    }
  }
  let r = imageData.data[pixelPos]
  let g = imageData.data[pixelPos + 1]
  let b = imageData.data[pixelPos + 2]
  let a = imageData.data[pixelPos + 3]
  return (
    r === startColor.r &&
    g === startColor.g &&
    b === startColor.b &&
    a === startColor.a
  )
}

/**
 * Get color of pixel at x/y coordinates
 * @param {ImageData} imageData - data: array of color channels r,g,b,a,r,g,b,a,etc.
 * @param {number} x - (Integer)
 * @param {number} y - (Integer)
 * @returns {string} rgba color
 */
export function getColor(imageData, x, y) {
  let canvasColor = {}

  let startPos = (y * imageData.width + x) * 4
  //clicked color
  canvasColor.r = imageData.data[startPos]
  canvasColor.g = imageData.data[startPos + 1]
  canvasColor.b = imageData.data[startPos + 2]
  canvasColor.a = imageData.data[startPos + 3]
  canvasColor.color = `rgba(${canvasColor.r},${canvasColor.g},${
    canvasColor.b
  },${canvasColor.a / 255})`
  return canvasColor
}
