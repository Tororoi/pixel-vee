import { brushStamps } from '../Context/brushStamps.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'
import {
  actionQuadraticCurve,
  actionCubicCurve,
} from '../Actions/pointer/curve.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { vectorGui } from '../GUI/vector.js'
import { renderCanvas } from '../Canvas/render.js'
import { coordArrayFromSet } from '../utils/maskHelpers.js'
import { addToTimeline } from '../Actions/undoRedo/undoRedo.js'
import { enableActionsForSelection } from '../DOM/disableDomElements.js'
import { rerouteVectorStepsAction, getChainStartPoint } from './adjust.js'
import {
  getCropNormalizedCursorX,
  getCropNormalizedCursorY,
} from '../utils/coordinateHelpers.js'

//=====================================//
//=== * * * Curve Controllers * * * ===//
//=====================================//

/**
 * Build a StrokeContext from the current tool state
 * @param {boolean} isPreview - Whether this context is for a preview render
 * @returns {object} StrokeContext
 */
function buildCurveCtx(isPreview = false) {
  return createStrokeContext({
    layer: canvas.currentLayer,
    isPreview,
    boundaryBox: state.selection.boundaryBox,
    currentColor: swatches.primary.color,
    currentModes: state.tool.current.modes,
    maskSet: state.selection.maskSet,
    brushStamp:
      brushStamps[state.tool.current.brushType][state.tool.current.brushSize],
    brushSize: state.tool.current.brushSize,
    ditherPattern: ditherPatterns[state.tool.current.ditherPatternIndex],
    twoColorMode: state.tool.current.modes?.twoColor ?? false,
    secondaryColor: swatches.secondary.color,
    ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
    ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
  })
}

/**
 * Draw bezier curves
 * Supported modes: "draw, erase",
 */
function quadCurveSteps() {
  const normalizedX = getCropNormalizedCursorX()
  const normalizedY = getCropNormalizedCursorY()
  const { cropOffsetX, cropOffsetY } = state.canvas
  if (
    state.tool.current.options.chain?.active &&
    canvas.pointerEvent === 'pointerdown' &&
    state.tool.clickCounter === 0
  ) {
    const chainPoint = getChainStartPoint()
    if (chainPoint !== null) {
      state.tool.clickCounter += 1
      vectorGui.reset()
      state.vector.properties.type = state.tool.current.name
      state.vector.properties.px1 = chainPoint.x
      state.vector.properties.py1 = chainPoint.y
      state.vector.properties.px2 = chainPoint.x
      state.vector.properties.py2 = chainPoint.y
      renderCanvas(canvas.currentLayer)
      actionQuadraticCurve(
        chainPoint.x + cropOffsetX,
        chainPoint.y + cropOffsetY,
        chainPoint.x + cropOffsetX,
        chainPoint.y + cropOffsetY,
        state.vector.properties.px3 + cropOffsetX,
        state.vector.properties.py3 + cropOffsetY,
        1,
        buildCurveCtx(true),
      )
      return
    }
  }
  if (rerouteVectorStepsAction()) return
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      //solidify end points
      state.tool.clickCounter += 1
      if (state.tool.clickCounter > 2) state.tool.clickCounter = 1
      switch (state.tool.clickCounter) {
        case 1:
          //reset control points
          vectorGui.reset()
          state.vector.properties.type = state.tool.current.name
          state.vector.properties.px1 = normalizedX
          state.vector.properties.py1 = normalizedY
          //endpoint starts at same point as startpoint
          state.vector.properties.px2 = normalizedX
          state.vector.properties.py2 = normalizedY
          break
        case 2:
          state.vector.properties.px3 = normalizedX
          state.vector.properties.py3 = normalizedY
          break
        default:
        //do nothing
      }
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      actionQuadraticCurve(
        state.vector.properties.px1 + cropOffsetX,
        state.vector.properties.py1 + cropOffsetY,
        state.vector.properties.px2 + cropOffsetX,
        state.vector.properties.py2 + cropOffsetY,
        state.vector.properties.px3 + cropOffsetX,
        state.vector.properties.py3 + cropOffsetY,
        state.tool.clickCounter,
        buildCurveCtx(true),
      )
      break
    case 'pointermove':
      switch (state.tool.clickCounter) {
        case 1:
          state.vector.properties.px2 = normalizedX
          state.vector.properties.py2 = normalizedY
          break
        case 2:
          state.vector.properties.px3 = normalizedX
          state.vector.properties.py3 = normalizedY
          break
        default:
        //do nothing
      }
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      actionQuadraticCurve(
        state.vector.properties.px1 + cropOffsetX,
        state.vector.properties.py1 + cropOffsetY,
        state.vector.properties.px2 + cropOffsetX,
        state.vector.properties.py2 + cropOffsetY,
        state.vector.properties.px3 + cropOffsetX,
        state.vector.properties.py3 + cropOffsetY,
        state.tool.clickCounter,
        buildCurveCtx(true),
      )
      break
    case 'pointerup':
      switch (state.tool.clickCounter) {
        case 1:
          state.vector.properties.px2 = normalizedX
          state.vector.properties.py2 = normalizedY
          break
        case 2:
          state.vector.properties.px3 = normalizedX
          state.vector.properties.py3 = normalizedY
          break
        default:
        //do nothing
      }
      //Solidify curve
      if (state.tool.clickCounter === 2) {
        actionQuadraticCurve(
          state.vector.properties.px1 + cropOffsetX,
          state.vector.properties.py1 + cropOffsetY,
          state.vector.properties.px2 + cropOffsetX,
          state.vector.properties.py2 + cropOffsetY,
          state.vector.properties.px3 + cropOffsetX,
          state.vector.properties.py3 + cropOffsetY,
          state.tool.clickCounter,
          buildCurveCtx(false),
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
          ditherOffsetX:
            (((state.tool.current.ditherOffsetX + state.canvas.cropOffsetX) % 8) +
              8) %
            8,
          ditherOffsetY:
            (((state.tool.current.ditherOffsetY + state.canvas.cropOffsetY) % 8) +
              8) %
            8,
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
            px3: state.vector.properties.px3 - canvas.currentLayer.x,
            py3: state.vector.properties.py3 - canvas.currentLayer.y,
          },
          // maskArray,
          // boundaryBox,
          hidden: false,
          removed: false,
        }
        renderCanvas(canvas.currentLayer)
      }
      break
    default:
    //do nothing
  }
}

