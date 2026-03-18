import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionFill } from "../Actions/pointer/fill.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo/undoRedo.js"
// import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import { rerouteVectorStepsAction } from "./adjust.js"

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
      state.vector.properties.type = state.tool.current.name
      state.vector.properties.px1 = state.cursor.x
      state.vector.properties.py1 = state.cursor.y
      actionFill(
        state.vector.properties.px1,
        state.vector.properties.py1,
        state.selection.boundaryBox,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.current.modes,
        state.selection.maskSet
      )
      //For undo ability, store starting coords and settings and pass them into actionFill
      let maskArray = coordArrayFromSet(
        state.selection.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y
      )
      //correct boundary box for layer offset
      const boundaryBox = { ...state.selection.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin -= canvas.currentLayer.x
        boundaryBox.xMax -= canvas.currentLayer.x
        boundaryBox.yMin -= canvas.currentLayer.y
        boundaryBox.yMax -= canvas.currentLayer.y
      }
      //generate new unique key for vector
      state.vector.highestKey += 1
      let uniqueVectorKey = state.vector.highestKey
      //store control points for timeline
      addToTimeline({
        tool: state.tool.current.name,
        layer: canvas.currentLayer,
        properties: {
          maskArray,
          boundaryBox,
          vectorIndices: [uniqueVectorKey],
        },
      })
      //Store vector in state
      state.vector.all[uniqueVectorKey] = {
        index: uniqueVectorKey,
        action: state.timeline.currentAction,
        layer: canvas.currentLayer,
        modes: { ...state.tool.current.modes },
        color: { ...swatches.primary.color },
        brushSize: state.tool.current.brushSize,
        brushType: state.tool.current.brushType,
        vectorProperties: {
          ...state.vector.properties,
          px1: state.vector.properties.px1 - canvas.currentLayer.x,
          py1: state.vector.properties.py1 - canvas.currentLayer.y,
        },
        // maskArray,
        // boundaryBox,
        hidden: false,
        removed: false,
      }
      // state.vector.currentIndex = uniqueVectorKey
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
