import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import {
  drawCirclePath,
  drawControlPointHandle,
  renderGrid,
} from "../utils/guiHelpers.js"

//==================================================//
//=== * * * Vector Graphics User Interface * * * ===//
//==================================================//

//Note: The Vector Graphics canvas has a mix-blend-mode: difference applied to it
export const vectorGui = {
  collidedKeys: { xKey: null, yKey: null },
  selectedPoint: { xKey: null, yKey: null },
  checkPointCollision,
  drawCursorBox,
  drawSelectOutline,
  render,
  reset,
}

/**
 * @param {Object} canvas
 */
function renderFillVector(canvas) {
  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  let pointsKeys = [{ x: "px1", y: "py1" }]
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"
  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(
    state.vectorProperties,
    pointsKeys,
    canvas,
    circleRadius,
    false
  )
  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(
    state.vectorProperties,
    pointsKeys,
    canvas,
    circleRadius / 2,
    true
  )
  // Fill points
  canvas.vectorGuiCTX.fill()
}

/**
 * @param {Object} canvas
 * @param {String} color
 */
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

  drawControlPoints(
    state.vectorProperties,
    pointsKeys,
    canvas,
    circleRadius,
    false
  )

  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(
    state.vectorProperties,
    pointsKeys,
    canvas,
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
 * @param {Object} state
 * @param {Object} canvas
 * @param {String} color
 */
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

/**
 * @param {Object} canvas
 */
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
    canvas.vectorGuiCTX.bezierCurveTo(
      canvas.xOffset + state.vectorProperties.px3 + 0.5,
      canvas.yOffset + state.vectorProperties.py3 + 0.5,
      canvas.xOffset + state.vectorProperties.px4 + 0.5,
      canvas.yOffset + state.vectorProperties.py4 + 0.5,
      canvas.xOffset + state.vectorProperties.px2 + 0.5,
      canvas.yOffset + state.vectorProperties.py2 + 0.5
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
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset + state.vectorProperties.px1 + 0.5,
      canvas.yOffset + state.vectorProperties.py1 + 0.5
    )
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
    canvas.vectorGuiCTX.quadraticCurveTo(
      canvas.xOffset + state.vectorProperties.px3 + 0.5,
      canvas.yOffset + state.vectorProperties.py3 + 0.5,
      canvas.xOffset + state.vectorProperties.px2 + 0.5,
      canvas.yOffset + state.vectorProperties.py2 + 0.5
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
    canvas.vectorGuiCTX.moveTo(
      canvas.xOffset + state.vectorProperties.px1 + 0.5,
      canvas.yOffset + state.vectorProperties.py1 + 0.5
    )
    drawControlPointHandle(
      canvas,
      state.vectorProperties.px1,
      state.vectorProperties.py1,
      state.vectorProperties.px3,
      state.vectorProperties.py3
    )
  } else if (state.vectorProperties.px2 !== null) {
    canvas.vectorGuiCTX.lineTo(
      canvas.xOffset + state.vectorProperties.px2 + 0.5,
      canvas.yOffset + state.vectorProperties.py2 + 0.5
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()
    canvas.vectorGuiCTX.clearRect(
      canvas.xOffset,
      canvas.yOffset,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height
    )
  }

  let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
  //set point radius for detection in state
  let pointsKeys = [
    { x: "px1", y: "py1" },
    { x: "px2", y: "py2" },
    { x: "px3", y: "py3" },
    { x: "px4", y: "py4" },
  ]

  drawControlPoints(
    state.vectorProperties,
    pointsKeys,
    canvas,
    circleRadius,
    false
  )

  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(
    state.vectorProperties,
    pointsKeys,
    canvas,
    circleRadius / 2,
    true
  )
  // Fill points
  canvas.vectorGuiCTX.fill()
}

/**
 * TODO: Factor out collision logic separately
 * @param {Object} vectorProperties
 * @param {Object} pointsKeys
 * @param {Object} canvas
 * @param {Integer} radius
 * @param {Boolean} modify
 * @param {Integer} offset
 */
function drawControlPoints(
  vectorProperties,
  pointsKeys,
  canvas,
  radius,
  modify = false,
  offset = 0
) {
  //reset collision
  vectorGui.collisionPresent = false
  vectorGui.collidedKeys = { xKey: null, yKey: null }
  for (let data of pointsKeys) {
    let point = {
      x: vectorProperties[data.x],
      y: vectorProperties[data.y],
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
          point.x - offset,
          point.y - offset,
          r + 1
        )
      ) {
        r = radius * 2
        vectorGui.collisionPresent = true
        vectorGui.collidedKeys.xKey = data.x
        vectorGui.collidedKeys.yKey = data.y
      }
      drawCirclePath(canvas, point.x - offset, point.y - offset, r)
    }
  }
  if (vectorGui.collisionPresent) {
    //For transforms, set resize cursor. Otherwise, use move cursor
    if (state.tool.name === "move") {
      if (
        vectorGui.collidedKeys.xKey === "px1" ||
        vectorGui.collidedKeys.xKey === "px4"
      ) {
        canvas.vectorGuiCVS.style.cursor = "nwse-resize"
      } else if (
        vectorGui.collidedKeys.xKey === "px2" ||
        vectorGui.collidedKeys.xKey === "px3"
      ) {
        canvas.vectorGuiCVS.style.cursor = "nesw-resize"
      }
    } else {
      canvas.vectorGuiCVS.style.cursor = "move"
    }
  } else {
    if (dom.modeBtn.id === "erase") {
      canvas.vectorGuiCVS.style.cursor = "none"
    } else {
      canvas.vectorGuiCVS.style.cursor = state.tool.cursor
    }
  }
}

