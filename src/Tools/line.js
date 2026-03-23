import { brushStamps } from '../Context/brushStamps.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'
import { actionLine } from '../Actions/pointer/line.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { renderCanvas } from '../Canvas/render.js'
import { coordArrayFromSet } from '../utils/maskHelpers.js'
import { addToTimeline } from '../Actions/undoRedo/undoRedo.js'
import { enableActionsForSelection } from '../DOM/disableDomElements.js'
import { vectorGui } from '../GUI/vector.js'
import { rerouteVectorStepsAction, getChainStartPoint } from './adjust.js'

//===================================//
//=== * * * Line Controller * * * ===//
//===================================//

/**
 * Supported modes: "draw, erase, inject",
 * TODO: (Medium Priority) add vector line tool. A raster line tool would still be present for ease of use.
 */
function lineSteps() {
  if (
    state.tool.current.options.chain?.active &&
    canvas.pointerEvent === 'pointerdown' &&
    state.tool.clickCounter === 0
  ) {
    const chainPoint = getChainStartPoint()
    if (chainPoint !== null) {
      state.tool.clickCounter += 1
      vectorGui.reset()
      state.vector.properties.type = 'line'
      state.vector.properties.px1 = chainPoint.x
      state.vector.properties.py1 = chainPoint.y
      state.vector.properties.px2 = chainPoint.x
      state.vector.properties.py2 = chainPoint.y
      renderCanvas(canvas.currentLayer)
      actionLine(
        chainPoint.x,
        chainPoint.y,
        chainPoint.x,
        chainPoint.y,
        createStrokeContext({
          layer: canvas.currentLayer,
          isPreview: true,
          boundaryBox: state.selection.boundaryBox,
          currentColor: swatches.primary.color,
          currentModes: state.tool.current.modes,
          maskSet: state.selection.maskSet,
          brushStamp:
            brushStamps[state.tool.current.brushType][
              state.tool.current.brushSize
            ],
          brushSize: state.tool.current.brushSize,
          ditherPattern: ditherPatterns[state.tool.current.ditherPatternIndex],
          twoColorMode: state.tool.current.modes?.twoColor ?? false,
          secondaryColor: swatches.secondary.color,
          ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
          ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
        }),
      )
      return
    }
  }
  if (rerouteVectorStepsAction()) return
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      state.tool.clickCounter += 1
      //reset control points
      vectorGui.reset()
      state.vector.properties.type = state.tool.current.name
      state.vector.properties.px1 = state.cursor.x
      state.vector.properties.py1 = state.cursor.y
      state.vector.properties.px2 = state.cursor.x
      state.vector.properties.py2 = state.cursor.y
      renderCanvas(canvas.currentLayer)
      //preview line
      actionLine(
        state.vector.properties.px1,
        state.vector.properties.py1,
        state.vector.properties.px2,
        state.vector.properties.py2,
        createStrokeContext({
          layer: canvas.currentLayer,
          isPreview: true,
          boundaryBox: state.selection.boundaryBox,
          currentColor: swatches.primary.color,
          currentModes: state.tool.current.modes,
          maskSet: state.selection.maskSet,
          brushStamp:
            brushStamps[state.tool.current.brushType][
              state.tool.current.brushSize
            ],
          brushSize: state.tool.current.brushSize,
          ditherPattern: ditherPatterns[state.tool.current.ditherPatternIndex],
          twoColorMode: state.tool.current.modes?.twoColor ?? false,
          secondaryColor: swatches.secondary.color,
          ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
          ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
        }),
      )
      break
    case 'pointermove':
      //draw line from origin point to current point onscreen
      state.vector.properties.px2 = state.cursor.x
      state.vector.properties.py2 = state.cursor.y
      //only draw when necessary
      renderCanvas(canvas.currentLayer)
      //preview line
      actionLine(
        state.vector.properties.px1,
        state.vector.properties.py1,
        state.vector.properties.px2,
        state.vector.properties.py2,
        createStrokeContext({
          layer: canvas.currentLayer,
          isPreview: true,
          boundaryBox: state.selection.boundaryBox,
          currentColor: swatches.primary.color,
          currentModes: state.tool.current.modes,
          maskSet: state.selection.maskSet,
          brushStamp:
            brushStamps[state.tool.current.brushType][
              state.tool.current.brushSize
            ],
          brushSize: state.tool.current.brushSize,
          ditherPattern: ditherPatterns[state.tool.current.ditherPatternIndex],
          twoColorMode: state.tool.current.modes?.twoColor ?? false,
          secondaryColor: swatches.secondary.color,
          ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
          ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
        }),
      )
      break
    case 'pointerup': {
      state.vector.properties.px2 = state.cursor.x
      state.vector.properties.py2 = state.cursor.y
      //Handle snapping p1 or p2 to other control points. Only snap when there are no linked vectors to selected vector.
      if (
        state.tool.current.options.align?.active ||
        state.tool.current.options.equal?.active ||
        state.tool.current.options.link?.active
      ) {
        //snap selected point to collidedVector's control point
        if (state.vector.collidedIndex !== null) {
          let collidedVector = state.vector.all[state.vector.collidedIndex]
          let snappedToX =
            collidedVector.vectorProperties[vectorGui.otherCollidedKeys.xKey] +
            collidedVector.layer.x
          let snappedToY =
            collidedVector.vectorProperties[vectorGui.otherCollidedKeys.yKey] +
            collidedVector.layer.y
          state.vector.properties.px2 = snappedToX
          state.vector.properties.py2 = snappedToY
        }
      }
      actionLine(
        state.vector.properties.px1,
        state.vector.properties.py1,
        state.vector.properties.px2,
        state.vector.properties.py2,
        createStrokeContext({
          layer: canvas.currentLayer,
          boundaryBox: state.selection.boundaryBox,
          currentColor: swatches.primary.color,
          currentModes: state.tool.current.modes,
          maskSet: state.selection.maskSet,
          brushStamp:
            brushStamps[state.tool.current.brushType][
              state.tool.current.brushSize
            ],
          brushSize: state.tool.current.brushSize,
          ditherPattern: ditherPatterns[state.tool.current.ditherPatternIndex],
          twoColorMode: state.tool.current.modes?.twoColor ?? false,
          secondaryColor: swatches.secondary.color,
          ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
          ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
        }),
      )
      state.tool.clickCounter = 0
      let maskArray = coordArrayFromSet(
        state.selection.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y,
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
      const uniqueVectorKey = state.vector.nextKey()
      state.vector.setCurrentIndex(uniqueVectorKey)
      enableActionsForSelection()
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
      //Add the vector to the state
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
        // maskArray,
        // boundaryBox,
        hidden: false,
        removed: false,
      }
      renderCanvas(canvas.currentLayer)
      break
    }
    default:
    //do nothing
  }
}

