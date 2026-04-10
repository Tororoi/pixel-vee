/**
 * 8x8 Bayer ordered dithering matrix and pattern generation.
 * Generates 64 threshold levels (1-64) for dither brush patterns.
 */

// Standard 8x8 Bayer matrix (values 0-63)
const bayerMatrix = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
]

const flatBayer = bayerMatrix.flat()

/**
 * Generate 64 dither patterns from the Bayer matrix.
 * Index 0: 1 pixel on (threshold=1)
 * Index N: pixels where bayerMatrix value < N+1 are "on"
 * Index 63: all pixels on (threshold=64)
 * @type {Array<{width: number, height: number, data: number[]}>}
 */
export const ditherPatterns = Array.from({ length: 64 }, (_, threshold) => ({
  width: 8,
  height: 8,
  data: flatBayer.map((v) => (v < threshold + 1 ? 1 : 0)),
}))

/**
 * Check if a pixel at absolute canvas position (x, y) is "on" in the pattern
 * @param {object} pattern - pattern from ditherPatterns
 * @param {number} x - absolute canvas x coordinate
 * @param {number} y - absolute canvas y coordinate
 * @param {number} ditherOffsetX - horizontal shift within 8x8 tile (0-7)
 * @param {number} ditherOffsetY - vertical shift within 8x8 tile (0-7)
 * @returns {boolean} true if pixel should be drawn with primary color
 */
export function isDitherOn(pattern, x, y, ditherOffsetX = 0, ditherOffsetY = 0) {
  let px = (((x + ditherOffsetX) % 8) + 8) % 8
  let py = (((y + ditherOffsetY) % 8) + 8) % 8
  return pattern.data[py * 8 + px] === 1
}