/**
 * Draw cubic bezier curves
 * Supported modes: "draw, erase",
 */
function cubicCurveSteps() {
  const normalizedX = getCropNormalizedCursorX()
  const normalizedY = getCropNormalizedCursorY()
  const { cropOffsetX, cropOffsetY } = state.canvas
  if (
    state.tool.current.options.chain?.active &&
    canvas.pointerEvent === 'pointerdown' &&
    state.tool.clickCounter === 0
  ) {
    const chainPoint = getChainStartPoint()
    if (chainPoint !== null) {
      state.tool.clickCounter += 1
      vectorGui.reset()
      state.vector.properties.type = state.tool.current.name
      state.vector.properties.px1 = chainPoint.x
      state.vector.properties.py1 = chainPoint.y
      state.vector.properties.px2 = chainPoint.x
      state.vector.properties.py2 = chainPoint.y
      renderCanvas(canvas.currentLayer)
      actionCubicCurve(
        chainPoint.x + cropOffsetX,
        chainPoint.y + cropOffsetY,
        chainPoint.x + cropOffsetX,
        chainPoint.y + cropOffsetY,
        state.vector.properties.px3 + cropOffsetX,
        state.vector.properties.py3 + cropOffsetY,
        state.vector.properties.px4 + cropOffsetX,
        state.vector.properties.py4 + cropOffsetY,
        1,
        buildCurveCtx(true),
      )
      return
    }
  }
  if (rerouteVectorStepsAction()) return
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      //solidify end points
      state.tool.clickCounter += 1
      if (state.tool.clickCounter > 3) state.tool.clickCounter = 1
      switch (state.tool.clickCounter) {
        case 1:
          //reset control points
          vectorGui.reset()
          state.vector.properties.type = state.tool.current.name
          state.vector.properties.px1 = normalizedX
          state.vector.properties.py1 = normalizedY
          //endpoint starts at same point as startpoint
          state.vector.properties.px2 = normalizedX
          state.vector.properties.py2 = normalizedY
          break
        case 2:
          state.vector.properties.px3 = normalizedX
          state.vector.properties.py3 = normalizedY
          break
        case 3:
          state.vector.properties.px4 = normalizedX
          state.vector.properties.py4 = normalizedY
          break
        default:
        //do nothing
      }
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      actionCubicCurve(
        state.vector.properties.px1 + cropOffsetX,
        state.vector.properties.py1 + cropOffsetY,
        state.vector.properties.px2 + cropOffsetX,
        state.vector.properties.py2 + cropOffsetY,
        state.vector.properties.px3 + cropOffsetX,
        state.vector.properties.py3 + cropOffsetY,
        state.vector.properties.px4 + cropOffsetX,
        state.vector.properties.py4 + cropOffsetY,
        state.tool.clickCounter,
        buildCurveCtx(true),
      )
      break
    case 'pointermove':
      switch (state.tool.clickCounter) {
        case 1:
          state.vector.properties.px2 = normalizedX
          state.vector.properties.py2 = normalizedY
          break
        case 2:
          state.vector.properties.px3 = normalizedX
          state.vector.properties.py3 = normalizedY
          break
        case 3:
          state.vector.properties.px4 = normalizedX
          state.vector.properties.py4 = normalizedY
          break
        default:
        //do nothing
      }
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      actionCubicCurve(
        state.vector.properties.px1 + cropOffsetX,
        state.vector.properties.py1 + cropOffsetY,
        state.vector.properties.px2 + cropOffsetX,
        state.vector.properties.py2 + cropOffsetY,
        state.vector.properties.px3 + cropOffsetX,
        state.vector.properties.py3 + cropOffsetY,
        state.vector.properties.px4 + cropOffsetX,
        state.vector.properties.py4 + cropOffsetY,
        state.tool.clickCounter,
        buildCurveCtx(true),
      )
      break
    case 'pointerup':
      switch (state.tool.clickCounter) {
        case 1:
          state.vector.properties.px2 = normalizedX
          state.vector.properties.py2 = normalizedY
          break
        case 2:
          state.vector.properties.px3 = normalizedX
          state.vector.properties.py3 = normalizedY
          break
        case 3:
          state.vector.properties.px4 = normalizedX
          state.vector.properties.py4 = normalizedY
          break
        default:
        //do nothing
      }
      //Solidify curve
      if (state.tool.clickCounter === 3) {
        actionCubicCurve(
          state.vector.properties.px1 + cropOffsetX,
          state.vector.properties.py1 + cropOffsetY,
          state.vector.properties.px2 + cropOffsetX,
          state.vector.properties.py2 + cropOffsetY,
          state.vector.properties.px3 + cropOffsetX,
          state.vector.properties.py3 + cropOffsetY,
          state.vector.properties.px4 + cropOffsetX,
          state.vector.properties.py4 + cropOffsetY,
          state.tool.clickCounter,
          buildCurveCtx(false),
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
        //Store vector in state
        state.vector.all[uniqueVectorKey] = {
          index: uniqueVectorKey,
          action: state.timeline.currentAction,
          layer: canvas.currentLayer,
          modes: { ...state.tool.current.modes },
          color: { ...swatches.primary.color },
          secondaryColor: { ...swatches.secondary.color },
          ditherPatternIndex: state.tool.current.ditherPatternIndex,
          ditherOffsetX:
            (((state.tool.current.ditherOffsetX + state.canvas.cropOffsetX) % 8) +
              8) %
            8,
          ditherOffsetY:
            (((state.tool.current.ditherOffsetY + state.canvas.cropOffsetY) % 8) +
              8) %
            8,
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
            px3: state.vector.properties.px3 - canvas.currentLayer.x,
            py3: state.vector.properties.py3 - canvas.currentLayer.y,
            px4: state.vector.properties.px4 - canvas.currentLayer.x,
            py4: state.vector.properties.py4 - canvas.currentLayer.y,
          },
          // maskArray, //default to action's maskArray
          // boundaryBox, //default to action's boundaryBox
          hidden: false,
          removed: false,
        }
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
      }
      break
    default:
    //do nothing
  }
}

