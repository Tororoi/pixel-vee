import { describe, it, expect } from "vitest"
import {
  RGBToHSL,
  HSLToRGB,
  hexToRGB,
  RGBToHex,
  getLuminance,
} from "../src/utils/colorConversion.js"

// ─── RGBToHSL ─────────────────────────────────────────────────────────────────

describe("RGBToHSL", () => {
  it("converts black", () => {
    expect(RGBToHSL({ red: 0, green: 0, blue: 0 })).toEqual({
      hue: 0,
      saturation: 0,
      lightness: 0,
    })
  })

  it("converts white", () => {
    expect(RGBToHSL({ red: 255, green: 255, blue: 255 })).toEqual({
      hue: 0,
      saturation: 0,
      lightness: 100,
    })
  })

  it("converts pure red", () => {
    expect(RGBToHSL({ red: 255, green: 0, blue: 0 })).toEqual({
      hue: 0,
      saturation: 100,
      lightness: 50,
    })
  })

  it("converts pure green", () => {
    expect(RGBToHSL({ red: 0, green: 255, blue: 0 })).toEqual({
      hue: 120,
      saturation: 100,
      lightness: 50,
    })
  })

  it("converts pure blue", () => {
    expect(RGBToHSL({ red: 0, green: 0, blue: 255 })).toEqual({
      hue: 240,
      saturation: 100,
      lightness: 50,
    })
  })

  it("converts yellow (red+green)", () => {
    expect(RGBToHSL({ red: 255, green: 255, blue: 0 })).toEqual({
      hue: 60,
      saturation: 100,
      lightness: 50,
    })
  })

  it("converts cyan (green+blue)", () => {
    expect(RGBToHSL({ red: 0, green: 255, blue: 255 })).toEqual({
      hue: 180,
      saturation: 100,
      lightness: 50,
    })
  })

  it("converts magenta (red+blue)", () => {
    expect(RGBToHSL({ red: 255, green: 0, blue: 255 })).toEqual({
      hue: 300,
      saturation: 100,
      lightness: 50,
    })
  })

  it("converts mid-gray", () => {
    const result = RGBToHSL({ red: 128, green: 128, blue: 128 })
    expect(result.hue).toBe(0)
    expect(result.saturation).toBe(0)
    // lightness is ~50.2 due to 128/255 rounding
    expect(result.lightness).toBeCloseTo(50.2, 0)
  })

  it("produces a non-negative hue (no negative hue values)", () => {
    // Blue-heavy colors can produce negative intermediate hue values
    const result = RGBToHSL({ red: 10, green: 20, blue: 200 })
    expect(result.hue).toBeGreaterThanOrEqual(0)
  })
})

// ─── HSLToRGB ─────────────────────────────────────────────────────────────────

describe("HSLToRGB", () => {
  it("converts black", () => {
    expect(HSLToRGB({ hue: 0, saturation: 0, lightness: 0 })).toEqual({
      red: 0,
      green: 0,
      blue: 0,
    })
  })

  it("converts white", () => {
    expect(HSLToRGB({ hue: 0, saturation: 0, lightness: 100 })).toEqual({
      red: 255,
      green: 255,
      blue: 255,
    })
  })

  it("converts pure red", () => {
    expect(HSLToRGB({ hue: 0, saturation: 100, lightness: 50 })).toEqual({
      red: 255,
      green: 0,
      blue: 0,
    })
  })

  it("converts pure green", () => {
    expect(HSLToRGB({ hue: 120, saturation: 100, lightness: 50 })).toEqual({
      red: 0,
      green: 255,
      blue: 0,
    })
  })

  it("converts pure blue", () => {
    expect(HSLToRGB({ hue: 240, saturation: 100, lightness: 50 })).toEqual({
      red: 0,
      green: 0,
      blue: 255,
    })
  })
})

// ─── Round-trip RGBToHSL → HSLToRGB ──────────────────────────────────────────