/**
 *
 * @param {Integer} pointerX
 * @param {Integer} pointerY
 * @param {Integer} px
 * @param {Integer} py
 * @param {Integer} r
 * @returns {Boolean}
 */
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
 * @param {Object} canvas
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
 * @param {Object} state
 * @param {Object} canvas
 * @param {Float} lineDashOffset
 */
function render(state, canvas, lineDashOffset = 0.5) {
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
    if (state.selectProperties.px1 !== null) {
      renderSelectVector(
        state,
        canvas,
        lineDashOffset,
        state.tool.name === "select"
      )
    }
    if (canvas.zoom >= 4 && state.grid) {
      renderGrid(canvas, 8)
    }
    if (
      canvas.currentLayer.type === "reference" &&
      state.tool.name === "move"
    ) {
      renderTransformBox(canvas)
    }
  }
  // if (state.tool.name !== "select" || !state.clicked) {
  //   window.requestAnimationFrame(() => {
  //     render(state, canvas, lineDashOffset < 2 ? lineDashOffset + 0.1 : 0)
  //   })
  // }
}

function renderTransformBox(canvas) {
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
  drawControlPoints(transformPoints, pointsKeys, canvas, circleRadius, false)
  // Stroke non-filled lines
  canvas.vectorGuiCTX.stroke()

  canvas.vectorGuiCTX.beginPath()
  drawControlPoints(transformPoints, pointsKeys, canvas, circleRadius / 2, true)
  // Fill points
  canvas.vectorGuiCTX.fill()
}

/**
 * Used to render eyedropper cursor and eraser
 * @param {Object} state
 * @param {Object} canvas
 * @param {Float} lineWeight
 */
function drawCursorBox(state, canvas, lineWeight) {
  let lineWidth =
    canvas.zoom <= 8 ? lineWeight / canvas.zoom : 0.125 * lineWeight
  let brushOffset = Math.floor(state.tool.brushSize / 2)
  let ol = lineWidth / 2 // line offset to stroke off-center

  // Create a Set from state.brushStamp //TODO: make set when creating brush stamp so it does not need to be defined here.
  const pixelSet = new Set(state.brushStamp["0,0"].map((p) => `${p.x},${p.y}`))

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"

  for (const pixel of state.brushStamp["0,0"]) {
    const x = state.cursorX + canvas.xOffset + pixel.x - brushOffset
    const y = state.cursorY + canvas.yOffset + pixel.y - brushOffset

    // Check for neighboring pixels using the Set
    const hasTopNeighbor = pixelSet.has(`${pixel.x},${pixel.y - 1}`)
    const hasRightNeighbor = pixelSet.has(`${pixel.x + 1},${pixel.y}`)
    const hasBottomNeighbor = pixelSet.has(`${pixel.x},${pixel.y + 1}`)
    const hasLeftNeighbor = pixelSet.has(`${pixel.x - 1},${pixel.y}`)

    // Draw lines only for sides that don't have neighboring pixels
    if (!hasTopNeighbor) {
      canvas.vectorGuiCTX.moveTo(x, y - ol)
      canvas.vectorGuiCTX.lineTo(x + 1, y - ol)
    }
    if (!hasRightNeighbor) {
      canvas.vectorGuiCTX.moveTo(x + 1 + ol, y)
      canvas.vectorGuiCTX.lineTo(x + 1 + ol, y + 1)
    }
    if (!hasBottomNeighbor) {
      canvas.vectorGuiCTX.moveTo(x, y + 1 + ol)
      canvas.vectorGuiCTX.lineTo(x + 1, y + 1 + ol)
    }
    if (!hasLeftNeighbor) {
      canvas.vectorGuiCTX.moveTo(x - ol, y)
      canvas.vectorGuiCTX.lineTo(x - ol, y + 1)
    }
  }

  canvas.vectorGuiCTX.stroke()
}

