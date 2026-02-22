import { describe, it, expect } from "vitest"
import { getTriangle, getAngle } from "../src/utils/trig.js"
import { coordArrayFromSet } from "../src/utils/maskHelpers.js"

// ─── getAngle ─────────────────────────────────────────────────────────────────

describe("getAngle", () => {
  it("right (positive x) → 0", () => {
    expect(getAngle(1, 0)).toBeCloseTo(0)
  })

  it("up (negative y) → -PI/2", () => {
    expect(getAngle(0, -1)).toBeCloseTo(-Math.PI / 2)
  })

  it("left (negative x) → PI", () => {
    expect(getAngle(-1, 0)).toBeCloseTo(Math.PI)
  })

  it("down (positive y) → PI/2", () => {
    expect(getAngle(0, 1)).toBeCloseTo(Math.PI / 2)
  })

  it("origin (0, 0) → 0", () => {
    expect(getAngle(0, 0)).toBe(0)
  })

  it("diagonal down-right → PI/4", () => {
    expect(getAngle(1, 1)).toBeCloseTo(Math.PI / 4)
  })

  it("returns a value in [-PI, PI]", () => {
    const angle = getAngle(-3, -4)
    expect(angle).toBeGreaterThanOrEqual(-Math.PI)
    expect(angle).toBeLessThanOrEqual(Math.PI)
  })
})

// ─── getTriangle ──────────────────────────────────────────────────────────────

describe("getTriangle", () => {
  it("horizontal line uses x as the long axis", () => {
    // wider horizontally: |x1-x2| > |y1-y2|
    const tri = getTriangle(0, 0, 10, 2, 0)
    expect(tri.long).toBe(10) // Math.abs(0 - 10)
  })

  it("vertical line uses y as the long axis", () => {
    // taller vertically: |y1-y2| > |x1-x2|
    const tri = getTriangle(0, 0, 2, 10, Math.PI / 2)
    expect(tri.long).toBe(10) // Math.abs(0 - 10)
  })

  it("returns an object with x, y, and long properties", () => {
    const tri = getTriangle(0, 0, 5, 0, 0)
    expect(tri).toHaveProperty("x")
    expect(tri).toHaveProperty("y")
    expect(tri).toHaveProperty("long")
  })

  it("angle=0 on a horizontal line: x direction is 1", () => {
    // cos(0) = 1, so Math.sign(cos(0)) = 1
    const tri = getTriangle(0, 0, 10, 0, 0)
    expect(tri.x).toBeCloseTo(1)
  })
})

// ─── coordArrayFromSet ────────────────────────────────────────────────────────

describe("coordArrayFromSet", () => {
  it("converts a set of 'x,y' strings to {x, y} objects", () => {
    const set = new Set(["10,20", "30,40"])
    const result = coordArrayFromSet(set, 0, 0)
    expect(result).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ])
  })

  it("applies xOffset and yOffset to each coordinate", () => {
    const set = new Set(["10,20"])
    const result = coordArrayFromSet(set, 3, 5)
    expect(result).toEqual([{ x: 7, y: 15 }])
  })

  it("returns null when set is null", () => {
    expect(coordArrayFromSet(null, 0, 0)).toBeNull()
  })

  it("returns null when set is undefined", () => {
    expect(coordArrayFromSet(undefined, 0, 0)).toBeNull()
  })

  it("returns an empty array for an empty set", () => {
    expect(coordArrayFromSet(new Set(), 0, 0)).toEqual([])
  })

  it("handles negative coordinates", () => {
    const set = new Set(["-5,-10"])
    const result = coordArrayFromSet(set, 0, 0)
    expect(result).toEqual([{ x: -5, y: -10 }])
  })

  it("handles negative offset resulting in negative coords", () => {
    const set = new Set(["3,4"])
    const result = coordArrayFromSet(set, 10, 10)
    expect(result).toEqual([{ x: -7, y: -6 }])
  })
})
