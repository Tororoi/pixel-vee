import { brushStamps } from '../Context/brushStamps.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'
import { actionDitherDraw, actionBuildUpDitherDraw } from '../Actions/pointer/draw.js'
import { actionLine } from '../Actions/pointer/line.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { getAngle, getTriangle } from '../utils/trig.js'
import { renderCanvas, scheduleRender } from '../Canvas/render.js'
import { calculateBrushDirection } from '../utils/drawHelpers.js'
import { coordArrayFromSet } from '../utils/maskHelpers.js'
import { createColorMaskSet } from '../Canvas/masks.js'
import { addToTimeline } from '../Actions/undoRedo/undoRedo.js'
import { fitSmoothedCurve } from '../utils/smoothCurves.js'
import { plotQuadBezier } from '../utils/bezier.js'

//====================================//
//=== * * * Brush Controller * * * ===//
//====================================//

/**
 * Handle brush tool with global state
 */
function brushSteps() {
  let brushDirection = '0,0'
  switch (canvas.pointerEvent) {
    case 'pointerdown':
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
      brush._strokeCtx = createStrokeContext({
        layer: canvas.currentLayer,
        boundaryBox: state.selection.boundaryBox,
        currentColor: swatches.primary.color,
        currentModes: state.tool.current.modes,
        maskSet: state.selection.maskSet,
        seenPixelsSet: state.selection.seenPixelsSet,
        brushStamp: brushStamps[state.tool.current.brushType][state.tool.current.brushSize],
        brushSize: state.tool.current.brushSize,
        ditherPattern: ditherPatterns[brush.ditherPatternIndex],
        twoColorMode: brush.modes.twoColor,
        secondaryColor: swatches.secondary.color,
        ditherOffsetX: brush.ditherOffsetX,
        ditherOffsetY: brush.ditherOffsetY,
        densityMap: brush._buildUpDensityMap,
        buildUpSteps: brush.buildUpSteps,
      })
      brush._previewStrokeCtx = { ...brush._strokeCtx, isPreview: true, excludeFromSet: true }
      //snapshot canvas before stroke for smooth curves restoration
      if (brush.modes.smoothCurves) {
        const { width: w, height: h } = canvas.currentLayer.cvs
        brush._smoothImageData = canvas.currentLayer.ctx.getImageData(0, 0, w, h)
        brush._rawSmoothPoints = [{ x: state.cursor.x, y: state.cursor.y }]
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
      if (brush.modes.smoothCurves && brush._rawSmoothPoints) {
        const last = brush._rawSmoothPoints[brush._rawSmoothPoints.length - 1]
        if (last.x !== state.cursor.x || last.y !== state.cursor.y) {
          brush._rawSmoothPoints.push({ x: state.cursor.x, y: state.cursor.y })
        }
      }
      break
    case 'pointerup': {
      if (shouldDrawLine()) {
        drawLine()
      }
      //only needed if perfect pixels option is on
      drawBrushPoint(state.cursor.x, state.cursor.y, brushDirection)
      //smooth curves: restore rough stroke and redraw as fitted bezier curves
      if (brush.modes.smoothCurves && brush._rawSmoothPoints) {
        const last = brush._rawSmoothPoints[brush._rawSmoothPoints.length - 1]
        if (last.x !== state.cursor.x || last.y !== state.cursor.y) {
          brush._rawSmoothPoints.push({ x: state.cursor.x, y: state.cursor.y })
        }
        //restore canvas to pre-stroke state
        canvas.currentLayer.ctx.putImageData(brush._smoothImageData, 0, 0)
        //reset per-stroke tracking for clean redraw pass
        //(do NOT reset boundaryBox — _strokeCtx holds the same object reference and must keep accumulating)
        const freshSeen = new Set()
        state.selection.seenPixelsSet = freshSeen
        state.selection.pointsSet = new Set()
        state.timeline.clearPoints()
        brush._strokeCtx.seenPixelsSet = freshSeen
        //fit and draw smooth bezier curves
        const segments = fitSmoothedCurve(brush._rawSmoothPoints, brush.smoothCurvesEpsilon, brush.smoothCurvesTension)
        let prevX = brush._rawSmoothPoints[0].x
        let prevY = brush._rawSmoothPoints[0].y
        if (segments.length === 0) {
          //single click — redraw the initial dot
          drawBrushPoint(prevX, prevY, '0,0')
        } else {
          for (const seg of segments) {
            const pts = plotQuadBezier(
              Math.round(seg.x0), Math.round(seg.y0),
              Math.round(seg.cpx), Math.round(seg.cpy),
              Math.round(seg.x1), Math.round(seg.y1),
            )
            for (const pt of pts) {
              const dir = calculateBrushDirection(pt.x, pt.y, prevX, prevY)
              drawBrushPoint(pt.x, pt.y, dir)
              prevX = pt.x
              prevY = pt.y
            }
          }
        }
        brush._rawSmoothPoints = null
        brush._smoothImageData = null
      }
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
        brushSize: brush.brushSize,
        brushType: brush.brushType,
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
      brushSize: state.tool.current.brushSize,
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
    actionBuildUpDitherDraw(state.cursor.x, state.cursor.y, stamp, brush._previewStrokeCtx)
  } else {
    actionDitherDraw(state.cursor.x, state.cursor.y, stamp, brush._previewStrokeCtx)
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
    smoothCurves: false,
  },
  buildUpMode: 'custom',
  buildUpSteps: [8, 16, 24, 32, 40, 48, 56, 64],
  _customBuildUpSteps: [8, 16, 24, 32, 40, 48, 56, 64],
  buildUpActiveStepSlot: null,
  _buildUpDensityMap: new Map(),
  _buildUpResetAtIndex: 0,
  smoothCurvesEpsilon: 2.0,
  smoothCurvesTension: 10,
  _strokeCtx: null,
  _previewStrokeCtx: null,
  _rawSmoothPoints: null,
  _smoothImageData: null,
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
