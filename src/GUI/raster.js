// import { state } from "../Context/state.js"
// import { canvas } from "../Context/canvas.js"
// import { swatches } from "../Context/swatch.js"
import { actionDraw } from "../Actions/actions.js"
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
      vectorGui.drawCursorBox(state, canvas, 2)
      break
    case "select":
      //show nothing
      break
    default:
      //TODO: erase mode is somewhat buggy with rendering. Find way to have it render without calling draw() more than needed.
      if (!vectorGui.collisionPresent) {
        renderCanvas(canvas.currentLayer, (ctx) => {
          actionDraw(
            state.cursorX,
            state.cursorY,
            swatches.primary.color,
            state.brushStamp,
            "0,0",
            state.tool.brushSize,
            canvas.currentLayer,
            ctx,
            state.mode,
            state.maskSet,
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
        renderCanvas(canvas.currentLayer) //hides existing cursor if one is drawn
      }
  }
}
