import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import {
  modifyAction,
  actionDraw,
  actionLine,
  actionFill,
  actionQuadraticCurve,
  actionCubicCurve,
  actionEllipse,
} from "./actions.js"
import { getAngle, getTriangle } from "../utils/trig.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCursor, renderRasterGUI } from "../GUI/raster.js"
import {
  updateEllipseVertex,
  findHalf,
  updateEllipseOffsets,
  updateEllipseControlPoints,
} from "../utils/ellipse.js"
import { renderCanvas } from "../Canvas/render.js"
import { consolidateLayers, createNewRasterLayer } from "../Canvas/layers.js"
import { getColor } from "../utils/canvasHelpers.js"
import { setColor } from "../Swatch/events.js"
import { checkPixelAlreadyDrawn } from "../utils/drawHelpers.js"

//====================================//
//=== * * * Tool Controllers * * * ===//
//====================================//

//"Steps" functions are controllers for the process
/**
 * Supported modes: "draw, erase, perfect, inject",
 */
export function drawSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (state.tool.name !== "replace") {
        state.pointsSet = new Set()
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

        for (let i = 0; i < tri.long; i++) {
          let thispoint = {
            x: Math.round(lineStartX + tri.x * i),
            y: Math.round(lineStartY + tri.y * i),
          }
          // for each point along the line
          actionDraw(
            thispoint.x,
            thispoint.y,
            swatches.primary.color,
            state.brushStamp,
            state.tool.brushSize,
            canvas.currentLayer.ctx,
            state.mode,
            state.drawnPointsSet,
            state.points
          )
        }
        //Reset lineStart Coords
        state.lineStartX = null
        state.lineStartY = null
        //fill endpoint
        actionDraw(
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          state.brushStamp,
          state.tool.brushSize,
          canvas.currentLayer.ctx,
          state.mode,
          state.drawnPointsSet,
          state.points
        )
        if (state.mode === "perfect") {
          renderCanvas((ctx) => {
            actionDraw(
              state.cursorX,
              state.cursorY,
              swatches.primary.color,
              state.brushStamp,
              state.tool.brushSize,
              ctx,
              state.mode,
              state.drawnPointsSet,
              null,
              true
            )
          })
        }
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

        for (let i = 0; i < tri.long; i++) {
          let thispoint = {
            x: Math.round(lineStartX + tri.x * i),
            y: Math.round(lineStartY + tri.y * i),
          }
          // for each point along the line
          actionDraw(
            thispoint.x,
            thispoint.y,
            swatches.primary.color,
            state.brushStamp,
            state.tool.brushSize,
            canvas.currentLayer.ctx,
            state.mode,
            state.drawnPointsSet,
            state.points
          )
        }
        //Reset lineStart Coords
        state.lineStartX = null
        state.lineStartY = null
        //fill endpoint
        actionDraw(
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          state.brushStamp,
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
        state.tool.brushSize,
        canvas.currentLayer.ctx,
        state.mode,
        state.drawnPointsSet,
        state.points
      )

      if (state.tool.name !== "replace") {
        state.addToTimeline({
          tool: state.tool,
          layer: canvas.currentLayer,
          properties: { points: state.points },
        })
      }
      renderCanvas()
      break
    default:
    //do nothing
  }
}

/**
 * Supported modes: "draw, erase, perfect, inject"
 * creates a copy of the canvas with just the secondary color parts. This is used as a mask so the user can draw normally.
 * When the user finishes drawing, the changed pixels are saved as points and will be rerendered in the timeline as single pixel brush points
 */
export function replaceSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.pointsSet = new Set()
      state.drawnPointsSet = new Set()
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
            state.drawnPointsSet.add(key)
          }
        }
      }
      state.maskSet = new Set(state.drawnPointsSet)
      drawSteps()
      break
    case "pointermove":
      drawSteps()
      break
    case "pointerup":
      drawSteps()
      state.addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: { points: state.points, maskSet: state.maskSet },
      })
      state.maskSet = null
      break
    case "pointerout":
      //
      break
    default:
    //do nothing
  }
}

/**
 * TODO: Work in progress
 * GOAL: create a dynamic selectable area, allowing the user to restrict the areas of the canvas that accept changes
 * Should use a mask set that keeps track of selected or unselected pixels
 * use vectorGui.drawSelectOutline for visual rendering of masked pixels
 * Select tools: rectangle, free form, magic wand (auto select color)
 * Hold shift to add to selection with magic wand
 * Hold option to minus from selection with magic wand/ free form
 * Command + I to invert selection
 */
