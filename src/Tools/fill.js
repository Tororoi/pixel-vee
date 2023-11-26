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
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        adjustFillSteps()
      }
      //redraw canvas to allow onscreen cursor to render
      renderCanvas(canvas.currentLayer)
      break
    default:
    //do nothing
  }
}

/**
 * Used automatically by fill tool after fill is completed.
 */
export function adjustFillSteps() {
  let action = state.undoStack[canvas.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent) {
        state.vectorProperties[vectorGui.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedKeys.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        action.hidden = true
        //Only render canvas up to timeline where fill action exists while adjusting fill
        renderCanvas(action.layer, true, canvas.currentVectorIndex) // render to canvas.currentVectorIndex
        //put offscreen layer canvas onto preview canvas
        canvas.previewCTX.clearRect(
          0,
          0,
          canvas.previewCVS.width,
          canvas.previewCVS.height
        )
        canvas.previewCTX.drawImage(action.layer.cvs, 0, 0)
        //render preview fill
        actionFill(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          state.selectProperties,
          state.maskSet,
          true
        )
        //render actions to preview canvas from currentVectorIndex to end of timeline
        //
        action.layer.onscreenCtx.drawImage(
          canvas.previewCVS,
          canvas.xOffset,
          canvas.yOffset,
          canvas.previewCVS.width,
          canvas.previewCVS.height
        )
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        //code gets past check twice here so figure out where tool fn is being called again
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        renderCanvas(action.layer)
        //put offscreen layer canvas onto preview canvas
        canvas.previewCTX.clearRect(
          0,
          0,
          canvas.previewCVS.width,
          canvas.previewCVS.height
        )
        canvas.previewCTX.drawImage(action.layer.cvs, 0, 0)
        //render preview fill
        actionFill(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          state.selectProperties,
          state.maskSet,
          true
        )
        //render actions to preview canvas from currentVectorIndex to end of timeline
        //
        action.layer.onscreenCtx.drawImage(
          canvas.previewCVS,
          canvas.xOffset,
          canvas.yOffset,
          canvas.previewCVS.width,
          canvas.previewCVS.height
        )
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        action.hidden = false
        modifyVectorAction(canvas.currentVectorIndex)
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
        renderCanvas(action.layer, true)
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
  brushType: "circle",
  disabled: true,
  options: { contiguous: true },
  modes: { eraser: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
