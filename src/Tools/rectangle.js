import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { ditherPatterns } from "../Context/ditherPatterns.js"
import { keys } from "../Shortcuts/keys.js"
import { actionRectangle } from "../Actions/pointer/rectangle.js"
import { createStrokeContext } from "../Actions/pointer/strokeContext.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo/undoRedo.js"
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import { rerouteVectorStepsAction } from "./adjust.js"

//==========================================//
//=== * * * Rectangle Controller * * * ===//
//==========================================//

/**
 * Build a StrokeContext from the current tool state
 * @param {boolean} isPreview
 * @returns {object} StrokeContext
 */
function buildRectangleCtx(isPreview = false) {
  return createStrokeContext({
    layer: canvas.currentLayer,
    isPreview,
    boundaryBox: state.selection.boundaryBox,
    currentColor: swatches.primary.color,
    currentModes: state.tool.current.modes,
    maskSet: state.selection.maskSet,
    brushStamp: brushStamps[state.tool.current.brushType][state.tool.current.brushSize],
    brushSize: state.tool.current.brushSize,
    ditherPattern: ditherPatterns[state.tool.current.ditherPatternIndex],
    twoColorMode: state.tool.current.modes?.twoColor ?? false,
    secondaryColor: swatches.secondary.color,
    ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
    ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
  })
}

/**
 * Update px2/py2 from the current cursor position, clamping to a square if Shift is held.
 */
function updateCorner() {
  if (keys.ShiftLeft || keys.ShiftRight) {
    const dx = state.cursor.x - state.vector.properties.px1
    const dy = state.cursor.y - state.vector.properties.py1
    const size = Math.min(Math.abs(dx), Math.abs(dy))
    state.vector.properties.px2 = state.vector.properties.px1 + Math.sign(dx) * size
    state.vector.properties.py2 = state.vector.properties.py1 + Math.sign(dy) * size
  } else {
    state.vector.properties.px2 = state.cursor.x
    state.vector.properties.py2 = state.cursor.y
  }
}

/**
 * Draw rectangle
 * Supported modes: draw, erase
 */
function rectangleSteps() {
  if (rerouteVectorStepsAction()) return
  switch (canvas.pointerEvent) {
    case "pointerdown":
      vectorGui.reset()
      state.vector.properties.type = state.tool.current.name
      state.vector.properties.px1 = state.cursor.x
      state.vector.properties.py1 = state.cursor.y
      updateCorner()
      renderCanvas(canvas.currentLayer)
      actionRectangle(
        state.vector.properties.px1,
        state.vector.properties.py1,
        state.vector.properties.px2,
        state.vector.properties.py2,
        buildRectangleCtx(true),
      )
      break
    case "pointermove":
      if (
        state.cursor.x !== state.cursor.prevX ||
        state.cursor.y !== state.cursor.prevY
      ) {
        updateCorner()
        renderCanvas(canvas.currentLayer)
        actionRectangle(
          state.vector.properties.px1,
          state.vector.properties.py1,
          state.vector.properties.px2,
          state.vector.properties.py2,
          buildRectangleCtx(true),
        )
      }
      break
    case "pointerup": {
      updateCorner()
      actionRectangle(
        state.vector.properties.px1,
        state.vector.properties.py1,
        state.vector.properties.px2,
        state.vector.properties.py2,
        buildRectangleCtx(false),
      )
      const maskArray = coordArrayFromSet(
        state.selection.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y,
      )
      const boundaryBox = { ...state.selection.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin -= canvas.currentLayer.x
        boundaryBox.xMax -= canvas.currentLayer.x
        boundaryBox.yMin -= canvas.currentLayer.y
        boundaryBox.yMax -= canvas.currentLayer.y
      }
      const uniqueVectorKey = state.vector.nextKey()
      state.vector.setCurrentIndex(uniqueVectorKey)
      enableActionsForSelection()
      addToTimeline({
        tool: state.tool.current.name,
        layer: canvas.currentLayer,
        properties: {
          maskArray,
          boundaryBox,
          vectorIndices: [uniqueVectorKey],
        },
      })
      state.vector.all[uniqueVectorKey] = {
        index: uniqueVectorKey,
        action: state.timeline.currentAction,
        layer: canvas.currentLayer,
        modes: { ...state.tool.current.modes },
        color: { ...swatches.primary.color },
        secondaryColor: { ...swatches.secondary.color },
        ditherPatternIndex: state.tool.current.ditherPatternIndex,
        ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
        ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
        recordedLayerX: canvas.currentLayer.x,
        recordedLayerY: canvas.currentLayer.y,
        brushSize: state.tool.current.brushSize,
        brushType: state.tool.current.brushType,
        vectorProperties: {
          ...state.vector.properties,
          px1: state.vector.properties.px1 - canvas.currentLayer.x,
          py1: state.vector.properties.py1 - canvas.currentLayer.y,
          px2: state.vector.properties.px2 - canvas.currentLayer.x,
          py2: state.vector.properties.py2 - canvas.currentLayer.y,
        },
        hidden: false,
        removed: false,
      }
      state.reset()
      renderCanvas(canvas.currentLayer)
      vectorGui.render()
      break
    }
    default:
    //do nothing
  }
}

/**
 * Rectangle tool
 */
export const rectangle = {
  name: "rectangle",
  fn: rectangleSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: false,
  ditherPatternIndex: 64,
  ditherOffsetX: 0,
  ditherOffsetY: 0,
  options: {
    displayPaths: {
      active: false,
      tooltip: "Toggle Paths. \n\nShow path for rectangle.",
    },
  },
  modes: { eraser: false, inject: false, twoColor: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
