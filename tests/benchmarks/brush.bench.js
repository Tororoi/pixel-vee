import { describe, bench } from "vitest"

/**
 * Inline of generateCircleBrush + generateSquareBrush + createBrushStamp
 * from src/utils/brushHelpers.js.
 *
 * brushHelpers.js imports dom.js at the module level, which fails in a Node
 * environment. The public exports (createCircleBrush, createSquareBrush,
 * generateBrushStamps) don't touch DOM at all, but the module-level import
 * would still throw. Inlining the algorithm lets us measure pure computation
 * without mock overhead.
 */

function generateCircleBrush(brushSize, offsetX, offsetY, seen) {
  const brushPixels = []
  let r = Math.floor(brushSize / 2)
  let d = (5 - 4 * r) / 4
  let x = 0,
    y = r
  let xO = r,
    yO = r

  eightfoldSym(xO, yO, x, y)
  while (x < y) {
    x++
    if (d >= 0) {
      y--
      d += 2 * (x - y) + 1
    } else {
      d += 2 * x + 1
    }
    eightfoldSym(xO, yO, x, y)
  }

  function eightfoldSym(xc, yc, x, y) {
    function addPixel(px, py) {
      const ox = px + offsetX
      const oy = py + offsetY
      const key = `${ox},${oy}`
      if (!seen.has(key)) {
        seen.add(key)
        brushPixels.push({ x: px, y: py })
      }
    }
    const xLoopEnd = brushSize % 2 === 0 ? 2 * x : 2 * x + 1
    const yLoopEnd = brushSize % 2 === 0 ? 2 * y : 2 * y + 1
    const offset = brushSize % 2 === 0 ? 1 : 0
    for (let i = 0; i < xLoopEnd; i++) addPixel(xc - x + i, yc - y)
    for (let i = 0; i < yLoopEnd; i++) addPixel(xc - y + i, yc - x)
    for (let i = 0; i < yLoopEnd; i++) addPixel(xc - y + i, yc + x - offset)
    for (let i = 0; i < xLoopEnd; i++) addPixel(xc - x + i, yc + y - offset)
  }

  return brushPixels
}

function generateSquareBrush(brushSize, offsetX, offsetY, seen) {
  const brush = []
  for (let y = 0; y < brushSize; y++) {
    for (let x = 0; x < brushSize; x++) {
      const coord = `${x + offsetX},${y + offsetY}`
      if (!seen.has(coord)) {
        brush.push({ x, y })
        seen.add(coord)
      }
    }
  }
  return brush
}

function generateOffsetBrush(brushPixels, offsetX, offsetY, seen) {
  const offsetBrush = []
  for (const { x, y } of brushPixels) {
    const coord = `${x + offsetX},${y + offsetY}`
    if (!seen.has(coord)) offsetBrush.push({ x, y })
  }
  return offsetBrush
}

function createBrushStamp(generatorFn, brushSize) {
  const seen = new Set()
  const base = generatorFn(brushSize, 0, 0, seen)
  const offsets = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1],
  ]
  const directions = {
    "0,0": base,
    pixelSet: new Set(base.map((p) => `${p.x},${p.y}`)),
  }
  for (const [x, y] of offsets) {
    directions[`${x},${y}`] = generateOffsetBrush(base, x, y, seen)
  }
  return directions
}

function createCircleBrush(brushSize) {
  return createBrushStamp(generateCircleBrush, brushSize)
}

function createSquareBrush(brushSize) {
  return createBrushStamp(generateSquareBrush, brushSize)
}

function generateBrushStamps(generatorFn) {
  const brushStamp = {}
  for (let i = 1; i <= 32; i++) {
    brushStamp[i] = createBrushStamp(generatorFn, i)
  }
  return brushStamp
}

// Single stamp at specific sizes — shows per-brush cost and how it scales with radius
describe("createCircleBrush — single size", () => {
  for (const size of [1, 4, 8, 16, 32]) {
    bench(`size ${size}`, () => {
      createCircleBrush(size)
    })
  }
})

describe("createSquareBrush — single size", () => {
  for (const size of [1, 4, 8, 16, 32]) {
    bench(`size ${size}`, () => {
      createSquareBrush(size)
    })
  }
})

// Full startup cost: generate all 32 sizes × 9 directions each
// This runs once at app startup — measures the total initialization budget
describe("generateBrushStamps — all 32 sizes (startup cost)", () => {
  bench("circle — sizes 1-32", () => {
    generateBrushStamps(generateCircleBrush)
  })

  bench("square — sizes 1-32", () => {
    generateBrushStamps(generateSquareBrush)
  })
})
