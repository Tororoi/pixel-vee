import { brushStamps } from '../Context/brushStamps.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'
import { actionCubicCurve } from '../Actions/pointer/curve.js'
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

//======================================//
//=== * * * Vector Controller * * * ===//
//======================================//

/**
 * Returns the active curve type name based on the current tool modes.
 * @returns {'line'|'quadCurve'|'cubicCurve'}
 */
export function getActiveCurveMode() {
  const modes = state.tool.current.modes
  if (modes.cubicCurve) return 'cubicCurve'
  if (modes.quadCurve) return 'quadCurve'
  return 'line'
}

/**
 * Build a StrokeContext from the current tool state.
 * @param {boolean} isPreview - Whether the context is for a preview render
 * @returns {object} StrokeContext
 */
function buildVectorCtx(isPreview = false) {
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
 * Render the current vector state using actionCubicCurve.
 * stepNum drives which geometry is drawn: 1=line, 2=quadBezier, 3=cubicBezier.
 * Control points that haven't been set yet fall back to px2/py2 so no NaN
 * is passed into the bezier math for unused steps.
 * @param {number} stepNum - 1=line, 2=quadBezier, 3=cubicBezier
 * @param {boolean} isPreview - Whether to render to the preview layer
 */
function renderVectorPreview(stepNum, isPreview) {
  const { cropOffsetX, cropOffsetY } = state.canvas
  const vp = state.vector.properties
  actionCubicCurve(
    vp.px1 + cropOffsetX,
    vp.py1 + cropOffsetY,
    vp.px2 + cropOffsetX,
    vp.py2 + cropOffsetY,
    (vp.px3 ?? vp.px2) + cropOffsetX,
    (vp.py3 ?? vp.py2) + cropOffsetY,
    (vp.px4 ?? vp.px2) + cropOffsetX,
    (vp.py4 ?? vp.py2) + cropOffsetY,
    stepNum,
    buildVectorCtx(isPreview),
  )
}

/**
 * Unified step function for the vector tool.
 * Handles line (1 click), quadCurve (2 clicks), and cubicCurve (3 clicks)
 * based on the active curve mode.
 */
function vectorSteps() {
  const normalizedX = getCropNormalizedCursorX()
  const normalizedY = getCropNormalizedCursorY()
  const activeCurveMode = getActiveCurveMode()
  const maxClicks = activeCurveMode === 'cubicCurve' ? 3 : activeCurveMode === 'quadCurve' ? 2 : 1

  if (
    state.tool.current.options.chain?.active &&
    canvas.pointerEvent === 'pointerdown' &&
    state.tool.clickCounter === 0
  ) {
    const chainPoint = getChainStartPoint()
    if (chainPoint !== null) {
      state.tool.clickCounter += 1
      vectorGui.reset()
      state.vector.properties.type = activeCurveMode
      state.vector.properties.px1 = chainPoint.x
      state.vector.properties.py1 = chainPoint.y
      state.vector.properties.px2 = chainPoint.x
      state.vector.properties.py2 = chainPoint.y
      renderCanvas(canvas.currentLayer)
      renderVectorPreview(1, true)
      return
    }
  }

  if (rerouteVectorStepsAction()) return

  switch (canvas.pointerEvent) {
    case 'pointerdown':
      state.tool.clickCounter += 1
      if (state.tool.clickCounter > maxClicks) state.tool.clickCounter = 1
      switch (state.tool.clickCounter) {
        case 1:
          vectorGui.reset()
          state.vector.properties.type = activeCurveMode
          state.vector.properties.px1 = normalizedX
          state.vector.properties.py1 = normalizedY
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
      renderCanvas(canvas.currentLayer)
      renderVectorPreview(state.tool.clickCounter, true)
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
      renderCanvas(canvas.currentLayer)
      renderVectorPreview(state.tool.clickCounter, true)
      break
    case 'pointerup': {
      switch (state.tool.clickCounter) {
        case 1:
          state.vector.properties.px2 = normalizedX
          state.vector.properties.py2 = normalizedY
          //snap endpoint to a colliding control point when link/align/equal is active
          if (
            state.tool.current.options.align?.active ||
            state.tool.current.options.equal?.active ||
            state.tool.current.options.link?.active
          ) {
            if (state.vector.collidedIndex !== null) {
              const collidedVector = state.vector.all[state.vector.collidedIndex]
              state.vector.properties.px2 =
                collidedVector.vectorProperties[
                  vectorGui.otherCollidedKeys.xKey
                ] + collidedVector.layer.x
              state.vector.properties.py2 =
                collidedVector.vectorProperties[
                  vectorGui.otherCollidedKeys.yKey
                ] + collidedVector.layer.y
            }
          }
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
      if (state.tool.clickCounter === maxClicks) {
        renderVectorPreview(maxClicks, false)
        state.tool.clickCounter = 0
        const maskArray = coordArrayFromSet(
          state.selection.maskSet,
          canvas.currentLayer.x + state.canvas.cropOffsetX,
          canvas.currentLayer.y + state.canvas.cropOffsetY,
        )
        const boundaryBox = { ...state.selection.boundaryBox }
        if (boundaryBox.xMax !== null) {
          boundaryBox.xMin -= canvas.currentLayer.x + state.canvas.cropOffsetX
          boundaryBox.xMax -= canvas.currentLayer.x + state.canvas.cropOffsetX
          boundaryBox.yMin -= canvas.currentLayer.y + state.canvas.cropOffsetY
          boundaryBox.yMax -= canvas.currentLayer.y + state.canvas.cropOffsetY
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
        const layerX = canvas.currentLayer.x
        const layerY = canvas.currentLayer.y
        const vp = state.vector.properties
        state.vector.all[uniqueVectorKey] = {
          index: uniqueVectorKey,
          action: state.timeline.currentAction,
          layer: canvas.currentLayer,
          modes: { ...state.tool.current.modes },
          color: { ...swatches.primary.color },
          secondaryColor: { ...swatches.secondary.color },
          ditherPatternIndex: state.tool.current.ditherPatternIndex,
          ditherOffsetX:
            (((state.tool.current.ditherOffsetX + state.canvas.cropOffsetX) %
              8) +
              8) %
            8,
          ditherOffsetY:
            (((state.tool.current.ditherOffsetY + state.canvas.cropOffsetY) %
              8) +
              8) %
            8,
          recordedLayerX: layerX,
          recordedLayerY: layerY,
          brushSize: state.tool.current.brushSize,
          brushType: state.tool.current.brushType,
          vectorProperties: {
            ...vp,
            px1: vp.px1 - layerX,
            py1: vp.py1 - layerY,
            px2: vp.px2 - layerX,
            py2: vp.py2 - layerY,
            px3: vp.px3 != null ? vp.px3 - layerX : vp.px3,
            py3: vp.py3 != null ? vp.py3 - layerY : vp.py3,
            px4: vp.px4 != null ? vp.px4 - layerX : vp.px4,
            py4: vp.py4 != null ? vp.py4 - layerY : vp.py4,
          },
          hidden: false,
          removed: false,
        }
        renderCanvas(canvas.currentLayer)
        if (activeCurveMode !== 'line') vectorGui.render()
      }
      break
    }
    default:
    //do nothing
  }
}

export const vector = {
  name: 'vector',
  fn: vectorSteps,
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
        'Toggle Chain (7). \n\nStart a new vector from a colliding endpoint instead of adjusting it.',
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
      tooltip: 'Toggle Paths. \n\nShow paths for vectors.',
    },
  },
  modes: {
    line: true,
    quadCurve: false,
    cubicCurve: false,
    eraser: false,
    inject: false,
    twoColor: false,
  },
  type: 'vector',
  cursor: 'crosshair',
  activeCursor: 'crosshair',
}
