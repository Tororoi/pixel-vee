import { canvas } from '../context/canvas.js'
import { vectorGui } from './vector.js'
import { getGuiLineWidth, doubleStroke } from '../utils/guiHelpers.js'
import {
  getRenderXOffset,
  getRenderYOffset,
} from '../utils/coordinateHelpers.js'

/**
 * Renders the GUI control-point overlay for a polygon vector, drawing both
 * the four corner handles (px1–px4) and the center handle (px0). When no
 * active vector is supplied the inactive (unselected) style is painted
 * first so the active layer renders on top with visible contrast; this
 * underlay is skipped when a vector is present because the selection state
 * already differentiates those handles visually.
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderPolygonVector(vectorProperties, vector) {
  const cornerKeys = [
    { x: 'px1', y: 'py1' },
    { x: 'px2', y: 'py2' },
    { x: 'px3', y: 'py3' },
    { x: 'px4', y: 'py4' },
  ]
  const centerKeys = [{ x: 'px0', y: 'py0' }]

  // Paint inactive handles beneath the active ones so they remain
  // legible against any canvas background.
  if (!vector) {
    vectorGui.drawControlPoints(vectorProperties, cornerKeys, false)
    vectorGui.drawControlPoints(vectorProperties, centerKeys, false)
  }

  vectorGui.drawControlPoints(vectorProperties, cornerKeys, true, vector)
  vectorGui.drawControlPoints(vectorProperties, centerKeys, true, vector)
}

/**
 * Draws the four-sided polygon outline on the vector GUI canvas, connecting
 * px1→px2→px3→px4 and closing the path back to px1. Returns early when
 * px3 is not yet an integer, guarding against rendering an incomplete
 * polygon while the user is still placing the first two vertices. Each
 * coordinate is offset by 0.5 to align integer pixel-art coords with
 * canvas pixel centres, keeping 1 px strokes crisp on an unscaled context.
 * A double stroke (black over white) ensures the outline reads on any
 * background color.
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderPolygonPath(vectorProperties, vector) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  // Third vertex hasn't been placed yet; nothing to draw.
  if (!Number.isInteger(px3)) return
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  const lineWidth = getGuiLineWidth()

  canvas.vectorGuiCTX.beginPath()
  // +0.5 shifts integer coords to pixel centres for crisp 1px lines.
  canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)
  canvas.vectorGuiCTX.lineTo(xOffset + px2 + 0.5, yOffset + py2 + 0.5)
  canvas.vectorGuiCTX.lineTo(xOffset + px3 + 0.5, yOffset + py3 + 0.5)
  canvas.vectorGuiCTX.lineTo(xOffset + px4 + 0.5, yOffset + py4 + 0.5)
  canvas.vectorGuiCTX.closePath()
  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}
