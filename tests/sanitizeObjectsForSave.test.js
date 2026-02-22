import { describe, it, expect } from "vitest"
import {
  sanitizeLayers,
  sanitizeVectors,
  sanitizePalette,
  sanitizeHistory,
} from "../src/utils/sanitizeObjectsForSave.js"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeRasterLayer = (overrides = {}) => ({
  type: "raster",
  id: 1,
  isPreview: false,
  removed: false,
  cvs: { toDataURL: () => "" },
  ctx: {},
  onscreenCvs: {},
  onscreenCtx: {},
  ...overrides,
})

const makeReferenceLayer = (overrides = {}) => ({
  type: "reference",
  id: 2,
  isPreview: false,
  removed: false,
  img: "data:image/png;base64,abc",
  onscreenCvs: {},
  onscreenCtx: {},
  ...overrides,
})

const makeAction = (overrides = {}) => ({
  index: 0,
  tool: "brush",
  layer: makeRasterLayer(),
  hidden: false,
  removed: false,
  snapshot: "data:image/png;base64,snap",
  selectProperties: { px1: null, py1: null, px2: null, py2: null },
  selectedVectorIndices: [],
  currentVectorIndex: null,
  ...overrides,
})

// ─── sanitizeLayers ───────────────────────────────────────────────────────────

describe("sanitizeLayers", () => {
  it("removes preview layers regardless of other flags", () => {
    const layers = [makeRasterLayer({ isPreview: true }), makeRasterLayer()]
    const result = sanitizeLayers(layers, true, true, true)
    expect(result).toHaveLength(1)
    expect(result[0].isPreview).toBe(false)
  })

  it("removes removed layers when preserveHistory and includeRemovedActions are both false", () => {
    const layers = [
      makeRasterLayer({ removed: true }),
      makeRasterLayer(),
    ]
    const result = sanitizeLayers(layers, false, false, false)
    expect(result).toHaveLength(1)
    expect(result[0].removed).toBe(false)
  })

  it("keeps removed layers when includeRemovedActions is true", () => {
    const layers = [makeRasterLayer({ removed: true }), makeRasterLayer()]
    const result = sanitizeLayers(layers, false, false, true)
    expect(result).toHaveLength(2)
  })

  it("keeps removed layers when preserveHistory is true", () => {
    const layers = [makeRasterLayer({ removed: true })]
    const result = sanitizeLayers(layers, true, false, false)
    expect(result).toHaveLength(1)
  })

  it("removes reference layers when preserveHistory and includeReferenceLayers are false", () => {
    const layers = [makeReferenceLayer(), makeRasterLayer()]
    const result = sanitizeLayers(layers, false, false, false)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe("raster")
  })

  it("keeps reference layers when includeReferenceLayers is true", () => {
    const layers = [makeReferenceLayer(), makeRasterLayer()]
    const result = sanitizeLayers(layers, false, true, false)
    expect(result).toHaveLength(2)
  })

  it("strips cvs and ctx from raster layers", () => {
    const layers = [makeRasterLayer()]
    const result = sanitizeLayers(layers, true, true, true)
    expect(result[0]).not.toHaveProperty("cvs")
    expect(result[0]).not.toHaveProperty("ctx")
  })

  it("strips onscreenCvs and onscreenCtx from all kept layers", () => {
    const layers = [makeRasterLayer(), makeReferenceLayer()]
    const result = sanitizeLayers(layers, true, true, true)
    result.forEach((layer) => {
      expect(layer).not.toHaveProperty("onscreenCvs")
      expect(layer).not.toHaveProperty("onscreenCtx")
    })
  })

  it("strips img from reference layers", () => {
    const layers = [makeReferenceLayer()]
    const result = sanitizeLayers(layers, true, true, true)
    expect(result[0]).not.toHaveProperty("img")
  })

  it("does not mutate the original layers array", () => {
    const layers = [makeRasterLayer()]
    sanitizeLayers(layers, true, true, true)
    expect(layers[0]).toHaveProperty("cvs")
  })
})

// ─── sanitizePalette ──────────────────────────────────────────────────────────

describe("sanitizePalette", () => {
  const palette = [
    { color: "#ff0000", r: 255, g: 0, b: 0, a: 255 },
    { color: "#000000", r: 0, g: 0, b: 0, a: 255 },
  ]

  it("returns null when preserveHistory and includePalette are both false", () => {
    expect(sanitizePalette(palette, false, false)).toBeNull()
  })

  it("returns a copy when includePalette is true", () => {
    const result = sanitizePalette(palette, false, true)
    expect(result).toEqual(palette)
  })

  it("returns a copy when preserveHistory is true", () => {
    const result = sanitizePalette(palette, true, false)
    expect(result).toEqual(palette)
  })

  it("returns a deep copy, not the original reference", () => {
    const result = sanitizePalette(palette, true, true)
    expect(result).not.toBe(palette)
  })
})

// ─── sanitizeHistory ──────────────────────────────────────────────────────────