export function selectSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //1. set drag origin
      //2. save context
      state.selectPixelPoints = []
      for (const pixel of state.brushStamp) {
        state.selectPixelPoints[`${pixel.x},${pixel.y}`] = {
          x: pixel.x,
          y: pixel.y,
        }
      }
      state.selectCornersSet = new Set()
      for (const pixel of state.brushStamp) {
        state.selectCornersSet.add(`${pixel.x},${pixel.y}`)
        state.selectCornersSet.add(`${pixel.x + 1},${pixel.y}`)
        state.selectCornersSet.add(`${pixel.x},${pixel.y + 1}`)
        state.selectCornersSet.add(`${pixel.x + 1},${pixel.y + 1}`)
      }
      break
    case "pointermove":
      //1. if state.clicked create strokeable path using drag origin and current x/y as opposite corners of rectangle
      //2. stroke outline path with animated "marching ants".
      break
    case "pointerup":
      //1. create clip mask using drag origin and current x/y as opposite corners of rectangle
      break
    case "pointerout":
      //1. create clip mask using drag origin and last x/y as opposite corners of rectangle
      break
    default:
    //do nothing
  }
}

/**
 * Supported modes: "draw, erase, inject",
 */
export function lineSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.lineStartX = state.cursorX
      state.lineStartY = state.cursorY
      renderCanvas((ctx) => {
        actionLine(
          state.cursorX,
          state.cursorY,
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          ctx,
          state.mode,
          state.brushStamp,
          state.tool.brushSize
        )
      })
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //only draw when necessary
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
          state.tool.brushSize
        )
      })
      break
    case "pointerup":
      actionLine(
        state.lineStartX,
        state.lineStartY,
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        canvas.currentLayer.ctx,
        state.mode,
        state.brushStamp,
        state.tool.brushSize
      )
      state.addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: {
          px1: state.lineStartX,
          py1: state.lineStartY,
          px2: state.cursorX,
          py2: state.cursorY,
        },
      })
      renderCanvas()
      break
    default:
    //do nothing
  }
}

/**
 * Fill an area with the specified color
 * Supported modes: "draw, erase"
 */
export function fillSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      vectorGui.render(state, canvas)
      if (vectorGui.collisionPresent) {
        adjustFillSteps()
      } else {
        // //reset control points
        // vectorGui.reset(canvas) - not really needed currently since fill only uses P1
        state.vectorProperties.px1 = state.cursorX
        state.vectorProperties.py1 = state.cursorY
        actionFill(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          swatches.primary.color,
          canvas.currentLayer,
          state.mode
        )
        //For undo ability, store starting coords and settings and pass them into actionFill
        state.addToTimeline({
          tool: state.tool,
          layer: canvas.currentLayer,
          properties: {
            px1: state.vectorProperties.px1,
            py1: state.vectorProperties.py1,
          },
        })
        renderCanvas()
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        adjustFillSteps()
      }
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        adjustFillSteps()
      }
      //redraw canvas to allow onscreen cursor to render
      renderCanvas()
    default:
    //do nothing
  }
}

/**
 * Used automatically by curve tools after curve is completed.
 * TODO: create distinct mode for adjusting
 * Ideally a user should be able to click on a curve and render it's vector UI that way.
 * TODO: Modify point in vector timeline and push new curve set on pointer up to timeline as new type of push called "modify vector"
 * Currently this modifies the history directly which is a big no no, just done for testing, only ok for now since it just modifies the curve that was just created
 */
export function adjustFillSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent) {
        state.vectorProperties[vectorGui.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedKeys.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        state.undoStack[canvas.currentVectorIndex].hidden = true
        //Only render canvas up to timeline where fill action exists while adjusting fill
        renderCanvas(null, true, true, canvas.currentVectorIndex) // render to canvas.currentVectorIndex
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        //code gets past check twice here so figure out where tool fn is being called again
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        state.undoStack[canvas.currentVectorIndex].hidden = false
        modifyAction(canvas.currentVectorIndex)
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
        renderCanvas(null, true, true)
      }
      break
    case "pointerout":
      if (vectorGui.selectedPoint.xKey) {
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
      }
      break
    default:
    //do nothing
  }
}

