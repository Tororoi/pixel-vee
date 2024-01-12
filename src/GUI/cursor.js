import { brushStamps } from "../Context/brushStamps.js"
// import { state } from "../Context/state.js"
// import { canvas } from "../Context/canvas.js"
// import { swatches } from "../Context/swatch.js"
import { actionDraw } from "../Actions/pointerActions.js"
import { vectorGui } from "./vector.js"
import { renderCanvas } from "../Canvas/render.js"

//===========================================//
//=== * * * Graphics User Interface * * * ===//
//===========================================//

/**
 * Render cursor based on active tool
 * @param {Object} state
 * @param {Object} canvas
 * @param {Object} swatches
 */
export function renderCursor(state, canvas, swatches) {
  switch (state.tool.name) {
    case "grab":
      //show nothing
      break
    case "eyedropper":
      //empty square
      drawCursorBox(state, canvas, 2)
      break
    case "select":
      //show nothing
      break
    case "move":
      //show nothing
      break
    default:
      //TODO: erase mode is somewhat buggy with rendering. Find way to have it render without calling draw() more than needed.
      if (!vectorGui.collisionPresent) {
        renderCanvas(canvas.currentLayer)
        actionDraw(
          state.cursorX,
          state.cursorY,
          state.boundaryBox,
          state.selectionInversed,
          swatches.primary.color,
          brushStamps[state.tool.brushType][state.tool.brushSize]["0,0"],
          state.tool.brushSize,
          canvas.currentLayer,
          state.tool.modes,
          state.maskSet,
          state.seenPixelsSet,
          null,
          true,
          true
        )
        if (state.tool.modes?.eraser) {
          drawCursorBox(state, canvas, 1)
          // vectorGui.drawSelectOutline(state, canvas, state.selectPixelSet, 0.5)
        }
      } else {
        renderCanvas(canvas.currentLayer) //hides existing cursor if one is drawn
      }
  }
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

  // Create a Set from brushStamps[state.tool.brushType][state.tool.brushSize]//TODO: make set when creating brush stamp so it does not need to be defined here.
  const pixelSet = new Set(
    brushStamps[state.tool.brushType][state.tool.brushSize]["0,0"].map(
      (p) => `${p.x},${p.y}`
    )
  )

  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "white"

  for (const pixel of brushStamps[state.tool.brushType][state.tool.brushSize][
    "0,0"
  ]) {
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
