import { state } from "../Context/state.js"

//==================================================//
//=== * * * Vector Graphics User Interface * * * ===//
//==================================================//

//Note: The Vector Graphics canvas has a mix-blend-mode: difference applied to it
export const vectorGui = {
  collidedKeys: { xKey: null, yKey: null },
  selectedPoint: { xKey: null, yKey: null },
  checkPointCollision,
  drawCursorBox,
  render,
  reset,
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

//TODO: this is quite slow due to the large path created, consider putting it on its own canvas to avoid rerender unless necessary
function renderGrid(canvas) {
  //get viewable boundaries - TODO: consider making these global properties as they may be useful for limiting other rendering functions or anything that iterates over the canvas while drawing
  let xLarge = Math.ceil(
    canvas.onScreenCVS.width / canvas.sharpness / canvas.zoom
  )
  let yLarge = Math.ceil(
    canvas.onScreenCVS.height / canvas.sharpness / canvas.zoom
  )
  let xMin = canvas.xOffset < 0 ? -canvas.xOffset : 0
  let xMax = Math.min(xMin + xLarge, canvas.offScreenCVS.width)
  let yMin = canvas.yOffset < 0 ? -canvas.yOffset : 0
  let yMax = Math.min(yMin + yLarge, canvas.offScreenCVS.height)

  let lineWidth = 0.5 / canvas.zoom
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "rgba(255,255,255,0.5)"
  canvas.vectorGuiCTX.beginPath()
  //limit render to viewable area
  canvas.vectorGuiCTX.moveTo(canvas.xOffset, canvas.yOffset)
  for (let i = xMin; i < xMax; i++) {
    //draw vertical grid lines
    canvas.vectorGuiCTX.moveTo(canvas.xOffset + i, canvas.yOffset + yMin)
    canvas.vectorGuiCTX.lineTo(canvas.xOffset + i, canvas.yOffset + yMax)
  }
  for (let j = yMin; j < yMax; j++) {
    //draw horizontal grid lines
    canvas.vectorGuiCTX.moveTo(canvas.xOffset + xMin, canvas.yOffset + j)
    canvas.vectorGuiCTX.lineTo(canvas.xOffset + xMax, canvas.yOffset + j)
  }
  canvas.vectorGuiCTX.stroke()
}

function renderFillVector(canvas) {
  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  let pointsKeys = [{ x: "px1", y: "py1" }]
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"
  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(pointsKeys, canvas, circleRadius, false)
  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(pointsKeys, canvas, circleRadius / 2, true)
  // Fill points
  canvas.vectorGuiCTX.fill()
}

function renderEllipseVector(canvas, color = "white") {
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
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px2,
      state.vectorProperties.py2
    )
  }

  drawControlPoints(pointsKeys, canvas, circleRadius, false)

  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(pointsKeys, canvas, circleRadius / 2, true)
  // canvas.vectorGuiCTX.fillText(
  //   `${state.vectorProperties.radA}, ${state.vectorProperties.radB}`,
  //   state.vectorProperties.px1 + 30,
  //   state.vectorProperties.py1
  // )
  // Fill points
  canvas.vectorGuiCTX.fill()
}

