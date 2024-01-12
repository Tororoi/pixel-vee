import { keys } from "../Shortcuts/keys.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionLine } from "../Actions/actions.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"

//===================================//
//=== * * * Line Controller * * * ===//
//===================================//

/**
 * Supported modes: "draw, erase, inject",
 * TODO: add vector line tool. A raster line tool would still be present for ease of use.
 */
function lineSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.lineStartX = state.cursorX
      state.lineStartY = state.cursorY
      renderCanvas(canvas.currentLayer)
      //preview line
      actionLine(
        state.cursorX,
        state.cursorY,
        state.cursorX,
        state.cursorY,
        state.boundaryBox,
        state.selectionInversed,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
        null,
        true
      )
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //only draw when necessary
      renderCanvas(canvas.currentLayer)
      //preview line
      actionLine(
        state.lineStartX,
        state.lineStartY,
        state.cursorX,
        state.cursorY,
        state.boundaryBox,
        state.selectionInversed,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
        null,
        true
      )
      break
    case "pointerup":
      actionLine(
        state.lineStartX,
        state.lineStartY,
        state.cursorX,
        state.cursorY,
        state.boundaryBox,
        state.selectionInversed,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
        null
      )
      let maskArray = coordArrayFromSet(
        state.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y
      )
      addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: {
          px1: state.lineStartX - canvas.currentLayer.x,
          py1: state.lineStartY - canvas.currentLayer.y,
          px2: state.cursorX - canvas.currentLayer.x,
          py2: state.cursorY - canvas.currentLayer.y,
          maskArray,
          boundaryBox: { ...state.boundaryBox },
          selectionInversed: state.selectionInversed,
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
  brushSize: 1,
  brushType: "circle",
  disabled: false,
  options: {},
  modes: { eraser: false, inject: false },
  type: "raster",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
