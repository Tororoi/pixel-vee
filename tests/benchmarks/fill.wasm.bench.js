import { describe, bench, beforeAll } from "vitest"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import {
  initSync,
  flood_fill as wasmFloodFill,
} from "../../wasm/pkg/pixel_vee_wasm.js"

const __dirname = dirname(fileURLToPath(import.meta.url))

beforeAll(() => {
  const wasmBytes = readFileSync(
    join(__dirname, "../../wasm/pkg/pixel_vee_wasm_bg.wasm"),
  )
  initSync({ module: wasmBytes })
})

// ─── JS flood fill (inlined from fill.bench.js) ───────────────────────────────

function matchColor(data, pos, r, g, b, a) {
  return (
    data[pos] === r &&
    data[pos + 1] === g &&
    data[pos + 2] === b &&
    data[pos + 3] === a
  )
}
function fillPixel(data, pos, r, g, b, a) {
  data[pos] = r; data[pos + 1] = g; data[pos + 2] = b; data[pos + 3] = a
}

function floodFillJS(data, width, height, startX, startY, tr, tg, tb, ta, fr, fg, fb, fa) {
  const startPos = (startY * width + startX) * 4
  if (!matchColor(data, startPos, tr, tg, tb, ta)) return
  const pixelStack = [[startX, startY]]
  let x, y, pixelPos, reachLeft, reachRight
  while (pixelStack.length) {
    const pos = pixelStack.pop()
    x = pos[0]; y = pos[1]
    pixelPos = (y * width + x) * 4
    while (y >= 0 && matchColor(data, pixelPos, tr, tg, tb, ta)) { y--; pixelPos -= width * 4 }
    pixelPos += width * 4; y++
    reachLeft = false; reachRight = false
    while (y < height && matchColor(data, pixelPos, tr, tg, tb, ta)) {
      fillPixel(data, pixelPos, fr, fg, fb, fa)
      if (x > 0) {
        if (matchColor(data, pixelPos - 4, tr, tg, tb, ta)) {
          if (!reachLeft) { pixelStack.push([x - 1, y]); reachLeft = true }
        } else if (reachLeft) { reachLeft = false }
      }
      if (x < width - 1) {
        if (matchColor(data, pixelPos + 4, tr, tg, tb, ta)) {
          if (!reachRight) { pixelStack.push([x + 1, y]); reachRight = true }
        } else if (reachRight) { reachRight = false }
      }
      y++; pixelPos += width * 4
    }
  }
}

function makeBuffer(width, height, r, g, b, a) {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a
  }
  return data
}

// ─── Benchmarks ───────────────────────────────────────────────────────────────

for (const size of [256, 512, 1024]) {
  const template = makeBuffer(size, size, 255, 0, 0, 255)
  const data = new Uint8ClampedArray(template.length)
  const cx = Math.floor(size / 2)
  const cy = Math.floor(size / 2)

  describe(`floodFill — ${size}×${size} uniform from center`, () => {
    bench("JS ", () => {
      data.set(template)
      floodFillJS(data, size, size, cx, cy, 255, 0, 0, 255, 0, 0, 255, 255)
    })
    bench("WASM", () => {
      data.set(template)
      wasmFloodFill(data, size, size, cx, cy, 255, 0, 0, 255, 0, 0, 255, 255)
    })
  })
}

for (const size of [256, 512, 1024]) {
  const template = makeBuffer(size, size, 255, 0, 0, 255)
  const data = new Uint8ClampedArray(template.length)

  describe(`floodFill — ${size}×${size} uniform from corner`, () => {
    bench("JS ", () => {
      data.set(template)
      floodFillJS(data, size, size, 0, 0, 255, 0, 0, 255, 0, 0, 255, 255)
    })
    bench("WASM", () => {
      data.set(template)
      wasmFloodFill(data, size, size, 0, 0, 255, 0, 0, 255, 0, 0, 255, 255)
    })
  })
}
