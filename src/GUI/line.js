import { canvas } from '../Context/canvas.js'
import { vectorGui } from './vector.js'
import { getGuiLineWidth, doubleStroke } from '../utils/guiHelpers.js'
import { getRenderXOffset, getRenderYOffset } from '../utils/coordinateHelpers.js'

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderLineVector(vectorProperties, vector) {
  let pointsKeys = [
    { x: 'px1', y: 'py1' },
    { x: 'px2', y: 'py2' },
  ]

  if (!vector) {
    vectorGui.drawControlPoints(vectorProperties, pointsKeys, false)
  }

  vectorGui.drawControlPoints(vectorProperties, pointsKeys, true, vector)
}

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderLinePath(vectorProperties, vector) {
  const { px1, py1, px2, py2 } = vectorProperties
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  // Setting of context attributes.
  const lineWidth = getGuiLineWidth()
  if (!Number.isInteger(px2)) return

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)
  canvas.vectorGuiCTX.lineTo(xOffset + px2 + 0.5, yOffset + py2 + 0.5)
  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}
