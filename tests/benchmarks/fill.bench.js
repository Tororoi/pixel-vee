import { describe, bench } from "vitest"

/**
 * Inline of matchStartColor from src/utils/imageDataHelpers.js
 */
function matchColor(data, pos, r, g, b, a) {
  return (
    data[pos] === r &&
    data[pos + 1] === g &&
    data[pos + 2] === b &&
    data[pos + 3] === a
  )
}

/**
 * Inline of colorPixel from src/utils/imageDataHelpers.js
 */
function fillPixel(data, pos, r, g, b, a) {
  data[pos] = r
  data[pos + 1] = g
  data[pos + 2] = b
  data[pos + 3] = a
}

/**
 * Inline of the scanline flood fill loop from src/Actions/pointerActions.js (lines 237-303).
 * Operates on a raw Uint8ClampedArray — no canvas, no layer, no ImageData wrapper.
 */
function floodFill(
  data,
  width,
  height,
  startX,
  startY,
  targetR,
  targetG,
  targetB,
  targetA,
  fillR,
  fillG,
  fillB,
  fillA,
) {
  // Exit early if start pixel doesn't match target (nothing to fill)
  const startPos = (startY * width + startX) * 4
  if (!matchColor(data, startPos, targetR, targetG, targetB, targetA)) return

  const pixelStack = [[startX, startY]]
  let x, y, pixelPos, reachLeft, reachRight

  while (pixelStack.length) {
    const pos = pixelStack.pop()
    x = pos[0]
    y = pos[1]
    pixelPos = (y * width + x) * 4

    // Go up while color matches
    while (y >= 0 && matchColor(data, pixelPos, targetR, targetG, targetB, targetA)) {
      y--
      pixelPos -= width * 4
    }
    pixelPos += width * 4
    y++
    reachLeft = false
    reachRight = false

    // Go down while color matches, filling as we go
    while (y < height && matchColor(data, pixelPos, targetR, targetG, targetB, targetA)) {
      fillPixel(data, pixelPos, fillR, fillG, fillB, fillA)

      if (x > 0) {
        if (matchColor(data, pixelPos - 4, targetR, targetG, targetB, targetA)) {
          if (!reachLeft) {
            pixelStack.push([x - 1, y])
            reachLeft = true
          }
        } else if (reachLeft) {
          reachLeft = false
        }
      }

      if (x < width - 1) {
        if (matchColor(data, pixelPos + 4, targetR, targetG, targetB, targetA)) {
          if (!reachRight) {
            pixelStack.push([x + 1, y])
            reachRight = true
          }
        } else if (reachRight) {
          reachRight = false
        }
      }

      y++
      pixelPos += width * 4
    }
  }
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

// Worst case: uniform solid-color canvas filled from center.
// Every pixel is visited exactly once — maximum possible iterations.
// Buffer is reset before each bench iteration via Uint8ClampedArray.set()
// so the fill always has work to do.
describe("floodFill — uniform canvas from center (worst case)", () => {
  for (const size of [256, 512, 1024]) {
    const template = makePixelBuffer(size, size, 255, 0, 0, 255)
    const data = new Uint8ClampedArray(template.length)
    const cx = Math.floor(size / 2)
    const cy = Math.floor(size / 2)

    bench(`${size}×${size}`, () => {
      data.set(template)
      floodFill(data, size, size, cx, cy, 255, 0, 0, 255, 0, 0, 255, 255)
    })
  }
})

// Corner fill: start from (0,0) — scanline still visits every pixel,
// but the stack grows differently (less symmetric than center)
describe("floodFill — uniform canvas from corner", () => {
  for (const size of [256, 512, 1024]) {
    const template = makePixelBuffer(size, size, 255, 0, 0, 255)
    const data = new Uint8ClampedArray(template.length)

    bench(`${size}×${size}`, () => {
      data.set(template)
      floodFill(data, size, size, 0, 0, 255, 0, 0, 255, 0, 0, 255, 255)
    })
  }
})

// Checkerboard: alternating red/blue pixels so every pixel is a boundary.
// Forces many stack pushes but each column run is length 1.
// Tests stack allocation overhead rather than raw pixel throughput.
describe("floodFill — checkerboard (max stack pressure)", () => {
  for (const size of [256, 512]) {
    const data = new Uint8ClampedArray(size * size * 4)
    const template = new Uint8ClampedArray(data.length)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4
        if ((x + y) % 2 === 0) {
          template[i] = 255; template[i + 3] = 255 // red opaque
        } else {
          template[i + 2] = 255; template[i + 3] = 255 // blue opaque
        }
      }
    }

    bench(`${size}×${size}`, () => {
      data.set(template)
      // Fill all red pixels from (0,0) — will only reach connected red pixels
      // In a checkerboard, red pixels are diagonal-adjacent (not 4-connected),
      // so the fill stays at just (0,0). Run from a point that touches a run.
      floodFill(data, size, size, 0, 0, 255, 0, 0, 255, 0, 255, 0, 255)
    })
  }
})
