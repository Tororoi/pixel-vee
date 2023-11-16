import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"
import { drawControlPointHandle } from "../utils/guiHelpers.js"

/**
 * @param {Object} vectorProperties
 */
export function renderCurveVector(vectorProperties) {
  const { px1, py1, px2, py2, px3, py3, px4, py4 } = vectorProperties
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + px1 + 0.5,
    canvas.yOffset + py1 + 0.5
  )

  if (px4 !== null) {
    canvas.vectorGuiCTX.bezierCurveTo(
      canvas.xOffset + px3 + 0.5,
      canvas.yOffset + py3 + 0.5,
      canvas.xOffset + px4 + 0.5,
      canvas.yOffset + py4 + 0.5,
      canvas.xOffset + px2 + 0.5,
      canvas.yOffset + py2 + 0.5
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()
    // canvas.vectorGuiCTX.clearRect(
    //   canvas.xOffset,
    //   canvas.yOffset,
    //   canvas.offScreenCVS.width,
    //   canvas.offScreenCVS.height
    // )
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset + px1 + 0.5,
      canvas.yOffset + py1 + 0.5
    )
    drawControlPointHandle(canvas, px1, py1, px3, py3)
    drawControlPointHandle(canvas, px2, py2, px4, py4)
  } else if (px3 !== null) {
    canvas.vectorGuiCTX.quadraticCurveTo(
      canvas.xOffset + px3 + 0.5,
      canvas.yOffset + py3 + 0.5,
      canvas.xOffset + px2 + 0.5,
      canvas.yOffset + py2 + 0.5
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()
    // canvas.vectorGuiCTX.clearRect(
    //   canvas.xOffset,
    //   canvas.yOffset,
    //   canvas.offScreenCVS.width,
    //   canvas.offScreenCVS.height
    // )
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset + px1 + 0.5,
      canvas.yOffset + py1 + 0.5
    )
    drawControlPointHandle(canvas, px1, py1, px3, py3)
  } else if (px2 !== null) {
    canvas.vectorGuiCTX.lineTo(
      canvas.xOffset + px2 + 0.5,
      canvas.yOffset + py2 + 0.5
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()
    // canvas.vectorGuiCTX.clearRect(
    //   canvas.xOffset,
    //   canvas.yOffset,
    //   canvas.offScreenCVS.width,
    //   canvas.offScreenCVS.height
    // )
  }

  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  //set point radius for detection in state
  let pointsKeys = [
    { x: "px1", y: "py1" },
    { x: "px2", y: "py2" },
    { x: "px3", y: "py3" },
    { x: "px4", y: "py4" },
  ]

  vectorGui.drawControlPoints(vectorProperties, pointsKeys, circleRadius, false)

  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  vectorGui.drawControlPoints(
    vectorProperties,
    pointsKeys,
    circleRadius / 2,
    true
  )
  // Fill points
  canvas.vectorGuiCTX.fill()
}
