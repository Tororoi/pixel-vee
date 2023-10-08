import { actionDraw } from "../Tools/actions.js"
import { vectorGui } from "./vector.js"
import { renderCanvas } from "../Canvas/render.js"

//===========================================//
//=== * * * Graphics User Interface * * * ===//
//===========================================//

export function renderRasterGUI(state, canvas, swatches) {
  canvas.rasterGuiCTX.clearRect(
    0,
    0,
    canvas.rasterGuiCVS.width / canvas.zoom,
    canvas.rasterGuiCVS.height / canvas.zoom
  )
}

export function renderCursor(state, canvas, swatches) {
  switch (state.tool.name) {
    case "grab":
      //show nothing
      break
    case "eyedropper":
      //empty square
      vectorGui.drawCursorBox(state, canvas)
      break
    default:
      //TODO: erase mode is somewhat buggy with rendering. Find way to have it render without calling draw() more than needed.
      if (state.mode === "erase") {
        renderCanvas()
        actionDraw(
          state.cursorWithCanvasOffsetX,
          state.cursorWithCanvasOffsetY,
          swatches.primary.color,
          state.brushStamp,
          state.tool.brushSize,
          canvas.onScreenCTX, //must be onScreen to work with eraser
          state.mode
        )
        // vectorGui.drawCursorBox(state, canvas)
      } else {
        drawCurrentPixel(state, canvas, swatches)
      }
    // vectorGui.drawCursorBox(state, canvas, 0.5)
  }
}

export function drawCurrentPixel(state, canvas, swatches) {
  //draw onscreen current pixel
  renderRasterGUI(state, canvas, swatches)
  canvas.rasterGuiCTX.fillStyle = swatches.primary.color.color
  const processBrushStamp = (action, pixel) => {
    const x = Math.ceil(state.cursorX - state.tool.brushSize / 2) + pixel.x
    const y = Math.ceil(state.cursorY - state.tool.brushSize / 2) + pixel.y
    const drawX =
      Math.ceil(state.cursorWithCanvasOffsetX - state.tool.brushSize / 2) +
      pixel.x
    const drawY =
      Math.ceil(state.cursorWithCanvasOffsetY - state.tool.brushSize / 2) +
      pixel.y

    if (state.pointsSet) {
      const key = `${x},${y}`
      if (state.pointsSet.has(key)) {
        return // skip this point
      }
    }

    action(drawX, drawY)
  }
  switch (state.mode) {
    case "erase":
      state.brushStamp.forEach((p) => {
        processBrushStamp(
          (x, y) => canvas.rasterGuiCTX.clearRect(x, y, 1, 1),
          p
        )
      })
      break
    default:
      state.brushStamp.forEach((p) => {
        processBrushStamp((x, y) => canvas.rasterGuiCTX.fillRect(x, y, 1, 1), p)
      })
  }
}
