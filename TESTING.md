# Testing

## Running tests

```bash
# Single run (CI / verify before committing)
npm test

# Watch mode (re-runs on file save during development)
npm run test:watch
```

Tests use [Vitest](https://vitest.dev). No browser is required — tests run in Node with DOM dependencies mocked out.

---

## Test file location and naming

```
tests/
  state.test.js        # state domain methods and setters
  <topic>.test.js      # add new files per logical group
```

Place test files in `tests/` at the project root. Name them `<topic>.test.js`.

---

## How to write a new test file

### 1. Mock browser-dependent modules first

`state.js` imports `dom.js` and `Tools/index.js`, which both reference browser globals at module evaluation time. Mock them **before** importing anything that depends on them. Vitest hoists `vi.mock()` calls automatically.

```js
import { describe, it, expect, beforeEach, vi } from "vitest"

// These mocks are hoisted — they intercept imports in all downstream modules
vi.mock("../src/Context/dom.js", () => ({
  dom: {
    vectorTransformUIContainer: { style: { display: "" } },
    // Add any other dom properties your code under test touches
  },
}))

vi.mock("../src/Tools/index.js", () => ({
  tools: {
    brush: { name: "brush", type: "raster" },
    line:  { name: "line",  type: "vector" },
    // Add entries for any tool names referenced in the code under test
  },
}))

// Imports come after mocks
import { state, registerDOMHelpers, registerVectorGui } from "../src/Context/state.js"
```

If your test file does not import `state.js` (e.g. you're testing a pure utility), you may not need any mocks at all.

### 2. Reset state between tests

`state` is a singleton — mutations in one test bleed into the next. Use `beforeEach` to restore a known baseline:

```js
beforeEach(() => {
  // Reset only the domains your tests touch
  state.selection.resetProperties()
  state.selection.resetBoundaryBox()
  state.vector.setCurrentIndex(null)
  state.vector.clearSelected()
  state.vector.highestKey = 0
  state.timeline.clearPoints()
})
```

### 3. Test registered callbacks with `vi.fn()`

`registerDOMHelpers` and `registerVectorGui` inject callbacks into `state.js`. Use mocks to verify they fire:

```js
it("calls enableActionsForSelection when coords are valid", () => {
  const enableFn = vi.fn()
  registerDOMHelpers({
    disableActionsForNoSelection: vi.fn(),
    enableActionsForSelection: enableFn,
  })

  state.selection.setBoundaryBox({ px1: 0, py1: 0, px2: 10, py2: 10 })

  expect(enableFn).toHaveBeenCalledOnce()
})
```

> **Note:** Registered callbacks persist across tests within a file because `state.js` is a module singleton. If you register a mock in one test, it remains registered for subsequent tests unless you re-register. Call `registerDOMHelpers` / `registerVectorGui` inside the specific `it()` block where you need it rather than in `beforeEach`, or re-register a fresh mock each time.

---

## What to test

**Good candidates:**

| Target | Why |
|---|---|
| `state.selection` methods | Pure coordinate math with clear inputs and outputs |
| `state.vector` setters | Simple mutations with a defined contract |
| `state.timeline` setters | Array operations with no side effects |
| `state.deselect()` | Cross-domain reset — exercises the injection pattern |
| Pure utility functions in `src/utils/` | No DOM, no state — easiest to test |
| Save/load round-trips (`src/Save/savefile.js`) | High value, catches regressions in serialization |
| Undo/redo logic in `addToTimeline` | Command pattern correctness is critical |

**Avoid testing:**

- Rendering functions (`renderCanvas`, `vectorGui.render`, etc.) — they depend on canvas context and the visual output; test their inputs/outputs instead
- Pointer event handlers directly — test the state mutations they cause, not the event wiring
- DOM structure — that belongs in end-to-end tests, not unit tests

---

## Requirements when writing new tests

1. **Each `it()` tests one behavior** — if the description needs "and", split it into two tests.

2. **`beforeEach` resets state** — never rely on test execution order.

3. **Mock only what you need** — if a module doesn't touch the DOM, don't mock it; let the real code run.

4. **Add mock entries for any new tools** — if `state.clearRedoStack()` or similar iterates over `tools[action.tool]`, the mock `tools` object must include every tool name that appears in test data.

5. **Prefer `toEqual` over `toBe` for objects** — `toBe` checks reference equality; `toEqual` checks deep value equality.

6. **Test the contract, not the implementation** — test what a method does (its observable effect on state), not how it does it internally.

---

## Performance benchmarks

Benchmarks live in `tests/benchmarks/` and use Vitest's built-in `bench()` API (Vitest 4.x, no extra dependencies).

### Running benchmarks

```bash
# Run all benchmark files
npx vitest bench

# Run a specific file
npx vitest bench tests/benchmarks/colorMask.bench.js

# Verbose output with full percentile table
npx vitest bench --reporter=verbose
```

Benchmark files use the `.bench.js` extension and are excluded from the regular `npm test` run.

### Benchmark file structure

```
tests/benchmarks/
  colorMask.bench.js   — createColorMaskSet() pixel scan loop
  fill.bench.js        — flood fill scanline algorithm (actionFill)
  transform.bench.js   — raster rotation + scaling (transformRasterContent)
  brush.bench.js       — brush stamp generation for all 32 sizes
  bezier.bench.js      — quad, cubic, and conic bezier rasterization
```

Each file inlines the core algorithm (isolated from canvas/DOM) and tests multiple canvas sizes and input shapes to reveal how performance scales.

### How to write a benchmark

Benchmark files follow the same import/describe pattern as test files, but use `bench()` instead of `it()`:

```js
import { describe, bench } from "vitest"

describe("my operation", () => {
  bench("256×256", () => {
    // code to time — runs many iterations automatically
  })
})
```

For operations that modify a buffer in-place (e.g. flood fill), reset the buffer at the start of each iteration using `Uint8ClampedArray.set()` rather than allocating a fresh array, to avoid measuring allocation overhead:

```js
const template = makePixelBuffer(size, size, 255, 0, 0, 255)
const data = new Uint8ClampedArray(template.length)

bench(`${size}×${size}`, () => {
  data.set(template) // fast memcpy — resets without re-allocating
  floodFill(data, size, size, ...)
})
```

### Baseline results (macOS, Apple M-series, Vitest 4.0.18)

Results recorded 2026-02-22. Use these as the comparison baseline when evaluating WASM implementations.

#### Flood fill — uniform canvas from center (worst case: every pixel visited)

| Canvas | mean | ops/sec |
|--------|------|---------|
| 256×256 | 0.79ms | 1,273 |
| 512×512 | 3.0ms | 333 |
| 1024×1024 | 13.8ms | 73 |

Scaling is ~3.8–4× per canvas doubling — close to the expected O(n) linear. Stack-based pixel loop in `src/Actions/pointerActions.js:237`.

#### Color mask — worst case (all pixels match)

| Canvas | mean | ops/sec |
|--------|------|---------|
| 256×256 | 11.2ms | 89 |
| 512×512 | 72.5ms | 13.8 |
| 1024×1024 | 466ms | 2.1 |

Scaling is ~6.5–41× per doubling — **severely superlinear**. The raw pixel scan (no Set insertions) takes only 2.9ms at 1024×1024; the bottleneck is the `` `${x},${y}` `` string allocation per matching pixel, which creates GC pressure at scale. Switching to numeric Set keys would dramatically reduce this cost before any WASM work.

#### Color mask — no pixels match (scan only, no Set insertions)

| Canvas | mean | ops/sec |
|--------|------|---------|
| 256×256 | 0.18ms | 5,425 |
| 512×512 | 0.74ms | 1,345 |
| 1024×1024 | 2.94ms | 341 |

Scales ~4× per doubling — perfectly linear. Shows the true cost of the pixel loop without GC noise.

#### Transform — full pipeline (rotate 90° + scale 1:1)

| Canvas | mean | ops/sec |
|--------|------|---------|
| 256×256 | 2.57ms | 389 |
| 512×512 | 9.67ms | 103 |
| 1024×1024 | 37.6ms | 27 |

Scaling is ~3.8× per doubling — linear. Two nested O(w×h) loops in `src/utils/transformHelpers.js:54`.

#### Brush stamp generation — all 32 sizes at startup

| Brush type | mean |
|-----------|------|
| Circle (sizes 1–32) | 7.9ms |
| Square (sizes 1–32) | 9.6ms |

Runs once at startup. Per-size cost at size 32 is ~0.7ms (circle) and ~0.9ms (square). Scaling from size 1 to 32 is ~300–470× (superlinear, same string-key Set cause as colorMask).

#### Bezier rasterization

| Curve type | ~50px span | ~200px span | ~500px span |
|------------|-----------|------------|------------|
| Quad bezier | 0.008ms | 0.031ms | 0.082ms |
| Cubic bezier | 0.011ms | 0.041ms | 0.102ms |
| Conic (w=0.7) | 0.025ms | — | 0.068ms |

All scale ~4× per 4× span increase — linear and fast. Not a meaningful WASM target.
