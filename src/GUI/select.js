import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"

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
    vectorGui.drawControlPoints(
      state.selectProperties,
      pointsKeys,
      circleRadius,
      false,
      0.5
    )
    // Stroke non-filled lines
    canvas.vectorGuiCTX.stroke()

    canvas.vectorGuiCTX.beginPath()
    vectorGui.drawControlPoints(
      state.selectProperties,
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
