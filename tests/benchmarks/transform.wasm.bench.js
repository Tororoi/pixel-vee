import { describe, bench, beforeAll } from "vitest"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import {
  initSync,
  translate_and_wrap as wasmTranslateWrap,
  translate_without_wrap as wasmTranslateNoWrap,
  rotate_90 as wasmRotate90,
  flip_horizontal as wasmFlipH,
  flip_vertical as wasmFlipV,
} from "../../wasm/pkg/pixel_vee_wasm.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

beforeAll(() => {
  const wasmBytes = readFileSync(
    join(__dirname, "../../wasm/pkg/pixel_vee_wasm_bg.wasm"),
  )
  initSync({ module: wasmBytes })
})

// ─── JS implementations (inlined from moveHelpers.js / transformHelpers.js) ──

function translateAndWrapJS(data, width, height, dx, dy) {
  const src = data.slice()
  data.fill(0)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4
      const nx = (x + dx + width) % width
      const ny = (y + dy + height) % height
      const di = (ny * width + nx) * 4
      data[di] = src[si]; data[di + 1] = src[si + 1]
      data[di + 2] = src[si + 2]; data[di + 3] = src[si + 3]
    }
  }
}

function translateWithoutWrapJS(data, width, height, dx, dy) {
  const src = data.slice()
  data.fill(0)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x + dx; const ny = y + dy
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const si = (y * width + x) * 4
        const di = (ny * width + nx) * 4
        data[di] = src[si]; data[di + 1] = src[si + 1]
        data[di + 2] = src[si + 2]; data[di + 3] = src[si + 3]
      }
    }
  }
}

function rotate90JS(src, dst, sw, sh) {
  // same logic as transformHelpers.js rotatePixels for 90°
  const cos = 0, sin = 1
  const rw = sh, rh = sw
  const cx = sw / 2, cy = sh / 2, ncx = rw / 2, ncy = rh / 2
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const dx = x - cx; const dy = y - cy
      let nx = cos * dx - sin * dy + ncx - 1
      let ny = sin * dx + cos * dy + ncy
      const fx = Math.round(nx); const fy = Math.round(ny)
      if (fx >= 0 && fx < rw && fy >= 0 && fy < rh) {
        const di = (fy * rw + fx) * 4
        const si = (y * sw + x) * 4
        dst[di] = src[si]; dst[di + 1] = src[si + 1]
        dst[di + 2] = src[si + 2]; dst[di + 3] = src[si + 3]
      }
    }
  }
}

function flipHJS(data, width, height) {
  for (let y = 0; y < height; y++) {
    const row = y * width
    for (let x = 0; x < Math.floor(width / 2); x++) {
      const a = (row + x) * 4; const b = (row + width - 1 - x) * 4
      for (let c = 0; c < 4; c++) {
        const tmp = data[a + c]; data[a + c] = data[b + c]; data[b + c] = tmp
      }
    }
  }
}

function flipVJS(data, width, height) {
  for (let y = 0; y < Math.floor(height / 2); y++) {
    const top = y * width * 4; const bot = (height - 1 - y) * width * 4
    for (let i = 0; i < width * 4; i++) {
      const tmp = data[top + i]; data[top + i] = data[bot + i]; data[bot + i] = tmp
    }
  }
}

function makeBuffer(width, height) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      data[i] = x % 256; data[i + 1] = y % 256; data[i + 2] = (x + y) % 256; data[i + 3] = 255
    }
  }
  return data
}

// ─── Benchmarks: translate with wrap ─────────────────────────────────────────

for (const size of [128, 256, 512]) {
  const template = makeBuffer(size, size)
  const buf = new Uint8ClampedArray(template.length)

  describe(`translateAndWrap — ${size}×${size}`, () => {
    bench("JS  ", () => {
      buf.set(template)
      translateAndWrapJS(buf, size, size, 10, 10)
    })
    bench("WASM", () => {
      buf.set(template)
      wasmTranslateWrap(buf, size, size, 10, 10)
    })
  })
}

// ─── Benchmarks: translate without wrap ──────────────────────────────────────

for (const size of [128, 256, 512]) {
  const template = makeBuffer(size, size)
  const buf = new Uint8ClampedArray(template.length)

  describe(`translateWithoutWrap — ${size}×${size}`, () => {
    bench("JS  ", () => {
      buf.set(template)
      translateWithoutWrapJS(buf, size, size, 10, 10)
    })
    bench("WASM", () => {
      buf.set(template)
      wasmTranslateNoWrap(buf, size, size, 10, 10)
    })
  })
}

// ─── Benchmarks: rotate 90° ──────────────────────────────────────────────────

for (const size of [128, 256, 512]) {
  const src = makeBuffer(size, size)
  const dstJS = new Uint8ClampedArray(size * size * 4)
  const dstWasm = new Uint8ClampedArray(size * size * 4)

  describe(`rotate90 — ${size}×${size}`, () => {
    bench("JS  ", () => {
      dstJS.fill(0)
      rotate90JS(src, dstJS, size, size)
    })
    bench("WASM", () => {
      dstWasm.fill(0)
      wasmRotate90(src, dstWasm, size, size, true)
    })
  })
}

// ─── Benchmarks: flip horizontal ─────────────────────────────────────────────

for (const size of [128, 256, 512]) {
  const template = makeBuffer(size, size)
  const buf = new Uint8ClampedArray(template.length)

  describe(`flipHorizontal — ${size}×${size}`, () => {
    bench("JS  ", () => {
      buf.set(template)
      flipHJS(buf, size, size)
    })
    bench("WASM", () => {
      buf.set(template)
      wasmFlipH(buf, size, size)
    })
  })
}

// ─── Benchmarks: flip vertical ───────────────────────────────────────────────

for (const size of [128, 256, 512]) {
  const template = makeBuffer(size, size)
  const buf = new Uint8ClampedArray(template.length)

  describe(`flipVertical — ${size}×${size}`, () => {
    bench("JS  ", () => {
      buf.set(template)
      flipVJS(buf, size, size)
    })
    bench("WASM", () => {
      buf.set(template)
      wasmFlipV(buf, size, size)
    })
  })
}