export const quadCurve = {
  name: 'quadCurve',
  fn: quadCurveSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: false,
  ditherPatternIndex: 64,
  ditherOffsetX: 0,
  ditherOffsetY: 0,
  options: {
    chain: {
      active: false,
      tooltip:
        'Toggle Chain (7). \n\nStart a new curve from a colliding vector endpoint instead of adjusting it.',
    },
    //Priority hierarchy of options: Equal = Align > Hold > Link
    equal: {
      active: false,
      tooltip:
        'Toggle Equal Length (=). \n\nEnsures magnitude continuity of control handles for linked vectors.',
    }, // Magnitude continuity
    align: {
      active: true,
      tooltip:
        'Toggle Align (A). \n\nEnsures tangential continuity by moving the control handle to the opposite angle for linked vectors.',
    }, // Tangential continuity
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
      tooltip: 'Toggle Paths. \n\nShow paths for curves.',
    },
  },
  modes: { eraser: false, inject: false, twoColor: false },
  type: 'vector',
  cursor: 'crosshair',
  activeCursor: 'crosshair',
}

export const cubicCurve = {
  name: 'cubicCurve',
  fn: cubicCurveSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: false,
  ditherPatternIndex: 64,
  ditherOffsetX: 0,
  ditherOffsetY: 0,
  options: {
    chain: {
      active: false,
      tooltip:
        'Toggle Chain (7). \n\nStart a new curve from a colliding vector endpoint instead of adjusting it.',
    },
    //Priority hierarchy of options: Equal = Align > Hold > Link
    equal: {
      active: false,
      tooltip:
        'Toggle Equal Length (=). \n\nEnsures magnitude continuity of control handles for linked vectors.',
    }, // Magnitude continuity
    align: {
      active: true,
      tooltip:
        'Toggle Align (A). \n\nEnsures tangential continuity by moving the control handle to the opposite angle for linked vectors.',
    }, // Tangential continuity
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
    // displayVectors: false,
    displayPaths: {
      active: false,
      tooltip: 'Toggle Paths. \n\nShow paths for curves.',
    },
  },
  modes: { eraser: false, inject: false, twoColor: false },
  type: 'vector',
  cursor: 'crosshair',
  activeCursor: 'crosshair',
}
