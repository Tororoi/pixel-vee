import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionDraw, actionLine } from "../Actions/actions.js"
import { getAngle, getTriangle } from "../utils/trig.js"
import { renderCanvas } from "../Canvas/render.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { createColorMaskSet } from "../Canvas/masks.js"
import { storedActions } from "../Testing/context.js"

//====================================//
//=== * * * Brush Controller * * * ===//
//====================================//

/**
 * Handle brush tool with global state
 */
function brushSteps() {
  let brushDirection = "0,0"
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //initialize sets
      if (state.tool.modes?.colorMask) {
        state.maskSet = createColorMaskSet(
          swatches.secondary.color,
          canvas.currentLayer
        )
      }
      state.pointsSet = new Set()
      state.seenPixelsSet = new Set()
      //initial point
      drawBrushPoint(state.cursorX, state.cursorY, brushDirection)
      //For line
      state.lineStartX = state.cursorX
      state.lineStartY = state.cursorY
      //for perfect pixels
      state.lastDrawnX = state.cursorX
      state.lastDrawnY = state.cursorY
      state.waitingPixelX = state.cursorX
      state.waitingPixelY = state.cursorY
      renderCanvas(canvas.currentLayer)
      break
    case "pointermove":
      //draw line connecting points that don't touch or if shift is held
      if (state.tool.options.line) {
        renderCanvas(canvas.currentLayer)
        //preview the line
        actionLine(
          state.lineStartX,
          state.lineStartY,
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          brushStamps[state.tool.brushType][state.tool.brushSize],
          state.tool.brushSize,
          state.maskSet,
          state.seenPixelsSet,
          true
        )
      } else if (shouldDrawLine()) {
        drawLine()
        renderCanvas(canvas.currentLayer)
      } else {
        if (state.tool.modes?.perfect) {
          handlePerfectPixels()
        } else {
          //draw normally
          brushDirection = calculateBrushDirection(
            state.cursorX,
            state.cursorY,
            state.previousX,
            state.previousY
          )
          drawBrushPoint(state.cursorX, state.cursorY, brushDirection)
          renderCanvas(canvas.currentLayer)
        }
      }
      break
    case "pointerup":
      if (shouldDrawLine()) {
        drawLine()
      }
      //only needed if perfect pixels option is on
      drawBrushPoint(state.cursorX, state.cursorY, brushDirection)
      //add action to timeline
      let maskArray = coordArrayFromSet(
        state.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y
      )
      state.addToTimeline({
        tool: brush,
        layer: canvas.currentLayer,
        properties: { points: state.points, maskSet: state.maskSet, maskArray },
      })
      renderCanvas(canvas.currentLayer)
      if (state.tool.modes?.colorMask) {
        state.maskSet = null
      }
      break
    default:
    //do nothing
  }
}

//====================================//
//======= * * * Helpers * * * ========//
//====================================//

/**
 * Add point to state.points if it is not already there
 * @param {Integer} x
 * @param {Integer} y
 */
function addPointToAction(x, y) {
  if (!state.pointsSet.has(`${x},${y}`)) {
    state.points.push({
      x: x - canvas.currentLayer.x,
      y: y - canvas.currentLayer.y,
      color: { ...swatches.primary.color },
      brushSize: state.tool.brushSize,
    })
    state.pointsSet.add(`${x},${y}`)
  }
}

/**
 *
 * @param {Integer} x
 * @param {Integer} y
 * @param {String} brushDirection
 */
function drawBrushPoint(x, y, brushDirection) {
  addPointToAction(x, y)
  actionDraw(
    x,
    y,
    swatches.primary.color,
    brushStamps[state.tool.brushType][state.tool.brushSize][brushDirection],
    state.tool.brushSize,
    canvas.currentLayer,
    state.tool.modes,
    state.maskSet,
    state.seenPixelsSet
  )
  if (state.points.length === 1000 && state.captureTesting) {
    console.log(state.points.length)
    saveAsTest()
  }
}

function drawPreviewBrushPoint() {
  let brushDirection = calculateBrushDirection(
    state.cursorX,
    state.cursorY,
    state.lastDrawnX,
    state.lastDrawnY
  )
  actionDraw(
    state.cursorX,
    state.cursorY,
    swatches.primary.color,
    brushStamps[state.tool.brushType][state.tool.brushSize][brushDirection],
    state.tool.brushSize,
    canvas.currentLayer,
    state.tool.modes,
    state.maskSet,
    state.seenPixelsSet,
    true,
    true
  )
}