//TODO: currently only good for solid shapes. Must also draw outline for holes in shape. Need hole searching algorithm, then run tracing on each hole
//pass set to function instead of recalculating it every time
//pass dashOffset for animating marching ants
// function drawSelectOutline(state, canvas, lineDashOffset) {
//   let lineWidth = canvas.zoom <= 8 ? 2 / canvas.zoom : 0.25
//   let brushOffset = Math.floor(state.tool.brushSize / 2)

//   const pixelSet = new Set()
//   for (const pixel of state.brushStamp) {
//     pixelSet.add(`${pixel.x},${pixel.y}`)
//     pixelSet.add(`${pixel.x + 1},${pixel.y}`)
//     pixelSet.add(`${pixel.x},${pixel.y + 1}`)
//     pixelSet.add(`${pixel.x + 1},${pixel.y + 1}`)
//   }

//   let initialPoint = state.brushStamp.reduce((acc, cur) => {
//     return cur.y < acc.y || (cur.y === acc.y && cur.x < acc.x) ? cur : acc
//   })

//   const directions = [
//     [0, -1], // Up
//     [1, 0], // Right
//     [0, 1], // Down
//     [-1, 0], // Left
//   ]

//   let currentPoint = initialPoint
//   let previousDirection = 0

//   // Save the context state before defining a clipping region
//   canvas.vectorGuiCTX.save()
//   canvas.vectorGuiCTX.beginPath()
//   canvas.vectorGuiCTX.lineWidth = lineWidth
//   canvas.vectorGuiCTX.strokeStyle = "white"
//   canvas.vectorGuiCTX.setLineDash([1, 1])
//   canvas.vectorGuiCTX.lineDashOffset = lineDashOffset

//   // Define a clipping region that's the entire canvas so the inside of the shape will be cut when clipped
//   //Depending on whether selection is inversed, draw or don't draw this rect.
//   //Drawing it will put the selection line on the outside of the shape. Not drawing it puts the line on the inside of the shape.
//   canvas.vectorGuiCTX.rect(
//     -1,
//     -1,
//     canvas.vectorGuiCVS.width + 1,
//     canvas.vectorGuiCVS.height + 1
//   )

//   // Set the starting point
//   canvas.vectorGuiCTX.moveTo(
//     state.cursorX + canvas.xOffset + initialPoint.x - brushOffset,
//     state.cursorY + canvas.yOffset + initialPoint.y - brushOffset
//   )

//   do {
//     for (let i = 0; i < 4; i++) {
//       const newDirection = (previousDirection + i) % 4
//       const [dx, dy] = directions[newDirection]

//       if (pixelSet.has(`${currentPoint.x + dx},${currentPoint.y + dy}`)) {
//         const x =
//           state.cursorX + canvas.xOffset + currentPoint.x + dx - brushOffset
//         const y =
//           state.cursorY + canvas.yOffset + currentPoint.y + dy - brushOffset

//         canvas.vectorGuiCTX.lineTo(x, y)
//         currentPoint = { x: currentPoint.x + dx, y: currentPoint.y + dy }
//         previousDirection = (newDirection + 3) % 4
//         break
//       }
//     }
//   } while (
//     currentPoint.x !== initialPoint.x ||
//     currentPoint.y !== initialPoint.y
//   )

//   canvas.vectorGuiCTX.clip("evenodd")

//   // Stroke the path. Only the part outside of the shape will be visible.
//   canvas.vectorGuiCTX.stroke()

//   // Restore the context state to remove the clipping region
//   canvas.vectorGuiCTX.restore()
// }

/**
 * @param {Object} state
 * @param {Object} canvas
 * @param {Float} lineDashOffset
 * @param {Boolean} drawPoints
 */
