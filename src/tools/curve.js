import { brushStamps } from '../context/brushStamps.js'
import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
import { swatches } from '../context/swatch.js'
import { ditherPatterns } from '../context/ditherPatterns.js'
import { actionCurve } from '../actions/pointer/curve.js'
import { createStrokeContext } from '../actions/pointer/strokeContext.js'
import { vectorGui } from '../gui/vector.js'
import { renderCanvas } from '../canvas/render.js'
import { coordArrayFromSet } from '../utils/maskHelpers.js'
import { addToTimeline } from '../actions/undoRedo/undoRedo.js'
import { rerouteVectorStepsAction } from './adjust.js'
import { getChainStartPoint } from '../gui/vectorLinkedUpdates.js'
import {
  getCropNormalizedCursorX,
  getCropNormalizedCursorY,
} from '../utils/coordinateHelpers.js'

//=====================================//
//=== * * * Vector Controller * * * ===//
//=====================================//

/**
 * Returns the active curve type name based on the current tool modes.
 * @returns {'line'|'quadCurve'|'cubicCurve'} The active curve mode name
 */
export function getActiveCurveMode() {
  const modes = globalState.tool.current.modes
  if (modes.cubicCurve) return 'cubicCurve'
  if (modes.quadCurve) return 'quadCurve'
  return 'line'
}

/**
 * Build a StrokeContext from the current tool state
 * @param {boolean} isPreview - Whether this context is for a preview render
 * @returns {object} StrokeContext
 */
function buildCurveCtx(isPreview = false) {
  return createStrokeContext({
    layer: canvas.currentLayer,
    isPreview,
    boundaryBox: globalState.selection.boundaryBox,
    currentColor: swatches.primary.color,
    currentModes: globalState.tool.current.modes,
    maskSet: globalState.selection.maskSet,
    brushStamp:
      brushStamps[globalState.tool.current.brushType][
        globalState.tool.current.brushSize
      ],
    brushSize: globalState.tool.current.brushSize,
    ditherPattern: ditherPatterns[globalState.tool.current.ditherPatternIndex],
    twoColorMode: globalState.tool.current.modes?.twoColor ?? false,
    secondaryColor: swatches.secondary.color,
    ditherOffsetX: globalState.tool.current.ditherOffsetX ?? 0,
    ditherOffsetY: globalState.tool.current.ditherOffsetY ?? 0,
  })
}

/**
 * Draw curves (line, quadratic, cubic bezier curves)
 * Supported modes: "draw, erase",
 */
