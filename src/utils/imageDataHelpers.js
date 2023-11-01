/**
 *
 * @param {ImageData} imageData - array of color channels r,g,b,a,r,g,b,a,etc.
 * @param {Integer} pixelPos - index in image data
 * @param {Object} currentColor - {color,r,g,b,a}
 */
export function colorPixel(imageData, pixelPos, currentColor) {
  imageData.data[pixelPos] = currentColor.r
  imageData.data[pixelPos + 1] = currentColor.g
  imageData.data[pixelPos + 2] = currentColor.b
  imageData.data[pixelPos + 3] = currentColor.a
}

/**
 *
 * @param {ImageData} imageData - array of color channels r,g,b,a,r,g,b,a,etc.
 * @param {Integer} pixelPos - index in image data
 * @param {Object} startColor - {color,r,g,b,a}
 * @returns {boolean}
 */
export function matchStartColor(imageData, pixelPos, startColor) {
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
 * @param {integer} x
 * @param {integer} y
 * @param {ImageData} colorLayer
 * @returns {string} rgba color
 * dependencies - none
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
