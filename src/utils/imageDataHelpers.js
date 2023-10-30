/**
 *
 * @param {*} imageData - array of color channels r,g,b,a,r,g,b,a,etc.
 * @param {*} pixelPos - index in image data
 * @param {*} currentColor - {color,r,g,b,a}
 */
export function colorPixel(imageData, pixelPos, currentColor) {
  // const rgb1 = [
  //   imageData.data[pixelPos],
  //   imageData.data[pixelPos + 1],
  //   imageData.data[pixelPos + 2],
  //   imageData.data[pixelPos + 3],
  // ]
  // const rgb2 = [currentColor.r, currentColor.g, currentColor.b, currentColor.a]
  // const t = 0.5 // mixing ratio

  // const mixed = mixColors(rgb1, rgb2, t)
  // imageData.data[pixelPos] = mixed[0]
  // imageData.data[pixelPos + 1] = mixed[1]
  // imageData.data[pixelPos + 2] = mixed[2]
  // imageData.data[pixelPos + 3] = mixed[3]
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
