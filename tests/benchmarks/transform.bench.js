import { describe, bench } from "vitest"

/**
 * Inline of the rotation loop from src/utils/transformHelpers.js (lines 54-92).
 * Returns a new Uint8ClampedArray + dimensions rather than writing to a canvas.
 */
function rotatePixels(srcData, srcWidth, srcHeight, degrees) {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)

  const rotatedWidth = Math.round(
    Math.abs(srcWidth * cos) + Math.abs(srcHeight * sin),
  )
  const rotatedHeight = Math.round(
    Math.abs(srcWidth * sin) + Math.abs(srcHeight * cos),
  )

  const rotatedData = new Uint8ClampedArray(rotatedWidth * rotatedHeight * 4)

  const cx = srcWidth / 2
  const cy = srcHeight / 2
  const nCx = rotatedWidth / 2
  const nCy = rotatedHeight / 2

  for (let y = 0; y < srcHeight; y++) {
    for (let x = 0; x < srcWidth; x++) {
      const dx = x - cx
      const dy = y - cy
      let newX = cos * dx - sin * dy + nCx
      let newY = sin * dx + cos * dy + nCy

      if (degrees === 90 || degrees === 180) newX -= 1
      if (degrees === 180 || degrees === 270) newY -= 1

      const finalX = Math.round(newX)
      const finalY = Math.round(newY)

      if (
        finalX >= 0 &&
        finalX < rotatedWidth &&
        finalY >= 0 &&
        finalY < rotatedHeight
      ) {
        const newIndex = (finalY * rotatedWidth + finalX) * 4
        const origIndex = (y * srcWidth + x) * 4
        rotatedData[newIndex] = srcData[origIndex]
        rotatedData[newIndex + 1] = srcData[origIndex + 1]
        rotatedData[newIndex + 2] = srcData[origIndex + 2]
        rotatedData[newIndex + 3] = srcData[origIndex + 3]
      }
    }
  }

  return { data: rotatedData, width: rotatedWidth, height: rotatedHeight }
}

/**
 * Inline of the scaling/mirroring loop from src/utils/transformHelpers.js (lines 96-114).
 */
function scalePixels(
  srcData,
  srcWidth,
  srcHeight,
  newWidth,
  newHeight,
  mirrorH = false,
  mirrorV = false,
) {
  const outData = new Uint8ClampedArray(newWidth * newHeight * 4)

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      let srcX = Math.floor(x / (newWidth / srcWidth))
      let srcY = Math.floor(y / (newHeight / srcHeight))
      if (mirrorH) srcX = srcWidth - 1 - srcX
      if (mirrorV) srcY = srcHeight - 1 - srcY

      const srcIndex = (srcY * srcWidth + srcX) * 4
      const dstIndex = (y * newWidth + x) * 4
      outData[dstIndex] = srcData[srcIndex]
      outData[dstIndex + 1] = srcData[srcIndex + 1]
      outData[dstIndex + 2] = srcData[srcIndex + 2]
      outData[dstIndex + 3] = srcData[srcIndex + 3]
    }
  }

  return outData
}

function makePixelBuffer(width, height) {
  // Fill with a gradient so pixels aren't all the same (avoids trivial optimizations)
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      data[i] = x % 256
      data[i + 1] = y % 256
      data[i + 2] = (x + y) % 256
      data[i + 3] = 255
    }
  }
  return data
}

// 90° rotation: the only supported angle in production.
// cos=0, sin=1 — trig is cheap, but every pixel still requires index math.
describe("rotatePixels — 90°", () => {
  for (const size of [256, 512, 1024]) {
    const data = makePixelBuffer(size, size)
    bench(`${size}×${size}`, () => {
      rotatePixels(data, size, size, 90)
    })
  }
})

// 45° rotation: non-orthogonal — output canvas is larger (√2 × input),
// more trig work, and more output pixels to write.
// Not a current production case but reveals how far the algorithm could scale.
describe("rotatePixels — 45° (non-orthogonal, larger output)", () => {
  for (const size of [256, 512]) {
    const data = makePixelBuffer(size, size)
    bench(`${size}×${size}`, () => {
      rotatePixels(data, size, size, 45)
    })
  }
})

// Scaling pass only (no rotation): measures the stretch/shrink loop in isolation.
// Tests the typical case where the user drags to resize a selection.
describe("scalePixels — 2× upscale", () => {
  for (const size of [256, 512]) {
    const data = makePixelBuffer(size, size)
    bench(`${size}×${size} → ${size * 2}×${size * 2}`, () => {
      scalePixels(data, size, size, size * 2, size * 2)
    })
  }
})

// Full transform pipeline: rotate 90° then scale to a new bounding box.
// This matches the actual transformRasterContent() call sequence.
describe("transformRasterContent — full pipeline (rotate 90° + scale 1:1)", () => {
  for (const size of [256, 512, 1024]) {
    const data = makePixelBuffer(size, size)
    bench(`${size}×${size}`, () => {
      const rotated = rotatePixels(data, size, size, 90)
      scalePixels(
        rotated.data,
        rotated.width,
        rotated.height,
        rotated.width,
        rotated.height,
      )
    })
  }
})
