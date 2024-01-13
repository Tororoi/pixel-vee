import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { drawCirclePath, checkPointCollision } from "../utils/guiHelpers.js"

//TODO: currently only good for solid shapes. Must also draw outline for holes in shape. Need hole searching algorithm, then run tracing on each hole
//pass set to function instead of recalculating it every time
//pass dashOffset for animating marching ants
// function drawSelectOutline(state, canvas, lineDashOffset) {
//   let lineWidth = canvas.zoom <= 8 ? 2 / canvas.zoom : 0.25
//   let brushOffset = Math.floor(state.tool.brushSize / 2)

//   const pixelSet = new Set()
//   for (const pixel of brushStamps[state.tool.brushType][state.tool.brushSize]) {
//     pixelSet.add(`${pixel.x},${pixel.y}`)
//     pixelSet.add(`${pixel.x + 1},${pixel.y}`)
//     pixelSet.add(`${pixel.x},${pixel.y + 1}`)
//     pixelSet.add(`${pixel.x + 1},${pixel.y + 1}`)
//   }

//   let initialPoint = brushStamps[state.tool.brushType][state.tool.brushSize].reduce((acc, cur) => {
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
 * TODO: instead of making select p1 to p4, generate and detect control points using bounding box
 * TODO: use different collision logic for select tool. Along with corner control points, detect if cursor is within range of an edge for pure x or y manipulation, and detect if cursor is inside area for dragging.
 * @param {Float} lineDashOffset
 * @param {Boolean} drawPoints
 */
export function renderSelectVector(vectorGui, lineDashOffset, drawPoints) {
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 4 ? 1 / canvas.zoom : 0.25
  canvas.vectorGuiCTX.save()
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"
  canvas.vectorGuiCTX.fillStyle = "white"
  canvas.vectorGuiCTX.lineCap = "round"
  canvas.vectorGuiCTX.lineDashOffset = lineDashOffset

  if (state.boundaryBox.xMax !== null) {
    canvas.vectorGuiCTX.setLineDash([lineWidth * 4, lineWidth * 4])
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.rect(
      canvas.xOffset + state.boundaryBox.xMin,
      canvas.yOffset + state.boundaryBox.yMin,
      state.boundaryBox.xMax - state.boundaryBox.xMin,
      state.boundaryBox.yMax - state.boundaryBox.yMin
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()
  }
  canvas.vectorGuiCTX.setLineDash([])
  canvas.vectorGuiCTX.beginPath()

  if (drawPoints) {
    let circleRadius = canvas.zoom <= 8 ? 8 / canvas.zoom : 1
    let pointsKeys = [
      { x: "px1", y: "py1" },
      { x: "px2", y: "py2" },
      { x: "px3", y: "py3" },
      { x: "px4", y: "py4" },
      { x: "px5", y: "py5" },
      { x: "px6", y: "py6" },
      { x: "px7", y: "py7" },
      { x: "px8", y: "py8" },
    ]

    //TODO: handle collision with unique selection logic
    drawSelectControlPoints(
      state.boundaryBox,
      pointsKeys,
      circleRadius,
      false,
      0.5
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()

    canvas.vectorGuiCTX.beginPath()
    drawSelectControlPoints(
      state.boundaryBox,
      pointsKeys,
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
 * @param {Float} lineDashOffset
 */
export function drawSelectOutline(lineDashOffset) {
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
}

/**
 * @param {Object} vectorProperties
 * @param {Integer} radius
 * @param {Boolean} modify
 * @param {Integer} offset
 * @param {Object} vectorAction
 */
function drawSelectControlPoints(
  boundaryBox,
  pointsKeys,
  radius,
  modify = false,
  offset = 0,
  vectorAction = null
) {
  const { xMin, yMin, xMax, yMax } = boundaryBox
  const midX = Math.floor(xMin + (xMax - xMin) / 2)
  const midY = Math.floor(yMin + (yMax - yMin) / 2)

  const points = [
    { x: xMin, y: yMin }, // Top-left
    { x: midX, y: yMin }, // Top-center
    { x: xMax, y: yMin }, // Top-right
    { x: xMax, y: midY }, // Right-center
    { x: xMax, y: yMax }, // Bottom-right
    { x: midX, y: yMax }, // Bottom-center
    { x: xMin, y: yMax }, // Bottom-left
    { x: xMin, y: midY }, // Left-center
  ]
  for (let keys of pointsKeys) {
    //point is at index in points array that matches index of keys in pointsKeys array
    const point = points[pointsKeys.indexOf(keys)]
    handleSelectCollisionAndDraw(
      keys,
      point,
      radius,
      modify,
      offset,
      vectorAction
    )
  }

  setSelectionCursorStyle()
}

/**
 * TODO: move drawing logic to separate function so modify param doesn't need to be used
 * @param {Object} keys
 * @param {Object} point
 * @param {Float} radius
 * @param {Boolean} modify - if true, check for collision with cursor and modify radius
 * @param {Float} offset
 * @param {Object} vectorAction
 */
function handleSelectCollisionAndDraw(
  keys,
  point,
  radius,
  modify,
  offset,
  vectorAction
) {
  let r = state.touch ? radius * 2 : radius
  const xOffset = vectorAction ? vectorAction.layer.x : 0
  const yOffset = vectorAction ? vectorAction.layer.y : 0

  if (modify) {
    if (vectorGui.selectedPoint.xKey === keys.x && !vectorAction) {
      //selected point
      // r = radius * 2.125 // increase  radius of fill to match stroked circle
      vectorGui.setCollision(keys)
      if (
        checkPointCollision(
          state.cursorX,
          state.cursorY,
          point.x - offset + xOffset,
          point.y - offset + yOffset,
          r * 2.125
        )
      ) {
        r = radius * 2.125
      }
    } else if (
      checkPointCollision(
        state.cursorX,
        state.cursorY,
        point.x - offset + xOffset,
        point.y - offset + yOffset,
        r * 2.125
      )
    ) {
      //cursor collision, not selected point
      r = radius * 2.125
      vectorGui.setCollision(keys)
    }
  }

  drawCirclePath(
    canvas,
    canvas.xOffset + xOffset,
    canvas.yOffset + yOffset,
    point.x - offset,
    point.y - offset,
    r
  )
}

/**
 * Set css cursor for selection interaction
 * @returns
 */
function setSelectionCursorStyle() {
  if (!vectorGui.collisionPresent) {
    canvas.vectorGuiCVS.style.cursor = state.tool.cursor
    return
  }

  //If pointer is colliding with a vector control point:
  // if (state.tool.name !== "move") {
  //   canvas.vectorGuiCVS.style.cursor = "move" //TODO: maybe use grab/ grabbing
  // } else {
  //Handle cursor for transform
  const xKey = vectorGui.collidedKeys.xKey
  if (["px1", "px5"].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = "nwse-resize"
  } else if (["px3", "px7"].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = "nesw-resize"
  } else if (["px2", "px6"].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = "ns-resize"
  } else if (["px4", "px8"].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = "ew-resize"
  }
  // }
}
