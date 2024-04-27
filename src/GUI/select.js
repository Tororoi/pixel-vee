import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import {
  checkSquarePointCollision,
  checkAreaCollision,
} from "../utils/guiHelpers.js"
import { getAngle } from "../utils/trig.js"

/**
 * Render selection outline and control points
 * @param {number} lineDashOffset - (Float)
 */
export function renderSelectionCVS(lineDashOffset = 0.5) {
  canvas.selectionGuiCTX.clearRect(
    0,
    0,
    canvas.selectionGuiCVS.width,
    canvas.selectionGuiCVS.height
  )
  let isRasterSelection = state.boundaryBox.xMax !== null
  let isVectorSelection = state.selectedVectorIndicesSet.size > 0
  if (isRasterSelection || isVectorSelection) {
    //Create greyed out area around selection
    //clip to selection
    canvas.selectionGuiCTX.save()
    canvas.selectionGuiCTX.beginPath()
    if (isRasterSelection) {
      //define rectangle for canvas area
      canvas.selectionGuiCTX.rect(
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      //define rectangle for selection area
      canvas.selectionGuiCTX.rect(
        canvas.xOffset + state.boundaryBox.xMin,
        canvas.yOffset + state.boundaryBox.yMin,
        state.boundaryBox.xMax - state.boundaryBox.xMin,
        state.boundaryBox.yMax - state.boundaryBox.yMin
      )
      canvas.selectionGuiCTX.clip("evenodd")
      // canvas.selectionGuiCTX.globalAlpha = 0.5
      canvas.selectionGuiCTX.fillStyle = "rgba(255, 255, 255, 0.1)"
      canvas.selectionGuiCTX.fillRect(
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      canvas.selectionGuiCTX.restore()
      let shouldRenderPoints =
        state.tool.name === "select" ||
        (state.tool.name === "move" && canvas.pastedLayer)
      renderSelectionBoxOutline(lineDashOffset, shouldRenderPoints)
    } else if (isVectorSelection && vectorGui.outlineVectorSelection) {
      //define rectangle for canvas area
      canvas.selectionGuiCTX.rect(
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      //grey out canvas area
      canvas.selectionGuiCTX.fillStyle = "rgba(255, 255, 255, 0.1)"
      canvas.selectionGuiCTX.fillRect(
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      //construct vector paths
      const xOffset = canvas.currentLayer.x + canvas.xOffset
      const yOffset = canvas.currentLayer.y + canvas.yOffset
      canvas.selectionGuiCTX.beginPath()
      //Need to chain paths?
      for (let vectorIndex of state.selectedVectorIndicesSet) {
        const vector = state.vectors[vectorIndex]
        if (vector.hidden || vector.removed) continue
        //switch based on vector type
        switch (vector.vectorProperties.type) {
          case "fill": {
            //need idea to render selection of fill vector
            const { px1, py1 } = vector.vectorProperties
            canvas.selectionGuiCTX.moveTo(
              xOffset + px1 + 0.5,
              yOffset + py1 + 0.5
            )
            canvas.selectionGuiCTX.lineTo(
              xOffset + px1 + 0.5,
              yOffset + py1 + 0.5
            )
            break
          }
          case "line": {
            const { px1, py1, px2, py2 } = vector.vectorProperties
            canvas.selectionGuiCTX.moveTo(
              xOffset + px1 + 0.5,
              yOffset + py1 + 0.5
            )
            canvas.selectionGuiCTX.lineTo(
              xOffset + px2 + 0.5,
              yOffset + py2 + 0.5
            )
            break
          }
          case "quadCurve": {
            const { px1, py1, px2, py2, px3, py3 } = vector.vectorProperties
            canvas.selectionGuiCTX.moveTo(
              xOffset + px1 + 0.5,
              yOffset + py1 + 0.5
            )
            canvas.selectionGuiCTX.quadraticCurveTo(
              xOffset + px3 + 0.5,
              yOffset + py3 + 0.5,
              xOffset + px2 + 0.5,
              yOffset + py2 + 0.5
            )
            break
          }
          case "cubicCurve": {
            const { px1, py1, px2, py2, px3, py3, px4, py4 } =
              vector.vectorProperties
            canvas.selectionGuiCTX.moveTo(
              xOffset + px1 + 0.5,
              yOffset + py1 + 0.5
            )
            canvas.selectionGuiCTX.bezierCurveTo(
              xOffset + px3 + 0.5,
              yOffset + py3 + 0.5,
              xOffset + px4 + 0.5,
              yOffset + py4 + 0.5,
              xOffset + px2 + 0.5,
              yOffset + py2 + 0.5
            )
            break
          }
          case "ellipse": {
            const {
              px1,
              py1,
              px2,
              py2,
              px3,
              py3,
              radA,
              radB,
              angle,
              x1Offset,
              y1Offset,
            } = vector.vectorProperties
            //Don't let radii be negative with offset
            let majorAxis = radA + x1Offset / 2 > 0 ? radA + x1Offset / 2 : 0
            let minorAxis = radB + y1Offset / 2 > 0 ? radB + y1Offset / 2 : 0

            if (!Number.isInteger(px3)) {
              minorAxis = majorAxis
            }
            // Calculate ellipse center
            let centerX = xOffset + px1 + 0.5 + x1Offset / 2
            let centerY = yOffset + py1 + 0.5 + y1Offset / 2

            // Calculate the angle t (e.g., t = 0 for the point on the right side of the ellipse)
            let t = 0 // Starting angle on the ellipse (can be adjusted if needed)

            // Calculate a point on the ellipse using the parametric equation of the ellipse
            let pointX =
              centerX +
              majorAxis * Math.cos(t) * Math.cos(angle) -
              minorAxis * Math.sin(t) * Math.sin(angle)
            let pointY =
              centerY +
              majorAxis * Math.cos(t) * Math.sin(angle) +
              minorAxis * Math.sin(t) * Math.cos(angle)

            // Move to point on ellipse to start drawing
            canvas.selectionGuiCTX.moveTo(pointX, pointY)

            // Drawing the ellipse
            canvas.selectionGuiCTX.ellipse(
              centerX,
              centerY,
              majorAxis,
              minorAxis,
              angle,
              0,
              2 * Math.PI
            )
            break
          }
          default:
          //do nothing
        }
      }
      // stroke vector paths with thick squared off dashed line then stroke vector paths with slightly thinner eraser (use some built-in html canvas composite mode) to clear greyed out area for vectors
      let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
      //Draw outline border by drawing different thicknesses of lines
      canvas.selectionGuiCTX.lineWidth = lineWidth * 19
      canvas.selectionGuiCTX.lineCap = "round"
      canvas.selectionGuiCTX.strokeStyle = "white"
      canvas.selectionGuiCTX.stroke()
      //Make border a dotted line
      canvas.selectionGuiCTX.lineDashOffset = lineDashOffset * 2
      canvas.selectionGuiCTX.setLineDash([lineWidth * 12, lineWidth * 12])
      canvas.selectionGuiCTX.lineWidth = lineWidth * 20
      canvas.selectionGuiCTX.lineCap = "butt"
      canvas.selectionGuiCTX.strokeStyle = "black"
      canvas.selectionGuiCTX.stroke()
      canvas.selectionGuiCTX.setLineDash([])
      //clear greyed out area for vectors
      canvas.selectionGuiCTX.lineWidth = lineWidth * 17
      canvas.selectionGuiCTX.lineCap = "round"
      canvas.selectionGuiCTX.strokeStyle = "black"
      canvas.selectionGuiCTX.stroke()
      canvas.selectionGuiCTX.restore()

      //render transform box control points
      // renderSelectionBoxOutline(lineDashOffset, true)
    }
    //TODO: (Medium Priority) Animating the selection currently not possible because animation is interrupted by renderCanvas() call taking up the main thread
    // All rendering would need to be part of the animation loop or on a separate thread. Maybe the marching ants could be done with css instead of on the canvas?
    // window.requestAnimationFrame(() => {
    //   renderSelectionCVS(lineDashOffset < 6 ? lineDashOffset + 0.1 : 0)
    // })
  }
}

/**
 * Render selection outline and control points
 * @param {number} lineDashOffset - (Float)
 * @param {boolean} drawPoints - if true, draw control points
 */
export function renderSelectionBoxOutline(lineDashOffset, drawPoints) {
  // Setting of context attributes.
  let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  canvas.selectionGuiCTX.save()
  canvas.selectionGuiCTX.lineWidth = lineWidth * 2
  canvas.selectionGuiCTX.strokeStyle = "white"
  canvas.selectionGuiCTX.fillStyle = "white"
  canvas.selectionGuiCTX.lineCap = "round"
  canvas.selectionGuiCTX.lineDashOffset = lineDashOffset

  if (state.boundaryBox.xMax !== null) {
    if (!canvas.pastedLayer) {
      //if active unconfirmed paste action, don't draw the dashed selection outline
      canvas.selectionGuiCTX.setLineDash([lineWidth * 6, lineWidth * 6])
    }
    canvas.selectionGuiCTX.beginPath()
    canvas.selectionGuiCTX.rect(
      canvas.xOffset + state.boundaryBox.xMin,
      canvas.yOffset + state.boundaryBox.yMin,
      state.boundaryBox.xMax - state.boundaryBox.xMin,
      state.boundaryBox.yMax - state.boundaryBox.yMin
    )
    // Stroke non-filled lines
    canvas.selectionGuiCTX.stroke()
    //restore line dash
    canvas.selectionGuiCTX.setLineDash([])
  }

  if (drawPoints) {
    let circleRadius = canvas.zoom <= 4 ? 8 / canvas.zoom : 1.5
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

    canvas.selectionGuiCTX.beginPath()
    drawSelectControlPoints(
      state.boundaryBox,
      pointsKeys,
      circleRadius / 2,
      true,
      0.5
    )
    // Fill points
    canvas.selectionGuiCTX.fill()
  }

  canvas.selectionGuiCTX.restore()
}

// /**
//  * TODO: (Medium Priority) May be used for freeform selections in the future
//  * @param {number} lineDashOffset - (Float)
//  */
// export function drawSelectOutline(lineDashOffset) {
//   let lineWidth = canvas.zoom <= 8 ? 2 / canvas.zoom : 0.25
//   let initialPoint

//   outerLoop: for (let x = 0; x < canvas.offScreenCVS.width; x++) {
//     for (let y = 0; y < canvas.offScreenCVS.height; y++) {
//       if (state.selectPixelPoints[`${x},${y}`]) {
//         initialPoint = state.selectPixelPoints[`${x},${y}`]
//         break outerLoop
//       }
//     }
//   }

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
//     canvas.xOffset + initialPoint.x,
//     canvas.yOffset + initialPoint.y
//   )

//   do {
//     for (let i = 0; i < 4; i++) {
//       const newDirection = (previousDirection + i) % 4
//       const [dx, dy] = directions[newDirection]

//       if (
//         state.selectCornersSet.has(
//           `${currentPoint.x + dx},${currentPoint.y + dy}`
//         )
//       ) {
//         const x = canvas.xOffset + currentPoint.x + dx
//         const y = canvas.yOffset + currentPoint.y + dy

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
 * @param {object} boundaryBox - The boundary box of the selection
 * @param {Array} pointsKeys - The keys of the control points
 * @param {number} radius - (Float)
 * @param {boolean} modify - if true, check for collision with cursor and modify radius
 * @param {number} offset - (Integer)
 * @param {object} vectorAction - The vector action to be rendered (NOTE: Not certain if ever needed for this function)
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
  const midX = xMin + (xMax - xMin) / 2
  const midY = yMin + (yMax - yMin) / 2

  //handle collision with inner area of selection
  if (
    state.cursorX >= xMin &&
    state.cursorX < xMax &&
    state.cursorY >= yMin &&
    state.cursorY < yMax
  ) {
    vectorGui.setCollision({ x: "px9", y: "py9" })
  }

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
 * TODO: (Low Priority) move drawing logic to separate function so modify param doesn't need to be used
 * @param {object} keys - The keys of the control point
 * @param {object} point - The control point
 * @param {number} radius - (Float)
 * @param {boolean} modify - if true, check for collision with cursor and modify radius
 * @param {number} offset - (Float)
 * @param {object} vectorAction - The vector action to be rendered (NOTE: Not certain if ever needed for this function)
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
    const collisionPresent =
      checkSquarePointCollision(
        state.cursorX,
        state.cursorY,
        point.x - offset + xOffset,
        point.y - offset + yOffset,
        r * 2.125
      ) ||
      (["px2", "px6"].includes(keys.x) &&
        checkAreaCollision(
          state.cursorX,
          state.cursorY,
          state.boundaryBox.xMin + r * 2,
          point.y - offset + yOffset - r * 2,
          state.boundaryBox.xMax - r * 2 - 1,
          point.y - offset + yOffset + r * 2
        )) ||
      (["px4", "px8"].includes(keys.x) &&
        checkAreaCollision(
          state.cursorX,
          state.cursorY,
          point.x - offset + xOffset - r * 2,
          state.boundaryBox.yMin + r * 2,
          point.x - offset + xOffset + r * 2,
          state.boundaryBox.yMax - r * 2 - 1
        ))
    if (collisionPresent) {
      //cursor collision, not necessarily selected point
      r = radius * 2.125
      vectorGui.setCollision(keys)
    } else if (vectorGui.selectedPoint.xKey === keys.x && !vectorAction) {
      //selected point must always be considered a collision
      vectorGui.setCollision(keys)
    }
  }

  //draw squares for control points 1, 3, 5, and 7 (corners)
  if (
    keys.x === "px1" ||
    keys.x === "px3" ||
    keys.x === "px5" ||
    keys.x === "px7"
  ) {
    canvas.selectionGuiCTX.rect(
      canvas.xOffset + xOffset + point.x - offset + 0.5 - r,
      canvas.yOffset + yOffset + point.y - offset + 0.5 - r,
      r * 2,
      r * 2
    )
  }
  //draw diamonds for control points 2, 4, 6, and 8 (sides)
  if (
    keys.x === "px2" ||
    keys.x === "px4" ||
    keys.x === "px6" ||
    keys.x === "px8"
  ) {
    r *= Math.sqrt(2)
    canvas.selectionGuiCTX.moveTo(
      canvas.xOffset + xOffset + point.x - offset + 0.5 - r,
      canvas.yOffset + yOffset + point.y - offset + 0.5
    )
    canvas.selectionGuiCTX.lineTo(
      canvas.xOffset + xOffset + point.x - offset + 0.5,
      canvas.yOffset + yOffset + point.y - offset + 0.5 - r
    )
    canvas.selectionGuiCTX.lineTo(
      canvas.xOffset + xOffset + point.x - offset + 0.5 + r,
      canvas.yOffset + yOffset + point.y - offset + 0.5
    )
    canvas.selectionGuiCTX.lineTo(
      canvas.xOffset + xOffset + point.x - offset + 0.5,
      canvas.yOffset + yOffset + point.y - offset + 0.5 + r
    )
  }
}

/**
 * Set css cursor for selection interaction
 */
function setSelectionCursorStyle() {
  if (!vectorGui.selectedCollisionPresent) {
    canvas.vectorGuiCVS.style.cursor = state.tool.cursor
    return
  }

  //Handle cursor for collisions
  const xKey = vectorGui.collidedPoint.xKey
  if (["px1", "px5"].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = "nwse-resize"
  } else if (["px3", "px7"].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = "nesw-resize"
  } else if (["px2", "px6"].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = "ns-resize"
  } else if (["px4", "px8"].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = "ew-resize"
  } else if (xKey === "px9") {
    canvas.vectorGuiCVS.style.cursor = "move"
  }
}