function renderOffsetEllipseVector(state, canvas, color = "red") {
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

function renderCurveVector(canvas) {
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + state.vectorProperties.px1 + 0.5,
    canvas.yOffset + state.vectorProperties.py1 + 0.5
  )

  if (state.vectorProperties.px4 !== null) {
    // canvas.vectorGuiCTX.bezierCurveTo(
    //   canvas.xOffset + state.vectorProperties.px3 + 0.5,
    //   canvas.yOffset + state.vectorProperties.py3 + 0.5,
    //   canvas.xOffset + state.vectorProperties.px4 + 0.5,
    //   canvas.yOffset + state.vectorProperties.py4 + 0.5,
    //   canvas.xOffset + state.vectorProperties.px2 + 0.5,
    //   canvas.yOffset + state.vectorProperties.py2 + 0.5
    // )
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px3,
      state.vectorProperties.py3
    )
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px2,
      state.vectorProperties.py2,
      state.vectorProperties.px4,
      state.vectorProperties.py4
    )
  } else if (state.vectorProperties.px3 !== null) {
    // canvas.vectorGuiCTX.quadraticCurveTo(
    //   canvas.xOffset + state.vectorProperties.px3 + 0.5,
    //   canvas.yOffset + state.vectorProperties.py3 + 0.5,
    //   canvas.xOffset + state.vectorProperties.px2 + 0.5,
    //   canvas.yOffset + state.vectorProperties.py2 + 0.5
    // )
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px3,
      state.vectorProperties.py3
    )
  } else if (state.vectorProperties.px2 !== null) {
    // canvas.vectorGuiCTX.lineTo(
    //   canvas.xOffset + state.vectorProperties.px2 + 0.5,
    //   canvas.yOffset + state.vectorProperties.py2 + 0.5
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

  drawControlPoints(pointsKeys, canvas, circleRadius, false)

  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(pointsKeys, canvas, circleRadius / 2, true)
  // Fill points
  canvas.vectorGuiCTX.fill()
}

function drawControlPoints(pointsKeys, canvas, radius, modify = false) {
  //reset collision
  vectorGui.collisionPresent = false
  vectorGui.collidedKeys = { xKey: null, yKey: null }
  for (let data of pointsKeys) {
    let point = {
      x: state.vectorProperties[data.x],
      y: state.vectorProperties[data.y],
    }
    if (point.x !== null && point.y !== null) {
      let r = state.touch ? radius * 2 : radius
      if (modify && vectorGui.selectedPoint.xKey === data.x) {
        r = radius * 2
        vectorGui.collisionPresent = true
        vectorGui.collidedKeys.xKey = data.x
        vectorGui.collidedKeys.yKey = data.y
      } else if (
        modify &&
        checkPointCollision(
          state.cursorX,
          state.cursorY,
          point.x,
          point.y,
          r + 1
        )
      ) {
        r = radius * 2
        vectorGui.collisionPresent = true
        vectorGui.collidedKeys.xKey = data.x
        vectorGui.collidedKeys.yKey = data.y
      }
      drawCirclePath(canvas, point.x, point.y, r)
    }
  }
  if (vectorGui.collisionPresent) {
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
 * Reset vector state
 * @param {*} canvas
 */
function reset(canvas) {
  state.vectorProperties = {
    ...{
      px1: null,
      py1: null,
      px2: null,
      py2: null,
      px3: null,
      py3: null,
      px4: null,
      py4: null,
      radA: null,
      radB: null,
      angle: null,
      x1Offset: 0,
      y1Offset: 0,
      offset: null, //rename to something more specific
      forceCircle: false,
    },
  }
  //reset selectedpoint and collided keys
  canvas.currentVectorIndex = null
  vectorGui.render(state, canvas)
}

/**
 * Render vector graphical interface
 * @param {*} state
 * @param {*} canvas
 */
function render(state, canvas) {
  canvas.vectorGuiCTX.clearRect(
    0,
    0,
    canvas.vectorGuiCVS.width / canvas.zoom,
    canvas.vectorGuiCVS.height / canvas.zoom
  )
  if (state.vectorMode) {
    //Prevent blurring
    canvas.vectorGuiCTX.imageSmoothingEnabled = false
    //Render grid
    if (canvas.zoom >= 4 && state.grid) {
      renderGrid(canvas)
    }
    if (state.tool.name === "fill") {
      renderFillVector(canvas)
    } else if (
      state.tool.name === "quadCurve" ||
      state.tool.name === "cubicCurve"
    ) {
      renderCurveVector(canvas)
    } else if (state.tool.name === "ellipse") {
      renderEllipseVector(canvas)
      if (state.vectorProperties.x1Offset || state.vectorProperties.y1Offset) {
        let color =
          !state.vectorProperties.x1Offset && !state.vectorProperties.y1Offset
            ? "white"
            : "red"
        renderOffsetEllipseVector(state, canvas, color)
      }
    }
  }
}

/**
 * Used to render eyedropper cursor
 * @param {*} state
 * @param {*} canvas
 */
function drawCursorBox(state, canvas) {
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
