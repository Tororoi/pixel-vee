import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionDraw, actionLine } from "../Actions/actions.js"
import { getAngle, getTriangle } from "../utils/trig.js"
import { renderCanvas } from "../Canvas/render.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { createColorMaskSet } from "../Canvas/masks.js"

//====================================//
//=== * * * Brush Controller * * * ===//
//====================================//

/**
 * Supported modes: "draw, erase, perfect, inject",
 */
function brushSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (state.tool.modes?.colorMask) {
        state.maskSet = createColorMaskSet(
          swatches.secondary.color,
          canvas.currentLayer
        )
      }
      state.pointsSet = new Set()
      // if (state.maskSet) {
      //if some set of pixels is masked off, initialize drawnpoints including the masked pixels
      // state.drawnPointsSet = new Set(state.maskSet)
      // } else {
      state.drawnPointsSet = new Set()
      // }
      //For line
      state.lineStartX = state.cursorX
      state.lineStartY = state.cursorY
      //set colorlayer, then for each brushpoint, alter colorlayer and add each to timeline
      actionDraw(
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        state.brushStamp,
        "0,0",
        state.tool.brushSize,
        canvas.currentLayer,
        state.tool.modes,
        state.maskSet,
        state.drawnPointsSet,
        state.points,
        false
      )
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
          state.brushStamp,
          state.tool.brushSize,
          state.maskSet,
          state.drawnPointsSet,
          true
        )
      } else if (
        Math.abs(state.cursorX - state.previousX) > 1 ||
        Math.abs(state.cursorY - state.previousY) > 1 ||
        (state.lineStartX !== null && state.lineStartY !== null)
      ) {
        let lineStartX =
          state.lineStartX !== null ? state.lineStartX : state.previousX
        let lineStartY =
          state.lineStartY !== null ? state.lineStartY : state.previousY
        let angle = getAngle(
          state.cursorX - lineStartX,
          state.cursorY - lineStartY
        ) // angle of line
        let tri = getTriangle(
          lineStartX,
          lineStartY,
          state.cursorX,
          state.cursorY,
          angle
        )

        let previousX = lineStartX
        let previousY = lineStartY
        for (let i = 0; i < tri.long; i++) {
          let thispoint = {
            x: Math.round(lineStartX + tri.x * i),
            y: Math.round(lineStartY + tri.y * i),
          }
          state.brushDirection = calculateBrushDirection(
            thispoint.x,
            thispoint.y,
            previousX,
            previousY
          )
          // for each point along the line
          actionDraw(
            thispoint.x,
            thispoint.y,
            swatches.primary.color,
            state.brushStamp,
            state.brushDirection,
            state.tool.brushSize,
            canvas.currentLayer,
            state.tool.modes,
            state.maskSet,
            state.drawnPointsSet,
            state.points,
            false
          )
          previousX = thispoint.x
          previousY = thispoint.y
        }
        //Reset lineStart Coords
        state.lineStartX = null
        state.lineStartY = null
        state.brushDirection = calculateBrushDirection(
          state.cursorX,
          state.cursorY,
          previousX,
          previousY
        )
        //fill endpoint
        actionDraw(
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          state.brushStamp,
          state.brushDirection,
          state.tool.brushSize,
          canvas.currentLayer,
          state.tool.modes,
          state.maskSet,
          state.drawnPointsSet,
          state.points,
          false
        )
        renderCanvas(canvas.currentLayer)
      } else {
        //FIX: perfect will be option, not mode
        if (state.tool.modes?.perfect) {
          //if currentPixel not neighbor to lastDrawn and has not already been drawn, draw waitingpixel
          if (
            Math.abs(state.cursorX - state.lastDrawnX) > 1 ||
            Math.abs(state.cursorY - state.lastDrawnY) > 1
          ) {
            //Draw the previous waiting pixel
            actionDraw(
              state.waitingPixelX,
              state.waitingPixelY,
              swatches.primary.color,
              state.brushStamp,
              "0,0",
              state.tool.brushSize,
              canvas.currentLayer,
              state.tool.modes,
              state.maskSet,
              state.drawnPointsSet,
              state.points,
              false
            )
            //update queue
            state.lastDrawnX = state.waitingPixelX
            state.lastDrawnY = state.waitingPixelY
            state.waitingPixelX = state.cursorX
            state.waitingPixelY = state.cursorY
            renderCanvas(canvas.currentLayer)
            //preview the next pixel
            actionDraw(
              state.cursorX,
              state.cursorY,
              swatches.primary.color,
              state.brushStamp,
              "0,0",
              state.tool.brushSize,
              canvas.currentLayer,
              state.tool.modes,
              state.maskSet,
              state.drawnPointsSet,
              null,
              true,
              true
            )
          } else {
            state.waitingPixelX = state.cursorX
            state.waitingPixelY = state.cursorY
            renderCanvas(canvas.currentLayer)
            //preview the next pixel
            actionDraw(
              state.cursorX,
              state.cursorY,
              swatches.primary.color,
              state.brushStamp,
              "0,0",
              state.tool.brushSize,
              canvas.currentLayer,
              state.tool.modes,
              state.maskSet,
              state.drawnPointsSet,
              null,
              true,
              true
            )
          }
        } else {
          actionDraw(
            state.cursorX,
            state.cursorY,
            swatches.primary.color,
            state.brushStamp,
            "0,0",
            state.tool.brushSize,
            canvas.currentLayer,
            state.tool.modes,
            state.maskSet,
            state.drawnPointsSet,
            state.points,
            false
          )
          renderCanvas(canvas.currentLayer)
        }
      }
      if (state.points.length === 1000 && state.captureTesting) {
        saveAsTest()
      }
      break
    case "pointerup":
      if (
        Math.abs(state.cursorX - state.previousX) > 1 ||
        Math.abs(state.cursorY - state.previousY) > 1 ||
        (state.lineStartX !== null && state.lineStartY !== null)
      ) {
        let lineStartX =
          state.lineStartX !== null ? state.lineStartX : state.previousX
        let lineStartY =
          state.lineStartY !== null ? state.lineStartY : state.previousY
        let angle = getAngle(
          state.cursorX - lineStartX,
          state.cursorY - lineStartY
        ) // angle of line
        let tri = getTriangle(
          lineStartX,
          lineStartY,
          state.cursorX,
          state.cursorY,
          angle
        )

        let previousX = lineStartX
        let previousY = lineStartY
        for (let i = 0; i < tri.long; i++) {
          let thispoint = {
            x: Math.round(lineStartX + tri.x * i),
            y: Math.round(lineStartY + tri.y * i),
          }
          state.brushDirection = calculateBrushDirection(
            thispoint.x,
            thispoint.y,
            previousX,
            previousY
          )
          // for each point along the line
          actionDraw(
            thispoint.x,
            thispoint.y,
            swatches.primary.color,
            state.brushStamp,
            state.brushDirection,
            state.tool.brushSize,
            canvas.currentLayer,
            state.tool.modes,
            state.maskSet,
            state.drawnPointsSet,
            state.points,
            false
          )
          previousX = thispoint.x
          previousY = thispoint.y
        }
        //Reset lineStart Coords
        state.lineStartX = null
        state.lineStartY = null
        //fill endpoint
        state.brushDirection = calculateBrushDirection(
          state.cursorX,
          state.cursorY,
          previousX,
          previousY
        )
        actionDraw(
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          state.brushStamp,
          state.brushDirection,
          state.tool.brushSize,
          canvas.currentLayer,
          state.tool.modes,
          state.maskSet,
          state.drawnPointsSet,
          state.points,
          false
        )
      }
      //only needed if perfect pixels option is on
      actionDraw(
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        state.brushStamp,
        "0,0",
        state.tool.brushSize,
        canvas.currentLayer,
        state.tool.modes,
        state.maskSet,
        state.drawnPointsSet,
        state.points,
        false
      )

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

function saveAsTest() {
  let maskArray = coordArrayFromSet(
    state.maskSet,
    canvas.currentLayer.x,
    canvas.currentLayer.y
  )
  // Save data
  let jsonString = JSON.stringify(
    {
      tool: brush,
      layer: canvas.currentLayer,
      properties: {
        points: state.points,
        maskSet: state.maskSet,
        maskArray,
      },
    },
    null,
    2
  )
  //TODO: instead of opening in a new window, save to special testing object
  // Create a new Blob with the JSON data and the correct MIME type
  const blob = new Blob([jsonString], { type: "application/json" })

  // Create a URL for the Blob
  const blobUrl = URL.createObjectURL(blob)

  // Open the URL in a new tab/window
  window.open(blobUrl)
}

export const brush = {
  name: "brush",
  fn: brushSteps,
  action: actionDraw,
  brushSize: 1,
  brushStamp: "circle",
  disabled: false,
  options: { line: false },
  modes: { eraser: false, inject: false, perfect: false, colorMask: false },
  type: "raster",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
