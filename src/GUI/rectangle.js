import { canvas } from '../Context/canvas.js'
import { vectorGui } from './vector.js'
import { getGuiLineWidth, doubleStroke } from '../utils/guiHelpers.js'

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderRectangleVector(vectorProperties, vector) {
  const lineWidth = getGuiLineWidth()
  const circleRadius = 20 * lineWidth

  const pointsKeys = [
    { x: 'px1', y: 'py1' },
    { x: 'px2', y: 'py2' },
  ]

  if (!vector) {
    vectorGui.drawControlPoints(
      vectorProperties,
      pointsKeys,
      circleRadius,
      false,
    )
  }

  vectorGui.drawControlPoints(
    vectorProperties,
    pointsKeys,
    circleRadius / 3,
    true,
    vector,
  )
}

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderRectanglePath(vectorProperties, vector) {
  const { px1, py1, px2, py2 } = vectorProperties
  if (!Number.isInteger(px2)) return
  const xOffset = vector ? vector.layer.x + canvas.xOffset : canvas.xOffset
  const yOffset = vector ? vector.layer.y + canvas.yOffset : canvas.yOffset
  const lineWidth = getGuiLineWidth()

  const xMin = Math.min(px1, px2)
  const yMin = Math.min(py1, py2)
  const w = Math.abs(px2 - px1) + 1
  const h = Math.abs(py2 - py1) + 1

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.rect(
    xOffset + xMin,
    yOffset + yMin,
    w,
    h,
  )
  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}
