import { canvas } from '../Context/canvas.js'
import { vectorGui } from './vector.js'
import {
  drawControlPointHandle,
  getGuiLineWidth,
  doubleStroke,
} from '../utils/guiHelpers.js'
import {
  getRenderXOffset,
  getRenderYOffset,
} from '../utils/coordinateHelpers.js'

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderVector(vectorProperties, vector) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  const lineWidth = getGuiLineWidth()
  let circleRadius = 20 * lineWidth
  const cubicCurveActive = vector?.modes.cubicCurve || !vector
  const quadCurveActive = vector?.modes.quadCurve || !vector

  if (cubicCurveActive && Number.isInteger(px4)) {
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px3, py3)
    drawControlPointHandle(canvas, xOffset, yOffset, px2, py2, px4, py4)
  } else if ((cubicCurveActive || quadCurveActive) && Number.isInteger(px3)) {
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px3, py3)
  }

  let pointsKeys = [
    { x: 'px1', y: 'py1' },
    { x: 'px2', y: 'py2' },
    { x: 'px3', y: 'py3' },
    { x: 'px4', y: 'py4' },
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
    true, // modify
    vector,
  )
}

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderVectorPath(vectorProperties, vector) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  const lineWidth = getGuiLineWidth()

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)
  const cubicCurveActive = vector?.modes.cubicCurve || !vector
  const quadCurveActive = vector?.modes.quadCurve || !vector

  if (cubicCurveActive && Number.isInteger(px4)) {
    canvas.vectorGuiCTX.bezierCurveTo(
      xOffset + px3 + 0.5,
      yOffset + py3 + 0.5,
      xOffset + px4 + 0.5,
      yOffset + py4 + 0.5,
      xOffset + px2 + 0.5,
      yOffset + py2 + 0.5,
    )
  } else if ((cubicCurveActive || quadCurveActive) && Number.isInteger(px3)) {
    canvas.vectorGuiCTX.quadraticCurveTo(
      xOffset + px3 + 0.5,
      yOffset + py3 + 0.5,
      xOffset + px2 + 0.5,
      yOffset + py2 + 0.5,
    )
  } else if (Number.isInteger(px2)) {
    canvas.vectorGuiCTX.lineTo(xOffset + px2 + 0.5, yOffset + py2 + 0.5)
  } else {
    return
  }
  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderCurveVector(vectorProperties, vector) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  const lineWidth = getGuiLineWidth()
  let circleRadius = 20 * lineWidth

  if (Number.isInteger(px4)) {
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px3, py3)
    drawControlPointHandle(canvas, xOffset, yOffset, px2, py2, px4, py4)
  } else if (Number.isInteger(px3)) {
    drawControlPointHandle(canvas, xOffset, yOffset, px1, py1, px3, py3)
  }

  let pointsKeys = [
    { x: 'px1', y: 'py1' },
    { x: 'px2', y: 'py2' },
    { x: 'px3', y: 'py3' },
    { x: 'px4', y: 'py4' },
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
    true, // modify
    vector,
  )
}

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} vector - The vector to be rendered
 */
export function renderCurvePath(vectorProperties, vector) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  const xOffset = getRenderXOffset(vector)
  const yOffset = getRenderYOffset(vector)
  const lineWidth = getGuiLineWidth()

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(xOffset + px1 + 0.5, yOffset + py1 + 0.5)

  if (Number.isInteger(px4)) {
    canvas.vectorGuiCTX.bezierCurveTo(
      xOffset + px3 + 0.5,
      yOffset + py3 + 0.5,
      xOffset + px4 + 0.5,
      yOffset + py4 + 0.5,
      xOffset + px2 + 0.5,
      yOffset + py2 + 0.5,
    )
  } else if (Number.isInteger(px3)) {
    canvas.vectorGuiCTX.quadraticCurveTo(
      xOffset + px3 + 0.5,
      yOffset + py3 + 0.5,
      xOffset + px2 + 0.5,
      yOffset + py2 + 0.5,
    )
  } else if (Number.isInteger(px2)) {
    canvas.vectorGuiCTX.lineTo(xOffset + px2 + 0.5, yOffset + py2 + 0.5)
  } else {
    return
  }
  doubleStroke(canvas.vectorGuiCTX, lineWidth, 'black', 'white')
}
