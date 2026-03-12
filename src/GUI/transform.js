import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { vectorGui } from './vector.js'
import { getAngle } from '../utils/trig.js'
import { getGuiLineWidth } from '../utils/guiHelpers.js'
// import { drawSelectControlPoints, renderSelectionBoxOutline } from "./select.js"
import { findVectorShapeBoundaryBox } from '../utils/vectorHelpers.js'

/**
 *
 */
export function renderVectorRotationControl() {
  //for now, mother ui is always in the shape center
  vectorGui.mother.rotationOrigin.x = state.vector.shapeCenterX
  vectorGui.mother.rotationOrigin.y = state.vector.shapeCenterY
  if (state.cursor.clicked && state.vector.grabStartAngle !== null) {
    vectorGui.mother.newRotation =
      getAngle(
        vectorGui.mother.rotationOrigin.x - state.cursor.x,
        vectorGui.mother.rotationOrigin.y - state.cursor.y,
      ) -
      state.vector.grabStartAngle +
      vectorGui.mother.currentRotation
  }
  //Render mother ui rotation child
  const lineWidth = getGuiLineWidth(1)
  let circleRadius = 16 * lineWidth
  let pointsKeys = [{ x: 'rotationx', y: 'rotationy' }]
  let motherPoints = {
    rotationx: vectorGui.mother.rotationOrigin.x,
    rotationy: vectorGui.mother.rotationOrigin.y,
  }
  canvas.vectorGuiCTX.save()
  //render rotation origin
  vectorGui.drawControlPoints(motherPoints, pointsKeys, circleRadius, false)
  vectorGui.drawControlPoints(
    motherPoints,
    pointsKeys,
    circleRadius * 0.75,
    true,
  )
  // Render rotation icon at the rotation origin
  canvas.vectorGuiCTX.strokeStyle = 'black'
  canvas.vectorGuiCTX.fillStyle = 'black'
  canvas.vectorGuiCTX.lineWidth = lineWidth * 4
  canvas.vectorGuiCTX.beginPath()
  //create an arc that goes from 0 to 1.5pi
  canvas.vectorGuiCTX.arc(
    canvas.xOffset + motherPoints.rotationx + 0.5,
    canvas.yOffset + motherPoints.rotationy + 0.5,
    circleRadius - lineWidth * 7,
    0.9 * Math.PI,
    0.5 * Math.PI,
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
      lineWidth * 13,
  )
  canvas.vectorGuiCTX.lineTo(
    canvas.xOffset + motherPoints.rotationx + 0.5 - lineWidth * 6,
    canvas.yOffset +
      motherPoints.rotationy +
      0.5 +
      circleRadius -
      lineWidth * 7,
  )
  canvas.vectorGuiCTX.lineTo(
    canvas.xOffset + motherPoints.rotationx + 0.5 + lineWidth,
    canvas.yOffset +
      motherPoints.rotationy +
      0.5 +
      circleRadius -
      lineWidth * 1,
  )
  canvas.vectorGuiCTX.fill()
  canvas.vectorGuiCTX.restore()
}

/**
 *
 */
export function setVectorShapeBoundaryBox() {
  //Update shape boundary box
  const shapeBoundaryBox = findVectorShapeBoundaryBox(
    state.vector.selectedIndices,
    state.vector.all,
  )
  state.selection.properties.px1 = shapeBoundaryBox.xMin
  state.selection.properties.py1 = shapeBoundaryBox.yMin
  state.selection.properties.px2 = shapeBoundaryBox.xMax + 1
  state.selection.properties.py2 = shapeBoundaryBox.yMax + 1
  state.selection.setBoundaryBox(state.selection.properties)
}
