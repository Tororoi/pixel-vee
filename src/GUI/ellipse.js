import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"
import { drawCirclePath, drawControlPointHandle } from "../utils/guiHelpers.js"

/**
 * @param {Object} vectorProperties
 * @param {String} color
 */
export function renderEllipseVector(vectorProperties, color = "white") {
  const {
    px1,
    py1,
    px2,
    py2,
    px3,
    py3,
    radA,
    radB,
    angle,
    x1Offset,
    y1Offset,
  } = vectorProperties
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = color
  canvas.vectorGuiCTX.fillStyle = color
  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  let pointsKeys = [
    { x: "px1", y: "py1" },
    { x: "px2", y: "py2" },
    { x: "px3", y: "py3" },
  ]

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + px1 + 0.5,
    canvas.yOffset + py1 + 0.5
  )

  if (px3 !== null) {
    canvas.vectorGuiCTX.ellipse(
      canvas.xOffset + px1 + 0.5,
      canvas.yOffset + py1 + 0.5,
      radA,
      radB,
      angle + 4 * Math.PI,
      0,
      angle + 2 * Math.PI
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
    drawControlPointHandle(canvas, px1, py1, px3, py3)
    drawControlPointHandle(canvas, px1, py1, px2, py2)
  } else if (px2 !== null) {
    drawCirclePath(canvas, px1 + x1Offset / 2, py1 + y1Offset / 2, radA)
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()
    canvas.vectorGuiCTX.clearRect(
      canvas.xOffset,
      canvas.yOffset,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height
    )
    canvas.vectorGuiCTX.beginPath()
    drawControlPointHandle(canvas, px1, py1, px2, py2)
  }

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
  // canvas.vectorGuiCTX.fillText(
  //   `${radA}, ${radB}`,
  //   px1 + 30,
  //   py1
  // )
  // Fill points
  canvas.vectorGuiCTX.fill()
}

/**
 *
 * @param {Object} vectorProperties
 * @param {String} color
 */
export function renderOffsetEllipseVector(vectorProperties, color = "red") {
  const {
    px1,
    py1,
    px2,
    py2,
    px3,
    py3,
    radA,
    radB,
    angle,
    x1Offset,
    y1Offset,
  } = vectorProperties
  // Setting of context attributes.
  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  canvas.vectorGuiCTX.strokeStyle = color
  canvas.vectorGuiCTX.fillStyle = color
  canvas.vectorGuiCTX.beginPath()
  if (px2 !== null) {
    drawCirclePath(
      canvas,
      px1 + x1Offset / 2,
      py1 + y1Offset / 2,
      circleRadius / 2
    )
    drawCirclePath(
      canvas,
      px2 + x1Offset / 2,
      py2 + y1Offset / 2,
      circleRadius / 2
    )
  }
  if (px3 !== null) {
    drawCirclePath(
      canvas,
      px3 + x1Offset / 2,
      py3 + y1Offset / 2,
      circleRadius / 2
    )
  }
  canvas.vectorGuiCTX.fill()
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.setLineDash([1, 1])
  if (px2 !== null) {
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset + px1 + 0.5 + x1Offset / 2,
      canvas.yOffset + py1 + 0.5 + y1Offset / 2
    )
    canvas.vectorGuiCTX.lineTo(
      canvas.xOffset + px2 + 0.5 + x1Offset / 2,
      canvas.yOffset + py2 + 0.5 + y1Offset / 2
    )
  }
  if (px3 !== null) {
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset + px1 + 0.5 + x1Offset / 2,
      canvas.yOffset + py1 + 0.5 + y1Offset / 2
    )
    canvas.vectorGuiCTX.lineTo(
      canvas.xOffset + px3 + 0.5 + x1Offset / 2,
      canvas.yOffset + py3 + 0.5 + y1Offset / 2
    )
  }

  canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.setLineDash([])
}
