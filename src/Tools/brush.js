import { brushStamps } from '../Context/brushStamps.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'
import {
  actionDitherDraw,
  actionBuildUpDitherDraw,
} from '../Actions/pointer/draw.js'
import { actionLine } from '../Actions/pointer/line.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { getAngle, getTriangle } from '../utils/trig.js'
import { renderCanvas, scheduleRender } from '../Canvas/render.js'
import { calculateBrushDirection } from '../utils/drawHelpers.js'
import { coordArrayFromSet } from '../utils/maskHelpers.js'
import { createColorMaskSet } from '../Canvas/masks.js'
import { addToTimeline } from '../Actions/undoRedo/undoRedo.js'

//====================================//
//=== * * * Brush Controller * * * ===//
//====================================//

/**
 * Handle brush tool with global state
 */
function brushSteps() {
  let brushDirection = '0,0'
  switch (canvas.pointerEvent) {
    case 'pointerdown': {
      //initialize sets
      if (globalState.tool.current.modes?.colorMask) {
        globalState.selection.maskSet = createColorMaskSet(
          swatches.secondary.color,
          canvas.currentLayer,
        )
      }
      globalState.selection.pointsSet = new Set()
      globalState.selection.seenPixelsSet = new Set()
      //rebuild build-up density map from timeline so drawing is always correct
      if (globalState.tool.current.modes?.buildUpDither) {
        rebuildBuildUpDensityMap()
      }
      //Build stroke context once — reused for every point in this stroke
      const isCustomStamp = globalState.tool.current.brushType === 'custom'
      brush._strokeCtx = createStrokeContext({
        layer: canvas.currentLayer,
        boundaryBox: globalState.selection.boundaryBox,
        currentColor: swatches.primary.color,
        currentModes: globalState.tool.current.modes,
        maskSet: globalState.selection.maskSet,
        seenPixelsSet: globalState.selection.seenPixelsSet,
        brushStamp: isCustomStamp
          ? brushStamps.custom
          : brushStamps[globalState.tool.current.brushType][
              globalState.tool.current.brushSize
            ],
        brushSize: isCustomStamp ? 32 : globalState.tool.current.brushSize,
        ditherPattern:
          ditherPatterns[globalState.tool.current.ditherPatternIndex],
        twoColorMode: globalState.tool.current.modes?.twoColor,
        secondaryColor: swatches.secondary.color,
        ditherOffsetX: globalState.tool.current.ditherOffsetX,
        ditherOffsetY: globalState.tool.current.ditherOffsetY,
        densityMap: brush._buildUpDensityMap,
        buildUpSteps: globalState.tool.current.buildUpSteps,
        customStampColorMap: null,
      })
      brush._previewStrokeCtx = {
        ...brush._strokeCtx,
        isPreview: true,
        excludeFromSet: true,
      }
      //initial point
      drawBrushPoint(globalState.cursor.x, globalState.cursor.y, brushDirection)
      //For line
      globalState.tool.lineStartX = globalState.cursor.x
      globalState.tool.lineStartY = globalState.cursor.y
      //for perfect pixels
      globalState.drawing.lastDrawnX = globalState.cursor.x
      globalState.drawing.lastDrawnY = globalState.cursor.y
      globalState.drawing.waitingPixelX = globalState.cursor.x
      globalState.drawing.waitingPixelY = globalState.cursor.y
      scheduleRender(canvas.currentLayer)
      break
    }
    case 'pointermove':
      //draw line connecting points that don't touch or if shift is held
      if (globalState.tool.current.options.line?.active) {
        renderCanvas(canvas.currentLayer)
        //preview the line
        actionLine(
          globalState.tool.lineStartX,
          globalState.tool.lineStartY,
          globalState.cursor.x,
          globalState.cursor.y,
          { ...brush._strokeCtx, isPreview: true },
        )
      } else if (shouldDrawLine()) {
        drawLine()
        scheduleRender(canvas.currentLayer)
      } else {
        if (globalState.tool.current.modes?.perfect) {
          handlePerfectPixels()
        } else {
          //draw normally
          brushDirection = calculateBrushDirection(
            globalState.cursor.x,
            globalState.cursor.y,
            globalState.cursor.prevX,
            globalState.cursor.prevY,
          )
          drawBrushPoint(
            globalState.cursor.x,
            globalState.cursor.y,
            brushDirection,
          )
          scheduleRender(canvas.currentLayer)
        }
      }
      break
    case 'pointerup': {
      if (shouldDrawLine()) {
        drawLine()
      }
      //only needed if perfect pixels option is on
      drawBrushPoint(globalState.cursor.x, globalState.cursor.y, brushDirection)
      scheduleRender(canvas.currentLayer)
      //add action to timeline
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
      const timelineProperties = {
        modes: { ...globalState.tool.current.modes },
        color: { ...swatches.primary.color },
        secondaryColor: { ...swatches.secondary.color },
        brushSize:
          globalState.tool.current.brushType === 'custom'
            ? 32
            : globalState.tool.current.brushSize,
        brushType: globalState.tool.current.brushType,
        customStampEntry:
          globalState.tool.current.brushType === 'custom'
            ? brushStamps.custom
            : null,
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
        points: globalState.timeline.points,
        maskArray,
        boundaryBox,
      }
      if (globalState.tool.current.modes?.buildUpDither) {
        const lx = canvas.currentLayer.x + globalState.canvas.cropOffsetX
        const ly = canvas.currentLayer.y + globalState.canvas.cropOffsetY
        timelineProperties.buildUpDensityDelta = [
          ...globalState.selection.seenPixelsSet,
        ].map((coord) => {
          const rx = (coord & 0xffff) - lx
          const ry = ((coord >>> 16) & 0xffff) - ly
          return (ry << 16) | rx
        })
        timelineProperties.buildUpSteps = [
          ...globalState.tool.current.buildUpSteps,
        ]
      }
      addToTimeline({
        tool: brush.name,
        layer: canvas.currentLayer,
        properties: timelineProperties,
      })
      if (globalState.tool.current.modes?.buildUpDither) {
        rebuildBuildUpDensityMap()
      }
      if (globalState.tool.current.modes?.colorMask) {
        globalState.selection.maskSet = null
      }
      break
    }
    default:
    //do nothing
  }
}

