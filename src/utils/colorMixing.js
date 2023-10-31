//hsl
//TODO: consolidate with colorConversion.js
function rgbaToHsl(r, g, b, a) {
  r /= 255
  g /= 255
  b /= 255

  let maxVal = Math.max(r, g, b),
    minVal = Math.min(r, g, b)
  let h,
    s,
    l = (maxVal + minVal) / 2

  if (maxVal === minVal) {
    h = s = 0
  } else {
    let d = maxVal - minVal
    s = l > 0.5 ? d / (2 - maxVal - minVal) : d / (maxVal + minVal)

    switch (maxVal) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h /= 6
  }
  return [h, s, l, a]
}

function hslToRgba(h, s, l, a) {
  function hueToRgb(p, q, t) {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r, g, b
  if (s === 0) {
    r = g = b = l
  } else {
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s
    let p = 2 * l - q
    r = hueToRgb(p, q, h + 1 / 3)
    g = hueToRgb(p, q, h)
    b = hueToRgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a]
}

export function mixColors(rgba1, rgba2, t) {
  let hsl1 = rgbaToHsl(...rgba1)
  let hsl2 = rgbaToHsl(...rgba2)
  // Mix the colors
  let mixedHSL = [
    (hsl1[0] + hsl2[0]) / 2,
    (hsl1[1] + hsl2[1]) / 2,
    (hsl1[2] + hsl2[2]) / 2,
    (hsl1[3] + hsl2[3]) / 2,
  ]
  console.log(mixedHSL)
  return hslToRgba(...mixedHSL)
}
