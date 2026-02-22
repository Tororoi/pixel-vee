import { describe, bench } from "vitest"

/**
 * Inline of the pixel scan loop from src/Canvas/masks.js (lines 49-57).
 * Isolated from canvas.currentLayer / DOM dependencies so we can measure
 * pure algorithm speed before any WASM comparison.
 */
function scanForColorMask(data, width, mr, mg, mb, ma) {
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

// Worst case: every pixel matches — maximum loop iterations AND maximum Set insertions
// (string key `"${x},${y}"` allocated per matching pixel)
describe("colorMask — all pixels match (worst case)", () => {
  for (const size of [256, 512, 1024]) {
    const data = makePixelBuffer(size, size, 255, 0, 0, 255)
    bench(`${size}×${size}`, () => {
      scanForColorMask(data, size, 255, 0, 0, 255)
    })
  }
})

// Typical case: roughly half the pixels match
describe("colorMask — 50% pixels match (typical)", () => {
  for (const size of [256, 512, 1024]) {
    const data = new Uint8ClampedArray(size * size * 4)
    for (let i = 0; i < data.length; i += 8) {
      // Every other pixel is red/opaque; the rest stay zeroed (transparent black)
      data[i] = 255
      data[i + 3] = 255
    }
    bench(`${size}×${size}`, () => {
      scanForColorMask(data, size, 255, 0, 0, 255)
    })
  }
})

// Best case: no pixel matches — pure scan with zero Set insertions
// Reveals raw Uint8ClampedArray read throughput without GC pressure
describe("colorMask — no pixels match (scan only)", () => {
  for (const size of [256, 512, 1024]) {
    const data = makePixelBuffer(size, size, 0, 0, 0, 0)
    bench(`${size}×${size}`, () => {
      scanForColorMask(data, size, 255, 0, 0, 255)
    })
  }
})