function renderSelectVector(state, canvas, lineDashOffset, drawPoints) {
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.save()
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"
  canvas.vectorGuiCTX.lineCap = "round"
  canvas.vectorGuiCTX.setLineDash([lineWidth * 4, lineWidth * 4])
  canvas.vectorGuiCTX.lineDashOffset = lineDashOffset

  canvas.vectorGuiCTX.beginPath()
  if (state.selectProperties.px2) {
    canvas.vectorGuiCTX.rect(
      canvas.xOffset + state.selectProperties.px1,
      canvas.yOffset + state.selectProperties.py1,
      state.selectProperties.px2 - state.selectProperties.px1,
      state.selectProperties.py2 - state.selectProperties.py1
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()
    canvas.vectorGuiCTX.setLineDash([])
    canvas.vectorGuiCTX.beginPath()
  }

  if (drawPoints) {
    let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
    let pointsKeys = [
      { x: "px1", y: "py1" },
      { x: "px2", y: "py2" },
    ]
    drawControlPoints(
      state.selectProperties,
      pointsKeys,
      canvas,
      circleRadius,
      false,
      0.5
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()

    canvas.vectorGuiCTX.beginPath()
    drawControlPoints(
      state.selectProperties,
      pointsKeys,
      canvas,
      circleRadius / 2,
      true,
      0.5
    )
    // Fill points
    canvas.vectorGuiCTX.fill()
  }

  canvas.vectorGuiCTX.restore()
}

/**
 *
 * @param {Object} state
 * @param {Object} canvas
 * @param {Float} lineDashOffset
 */
function drawSelectOutline(state, canvas, lineDashOffset) {
  let begin = performance.now()
  let lineWidth = canvas.zoom <= 8 ? 2 / canvas.zoom : 0.25
  let initialPoint

  outerLoop: for (let x = 0; x < canvas.offScreenCVS.width; x++) {
    for (let y = 0; y < canvas.offScreenCVS.height; y++) {
      if (state.selectPixelPoints[`${x},${y}`]) {
        initialPoint = state.selectPixelPoints[`${x},${y}`]
        break outerLoop
      }
    }
  }

  const directions = [
    [0, -1], // Up
    [1, 0], // Right
    [0, 1], // Down
    [-1, 0], // Left
  ]

  let currentPoint = initialPoint
  let previousDirection = 0

  // Save the context state before defining a clipping region
  canvas.vectorGuiCTX.save()
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.setLineDash([1, 1])
  canvas.vectorGuiCTX.lineDashOffset = lineDashOffset

  // Define a clipping region that's the entire canvas so the inside of the shape will be cut when clipped
  //Depending on whether selection is inversed, draw or don't draw this rect.
  //Drawing it will put the selection line on the outside of the shape. Not drawing it puts the line on the inside of the shape.
  canvas.vectorGuiCTX.rect(
    -1,
    -1,
    canvas.vectorGuiCVS.width + 1,
    canvas.vectorGuiCVS.height + 1
  )

  // Set the starting point
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + initialPoint.x,
    canvas.yOffset + initialPoint.y
  )

  do {
    for (let i = 0; i < 4; i++) {
      const newDirection = (previousDirection + i) % 4
      const [dx, dy] = directions[newDirection]

      if (
        state.selectCornersSet.has(
          `${currentPoint.x + dx},${currentPoint.y + dy}`
        )
      ) {
        const x = canvas.xOffset + currentPoint.x + dx
        const y = canvas.yOffset + currentPoint.y + dy

        canvas.vectorGuiCTX.lineTo(x, y)
        currentPoint = { x: currentPoint.x + dx, y: currentPoint.y + dy }
        previousDirection = (newDirection + 3) % 4
        break
      }
    }
  } while (
    currentPoint.x !== initialPoint.x ||
    currentPoint.y !== initialPoint.y
  )

  canvas.vectorGuiCTX.clip("evenodd")

  // Stroke the path. Only the part outside of the shape will be visible.
  canvas.vectorGuiCTX.stroke()

  // Restore the context state to remove the clipping region
  canvas.vectorGuiCTX.restore()
  let end = performance.now()
  // lineDashOffset = lineDashOffset + 0.05 >= 2 ? 0 : lineDashOffset + 0.05
  // window.requestAnimationFrame(() => render(state, canvas, lineDashOffset))
  // console.warn("drawSelectOutline: " + (end - begin) + " milliseconds")
}
