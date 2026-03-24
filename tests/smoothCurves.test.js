import { describe, it, expect } from 'vitest'
import {
  rdpSimplify,
  catmullRomToBeziers,
  fitSmoothedCurve,
} from '../src/utils/smoothCurves.js'

describe('rdpSimplify', () => {
  it('passes through a 2-point input unchanged', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }]
    expect(rdpSimplify(pts)).toEqual(pts)
  })

  it('collapses 3 co-linear points to 2', () => {
    const pts = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }]
    const result = rdpSimplify(pts, 0.5)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ x: 0, y: 0 })
    expect(result[result.length - 1]).toEqual({ x: 10, y: 0 })
  })

  it('preserves a corner point in an L-shape', () => {
    // right then down — corner at (10, 0)
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]
    const result = rdpSimplify(pts, 0.5)
    expect(result).toHaveLength(3)
    expect(result[1]).toEqual({ x: 10, y: 0 })
  })

  it('returns only start and end when all middle points are within epsilon', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 5, y: 0.1 }, // tiny deviation
      { x: 10, y: 0 },
    ]
    const result = rdpSimplify(pts, 1.0)
    expect(result).toHaveLength(2)
  })

  it('returns a single point array unchanged', () => {
    const pts = [{ x: 3, y: 4 }]
    expect(rdpSimplify(pts)).toEqual(pts)
  })
})

describe('catmullRomToBeziers', () => {
  it('returns empty array for fewer than 2 key points', () => {
    expect(catmullRomToBeziers([])).toEqual([])
    expect(catmullRomToBeziers([{ x: 0, y: 0 }])).toEqual([])
  })

  it('2 key points returns 1 segment', () => {
    const result = catmullRomToBeziers([{ x: 0, y: 0 }, { x: 10, y: 0 }])
    expect(result).toHaveLength(1)
  })

  it('3 key points returns 2 segments', () => {
    const result = catmullRomToBeziers([
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 0 },
    ])
    expect(result).toHaveLength(2)
  })

  it('segment x0/y0 and x1/y1 match key point positions', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }]
    const segs = catmullRomToBeziers(pts)
    expect(segs[0].x0).toBe(0)
    expect(segs[0].y0).toBe(0)
    expect(segs[0].x1).toBe(10)
    expect(segs[1].x0).toBe(10)
    expect(segs[1].x1).toBe(20)
  })

  it('segment chain continuity: x1/y1 of seg[i] equals x0/y0 of seg[i+1]', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 0 },
      { x: 15, y: 5 },
    ]
    const segs = catmullRomToBeziers(pts)
    for (let i = 0; i < segs.length - 1; i++) {
      expect(segs[i].x1).toBeCloseTo(segs[i + 1].x0)
      expect(segs[i].y1).toBeCloseTo(segs[i + 1].y0)
    }
  })

  it('horizontal straight line has control point lying on the line', () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }]
    const [seg] = catmullRomToBeziers(pts)
    expect(seg.cpy).toBeCloseTo(0)
    expect(seg.cpx).toBeGreaterThan(0)
    expect(seg.cpx).toBeLessThan(10)
  })
})

describe('fitSmoothedCurve', () => {
  it('returns empty for empty input', () => {
    expect(fitSmoothedCurve([])).toEqual([])
  })

  it('returns empty for single point', () => {
    expect(fitSmoothedCurve([{ x: 5, y: 5 }])).toEqual([])
  })

  it('2 distinct points returns 1 segment', () => {
    const result = fitSmoothedCurve([{ x: 0, y: 0 }, { x: 10, y: 0 }])
    expect(result).toHaveLength(1)
  })

  it('deduplicates consecutive identical points before fitting', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 0, y: 0 }, // duplicate
      { x: 0, y: 0 }, // duplicate
      { x: 10, y: 0 },
    ]
    const result = fitSmoothedCurve(pts)
    expect(result).toHaveLength(1)
  })

  it('all duplicates (single unique point) returns empty', () => {
    const pts = [{ x: 3, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 3 }]
    expect(fitSmoothedCurve(pts)).toEqual([])
  })

  it('a right-angle path produces control points that differ from endpoints', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ]
    const segs = fitSmoothedCurve(pts, 0.1) // low epsilon preserves corner
    expect(segs.length).toBeGreaterThan(0)
    // Control point should differ from both segment endpoints
    const seg = segs[0]
    const cpAtStart = seg.cpx === seg.x0 && seg.cpy === seg.y0
    const cpAtEnd = seg.cpx === seg.x1 && seg.cpy === seg.y1
    expect(cpAtStart && cpAtEnd).toBe(false)
  })
})
