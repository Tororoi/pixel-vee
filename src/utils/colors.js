/**
 * Generate a random color
 * @returns {object} - { color: string, r: number, g: number, b: number, a: number }
 */
export function generateRandomRGB() {
  let r = Math.floor(Math.random() * 256)
  let g = Math.floor(Math.random() * 256)
  let b = Math.floor(Math.random() * 256)
  return { color: `rgba(${r},${g},${b},1)`, r, g, b, a: 255 }
}
