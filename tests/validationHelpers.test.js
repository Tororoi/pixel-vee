import { describe, it, expect } from "vitest"
import { validatePixelVeeFile } from "../src/utils/validationHelpers.js"

// Minimal valid file shapes for each supported version
const validV10 = () => ({
  metadata: {
    version: "1.0",
    application: "Pixel V",
    timestamp: "2024-01-01T00:00:00Z",
  },
  layers: [],
  history: [],
})

const validV11 = () => ({
  metadata: {
    version: "1.1",
    application: "Pixel V",
    timestamp: "2024-01-01T00:00:00Z",
  },
  vectors: { 1: {}, 2: {} },
  layers: [],
  history: [],
})

// ─── Valid files ───────────────────────────────────────────────────────────────

describe("validatePixelVeeFile — valid files", () => {
  it("accepts a valid version 1.0 file", () => {
    expect(validatePixelVeeFile(validV10())).toEqual({ valid: true })
  })

  it("accepts a valid version 1.1 file with numbered vectors", () => {
    expect(validatePixelVeeFile(validV11())).toEqual({ valid: true })
  })

  it("accepts v1.1 with an empty vectors object", () => {
    const data = validV11()
    data.vectors = {}
    expect(validatePixelVeeFile(data)).toEqual({ valid: true })
  })
})

// ─── Missing required fields ───────────────────────────────────────────────────

describe("validatePixelVeeFile — missing required fields", () => {
  it("rejects when metadata is absent", () => {
    const data = validV10()
    delete data.metadata
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("metadata")
  })

  it("rejects when metadata.version is absent", () => {
    const data = validV10()
    delete data.metadata.version
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("metadata.version")
  })

  it("rejects when metadata.timestamp is absent", () => {
    const data = validV10()
    delete data.metadata.timestamp
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("metadata.timestamp")
  })

  it("rejects when layers is absent", () => {
    const data = validV10()
    delete data.layers
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("layers")
  })

  it("rejects when history is absent", () => {
    const data = validV10()
    delete data.history
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("history")
  })

  it("rejects v1.1 when vectors is absent", () => {
    const data = validV11()
    delete data.vectors
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("vectors")
  })
})

// ─── Invalid field values ──────────────────────────────────────────────────────

describe("validatePixelVeeFile — invalid field values", () => {
  it("rejects an unknown version string", () => {
    const data = validV10()
    data.metadata.version = "2.0"
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("metadata.version")
  })

  it("rejects when application name is wrong", () => {
    const data = validV10()
    data.metadata.application = "Other App"
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("metadata.application")
  })

  it("rejects when application is absent", () => {
    const data = validV10()
    delete data.metadata.application
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("metadata.application")
  })

  it("rejects when layers is not an array", () => {
    const data = validV10()
    data.layers = {}
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("layers")
  })

  it("rejects when history is not an array", () => {
    const data = validV10()
    data.history = "not an array"
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("history")
  })

  it("rejects v1.1 vectors with non-numeric keys", () => {
    const data = validV11()
    data.vectors = { a: {}, b: {} }
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("vectors")
  })
})

// ─── Multiple errors ───────────────────────────────────────────────────────────

describe("validatePixelVeeFile — multiple errors", () => {
  it("reports all errors in a single validation pass", () => {
    const data = validV10()
    delete data.layers
    delete data.history
    const result = validatePixelVeeFile(data)
    expect(result.valid).toBe(false)
    expect(result.message).toContain("layers")
    expect(result.message).toContain("history")
  })
})
