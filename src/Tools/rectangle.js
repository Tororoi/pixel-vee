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
 * Compute and store all 4 corners from px1 (anchor) and current cursor,
 * clamping to a square if Shift is held.
 * Layout: px1=anchor, px2=adjacent horizontal, px3=opposite, px4=adjacent vertical
 */
function updateCorners() {
  let ex = state.cursor.x
  let ey = state.cursor.y
  if (keys.ShiftLeft || keys.ShiftRight) {
    const dx = ex - state.vector.properties.px1
    const dy = ey - state.vector.properties.py1
    const size = Math.min(Math.abs(dx), Math.abs(dy))
    ex = state.vector.properties.px1 + Math.sign(dx) * size
    ey = state.vector.properties.py1 + Math.sign(dy) * size
  }
  const x1 = state.vector.properties.px1
  const y1 = state.vector.properties.py1
  state.vector.properties.px2 = ex
  state.vector.properties.py2 = y1
  state.vector.properties.px3 = ex
  state.vector.properties.py3 = ey
  state.vector.properties.px4 = x1
  state.vector.properties.py4 = ey
}

/**
 * Call actionRectangle with the current vector properties.
 * @param {boolean} isPreview
 */
function drawRectangle(isPreview) {
  const p = state.vector.properties
  actionRectangle(
    p.px1, p.py1,
    p.px2, p.py2,
    p.px3, p.py3,
    p.px4, p.py4,
    buildRectangleCtx(isPreview),
  )
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
      updateCorners()
      renderCanvas(canvas.currentLayer)
      drawRectangle(true)
      break
    case "pointermove":
      if (
        state.cursor.x !== state.cursor.prevX ||
        state.cursor.y !== state.cursor.prevY
      ) {
        updateCorners()
        renderCanvas(canvas.currentLayer)
        drawRectangle(true)
      }
      break
    case "pointerup": {
      updateCorners()
      drawRectangle(false)
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
      const lx = canvas.currentLayer.x
      const ly = canvas.currentLayer.y
      const p = state.vector.properties
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
        recordedLayerX: lx,
        recordedLayerY: ly,
        brushSize: state.tool.current.brushSize,
        brushType: state.tool.current.brushType,
        vectorProperties: {
          ...p,
          px1: p.px1 - lx, py1: p.py1 - ly,
          px2: p.px2 - lx, py2: p.py2 - ly,
          px3: p.px3 - lx, py3: p.py3 - ly,
          px4: p.px4 - lx, py4: p.py4 - ly,
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