/**
 * Check if cursor is far enough from previous point to draw a line
 * @returns {Boolean}
 */
function shouldDrawLine() {
  return (
    Math.abs(state.cursorX - state.previousX) > 1 ||
    Math.abs(state.cursorY - state.previousY) > 1 ||
    (state.lineStartX !== null && state.lineStartY !== null)
  )
}

/**
 * Draw line between two points
 */
function drawLine() {
  let lineStartX =
    state.lineStartX !== null ? state.lineStartX : state.previousX
  let lineStartY =
    state.lineStartY !== null ? state.lineStartY : state.previousY
  let angle = getAngle(state.cursorX - lineStartX, state.cursorY - lineStartY) // angle of line
  let tri = getTriangle(
    lineStartX,
    lineStartY,
    state.cursorX,
    state.cursorY,
    angle
  )

  let previousX = lineStartX
  let previousY = lineStartY
  let brushDirection = "0,0"
  for (let i = 0; i < tri.long; i++) {
    let thispoint = {
      x: Math.round(lineStartX + tri.x * i),
      y: Math.round(lineStartY + tri.y * i),
    }
    // for each point along the line
    brushDirection = calculateBrushDirection(
      thispoint.x,
      thispoint.y,
      previousX,
      previousY
    )
    drawBrushPoint(thispoint.x, thispoint.y, brushDirection)
    previousX = thispoint.x
    previousY = thispoint.y
  }
  //Reset lineStart Coords
  state.lineStartX = null
  state.lineStartY = null
  //fill endpoint
  brushDirection = calculateBrushDirection(
    state.cursorX,
    state.cursorY,
    previousX,
    previousY
  )
  drawBrushPoint(state.cursorX, state.cursorY, brushDirection)
}

/**
 * Draw perfect pixels
 */
function handlePerfectPixels() {
  let brushDirection = "0,0"
  //if current pixel not a neighbor to lastDrawn and has not already been drawn, draw waiting pixel
  if (
    Math.abs(state.cursorX - state.lastDrawnX) > 1 ||
    Math.abs(state.cursorY - state.lastDrawnY) > 1
  ) {
    //Draw the previous waiting pixel
    brushDirection = calculateBrushDirection(
      state.waitingPixelX,
      state.waitingPixelY,
      state.lastDrawnX,
      state.lastDrawnY
    )
    drawBrushPoint(state.waitingPixelX, state.waitingPixelY, brushDirection)
    //update queue
    state.lastDrawnX = state.waitingPixelX
    state.lastDrawnY = state.waitingPixelY
    state.waitingPixelX = state.cursorX
    state.waitingPixelY = state.cursorY
    renderCanvas(canvas.currentLayer)
    //preview the next pixel
    drawPreviewBrushPoint()
  } else {
    state.waitingPixelX = state.cursorX
    state.waitingPixelY = state.cursorY
    renderCanvas(canvas.currentLayer)
    //preview the next pixel
    drawPreviewBrushPoint()
  }
}

//====================================//
//===== * * * Brush Object * * * =====//
//====================================//

export const brush = {
  name: "brush",
  fn: brushSteps,
  action: actionDraw,
  brushSize: 1,
  brushType: "circle",
  disabled: false,
  options: { line: false },
  modes: { eraser: false, inject: false, perfect: false, colorMask: false },
  type: "raster",
  cursor: "crosshair",
  activeCursor: "crosshair",
}

//====================================//
//======= * * * Testing * * * ========//
//====================================//

/**
 * Save current action as a test that can be repeated exactly
 */
function saveAsTest() {
  let maskArray = coordArrayFromSet(
    state.maskSet,
    canvas.currentLayer.x,
    canvas.currentLayer.y
  )
  let testAction = {
    tool: { ...brush },
    modes: { ...brush.modes },
    color: { ...swatches.primary.color },
    layer: canvas.currentLayer,
    properties: {
      points: [...state.points],
      maskSet: state.maskSet,
      maskArray,
    },
  }
  storedActions.brush = testAction
  // // Save data
  // let jsonString = JSON.stringify(testAction, null, 2)
  // //TODO: instead of opening in a new window, save to special testing object
  // // Create a new Blob with the JSON data and the correct MIME type
  // const blob = new Blob([jsonString], { type: "application/json" })

  // // Create a URL for the Blob
  // const blobUrl = URL.createObjectURL(blob)

  // // Open the URL in a new tab/window
  // window.open(blobUrl)
}
