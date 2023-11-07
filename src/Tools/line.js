import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionLine } from "../Actions/actions.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"

//===================================//
//=== * * * Line Controller * * * ===//
//===================================//

/**
 * Supported modes: "draw, erase, inject",
 * TODO: add vector line tool
 */
function lineSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.lineStartX = state.cursorX
      state.lineStartY = state.cursorY
      renderCanvas(canvas.currentLayer, (ctx) => {
        actionLine(
          state.cursorX,
          state.cursorY,
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          canvas.currentLayer,
          ctx,
          state.tool.modes,
          state.brushStamp,
          state.tool.brushSize,
          state.maskSet,
          null
        )
      })
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //only draw when necessary
      renderCanvas(canvas.currentLayer, (ctx) => {
        actionLine(
          state.lineStartX,
          state.lineStartY,
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          canvas.currentLayer,
          ctx,
          state.tool.modes,
          state.brushStamp,
          state.tool.brushSize,
          state.maskSet,
          null
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
        canvas.currentLayer,
        canvas.currentLayer.ctx,
        state.tool.modes,
        state.brushStamp,
        state.tool.brushSize,
        state.maskSet,
        null
      )
      let maskArray = coordArrayFromSet(
        state.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y
      )
      state.addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: {
          px1: state.lineStartX - canvas.currentLayer.x,
          py1: state.lineStartY - canvas.currentLayer.y,
          px2: state.cursorX - canvas.currentLayer.x,
          py2: state.cursorY - canvas.currentLayer.y,
          maskSet: state.maskSet,
          maskArray,
        },
      })
      renderCanvas(canvas.currentLayer)
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
  options: {},
  modes: { eraser: false, inject: false },
  type: "raster",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
