function rgbToXyz(rgb) {
  let sR = rgb[0]
  let sG = rgb[1]
  let sB = rgb[2]

  let var_R = sR / 255
  let var_G = sG / 255
  let var_B = sB / 255

  if (var_R > 0.04045) var_R = Math.pow((var_R + 0.055) / 1.055, 2.4)
  else var_R = var_R / 12.92
  if (var_G > 0.04045) var_G = Math.pow((var_G + 0.055) / 1.055, 2.4)
  else var_G = var_G / 12.92
  if (var_B > 0.04045) var_B = Math.pow((var_B + 0.055) / 1.055, 2.4)
  else var_B = var_B / 12.92

  var_R = var_R * 100
  var_G = var_G * 100
  var_B = var_B * 100

  let X = var_R * 0.4124 + var_G * 0.3576 + var_B * 0.1805
  let Y = var_R * 0.2126 + var_G * 0.7152 + var_B * 0.0722
  let Z = var_R * 0.0193 + var_G * 0.1192 + var_B * 0.9505

  return { X, Y, Z }
}

function xyzToLab(X, Y, Z, referenceX, referenceY, referenceZ) {
  let var_X = X / referenceX
  let var_Y = Y / referenceY
  let var_Z = Z / referenceZ

  if (var_X > 0.008856) var_X = Math.pow(var_X, 1 / 3)
  else var_X = 7.787 * var_X + 16 / 116
  if (var_Y > 0.008856) var_Y = Math.pow(var_Y, 1 / 3)
  else var_Y = 7.787 * var_Y + 16 / 116
  if (var_Z > 0.008856) var_Z = Math.pow(var_Z, 1 / 3)
  else var_Z = 7.787 * var_Z + 16 / 116

  let CIE_L = 116 * var_Y - 16
  let CIE_a = 500 * (var_X - var_Y)
  let CIE_b = 200 * (var_Y - var_Z)

  return { L: CIE_L, a: CIE_a, b: CIE_b }
}

const illuminants = {
  A: {
    2: { X: 109.85, Y: 100.0, Z: 35.585 },
    10: { X: 111.144, Y: 100.0, Z: 35.2 },
    note: "Incandescent/tungsten",
  },
  B: {
    2: { X: 99.0927, Y: 100.0, Z: 85.313 },
    10: { X: 99.178, Y: 100.0, Z: 84.3493 },
    note: "Old direct sunlight at noon",
  },
  C: {
    2: { X: 98.074, Y: 100.0, Z: 118.232 },
    10: { X: 97.285, Y: 100.0, Z: 116.145 },
    note: "Old daylight",
  },
  D50: {
    2: { X: 96.422, Y: 100.0, Z: 82.521 },
    10: { X: 96.72, Y: 100.0, Z: 81.427 },
    note: "ICC profile PCS",
  },
  D55: {
    2: { X: 95.682, Y: 100.0, Z: 92.149 },
    10: { X: 95.799, Y: 100.0, Z: 90.926 },
    note: "Mid-morning daylight",
  },
  D65: {
    2: { X: 95.047, Y: 100.0, Z: 108.883 },
    10: { X: 94.811, Y: 100.0, Z: 107.304 },
    note: "Daylight, sRGB, Adobe-RGB",
  },
  D75: {
    2: { X: 94.972, Y: 100.0, Z: 122.638 },
    10: { X: 94.416, Y: 100.0, Z: 120.641 },
    note: "North sky daylight",
  },
  E: {
    2: { X: 100.0, Y: 100.0, Z: 100.0 },
    10: { X: 100.0, Y: 100.0, Z: 100.0 },
    note: "Equal energy",
  },
}

function labToXyz(L, a, b, referenceX, referenceY, referenceZ) {
  let varY = (L + 16) / 116
  let varX = a / 500 + varY
  let varZ = varY - b / 200

  if (Math.pow(varY, 3) > 0.008856) varY = Math.pow(varY, 3)
  else varY = (varY - 16 / 116) / 7.787

  if (Math.pow(varX, 3) > 0.008856) varX = Math.pow(varX, 3)
  else varX = (varX - 16 / 116) / 7.787

  if (Math.pow(varZ, 3) > 0.008856) varZ = Math.pow(varZ, 3)
  else varZ = (varZ - 16 / 116) / 7.787

  const X = varX * referenceX
  const Y = varY * referenceY
  const Z = varZ * referenceZ

  return { X, Y, Z }
}

function xyzToRgb(X, Y, Z) {
  let var_X = X / 100
  let var_Y = Y / 100
  let var_Z = Z / 100

  let var_R = var_X * 3.2406 + var_Y * -1.5372 + var_Z * -0.4986
  let var_G = var_X * -0.9689 + var_Y * 1.8758 + var_Z * 0.0415
  let var_B = var_X * 0.0557 + var_Y * -0.204 + var_Z * 1.057

  if (var_R > 0.0031308) var_R = 1.055 * Math.pow(var_R, 1 / 2.4) - 0.055
  else var_R = 12.92 * var_R
  if (var_G > 0.0031308) var_G = 1.055 * Math.pow(var_G, 1 / 2.4) - 0.055
  else var_G = 12.92 * var_G
  if (var_B > 0.0031308) var_B = 1.055 * Math.pow(var_B, 1 / 2.4) - 0.055
  else var_B = 12.92 * var_B

  let sR = Math.round(var_R * 255)
  let sG = Math.round(var_G * 255)
  let sB = Math.round(var_B * 255)

  return { sR, sG, sB }
}

export function mixRgbColors(rgb1, rgb2, t) {
  // Convert RGB to XYZ
  const xyz1 = rgbToXyz(rgb1)
  const xyz2 = rgbToXyz(rgb2)

  // Convert XYZ to LAB
  // const refX = 95.047,
  //   refY = 100.0,
  //   refZ = 108.883 // D65 illuminant reference values
  const { X, Y, Z } = illuminants["D65"]["2"]
  const lab1 = xyzToLab(xyz1.X, xyz1.Y, xyz1.Z, X, Y, Z)
  const lab2 = xyzToLab(xyz2.X, xyz2.Y, xyz2.Z, X, Y, Z)

  // Mix the LAB colors
  const mixedLab = {
    L: (lab1.L + lab2.L) / 2,
    a: (lab1.a + lab2.a) / 2,
    b: (lab1.b + lab2.b) / 2,
  }
  console.log(mixedLab)

  // Convert LAB back to XYZ
  const mixedXyz = labToXyz(mixedLab.L, mixedLab.a, mixedLab.b, X, Y, Z)

  // Convert XYZ back to RGB
  const mixedRgb = xyzToRgb(mixedXyz.X, mixedXyz.Y, mixedXyz.Z)

  return [mixedRgb.sR, mixedRgb.sG, mixedRgb.sB, rgb1[3]]
}
