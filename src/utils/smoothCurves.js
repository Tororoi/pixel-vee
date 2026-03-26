/**
 * Perpendicular distance from point P to segment AB.
 * If A === B, returns Euclidean distance from A to P.
 * @param {{x:number,y:number}} p
 * @param {{x:number,y:number}} a
 * @param {{x:number,y:number}} b
 * @returns {number}
 */
function perpendicularDistance(p, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  if (dx === 0 && dy === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y)
  }
  return (
    Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / Math.hypot(dx, dy)
  )
}

/**
 * Ramer-Douglas-Peucker polyline simplification.
 * Reduces a point array to only the key shape points within epsilon tolerance.
 * Fewer key points → fewer bezier segments downstream.
 * @param {Array<{x:number,y:number}>} points
 * @param {number} [epsilon] - distance threshold in pixels
 * @returns {Array<{x:number,y:number}>}
 */
export function rdpSimplify(points, epsilon = 2.0) {
  if (points.length < 3) return points.slice()

  let maxDist = 0
  let maxIndex = 0
  const first = points[0]
  const last = points[points.length - 1]

  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last)
    if (d > maxDist) {
      maxDist = d
      maxIndex = i
    }
  }

  if (maxDist > epsilon) {
    const left = rdpSimplify(points.slice(0, maxIndex + 1), epsilon)
    const right = rdpSimplify(points.slice(maxIndex), epsilon)
    return [...left.slice(0, -1), ...right]
  }
  return [first, last]
}

/**
 * Convert a sequence of key points to Catmull-Rom cubic bezier segments.
 * Produces C1-continuous smooth curves through all key points.
 * Phantom endpoint extrapolation handles boundary conditions so the curve
 * starts/ends tangent to the first/last segment direction.
 * @param {Array<{x:number,y:number}>} keyPoints
 * @param {number} [tension] - controls the "tightness" of the curve
 * @returns {Array<{x0:number,y0:number,cp1x:number,cp1y:number,cp2x:number,cp2y:number,x1:number,y1:number}>}
 */
export function catmullRomToBeziers(keyPoints, tension = 10) {
  const n = keyPoints.length
  if (n < 2) return []

  // Phantom points: extrapolate tangent at start and end
  const phantomStart = {
    x: 2 * keyPoints[0].x - keyPoints[1].x,
    y: 2 * keyPoints[0].y - keyPoints[1].y,
  }
  const phantomEnd = {
    x: 2 * keyPoints[n - 1].x - keyPoints[n - 2].x,
    y: 2 * keyPoints[n - 1].y - keyPoints[n - 2].y,
  }

  const segments = []
  for (let i = 0; i < n - 1; i++) {
    const pPrev = i === 0 ? phantomStart : keyPoints[i - 1]
    const pCurr = keyPoints[i]
    const pNext = keyPoints[i + 1]
    const pAfter = i === n - 2 ? phantomEnd : keyPoints[i + 2]

    segments.push({
      x0: pCurr.x,
      y0: pCurr.y,
      cp1x: pCurr.x + (pNext.x - pPrev.x) / tension,
      cp1y: pCurr.y + (pNext.y - pPrev.y) / tension,
      cp2x: pNext.x - (pAfter.x - pCurr.x) / tension,
      cp2y: pNext.y - (pAfter.y - pCurr.y) / tension,
      x1: pNext.x,
      y1: pNext.y,
    })
  }
  return segments
}

/**
 * Assign chord-length t-values in [0,1] to each point.
 * @param {Array<{x:number,y:number}>} points - input point array
 * @returns {number[]} normalized cumulative chord-length parameters
 */
function chordLengthParameterize(points) {
  const d = [0]
  for (let i = 1; i < points.length; i++) {
    d.push(d[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y))
  }
  const total = d[d.length - 1]
  return total > 0 ? d.map(v => v / total) : d.map((_, i) => i / (points.length - 1))
}

