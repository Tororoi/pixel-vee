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
 * Fit the fewest possible cubic bezier segments to a freehand cursor path.
 * Pipeline: deduplicate → RDP simplify → Catmull-Rom bezier fitting.
 *
 * Returns an empty array for degenerate inputs (< 2 distinct points).
 * When empty, the caller should draw a single dot at the first raw point.
 * @param {Array<{x:number,y:number}>} rawPoints - raw cursor positions
 * @param {number} [epsilon] - RDP tolerance in pixels
 * @param {number} [tension] - Catmull-Rom tension divisor
 * @returns {Array<{x0:number,y0:number,cp1x:number,cp1y:number,cp2x:number,cp2y:number,x1:number,y1:number}>}
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
