import { actionDraw } from "../Tools/actions.js"

//===========================================//
//=== * * * Graphics User Interface * * * ===//
//===========================================//

export const guiState = {
  px1: null,
  py1: null,
  px2: null,
  py2: null,
  px3: null,
  py3: null,
  px4: null,
  py4: null,
}
//helper function. TODO: move to graphics helper file
function drawCirclePath(canvas, x, y, r) {
  canvas.guiCTX.moveTo(canvas.xOffset + x + 0.5 + r, canvas.yOffset + y + 0.5)
  canvas.guiCTX.arc(
    canvas.xOffset + x + 0.5,
    canvas.yOffset + y + 0.5,
    r,
    0,
    2 * Math.PI
  )
}

//helper function. TODO: move to graphics helper file
function drawControlPointHandle(canvas, x1, y1, x2, y2) {
  canvas.guiCTX.moveTo(canvas.xOffset + x1 + 0.5, canvas.yOffset + y1 + 0.5)
  canvas.guiCTX.lineTo(canvas.xOffset + x2 + 0.5, canvas.yOffset + y2 + 0.5)
}

export function resetVectorGUI(canvas) {
  guiState.px1 = null
  guiState.py1 = null
  guiState.px2 = null
  guiState.py2 = null
  guiState.px3 = null
  guiState.py3 = null
  guiState.px4 = null
  guiState.py4 = null
  canvas.guiCTX.clearRect(
    0,
    0,
    canvas.guiCVS.width / canvas.zoom,
    canvas.guiCVS.height / canvas.zoom
  )
}

//TODO: create gui state to store active elements so gui can be rerendered easily
export function renderGUI(state, canvas, swatches) {
  canvas.guiCTX.clearRect(
    0,
    0,
    canvas.guiCVS.width / canvas.zoom,
    canvas.guiCVS.height / canvas.zoom
  )
  if (state.vectorMode) {
    //Prevent blurring
    canvas.guiCTX.imageSmoothingEnabled = false
    canvas.guiCTX.globalCompositeOperation = "source-over"
    renderVector(state, canvas, guiState)
    // canvas.guiCTX.globalCompositeOperation = "xor"
    // canvas.guiCTX.drawImage(
    //   canvas.onScreenCVS,
    //   0,
    //   0,
    //   canvas.onScreenCVS.width / (canvas.zoom * canvas.sharpness),
    //   canvas.onScreenCVS.height / (canvas.zoom * canvas.sharpness)
    // )
    // canvas.guiCTX.globalCompositeOperation = "destination-over"
    // renderVector(state, canvas, guiState, `rgba(0,255,0,1)`)
  }
}