/**
 * Evaluate a cubic bezier segment at parameter t.
 * @param {{x0:number,y0:number,cp1x:number,cp1y:number,cp2x:number,cp2y:number,x1:number,y1:number}} seg - bezier descriptor
 * @param {number} t - parameter in [0,1]
 * @returns {{x:number,y:number}} point on the curve
 */
function evalBezier(seg, t) {
  const mt = 1 - t
  return {
    x: mt*mt*mt * seg.x0 + 3*mt*mt*t * seg.cp1x + 3*mt*t*t * seg.cp2x + t*t*t * seg.x1,
    y: mt*mt*mt * seg.y0 + 3*mt*mt*t * seg.cp1y + 3*mt*t*t * seg.cp2y + t*t*t * seg.y1,
  }
}

/**
 * Fit a single cubic bezier to a set of points via least-squares.
 * The first and last points are fixed as the bezier endpoints.
 * The two interior control points are solved analytically from a 2×2 linear system.
 * @param {Array<{x:number,y:number}>} points - input point array
 * @param {number[]} tVals - chord-length parameters for each point
 * @returns {{x0:number,y0:number,cp1x:number,cp1y:number,cp2x:number,cp2y:number,x1:number,y1:number}} bezier segment
 */
function fitCubicToPoints(points, tVals) {
  const p0 = points[0]
  const p3 = points[points.length - 1]

  if (points.length === 2) {
    return {
      x0: p0.x, y0: p0.y,
      cp1x: p0.x + (p3.x - p0.x) / 3, cp1y: p0.y + (p3.y - p0.y) / 3,
      cp2x: p0.x + 2 * (p3.x - p0.x) / 3, cp2y: p0.y + 2 * (p3.y - p0.y) / 3,
      x1: p3.x, y1: p3.y,
    }
  }

  // Basis functions for the two free control points:
  // B1(t) = 3(1-t)²t,  B2(t) = 3(1-t)t²
  // Fixed contributions: B0(t) = (1-t)³ * p0,  B3(t) = t³ * p3
  let A00 = 0, A01 = 0, A11 = 0
  let bx0 = 0, bx1 = 0, by0 = 0, by1 = 0

  for (let i = 0; i < points.length; i++) {
    const t = tVals[i], mt = 1 - t
    const b1 = 3 * mt * mt * t
    const b2 = 3 * mt * t * t
    A00 += b1 * b1;  A01 += b1 * b2;  A11 += b2 * b2
    const px = points[i].x - mt*mt*mt * p0.x - t*t*t * p3.x
    const py = points[i].y - mt*mt*mt * p0.y - t*t*t * p3.y
    bx0 += b1 * px;  bx1 += b2 * px
    by0 += b1 * py;  by1 += b2 * py
  }

  const det = A00 * A11 - A01 * A01
  if (Math.abs(det) < 1e-10) {
    // Degenerate (all points collinear / identical t-values) — straight line
    return {
      x0: p0.x, y0: p0.y,
      cp1x: p0.x + (p3.x - p0.x) / 3, cp1y: p0.y + (p3.y - p0.y) / 3,
      cp2x: p0.x + 2 * (p3.x - p0.x) / 3, cp2y: p0.y + 2 * (p3.y - p0.y) / 3,
      x1: p3.x, y1: p3.y,
    }
  }

  return {
    x0: p0.x, y0: p0.y,
    cp1x: (bx0 * A11 - bx1 * A01) / det,
    cp1y: (by0 * A11 - by1 * A01) / det,
    cp2x: (A00 * bx1 - A01 * bx0) / det,
    cp2y: (A00 * by1 - A01 * by0) / det,
    x1: p3.x, y1: p3.y,
  }
}

/**
 * Schneider's curve-fitting algorithm (recursive).
 * Fits a single cubic bezier to the point set. If the worst-case error exceeds
 * epsilon, splits at that point and recurses on each half. This finds the fewest
 * bezier segments that approximate the path within the given tolerance, treating
 * the full stroke as one smooth shape rather than a series of per-point corners.
 * @param {Array<{x:number,y:number}>} points - input point array
 * @param {number} epsilon - max allowed distance from any input point to the curve
 * @returns {Array<{x0:number,y0:number,cp1x:number,cp1y:number,cp2x:number,cp2y:number,x1:number,y1:number}>} fitted bezier segments
 */