/**
 * Draw bezier curves
 * Supported modes: "draw, erase",
 */
export function quadCurveSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent && state.clickCounter === 0) {
        adjustCurveSteps(3)
      } else {
        //solidify end points
        state.clickCounter += 1
        if (state.clickCounter > 3) state.clickCounter = 1
        switch (state.clickCounter) {
          case 1:
            //reset control points
            vectorGui.reset(canvas)
            state.vectorProperties.px1 = state.cursorX
            state.vectorProperties.py1 = state.cursorY
            break
          case 2:
            if (!state.touch) {
              state.vectorProperties.px2 = state.cursorX
              state.vectorProperties.py2 = state.cursorY
            }
            break
          default:
          //do nothing
        }
        if (state.clickCounter === 3) {
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
        }
        //onscreen preview
        renderCanvas((ctx) => {
          actionQuadraticCurve(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            state.clickCounter,
            swatches.primary.color,
            ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
        })
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        adjustCurveSteps(3)
      } else {
        //draw line from origin point to current point onscreen
        //normalize pointermove to pixelgrid
        if (state.clickCounter === 3) {
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
        }
        //onscreen preview
        renderCanvas((ctx) => {
          actionQuadraticCurve(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            state.clickCounter,
            swatches.primary.color,
            ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
        })
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        adjustCurveSteps(3)
      } else {
        //For touchscreens
        if (state.touch) {
          if (state.clickCounter === 1) {
            state.vectorProperties.px2 = state.cursorX
            state.vectorProperties.py2 = state.cursorY
          }
          if (state.clickCounter === 2) {
            state.clickCounter += 1
          }
        }
        //Solidify curve
        if (state.clickCounter === 3) {
          //solidify control point
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          actionQuadraticCurve(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            state.clickCounter,
            swatches.primary.color,
            canvas.currentLayer.ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
          state.clickCounter = 0
          //store control points for timeline
          state.addToTimeline({
            tool: state.tool,
            layer: canvas.currentLayer,
            properties: {
              px1: state.vectorProperties.px1,
              py1: state.vectorProperties.py1,
              px2: state.vectorProperties.px2,
              py2: state.vectorProperties.py2,
              px3: state.vectorProperties.px3,
              py3: state.vectorProperties.py3,
            },
          })
          renderCanvas()
        }
      }
      break
    case "pointerout":
      if (vectorGui.selectedPoint.xKey) {
        adjustCurveSteps(3)
      }
      //cancel curve
      state.clickCounter = 0
      break
    default:
    //do nothing
  }
}

/**
 * Draw cubic bezier curves
 * Supported modes: "draw, erase",
 */
export function cubicCurveSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent && state.clickCounter === 0) {
        adjustCurveSteps()
      } else {
        //solidify end points
        state.clickCounter += 1
        if (state.clickCounter > 4) state.clickCounter = 1
        switch (state.clickCounter) {
          case 1:
            //reset control points
            vectorGui.reset(canvas)
            state.vectorProperties.px1 = state.cursorX
            state.vectorProperties.py1 = state.cursorY
            break
          case 2:
            if (!state.touch) {
              state.vectorProperties.px2 = state.cursorX
              state.vectorProperties.py2 = state.cursorY
            }
            break
          case 3:
            if (!state.touch) {
              state.vectorProperties.px3 = state.cursorX
              state.vectorProperties.py3 = state.cursorY
            }
            break
          default:
          //do nothing
        }
        if (state.clickCounter === 4) {
          state.vectorProperties.px4 = state.cursorX
          state.vectorProperties.py4 = state.cursorY
        }
        //onscreen preview
        renderCanvas((ctx) => {
          actionCubicCurve(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            state.vectorProperties.px4,
            state.vectorProperties.py4,
            state.clickCounter,
            swatches.primary.color,
            ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
        })
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        adjustCurveSteps()
      } else {
        //draw line from origin point to current point onscreen
        //normalize pointermove to pixelgrid
        if (state.clickCounter === 4) {
          state.vectorProperties.px4 = state.cursorX
          state.vectorProperties.py4 = state.cursorY
        }
        //onscreen preview
        renderCanvas((ctx) => {
          actionCubicCurve(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            state.vectorProperties.px4,
            state.vectorProperties.py4,
            state.clickCounter,
            swatches.primary.color,
            ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
        })
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        adjustCurveSteps()
      } else {
        //For touchscreens
        if (state.touch) {
          if (state.clickCounter === 1) {
            state.vectorProperties.px2 = state.cursorX
            state.vectorProperties.py2 = state.cursorY
          }
          if (state.clickCounter === 2) {
            state.vectorProperties.px3 = state.cursorX
            state.vectorProperties.py3 = state.cursorY
          }
          if (state.clickCounter === 3) {
            state.clickCounter += 1
          }
        }
        //Solidify curve
        if (state.clickCounter === 4) {
          //solidify control point
          state.vectorProperties.px4 = state.cursorX
          state.vectorProperties.py4 = state.cursorY
          actionCubicCurve(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            state.vectorProperties.px4,
            state.vectorProperties.py4,
            state.clickCounter,
            swatches.primary.color,
            canvas.currentLayer.ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
          state.clickCounter = 0
          //store control points for timeline
          state.addToTimeline({
            tool: state.tool,
            layer: canvas.currentLayer,
            properties: {
              px1: state.vectorProperties.px1,
              py1: state.vectorProperties.py1,
              px2: state.vectorProperties.px2,
              py2: state.vectorProperties.py2,
              px3: state.vectorProperties.px3,
              py3: state.vectorProperties.py3,
              px4: state.vectorProperties.px4,
              py4: state.vectorProperties.py4,
            },
          })
          renderCanvas()
          renderRasterGUI(state, canvas, swatches)
          vectorGui.render(state, canvas)
        }
      }
      break
    case "pointerout":
      if (vectorGui.selectedPoint.xKey) {
        adjustCurveSteps()
      }
      //cancel curve
      state.clickCounter = 0
      break
    default:
    //do nothing
  }
}

/**
 * Used automatically by curve tools after curve is completed.
 * TODO: create distinct tool for adjusting that won't create a new curve when clicking.
 * Ideally a user should be able to click on a curve and render it's vector UI that way.
 * TODO: Modify point in vector timeline and push new curve set on pointer up to timeline as new type of push called "modify vector"
 * Currently this modifies the history directly which is a big no no, just done for testing, only ok for now since it just modifies the curve that was just created
 * @param {*} numPoints
 */
export function adjustCurveSteps(numPoints = 4) {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedKeys.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        state.undoStack[canvas.currentVectorIndex].hidden = true
        if (numPoints === 3) {
          renderCanvas(
            (ctx) => {
              actionQuadraticCurve(
                state.vectorProperties.px1,
                state.vectorProperties.py1,
                state.vectorProperties.px2,
                state.vectorProperties.py2,
                state.vectorProperties.px3,
                state.vectorProperties.py3,
                3,
                state.undoStack[canvas.currentVectorIndex].color,
                ctx,
                state.undoStack[canvas.currentVectorIndex].mode,
                state.undoStack[canvas.currentVectorIndex].brushStamp,
                state.undoStack[canvas.currentVectorIndex].brushSize
              )
            },
            true,
            true
          )
        } else {
          renderCanvas(
            (ctx) => {
              actionCubicCurve(
                state.vectorProperties.px1,
                state.vectorProperties.py1,
                state.vectorProperties.px2,
                state.vectorProperties.py2,
                state.vectorProperties.px3,
                state.vectorProperties.py3,
                state.vectorProperties.px4,
                state.vectorProperties.py4,
                4,
                state.undoStack[canvas.currentVectorIndex].color,
                ctx,
                state.undoStack[canvas.currentVectorIndex].mode,
                state.undoStack[canvas.currentVectorIndex].brushStamp,
                state.undoStack[canvas.currentVectorIndex].brushSize
              )
            },
            true,
            true
          )
        }
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        if (numPoints === 3) {
          renderCanvas((ctx) => {
            actionQuadraticCurve(
              state.vectorProperties.px1,
              state.vectorProperties.py1,
              state.vectorProperties.px2,
              state.vectorProperties.py2,
              state.vectorProperties.px3,
              state.vectorProperties.py3,
              3,
              state.undoStack[canvas.currentVectorIndex].color,
              ctx,
              state.undoStack[canvas.currentVectorIndex].mode,
              state.undoStack[canvas.currentVectorIndex].brushStamp,
              state.undoStack[canvas.currentVectorIndex].brushSize
            )
          })
        } else {
          renderCanvas((ctx) => {
            actionCubicCurve(
              state.vectorProperties.px1,
              state.vectorProperties.py1,
              state.vectorProperties.px2,
              state.vectorProperties.py2,
              state.vectorProperties.px3,
              state.vectorProperties.py3,
              state.vectorProperties.px4,
              state.vectorProperties.py4,
              4,
              state.undoStack[canvas.currentVectorIndex].color,
              ctx,
              state.undoStack[canvas.currentVectorIndex].mode,
              state.undoStack[canvas.currentVectorIndex].brushStamp,
              state.undoStack[canvas.currentVectorIndex].brushSize
            )
          })
        }
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        state.undoStack[canvas.currentVectorIndex].hidden = false
        modifyAction(canvas.currentVectorIndex)
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
        renderCanvas(null, true, true)
      }
      break
    case "pointerout":
      if (vectorGui.selectedPoint.xKey) {
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
      }
      break
    default:
    //do nothing
  }
}

