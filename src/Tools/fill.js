import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { actionFill } from '../Actions/pointer/fill.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { vectorGui } from '../GUI/vector.js'
import { renderCanvas } from '../Canvas/render.js'
import { coordArrayFromSet } from '../utils/maskHelpers.js'
import { addToTimeline } from '../Actions/undoRedo/undoRedo.js'
// import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import { rerouteVectorStepsAction } from './adjust.js'
import {
  getCropNormalizedCursorX,
  getCropNormalizedCursorY,
} from '../utils/coordinateHelpers.js'

//===================================//
//=== * * * Fill Controller * * * ===//
//===================================//

/**
 * Fill an area with the specified color
 * Supported modes: "draw, erase"
 */
function fillSteps() {
  if (rerouteVectorStepsAction()) return
  const normalizedX = getCropNormalizedCursorX()
  const normalizedY = getCropNormalizedCursorY()
  const { cropOffsetX, cropOffsetY } = globalState.canvas
  switch (canvas.pointerEvent) {
    case 'pointerdown': {
      //reset control points
      vectorGui.reset()
      globalState.vector.properties.tool = globalState.tool.current.name
      globalState.vector.properties.px1 = normalizedX
      globalState.vector.properties.py1 = normalizedY
      actionFill(
        globalState.vector.properties.px1 + cropOffsetX,
        globalState.vector.properties.py1 + cropOffsetY,
        createStrokeContext({
          layer: canvas.currentLayer,
          boundaryBox: globalState.selection.boundaryBox,
          currentColor: swatches.primary.color,
          currentModes: globalState.tool.current.modes,
          maskSet: globalState.selection.maskSet,
        }),
      )
      //For undo ability, store starting coords and settings and pass them into actionFill
      let maskArray = coordArrayFromSet(
        globalState.selection.maskSet,
        canvas.currentLayer.x + globalState.canvas.cropOffsetX,
        canvas.currentLayer.y + globalState.canvas.cropOffsetY,
      )
      //correct boundary box for layer offset and crop offset
      const boundaryBox = { ...globalState.selection.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin -= canvas.currentLayer.x + globalState.canvas.cropOffsetX
        boundaryBox.xMax -= canvas.currentLayer.x + globalState.canvas.cropOffsetX
        boundaryBox.yMin -= canvas.currentLayer.y + globalState.canvas.cropOffsetY
        boundaryBox.yMax -= canvas.currentLayer.y + globalState.canvas.cropOffsetY
      }
      //generate new unique key for vector
      globalState.vector.highestKey += 1
      let uniqueVectorKey = globalState.vector.highestKey
      //store control points for timeline
      addToTimeline({
        tool: globalState.tool.current.name,
        layer: canvas.currentLayer,
        properties: {
          maskArray,
          boundaryBox,
          vectorIndices: [uniqueVectorKey],
        },
      })
      //Store vector in state
      globalState.vector.all[uniqueVectorKey] = {
        index: uniqueVectorKey,
        action: globalState.timeline.currentAction,
        layer: canvas.currentLayer,
        modes: { ...globalState.tool.current.modes },
        color: { ...swatches.primary.color },
        brushSize: globalState.tool.current.brushSize,
        brushType: globalState.tool.current.brushType,
        vectorProperties: {
          ...globalState.vector.properties,
          px1: globalState.vector.properties.px1 - canvas.currentLayer.x,
          py1: globalState.vector.properties.py1 - canvas.currentLayer.y,
        },
        // maskArray,
        // boundaryBox,
        hidden: false,
        removed: false,
      }
      // globalState.vector.currentIndex = uniqueVectorKey
      // enableActionsForSelection()
      renderCanvas(canvas.currentLayer)
      vectorGui.reset()
      break
    }
    case 'pointermove':
      //do nothing
      break
    case 'pointerup':
      //redraw canvas to allow onscreen cursor to render
      renderCanvas(canvas.currentLayer)
      break
    default:
    //do nothing
  }
}

export const fill = {
  name: 'fill',
  fn: fillSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: true,
  options: { contiguous: { active: true } },
  modes: { eraser: false },
  type: 'vector',
  cursor: 'crosshair',
  activeCursor: 'crosshair',
}
