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
      vectorGui.drawCursorBox(state, canvas, 2)
      break
    case "select":
      //show nothing
      break
    default:
      //TODO: erase mode is somewhat buggy with rendering. Find way to have it render without calling draw() more than needed.
      if (!vectorGui.collisionPresent) {
        renderCanvas((ctx) => {
          actionDraw(
            state.cursorX,
            state.cursorY,
            swatches.primary.color,
            state.brushStamp,
            state.tool.brushSize,
            ctx,
            state.mode,
            state.drawnPointsSet,
            null,
            true
          )
        })
        if (state.mode === "erase") {
          vectorGui.drawCursorBox(state, canvas, 1)
          // vectorGui.drawSelectOutline(state, canvas, state.selectPixelSet, 0.5)
        }
      } else {
        renderCanvas()
      }
  }
}
