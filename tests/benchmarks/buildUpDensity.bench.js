import { describe, bench } from "vitest"

/**
 * Benchmarks for rebuildBuildUpDensityMap logic.
 *
 * The actual function (src/Tools/brush.js) imports canvas/state which need
 * a DOM, so the core algorithm is inlined here — same pattern as brush.bench.js.
 */

// ─── Constants (from src/Tools/brush.js) ─────────────────────────────────────

const BAYER_STEPS = {
  "2x2": [16, 32, 48, 64],
  "4x4": [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64],
  "8x8": Array.from({ length: 64 }, (_, i) => i + 1),
}

// ─── Inlined algorithm (mirrors rebuildBuildUpDensityMap) ────────────────────

/**
 * Pure-logic rebuild of a build-up density map from an undo stack.
 * @param {Array} undoStack - simulated undo stack
 * @param {object} layer - layer reference to match against
 * @param {number} startIndex - index to start scanning from
 * @returns {Map<number, number>} packed coord → density count
 */
function rebuildDensityMap(undoStack, layer, startIndex) {
  const map = new Map()
  for (let i = startIndex; i < undoStack.length; i++) {
    const action = undoStack[i]
    if (
      action.tool === "brush" &&
      action.modes?.buildUpDither &&
      action.layer === layer &&
      action.buildUpDensityDelta
    ) {
      for (const coord of action.buildUpDensityDelta) {
        map.set(coord, (map.get(coord) ?? 0) + 1)
      }
    }
  }
  return map
}

// ─── Test data generators ────────────────────────────────────────────────────

/**
 * Generate a set of packed pixel coordinates for a rectangular stroke region.
 * @param {number} x0 - left edge
 * @param {number} y0 - top edge
 * @param {number} w - width in pixels
 * @param {number} h - height in pixels
 * @returns {number[]} array of (y << 16) | x packed coords
 */
function makeStrokeRegion(x0, y0, w, h) {
  const coords = []
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      coords.push((y << 16) | x)
    }
  }
  return coords
}

/**
 * Build a simulated undo stack where every pixel in a region accumulates
 * exactly `strokeCount` overlapping strokes — enough to reach every step
 * in a given Bayer mode.
 *
 * @param {number} strokeCount - number of strokes (= number of Bayer steps)
 * @param {number} pixelsPerStroke - pixels touched per stroke
 * @param {object} layer - shared layer reference
 * @returns {Array} simulated undo stack entries
 */
function buildUndoStack(strokeCount, pixelsPerStroke, layer) {
  const side = Math.ceil(Math.sqrt(pixelsPerStroke))
  const region = makeStrokeRegion(0, 0, side, side)
  const stack = []
  for (let s = 0; s < strokeCount; s++) {
    stack.push({
      tool: "brush",
      modes: { buildUpDither: true },
      layer,
      buildUpDensityDelta: region,
    })
  }
  return stack
}

/**
 * Build a mixed undo stack: build-up dither strokes interleaved with
 * non-dither actions (lines, fills, other brush strokes) that the
 * rebuild loop must skip over.
 */
function buildMixedUndoStack(strokeCount, pixelsPerStroke, layer) {
  const side = Math.ceil(Math.sqrt(pixelsPerStroke))
  const region = makeStrokeRegion(0, 0, side, side)
  const stack = []
  for (let s = 0; s < strokeCount; s++) {
    // non-dither actions to skip
    stack.push({ tool: "brush", modes: { buildUpDither: false }, layer })
    stack.push({ tool: "line", layer })
    stack.push({ tool: "fill", layer })
    // the actual build-up dither action
    stack.push({
      tool: "brush",
      modes: { buildUpDither: true },
      layer,
      buildUpDensityDelta: region,
    })
  }
  return stack
}

// ─── Benchmarks ──────────────────────────────────────────────────────────────

const layer = {} // reference equality for matching

