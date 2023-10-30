function rgbaToKS(rgba) {
  const r = 1 - rgba[0] / 255
  const g = 1 - rgba[1] / 255
  const b = 1 - rgba[2] / 255
  return [r, g, b, rgba[3]]
}

function kSToRGBA(ks) {
  const r = (1 - ks[0]) * 255
  const g = (1 - ks[1]) * 255
  const b = (1 - ks[2]) * 255
  return [r, g, b, ks[3]]
}

export function mixColors(rgba1, rgba2, t) {
  const ks1 = rgbaToKS(rgba1)
  const ks2 = rgbaToKS(rgba2)

  const mixedKS = [
    ks1[0] + t * (ks2[0] - ks1[0]),
    ks1[1] + t * (ks2[1] - ks1[1]),
    ks1[2] + t * (ks2[2] - ks1[2]),
    ks1[3] + t * (ks2[3] - ks1[3]), // This is a linear blend for alpha
  ]

  const mixedRGBA = kSToRGBA(mixedKS)
  return [
    Math.round(mixedRGBA[0]),
    Math.round(mixedRGBA[1]),
    Math.round(mixedRGBA[2]),
    mixedRGBA[3],
  ]
}

// Test
// const color1 = [255, 0, 0, 0.5] // Red with 50% opacity
// const color2 = [0, 0, 255, 0.7] // Blue with 70% opacity
// console.log(mixColors(color1, color2, 0.5)) // This should output a mix of red and blue
