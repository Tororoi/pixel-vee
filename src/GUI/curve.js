import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { drawControlPointHandle } from "../utils/guiHelpers.js"

/**
 * @param {Object} vectorGui
 */
export function renderCurveVector(vectorGui) {
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + state.vectorProperties.px1 + 0.5,
    canvas.yOffset + state.vectorProperties.py1 + 0.5
  )

  if (state.vectorProperties.px4 !== null) {
    canvas.vectorGuiCTX.bezierCurveTo(
      canvas.xOffset + state.vectorProperties.px3 + 0.5,
      canvas.yOffset + state.vectorProperties.py3 + 0.5,
      canvas.xOffset + state.vectorProperties.px4 + 0.5,
      canvas.yOffset + state.vectorProperties.py4 + 0.5,
      canvas.xOffset + state.vectorProperties.px2 + 0.5,
      canvas.yOffset + state.vectorProperties.py2 + 0.5
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()
    canvas.vectorGuiCTX.clearRect(
      canvas.xOffset,
      canvas.yOffset,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height
    )
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset + state.vectorProperties.px1 + 0.5,
      canvas.yOffset + state.vectorProperties.py1 + 0.5
    )
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px3,
      state.vectorProperties.py3
    )
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px2,
      state.vectorProperties.py2,
      state.vectorProperties.px4,
      state.vectorProperties.py4
    )
  } else if (state.vectorProperties.px3 !== null) {
    canvas.vectorGuiCTX.quadraticCurveTo(
      canvas.xOffset + state.vectorProperties.px3 + 0.5,
      canvas.yOffset + state.vectorProperties.py3 + 0.5,
      canvas.xOffset + state.vectorProperties.px2 + 0.5,
      canvas.yOffset + state.vectorProperties.py2 + 0.5
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()
    canvas.vectorGuiCTX.clearRect(
      canvas.xOffset,
      canvas.yOffset,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height
    )
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset + state.vectorProperties.px1 + 0.5,
      canvas.yOffset + state.vectorProperties.py1 + 0.5
    )
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px3,
      state.vectorProperties.py3
    )
  } else if (state.vectorProperties.px2 !== null) {
    canvas.vectorGuiCTX.lineTo(
      canvas.xOffset + state.vectorProperties.px2 + 0.5,
      canvas.yOffset + state.vectorProperties.py2 + 0.5
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()
    canvas.vectorGuiCTX.clearRect(
      canvas.xOffset,
      canvas.yOffset,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height
    )
  }

  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  //set point radius for detection in state
  let pointsKeys = [
    { x: "px1", y: "py1" },
    { x: "px2", y: "py2" },
    { x: "px3", y: "py3" },
    { x: "px4", y: "py4" },
  ]

  vectorGui.drawControlPoints(
    state.vectorProperties,
    pointsKeys,
    circleRadius,
    false
  )

  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  vectorGui.drawControlPoints(
    state.vectorProperties,
    pointsKeys,
    circleRadius / 2,
    true
  )
  // Fill points
  canvas.vectorGuiCTX.fill()
}
