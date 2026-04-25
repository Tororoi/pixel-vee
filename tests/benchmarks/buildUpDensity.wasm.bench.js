import { describe, bench, beforeAll } from "vitest"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import {
  initSync,
  render_buildup_segment as wasmRenderBuildupSegment,
} from "../../wasm/pkg/pixel_vee_wasm.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

const BAYER = new Uint8Array([
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
])

beforeAll(() => {
  const wasmBytes = readFileSync(
    join(__dirname, "../../wasm/pkg/pixel_vee_wasm_bg.wasm"),
  )
  initSync({ module: wasmBytes })
})

// ─── JS segment renderer (mirrors renderBuildUpDitherSegment in performAction.js) ──

function isDitherOn(x, y, threshold, offX, offY) {
  const px = ((x + offX) % 8 + 8) % 8
  const py = ((y + offY) % 8 + 8) % 8
  return BAYER[py * 8 + px] < threshold + 1
}

function renderBuildUpSegmentJS(pixels, canvasWidth, priorMap, actions) {
  const segmentDelta = new Map()
  const lastActionMap = new Map()
  for (const action of actions) {
    for (const coord of action.delta) {
      segmentDelta.set(coord, (segmentDelta.get(coord) ?? 0) + 1)
      lastActionMap.set(coord, action)
    }
  }
  for (const [key, segCount] of segmentDelta) {
    const x = key & 0xffff
    const y = (key >>> 16) & 0xffff
    const action = lastActionMap.get(key)
    const prior = priorMap ? (priorMap.get(key) ?? 0) : 0
    const total = prior + segCount
    const stepIdx = Math.min(total - 1, action.steps.length - 1)
    const threshold = action.steps[stepIdx]
    if (isDitherOn(x, y, threshold, 0, 0)) {
      const base = (y * canvasWidth + x) * 4
      pixels[base] = action.r; pixels[base + 1] = action.g
      pixels[base + 2] = action.b; pixels[base + 3] = action.a
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRegionDeltas(canvasWidth, x0, y0, w, h) {
  const coords = []
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      coords.push((y << 16) | x)
    }
  }
  return coords
}

const STEPS_8X8 = Array.from({ length: 64 }, (_, i) => i)

function buildSegmentActions(strokeCount, delta) {
  return Array.from({ length: strokeCount }, () => ({
    delta,
    steps: STEPS_8X8,
    r: 255, g: 0, b: 0, a: 255,
  }))
}

// Build WASM flat arrays from action list
function buildWasmArgs(canvasWidth, canvasHeight, actions, priorInt32) {
  const deltaFlat = []
  const aR = [], aG = [], aB = [], aA = []
  const aSR = [], aSG = [], aSB = [], aSA = []
  const aTwoColor = [], aSteps = [], aStepCounts = []
  const aOffX = [], aOffY = []
  for (const action of actions) {
    for (const coord of action.delta) deltaFlat.push(coord)
    deltaFlat.push(0xffffffff)
    aR.push(action.r); aG.push(action.g); aB.push(action.b); aA.push(action.a)
    aSR.push(0); aSG.push(0); aSB.push(0); aSA.push(0)
    aTwoColor.push(0)
    for (const s of action.steps) aSteps.push(s)
    aStepCounts.push(action.steps.length)
    aOffX.push(0); aOffY.push(0)
  }
  return {
    pixels: new Uint8ClampedArray(canvasWidth * canvasHeight * 4),
    prior: priorInt32 ?? new Int32Array(canvasWidth * canvasHeight),
    delta: new Uint32Array(deltaFlat),
    aR: new Uint8Array(aR), aG: new Uint8Array(aG),
    aB: new Uint8Array(aB), aA: new Uint8Array(aA),
    aSR: new Uint8Array(aSR), aSG: new Uint8Array(aSG),
    aSB: new Uint8Array(aSB), aSA: new Uint8Array(aSA),
    aTwoColor: new Uint8Array(aTwoColor),
    aSteps: new Uint8Array(aSteps),
    aStepCounts: new Uint32Array(aStepCounts),
    aOffX: new Int32Array(aOffX), aOffY: new Int32Array(aOffY),
  }
}

// ─── Benchmarks ──────────────────────────────────────────────────────────────

const CANVAS_SIZE = 256 // typical pixel art canvas

// Small stroke region (32×32 px, 8×8 Bayer = 64 strokes)
{
  const delta = makeRegionDeltas(CANVAS_SIZE, 0, 0, 32, 32)
  const actions = buildSegmentActions(STEPS_8X8.length, delta)
  const prior = null
  const pixels = new Uint8ClampedArray(CANVAS_SIZE * CANVAS_SIZE * 4)
  const priorMap = null

  const w = buildWasmArgs(CANVAS_SIZE, CANVAS_SIZE, actions, null)

  describe("buildUpSegment — 32×32 region, 64 strokes (8×8 Bayer)", () => {
    bench("JS  (Map-based)", () => {
      pixels.fill(0)
      renderBuildUpSegmentJS(pixels, CANVAS_SIZE, priorMap, actions)
    })
    bench("WASM", () => {
      w.pixels.fill(0)
      wasmRenderBuildupSegment(
        w.pixels, w.prior, CANVAS_SIZE, CANVAS_SIZE,
        w.delta, w.aR, w.aG, w.aB, w.aA,
        w.aSR, w.aSG, w.aSB, w.aSA,
        w.aTwoColor, w.aSteps, w.aStepCounts, w.aOffX, w.aOffY, false,
      )
    })
  })
}

// Medium stroke region (64×64 px)
{
  const delta = makeRegionDeltas(CANVAS_SIZE, 0, 0, 64, 64)
  const actions = buildSegmentActions(STEPS_8X8.length, delta)
  const pixels = new Uint8ClampedArray(CANVAS_SIZE * CANVAS_SIZE * 4)

  const w = buildWasmArgs(CANVAS_SIZE, CANVAS_SIZE, actions, null)

  describe("buildUpSegment — 64×64 region, 64 strokes (8×8 Bayer)", () => {
    bench("JS  (Map-based)", () => {
      pixels.fill(0)
      renderBuildUpSegmentJS(pixels, CANVAS_SIZE, null, actions)
    })
    bench("WASM", () => {
      w.pixels.fill(0)
      wasmRenderBuildupSegment(
        w.pixels, w.prior, CANVAS_SIZE, CANVAS_SIZE,
        w.delta, w.aR, w.aG, w.aB, w.aA,
        w.aSR, w.aSG, w.aSB, w.aSA,
        w.aTwoColor, w.aSteps, w.aStepCounts, w.aOffX, w.aOffY, false,
      )
    })
  })
}

// Full canvas coverage (256×256 px) — worst case replay
{
  const delta = makeRegionDeltas(CANVAS_SIZE, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
  const actions = buildSegmentActions(STEPS_8X8.length, delta)
  const pixels = new Uint8ClampedArray(CANVAS_SIZE * CANVAS_SIZE * 4)

  const w = buildWasmArgs(CANVAS_SIZE, CANVAS_SIZE, actions, null)

  describe("buildUpSegment — 256×256 full canvas, 64 strokes (8×8 Bayer)", () => {
    bench("JS  (Map-based)", () => {
      pixels.fill(0)
      renderBuildUpSegmentJS(pixels, CANVAS_SIZE, null, actions)
    })
    bench("WASM", () => {
      w.pixels.fill(0)
      wasmRenderBuildupSegment(
        w.pixels, w.prior, CANVAS_SIZE, CANVAS_SIZE,
        w.delta, w.aR, w.aG, w.aB, w.aA,
        w.aSR, w.aSG, w.aSB, w.aSA,
        w.aTwoColor, w.aSteps, w.aStepCounts, w.aOffX, w.aOffY, false,
      )
    })
  })
}

// Single large stroke, many overlapping passes (dense build-up)
{
  const delta = makeRegionDeltas(CANVAS_SIZE, 64, 64, 128, 128)
  const manyStrokes = buildSegmentActions(STEPS_8X8.length * 2, delta) // 128 strokes
  const pixels = new Uint8ClampedArray(CANVAS_SIZE * CANVAS_SIZE * 4)

  const w = buildWasmArgs(CANVAS_SIZE, CANVAS_SIZE, manyStrokes, null)

  describe("buildUpSegment — 128×128 region, 128 strokes (heavily overlapping)", () => {
    bench("JS  (Map-based)", () => {
      pixels.fill(0)
      renderBuildUpSegmentJS(pixels, CANVAS_SIZE, null, manyStrokes)
    })
    bench("WASM", () => {
      w.pixels.fill(0)
      wasmRenderBuildupSegment(
        w.pixels, w.prior, CANVAS_SIZE, CANVAS_SIZE,
        w.delta, w.aR, w.aG, w.aB, w.aA,
        w.aSR, w.aSG, w.aSB, w.aSA,
        w.aTwoColor, w.aSteps, w.aStepCounts, w.aOffX, w.aOffY, false,
      )
    })
  })
}
