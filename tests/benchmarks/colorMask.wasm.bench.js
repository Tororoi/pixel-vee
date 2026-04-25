import { describe, bench, beforeAll } from "vitest"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import {
  initSync,
  build_color_mask as wasmBuildColorMask,
} from "../../wasm/pkg/pixel_vee_wasm.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

beforeAll(() => {
  const wasmBytes = readFileSync(
    join(__dirname, "../../wasm/pkg/pixel_vee_wasm_bg.wasm"),
  )
  initSync({ module: wasmBytes })
})

// ─── JS color mask (current implementation from masks.js) ────────────────────

function buildColorMaskJS(data, width, height, mr, mg, mb, ma) {
  const maskSet = new Set()
  let x = 0
  let y = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === mr && data[i + 1] === mg && data[i + 2] === mb && data[i + 3] === ma) {
      maskSet.add((y << 16) | x)
    }
    if (++x === width) { x = 0; y++ }
  }
  return maskSet
}

function makeBuffer(width, height, r, g, b, a) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a
  }
  return data
}

// ─── Benchmarks ───────────────────────────────────────────────────────────────

// Worst case: every pixel matches
for (const size of [256, 512, 1024]) {
  const data = makeBuffer(size, size, 255, 0, 0, 255)

  describe(`colorMask — ${size}×${size} all match`, () => {
    bench("JS  (Set<number>)", () => {
      buildColorMaskJS(data, size, size, 255, 0, 0, 255)
    })
    bench("WASM (Uint32Array)", () => {
      wasmBuildColorMask(data, size, size, 255, 0, 0, 255)
    })
  })
}

// Typical: ~50% match
for (const size of [256, 512, 1024]) {
  const data = new Uint8ClampedArray(size * size * 4)
  for (let i = 0; i < data.length; i += 8) {
    data[i] = 255; data[i + 3] = 255
  }

  describe(`colorMask — ${size}×${size} 50% match`, () => {
    bench("JS  (Set<number>)", () => {
      buildColorMaskJS(data, size, size, 255, 0, 0, 255)
    })
    bench("WASM (Uint32Array)", () => {
      wasmBuildColorMask(data, size, size, 255, 0, 0, 255)
    })
  })
}

// No matches: pure scan cost
for (const size of [256, 512, 1024]) {
  const data = makeBuffer(size, size, 0, 0, 0, 0)

  describe(`colorMask — ${size}×${size} no match`, () => {
    bench("JS  (Set<number>)", () => {
      buildColorMaskJS(data, size, size, 255, 0, 0, 255)
    })
    bench("WASM (Uint32Array)", () => {
      wasmBuildColorMask(data, size, size, 255, 0, 0, 255)
    })
  })
}
