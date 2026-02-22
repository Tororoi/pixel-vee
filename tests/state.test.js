import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock DOM and Tools before importing state — vi.mock is hoisted automatically
vi.mock("../src/Context/dom.js", () => ({
  dom: {
    vectorTransformUIContainer: { style: { display: "" } },
  },
}))

vi.mock("../src/Tools/index.js", () => ({
  tools: {
    brush: { name: "brush", type: "raster" },
    line: { name: "line", type: "vector" },
    remove: { name: "remove", type: "vector" },
    paste: { name: "paste", type: "raster" },
  },
}))

import { state, registerDOMHelpers, registerVectorGui } from "../src/Context/state.js"

// ─── state.selection ──────────────────────────────────────────────────────────

describe("state.selection", () => {
  beforeEach(() => {
    state.selection.resetProperties()
    state.selection.resetBoundaryBox()
  })

  describe("resetProperties()", () => {
    it("clears all selection coordinates to null", () => {
      state.selection.properties = { px1: 10, py1: 20, px2: 30, py2: 40 }
      state.selection.maskSet = new Set([1, 2])

      state.selection.resetProperties()

      expect(state.selection.properties).toEqual({
        px1: null,
        py1: null,
        px2: null,
        py2: null,
      })
    })

    it("clears maskSet to null", () => {
      state.selection.maskSet = new Set([1, 2])

      state.selection.resetProperties()

      expect(state.selection.maskSet).toBeNull()
    })
  })

  describe("normalize()", () => {
    it("swaps coordinates so px1/py1 are always the min", () => {
      state.selection.properties = { px1: 30, py1: 40, px2: 10, py2: 20 }

      state.selection.normalize()

      expect(state.selection.properties).toEqual({
        px1: 10,
        py1: 20,
        px2: 30,
        py2: 40,
      })
    })

    it("leaves already-normalized properties unchanged", () => {
      state.selection.properties = { px1: 5, py1: 10, px2: 50, py2: 100 }

      state.selection.normalize()

      expect(state.selection.properties).toEqual({
        px1: 5,
        py1: 10,
        px2: 50,
        py2: 100,
      })
    })

    it("handles equal coordinates without error", () => {
      state.selection.properties = { px1: 10, py1: 10, px2: 10, py2: 10 }

      state.selection.normalize()

      expect(state.selection.properties).toEqual({
        px1: 10,
        py1: 10,
        px2: 10,
        py2: 10,
      })
    })
  })

  describe("resetBoundaryBox()", () => {
    it("clears all boundary box coordinates to null", () => {
      state.selection.boundaryBox = { xMin: 5, yMin: 10, xMax: 50, yMax: 100 }

      state.selection.resetBoundaryBox()

      expect(state.selection.boundaryBox).toEqual({
        xMin: null,
        yMin: null,
        xMax: null,
        yMax: null,
      })
    })
  })

  describe("setBoundaryBox()", () => {
    it("sets xMin/yMin to the smaller coordinate and xMax/yMax to the larger", () => {
      state.selection.setBoundaryBox({ px1: 10, py1: 20, px2: 50, py2: 80 })

      expect(state.selection.boundaryBox).toEqual({
        xMin: 10,
        yMin: 20,
        xMax: 50,
        yMax: 80,
      })
    })

    it("normalizes inverted coordinates (px1 > px2)", () => {
      state.selection.setBoundaryBox({ px1: 50, py1: 80, px2: 10, py2: 20 })

      expect(state.selection.boundaryBox).toEqual({
        xMin: 10,
        yMin: 20,
        xMax: 50,
        yMax: 80,
      })
    })

    it("resets boundary box when any coordinate is null", () => {
      state.selection.boundaryBox = { xMin: 10, yMin: 20, xMax: 50, yMax: 80 }

      state.selection.setBoundaryBox({ px1: null, py1: 20, px2: 50, py2: 80 })

      expect(state.selection.boundaryBox).toEqual({
        xMin: null,
        yMin: null,
        xMax: null,
        yMax: null,
      })
    })

    it("calls enableActionsForSelection when registered and coords are valid", () => {
      const enableFn = vi.fn()
      registerDOMHelpers({
        disableActionsForNoSelection: vi.fn(),
        enableActionsForSelection: enableFn,
      })

      state.selection.setBoundaryBox({ px1: 10, py1: 20, px2: 50, py2: 80 })

      expect(enableFn).toHaveBeenCalledOnce()
    })

    it("does not call enableActionsForSelection when coords are null", () => {
      const enableFn = vi.fn()
      registerDOMHelpers({
        disableActionsForNoSelection: vi.fn(),
        enableActionsForSelection: enableFn,
      })

      state.selection.setBoundaryBox({ px1: null, py1: null, px2: null, py2: null })

      expect(enableFn).not.toHaveBeenCalled()
    })
  })
})

// ─── state.vector ─────────────────────────────────────────────────────────────

