import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "./vector.js"
import { getAngle } from "../utils/trig.js"
import { drawCirclePath } from "../utils/guiHelpers.js"

/**
 *
 */
export function renderTransformBox() {
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  let circleRadius = 8 * lineWidth
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

/**
 *
 */
export function renderVectorRotationControl() {
  //for now, mother ui is always in the shape center
  vectorGui.mother.rotationOrigin.x = state.shapeCenterX
  vectorGui.mother.rotationOrigin.y = state.shapeCenterY
  if (state.clicked && state.grabStartAngle !== null) {
    vectorGui.mother.newRotation =
      getAngle(
        vectorGui.mother.rotationOrigin.x - state.cursorX,
        vectorGui.mother.rotationOrigin.y - state.cursorY
      ) -
      state.grabStartAngle +
      vectorGui.mother.currentRotation
  }
  //Render mother ui rotation child
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  let circleRadius = 16 * lineWidth
  let pointsKeys = [{ x: "rotationx", y: "rotationy" }]
  let motherPoints = {
    rotationx: vectorGui.mother.rotationOrigin.x,
    rotationy: vectorGui.mother.rotationOrigin.y,
  }
  canvas.vectorGuiCTX.save()
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"
  //render rotation origin
  canvas.vectorGuiCTX.beginPath()
  vectorGui.drawControlPoints(motherPoints, pointsKeys, circleRadius, false)
  // Stroke non-filled lines
  // canvas.vectorGuiCTX.stroke()
  // canvas.vectorGuiCTX.beginPath()
  vectorGui.drawControlPoints(
    motherPoints,
    pointsKeys,
    circleRadius * 0.75,
    true
  )
  // Fill points
  canvas.vectorGuiCTX.fill()
  // Render rotation icon at the rotation origin
  canvas.vectorGuiCTX.strokeStyle = "black"
  canvas.vectorGuiCTX.fillStyle = "black"
  canvas.vectorGuiCTX.lineWidth = lineWidth * 4
  canvas.vectorGuiCTX.beginPath()
  //create an arc that goes from 0 to 1.5pi
  canvas.vectorGuiCTX.arc(
    canvas.xOffset + motherPoints.rotationx + 0.5,
    canvas.yOffset + motherPoints.rotationy + 0.5,
    circleRadius - lineWidth * 7,
    0.9 * Math.PI,
    0.5 * Math.PI
  )
  canvas.vectorGuiCTX.stroke()
  //fill triangle at end of arc (triangle is pointing left)
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + motherPoints.rotationx + 0.5 + lineWidth,
    canvas.yOffset +
      motherPoints.rotationy +
      0.5 +
      circleRadius -
      lineWidth * 13
  )
  canvas.vectorGuiCTX.lineTo(
    canvas.xOffset + motherPoints.rotationx + 0.5 - lineWidth * 6,
    canvas.yOffset + motherPoints.rotationy + 0.5 + circleRadius - lineWidth * 7
  )
  canvas.vectorGuiCTX.lineTo(
    canvas.xOffset + motherPoints.rotationx + 0.5 + lineWidth,
    canvas.yOffset + motherPoints.rotationy + 0.5 + circleRadius - lineWidth * 1
  )
  canvas.vectorGuiCTX.fill()
  canvas.vectorGuiCTX.restore()
}
