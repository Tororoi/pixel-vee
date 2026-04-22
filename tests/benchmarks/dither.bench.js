import { describe, bench } from "vitest"
import { ditherPatterns, isDitherOn } from "../../src/Context/ditherPatterns.js"

const pattern = ditherPatterns[32] // mid-density pattern

// ─── Original (double-modulo) ─────────────────────────────────────────────────

function isDitherOnOriginal(pattern, x, y, ditherOffsetX = 0, ditherOffsetY = 0) {
  let px = (((x + ditherOffsetX) % 8) + 8) % 8
  let py = (((y + ditherOffsetY) % 8) + 8) % 8
  return pattern.data[py * 8 + px] === 1
}

// ─── Optimized (bitwise AND) ──────────────────────────────────────────────────

function isDitherOnOptimized(pattern, x, y, ditherOffsetX = 0, ditherOffsetY = 0) {
  const px = (x + ditherOffsetX) & 7
  const py = (y + ditherOffsetY) & 7
  return pattern.data[py * 8 + px] === 1
}

// ─── Benchmarks ───────────────────────────────────────────────────────────────

describe("isDitherOn — single call", () => {
  bench("original  (double-modulo)", () => {
    isDitherOnOriginal(pattern, 13, 7, 3, 5)
  })
  bench("optimized (bitwise AND)  ", () => {
    isDitherOnOptimized(pattern, 13, 7, 3, 5)
  })
  bench("bit-test  (row bytes)    ", () => {
    isDitherOn(pattern, 13, 7, 3, 5)
  })
})

describe("isDitherOn — 64×64 canvas sweep", () => {
  bench("original  (double-modulo)", () => {
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        isDitherOnOriginal(pattern, x, y, 3, 5)
      }
    }
  })
  bench("optimized (bitwise AND)  ", () => {
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        isDitherOnOptimized(pattern, x, y, 3, 5)
      }
    }
  })
  bench("bit-test  (row bytes)    ", () => {
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        isDitherOn(pattern, x, y, 3, 5)
      }
    }
  })
})
