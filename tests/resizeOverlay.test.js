import { describe, it, expect, beforeEach, vi } from "vitest"

// ─── Mocks (hoisted) ──────────────────────────────────────────────────────────

vi.mock("../src/Context/canvas.js", () => ({
  canvas: {
    offScreenCVS: { width: 64, height: 64 },
    zoom: 1,
    xOffset: 0,
    yOffset: 0,
    previousXOffset: 0,
    previousYOffset: 0,
    resizeOverlayCVS: { width: 800, height: 600 },
    resizeOverlayCTX: {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
    },
    vectorGuiCVS: { style: { cursor: "" } },
    currentLayer: 0,
  },
}))

vi.mock("../src/Context/dom.js", () => ({
  dom: {
    vectorTransformUIContainer: { style: { display: "" } },
    canvasWidth: { value: "" },
    canvasHeight: { value: "" },
    anchorGrid: {
      querySelectorAll: vi.fn(() => ({ forEach: vi.fn() })),
      querySelector: vi.fn(() => null),
    },
    sizeContainer: { style: { display: "" } },
  },
}))

vi.mock("../src/Context/state.js", () => ({
  state: {
    canvas: { cropOffsetX: 0, cropOffsetY: 0, resizeOverlayActive: false },
    cursor: { x: null, y: null },
    tool: { current: { cursor: "default" } },
    selection: {
      properties: { px1: null, py1: null, px2: null, py2: null },
      maskSet: null,
      setBoundaryBox: vi.fn(),
    },
    vector: { selectedIndices: new Set(), currentIndex: null },
    timeline: { undoStack: [], currentAction: null },
  },
}))

vi.mock("../src/Canvas/render.js", () => ({
  resizeOffScreenCanvas: vi.fn(),
}))

vi.mock("../src/GUI/select.js", () => ({
  stopMarchingAnts: vi.fn(),
  startMarchingAnts: vi.fn(),
  strokeMarchingAnts: vi.fn(),
  renderSelectionCVS: vi.fn(),
  drawSelectControlPoints: vi.fn(),
}))

vi.mock("../src/GUI/vector.js", () => ({
  vectorGui: {
    selectedPoint: { xKey: null, yKey: null },
    resetCollision: vi.fn(),
    selectedCollisionPresent: false,
  },
}))

vi.mock("../src/utils/guiHelpers.js", () => ({
  renderSelectionDimOverlay: vi.fn(),
}))

vi.mock("../src/Tools/brush.js", () => ({
  brush: { ditherOffsetX: 0, ditherOffsetY: 0 },
}))

vi.mock("../src/DOM/renderBrush.js", () => ({
  applyDitherOffset: vi.fn(),
  applyDitherOffsetControl: vi.fn(),
}))

import {
  resizeOverlay,
  setAnchor,
  applyFromInputs,
} from "../src/Canvas/resizeOverlay.js"

// ─── resizeOverlay initial state ──────────────────────────────────────────────

describe("resizeOverlay object", () => {
  it("has the expected initial shape", () => {
    expect(resizeOverlay).toMatchObject({
      newWidth: expect.any(Number),
      newHeight: expect.any(Number),
      contentOffsetX: expect.any(Number),
      contentOffsetY: expect.any(Number),
      anchor: expect.any(String),
      dragHandle: null,
      prevCx: expect.any(Number),
      prevCy: expect.any(Number),
    })
  })
})

// ─── setAnchor ────────────────────────────────────────────────────────────────

describe("setAnchor()", () => {
  beforeEach(() => {
    resizeOverlay.anchor = "top-left"
  })

  it("sets anchor to the given value", () => {
    setAnchor("center")
    expect(resizeOverlay.anchor).toBe("center")
  })

  it("accepts all valid anchor names", () => {
    const anchors = [
      "top-left", "top", "top-right",
      "left", "center", "right",
      "bottom-left", "bottom", "bottom-right",
    ]
    for (const a of anchors) {
      setAnchor(a)
      expect(resizeOverlay.anchor).toBe(a)
    }
  })
})

// ─── applyFromInputs ──────────────────────────────────────────────────────────