function fitCurveRecursive(points, epsilon) {
  const tVals = chordLengthParameterize(points)
  const seg = fitCubicToPoints(points, tVals)
  if (points.length <= 2) return [seg]

  let maxErr = 0, splitIdx = 1
  for (let i = 1; i < points.length - 1; i++) {
    const pt = evalBezier(seg, tVals[i])
    const err = Math.hypot(points[i].x - pt.x, points[i].y - pt.y)
    if (err > maxErr) { maxErr = err; splitIdx = i }
  }

  if (maxErr <= epsilon) return [seg]

  return [
    ...fitCurveRecursive(points.slice(0, splitIdx + 1), epsilon),
    ...fitCurveRecursive(points.slice(splitIdx), epsilon),
  ]
}

/**
 * Fit cubic bezier segments to a freehand cursor path using Schneider's algorithm.
 * Treats the full stroke as one shape to fit rather than smoothing point-by-point,
 * producing flowing arcs instead of rounded corners.
 * A single arc stroke → one bezier segment. More complex paths split only where needed.
 * @param {Array<{x:number,y:number}>} rawPoints - raw cursor positions
 * @param {number} [epsilon] - max pixel distance from any input point to the fitted curve
 * @param {number} [minDist] - pre-filter: drop points closer than this to their predecessor
 * @returns {Array<{x0:number,y0:number,cp1x:number,cp1y:number,cp2x:number,cp2y:number,x1:number,y1:number}>} fitted bezier segments
 */
export function curveFromPoints(rawPoints, epsilon = 2, minDist = 0) {
  if (rawPoints.length < 2) return []

  // Deduplicate consecutive identical positions
  const deduped = [rawPoints[0]]
  for (let i = 1; i < rawPoints.length; i++) {
    const prev = deduped[deduped.length - 1]
    if (rawPoints[i].x !== prev.x || rawPoints[i].y !== prev.y) deduped.push(rawPoints[i])
  }
  if (deduped.length < 2) return []

  // Optional pre-filter: remove points too close to their predecessor to reduce
  // noise from slow drawing, while always keeping the final endpoint.
  let pts = deduped
  if (minDist > 0) {
    pts = [deduped[0]]
    for (let i = 1; i < deduped.length - 1; i++) {
      const prev = pts[pts.length - 1]
      if (Math.hypot(deduped[i].x - prev.x, deduped[i].y - prev.y) >= minDist) {
        pts.push(deduped[i])
      }
    }
    pts.push(deduped[deduped.length - 1])
    if (pts.length < 2) return []
  }

  return fitCurveRecursive(pts, epsilon)
}

/**
 * Fit the fewest possible cubic bezier segments to a freehand cursor path.
 * Pipeline: deduplicate → RDP simplify → Catmull-Rom bezier fitting.
 *
 * Returns an empty array for degenerate inputs (< 2 distinct points).
 * When empty, the caller should draw a single dot at the first raw point.
 * @param {Array<{x:number,y:number}>} rawPoints - raw cursor positions
 * @param {number} [epsilon] - RDP tolerance in pixels
 * @param {number} [tension] - Catmull-Rom tension divisor
 * @returns {Array<{x0:number,y0:number,cp1x:number,cp1y:number,cp2x:number,cp2y:number,x1:number,y1:number}>} bezier segment descriptors
 */
export function fitSmoothedCurve(rawPoints, epsilon = 2.0, tension = 10) {
  if (rawPoints.length < 2) return []

  // Strip consecutive duplicate positions
  const deduped = [rawPoints[0]]
  for (let i = 1; i < rawPoints.length; i++) {
    const prev = deduped[deduped.length - 1]
    if (rawPoints[i].x !== prev.x || rawPoints[i].y !== prev.y) {
      deduped.push(rawPoints[i])
    }
  }

  if (deduped.length < 2) return []

  const keyPoints = rdpSimplify(deduped, epsilon)
  return catmullRomToBeziers(keyPoints, tension)
}