function renderVector(state, canvas, guiState) {
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 2 / canvas.zoom : 0.5
  canvas.guiCTX.lineWidth = lineWidth
  canvas.guiCTX.strokeStyle = `rgba(255,255,255,1)`
  // canvas.guiCTX.fillStyle = `rgba(255,255,255,1)`
  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  let points = [
    { x: guiState.px1, y: guiState.py1 },
    { x: guiState.px2, y: guiState.py2 },
    { x: guiState.px3, y: guiState.py3 },
    { x: guiState.px4, y: guiState.py4 },
  ]
  // canvas.guiCTX.globalCompositeOperation = "xor"
  canvas.guiCTX.beginPath()
  canvas.guiCTX.moveTo(
    canvas.xOffset + guiState.px1 + 0.5,
    canvas.yOffset + guiState.py1 + 0.5
  )

  if (guiState.px4) {
    // canvas.guiCTX.bezierCurveTo(
    //   canvas.xOffset + guiState.px3 + 0.5,
    //   canvas.yOffset + guiState.py3 + 0.5,
    //   canvas.xOffset + guiState.px4 + 0.5,
    //   canvas.yOffset + guiState.py4 + 0.5,
    //   canvas.xOffset + guiState.px2 + 0.5,
    //   canvas.yOffset + guiState.py2 + 0.5
    // )
    drawControlPointHandle(
      canvas,
      guiState.px1,
      guiState.py1,
      guiState.px3,
      guiState.py3
    )
    drawControlPointHandle(
      canvas,
      guiState.px2,
      guiState.py2,
      guiState.px4,
      guiState.py4
    )
  } else if (guiState.px3) {
    // canvas.guiCTX.quadraticCurveTo(
    //   canvas.xOffset + guiState.px3 + 0.5,
    //   canvas.yOffset + guiState.py3 + 0.5,
    //   canvas.xOffset + guiState.px2 + 0.5,
    //   canvas.yOffset + guiState.py2 + 0.5
    // )
    drawControlPointHandle(
      canvas,
      guiState.px1,
      guiState.py1,
      guiState.px3,
      guiState.py3
    )
  } else if (guiState.px2) {
    // canvas.guiCTX.lineTo(
    //   canvas.xOffset + guiState.px2 + 0.5,
    //   canvas.yOffset + guiState.py2 + 0.5
    // )
  }

  drawControlPoints(points, canvas, circleRadius)

  // Stroke non-filled lines
  canvas.guiCTX.stroke()
  canvas.guiCTX.lineWidth = lineWidth * 0.5
  canvas.guiCTX.strokeStyle = `rgba(0,0,0,1)`
  canvas.guiCTX.stroke()

  canvas.guiCTX.beginPath()
  drawControlPoints(points, canvas, circleRadius / 2)
  canvas.guiCTX.fillStyle = `rgba(0,0,0,1)`
  // Fill points
  canvas.guiCTX.fill()

  canvas.guiCTX.beginPath()
  drawControlPoints(points, canvas, circleRadius / 2)
  canvas.guiCTX.lineWidth = lineWidth * 0.25
  canvas.guiCTX.strokeStyle = `rgba(255,255,255,1)`
  canvas.guiCTX.stroke()
  // Render filled points
  // canvas.guiCTX.globalCompositeOperation = "source-over"
  // canvas.guiCTX.beginPath()
  // drawControlPoints(points, canvas, circleRadius / 2)

  // // Fill points
  // canvas.guiCTX.fill()
}

function drawControlPoints(points, canvas, radius) {
  points.forEach((point) => {
    if (point.x && point.y) {
      drawCirclePath(canvas, point.x, point.y, radius)
    }
  })
}

export function renderCursor(state, canvas, swatches) {
  renderGUI(state, canvas, swatches)
  canvas.guiCTX.globalCompositeOperation = "source-over"
  switch (state.tool.name) {
    case "grab":
      //show nothing
      break
    case "eyedropper":
      //empty square
      drawCursorBox(state, canvas, 0.5)
      break
    default:
      drawCurrentPixel(state, canvas, swatches)
    // drawCursorBox(state, canvas, 0.5)
  }
}

export function drawCurrentPixel(state, canvas, swatches) {
  //draw onscreen current pixel
  actionDraw(
    state.cursorWithCanvasOffsetX,
    state.cursorWithCanvasOffsetY,
    swatches.primary.color,
    state.brushStamp,
    state.tool.brushSize,
    canvas.guiCTX,
    state.mode,
    canvas.offScreenCVS.width / canvas.offScreenCVS.width
  )
}

function drawCursorBox(state, canvas, lineWidth) {
  let brushOffset = Math.floor(state.tool.brushSize / 2)
  let x0 = state.onscreenX - brushOffset
  let y0 = state.onscreenY - brushOffset
  let x1 = x0 + state.tool.brushSize
  let y1 = y0 + state.tool.brushSize
  //line offset to stroke offcenter;
  let ol = lineWidth / 2
  canvas.guiCTX.beginPath()
  canvas.guiCTX.lineWidth = lineWidth
  canvas.guiCTX.strokeStyle = "black"
  //top
  canvas.guiCTX.moveTo(x0, y0 - ol)
  canvas.guiCTX.lineTo(x1, y0 - ol)
  //right
  canvas.guiCTX.moveTo(x1 + ol, y0)
  canvas.guiCTX.lineTo(x1 + ol, y1)
  //bottom
  canvas.guiCTX.moveTo(x0, y1 + ol)
  canvas.guiCTX.lineTo(x1, y1 + ol)
  //left
  canvas.guiCTX.moveTo(x0 - ol, y0)
  canvas.guiCTX.lineTo(x0 - ol, y1)

  canvas.guiCTX.stroke()
}