describe("RGBToHSL / HSLToRGB round-trip", () => {
  const primaries = [
    { red: 0, green: 0, blue: 0 },       // black
    { red: 255, green: 255, blue: 255 }, // white
    { red: 255, green: 0, blue: 0 },     // red
    { red: 0, green: 255, blue: 0 },     // green
    { red: 0, green: 0, blue: 255 },     // blue
    { red: 255, green: 255, blue: 0 },   // yellow
    { red: 0, green: 255, blue: 255 },   // cyan
    { red: 255, green: 0, blue: 255 },   // magenta
  ]

  primaries.forEach(({ red, green, blue }) => {
    it(`round-trips rgb(${red}, ${green}, ${blue})`, () => {
      const hsl = RGBToHSL({ red, green, blue })
      const result = HSLToRGB(hsl)
      expect(result.red).toBe(red)
      expect(result.green).toBe(green)
      expect(result.blue).toBe(blue)
    })
  })
})

// ─── hexToRGB ─────────────────────────────────────────────────────────────────

describe("hexToRGB", () => {
  it("converts a 7-character hex code", () => {
    expect(hexToRGB("#ff0000")).toEqual({ red: 255, green: 0, blue: 0 })
  })

  it("converts a 4-character shorthand hex code", () => {
    // #f00 expands to #ff0000
    expect(hexToRGB("#f00")).toEqual({ red: 255, green: 0, blue: 0 })
  })

  it("converts black", () => {
    expect(hexToRGB("#000000")).toEqual({ red: 0, green: 0, blue: 0 })
  })

  it("converts white", () => {
    expect(hexToRGB("#ffffff")).toEqual({ red: 255, green: 255, blue: 255 })
  })

  it("converts a mixed color", () => {
    expect(hexToRGB("#1a2b3c")).toEqual({ red: 26, green: 43, blue: 60 })
  })
})

// ─── RGBToHex ─────────────────────────────────────────────────────────────────

describe("RGBToHex", () => {
  it("converts red", () => {
    expect(RGBToHex({ red: 255, green: 0, blue: 0 })).toBe("#ff0000")
  })

  it("converts black", () => {
    expect(RGBToHex({ red: 0, green: 0, blue: 0 })).toBe("#000000")
  })

  it("converts white", () => {
    expect(RGBToHex({ red: 255, green: 255, blue: 255 })).toBe("#ffffff")
  })

  it("zero-pads single-digit hex values", () => {
    // red: 1 → "01", not "1"
    expect(RGBToHex({ red: 1, green: 2, blue: 3 })).toBe("#010203")
  })

  it("round-trips with hexToRGB", () => {
    const original = "#4a7fc1"
    expect(RGBToHex(hexToRGB(original))).toBe(original)
  })
})

// ─── getLuminance ─────────────────────────────────────────────────────────────

describe("getLuminance", () => {
  it("returns 0 for black", () => {
    expect(getLuminance({ red: 0, green: 0, blue: 0 })).toBe(0)
  })

  it("returns 100 for white", () => {
    expect(getLuminance({ red: 255, green: 255, blue: 255 })).toBe(100)
  })

  it("pure red has lower luminance than pure green (green dominates)", () => {
    const redLum = getLuminance({ red: 255, green: 0, blue: 0 })
    const greenLum = getLuminance({ red: 0, green: 255, blue: 0 })
    expect(greenLum).toBeGreaterThan(redLum)
  })

  it("pure blue has the lowest luminance among primaries", () => {
    const redLum = getLuminance({ red: 255, green: 0, blue: 0 })
    const greenLum = getLuminance({ red: 0, green: 255, blue: 0 })
    const blueLum = getLuminance({ red: 0, green: 0, blue: 255 })
    expect(blueLum).toBeLessThan(redLum)
    expect(blueLum).toBeLessThan(greenLum)
  })

  it("returns a value between 0 and 100", () => {
    const lum = getLuminance({ red: 100, green: 150, blue: 200 })
    expect(lum).toBeGreaterThanOrEqual(0)
    expect(lum).toBeLessThanOrEqual(100)
  })
})
