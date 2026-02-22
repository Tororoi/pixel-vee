import { describe, bench } from "vitest"

/**
 * Inline of the pixel scan loop from src/Canvas/masks.js.
 * Two variants to compare directly:
 *   scanString — original string key `"${x},${y}"` (pre-fix baseline)
 *   scanNumeric — new integer key (y << 16) | x (post-fix)
 */
function scanString(data, width, mr, mg, mb, ma) {
  const maskSet = new Set()
  let x = 0
  let y = 0
  for (let i = 0; i < data.length; i += 4) {
    if (
      data[i] === mr &&
      data[i + 1] === mg &&
      data[i + 2] === mb &&
      data[i + 3] === ma
    ) {
      maskSet.add(`${x},${y}`)
    }
    if (++x === width) {
      x = 0
      y++
    }
  }
  return maskSet
}

function scanNumeric(data, width, mr, mg, mb, ma) {
  const maskSet = new Set()
  let x = 0
  let y = 0
  for (let i = 0; i < data.length; i += 4) {
    if (
      data[i] === mr &&
      data[i + 1] === mg &&
      data[i + 2] === mb &&
      data[i + 3] === ma
    ) {
      maskSet.add((y << 16) | x)
    }
    if (++x === width) {
      x = 0
      y++
    }
  }
  return maskSet
}

function makePixelBuffer(width, height, r, g, b, a) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
    data[i + 3] = a
  }
  return data
}

// Worst case: every pixel matches — maximum Set insertions, maximum GC pressure
// from string key allocation in the old version.
describe("colorMask — all pixels match (worst case)", () => {
  for (const size of [256, 512, 1024]) {
    const data = makePixelBuffer(size, size, 255, 0, 0, 255)
    bench(`string keys  ${size}×${size}`, () => {
      scanString(data, size, 255, 0, 0, 255)
    })
    bench(`numeric keys ${size}×${size}`, () => {
      scanNumeric(data, size, 255, 0, 0, 255)
    })
  }
})

// Typical case: roughly half the pixels match
describe("colorMask — 50% pixels match (typical)", () => {
  for (const size of [256, 512, 1024]) {
    const data = new Uint8ClampedArray(size * size * 4)
    for (let i = 0; i < data.length; i += 8) {
      data[i] = 255
      data[i + 3] = 255
    }
    bench(`string keys  ${size}×${size}`, () => {
      scanString(data, size, 255, 0, 0, 255)
    })
    bench(`numeric keys ${size}×${size}`, () => {
      scanNumeric(data, size, 255, 0, 0, 255)
    })
  }
})

// Best case: no pixel matches — pure scan, no Set insertions either way.
// Both variants should be identical here (confirms the scan loop itself is not the issue).
describe("colorMask — no pixels match (scan only)", () => {
  for (const size of [256, 512, 1024]) {
    const data = makePixelBuffer(size, size, 0, 0, 0, 0)
    bench(`string keys  ${size}×${size}`, () => {
      scanString(data, size, 255, 0, 0, 255)
    })
    bench(`numeric keys ${size}×${size}`, () => {
      scanNumeric(data, size, 255, 0, 0, 255)
    })
  }
})