function curveSteps() {
  const normalizedX = getCropNormalizedCursorX()
  const normalizedY = getCropNormalizedCursorY()

  const activeCurveMode = getActiveCurveMode()
  const maxClicks =
    activeCurveMode === 'cubicCurve'
      ? 3
      : activeCurveMode === 'quadCurve'
        ? 2
        : 1
  const { cropOffsetX, cropOffsetY } = globalState.canvas
  if (
    globalState.tool.current.options.chain?.active &&
    canvas.pointerEvent === 'pointerdown' &&
    globalState.tool.clickCounter === 0
  ) {
    const chainPoint = getChainStartPoint()
    if (chainPoint !== null) {
      globalState.tool.clickCounter += 1
      vectorGui.reset()
      globalState.vector.properties.tool = globalState.tool.current.name
      globalState.vector.properties.px1 = chainPoint.x
      globalState.vector.properties.py1 = chainPoint.y
      globalState.vector.properties.px2 = chainPoint.x
      globalState.vector.properties.py2 = chainPoint.y
      renderCanvas(canvas.currentLayer)
      actionCurve(
        chainPoint.x + cropOffsetX,
        chainPoint.y + cropOffsetY,
        chainPoint.x + cropOffsetX,
        chainPoint.y + cropOffsetY,
        // do the control points need to be set to chain point as well? or just start and end?
        globalState.vector.properties.px3 + cropOffsetX,
        globalState.vector.properties.py3 + cropOffsetY,
        globalState.vector.properties.px4 + cropOffsetX,
        globalState.vector.properties.py4 + cropOffsetY,
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
      globalState.tool.clickCounter += 1
      if (globalState.tool.clickCounter > maxClicks)
        globalState.tool.clickCounter = 1
      switch (globalState.tool.clickCounter) {
        case 1:
          //reset control points
          vectorGui.reset()
          globalState.vector.properties.tool = globalState.tool.current.name
          globalState.vector.properties.px1 = normalizedX
          globalState.vector.properties.py1 = normalizedY
          //endpoint starts at same point as startpoint
          globalState.vector.properties.px2 = normalizedX
          globalState.vector.properties.py2 = normalizedY
          break
        case 2:
          globalState.vector.properties.px3 = normalizedX
          globalState.vector.properties.py3 = normalizedY
          break
        case 3:
          globalState.vector.properties.px4 = normalizedX
          globalState.vector.properties.py4 = normalizedY
          break
        default:
        //do nothing
      }
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      actionCurve(
        globalState.vector.properties.px1 + cropOffsetX,
        globalState.vector.properties.py1 + cropOffsetY,
        globalState.vector.properties.px2 + cropOffsetX,
        globalState.vector.properties.py2 + cropOffsetY,
        globalState.vector.properties.px3 + cropOffsetX,
        globalState.vector.properties.py3 + cropOffsetY,
        globalState.vector.properties.px4 + cropOffsetX,
        globalState.vector.properties.py4 + cropOffsetY,
        globalState.tool.clickCounter,
        buildCurveCtx(true),
      )
      break
    case 'pointermove':
      switch (globalState.tool.clickCounter) {
        case 1:
          globalState.vector.properties.px2 = normalizedX
          globalState.vector.properties.py2 = normalizedY
          break
        case 2:
          globalState.vector.properties.px3 = normalizedX
          globalState.vector.properties.py3 = normalizedY
          break
        case 3:
          globalState.vector.properties.px4 = normalizedX
          globalState.vector.properties.py4 = normalizedY
          break
        default:
        //do nothing
      }
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      actionCurve(
        globalState.vector.properties.px1 + cropOffsetX,
        globalState.vector.properties.py1 + cropOffsetY,
        globalState.vector.properties.px2 + cropOffsetX,
        globalState.vector.properties.py2 + cropOffsetY,
        globalState.vector.properties.px3 + cropOffsetX,
        globalState.vector.properties.py3 + cropOffsetY,
        globalState.vector.properties.px4 + cropOffsetX,
        globalState.vector.properties.py4 + cropOffsetY,
        globalState.tool.clickCounter,
        buildCurveCtx(true),
      )
      break
    case 'pointerup':
      switch (globalState.tool.clickCounter) {
        case 1:
          globalState.vector.properties.px2 = normalizedX
          globalState.vector.properties.py2 = normalizedY
          break
        case 2:
          globalState.vector.properties.px3 = normalizedX
          globalState.vector.properties.py3 = normalizedY
          break
        case 3:
          globalState.vector.properties.px4 = normalizedX
          globalState.vector.properties.py4 = normalizedY
          break
        default:
        //do nothing
      }
      //Solidify vector
      if (globalState.tool.clickCounter === maxClicks) {
        actionCurve(
          globalState.vector.properties.px1 + cropOffsetX,
          globalState.vector.properties.py1 + cropOffsetY,
          globalState.vector.properties.px2 + cropOffsetX,
          globalState.vector.properties.py2 + cropOffsetY,
          globalState.vector.properties.px3 + cropOffsetX,
          globalState.vector.properties.py3 + cropOffsetY,
          globalState.vector.properties.px4 + cropOffsetX,
          globalState.vector.properties.py4 + cropOffsetY,
          globalState.tool.clickCounter,
          buildCurveCtx(false),
        )
        globalState.tool.clickCounter = 0
        let maskArray = coordArrayFromSet(
          globalState.selection.maskSet,
          canvas.currentLayer.x + globalState.canvas.cropOffsetX,
          canvas.currentLayer.y + globalState.canvas.cropOffsetY,
        )
        //correct boundary box for layer offset and crop offset
        const boundaryBox = { ...globalState.selection.boundaryBox }
        if (boundaryBox.xMax !== null) {
          boundaryBox.xMin -=
            canvas.currentLayer.x + globalState.canvas.cropOffsetX
          boundaryBox.xMax -=
            canvas.currentLayer.x + globalState.canvas.cropOffsetX
          boundaryBox.yMin -=
            canvas.currentLayer.y + globalState.canvas.cropOffsetY
          boundaryBox.yMax -=
            canvas.currentLayer.y + globalState.canvas.cropOffsetY
        }
        //generate new unique key for vector
        const uniqueVectorKey = globalState.vector.nextKey()
        globalState.vector.setCurrentIndex(uniqueVectorKey)
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
          secondaryColor: { ...swatches.secondary.color },
          ditherPatternIndex: globalState.tool.current.ditherPatternIndex,
          ditherOffsetX:
            (((globalState.tool.current.ditherOffsetX +
              globalState.canvas.cropOffsetX) %
              8) +
              8) %
            8,
          ditherOffsetY:
            (((globalState.tool.current.ditherOffsetY +
              globalState.canvas.cropOffsetY) %
              8) +
              8) %
            8,
          recordedLayerX: canvas.currentLayer.x,
          recordedLayerY: canvas.currentLayer.y,
          brushSize: globalState.tool.current.brushSize,
          brushType: globalState.tool.current.brushType,
          vectorProperties: {
            ...globalState.vector.properties,
            px1: globalState.vector.properties.px1 - canvas.currentLayer.x,
            py1: globalState.vector.properties.py1 - canvas.currentLayer.y,
            px2: globalState.vector.properties.px2 - canvas.currentLayer.x,
            py2: globalState.vector.properties.py2 - canvas.currentLayer.y,
            px3: globalState.tool.current.modes.line
              ? null
              : globalState.vector.properties.px3 - canvas.currentLayer.x,
            py3: globalState.tool.current.modes.line
              ? null
              : globalState.vector.properties.py3 - canvas.currentLayer.y,
            px4:
              globalState.tool.current.modes.line ||
              globalState.tool.current.modes.quadCurve
                ? null
                : globalState.vector.properties.px4 - canvas.currentLayer.x,
            py4:
              globalState.tool.current.modes.line ||
              globalState.tool.current.modes.quadCurve
                ? null
                : globalState.vector.properties.py4 - canvas.currentLayer.y,
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

export const curve = {
  name: 'curve',
  fn: curveSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: false,
  ditherPatternIndex: 63,
  ditherOffsetX: 0,
  ditherOffsetY: 0,
  options: {
    chain: { active: false },
    //Priority hierarchy of options: Equal = Align > Hold > Link
    equal: { active: false }, // Magnitude continuity
    align: { active: true }, // Tangential continuity
    hold: { active: false },
    link: { active: true }, // Positional continuity
    // displayVectors: false,
    displayPaths: { active: false },
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
