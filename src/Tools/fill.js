import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionFill } from "../Actions/pointerActions.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import { vectorGui, createActiveIndexesForRender } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { updateVectorProperties } from "../utils/vectorHelpers.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"

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
          state.boundaryBox,
          state.selectionInversed,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          state.selectProperties,
          state.maskSet
        )
        //For undo ability, store starting coords and settings and pass them into actionFill
        let maskArray = coordArrayFromSet(
          state.maskSet,
          canvas.currentLayer.x,
          canvas.currentLayer.y
        )
        addToTimeline({
          tool: state.tool,
          layer: canvas.currentLayer,
          properties: {
            vectorProperties: {
              px1: state.vectorProperties.px1 - canvas.currentLayer.x,
              py1: state.vectorProperties.py1 - canvas.currentLayer.y,
            },
            selectProperties: { ...state.selectProperties },
            maskArray,
            boundaryBox: { ...state.boundaryBox },
            selectionInversed: state.selectionInversed,
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
 * TODO: for linking fill vector, fill would be limited by active linked vectors as borders, position unchanged
 * How should fill vector be linked, since it won't be via positioning?
 */
export function adjustFillSteps() {
  let currentVector = state.undoStack[canvas.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent) {
        state.vectorProperties[vectorGui.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedKeys.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        state.vectorsSavedProperties[canvas.currentVectorIndex] = {
          ...currentVector.properties.vectorProperties,
        }
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        state.activeIndexes = createActiveIndexesForRender(
          currentVector,
          state.vectorsSavedProperties,
          state.undoStack
        )
        renderCanvas(currentVector.layer, true, state.activeIndexes, true)
        // renderCanvas(currentVector.layer, true)
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        //code gets past check twice here so figure out where tool fn is being called again
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        renderCanvas(currentVector.layer, true, state.activeIndexes)
        // renderCanvas(currentVector.layer, true)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        renderCanvas(currentVector.layer, true, state.activeIndexes)
        // renderCanvas(currentVector.layer, true)
        modifyVectorAction(currentVector)
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
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
  brushSize: 1,
  brushType: "circle",
  disabled: true,
  options: { contiguous: { active: true } },
  modes: { eraser: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