//====================================//
//======= * * * Helpers * * * ========//
//====================================//

/**
 * Add point to globalState.timeline.points if it is not already there
 * @param {number} x - (Integer)
 * @param {number} y - (Integer)
 */
function addPointToAction(x, y) {
  const key = (y << 16) | x
  if (!globalState.selection.pointsSet.has(key)) {
    globalState.timeline.addPoint({
      x: x - canvas.currentLayer.x - globalState.canvas.cropOffsetX,
      y: y - canvas.currentLayer.y - globalState.canvas.cropOffsetY,
      brushSize:
        globalState.tool.current.brushType === 'custom'
          ? 32
          : globalState.tool.current.brushSize,
    })
    globalState.selection.pointsSet.add(key)
  }
}

/**
 *
 * @param {number} x - (Integer)
 * @param {number} y - (Integer)
 * @param {string} brushDirection - one of 9 directions
 */
function drawBrushPoint(x, y, brushDirection) {
  addPointToAction(x, y)
  const stamp = brush._strokeCtx.brushStamp[brushDirection]
  if (globalState.tool.current.modes?.buildUpDither) {
    actionBuildUpDitherDraw(x, y, stamp, brush._strokeCtx)
  } else {
    actionDitherDraw(x, y, stamp, brush._strokeCtx)
  }
}

/**
 * Draw the next pixel in the brush stroke for perfect pixels preview pixel
 */
function drawPreviewBrushPoint() {
  let brushDirection = calculateBrushDirection(
    globalState.cursor.x,
    globalState.cursor.y,
    globalState.drawing.lastDrawnX,
    globalState.drawing.lastDrawnY,
  )
  const stamp = brush._previewStrokeCtx.brushStamp[brushDirection]
  if (globalState.tool.current.modes?.buildUpDither) {
    actionBuildUpDitherDraw(
      globalState.cursor.x,
      globalState.cursor.y,
      stamp,
      brush._previewStrokeCtx,
    )
  } else {
    actionDitherDraw(
      globalState.cursor.x,
      globalState.cursor.y,
      stamp,
      brush._previewStrokeCtx,
    )
  }
}

/**
 * Check if cursor is far enough from previous point to draw a line
 * @returns {boolean} - True if cursor is far enough from previous point to draw a line
 */
function shouldDrawLine() {
  return (
    Math.abs(globalState.cursor.x - globalState.cursor.prevX) > 1 ||
    Math.abs(globalState.cursor.y - globalState.cursor.prevY) > 1 ||
    (globalState.tool.lineStartX !== null &&
      globalState.tool.lineStartY !== null)
  )
}

/**
 * Draw line between two points
 */
