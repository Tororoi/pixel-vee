/**
 *
 * @param {*} imageData - array of color channels r,g,b,a,r,g,b,a,etc.
 * @param {*} pixelPos - index in image data
 * @param {*} currentColor - {color,r,g,b,a}
 */
export function colorPixel(imageData, pixelPos, currentColor) {
  imageData.data[pixelPos] = currentColor.r
  imageData.data[pixelPos + 1] = currentColor.g
  imageData.data[pixelPos + 2] = currentColor.b
  imageData.data[pixelPos + 3] = currentColor.a
}

/**
 *
 * @param {*} imageData - array of color channels r,g,b,a,r,g,b,a,etc.
 * @param {*} pixelPos - index in image data
 * @param {*} startColor - {color,r,g,b,a}
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
