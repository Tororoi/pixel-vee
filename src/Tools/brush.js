import { brushStamps } from '../Context/brushStamps.js'
import { state } from '../Context/state.js'
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
      if (state.tool.current.modes?.colorMask) {
        state.selection.maskSet = createColorMaskSet(
          swatches.secondary.color,
          canvas.currentLayer,
        )
      }
      state.selection.pointsSet = new Set()
      state.selection.seenPixelsSet = new Set()
      //rebuild build-up density map from timeline so drawing is always correct
      if (brush.modes.buildUpDither) {
        rebuildBuildUpDensityMap()
      }
      //Build stroke context once — reused for every point in this stroke
      const isCustomStamp = state.tool.current.brushType === 'custom'
      brush._strokeCtx = createStrokeContext({
        layer: canvas.currentLayer,
        boundaryBox: state.selection.boundaryBox,
        currentColor: swatches.primary.color,
        currentModes: state.tool.current.modes,
        maskSet: state.selection.maskSet,
        seenPixelsSet: state.selection.seenPixelsSet,
        brushStamp: isCustomStamp
          ? brushStamps.custom
          : brushStamps[state.tool.current.brushType][
              state.tool.current.brushSize
            ],
        brushSize: isCustomStamp ? 32 : state.tool.current.brushSize,
        ditherPattern: ditherPatterns[brush.ditherPatternIndex],
        twoColorMode: brush.modes.twoColor,
        secondaryColor: swatches.secondary.color,
        ditherOffsetX: brush.ditherOffsetX,
        ditherOffsetY: brush.ditherOffsetY,
        densityMap: brush._buildUpDensityMap,
        buildUpSteps: brush.buildUpSteps,
        customStampColorMap: null,
      })
      brush._previewStrokeCtx = {
        ...brush._strokeCtx,
        isPreview: true,
        excludeFromSet: true,
      }
      //initial point
      drawBrushPoint(state.cursor.x, state.cursor.y, brushDirection)
      //For line
      state.tool.lineStartX = state.cursor.x
      state.tool.lineStartY = state.cursor.y
      //for perfect pixels
      state.drawing.lastDrawnX = state.cursor.x
      state.drawing.lastDrawnY = state.cursor.y
      state.drawing.waitingPixelX = state.cursor.x
      state.drawing.waitingPixelY = state.cursor.y
      scheduleRender(canvas.currentLayer)
      break
    }
    case 'pointermove':
      //draw line connecting points that don't touch or if shift is held
      if (state.tool.current.options.line?.active) {
        renderCanvas(canvas.currentLayer)
        //preview the line
        actionLine(
          state.tool.lineStartX,
          state.tool.lineStartY,
          state.cursor.x,
          state.cursor.y,
          { ...brush._strokeCtx, isPreview: true },
        )
      } else if (shouldDrawLine()) {
        drawLine()
        scheduleRender(canvas.currentLayer)
      } else {
        if (state.tool.current.modes?.perfect) {
          handlePerfectPixels()
        } else {
          //draw normally
          brushDirection = calculateBrushDirection(
            state.cursor.x,
            state.cursor.y,
            state.cursor.prevX,
            state.cursor.prevY,
          )
          drawBrushPoint(state.cursor.x, state.cursor.y, brushDirection)
          scheduleRender(canvas.currentLayer)
        }
      }
      break
    case 'pointerup': {
      if (shouldDrawLine()) {
        drawLine()
      }
      //only needed if perfect pixels option is on
      drawBrushPoint(state.cursor.x, state.cursor.y, brushDirection)
      scheduleRender(canvas.currentLayer)
      //add action to timeline
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
      const timelineProperties = {
        modes: { ...brush.modes },
        color: { ...swatches.primary.color },
        secondaryColor: { ...swatches.secondary.color },
        brushSize: brush.brushType === 'custom' ? 32 : brush.brushSize,
        brushType: brush.brushType,
        customStampEntry:
          brush.brushType === 'custom' ? brushStamps.custom : null,
        ditherPatternIndex: brush.ditherPatternIndex,
        ditherOffsetX: brush.ditherOffsetX,
        ditherOffsetY: brush.ditherOffsetY,
        recordedLayerX: canvas.currentLayer.x,
        recordedLayerY: canvas.currentLayer.y,
        points: state.timeline.points,
        maskArray,
        boundaryBox,
      }
      if (brush.modes.buildUpDither) {
        timelineProperties.buildUpDensityDelta = [
          ...state.selection.seenPixelsSet,
        ]
        timelineProperties.buildUpSteps = [...brush.buildUpSteps]
      }
      addToTimeline({
        tool: brush.name,
        layer: canvas.currentLayer,
        properties: timelineProperties,
      })
      if (brush.modes.buildUpDither) {
        rebuildBuildUpDensityMap()
      }
      if (state.tool.current.modes?.colorMask) {
        state.selection.maskSet = null
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
 * Add point to state.timeline.points if it is not already there
 * @param {number} x - (Integer)
 * @param {number} y - (Integer)
 */
function addPointToAction(x, y) {
  const key = (y << 16) | x
  if (!state.selection.pointsSet.has(key)) {
    state.timeline.addPoint({
      x: x - canvas.currentLayer.x,
      y: y - canvas.currentLayer.y,
      brushSize:
        state.tool.current.brushType === 'custom'
          ? 32
          : state.tool.current.brushSize,
    })
    state.selection.pointsSet.add(key)
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
  if (brush.modes.buildUpDither) {
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
    state.cursor.x,
    state.cursor.y,
    state.drawing.lastDrawnX,
    state.drawing.lastDrawnY,
  )
  const stamp = brush._previewStrokeCtx.brushStamp[brushDirection]
  if (brush.modes.buildUpDither) {
    actionBuildUpDitherDraw(
      state.cursor.x,
      state.cursor.y,
      stamp,
      brush._previewStrokeCtx,
    )
  } else {
    actionDitherDraw(
      state.cursor.x,
      state.cursor.y,
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
    Math.abs(state.cursor.x - state.cursor.prevX) > 1 ||
    Math.abs(state.cursor.y - state.cursor.prevY) > 1 ||
    (state.tool.lineStartX !== null && state.tool.lineStartY !== null)
  )
}

/**
 * Draw line between two points
 */
function drawLine() {
  let lineStartX =
    state.tool.lineStartX !== null ? state.tool.lineStartX : state.cursor.prevX
  let lineStartY =
    state.tool.lineStartY !== null ? state.tool.lineStartY : state.cursor.prevY
  let angle = getAngle(state.cursor.x - lineStartX, state.cursor.y - lineStartY)
  let tri = getTriangle(
    lineStartX,
    lineStartY,
    state.cursor.x,
    state.cursor.y,
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
  state.tool.lineStartX = null
  state.tool.lineStartY = null
  //fill endpoint
  brushDirection = calculateBrushDirection(
    state.cursor.x,
    state.cursor.y,
    previousX,
    previousY,
  )
  drawBrushPoint(state.cursor.x, state.cursor.y, brushDirection)
}

/**
 * Draw perfect pixels
 */
function handlePerfectPixels() {
  let brushDirection = '0,0'
  //if current pixel not a neighbor to lastDrawn and has not already been drawn, draw waiting pixel
  if (
    Math.abs(state.cursor.x - state.drawing.lastDrawnX) > 1 ||
    Math.abs(state.cursor.y - state.drawing.lastDrawnY) > 1
  ) {
    //Draw the previous waiting pixel
    brushDirection = calculateBrushDirection(
      state.drawing.waitingPixelX,
      state.drawing.waitingPixelY,
      state.drawing.lastDrawnX,
      state.drawing.lastDrawnY,
    )
    drawBrushPoint(
      state.drawing.waitingPixelX,
      state.drawing.waitingPixelY,
      brushDirection,
    )
    //update queue
    state.drawing.lastDrawnX = state.drawing.waitingPixelX
    state.drawing.lastDrawnY = state.drawing.waitingPixelY
    state.drawing.waitingPixelX = state.cursor.x
    state.drawing.waitingPixelY = state.cursor.y
    renderCanvas(canvas.currentLayer)
    //preview the next pixel
    drawPreviewBrushPoint()
  } else {
    state.drawing.waitingPixelX = state.cursor.x
    state.drawing.waitingPixelY = state.cursor.y
    renderCanvas(canvas.currentLayer)
    //preview the next pixel
    drawPreviewBrushPoint()
  }
}

//====================================//
//===== * * * Brush Object * * * =====//
//====================================//

export const BAYER_STEPS = {
  '2x2': [16, 32, 48, 64],
  '4x4': [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64],
  '8x8': Array.from({ length: 64 }, (_, i) => i + 1),
}

export const brush = {
  name: 'brush',
  fn: brushSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: false,
  ditherPatternIndex: 64,
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
  buildUpSteps: [8, 16, 24, 32, 40, 48, 56, 64],
  _customBuildUpSteps: [8, 16, 24, 32, 40, 48, 56, 64],
  buildUpActiveStepSlot: null,
  _buildUpDensityMap: new Map(),
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
  const map = new Map()
  const startIndex = brush._buildUpResetAtIndex ?? 0
  for (let i = startIndex; i < state.timeline.undoStack.length; i++) {
    const action = state.timeline.undoStack[i]
    if (
      action.tool === 'brush' &&
      action.modes?.buildUpDither &&
      action.layer === layer &&
      action.buildUpDensityDelta
    ) {
      for (const coord of action.buildUpDensityDelta) {
        map.set(coord, (map.get(coord) ?? 0) + 1)
      }
    }
  }
  brush._buildUpDensityMap = map
}