describe("state.vector", () => {
  beforeEach(() => {
    state.vector.setCurrentIndex(null)
    state.vector.clearSelected()
    state.vector.highestKey = 0
  })

  describe("setCurrentIndex()", () => {
    it("sets currentIndex to the given value", () => {
      state.vector.setCurrentIndex(42)

      expect(state.vector.currentIndex).toBe(42)
    })

    it("accepts null to clear the current index", () => {
      state.vector.setCurrentIndex(5)
      state.vector.setCurrentIndex(null)

      expect(state.vector.currentIndex).toBeNull()
    })
  })

  describe("nextKey()", () => {
    it("increments highestKey by 1 and returns the new value", () => {
      const key = state.vector.nextKey()

      expect(key).toBe(1)
      expect(state.vector.highestKey).toBe(1)
    })

    it("returns sequential values on repeated calls", () => {
      expect(state.vector.nextKey()).toBe(1)
      expect(state.vector.nextKey()).toBe(2)
      expect(state.vector.nextKey()).toBe(3)
    })
  })

  describe("addSelected()", () => {
    it("adds an index to selectedIndices", () => {
      state.vector.addSelected(5)

      expect(state.vector.selectedIndices.has(5)).toBe(true)
    })

    it("adding the same index twice only stores it once", () => {
      state.vector.addSelected(5)
      state.vector.addSelected(5)

      expect(state.vector.selectedIndices.size).toBe(1)
    })
  })

  describe("removeSelected()", () => {
    it("removes an index from selectedIndices", () => {
      state.vector.addSelected(5)
      state.vector.removeSelected(5)

      expect(state.vector.selectedIndices.has(5)).toBe(false)
    })

    it("removing a non-existent index is a no-op", () => {
      state.vector.addSelected(5)
      state.vector.removeSelected(99)

      expect(state.vector.selectedIndices.size).toBe(1)
    })
  })

  describe("clearSelected()", () => {
    it("empties selectedIndices", () => {
      state.vector.addSelected(1)
      state.vector.addSelected(2)
      state.vector.addSelected(3)

      state.vector.clearSelected()

      expect(state.vector.selectedIndices.size).toBe(0)
    })

    it("is safe to call on an already-empty set", () => {
      expect(() => state.vector.clearSelected()).not.toThrow()
    })
  })
})

// ─── state.timeline ───────────────────────────────────────────────────────────

describe("state.timeline", () => {
  beforeEach(() => {
    state.timeline.clearPoints()
    state.timeline.clearActiveIndexes()
    state.timeline.clearSavedBetweenActionImages()
  })

  describe("addPoint() / clearPoints()", () => {
    it("addPoint appends an object to the points array", () => {
      state.timeline.addPoint({ x: 10, y: 20 })
      state.timeline.addPoint({ x: 30, y: 40 })

      expect(state.timeline.points).toHaveLength(2)
      expect(state.timeline.points[0]).toEqual({ x: 10, y: 20 })
      expect(state.timeline.points[1]).toEqual({ x: 30, y: 40 })
    })

    it("clearPoints resets to an empty array", () => {
      state.timeline.addPoint({ x: 10, y: 20 })

      state.timeline.clearPoints()

      expect(state.timeline.points).toHaveLength(0)
    })
  })

  describe("clearActiveIndexes()", () => {
    it("resets activeIndexes to an empty array", () => {
      state.timeline.activeIndexes = [1, 2, 3]

      state.timeline.clearActiveIndexes()

      expect(state.timeline.activeIndexes).toHaveLength(0)
    })
  })

  describe("clearSavedBetweenActionImages()", () => {
    it("resets savedBetweenActionImages to an empty array", () => {
      state.timeline.savedBetweenActionImages = ["img1", "img2"]

      state.timeline.clearSavedBetweenActionImages()

      expect(state.timeline.savedBetweenActionImages).toHaveLength(0)
    })
  })
})

// ─── state.deselect() ─────────────────────────────────────────────────────────

describe("state.deselect()", () => {
  beforeEach(() => {
    // Set up a known non-empty state
    state.selection.properties = { px1: 10, py1: 20, px2: 50, py2: 80 }
    state.selection.maskSet = new Set([1, 2])
    state.selection.boundaryBox = { xMin: 10, yMin: 20, xMax: 50, yMax: 80 }
    state.vector.properties = { type: "line", px1: 5 }
    state.vector.setCurrentIndex(3)
    state.vector.addSelected(1)
    state.vector.addSelected(2)
  })

  it("resets selection properties", () => {
    state.deselect()

    expect(state.selection.properties).toEqual({
      px1: null,
      py1: null,
      px2: null,
      py2: null,
    })
  })

  it("clears the mask set", () => {
    state.deselect()

    expect(state.selection.maskSet).toBeNull()
  })

  it("resets the boundary box", () => {
    state.deselect()

    expect(state.selection.boundaryBox).toEqual({
      xMin: null,
      yMin: null,
      xMax: null,
      yMax: null,
    })
  })

  it("clears vector properties", () => {
    state.deselect()

    expect(state.vector.properties).toEqual({})
  })

  it("clears the current vector index", () => {
    state.deselect()

    expect(state.vector.currentIndex).toBeNull()
  })

  it("clears all selected vector indices", () => {
    state.deselect()

    expect(state.vector.selectedIndices.size).toBe(0)
  })

  it("calls disableActionsForNoSelection when registered", () => {
    const disableFn = vi.fn()
    registerDOMHelpers({
      disableActionsForNoSelection: disableFn,
      enableActionsForSelection: vi.fn(),
    })

    state.deselect()

    expect(disableFn).toHaveBeenCalledOnce()
  })

  it("calls vectorGui methods when registered", () => {
    const mockVectorGui = {
      selectedPoint: {},
      resetCollision: vi.fn(),
      mother: {
        newRotation: 5,
        currentRotation: 5,
        rotationOrigin: { x: 10, y: 10 },
      },
    }
    registerVectorGui(mockVectorGui)

    state.deselect()

    expect(mockVectorGui.resetCollision).toHaveBeenCalledOnce()
    expect(mockVectorGui.selectedPoint).toEqual({ xKey: null, yKey: null })
    expect(mockVectorGui.mother.newRotation).toBe(0)
    expect(mockVectorGui.mother.currentRotation).toBe(0)
    expect(mockVectorGui.mother.rotationOrigin.x).toBeNull()
    expect(mockVectorGui.mother.rotationOrigin.y).toBeNull()
  })
})