/**
 * Draw ellipse
 * Supported modes: "draw, erase",
 * Due to method of modifying radius on a pixel grid, only odd diameter circles are created. Eg. 15px radius creates a 31px diameter circle. To fix this, allow half pixel increments.
 */
export function ellipseSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent && state.clickCounter === 0) {
        adjustEllipseSteps()
      } else {
        //solidify end points
        state.clickCounter += 1
        if (state.clickCounter > 2) state.clickCounter = 1
        switch (state.clickCounter) {
          case 1:
            //reset control points
            vectorGui.reset(canvas)
            state.vectorProperties.px1 = state.cursorX
            state.vectorProperties.py1 = state.cursorY
            state.vectorProperties.forceCircle = true //force circle initially
            break
          default:
          //do nothing
        }
        if (state.clickCounter === 1) {
          //initialize circle with radius 15 by default?
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          let dxa = state.vectorProperties.px2 - state.vectorProperties.px1
          let dya = state.vectorProperties.py2 - state.vectorProperties.py1
          state.vectorProperties.radA = Math.floor(
            Math.sqrt(dxa * dxa + dya * dya)
          )
          state.vectorProperties.radA = state.vectorProperties.radA
        }
        updateEllipseOffsets(
          state,
          canvas,
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          state.vectorProperties.px2,
          state.vectorProperties.py2
        )
        //adjusting p3 should make findHalf on a perpendicular angle rotated -90 degrees, adjusting p1 should maintain offset, no subpixels
        // let calcAngle = angle - Math.PI / 2 // adjust p3

        // const offset = 1; //instead of subpixels, use manually selected option, would not need quadrant
        // option could be described as "exclude center point from radius", toggle odd or even, odd being excluding center point and offset = 0
        //for ellipse, passing the quadrant is also important to make offset go in the right direction
        //onscreen preview
        renderCanvas((ctx) => {
          actionEllipse(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            state.vectorProperties.radA,
            state.vectorProperties.radB,
            state.vectorProperties.forceCircle, //force circle initially
            swatches.primary.color,
            ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize,
            state.vectorProperties.angle,
            state.vectorProperties.offset,
            state.vectorProperties.x1Offset,
            state.vectorProperties.y1Offset
          )
        })
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        if (
          state.cursorX + canvas.subPixelX !==
            state.previousX + canvas.previousSubPixelX ||
          state.cursorY + canvas.subPixelY !==
            state.previousY + canvas.previousSubPixelY
        ) {
          adjustEllipseSteps()
        }
      } else {
        //draw line from origin point to current point onscreen
        //normalize pointermove to pixelgrid
        if (
          state.cursorX + canvas.subPixelX !==
            state.previousX + canvas.previousSubPixelX ||
          state.cursorY + canvas.subPixelY !==
            state.previousY + canvas.previousSubPixelY
        ) {
          if (state.clickCounter === 1) {
            state.vectorProperties.px2 = state.cursorX
            state.vectorProperties.py2 = state.cursorY
            let dxa = state.vectorProperties.px2 - state.vectorProperties.px1
            let dya = state.vectorProperties.py2 - state.vectorProperties.py1
            state.vectorProperties.radA = Math.floor(
              Math.sqrt(dxa * dxa + dya * dya)
            )
            state.vectorProperties.radA = state.vectorProperties.radA
          }
          updateEllipseOffsets(
            state,
            canvas,
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2
          )
          //onscreen preview
          renderCanvas((ctx) => {
            actionEllipse(
              state.vectorProperties.px1,
              state.vectorProperties.py1,
              state.vectorProperties.px2,
              state.vectorProperties.py2,
              state.vectorProperties.px3,
              state.vectorProperties.py3,
              state.vectorProperties.radA,
              state.vectorProperties.radB,
              state.vectorProperties.forceCircle, //force circle initially
              swatches.primary.color,
              ctx,
              state.mode,
              state.brushStamp,
              state.tool.brushSize,
              state.vectorProperties.angle,
              state.vectorProperties.offset,
              state.vectorProperties.x1Offset,
              state.vectorProperties.y1Offset
            )
          })
        }
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        adjustEllipseSteps()
      } else {
        if (state.clickCounter === 1) {
          let dxa = state.vectorProperties.px2 - state.vectorProperties.px1
          let dya = state.vectorProperties.py2 - state.vectorProperties.py1
          state.vectorProperties.radA = Math.floor(
            Math.sqrt(dxa * dxa + dya * dya)
          )
          //set px3 at right angle on the circle
          let newVertex = updateEllipseVertex(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            -Math.PI / 2,
            state.vectorProperties.radA
          )
          state.vectorProperties.px3 = newVertex.x
          state.vectorProperties.py3 = newVertex.y
          //set rb
          let dxb = state.vectorProperties.px3 - state.vectorProperties.px1
          let dyb = state.vectorProperties.py3 - state.vectorProperties.py1
          state.vectorProperties.radB = Math.floor(
            Math.sqrt(dxb * dxb + dyb * dyb)
          )
          //BUG: ellipse steps being called when it shouldn't be
          updateEllipseOffsets(
            state,
            canvas,
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2
          )
          actionEllipse(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            state.vectorProperties.radA,
            state.vectorProperties.radB,
            state.vectorProperties.forceCircle, //force circle initially
            swatches.primary.color,
            canvas.currentLayer.ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize,
            state.vectorProperties.angle,
            state.vectorProperties.offset,
            state.vectorProperties.x1Offset,
            state.vectorProperties.y1Offset
          )
          //store control points for timeline
          state.addToTimeline({
            tool: state.tool,
            layer: canvas.currentLayer,
            properties: {
              px1: state.vectorProperties.px1,
              py1: state.vectorProperties.py1,
              px2: state.vectorProperties.px2,
              py2: state.vectorProperties.py2,
              px3: state.vectorProperties.px3,
              py3: state.vectorProperties.py3,
              radA: state.vectorProperties.radA,
              radB: state.vectorProperties.radB,
              angle: state.vectorProperties.angle,
              offset: state.vectorProperties.offset,
              x1Offset: state.vectorProperties.x1Offset,
              y1Offset: state.vectorProperties.y1Offset,
              forceCircle: state.vectorProperties.forceCircle,
              //add bounding box minima maxima x and y?
            },
          })
          state.clickCounter = 0
          //reset vector state TODO: forceCircle needs to be reset
          state.vectorProperties.forceCircle = false
          renderCanvas()
          renderRasterGUI(state, canvas, swatches)
          vectorGui.render(state, canvas)
        }
      }
      break
    case "pointerout":
      if (vectorGui.selectedPoint.xKey) {
        // adjustCurveSteps()
      }
      //cancel curve
      state.clickCounter = 0
      break
    default:
    //do nothing
  }
}

