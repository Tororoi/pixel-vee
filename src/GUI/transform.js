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
export function renderVectorMother() {
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
  lineWidth *= 2 //Line twice as thick as other vector lines
  let circleRadius = 6 * lineWidth
  const lineLengthFactor = 6
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
  // canvas.vectorGuiCTX.beginPath()
  // drawCirclePath(
  //   canvas.vectorGuiCTX,
  //   canvas.xOffset,
  //   canvas.yOffset,
  //   vectorGui.mother.rotationOrigin.x,
  //   vectorGui.mother.rotationOrigin.y,
  //   circleRadius / 2
  // )
  // canvas.vectorGuiCTX.fill()
  // canvas.vectorGuiCTX.beginPath()
  // drawCirclePath(
  //   canvas.vectorGuiCTX,
  //   canvas.xOffset,
  //   canvas.yOffset,
  //   vectorGui.mother.rotationOrigin.x,
  //   vectorGui.mother.rotationOrigin.y,
  //   circleRadius
  // )
  // canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.beginPath()
  vectorGui.drawControlPoints(motherPoints, pointsKeys, circleRadius, false)
  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  vectorGui.drawControlPoints(motherPoints, pointsKeys, circleRadius / 2, true)
  // Fill points
  canvas.vectorGuiCTX.fill()
  //render dotted line representing starting angle (0)
  // Create Radial
  const grd = canvas.vectorGuiCTX.createRadialGradient(
    canvas.xOffset + vectorGui.mother.rotationOrigin.x + 0.5,
    canvas.yOffset + vectorGui.mother.rotationOrigin.y + 0.5,
    (lineLengthFactor - 3) * circleRadius,
    canvas.xOffset + vectorGui.mother.rotationOrigin.x + 0.5,
    canvas.yOffset + vectorGui.mother.rotationOrigin.y + 0.5,
    lineLengthFactor * circleRadius
  )
  grd.addColorStop(0, "white")
  grd.addColorStop(1, "transparent")

  canvas.vectorGuiCTX.strokeStyle = grd
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + vectorGui.mother.rotationOrigin.x + 0.5,
    canvas.yOffset + vectorGui.mother.rotationOrigin.y + 0.5
  )
  canvas.vectorGuiCTX.lineTo(
    canvas.xOffset +
      vectorGui.mother.rotationOrigin.x -
      lineLengthFactor * circleRadius * Math.cos(0) +
      0.5,
    canvas.yOffset +
      vectorGui.mother.rotationOrigin.y -
      lineLengthFactor * circleRadius * Math.sin(0) +
      0.5
  )
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + vectorGui.mother.rotationOrigin.x + 0.5,
    canvas.yOffset + vectorGui.mother.rotationOrigin.y + 0.5
  )
  canvas.vectorGuiCTX.lineTo(
    canvas.xOffset +
      vectorGui.mother.rotationOrigin.x +
      lineLengthFactor * circleRadius * Math.cos(0) +
      0.5,
    canvas.yOffset +
      vectorGui.mother.rotationOrigin.y +
      lineLengthFactor * circleRadius * Math.sin(0) +
      0.5
  )
  canvas.vectorGuiCTX.setLineDash([lineWidth * 4, lineWidth * 4])
  canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.setLineDash([])
  //render line bisecting rotation child at angle of rotation
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.lineCap = "round"
  canvas.vectorGuiCTX.beginPath()
  // canvas.vectorGuiCTX.moveTo(
  //   canvas.xOffset +
  //     vectorGui.mother.rotationOrigin.x -
  //     lineLengthFactor *
  //       circleRadius *
  //       Math.cos(vectorGui.mother.newRotation) +
  //     0.5,
  //   canvas.yOffset +
  //     vectorGui.mother.rotationOrigin.y -
  //     lineLengthFactor *
  //       circleRadius *
  //       Math.sin(vectorGui.mother.newRotation) +
  //     0.5
  // )
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + vectorGui.mother.rotationOrigin.x + 0.5,
    canvas.yOffset + vectorGui.mother.rotationOrigin.y + 0.5
  )
  canvas.vectorGuiCTX.lineTo(
    canvas.xOffset +
      vectorGui.mother.rotationOrigin.x +
      lineLengthFactor * circleRadius * Math.cos(vectorGui.mother.newRotation) +
      0.5,
    canvas.yOffset +
      vectorGui.mother.rotationOrigin.y +
      lineLengthFactor * circleRadius * Math.sin(vectorGui.mother.newRotation) +
      0.5
  )
  canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.restore()
}