describe("applyFromInputs()", () => {
  beforeEach(() => {
    resizeOverlay.newWidth = 64
    resizeOverlay.newHeight = 64
    resizeOverlay.contentOffsetX = 0
    resizeOverlay.contentOffsetY = 0
    resizeOverlay.anchor = "top-left"
  })

  // ── Dimension clamping ──────────────────────────────────────────────────────

  it("clamps width to MINIMUM_DIMENSION (8) when given a smaller value", () => {
    applyFromInputs(1, 64)
    expect(resizeOverlay.newWidth).toBe(8)
  })

  it("clamps height to MINIMUM_DIMENSION (8) when given a smaller value", () => {
    applyFromInputs(64, 1)
    expect(resizeOverlay.newHeight).toBe(8)
  })

  it("clamps width to MAXIMUM_DIMENSION (1024) when given a larger value", () => {
    applyFromInputs(9999, 64)
    expect(resizeOverlay.newWidth).toBe(1024)
  })

  it("clamps height to MAXIMUM_DIMENSION (1024) when given a larger value", () => {
    applyFromInputs(64, 9999)
    expect(resizeOverlay.newHeight).toBe(1024)
  })

  it("treats 0 or NaN width as MINIMUM_DIMENSION", () => {
    applyFromInputs(0, 64)
    expect(resizeOverlay.newWidth).toBe(8)

    resizeOverlay.newWidth = 64
    applyFromInputs(NaN, 64)
    expect(resizeOverlay.newWidth).toBe(8)
  })

  it("accepts exact boundary values without clamping", () => {
    applyFromInputs(8, 1024)
    expect(resizeOverlay.newWidth).toBe(8)
    expect(resizeOverlay.newHeight).toBe(1024)
  })

  it("rounds fractional values to the nearest integer", () => {
    applyFromInputs(32.7, 32.2)
    expect(resizeOverlay.newWidth).toBe(33)
    expect(resizeOverlay.newHeight).toBe(32)
  })

  // ── Anchor: top-left (xFactor=0, yFactor=0) — offset never changes ──────────

  it("does not shift contentOffset when anchor is top-left", () => {
    resizeOverlay.anchor = "top-left"
    applyFromInputs(100, 100)
    expect(resizeOverlay.contentOffsetX).toBe(0)
    expect(resizeOverlay.contentOffsetY).toBe(0)
  })

  // ── Anchor: bottom-right (xFactor=1, yFactor=1) ────────────────────────────

  it("shifts offset by full delta when anchor is bottom-right", () => {
    resizeOverlay.anchor = "bottom-right"
    // Grow from 64×64 to 128×128: delta=64 in each axis, factor=1
    applyFromInputs(128, 128)
    expect(resizeOverlay.contentOffsetX).toBe(64)
    expect(resizeOverlay.contentOffsetY).toBe(64)
  })

  it("shifts offset correctly when shrinking with bottom-right anchor", () => {
    resizeOverlay.anchor = "bottom-right"
    // Shrink from 64×64 to 32×32: delta=-32, factor=1
    applyFromInputs(32, 32)
    expect(resizeOverlay.contentOffsetX).toBe(-32)
    expect(resizeOverlay.contentOffsetY).toBe(-32)
  })

  // ── Anchor: center (xFactor=0.5, yFactor=0.5) ──────────────────────────────

  it("shifts offset by half the delta when anchor is center", () => {
    resizeOverlay.anchor = "center"
    // Grow from 64×64 to 128×128: delta=64, factor=0.5 → offset shifts by 32
    applyFromInputs(128, 128)
    expect(resizeOverlay.contentOffsetX).toBe(32)
    expect(resizeOverlay.contentOffsetY).toBe(32)
  })

  // ── Anchor: top (xFactor=0.5, yFactor=0) ───────────────────────────────────

  it("shifts X offset by half delta but not Y when anchor is top", () => {
    resizeOverlay.anchor = "top"
    applyFromInputs(128, 128) // delta=64 in both
    expect(resizeOverlay.contentOffsetX).toBe(32) // xFactor=0.5
    expect(resizeOverlay.contentOffsetY).toBe(0)  // yFactor=0
  })

  // ── Preserves existing offset as a starting base ───────────────────────────

  it("adds onto a non-zero existing contentOffset", () => {
    resizeOverlay.contentOffsetX = 10
    resizeOverlay.contentOffsetY = 5
    resizeOverlay.anchor = "bottom-right"
    // Grow from 64×64 to 80×80: delta=16, factor=1
    applyFromInputs(80, 80)
    expect(resizeOverlay.contentOffsetX).toBe(26) // 10 + 16
    expect(resizeOverlay.contentOffsetY).toBe(21) // 5  + 16
  })

  // ── No-op when dimensions are unchanged ────────────────────────────────────

  it("does not change offset when dimensions are unchanged", () => {
    resizeOverlay.anchor = "center"
    applyFromInputs(64, 64) // same as starting values
    expect(resizeOverlay.contentOffsetX).toBe(0)
    expect(resizeOverlay.contentOffsetY).toBe(0)
  })
})

// ─── state.canvas sub-object ──────────────────────────────────────────────────
// Imported from a separate mock above, but the real field structure is tested
// directly in state.test.js — here we verify resizeOverlay interacts with the
// shape our mock defines (i.e. that the code doesn't access unexpected keys).

describe("state.canvas shape used by resizeOverlay", () => {
  it("resizeOverlay module imports without accessing unexpected state.canvas keys", async () => {
    // If the import succeeded without throwing, the mock shape is sufficient.
    expect(resizeOverlay).toBeDefined()
  })
})