/**
 * Used automatically by ellipse tool after curve is completed.
 * TODO: create distinct tool for adjusting that won't create a new curve when clicking.
 * Ideally a user should be able to click on a curve and render it's vector UI that way.
 * TODO: Modify point in vector timeline and push new curve set on pointer up to timeline as new type of push called "modify vector"
 * Currently this modifies the history directly which is a big no no, just done for testing, only ok for now since it just modifies the curve that was just created
 * BUG: On tablets, pointer is forced into dragging P2 no matter where a user clicks
 */
export function adjustEllipseSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent && state.clickCounter === 0) {
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        if (
          !keys.ShiftLeft &&
          !keys.ShiftRight &&
          vectorGui.selectedPoint.xKey !== "px1"
        ) {
          //if shift key is not being held, reset forceCircle
          state.vectorProperties.forceCircle = false
        }
        updateEllipseControlPoints(state, canvas, vectorGui)
        //TODO: changing opacity isn't enough since erase mode will be unaffected
        // let action = state.undoStack[canvas.currentVectorIndex]
        state.undoStack[canvas.currentVectorIndex].hidden = true
        //angle and offset passed should consider which point is being adjusted. For p1, use current state.vectorProperties.offset instead of recalculating. For p3, add 1.5 * Math.PI to angle
        renderCanvas(
          (ctx) => {
            actionEllipse(
              state.vectorProperties.px1,
              state.vectorProperties.py1,
              state.vectorProperties.px2,
              state.vectorProperties.py2,
              state.vectorProperties.px3,
              state.vectorProperties.py3,
              state.vectorProperties.radA,
              state.vectorProperties.radB,
              vectorGui.selectedPoint.xKey === "px1"
                ? state.undoStack[canvas.currentVectorIndex].properties
                    .forceCircle
                : state.vectorProperties.forceCircle,
              state.undoStack[canvas.currentVectorIndex].color,
              ctx,
              state.undoStack[canvas.currentVectorIndex].mode,
              state.undoStack[canvas.currentVectorIndex].brushStamp,
              state.undoStack[canvas.currentVectorIndex].brushSize,
              state.vectorProperties.angle,
              state.vectorProperties.offset,
              state.vectorProperties.x1Offset,
              state.vectorProperties.y1Offset
            )
          },
          true,
          true
        )
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        updateEllipseControlPoints(state, canvas, vectorGui)
        renderCanvas((ctx) => {
          actionEllipse(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            state.vectorProperties.radA,
            state.vectorProperties.radB,
            vectorGui.selectedPoint.xKey === "px1"
              ? state.undoStack[canvas.currentVectorIndex].properties
                  .forceCircle
              : state.vectorProperties.forceCircle,
            state.undoStack[canvas.currentVectorIndex].color,
            ctx,
            state.undoStack[canvas.currentVectorIndex].mode,
            state.undoStack[canvas.currentVectorIndex].brushStamp,
            state.undoStack[canvas.currentVectorIndex].brushSize,
            state.vectorProperties.angle,
            state.vectorProperties.offset,
            state.vectorProperties.x1Offset,
            state.vectorProperties.y1Offset
          )
        })
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        updateEllipseControlPoints(state, canvas, vectorGui)
        state.undoStack[canvas.currentVectorIndex].hidden = false
        modifyAction(canvas.currentVectorIndex)
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
        renderCanvas(null, true, true)
      }
      break
    case "pointerout":
      if (vectorGui.selectedPoint.xKey) {
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
      }
      break
    default:
    //do nothing
  }
}

