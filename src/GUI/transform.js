import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"

/**
 * TODO: (Middle Priority) use same aesthetic as select tool
 */
export function renderTransformBox() {
  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"
  let pointsKeys = [
    { x: "px1", y: "py1" },
    { x: "px2", y: "py2" },
    { x: "px3", y: "py3" },
    { x: "px4", y: "py4" },
  ]
  let transformPoints = {
    px1: canvas.currentLayer.x - lineWidth / 2 - 0.5,
    py1: canvas.currentLayer.y - lineWidth / 2 - 0.5,
    px2:
      canvas.currentLayer.x +
      canvas.currentLayer.img.width * canvas.currentLayer.scale +
      lineWidth / 2 -
      0.5,
    py2: canvas.currentLayer.y - lineWidth / 2 - 0.5,
    px3: canvas.currentLayer.x - lineWidth / 2 - 0.5,
    py3:
      canvas.currentLayer.y +
      canvas.currentLayer.img.height * canvas.currentLayer.scale +
      lineWidth / 2 -
      0.5,
    px4:
      canvas.currentLayer.x +
      canvas.currentLayer.img.width * canvas.currentLayer.scale +
      lineWidth / 2 -
      0.5,
    py4:
      canvas.currentLayer.y +
      canvas.currentLayer.img.height * canvas.currentLayer.scale +
      lineWidth / 2 -
      0.5,
  }
  // canvas.vectorGuiCTX.setLineDash([lineWidth * 4, lineWidth * 4])
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.rect(
    canvas.currentLayer.x + canvas.xOffset - lineWidth / 2,
    canvas.currentLayer.y + canvas.yOffset - lineWidth / 2,
    canvas.currentLayer.img.width * canvas.currentLayer.scale + lineWidth,
    canvas.currentLayer.img.height * canvas.currentLayer.scale + lineWidth
  )
  canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.beginPath()
  vectorGui.drawControlPoints(transformPoints, pointsKeys, circleRadius, false)
  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  vectorGui.drawControlPoints(
    transformPoints,
    pointsKeys,
    circleRadius / 2,
    true
  )
  // Fill points
  canvas.vectorGuiCTX.fill()
}
