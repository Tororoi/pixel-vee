import { describe, bench } from "vitest"
import {
  plotQuadBezier,
  plotCubicBezier,
  plotConicBezier,
} from "../../src/utils/bezier.js"

/**
 * bezier.js has no DOM dependencies — imports only from trig.js which is
 * pure math. We can import the real functions directly.
 *
 * Each exported function returns an array of { x, y } pixel coordinates after
 * deduplication via a string-keyed Set (same GC pattern as colorMask).
 *
 * Curve length in pixels drives iteration count, so we test:
 * - Short curves  (~50px span)
 * - Medium curves (~200px span)
 * - Long curves   (~500px span)
 */

// --- Quad bezier ---
// Geometry: (x0,y0) = start, (x1,y1) = control, (x2,y2) = end
// A smooth arc; no sign changes so it stays as one segment.

describe("plotQuadBezier — increasing curve length", () => {
  bench("short (~50px span)", () => {
    plotQuadBezier(0, 0, 25, 50, 50, 0)
  })

  bench("medium (~200px span)", () => {
    plotQuadBezier(0, 0, 100, 200, 200, 0)
  })

  bench("long (~500px span)", () => {
    plotQuadBezier(0, 0, 250, 500, 500, 0)
  })
})

// S-curve: sign change forces plotQuadBezier to split into two segments,
// doubling the number of plotQuadBezierSeg calls and the deduplication work.
describe("plotQuadBezier — S-curve (sign change, 2 segments)", () => {
  bench("medium S-curve", () => {
    plotQuadBezier(0, 100, 100, 0, 200, 100)
  })

  bench("long S-curve", () => {
    plotQuadBezier(0, 250, 250, 0, 500, 250)
  })
})

// --- Cubic bezier ---
// Four control points; the algorithm can produce more iterations per pixel
// than the quad variant and always runs two "legs".

describe("plotCubicBezier — increasing curve length", () => {
  bench("short (~50px span)", () => {
    plotCubicBezier(0, 0, 15, 40, 35, 40, 50, 0)
  })

  bench("medium (~200px span)", () => {
    plotCubicBezier(0, 0, 60, 160, 140, 160, 200, 0)
  })

  bench("long (~500px span)", () => {
    plotCubicBezier(0, 0, 150, 400, 350, 400, 500, 0)
  })
})

// S-shaped cubic: control points on opposite sides creates an inflection,
// which forces the algorithm through its most expensive branching path.
describe("plotCubicBezier — S-curve (inflection point)", () => {
  bench("medium S-curve", () => {
    plotCubicBezier(0, 0, 80, -80, 120, 160, 200, 80)
  })

  bench("long S-curve", () => {
    plotCubicBezier(0, 0, 200, -200, 300, 400, 500, 200)
  })
})

// Conic (rational quad) bezier — used for ellipse arcs.
// w=1 is a standard parabolic bezier; w<1 produces elliptic arcs.
// Uses the public plotConicBezier wrapper which handles arbitrary geometry
// (plotConicBezierSeg is an internal helper with strict input constraints).
describe("plotConicBezier — varying weight", () => {
  bench("w=1 (parabolic, medium span)", () => {
    plotConicBezier(0, 100, 100, 0, 200, 100, 1)
  })

  bench("w=0.7 (elliptic arc, medium span)", () => {
    plotConicBezier(0, 100, 100, 0, 200, 100, 0.7)
  })

  bench("w=0.7 (elliptic arc, long span)", () => {
    plotConicBezier(0, 250, 250, 0, 500, 250, 0.7)
  })
})
