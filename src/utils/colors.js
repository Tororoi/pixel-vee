import * as spectral from "./spectral.js"

export function generateRandomRGB() {
  let r = Math.floor(Math.random() * 256)
  let g = Math.floor(Math.random() * 256)
  let b = Math.floor(Math.random() * 256)
  return { color: `rgba(${r},${g},${b},1)`, r, g, b, a: 255 }
}

export function mixColorsFromCanvas(x, y, xMin, xMax, imageData, activeColor) {
  let pixelPos = (y * (xMax - xMin) + x) * 4
  const rgb1 = [
    imageData.data[pixelPos],
    imageData.data[pixelPos + 1],
    imageData.data[pixelPos + 2],
    imageData.data[pixelPos + 3],
  ]
  const rgb2 = [activeColor.r, activeColor.g, activeColor.b, activeColor.a]
  const t = 0.5 // mixing ratio
  const mixed = spectral.mix(rgb1, rgb2, t, spectral.RGBARRAY)
  return { r: mixed[0], g: mixed[1], b: mixed[2], a: mixed[3] }
}