//====================================//
//=== * * * Non-Action Tools * * * ===//
//====================================//

function moveSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
}

//Eyedropper
//TODO: add magnifying glass view that shows zoomed in view of area being sampled
export function eyedropperSteps() {
  //eyedropper helper function
  function sampleColor(x, y) {
    let newColor = getColor(x, y, state.colorLayerGlobal)
    //not simply passing whole color in until random color function is refined
    setColor(
      newColor.r,
      newColor.g,
      newColor.b,
      newColor.a,
      swatches.primary.swatch
    )
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //get imageData
      consolidateLayers()
      state.colorLayerGlobal = canvas.offScreenCTX.getImageData(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      //set color
      sampleColor(state.cursorX, state.cursorY)
      break
    case "pointermove":
      //normalize pointermove to pixelgrid, get color here too
      //get color
      sampleColor(state.cursorX, state.cursorY)
      //draw square
      renderRasterGUI(state, canvas, swatches)
      break
    default:
    //do nothing
  }
}

export function grabSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      state.grabStartX = state.cursorX
      state.grabStartY = state.cursorY
      break
    case "pointermove":
      canvas.xOffset = state.cursorX - state.grabStartX + canvas.previousXOffset
      canvas.yOffset = state.cursorY - state.grabStartY + canvas.previousYOffset
      renderCanvas()
      break
    case "pointerup":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      break
    case "pointerout":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      break
    default:
    //do nothing
  }
}