function drawLine() {
  let lineStartX =
    globalState.tool.lineStartX !== null
      ? globalState.tool.lineStartX
      : globalState.cursor.prevX
  let lineStartY =
    globalState.tool.lineStartY !== null
      ? globalState.tool.lineStartY
      : globalState.cursor.prevY
  let angle = getAngle(
    globalState.cursor.x - lineStartX,
    globalState.cursor.y - lineStartY,
  )
  let tri = getTriangle(
    lineStartX,
    lineStartY,
    globalState.cursor.x,
    globalState.cursor.y,
    angle,
  )

  let previousX = lineStartX
  let previousY = lineStartY
  let brushDirection = '0,0'
  for (let i = 0; i < tri.long; i++) {
    const thisx = Math.round(lineStartX + tri.x * i)
    const thisy = Math.round(lineStartY + tri.y * i)
    // for each point along the line
    brushDirection = calculateBrushDirection(thisx, thisy, previousX, previousY)
    drawBrushPoint(thisx, thisy, brushDirection)
    previousX = thisx
    previousY = thisy
  }
  //Reset lineStart Coords
  globalState.tool.lineStartX = null
  globalState.tool.lineStartY = null
  //fill endpoint
  brushDirection = calculateBrushDirection(
    globalState.cursor.x,
    globalState.cursor.y,
    previousX,
    previousY,
  )
  drawBrushPoint(globalState.cursor.x, globalState.cursor.y, brushDirection)
}

/**
 * Draw perfect pixels
 */
function handlePerfectPixels() {
  let brushDirection = '0,0'
  //if current pixel not a neighbor to lastDrawn and has not already been drawn, draw waiting pixel
  if (
    Math.abs(globalState.cursor.x - globalState.drawing.lastDrawnX) > 1 ||
    Math.abs(globalState.cursor.y - globalState.drawing.lastDrawnY) > 1
  ) {
    //Draw the previous waiting pixel
    brushDirection = calculateBrushDirection(
      globalState.drawing.waitingPixelX,
      globalState.drawing.waitingPixelY,
      globalState.drawing.lastDrawnX,
      globalState.drawing.lastDrawnY,
    )
    drawBrushPoint(
      globalState.drawing.waitingPixelX,
      globalState.drawing.waitingPixelY,
      brushDirection,
    )
    //update queue
    globalState.drawing.lastDrawnX = globalState.drawing.waitingPixelX
    globalState.drawing.lastDrawnY = globalState.drawing.waitingPixelY
    globalState.drawing.waitingPixelX = globalState.cursor.x
    globalState.drawing.waitingPixelY = globalState.cursor.y
    renderCanvas(canvas.currentLayer)
    //preview the next pixel
    drawPreviewBrushPoint()
  } else {
    globalState.drawing.waitingPixelX = globalState.cursor.x
    globalState.drawing.waitingPixelY = globalState.cursor.y
    renderCanvas(canvas.currentLayer)
    //preview the next pixel
    drawPreviewBrushPoint()
  }
}

//====================================//
//===== * * * Brush Object * * * =====//
//====================================//

export const BAYER_STEPS = {
  '2x2': [15, 31, 47, 63],
  '4x4': [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63],
  '8x8': Array.from({ length: 64 }, (_, i) => i),
}

export const brush = {
  name: 'brush',
  fn: brushSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: false,
  ditherPatternIndex: 63,
  ditherOffsetX: 0,
  ditherOffsetY: 0,
  options: { line: { active: false } },
  modes: {
    eraser: false,
    inject: false,
    perfect: false,
    colorMask: false,
    twoColor: false,
    buildUpDither: false,
  },
  buildUpMode: 'custom',
  buildUpSteps: [7, 15, 23, 31, 39, 47, 55, 63],
  _customBuildUpSteps: [7, 15, 23, 31, 39, 47, 55, 63],
  buildUpActiveStepSlot: null,
  _buildUpDensityMap: null,
  _buildUpResetAtIndex: 0,
  _strokeCtx: null,
  _previewStrokeCtx: null,
  type: 'raster',
  cursor: 'crosshair',
  activeCursor: 'crosshair',
}

/**
 * Rebuild brush._buildUpDensityMap by scanning the undo stack for all
 * build-up dither brush actions on the current layer.
 * Call this whenever strokes are added, undone, or redone.
 */
export function rebuildBuildUpDensityMap() {
  const layer = canvas.currentLayer
  const cw = canvas.offScreenCVS.width
  const ch = canvas.offScreenCVS.height
  const map = new Int32Array(cw * ch)
  const startIndex = brush._buildUpResetAtIndex ?? 0
  for (let i = startIndex; i < globalState.timeline.undoStack.length; i++) {
    const action = globalState.timeline.undoStack[i]
    if (
      action.tool === 'brush' &&
      action.modes?.buildUpDither &&
      action.layer === layer &&
      action.buildUpDensityDelta
    ) {
      const lx = layer.x + globalState.canvas.cropOffsetX
      const ly = layer.y + globalState.canvas.cropOffsetY
      for (const coord of action.buildUpDensityDelta) {
        const ax = (coord & 0xffff) + lx
        const ay = ((coord >>> 16) & 0xffff) + ly
        if (ax >= 0 && ax < cw && ay >= 0 && ay < ch) {
          map[ay * cw + ax] += 1
        }
      }
    }
  }
  brush._buildUpDensityMap = map
}
