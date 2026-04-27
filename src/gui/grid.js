import { canvas } from '../context/canvas.js'
import { getGridLineWidth, doubleStroke } from '../utils/guiHelpers.js'

/**
 * Renders a per-pixel grid and an optional coarser sub-grid overlay onto
 * the vector GUI canvas. Only the viewport-visible region is drawn to
 * keep the path instruction count proportional to visible pixels rather
 * than the full canvas size — otherwise performance degrades badly at
 * large canvas dimensions. A subGridSpacing of 1 is silently normalized
 * to null because it would place lines at every pixel, duplicating the
 * base grid. Both grid passes use a double-stroke (dark then light) so
 * the lines remain legible against any background color. Consider
 * rendering this on a dedicated canvas layer that only redraws on
 * zoom/pan changes to avoid redundant repaints.
 * @param {number|null} subGridSpacing - Pixel interval for the coarser
 *   overlay grid. Pass null or 1 to suppress the sub-grid.
 */
export function renderGrid(subGridSpacing = null) {
  // Spacing of 1 would overlap the base pixel grid exactly; normalize it
  // so callers don't need to guard against this edge case themselves.
  if (subGridSpacing === 1) {
    subGridSpacing = null
  }
  // Compute how many canvas-space pixels fit in the visible viewport so
  // only on-screen grid lines are stroked.
  // TODO: (Low Priority) consider making these global properties as they
  // may be useful for limiting other rendering functions or anything that
  // iterates over the canvas while drawing.
  let xLarge = Math.ceil(
    canvas.layers[0].onscreenCvs.width / canvas.sharpness / canvas.zoom,
  )
  let yLarge = Math.ceil(
    canvas.layers[0].onscreenCvs.height / canvas.sharpness / canvas.zoom,
  )
  // A negative offset means the canvas origin is scrolled off-screen to
  // the left/top, so the first visible canvas column/row is at the
  // absolute value of that offset. Clamp xMax/yMax to the canvas edge so
  // we never stroke beyond the actual pixel content.
  let xMin = canvas.xOffset < 0 ? -canvas.xOffset : 0
  let xMax = Math.min(xMin + xLarge, canvas.offScreenCVS.width)
  let yMin = canvas.yOffset < 0 ? -canvas.yOffset : 0
  let yMax = Math.min(yMin + yLarge, canvas.offScreenCVS.height)

  const lineWidth = getGridLineWidth()
  canvas.vectorGuiCTX.beginPath()
  for (let i = xMin; i <= xMax; i++) {
    canvas.vectorGuiCTX.moveTo(canvas.xOffset + i, canvas.yOffset + yMin)
    canvas.vectorGuiCTX.lineTo(canvas.xOffset + i, canvas.yOffset + yMax)
  }
  for (let j = yMin; j <= yMax; j++) {
    canvas.vectorGuiCTX.moveTo(canvas.xOffset + xMin, canvas.yOffset + j)
    canvas.vectorGuiCTX.lineTo(canvas.xOffset + xMax, canvas.yOffset + j)
  }
  doubleStroke(
    canvas.vectorGuiCTX,
    lineWidth,
    'rgba(0,0,0,0.3)',
    'rgba(255,255,255,0.5)',
  )
  if (subGridSpacing) {
    // Snap xMin/yMin to the nearest lower spacing-aligned pixel so
    // sub-grid lines stay anchored to fixed canvas coordinates rather
    // than shifting with the viewport as the user pans.
    xMin -= xMin % subGridSpacing
    yMin -= yMin % subGridSpacing
    canvas.vectorGuiCTX.beginPath()
    for (let i = xMin; i <= xMax; i += subGridSpacing) {
      canvas.vectorGuiCTX.moveTo(canvas.xOffset + i, canvas.yOffset + yMin)
      canvas.vectorGuiCTX.lineTo(canvas.xOffset + i, canvas.yOffset + yMax)
    }
    for (let j = yMin; j <= yMax; j += subGridSpacing) {
      canvas.vectorGuiCTX.moveTo(canvas.xOffset + xMin, canvas.yOffset + j)
      canvas.vectorGuiCTX.lineTo(canvas.xOffset + xMax, canvas.yOffset + j)
    }
    // Heavier weight makes the sub-grid visually distinct from the
    // per-pixel base grid without changing its color.
    doubleStroke(
      canvas.vectorGuiCTX,
      lineWidth * 1.5,
      'rgba(0,0,0,0.3)',
      'rgba(255,255,255,0.5)',
    )
  }
}
