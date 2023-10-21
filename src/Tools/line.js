import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionLine } from "../Actions/actions.js"
import { renderCanvas } from "../Canvas/render.js"

//===================================//
//=== * * * Line Controller * * * ===//
//===================================//

/**
 * Supported modes: "draw, erase, inject",
 */
export function lineSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.lineStartX = state.cursorX
      state.lineStartY = state.cursorY
      renderCanvas((ctx) => {
        actionLine(
          state.cursorX,
          state.cursorY,
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          ctx,
          state.mode,
          state.brushStamp,
          state.tool.brushSize
        )
      })
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //only draw when necessary
      renderCanvas((ctx) => {
        actionLine(
          state.lineStartX,
          state.lineStartY,
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          ctx,
          state.mode,
          state.brushStamp,
          state.tool.brushSize
        )
      })
      break
    case "pointerup":
      actionLine(
        state.lineStartX,
        state.lineStartY,
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        canvas.currentLayer.ctx,
        state.mode,
        state.brushStamp,
        state.tool.brushSize
      )
      state.addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: {
          px1: state.lineStartX,
          py1: state.lineStartY,
          px2: state.cursorX,
          py2: state.cursorY,
        },
      })
      renderCanvas()
      break
    default:
    //do nothing
  }
}

export const line = {
  name: "line",
  fn: lineSteps,
  action: actionLine,
  brushSize: 1,
  disabled: false,
  options: { erase: false, inject: false },
  type: "raster",
}
