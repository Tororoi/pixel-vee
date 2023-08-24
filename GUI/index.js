import { actionDraw } from "../Tools/actions.js"

//===========================================//
//=== * * * Graphics User Interface * * * ===//
//===========================================//
//TODO: create gui state to store active elements so gui can be rerendered easily
export function renderGUI(state, canvas, swatches) {
  canvas.guiCTX.clearRect(
    0,
    0,
    canvas.guiCVS.width / canvas.zoom,
    canvas.guiCVS.height / canvas.zoom
  )
  if (state.vectorMode) {
    renderVector(state, canvas)
  }
}

function renderVector(state, canvas) {
  canvas.guiCTX.beginPath()
  canvas.guiCTX.moveTo(
    canvas.xOffset + state.px1 + 0.5,
    canvas.yOffset + state.py1 + 0.5
  )
  if (state.px4) {
    //render cubic
    canvas.guiCTX.bezierCurveTo(
      canvas.xOffset + state.px3 + 0.5,
      canvas.yOffset + state.py3 + 0.5,
      canvas.xOffset + state.px4 + 0.5,
      canvas.yOffset + state.py4 + 0.5,
      canvas.xOffset + state.px2 + 0.5,
      canvas.yOffset + state.py2 + 0.5
    )
  } else if (state.px3) {
    //render quadratic
    canvas.guiCTX.quadraticCurveTo(
      canvas.xOffset + state.px3 + 0.5,
      canvas.yOffset + state.py3 + 0.5,
      canvas.xOffset + state.px2 + 0.5,
      canvas.yOffset + state.py2 + 0.5
    )
  } else if (state.px2) {
    //render line
    canvas.guiCTX.lineTo(
      canvas.xOffset + state.px2 + 0.5,
      canvas.yOffset + state.py2 + 0.5
    )
  }
  canvas.guiCTX.lineWidth = 0.25
  canvas.guiCTX.strokeStyle = `rgba(255,0,0,255)`
  canvas.guiCTX.stroke()
}

export function renderCursor(state, canvas, swatches) {
  renderGUI(state, canvas, swatches)
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
  let brushOffset =
    Math.floor(state.tool.brushSize / 2) *
    (canvas.offScreenCVS.width / canvas.offScreenCVS.width)
  let x0 = state.onscreenX - brushOffset
  let y0 = state.onscreenY - brushOffset
  let x1 =
    x0 +
    (canvas.offScreenCVS.width / canvas.offScreenCVS.width) *
      state.tool.brushSize
  let y1 =
    y0 +
    (canvas.offScreenCVS.width / canvas.offScreenCVS.width) *
      state.tool.brushSize
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
