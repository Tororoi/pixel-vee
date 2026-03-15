import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { ditherPatterns } from "../Context/ditherPatterns.js"
import { actionDitherDraw, actionLine } from "../Actions/pointerActions.js"
import { getAngle, getTriangle } from "../utils/trig.js"
import { renderCanvas, scheduleRender } from "../Canvas/render.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { createColorMaskSet } from "../Canvas/masks.js"
import { addToTimeline } from "../Actions/undoRedo.js"

//====================================//
//= * * * Dither Brush Controller * * * =//
//====================================//

/**
 * Handle dither brush tool with global state
 */
function ditherBrushSteps() {
  let brushDirection = "0,0"
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (state.tool.current.modes?.colorMask) {
        state.selection.maskSet = createColorMaskSet(
          swatches.secondary.color,
          canvas.currentLayer
        )
      }
      state.selection.pointsSet = new Set()
      state.selection.seenPixelsSet = new Set()
      drawDitherBrushPoint(state.cursor.x, state.cursor.y, brushDirection)
      state.tool.lineStartX = state.cursor.x
      state.tool.lineStartY = state.cursor.y
      state.drawing.lastDrawnX = state.cursor.x
      state.drawing.lastDrawnY = state.cursor.y
      state.drawing.waitingPixelX = state.cursor.x
      state.drawing.waitingPixelY = state.cursor.y
      scheduleRender(canvas.currentLayer)
      break
    case "pointermove":
      if (state.tool.current.options.line?.active) {
        renderCanvas(canvas.currentLayer)
        actionLine(
          state.tool.lineStartX,
          state.tool.lineStartY,
          state.cursor.x,
          state.cursor.y,
          state.selection.boundaryBox,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.current.modes,
          brushStamps[state.tool.current.brushType][state.tool.current.brushSize],
          state.tool.current.brushSize,
          state.selection.maskSet,
          state.selection.seenPixelsSet,
          null,
          true
        )
      } else if (shouldDrawLine()) {
        drawLine()
        scheduleRender(canvas.currentLayer)
      } else {
        if (state.tool.current.modes?.perfect) {
          handlePerfectPixels()
        } else {
          brushDirection = calculateBrushDirection(
            state.cursor.x,
            state.cursor.y,
            state.cursor.prevX,
            state.cursor.prevY
          )
          drawDitherBrushPoint(state.cursor.x, state.cursor.y, brushDirection)
          scheduleRender(canvas.currentLayer)
        }
      }
      break
    case "pointerup": {
      if (shouldDrawLine()) {
        drawLine()
      }
      drawDitherBrushPoint(state.cursor.x, state.cursor.y, brushDirection)
      scheduleRender(canvas.currentLayer)
      let maskArray = coordArrayFromSet(
        state.selection.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y
      )
      const boundaryBox = { ...state.selection.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin -= canvas.currentLayer.x
        boundaryBox.xMax -= canvas.currentLayer.x
        boundaryBox.yMin -= canvas.currentLayer.y
        boundaryBox.yMax -= canvas.currentLayer.y
      }
      addToTimeline({
        tool: ditherBrush.name,
        layer: canvas.currentLayer,
        properties: {
          modes: { ...ditherBrush.modes },
          color: { ...swatches.primary.color },
          secondaryColor: { ...swatches.secondary.color },
          brushSize: ditherBrush.brushSize,
          brushType: ditherBrush.brushType,
          ditherPatternIndex: ditherBrush.ditherPatternIndex,
          points: state.timeline.points,
          maskArray,
          boundaryBox,
        },
      })
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
 * @param {number} x - (Integer)
 * @param {number} y - (Integer)
 * @param {string} brushDirection - one of 9 directions
 */
function drawDitherBrushPoint(x, y, brushDirection) {
  addPointToAction(x, y)
  actionDitherDraw(
    x,
    y,
    state.selection.boundaryBox,
    swatches.primary.color,
    brushStamps[state.tool.current.brushType][state.tool.current.brushSize][brushDirection],
    state.tool.current.brushSize,
    canvas.currentLayer,
    state.tool.current.modes,
    state.selection.maskSet,
    state.selection.seenPixelsSet,
    ditherPatterns[ditherBrush.ditherPatternIndex],
    ditherBrush.modes.twoColor,
    swatches.secondary.color
  )
}

/**
 * Draw preview pixel for perfect pixels mode
 */
function drawPreviewDitherBrushPoint() {
  let brushDirection = calculateBrushDirection(
    state.cursor.x,
    state.cursor.y,
    state.drawing.lastDrawnX,
    state.drawing.lastDrawnY
  )
  actionDitherDraw(
    state.cursor.x,
    state.cursor.y,
    state.selection.boundaryBox,
    swatches.primary.color,
    brushStamps[state.tool.current.brushType][state.tool.current.brushSize][brushDirection],
    state.tool.current.brushSize,
    canvas.currentLayer,
    state.tool.current.modes,
    state.selection.maskSet,
    state.selection.seenPixelsSet,
    ditherPatterns[ditherBrush.ditherPatternIndex],
    ditherBrush.modes.twoColor,
    swatches.secondary.color,
    null,
    true,
    true
  )
}

/**
 * Check if cursor is far enough from previous point to draw a line
 * @returns {boolean}
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
    angle
  )

  let previousX = lineStartX
  let previousY = lineStartY
  let brushDirection = "0,0"
  for (let i = 0; i < tri.long; i++) {
    const thisx = Math.round(lineStartX + tri.x * i)
    const thisy = Math.round(lineStartY + tri.y * i)
    brushDirection = calculateBrushDirection(thisx, thisy, previousX, previousY)
    drawDitherBrushPoint(thisx, thisy, brushDirection)
    previousX = thisx
    previousY = thisy
  }
  state.tool.lineStartX = null
  state.tool.lineStartY = null
  brushDirection = calculateBrushDirection(
    state.cursor.x,
    state.cursor.y,
    previousX,
    previousY
  )
  drawDitherBrushPoint(state.cursor.x, state.cursor.y, brushDirection)
}

/**
 * Draw perfect pixels
 */
function handlePerfectPixels() {
  let brushDirection = "0,0"
  if (
    Math.abs(state.cursor.x - state.drawing.lastDrawnX) > 1 ||
    Math.abs(state.cursor.y - state.drawing.lastDrawnY) > 1
  ) {
    brushDirection = calculateBrushDirection(
      state.drawing.waitingPixelX,
      state.drawing.waitingPixelY,
      state.drawing.lastDrawnX,
      state.drawing.lastDrawnY
    )
    drawDitherBrushPoint(
      state.drawing.waitingPixelX,
      state.drawing.waitingPixelY,
      brushDirection
    )
    state.drawing.lastDrawnX = state.drawing.waitingPixelX
    state.drawing.lastDrawnY = state.drawing.waitingPixelY
    state.drawing.waitingPixelX = state.cursor.x
    state.drawing.waitingPixelY = state.cursor.y
    renderCanvas(canvas.currentLayer)
    drawPreviewDitherBrushPoint()
  } else {
    state.drawing.waitingPixelX = state.cursor.x
    state.drawing.waitingPixelY = state.cursor.y
    renderCanvas(canvas.currentLayer)
    drawPreviewDitherBrushPoint()
  }
}

//====================================//
//=== * * * Dither Brush Object * * * ===//
//====================================//

export const ditherBrush = {
  name: "ditherBrush",
  fn: ditherBrushSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: false,
  ditherPatternIndex: 32,
  options: { line: { active: false } },
  modes: {
    eraser: false,
    inject: false,
    perfect: false,
    colorMask: false,
    twoColor: false,
  },
  type: "raster",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