//====================================//
//===== * * * Tools Object * * * =====//
//====================================//

//Tools
export const tools = {
  //Modify history Tool
  modify: {
    name: "modify",
    fn: null,
    action: null,
    brushSize: null,
    disabled: false,
    options: [],
    type: "modify",
  },
  changeColor: {
    name: "changeColor",
    fn: null,
    action: null,
    brushSize: null,
    disabled: false,
    options: [],
    type: "modify",
  },
  remove: {
    name: "remove",
    fn: null,
    action: null,
    brushSize: null,
    disabled: false,
    options: [],
    type: "modify",
  },
  clear: {
    name: "clear",
    fn: null,
    action: null,
    brushSize: null,
    disabled: false,
    options: [],
    type: "modify",
  },
  //Raster Tools
  brush: {
    name: "brush",
    fn: drawSteps,
    action: actionDraw,
    brushSize: 1,
    disabled: false,
    options: { perfect: false, erase: false, inject: false, line: false },
    type: "raster",
  },
  line: {
    name: "line",
    fn: lineSteps,
    action: actionLine,
    brushSize: 1,
    disabled: false,
    options: { erase: false, inject: false },
    type: "raster",
  },
  // shading: {
  // user selects hsl shading color which mixes with colors that the user draws on to create dynamic shading
  // },
  replace: {
    name: "replace",
    fn: replaceSteps,
    action: actionDraw,
    brushSize: 1,
    disabled: false,
    options: { perfect: false, erase: false, inject: false }, //erase and inject not available right now. Inject will be default mode
    type: "raster",
  },
  select: {
    name: "select",
    fn: selectSteps,
    action: null,
    brushSize: 1,
    disabled: false,
    options: { magicWand: false },
    type: "raster",
  },
  // gradient: {
  // Create a dithered gradient
  // },
  //Vector Tools
  fill: {
    name: "fill",
    fn: fillSteps,
    action: actionFill,
    brushSize: 1,
    disabled: true,
    options: { contiguous: true, erase: false, inject: true },
    type: "vector",
  },
  quadCurve: {
    name: "quadCurve",
    fn: quadCurveSteps,
    action: actionQuadraticCurve,
    brushSize: 1,
    disabled: false,
    options: { erase: false, inject: false },
    type: "vector",
  },
  cubicCurve: {
    name: "cubicCurve",
    fn: cubicCurveSteps,
    action: actionCubicCurve,
    brushSize: 1,
    disabled: false,
    options: { erase: false, inject: false },
    type: "vector",
  },
  ellipse: {
    name: "ellipse",
    fn: ellipseSteps,
    action: actionEllipse,
    brushSize: 1,
    disabled: false,
    options: {
      useSubPixels: true,
      radiusExcludesCenter: false,
      erase: false,
      inject: false,
    }, // need to expand radiusExcludesCenter to cover multiple scenarios, centerx = 0 or 1 and centery = 0 or 1
    type: "vector",
  },
  //Non-cursor tools
  addLayer: {
    name: "addLayer",
    fn: null,
    action: null,
    brushSize: null,
    disabled: false,
    options: {},
    type: "settings",
  },
  removeLayer: {
    name: "removeLayer",
    fn: null,
    action: null,
    brushSize: null,
    disabled: false,
    options: {},
    type: "settings",
  },
  //Utility Tools (does not affect timeline)
  eyedropper: {
    name: "eyedropper",
    fn: eyedropperSteps,
    action: null,
    brushSize: 1,
    disabled: true,
    options: {},
    type: "utility",
  },
  grab: {
    name: "grab",
    fn: grabSteps,
    action: null,
    brushSize: 1,
    disabled: true,
    options: {},
    type: "utility",
  },
  /** move: {
    * Move a layer's coordinates independent of other layers
  } */
  /** perspective: {
   * set vanishing points.
   * Click to create a vanishing point with visible radius r.
   * Points are always visible even outside canvas area.
   * Clicking outside r will generate a new vanishing point.
   * Clicking inside r will select that vanishing point.
   * Hold shift to draw line from currently selected vanishing point to pointer location.
   * Hold control to view automatic perspective lines and click to make lines permanent.
   * NOTE: First iteration will not support curvilinear perspective. Can be approximated by combining multipoint perspective with drawing bezier curves from point to point
   * TODO: Add toggle option to snap line/ curve endpoints to vanishing point if made inside vanishing points radius.
  } */
}

//Initialize default tool
state.tool = tools.brush
