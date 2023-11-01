import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { drawCirclePath, drawControlPointHandle } from "../utils/guiHelpers.js"

/**
 * @param {Object} vectorGui
 * @param {String} color
 */
export function renderEllipseVector(vectorGui, color = "white") {
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
    canvas.xOffset + state.vectorProperties.px1 + 0.5,
    canvas.yOffset + state.vectorProperties.py1 + 0.5
  )

  if (state.vectorProperties.px3 !== null) {
    canvas.vectorGuiCTX.ellipse(
      canvas.xOffset + state.vectorProperties.px1 + 0.5,
      canvas.yOffset + state.vectorProperties.py1 + 0.5,
      state.vectorProperties.radA,
      state.vectorProperties.radB,
      state.vectorProperties.angle + 4 * Math.PI,
      0,
      state.vectorProperties.angle + 2 * Math.PI
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
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px3,
      state.vectorProperties.py3
    )
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px2,
      state.vectorProperties.py2
    )
  } else if (state.vectorProperties.px2 !== null) {
    drawCirclePath(
      canvas,
      state.vectorProperties.px1 + state.vectorProperties.x1Offset / 2,
      state.vectorProperties.py1 + state.vectorProperties.y1Offset / 2,
      state.vectorProperties.radA
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
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px2,
      state.vectorProperties.py2
    )
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
  //   `${state.vectorProperties.radA}, ${state.vectorProperties.radB}`,
  //   state.vectorProperties.px1 + 30,
  //   state.vectorProperties.py1
  // )
  // Fill points
  canvas.vectorGuiCTX.fill()
}

/**
 *
 * @param {Object} vectorGui
 * @param {String} color
 */
export function renderOffsetEllipseVector(color = "red") {
  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  canvas.vectorGuiCTX.strokeStyle = color
  canvas.vectorGuiCTX.fillStyle = color
  canvas.vectorGuiCTX.beginPath()
  if (state.vectorProperties.px2 !== null) {
    drawCirclePath(
      canvas,
      state.vectorProperties.px1 + state.vectorProperties.x1Offset / 2,
      state.vectorProperties.py1 + state.vectorProperties.y1Offset / 2,
      circleRadius / 2
    )
    drawCirclePath(
      canvas,
      state.vectorProperties.px2 + state.vectorProperties.x1Offset / 2,
      state.vectorProperties.py2 + state.vectorProperties.y1Offset / 2,
      circleRadius / 2
    )
  }
  if (state.vectorProperties.px3 !== null) {
    drawCirclePath(
      canvas,
      state.vectorProperties.px3 + state.vectorProperties.x1Offset / 2,
      state.vectorProperties.py3 + state.vectorProperties.y1Offset / 2,
      circleRadius / 2
    )
  }
  canvas.vectorGuiCTX.fill()
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.setLineDash([1, 1])
  if (state.vectorProperties.px2 !== null) {
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset +
        state.vectorProperties.px1 +
        0.5 +
        state.vectorProperties.x1Offset / 2,
      canvas.yOffset +
        state.vectorProperties.py1 +
        0.5 +
        state.vectorProperties.y1Offset / 2
    )
    canvas.vectorGuiCTX.lineTo(
      canvas.xOffset +
        state.vectorProperties.px2 +
        0.5 +
        state.vectorProperties.x1Offset / 2,
      canvas.yOffset +
        state.vectorProperties.py2 +
        0.5 +
        state.vectorProperties.y1Offset / 2
    )
  }
  if (state.vectorProperties.px3 !== null) {
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset +
        state.vectorProperties.px1 +
        0.5 +
        state.vectorProperties.x1Offset / 2,
      canvas.yOffset +
        state.vectorProperties.py1 +
        0.5 +
        state.vectorProperties.y1Offset / 2
    )
    canvas.vectorGuiCTX.lineTo(
      canvas.xOffset +
        state.vectorProperties.px3 +
        0.5 +
        state.vectorProperties.x1Offset / 2,
      canvas.yOffset +
        state.vectorProperties.py3 +
        0.5 +
        state.vectorProperties.y1Offset / 2
    )
  }

  canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.setLineDash([])
}
