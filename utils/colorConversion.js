//===================================//
//==== * Color Space Conversion * ===//
//===================================//

/**
 * @param {integer} red - red value (0-255)
 * @param {integer} green - green value (0-255)
 * @param {integer} blue - blue value (0-255)
 * @returns object with hsl values
 */
export const RGBToHSL = ({red, green, blue}) => {
  // Make r, g, and b fractions of 1
  let r = red / 255
  let g = green / 255
  let b = blue / 255

  // Find greatest and smallest channel values
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0

  //* Hue *//
  // No difference
  if (delta == 0) h = 0
  // Red is max
  else if (cmax == r) h = ((g - b) / delta) % 6
  // Green is max
  else if (cmax == g) h = (b - r) / delta + 2
  // Blue is max
  else h = (r - g) / delta + 4

  h = Math.round(h * 60)

  // Make negative hues positive behind 360°
  if (h < 0) h += 360

  //* Lightness *//
  l = (cmax + cmin) / 2

  //* Saturation *//
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  // Multiply l and s by 100
  s = +(s * 100).toFixed(1)
  l = +(l * 100).toFixed(1)

  return { hue: h, saturation: s, lightness: l }
}

/**
 * @param {integer} hue - hue value (0-359)
 * @param {integer} saturation - saturation value (0-100)
 * @param {integer} lightness - lightness value (0-100)
 * @returns object with rgb values
 */
export const HSLToRGB = ({hue, saturation, lightness}) => {
  let h = hue
  // Make saturation and lightness fractions of 1
  let s = saturation / 100
  let l = lightness / 100

  //Find Chroma (color intensity)
  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0

  if (0 <= h && h < 60) {
    r = c
    g = x
    b = 0
  } else if (60 <= h && h < 120) {
    r = x
    g = c
    b = 0
  } else if (120 <= h && h < 180) {
    r = 0
    g = c
    b = x
  } else if (180 <= h && h < 240) {
    r = 0
    g = x
    b = c
  } else if (240 <= h && h < 300) {
    r = x
    g = 0
    b = c
  } else if (300 <= h && h < 360) {
    r = c
    g = 0
    b = x
  }
  r = Math.round((r + m) * 255)
  g = Math.round((g + m) * 255)
  b = Math.round((b + m) * 255)

  return { red: r, green: g, blue: b }
}

/**
 * @param {string} hexcode
 * @returns object with rgb values
 */
export const hexToRGB = (hexcode) => {
  // Convert hex to RGB
  let r = 0,
    g = 0,
    b = 0
  if (hexcode.length == 4) {
    r = "0x" + hexcode[1] + hexcode[1]
    g = "0x" + hexcode[2] + hexcode[2]
    b = "0x" + hexcode[3] + hexcode[3]
  } else if (hexcode.length == 7) {
    r = "0x" + hexcode[1] + hexcode[2]
    g = "0x" + hexcode[3] + hexcode[4]
    b = "0x" + hexcode[5] + hexcode[6]
  }
  r = +r
  g = +g
  b = +b
  return { red: r, green: g, blue: b }
}

/**
 * @param {integer} red - red value (0-255)
 * @param {integer} green - green value (0-255)
 * @param {integer} blue - blue value (0-255)
 * @returns {string} hexcode
 */
export const RGBToHex = ({red, green, blue}) => {
  let r = red.toString(16)
  let g = green.toString(16)
  let b = blue.toString(16)

  if (r.length == 1) r = "0" + r
  if (g.length == 1) g = "0" + g
  if (b.length == 1) b = "0" + b

  return "#" + r + g + b
}

/**
 * @param {integer} red - red value (0-255)
 * @param {integer} green - green value (0-255)
 * @param {integer} blue - blue value (0-255)
 * @returns {float} luminance
 */
export const getLuminance = ({ red, green, blue }) => {
  // Determine relation of luminance in color
  const a = [red, green, blue].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2
  })
  const luminanceValue = a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
  return Math.round(luminanceValue * 100, 2)
}
