import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionLine } from "../Actions/pointerActions.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import { vectorGui } from "../GUI/vector.js"

//===================================//
//=== * * * Line Controller * * * ===//
//===================================//

/**
 * Supported modes: "draw, erase, inject",
 * TODO: (Medium Priority) add vector line tool. A raster line tool would still be present for ease of use.
 */
function lineSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      // state.lineStartX = state.cursorX
      // state.lineStartY = state.cursorY
      //reset control points
      vectorGui.reset()
      state.vectorProperties.type = state.tool.name
      state.vectorProperties.px1 = state.cursorX
      state.vectorProperties.py1 = state.cursorY
      state.vectorProperties.px2 = state.cursorX
      state.vectorProperties.py2 = state.cursorY
      renderCanvas(canvas.currentLayer)
      //preview line
      actionLine(
        // state.cursorX,
        // state.cursorY,
        // state.cursorX,
        // state.cursorY,
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.vectorProperties.px2,
        state.vectorProperties.py2,
        state.boundaryBox,
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
      state.vectorProperties.px2 = state.cursorX
      state.vectorProperties.py2 = state.cursorY
      //only draw when necessary
      renderCanvas(canvas.currentLayer)
      //preview line
      actionLine(
        // state.lineStartX,
        // state.lineStartY,
        // state.cursorX,
        // state.cursorY,
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.vectorProperties.px2,
        state.vectorProperties.py2,
        state.boundaryBox,
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
    case "pointerup": {
      state.vectorProperties.px2 = state.cursorX
      state.vectorProperties.py2 = state.cursorY
      actionLine(
        // state.lineStartX,
        // state.lineStartY,
        // state.cursorX,
        // state.cursorY,
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.vectorProperties.px2,
        state.vectorProperties.py2,
        state.boundaryBox,
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
      //correct boundary box for layer offset
      const boundaryBox = { ...state.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin -= canvas.currentLayer.x
        boundaryBox.xMax -= canvas.currentLayer.x
        boundaryBox.yMin -= canvas.currentLayer.y
        boundaryBox.yMax -= canvas.currentLayer.y
      }
      // addToTimeline({
      //   tool: state.tool,
      //   layer: canvas.currentLayer,
      //   properties: {
      //     modes: { ...state.tool.modes },
      //     color: { ...swatches.primary.color },
      //     brushSize: state.tool.brushSize,
      //     brushType: state.tool.brushType,
      //     px1: state.lineStartX - canvas.currentLayer.x,
      //     py1: state.lineStartY - canvas.currentLayer.y,
      //     px2: state.cursorX - canvas.currentLayer.x,
      //     py2: state.cursorY - canvas.currentLayer.y,
      //     maskArray,
      //     boundaryBox,
      //   },
      // })
      //generate new unique key for vector
      state.highestVectorKey += 1
      let uniqueVectorKey = state.highestVectorKey
      //store control points for timeline
      addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: {
          maskArray,
          boundaryBox,
          vectorIndices: [uniqueVectorKey],
        },
      })
      //Add the vector to the state
      state.vectors[uniqueVectorKey] = {
        index: uniqueVectorKey,
        actionIndex: state.action.index,
        layer: canvas.currentLayer,
        modes: { ...state.tool.modes },
        color: { ...swatches.primary.color },
        brushSize: state.tool.brushSize,
        brushType: state.tool.brushType,
        vectorProperties: {
          ...state.vectorProperties,
          px1: state.vectorProperties.px1 - canvas.currentLayer.x,
          py1: state.vectorProperties.py1 - canvas.currentLayer.y,
          px2: state.vectorProperties.px2 - canvas.currentLayer.x,
          py2: state.vectorProperties.py2 - canvas.currentLayer.y,
        },
        // maskArray,
        // boundaryBox,
        hidden: false,
        removed: false,
      }
      state.currentVectorIndex = uniqueVectorKey
      enableActionsForSelection()
      renderCanvas(canvas.currentLayer)
      break
    }
    default:
    //do nothing
  }
}

export const line = {
  name: "line",
  fn: lineSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: false,
  options: {},
  modes: { eraser: false, inject: false },
  type: "raster",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