describe("sanitizeHistory", () => {
  it("removes the snapshot from each action", () => {
    const action = makeAction()
    const result = sanitizeHistory([action], true, true, true)
    expect(result[0]).not.toHaveProperty("snapshot")
  })

  it("replaces layer with a stub containing only the id", () => {
    const action = makeAction({ layer: { ...makeRasterLayer(), id: 42 } })
    const result = sanitizeHistory([action], true, true, true)
    expect(result[0].layer).toEqual({ id: 42 })
  })

  it("removes actions on removed layers when preserveHistory and includeRemovedActions are false", () => {
    const action = makeAction({ layer: makeRasterLayer({ removed: true }) })
    const result = sanitizeHistory([action], false, true, false)
    expect(result).toHaveLength(0)
  })

  it("keeps removed-layer actions when includeRemovedActions is true", () => {
    const action = makeAction({ layer: makeRasterLayer({ removed: true }) })
    const result = sanitizeHistory([action], false, true, true)
    expect(result).toHaveLength(1)
  })

  it("removes reference-layer actions when preserveHistory and includeReferenceLayers are false", () => {
    const action = makeAction({ layer: makeReferenceLayer() })
    const result = sanitizeHistory([action], false, false, true)
    expect(result).toHaveLength(0)
  })

  it("keeps reference-layer actions when includeReferenceLayers is true", () => {
    const action = makeAction({ layer: makeReferenceLayer() })
    const result = sanitizeHistory([action], false, true, true)
    expect(result).toHaveLength(1)
  })

  it("removes an unconfirmed paste action and all actions after it", () => {
    const action0 = makeAction({ index: 0, tool: "brush" })
    const action1 = makeAction({
      index: 1,
      tool: "paste",
      confirmed: false,
    })
    const action2 = makeAction({ index: 2, tool: "brush" })
    const result = sanitizeHistory([action0, action1, action2], true, true, true)
    // Only the brush action before the paste should survive
    expect(result).toHaveLength(1)
    expect(result[0].tool).toBe("brush")
  })

  it("keeps a confirmed paste action", () => {
    const action0 = makeAction({ index: 0, tool: "brush" })
    const action1 = makeAction({
      index: 1,
      tool: "paste",
      confirmed: true,
    })
    const result = sanitizeHistory([action0, action1], true, true, true)
    expect(result).toHaveLength(2)
  })

  it("flattens points from {x, y, brushSize} objects to a flat array of values", () => {
    const action = makeAction({
      points: [
        { x: 10, y: 20, brushSize: 3 },
        { x: 30, y: 40, brushSize: 5 },
      ],
    })
    const result = sanitizeHistory([action], true, true, true)
    expect(result[0].points).toEqual([10, 20, 3, 30, 40, 5])
  })

  it("does not mutate the original undoStack actions", () => {
    const action = makeAction()
    sanitizeHistory([action], true, true, true)
    expect(action).toHaveProperty("snapshot")
  })
})

// ─── sanitizeVectors ──────────────────────────────────────────────────────────
// vectors is an object keyed by numeric index, matching state.vector.all

describe("sanitizeVectors", () => {
  it("replaces layer with a stub containing only the id", () => {
    const action = makeAction({ index: 0 })
    const vector = {
      index: 1,
      removed: false,
      layer: { ...makeRasterLayer(), id: 7 },
      action: action,
      vectorProperties: {},
    }
    const result = sanitizeVectors([action], { 1: vector }, true, true)
    expect(result["1"].layer).toEqual({ id: 7 })
  })

  it("replaces action with a stub containing only the index", () => {
    const action = makeAction({ index: 3 })
    const vector = {
      index: 1,
      removed: false,
      layer: makeRasterLayer(),
      action: action,
      vectorProperties: {},
    }
    const result = sanitizeVectors([action], { 1: vector }, true, true)
    expect(result["1"].action).toEqual({ index: 3 })
  })

  it("removes vectors whose action is not in the undoStack", () => {
    const action = makeAction({ index: 0 })
    const orphanAction = makeAction({ index: 99 })
    const vector = {
      index: 1,
      removed: false,
      layer: makeRasterLayer(),
      action: orphanAction,
      vectorProperties: {},
    }
    const result = sanitizeVectors([action], { 1: vector }, true, true)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it("removes removed vectors when preserveHistory and includeRemovedActions are false", () => {
    const action = makeAction({ index: 0 })
    const vector = {
      index: 1,
      removed: true,
      layer: makeRasterLayer(),
      action: action,
      vectorProperties: {},
    }
    const result = sanitizeVectors([action], { 1: vector }, false, false)
    expect(Object.keys(result)).toHaveLength(0)
  })

  it("does not mutate the original vectors object", () => {
    const action = makeAction({ index: 0 })
    const vector = {
      index: 1,
      removed: false,
      layer: { ...makeRasterLayer(), id: 7 },
      action: action,
      vectorProperties: {},
    }
    const originalLayer = vector.layer
    sanitizeVectors([action], { 1: vector }, true, true)
    expect(vector.layer).toBe(originalLayer)
  })
})
