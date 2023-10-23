import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionDraw, actionLine } from "../Actions/actions.js"
import { getAngle, getTriangle } from "../utils/trig.js"
import { renderCanvas } from "../Canvas/render.js"
import { getColor } from "../utils/canvasHelpers.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"

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
      if (state.maskSet) {
        //if some set of pixels is masked off, initialize drawnpoints including the masked pixels
        state.drawnPointsSet = new Set(state.maskSet)
      } else {
        state.drawnPointsSet = new Set()
      }
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
        canvas.currentLayer.ctx,
        state.mode,
        state.drawnPointsSet,
        state.points
      )
      //for perfect pixels
      state.lastDrawnX = state.cursorX
      state.lastDrawnY = state.cursorY
      state.waitingPixelX = state.cursorX
      state.waitingPixelY = state.cursorY
      renderCanvas()
      break
    case "pointermove":
      //draw line connecting points that don't touch or if shift is held
      if (state.tool.options.line) {
        renderCanvas((ctx) => {
          actionLine(
            state.lineStartX,
            state.lineStartY,
            state.cursorX,
            state.cursorY,
            swatches.primary.color,
            ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize,
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
            canvas.currentLayer.ctx,
            state.mode,
            state.drawnPointsSet,
            state.points
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
          canvas.currentLayer.ctx,
          state.mode,
          state.drawnPointsSet,
          state.points
        )
        // if (state.mode === "perfect") {
        //   renderCanvas((ctx) => {
        //     actionDraw(
        //       state.cursorX,
        //       state.cursorY,
        //       swatches.primary.color,
        //       state.brushStamp,
        //       "0,0",
        //       state.tool.brushSize,
        //       ctx,
        //       state.mode,
        //       state.drawnPointsSet,
        //       null,
        //       true
        //     )
        //   })
        // }
        renderCanvas()
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
              canvas.currentLayer.ctx,
              state.mode,
              state.drawnPointsSet,
              state.points
            )
            //update queue
            state.lastDrawnX = state.waitingPixelX
            state.lastDrawnY = state.waitingPixelY
            state.waitingPixelX = state.cursorX
            state.waitingPixelY = state.cursorY
            renderCanvas((ctx) => {
              actionDraw(
                state.cursorX,
                state.cursorY,
                swatches.primary.color,
                state.brushStamp,
                "0,0",
                state.tool.brushSize,
                ctx,
                state.mode,
                state.drawnPointsSet,
                null,
                true
              )
            })
          } else {
            state.waitingPixelX = state.cursorX
            state.waitingPixelY = state.cursorY
            renderCanvas((ctx) => {
              actionDraw(
                state.cursorX,
                state.cursorY,
                swatches.primary.color,
                state.brushStamp,
                "0,0",
                state.tool.brushSize,
                ctx,
                state.mode,
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
            canvas.currentLayer.ctx,
            state.mode,
            state.drawnPointsSet,
            state.points
          )
          renderCanvas()
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
            canvas.currentLayer.ctx,
            state.mode,
            state.drawnPointsSet,
            state.points
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
          canvas.currentLayer.ctx,
          state.mode,
          state.drawnPointsSet,
          state.points
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
        canvas.currentLayer.ctx,
        state.mode,
        state.drawnPointsSet,
        state.points
      )

      state.addToTimeline({
        tool: brush,
        layer: canvas.currentLayer,
        properties: { points: state.points, maskSet: state.maskSet },
      })
      renderCanvas()
      break
    default:
    //do nothing
  }
}

/**
 * Supported modes: "draw, erase, perfect, inject"
 * //TODO: change replace function to be a mode instead of tool, called "colorMask"
 * creates a copy of the canvas with just the secondary color parts. This is used as a mask so the user can draw normally.
 * When the user finishes drawing, the changed pixels are saved as points and will be rerendered in the timeline as single pixel brush points
 */
function replaceSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      // state.pointsSet = new Set()
      state.maskSet = new Set()
      //create mask set
      state.colorLayerGlobal = canvas.currentLayer.ctx.getImageData(
        0,
        0,
        canvas.currentLayer.cvs.width,
        canvas.currentLayer.cvs.height
      )
      let matchColor = swatches.secondary.color
      if (matchColor.a < 255) {
        //draw then sample color to math premultiplied alpha version of color
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = 1
        tempCanvas.height = 1
        const tempCtx = tempCanvas.getContext("2d")

        tempCtx.fillStyle = `rgba(${matchColor.r}, ${matchColor.g}, ${
          matchColor.b
        }, ${matchColor.a / 255})`
        tempCtx.fillRect(0, 0, 1, 1)

        const sampledColor = tempCtx.getImageData(0, 0, 1, 1).data
        matchColor = {
          color: `rgba(${sampledColor[0]}, ${sampledColor[1]}, ${
            sampledColor[2]
          }, ${sampledColor[3] / 255})`,
          r: sampledColor[0],
          g: sampledColor[1],
          b: sampledColor[2],
          a: sampledColor[3],
        }
      }
      for (let x = 0; x < canvas.currentLayer.cvs.width; x++) {
        for (let y = 0; y < canvas.currentLayer.cvs.height; y++) {
          let color = getColor(x, y, state.colorLayerGlobal)
          if (
            color.r !== matchColor.r ||
            color.g !== matchColor.g ||
            color.b !== matchColor.b ||
            color.a !== matchColor.a
          ) {
            const key = `${x},${y}`
            state.maskSet.add(key)
          }
        }
      }
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
