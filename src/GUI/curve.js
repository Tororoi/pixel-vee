import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"
import { drawControlPointHandle } from "../utils/guiHelpers.js"

/**
 * @param {Object} vectorProperties
 * @param {Boolean} selected
 */
export function renderCurveVector(vectorProperties, selected, action) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  let circleRadius = 8 * lineWidth
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + px1 + 0.5,
    canvas.yOffset + py1 + 0.5
  )

  if (Number.isInteger(px4)) {
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset + px1 + 0.5,
      canvas.yOffset + py1 + 0.5
    )
    drawControlPointHandle(canvas, px1, py1, px3, py3)
    drawControlPointHandle(canvas, px2, py2, px4, py4)
  } else if (Number.isInteger(px3)) {
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset + px1 + 0.5,
      canvas.yOffset + py1 + 0.5
    )
    drawControlPointHandle(canvas, px1, py1, px3, py3)
  }

  //set point radius for detection in state
  let pointsKeys = [
    { x: "px1", y: "py1" },
    { x: "px2", y: "py2" },
    { x: "px3", y: "py3" },
    { x: "px4", y: "py4" },
  ]

  if (selected) {
    vectorGui.drawControlPoints(
      vectorProperties,
      pointsKeys,
      circleRadius,
      false
    )
  }

  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  vectorGui.drawControlPoints(
    vectorProperties,
    pointsKeys,
    circleRadius / 2,
    true, // modify
    0,
    selected,
    action
  )
  // Fill points
  canvas.vectorGuiCTX.fill()
}

export function renderCurvePath(vectorProperties) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + px1 + 0.5,
    canvas.yOffset + py1 + 0.5
  )

  if (Number.isInteger(px4)) {
    canvas.vectorGuiCTX.bezierCurveTo(
      canvas.xOffset + px3 + 0.5,
      canvas.yOffset + py3 + 0.5,
      canvas.xOffset + px4 + 0.5,
      canvas.yOffset + py4 + 0.5,
      canvas.xOffset + px2 + 0.5,
      canvas.yOffset + py2 + 0.5
    )
  } else if (Number.isInteger(px3)) {
    canvas.vectorGuiCTX.quadraticCurveTo(
      canvas.xOffset + px3 + 0.5,
      canvas.yOffset + py3 + 0.5,
      canvas.xOffset + px2 + 0.5,
      canvas.yOffset + py2 + 0.5
    )
  } else if (Number.isInteger(px2)) {
    canvas.vectorGuiCTX.lineTo(
      canvas.xOffset + px2 + 0.5,
      canvas.yOffset + py2 + 0.5
    )
  }
  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()
  // Clear strokes from drawing area
  canvas.vectorGuiCTX.clearRect(
    canvas.xOffset,
    canvas.yOffset,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
}
