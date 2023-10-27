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
        canvas.currentLayer.ctx,
        state.mode,
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
        renderCanvas(canvas.currentLayer, (ctx) => {
          actionLine(
            state.lineStartX,
            state.lineStartY,
            state.cursorX,
            state.cursorY,
            swatches.primary.color,
            canvas.currentLayer,
            ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize,
            state.maskSet,
            state.drawnPointsSet
          )
        })
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
            canvas.currentLayer.ctx,
            state.mode,
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
          canvas.currentLayer.ctx,
          state.mode,
          state.maskSet,
          state.drawnPointsSet,
          state.points,
          false
        )
        // if (state.mode === "perfect") {
        //   renderCanvas(null, (ctx) => {
        //     actionDraw(
        //       state.cursorX,
        //       state.cursorY,
        //       swatches.primary.color,
        //       state.brushStamp,
        //       "0,0",
        //       state.tool.brushSize,
        //       canvas.currentLayer,
        //       ctx,
        //       state.mode,
        //       state.drawnPointsSet,
        //       null,
        //       true
        //     )
        //   })
        // }
        renderCanvas(canvas.currentLayer)
      } else {
        //FIX: perfect will be option, not mode
        if (state.mode === "perfect") {
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
              canvas.currentLayer.ctx,
              state.mode,
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
            renderCanvas(canvas.currentLayer, (ctx) => {
              actionDraw(
                state.cursorX,
                state.cursorY,
                swatches.primary.color,
                state.brushStamp,
                "0,0",
                state.tool.brushSize,
                canvas.currentLayer,
                ctx,
                state.mode,
                state.maskSet,
                state.drawnPointsSet,
                null,
                true
              )
            })
          } else {
            state.waitingPixelX = state.cursorX
            state.waitingPixelY = state.cursorY
            renderCanvas(canvas.currentLayer, (ctx) => {
              actionDraw(
                state.cursorX,
                state.cursorY,
                swatches.primary.color,
                state.brushStamp,
                "0,0",
                state.tool.brushSize,
                canvas.currentLayer,
                ctx,
                state.mode,
                state.maskSet,
                state.drawnPointsSet,
                null,
                true
              )
            })
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
            canvas.currentLayer.ctx,
            state.mode,
            state.maskSet,
            state.drawnPointsSet,
            state.points,
            false
          )
          renderCanvas(canvas.currentLayer)
        }
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
            canvas.currentLayer.ctx,
            state.mode,
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
          canvas.currentLayer.ctx,
          state.mode,
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
        canvas.currentLayer.ctx,
        state.mode,
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
      break
    default:
    //do nothing
  }
}

/**
 * Supported modes: "draw, erase, perfect, inject"
 * //TODO: change replace function to be a mode instead of tool, called "colorMask"
 * Old method: creates a copy of the canvas with just the secondary color parts. This is used as a mask so the user can draw normally.
 * When the user finishes drawing, the changed pixels are saved as points and will be rerendered in the timeline as single pixel brush points
 * New method: Create a set of marked coordinates that can be checked before drawing
 * Old method is more efficient, but incompatible with subtractive modes (inject, erase). May want to revisit old method conditionally for additive modes.
 */
function replaceSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.maskSet = createColorMaskSet(
        swatches.secondary.color,
        canvas.currentLayer
      )
      brushSteps()
      break
    case "pointermove":
      brushSteps()
      break
    case "pointerup":
      brushSteps()
      state.maskSet = null
      break
    case "pointerout":
      //
      break
    default:
    //do nothing
  }
}

export const brush = {
  name: "brush",
  fn: brushSteps,
  action: actionDraw,
  brushSize: 1,
  disabled: false,
  options: { perfect: false, erase: false, inject: false, line: false },
  type: "raster",
}

export const replace = {
  name: "replace",
  fn: replaceSteps,
  action: actionDraw,
  brushSize: 1,
  disabled: false,
  options: { perfect: false, erase: false, inject: false }, //erase and inject not available right now. Inject will be default mode
  type: "raster",
}