export const line = {
  name: 'line',
  fn: lineSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: false,
  options: {
    //Priority hierarchy of options: Equal = Align > Hold > Link
    // equal: {
    //   active: false,
    //   tooltip:
    //     "Toggle Equal Length (=). \n\nEnsures magnitude continuity of control handles for linked vectors.",
    // }, // Magnitude continuity
    // align: {
    //   active: false,
    //   tooltip:
    //     "Toggle Align (A). \n\nEnsures tangential continuity by moving the control handle to the opposite angle for linked vectors.",
    // }, // Tangential continuity
    chain: {
      active: false,
      tooltip:
        'Toggle Chain (7). \n\nStart a new line from a colliding line endpoint instead of adjusting it.',
    },
    hold: {
      active: false,
      tooltip:
        'Toggle Hold (H). \n\nMaintain relative angles of all control handles attached to selected control point.',
    },
    link: {
      active: true,
      tooltip:
        'Toggle Linking (L). \n\nConnected control points of other vectors will move with selected control point.',
    }, // Positional continuity
    displayPaths: {
      active: false,
      tooltip: 'Toggle Paths. \n\nShow paths for lines.',
    },
  },
  modes: { eraser: false, inject: false, twoColor: false },
  ditherPatternIndex: 64,
  ditherOffsetX: 0,
  ditherOffsetY: 0,
  type: 'vector',
  cursor: 'crosshair',
  activeCursor: 'crosshair',
}
