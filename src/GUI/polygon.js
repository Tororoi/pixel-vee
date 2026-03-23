import { canvas } from '../Context/canvas.js'
import { vectorGui } from './vector.js'
import { getGuiLineWidth, doubleStroke } from '../utils/guiHelpers.js'

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderPolygonVector(vectorProperties, vector) {
  const lineWidth = getGuiLineWidth()
  const circleRadius = 20 * lineWidth

  const cornerKeys = [
    { x: 'px1', y: 'py1' },
    { x: 'px2', y: 'py2' },
    { x: 'px3', y: 'py3' },
    { x: 'px4', y: 'py4' },
  ]
  const centerKeys = [{ x: 'px0', y: 'py0' }]

  if (!vector) {
    vectorGui.drawControlPoints(
      vectorProperties,
      cornerKeys,
      circleRadius,
      false,
    )
    vectorGui.drawControlPoints(
      vectorProperties,
      centerKeys,
      circleRadius,
      false,
    )
  }

  vectorGui.drawControlPoints(
    vectorProperties,
    cornerKeys,
    circleRadius / 3,
    true,
    vector,
  )
  vectorGui.drawControlPoints(
    vectorProperties,
    centerKeys,
    circleRadius / 3,
    true,
    vector,
  )
}

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderPolygonPath(vectorProperties, vector) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  if (!Number.isInteger(px3)) return
  const xOffset = vector ? vector.layer.x + canvas.xOffset : canvas.xOffset
  const yOffset = vector ? vector.layer.y + canvas.yOffset : canvas.yOffset
  const lineWidth = getGuiLineWidth()

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)
  canvas.vectorGuiCTX.lineTo(xOffset + px2 + 0.5, yOffset + py2 + 0.5)
  canvas.vectorGuiCTX.lineTo(xOffset + px3 + 0.5, yOffset + py3 + 0.5)
  canvas.vectorGuiCTX.lineTo(xOffset + px4 + 0.5, yOffset + py4 + 0.5)
  canvas.vectorGuiCTX.closePath()
  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}
