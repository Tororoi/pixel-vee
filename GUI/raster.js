import { actionDraw } from "../Tools/actions.js"
import { vectorGui, drawCursorBox } from "./vector.js"

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
      drawCursorBox(state, canvas)
      break
    default:
      //TODO: erase mode is somewhat buggy with rendering. Find way to have it render without calling draw() more than needed.
      if (state.mode === "erase") {
        canvas.draw(canvas)
        actionDraw(
          state.cursorWithCanvasOffsetX,
          state.cursorWithCanvasOffsetY,
          swatches.primary.color,
          state.brushStamp,
          state.tool.brushSize,
          canvas.onScreenCTX, //must be onScreen to work with eraser
          state.mode
        )
        // drawCursorBox(state, canvas)
      } else {
        drawCurrentPixel(state, canvas, swatches)
      }
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
    canvas.rasterGuiCTX,
    state.mode
  )
}
