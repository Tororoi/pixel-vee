import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { modifyVectorAction, actionFill } from "../Actions/actions.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"

//===================================//
//=== * * * Fill Controller * * * ===//
//===================================//

/**
 * Fill an area with the specified color
 * Supported modes: "draw, erase"
 */
function fillSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      vectorGui.render()
      if (vectorGui.collisionPresent) {
        adjustFillSteps()
      } else {
        // //reset control points
        // vectorGui.reset() - not really needed currently since fill only uses P1
        state.vectorProperties.px1 = state.cursorX
        state.vectorProperties.py1 = state.cursorY
        actionFill(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          state.selectProperties,
          state.maskSet
        )
        //For undo ability, store starting coords and settings and pass them into actionFill
        state.addToTimeline({
          tool: state.tool,
          layer: canvas.currentLayer,
          properties: {
            vectorProperties: {
              px1: state.vectorProperties.px1 - canvas.currentLayer.x,
              py1: state.vectorProperties.py1 - canvas.currentLayer.y,
            },
            selectProperties: { ...state.selectProperties },
            maskSet: state.maskSet,
          },
        })
        renderCanvas(canvas.currentLayer)
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        adjustFillSteps()
      }
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        adjustFillSteps()
      }
      //redraw canvas to allow onscreen cursor to render
      renderCanvas(canvas.currentLayer)
    default:
    //do nothing
  }
}

/**
 * Used automatically by curve tools after curve is completed.
 * TODO: create distinct mode for adjusting
 * Ideally a user should be able to click on a curve and render it's vector UI that way.
 * Currently this modifies the history directly which is a big no no, just done for testing, only ok for now since it just modifies the curve that was just created
 */
export function adjustFillSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent) {
        state.vectorProperties[vectorGui.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedKeys.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        state.undoStack[canvas.currentVectorIndex].hidden = true
        //Only render canvas up to timeline where fill action exists while adjusting fill
        renderCanvas(
          state.undoStack[canvas.currentVectorIndex].layer,
          null,
          true,
          true,
          canvas.currentVectorIndex
        ) // render to canvas.currentVectorIndex
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        //code gets past check twice here so figure out where tool fn is being called again
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        state.undoStack[canvas.currentVectorIndex].hidden = false
        modifyVectorAction(canvas.currentVectorIndex)
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
        renderCanvas(
          state.undoStack[canvas.currentVectorIndex].layer,
          null,
          true,
          true
        )
      }
      break
    case "pointerout":
      if (vectorGui.selectedPoint.xKey) {
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
      }
      break
    default:
    //do nothing
  }
}

export const fill = {
  name: "fill",
  fn: fillSteps,
  action: actionFill,
  brushSize: 1,
  disabled: true,
  options: { contiguous: true },
  modes: { eraser: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
