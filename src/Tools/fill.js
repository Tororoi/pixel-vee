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
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import {
  adjustVectorSteps,
  moveVectorRotationPointSteps,
  rerouteVectorStepsAction,
  transformVectorSteps,
} from "./transform.js"

//===================================//
//=== * * * Fill Controller * * * ===//
//===================================//

/**
 * Fill an area with the specified color
 * Supported modes: "draw, erase"
 */
function fillSteps() {
  if (rerouteVectorStepsAction()) return
  switch (canvas.pointerEvent) {
    case "pointerdown": {
      //reset control points
      vectorGui.reset()
      state.vectorProperties.type = state.tool.name
      state.vectorProperties.px1 = state.cursorX
      state.vectorProperties.py1 = state.cursorY
      actionFill(
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.boundaryBox,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        state.maskSet
      )
      //For undo ability, store starting coords and settings and pass them into actionFill
      let maskArray = coordArrayFromSet(
        state.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y
      )
      //correct boundary box for layer offset
      const boundaryBox = { ...state.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin -= canvas.currentLayer.x
        boundaryBox.xMax -= canvas.currentLayer.x
        boundaryBox.yMin -= canvas.currentLayer.y
        boundaryBox.yMax -= canvas.currentLayer.y
      }
      //generate new unique key for vector
      state.highestVectorKey += 1
      let uniqueVectorKey = state.highestVectorKey
      //store control points for timeline
      addToTimeline({
        tool: state.tool.name,
        layer: canvas.currentLayer,
        properties: {
          maskArray,
          boundaryBox,
          vectorIndices: [uniqueVectorKey],
        },
      })
      //Store vector in state
      state.vectors[uniqueVectorKey] = {
        index: uniqueVectorKey,
        action: state.action,
        layer: canvas.currentLayer,
        modes: { ...state.tool.modes },
        color: { ...swatches.primary.color },
        brushSize: state.tool.brushSize,
        brushType: state.tool.brushType,
        vectorProperties: {
          ...state.vectorProperties,
          px1: state.vectorProperties.px1 - canvas.currentLayer.x,
          py1: state.vectorProperties.py1 - canvas.currentLayer.y,
        },
        // maskArray,
        // boundaryBox,
        hidden: false,
        removed: false,
      }
      // state.currentVectorIndex = uniqueVectorKey
      // enableActionsForSelection()
      renderCanvas(canvas.currentLayer)
      vectorGui.reset()
      break
    }
    case "pointermove":
      //do nothing
      break
    case "pointerup":
      //redraw canvas to allow onscreen cursor to render
      renderCanvas(canvas.currentLayer)
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
  brushDisabled: true,
  options: { contiguous: { active: true } },
  modes: { eraser: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
