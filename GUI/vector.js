import { state } from "../Context/state.js"

//==================================================//
//=== * * * Vector Graphics User Interface * * * ===//
//==================================================//

//Note: The Vector Graphics canvas has a mix-blend-mode: difference applied to it
export const vectorGuiState = {
  px1: null,
  py1: null,
  px2: null,
  py2: null,
  px3: null,
  py3: null,
  px4: null,
  py4: null,
  pointRadius: 4,
}
//helper function. TODO: move to graphics helper file
function drawCirclePath(canvas, x, y, r) {
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + x + 0.5 + r,
    canvas.yOffset + y + 0.5
  )
  canvas.vectorGuiCTX.arc(
    canvas.xOffset + x + 0.5,
    canvas.yOffset + y + 0.5,
    r,
    0,
    2 * Math.PI
  )
}

//helper function. TODO: move to graphics helper file
function drawControlPointHandle(canvas, x1, y1, x2, y2) {
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + x1 + 0.5,
    canvas.yOffset + y1 + 0.5
  )
  canvas.vectorGuiCTX.lineTo(
    canvas.xOffset + x2 + 0.5,
    canvas.yOffset + y2 + 0.5
  )
}

export function resetVectorGUI(canvas) {
  vectorGuiState.px1 = null
  vectorGuiState.py1 = null
  vectorGuiState.px2 = null
  vectorGuiState.py2 = null
  vectorGuiState.px3 = null
  vectorGuiState.py3 = null
  vectorGuiState.px4 = null
  vectorGuiState.py4 = null
  canvas.vectorGuiCTX.clearRect(
    0,
    0,
    canvas.vectorGuiCVS.width / canvas.zoom,
    canvas.vectorGuiCVS.height / canvas.zoom
  )
}

export function renderVectorGUI(state, canvas, swatches) {
  canvas.vectorGuiCTX.clearRect(
    0,
    0,
    canvas.vectorGuiCVS.width / canvas.zoom,
    canvas.vectorGuiCVS.height / canvas.zoom
  )
  if (state.vectorMode) {
    //Prevent blurring
    canvas.vectorGuiCTX.imageSmoothingEnabled = false
    renderVector(state, canvas, vectorGuiState)
  }
}

function renderVector(state, canvas, vectorGuiState) {
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + vectorGuiState.px1 + 0.5,
    canvas.yOffset + vectorGuiState.py1 + 0.5
  )

  if (vectorGuiState.px4) {
    // canvas.vectorGuiCTX.bezierCurveTo(
    //   canvas.xOffset + vectorGuiState.px3 + 0.5,
    //   canvas.yOffset + vectorGuiState.py3 + 0.5,
    //   canvas.xOffset + vectorGuiState.px4 + 0.5,
    //   canvas.yOffset + vectorGuiState.py4 + 0.5,
    //   canvas.xOffset + vectorGuiState.px2 + 0.5,
    //   canvas.yOffset + vectorGuiState.py2 + 0.5
    // )
    drawControlPointHandle(
      canvas,
      vectorGuiState.px1,
      vectorGuiState.py1,
      vectorGuiState.px3,
      vectorGuiState.py3
    )
    drawControlPointHandle(
      canvas,
      vectorGuiState.px2,
      vectorGuiState.py2,
      vectorGuiState.px4,
      vectorGuiState.py4
    )
  } else if (vectorGuiState.px3) {
    // canvas.vectorGuiCTX.quadraticCurveTo(
    //   canvas.xOffset + vectorGuiState.px3 + 0.5,
    //   canvas.yOffset + vectorGuiState.py3 + 0.5,
    //   canvas.xOffset + vectorGuiState.px2 + 0.5,
    //   canvas.yOffset + vectorGuiState.py2 + 0.5
    // )
    drawControlPointHandle(
      canvas,
      vectorGuiState.px1,
      vectorGuiState.py1,
      vectorGuiState.px3,
      vectorGuiState.py3
    )
  } else if (vectorGuiState.px2) {
    // canvas.vectorGuiCTX.lineTo(
    //   canvas.xOffset + vectorGuiState.px2 + 0.5,
    //   canvas.yOffset + vectorGuiState.py2 + 0.5
    // )
  }

  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  //set point radius for detection in state
  vectorGuiState.pointRadius = circleRadius
  let points = [
    { x: vectorGuiState.px1, y: vectorGuiState.py1 },
    { x: vectorGuiState.px2, y: vectorGuiState.py2 },
    { x: vectorGuiState.px3, y: vectorGuiState.py3 },
    { x: vectorGuiState.px4, y: vectorGuiState.py4 },
  ]

  drawControlPoints(points, canvas, circleRadius)

  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(points, canvas, circleRadius / 2, true)
  // Fill points
  canvas.vectorGuiCTX.fill()
}

function drawControlPoints(points, canvas, radius, modify = false) {
  let collisionPresent = false
  points.forEach((point) => {
    if (point.x && point.y) {
      let r = radius
      if (
        modify &&
        checkPointCollision(
          state.cursorX,
          state.cursorY,
          point.x,
          point.y,
          radius + 1
        )
      ) {
        r = radius * 2
        collisionPresent = true
      }
      drawCirclePath(canvas, point.x, point.y, r)
    }
  })
  if (collisionPresent) {
    canvas.vectorGuiCVS.style.cursor = "move"
  } else {
    canvas.vectorGuiCVS.style.cursor = "crosshair"
  }
}

function checkPointCollision(pointerX, pointerY, px, py, r) {
  //currently a square detection field, TODO: change to circle
  return (
    pointerX >= px - r &&
    pointerX <= px + r &&
    pointerY >= py - r &&
    pointerY <= py + r
  )
}

/**
 * Used to render eyedropper cursor
 * @param {*} state
 * @param {*} canvas
 */
export function drawCursorBox(state, canvas) {
  let lineWidth = canvas.zoom <= 8 ? 2 / canvas.zoom : 0.25
  let brushOffset = Math.floor(state.tool.brushSize / 2)
  let x0 = state.onscreenX - brushOffset
  let y0 = state.onscreenY - brushOffset
  let x1 = x0 + state.tool.brushSize
  let y1 = y0 + state.tool.brushSize
  //line offset to stroke offcenter;
  let ol = lineWidth / 2
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  //top
  canvas.vectorGuiCTX.moveTo(x0, y0 - ol)
  canvas.vectorGuiCTX.lineTo(x1, y0 - ol)
  //right
  canvas.vectorGuiCTX.moveTo(x1 + ol, y0)
  canvas.vectorGuiCTX.lineTo(x1 + ol, y1)
  //bottom
  canvas.vectorGuiCTX.moveTo(x0, y1 + ol)
  canvas.vectorGuiCTX.lineTo(x1, y1 + ol)
  //left
  canvas.vectorGuiCTX.moveTo(x0 - ol, y0)
  canvas.vectorGuiCTX.lineTo(x0 - ol, y1)

  canvas.vectorGuiCTX.stroke()
}