// Small region (16x16 = 256 pixels per stroke) — typical detail work
describe("rebuildDensityMap — 256 px/stroke (16×16 region)", () => {
  const px = 256

  const stack2x2 = buildUndoStack(BAYER_STEPS["2x2"].length, px, layer)
  const stack4x4 = buildUndoStack(BAYER_STEPS["4x4"].length, px, layer)
  const stack8x8 = buildUndoStack(BAYER_STEPS["8x8"].length, px, layer)

  bench(`2×2 Bayer (${stack2x2.length} strokes)`, () => {
    rebuildDensityMap(stack2x2, layer, 0)
  })
  bench(`4×4 Bayer (${stack4x4.length} strokes)`, () => {
    rebuildDensityMap(stack4x4, layer, 0)
  })
  bench(`8×8 Bayer (${stack8x8.length} strokes)`, () => {
    rebuildDensityMap(stack8x8, layer, 0)
  })
})

// Medium region (64x64 = 4096 pixels per stroke) — broad shading
describe("rebuildDensityMap — 4096 px/stroke (64×64 region)", () => {
  const px = 4096

  const stack2x2 = buildUndoStack(BAYER_STEPS["2x2"].length, px, layer)
  const stack4x4 = buildUndoStack(BAYER_STEPS["4x4"].length, px, layer)
  const stack8x8 = buildUndoStack(BAYER_STEPS["8x8"].length, px, layer)

  bench(`2×2 Bayer (${stack2x2.length} strokes)`, () => {
    rebuildDensityMap(stack2x2, layer, 0)
  })
  bench(`4×4 Bayer (${stack4x4.length} strokes)`, () => {
    rebuildDensityMap(stack4x4, layer, 0)
  })
  bench(`8×8 Bayer (${stack8x8.length} strokes)`, () => {
    rebuildDensityMap(stack8x8, layer, 0)
  })
})

// Large region (128x128 = 16384 pixels per stroke) — stress test
describe("rebuildDensityMap — 16384 px/stroke (128×128 region)", () => {
  const px = 16384

  const stack2x2 = buildUndoStack(BAYER_STEPS["2x2"].length, px, layer)
  const stack4x4 = buildUndoStack(BAYER_STEPS["4x4"].length, px, layer)
  const stack8x8 = buildUndoStack(BAYER_STEPS["8x8"].length, px, layer)

  bench(`2×2 Bayer (${stack2x2.length} strokes)`, () => {
    rebuildDensityMap(stack2x2, layer, 0)
  })
  bench(`4×4 Bayer (${stack4x4.length} strokes)`, () => {
    rebuildDensityMap(stack4x4, layer, 0)
  })
  bench(`8×8 Bayer (${stack8x8.length} strokes)`, () => {
    rebuildDensityMap(stack8x8, layer, 0)
  })
})

// Mixed stack — measures the cost of skipping non-dither actions
describe("rebuildDensityMap — mixed stack (4096 px/stroke, 64×64)", () => {
  const px = 4096

  const mixed2x2 = buildMixedUndoStack(BAYER_STEPS["2x2"].length, px, layer)
  const mixed4x4 = buildMixedUndoStack(BAYER_STEPS["4x4"].length, px, layer)
  const mixed8x8 = buildMixedUndoStack(BAYER_STEPS["8x8"].length, px, layer)

  bench(`2×2 Bayer mixed (${mixed2x2.length} total actions)`, () => {
    rebuildDensityMap(mixed2x2, layer, 0)
  })
  bench(`4×4 Bayer mixed (${mixed4x4.length} total actions)`, () => {
    rebuildDensityMap(mixed4x4, layer, 0)
  })
  bench(`8×8 Bayer mixed (${mixed8x8.length} total actions)`, () => {
    rebuildDensityMap(mixed8x8, layer, 0)
  })
})

// _buildUpResetAtIndex — measures partial rebuild (skipping early history)
describe("rebuildDensityMap — partial rebuild with startIndex", () => {
  const px = 4096
  // Full 8x8 stack (64 strokes), but only rebuild from halfway
  const stack = buildUndoStack(BAYER_STEPS["8x8"].length, px, layer)
  const halfIndex = Math.floor(stack.length / 2)

  bench(`8×8 full rebuild (${stack.length} strokes)`, () => {
    rebuildDensityMap(stack, layer, 0)
  })
  bench(`8×8 partial rebuild from index ${halfIndex}`, () => {
    rebuildDensityMap(stack, layer, halfIndex)
  })
})
