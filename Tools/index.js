import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import {
  actionDraw,
  actionLine,
  actionPerfectPixels,
  actionReplace,
  actionFill,
  actionQuadraticCurve,
  actionCubicCurve,
  actionEllipse,
} from "./actions.js"
import { getAngle } from "../utils/trig.js"
import { vectorGuiState, renderVectorGUI } from "../GUI/vector.js"
import {
  renderCursor,
  drawCurrentPixel,
  renderRasterGUI,
} from "../GUI/raster.js"
import {
  updateEllipseVertex,
  findHalf,
  updateEllipseOffsets,
  updateEllipseControlPoints,
} from "../utils/ellipse.js"

//====================================//
//=== * * * Tool Controllers * * * ===//
//====================================//

//"Steps" functions are controllers for the process

/**
 * Supported modes: "draw, erase, perfect",
 */
export function drawSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //set colorlayer, then for each brushpoint, alter colorlayer and add each to timeline
      actionDraw(
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        state.brushStamp,
        state.tool.brushSize,
        canvas.currentLayer.ctx,
        state.mode
      )
      state.previousX = state.cursorX
      state.previousY = state.cursorY
      //for perfect pixels
      state.lastDrawnX = state.cursorX
      state.lastDrawnY = state.cursorY
      state.waitingPixelX = state.cursorX
      state.waitingPixelY = state.cursorY
      if (state.tool.name !== "replace") {
        state.addToTimeline({
          tool: state.tool,
          x: state.cursorX,
          y: state.cursorY,
          layer: canvas.currentLayer,
        })
      }
      canvas.draw()
      break
    case "pointermove":
      if (state.mode === "perfect") {
        drawCurrentPixel(state, canvas, swatches)
      }
      if (
        state.previousX !== state.cursorX ||
        state.previousY !== state.cursorY
      ) {
        //draw between points when drawing fast
        if (
          Math.abs(state.cursorX - state.previousX) > 1 ||
          Math.abs(state.cursorY - state.previousY) > 1
        ) {
          actionLine(
            state.previousX,
            state.previousY,
            state.cursorX,
            state.cursorY,
            swatches.primary.color,
            canvas.currentLayer.ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
          if (state.tool.name !== "replace") {
            state.addToTimeline({
              tool: tools.line,
              x: { px1: state.previousX, px2: state.cursorX },
              y: { py1: state.previousY, py2: state.cursorY },
              layer: canvas.currentLayer,
            })
          }
          canvas.draw()
        } else {
          //FIX: perfect will be option, not mode
          if (state.mode === "perfect") {
            canvas.draw()
            drawCurrentPixel(state, canvas, swatches)
            actionPerfectPixels(state.cursorX, state.cursorY)
          } else {
            actionDraw(
              state.cursorX,
              state.cursorY,
              swatches.primary.color,
              state.brushStamp,
              state.tool.brushSize,
              canvas.currentLayer.ctx,
              state.mode
            )
            if (state.tool.name !== "replace") {
              state.addToTimeline({
                tool: state.tool,
                x: state.cursorX,
                y: state.cursorY,
                layer: canvas.currentLayer,
              })
            }
            canvas.draw()
          }
        }
      }
      // save last point
      state.previousX = state.cursorX
      state.previousY = state.cursorY
      break
    case "pointerup":
      //only needed if perfect pixels option is on
      actionDraw(
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        state.brushStamp,
        state.tool.brushSize,
        canvas.currentLayer.ctx,
        state.mode
      )
      if (state.tool.name !== "replace") {
        state.addToTimeline({
          tool: state.tool,
          x: state.cursorX,
          y: state.cursorY,
          layer: canvas.currentLayer,
        })
      }
      canvas.draw()
      break
    default:
    //do nothing
  }
}

/**
 * Supported modes: "draw, erase, perfect",
 */
export function replaceSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      actionReplace()
      drawSteps()
      break
    case "pointermove":
      drawSteps()
      break
    case "pointerup":
      drawSteps()
      actionReplace()
      break
    case "pointerout":
      actionReplace()
      break
    default:
    //do nothing
  }
}

/**
 * TODO: Work in progress
 * GOAL: create a dynamic selectable area, allowing the user to restrict the areas of the canvas that accept changes
 */
export function selectSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //1. set drag origin
      //2. save context
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
 * Supported modes: "draw, erase",
 */
export function lineSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.previousX = state.cursorX
      state.previousY = state.cursorY
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //only draw when necessary
      if (
        state.onscreenX !== state.previousOnscreenX ||
        state.onscreenY !== state.previousOnscreenY
      ) {
        canvas.onScreenCTX.clearRect(
          0,
          0,
          canvas.offScreenCVS.width / canvas.zoom,
          canvas.offScreenCVS.height / canvas.zoom
        )
        canvas.draw()
        actionLine(
          state.previousX + canvas.xOffset,
          state.previousY + canvas.yOffset,
          state.cursorWithCanvasOffsetX,
          state.cursorWithCanvasOffsetY,
          swatches.primary.color,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          canvas.offScreenCVS.width / canvas.offScreenCVS.width
        )
        state.previousOnscreenX = state.onscreenX
        state.previousOnscreenY = state.onscreenY
      }
      break
    case "pointerup":
      actionLine(
        state.previousX,
        state.previousY,
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
        x: { px1: state.previousX, px2: state.cursorX },
        y: { py1: state.previousY, py2: state.cursorY },
        layer: canvas.currentLayer,
      })
      canvas.draw()
      break
    default:
    //do nothing
  }
}

/**
 * Fill an area with the specified color
 * Supported modes: "draw, erase",
 */
export function fillSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGuiState.collisionPresent) {
        adjustFillSteps()
      } else {
        actionFill(
          state.cursorX,
          state.cursorY,
          swatches.primary.color,
          canvas.currentLayer.ctx,
          state.mode
        )
        //For undo ability, store starting coords and settings and pass them into actionFill
        state.addToTimeline({
          tool: state.tool,
          x: { px1: state.cursorX },
          y: { py1: state.cursorY },
          layer: canvas.currentLayer,
        })
        canvas.draw()
      }
      break
    case "pointermove":
      if (vectorGuiState.selectedPoint.xKey) {
        adjustFillSteps()
      }
    case "pointerup":
      if (vectorGuiState.selectedPoint.xKey) {
        adjustFillSteps()
      }
      //redraw canvas to allow onscreen cursor to render
      canvas.draw()
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
 */
export function adjustFillSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGuiState.collisionPresent) {
        vectorGuiState[vectorGuiState.collidedKeys.xKey] = state.cursorX
        vectorGuiState[vectorGuiState.collidedKeys.yKey] = state.cursorY
        vectorGuiState.selectedPoint = {
          xKey: vectorGuiState.collidedKeys.xKey,
          yKey: vectorGuiState.collidedKeys.yKey,
        }
        state.undoStack[canvas.currentVectorIndex][0].opacity = 0
        //Only render canvas up to timeline where fill action exists while adjusting fill
        canvas.render(canvas.currentVectorIndex) // render to canvas.currentVectorIndex
      }
      break
    case "pointermove":
      if (vectorGuiState.selectedPoint.xKey) {
        if (
          state.onscreenX !== state.previousOnscreenX ||
          state.onscreenY !== state.previousOnscreenY
        ) {
          //code gets past check twice here so figure out where tool fn is being called again
          vectorGuiState[vectorGuiState.selectedPoint.xKey] = state.cursorX
          vectorGuiState[vectorGuiState.selectedPoint.yKey] = state.cursorY
        }
      }
      break
    case "pointerup":
      if (vectorGuiState.selectedPoint.xKey) {
        vectorGuiState[vectorGuiState.selectedPoint.xKey] = state.cursorX
        vectorGuiState[vectorGuiState.selectedPoint.yKey] = state.cursorY
        state.undoStack[canvas.currentVectorIndex][0].x[
          vectorGuiState.selectedPoint.xKey
        ] = state.cursorX
        state.undoStack[canvas.currentVectorIndex][0].y[
          vectorGuiState.selectedPoint.yKey
        ] = state.cursorY
        state.undoStack[canvas.currentVectorIndex][0].opacity = 1
        vectorGuiState.selectedPoint = {
          xKey: null,
          yKey: null,
        }
        canvas.render()
      }
      break
    case "pointerout":
      if (vectorGuiState.selectedPoint.xKey) {
        vectorGuiState.selectedPoint = {
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
      if (vectorGuiState.collisionPresent && state.clickCounter === 0) {
        adjustCurveSteps(3)
      } else {
        //solidify end points
        state.clickCounter += 1
        if (state.clickCounter > 3) state.clickCounter = 1
        switch (state.clickCounter) {
          case 1:
            state.px1 = state.cursorX
            state.py1 = state.cursorY
            //reset control points
            state.px2 = null
            state.py2 = null
            state.px3 = null
            state.py3 = null
            state.px4 = null
            state.py4 = null
            vectorGuiState.px1 = state.px1
            vectorGuiState.py1 = state.py1
            //reset control points
            vectorGuiState.px2 = null
            vectorGuiState.py2 = null
            vectorGuiState.px3 = null
            vectorGuiState.py3 = null
            vectorGuiState.px4 = null
            vectorGuiState.py4 = null
            break
          case 2:
            if (!state.touch) {
              state.px2 = state.cursorX
              state.py2 = state.cursorY
              vectorGuiState.px2 = state.px2
              vectorGuiState.py2 = state.py2
            }
            break
          default:
          //do nothing
        }
        if (state.clickCounter === 3) {
          state.px3 = state.cursorX
          state.py3 = state.cursorY
          vectorGuiState.px3 = state.px3
          vectorGuiState.py3 = state.py3
        }
        //onscreen preview
        actionQuadraticCurve(
          state.px1 + canvas.xOffset,
          state.py1 + canvas.yOffset,
          state.px2 + canvas.xOffset,
          state.py2 + canvas.yOffset,
          state.px3 + canvas.xOffset,
          state.py3 + canvas.yOffset,
          state.clickCounter,
          swatches.primary.color,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          canvas.offScreenCVS.width / canvas.offScreenCVS.width
        )
      }
      break
    case "pointermove":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        adjustCurveSteps(3)
      } else {
        //draw line from origin point to current point onscreen
        //normalize pointermove to pixelgrid
        if (
          state.onscreenX !== state.previousOnscreenX ||
          state.onscreenY !== state.previousOnscreenY
        ) {
          // canvas.onScreenCTX.clearRect(0, 0, canvas.offScreenCVS.width / canvas.zoom, canvas.offScreenCVS.height / canvas.zoom);
          canvas.draw()
          if (state.clickCounter === 3) {
            state.px3 = state.cursorX
            state.py3 = state.cursorY
            vectorGuiState.px3 = state.px3
            vectorGuiState.py3 = state.py3
          }
          //onscreen preview
          actionQuadraticCurve(
            state.px1 + canvas.xOffset,
            state.py1 + canvas.yOffset,
            state.px2 + canvas.xOffset,
            state.py2 + canvas.yOffset,
            state.px3 + canvas.xOffset,
            state.py3 + canvas.yOffset,
            state.clickCounter,
            swatches.primary.color,
            canvas.onScreenCTX,
            state.mode,
            state.brushStamp,
            state.tool.brushSize,
            canvas.offScreenCVS.width / canvas.offScreenCVS.width
          )
          state.previousOnscreenX = state.onscreenX
          state.previousOnscreenY = state.onscreenY
        }
      }
      break
    case "pointerup":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        adjustCurveSteps(3)
      } else {
        //For touchscreens
        if (state.touch) {
          if (state.clickCounter === 1) {
            state.px2 = state.cursorX
            state.py2 = state.cursorY
            vectorGuiState.px2 = state.px2
            vectorGuiState.py2 = state.py2
          }
          if (state.clickCounter === 2) {
            state.clickCounter += 1
          }
        }
        //Solidify curve
        if (state.clickCounter === 3) {
          //solidify control point
          state.px3 = state.cursorX
          state.py3 = state.cursorY
          vectorGuiState.px3 = state.px3
          vectorGuiState.py3 = state.py3
          actionQuadraticCurve(
            state.px1,
            state.py1,
            state.px2,
            state.py2,
            state.px3,
            state.py3,
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
            x: { px1: state.px1, px2: state.px2, px3: state.px3 },
            y: { py1: state.py1, py2: state.py2, py3: state.py3 },
            layer: canvas.currentLayer,
          })
          canvas.draw()
        }
      }
      break
    case "pointerout":
      if (vectorGuiState.selectedPoint.xKey) {
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
      if (vectorGuiState.collisionPresent && state.clickCounter === 0) {
        adjustCurveSteps()
      } else {
        //solidify end points
        state.clickCounter += 1
        if (state.clickCounter > 4) state.clickCounter = 1
        switch (state.clickCounter) {
          case 1:
            state.px1 = state.cursorX
            state.py1 = state.cursorY
            //reset control points
            state.px2 = null
            state.py2 = null
            state.px3 = null
            state.py3 = null
            state.px4 = null
            state.py4 = null
            vectorGuiState.px1 = state.px1
            vectorGuiState.py1 = state.py1
            //reset control points
            vectorGuiState.px2 = null
            vectorGuiState.py2 = null
            vectorGuiState.px3 = null
            vectorGuiState.py3 = null
            vectorGuiState.px4 = null
            vectorGuiState.py4 = null
            break
          case 2:
            if (!state.touch) {
              state.px2 = state.cursorX
              state.py2 = state.cursorY
              vectorGuiState.px2 = state.px2
              vectorGuiState.py2 = state.py2
            }
            break
          case 3:
            if (!state.touch) {
              state.px3 = state.cursorX
              state.py3 = state.cursorY
              vectorGuiState.px3 = state.px3
              vectorGuiState.py3 = state.py3
            }
            break
          default:
          //do nothing
        }
        if (state.clickCounter === 4) {
          state.px4 = state.cursorX
          state.py4 = state.cursorY
          vectorGuiState.px4 = state.px4
          vectorGuiState.py4 = state.py4
        }
        //onscreen preview
        actionCubicCurve(
          state.px1 + canvas.xOffset,
          state.py1 + canvas.yOffset,
          state.px2 + canvas.xOffset,
          state.py2 + canvas.yOffset,
          state.px3 + canvas.xOffset,
          state.py3 + canvas.yOffset,
          state.px4 + canvas.xOffset,
          state.py4 + canvas.yOffset,
          state.clickCounter,
          swatches.primary.color,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          canvas.offScreenCVS.width / canvas.offScreenCVS.width
        )
      }
      break
    case "pointermove":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        adjustCurveSteps()
      } else {
        //draw line from origin point to current point onscreen
        //normalize pointermove to pixelgrid
        if (
          state.onscreenX !== state.previousOnscreenX ||
          state.onscreenY !== state.previousOnscreenY
        ) {
          canvas.draw()
          if (state.clickCounter === 4) {
            state.px4 = state.cursorX
            state.py4 = state.cursorY
            vectorGuiState.px4 = state.px4
            vectorGuiState.py4 = state.py4
          }
          //onscreen preview
          actionCubicCurve(
            state.px1 + canvas.xOffset,
            state.py1 + canvas.yOffset,
            state.px2 + canvas.xOffset,
            state.py2 + canvas.yOffset,
            state.px3 + canvas.xOffset,
            state.py3 + canvas.yOffset,
            state.px4 + canvas.xOffset,
            state.py4 + canvas.yOffset,
            state.clickCounter,
            swatches.primary.color,
            canvas.onScreenCTX,
            state.mode,
            state.brushStamp,
            state.tool.brushSize,
            canvas.offScreenCVS.width / canvas.offScreenCVS.width
          )
          state.previousOnscreenX = state.onscreenX
          state.previousOnscreenY = state.onscreenY
        }
      }
      break
    case "pointerup":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        adjustCurveSteps()
      } else {
        //For touchscreens
        if (state.touch) {
          if (state.clickCounter === 1) {
            state.px2 = state.cursorX
            state.py2 = state.cursorY
            vectorGuiState.px2 = state.px2
            vectorGuiState.py2 = state.py2
          }
          if (state.clickCounter === 2) {
            state.px3 = state.cursorX
            state.py3 = state.cursorY
            vectorGuiState.px3 = state.px3
            vectorGuiState.py3 = state.py3
          }
          if (state.clickCounter === 3) {
            state.clickCounter += 1
          }
        }
        //Solidify curve
        if (state.clickCounter === 4) {
          //solidify control point
          state.px4 = state.cursorX
          state.py4 = state.cursorY
          vectorGuiState.px4 = state.px4
          vectorGuiState.py4 = state.py4
          actionCubicCurve(
            state.px1,
            state.py1,
            state.px2,
            state.py2,
            state.px3,
            state.py3,
            state.px4,
            state.py4,
            state.clickCounter,
            swatches.primary.color,
            canvas.currentLayer.ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
          state.clickCounter = 0
          //store control points for timeline
          if (!state.debugger) {
            state.addToTimeline({
              tool: state.tool,
              x: {
                px1: state.px1,
                px2: state.px2,
                px3: state.px3,
                px4: state.px4,
              },
              y: {
                py1: state.py1,
                py2: state.py2,
                py3: state.py3,
                py4: state.py4,
              },
              layer: canvas.currentLayer,
            })
          }
          canvas.draw()
          renderRasterGUI(state, canvas, swatches)
          renderVectorGUI(state, canvas)
        }
      }
      break
    case "pointerout":
      if (vectorGuiState.selectedPoint.xKey) {
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
      if (vectorGuiState.collisionPresent && state.clickCounter === 0) {
        vectorGuiState[vectorGuiState.collidedKeys.xKey] = state.cursorX
        vectorGuiState[vectorGuiState.collidedKeys.yKey] = state.cursorY
        vectorGuiState.selectedPoint = {
          xKey: vectorGuiState.collidedKeys.xKey,
          yKey: vectorGuiState.collidedKeys.yKey,
        }
        state.undoStack[canvas.currentVectorIndex][0].opacity = 0
        canvas.render()
        if (numPoints === 3) {
          actionQuadraticCurve(
            vectorGuiState.px1 + canvas.xOffset,
            vectorGuiState.py1 + canvas.yOffset,
            vectorGuiState.px2 + canvas.xOffset,
            vectorGuiState.py2 + canvas.yOffset,
            vectorGuiState.px3 + canvas.xOffset,
            vectorGuiState.py3 + canvas.yOffset,
            3,
            state.undoStack[canvas.currentVectorIndex][0].color,
            canvas.onScreenCTX,
            state.undoStack[canvas.currentVectorIndex][0].mode,
            state.undoStack[canvas.currentVectorIndex][0].brush,
            state.undoStack[canvas.currentVectorIndex][0].weight
          )
        } else {
          actionCubicCurve(
            vectorGuiState.px1 + canvas.xOffset,
            vectorGuiState.py1 + canvas.yOffset,
            vectorGuiState.px2 + canvas.xOffset,
            vectorGuiState.py2 + canvas.yOffset,
            vectorGuiState.px3 + canvas.xOffset,
            vectorGuiState.py3 + canvas.yOffset,
            vectorGuiState.px4 + canvas.xOffset,
            vectorGuiState.py4 + canvas.yOffset,
            4,
            state.undoStack[canvas.currentVectorIndex][0].color,
            canvas.onScreenCTX,
            state.undoStack[canvas.currentVectorIndex][0].mode,
            state.undoStack[canvas.currentVectorIndex][0].brush,
            state.undoStack[canvas.currentVectorIndex][0].weight
          )
        }
      }
      break
    case "pointermove":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        vectorGuiState[vectorGuiState.selectedPoint.xKey] = state.cursorX
        vectorGuiState[vectorGuiState.selectedPoint.yKey] = state.cursorY
        canvas.draw()
        if (numPoints === 3) {
          actionQuadraticCurve(
            vectorGuiState.px1 + canvas.xOffset,
            vectorGuiState.py1 + canvas.yOffset,
            vectorGuiState.px2 + canvas.xOffset,
            vectorGuiState.py2 + canvas.yOffset,
            vectorGuiState.px3 + canvas.xOffset,
            vectorGuiState.py3 + canvas.yOffset,
            3,
            state.undoStack[canvas.currentVectorIndex][0].color,
            canvas.onScreenCTX,
            state.undoStack[canvas.currentVectorIndex][0].mode,
            state.undoStack[canvas.currentVectorIndex][0].brush,
            state.undoStack[canvas.currentVectorIndex][0].weight
          )
        } else {
          actionCubicCurve(
            vectorGuiState.px1 + canvas.xOffset,
            vectorGuiState.py1 + canvas.yOffset,
            vectorGuiState.px2 + canvas.xOffset,
            vectorGuiState.py2 + canvas.yOffset,
            vectorGuiState.px3 + canvas.xOffset,
            vectorGuiState.py3 + canvas.yOffset,
            vectorGuiState.px4 + canvas.xOffset,
            vectorGuiState.py4 + canvas.yOffset,
            4,
            state.undoStack[canvas.currentVectorIndex][0].color,
            canvas.onScreenCTX,
            state.undoStack[canvas.currentVectorIndex][0].mode,
            state.undoStack[canvas.currentVectorIndex][0].brush,
            state.undoStack[canvas.currentVectorIndex][0].weight
          )
        }
      }
      break
    case "pointerup":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        vectorGuiState[vectorGuiState.selectedPoint.xKey] = state.cursorX
        vectorGuiState[vectorGuiState.selectedPoint.yKey] = state.cursorY
        state.undoStack[canvas.currentVectorIndex][0].x[
          vectorGuiState.selectedPoint.xKey
        ] = state.cursorX
        state.undoStack[canvas.currentVectorIndex][0].y[
          vectorGuiState.selectedPoint.yKey
        ] = state.cursorY
        state.undoStack[canvas.currentVectorIndex][0].opacity = 1
        vectorGuiState.selectedPoint = {
          xKey: null,
          yKey: null,
        }
        canvas.render()
      }
      break
    case "pointerout":
      if (vectorGuiState.selectedPoint.xKey) {
        vectorGuiState.selectedPoint = {
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
 * TODO: Due to method of modifying radius on a pixel grid, only odd diameter circles are created. Eg. 15px radius creates a 31px diameter circle. To fix this, allow half pixel increments.
 */
export function ellipseSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGuiState.collisionPresent && state.clickCounter === 0) {
        adjustEllipseSteps()
      } else {
        //solidify end points
        state.clickCounter += 1
        if (state.clickCounter > 2) state.clickCounter = 1
        switch (state.clickCounter) {
          case 1:
            state.px1 = state.cursorX
            state.py1 = state.cursorY
            //reset control points
            state.px2 = null
            state.py2 = null
            state.px3 = null
            state.py3 = null
            state.px4 = null
            state.py4 = null
            vectorGuiState.px1 = state.px1
            vectorGuiState.py1 = state.py1
            //reset control points
            vectorGuiState.px2 = null
            vectorGuiState.py2 = null
            vectorGuiState.px3 = null
            vectorGuiState.py3 = null
            vectorGuiState.px4 = null
            vectorGuiState.py4 = null
            break
          default:
          //do nothing
        }
        if (state.clickCounter === 1) {
          //initialize circle with radius 15 by default.
          state.px2 = state.cursorX
          state.py2 = state.cursorY
          vectorGuiState.px2 = state.px2
          vectorGuiState.py2 = state.py2
          let dxa = state.px2 - state.px1
          let dya = state.py2 - state.py1
          state.radA = Math.floor(Math.sqrt(dxa * dxa + dya * dya))
          vectorGuiState.radA = state.radA
        }
        updateEllipseOffsets(
          state,
          canvas,
          state.px1,
          state.py1,
          state.px2,
          state.py2
        )
        //adjusting p3 should make findHalf on a perpendicular angle rotated -90 degrees, adjusting p1 should maintain offset, no subpixels
        // let calcAngle = angle - Math.PI / 2 // adjust p3

        // const offset = 1; //instead of subpixels, use manually selected option, would not need quadrant
        // option could be described as "exclude center point from radius", toggle odd or even, odd being excluding center point and offset = 0
        //for ellipse, passing the quadrant is also important to make offset go in the right direction
        //onscreen preview
        actionEllipse(
          state.px1 + canvas.xOffset,
          state.py1 + canvas.yOffset,
          state.px2 + canvas.xOffset,
          state.py2 + canvas.yOffset,
          state.px3 + canvas.xOffset,
          state.py3 + canvas.yOffset,
          state.radA,
          state.radB,
          true, //force circle initially
          swatches.primary.color,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          canvas.offScreenCVS.width / canvas.offScreenCVS.width,
          state.angle,
          state.offset,
          state.x1Offset,
          state.y1Offset
        )
      }
      break
    case "pointermove":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        if (
          state.onscreenX + canvas.subPixelX !==
            state.previousOnscreenX + canvas.previousSubPixelX ||
          state.onscreenY + canvas.subPixelY !==
            state.previousOnscreenY + canvas.previousSubPixelY
        ) {
          adjustEllipseSteps()
          state.previousOnscreenX = state.onscreenX
          state.previousOnscreenY = state.onscreenY
          canvas.previousSubPixelX = canvas.subPixelX
          canvas.previousSubPixelY = canvas.subPixelY
        }
      } else {
        //draw line from origin point to current point onscreen
        //normalize pointermove to pixelgrid
        if (
          state.onscreenX + canvas.subPixelX !==
            state.previousOnscreenX + canvas.previousSubPixelX ||
          state.onscreenY + canvas.subPixelY !==
            state.previousOnscreenY + canvas.previousSubPixelY
        ) {
          canvas.draw()
          if (state.clickCounter === 1) {
            state.px2 = state.cursorX
            state.py2 = state.cursorY
            vectorGuiState.px2 = state.px2
            vectorGuiState.py2 = state.py2
            let dxa = state.px2 - state.px1
            let dya = state.py2 - state.py1
            state.radA = Math.floor(Math.sqrt(dxa * dxa + dya * dya))
            vectorGuiState.radA = state.radA
          }
          //NOTE: This code is commented out for now. It forces the cursor's position to be p3 which makes it easier to make an ellipse,
          //but it isn't really needed since one can just adjust the control points of a circle and this code makes making a circle less intuitive.
          // else if (state.clickCounter === 2) {
          //   state.px3 = state.cursorX
          //   state.py3 = state.cursorY
          //   vectorGuiState.px3 = state.px3
          //   vectorGuiState.py3 = state.py3
          //   let dxb = state.px3 - state.px1
          //   let dyb = state.py3 - state.py1
          //   state.radB = Math.floor(Math.sqrt(dxb * dxb + dyb * dyb))
          //   vectorGuiState.radB = state.radB
          //   //change p2 to rotate based on new angle
          //   let newVertex = updateEllipseVertex(
          //     state.px1,
          //     state.py1,
          //     state.px3,
          //     state.py3,
          //     Math.PI / 2,
          //     state.radA
          //   )
          //   state.px2 = newVertex.x
          //   state.py2 = newVertex.y
          //   vectorGuiState.px2 = state.px2
          //   vectorGuiState.py2 = state.py2
          //   //Do not update radB here
          // }
          updateEllipseOffsets(
            state,
            canvas,
            state.px1,
            state.py1,
            state.px2,
            state.py2
          )
          //onscreen preview
          actionEllipse(
            state.px1 + canvas.xOffset,
            state.py1 + canvas.yOffset,
            state.px2 + canvas.xOffset,
            state.py2 + canvas.yOffset,
            state.px3 + canvas.xOffset,
            state.py3 + canvas.yOffset,
            state.radA,
            state.radB,
            true, //force circle initially
            swatches.primary.color,
            canvas.onScreenCTX,
            state.mode,
            state.brushStamp,
            state.tool.brushSize,
            canvas.offScreenCVS.width / canvas.offScreenCVS.width,
            state.angle,
            state.offset,
            state.x1Offset,
            state.y1Offset
          )
          state.previousOnscreenX = state.onscreenX
          state.previousOnscreenY = state.onscreenY
          canvas.previousSubPixelX = canvas.subPixelX
          canvas.previousSubPixelY = canvas.subPixelY
        }
      }
      break
    case "pointerup":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        adjustEllipseSteps()
      } else {
        //For touchscreens
        if (state.touch) {
          if (state.clickCounter === 1) {
            state.px2 = state.cursorX
            state.py2 = state.cursorY
            vectorGuiState.px2 = state.px2
            vectorGuiState.py2 = state.py2
          }
        }
        if (state.clickCounter === 1) {
          let dxa = state.px2 - state.px1
          let dya = state.py2 - state.py1
          state.radA = Math.floor(Math.sqrt(dxa * dxa + dya * dya))
          vectorGuiState.radA = state.radA
          //set px3 at right angle on the circle
          let newVertex = updateEllipseVertex(
            state.px1,
            state.py1,
            state.px2,
            state.py2,
            -Math.PI / 2,
            state.radA
          )
          state.px3 = newVertex.x
          state.py3 = newVertex.y
          vectorGuiState.px3 = state.px3
          vectorGuiState.py3 = state.py3
          //set rb
          let dxb = state.px3 - state.px1
          let dyb = state.py3 - state.py1
          state.radB = Math.floor(Math.sqrt(dxb * dxb + dyb * dyb))
          vectorGuiState.radB = state.radB
          updateEllipseOffsets(
            state,
            canvas,
            state.px1,
            state.py1,
            state.px2,
            state.py2
          )
          actionEllipse(
            state.px1,
            state.py1,
            state.px2,
            state.py2,
            state.px3,
            state.py3,
            state.radA,
            state.radB,
            true, //force circle initially
            swatches.primary.color,
            canvas.currentLayer.ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize,
            1,
            state.angle,
            state.offset,
            state.x1Offset,
            state.y1Offset
          )
          //store control points for timeline
          state.addToTimeline({
            tool: state.tool,
            x: {
              px1: state.px1,
              px2: state.px2,
              px3: state.px3,
            },
            y: {
              py1: state.py1,
              py2: state.py2,
              py3: state.py3,
            },
            layer: canvas.currentLayer,
            properties: {
              radA: state.radA,
              radB: state.radB,
              angle: state.angle,
              offset: state.offset,
              x1Offset: state.x1Offset,
              y1Offset: state.y1Offset,
              forceCircle: true,
              //add bounding box minima maxima x and y?
            },
          })
          state.clickCounter = 0
          canvas.draw()
          renderRasterGUI(state, canvas, swatches)
          renderVectorGUI(state, canvas)
        }
        //Solidify ellipse
        //NOTE: This code is commented out for now. It forces the cursor's position to be p3 which makes it easier to make an ellipse,
        //but it isn't really needed since one can just adjust the control points of a circle and this code makes making a circle less intuitive.
        // if (state.clickCounter === 2) {
        //   actionEllipse(
        //     state.px1,
        //     state.py1,
        //     state.px2,
        //     state.py2,
        //     state.px3,
        //     state.py3,
        //     state.radA,
        //     state.radB,
        //     state.clickCounter,
        //     swatches.primary.color,
        //     canvas.currentLayer.ctx,
        //     state.mode,
        //     state.brushStamp,
        //     state.tool.brushSize
        //   )
        //   state.clickCounter = 0
        //   //store control points for timeline
        //   state.addToTimeline({
        //     tool: state.tool,
        //     x: {
        //       px1: state.px1,
        //       px2: state.px2,
        //       px3: state.px3,
        //     },
        //     y: {
        //       py1: state.py1,
        //       py2: state.py2,
        //       py3: state.py3,
        //     },
        //     layer: canvas.currentLayer,
        //     properties: {
        //       radA: state.radA,
        //       radB: state.radB,
        //     },
        //   })
        //   canvas.draw()
        //   renderRasterGUI(state, canvas, swatches)
        //   renderVectorGUI(state, canvas)
        // }
      }
      break
    case "pointerout":
      if (vectorGuiState.selectedPoint.xKey) {
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
 */
export function adjustEllipseSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGuiState.collisionPresent && state.clickCounter === 0) {
        vectorGuiState.selectedPoint = {
          xKey: vectorGuiState.collidedKeys.xKey,
          yKey: vectorGuiState.collidedKeys.yKey,
        }
        updateEllipseControlPoints(state, canvas, vectorGuiState)
        //TODO: changing opacity isn't enough since erase mode will be unaffected
        // let action = state.undoStack[canvas.currentVectorIndex]
        state.undoStack[canvas.currentVectorIndex][0].opacity = 0
        canvas.render()
        //angle and offset passed should consider which point is being adjusted. For p1, use current state.offset instead of recalculating. For p3, add 1.5 * Math.PI to angle
        actionEllipse(
          vectorGuiState.px1 + canvas.xOffset,
          vectorGuiState.py1 + canvas.yOffset,
          vectorGuiState.px2 + canvas.xOffset,
          vectorGuiState.py2 + canvas.yOffset,
          vectorGuiState.px3 + canvas.xOffset,
          vectorGuiState.py3 + canvas.yOffset,
          vectorGuiState.radA,
          vectorGuiState.radB,
          vectorGuiState.selectedPoint.xKey === "px1"
            ? state.undoStack[canvas.currentVectorIndex][0].properties
                .forceCircle
            : state.forceCircle,
          state.undoStack[canvas.currentVectorIndex][0].color,
          canvas.onScreenCTX,
          state.undoStack[canvas.currentVectorIndex][0].mode,
          state.undoStack[canvas.currentVectorIndex][0].brush,
          state.undoStack[canvas.currentVectorIndex][0].weight,
          1,
          state.angle,
          state.offset,
          state.x1Offset,
          state.y1Offset
        )
      }
      break
    case "pointermove":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        updateEllipseControlPoints(state, canvas, vectorGuiState)
        canvas.draw()
        actionEllipse(
          vectorGuiState.px1 + canvas.xOffset,
          vectorGuiState.py1 + canvas.yOffset,
          vectorGuiState.px2 + canvas.xOffset,
          vectorGuiState.py2 + canvas.yOffset,
          vectorGuiState.px3 + canvas.xOffset,
          vectorGuiState.py3 + canvas.yOffset,
          vectorGuiState.radA,
          vectorGuiState.radB,
          vectorGuiState.selectedPoint.xKey === "px1"
            ? state.undoStack[canvas.currentVectorIndex][0].properties
                .forceCircle
            : state.forceCircle,
          state.undoStack[canvas.currentVectorIndex][0].color,
          canvas.onScreenCTX,
          state.undoStack[canvas.currentVectorIndex][0].mode,
          state.undoStack[canvas.currentVectorIndex][0].brush,
          state.undoStack[canvas.currentVectorIndex][0].weight,
          1,
          state.angle,
          state.offset,
          state.x1Offset,
          state.y1Offset
        )
      }
      break
    case "pointerup":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        updateEllipseControlPoints(state, canvas, vectorGuiState)
        //TODO: instead of directly changing the undoStack here, set the values to a copy of the action, then store that as "to", the old action as "from" and the moddedActionIndex on an object pushed to state.points
        state.undoStack[canvas.currentVectorIndex][0].x.px1 = vectorGuiState.px1
        state.undoStack[canvas.currentVectorIndex][0].y.py1 = vectorGuiState.py1
        state.undoStack[canvas.currentVectorIndex][0].x.px2 = vectorGuiState.px2
        state.undoStack[canvas.currentVectorIndex][0].y.py2 = vectorGuiState.py2
        state.undoStack[canvas.currentVectorIndex][0].x.px3 = vectorGuiState.px3
        state.undoStack[canvas.currentVectorIndex][0].y.py3 = vectorGuiState.py3
        state.undoStack[canvas.currentVectorIndex][0].properties.radA =
          vectorGuiState.radA
        state.undoStack[canvas.currentVectorIndex][0].properties.radB =
          vectorGuiState.radB
        state.undoStack[canvas.currentVectorIndex][0].properties.angle =
          state.angle
        state.undoStack[canvas.currentVectorIndex][0].properties.offset =
          state.offset
        state.undoStack[canvas.currentVectorIndex][0].properties.x1Offset =
          state.x1Offset
        state.undoStack[canvas.currentVectorIndex][0].properties.y1Offset =
          state.y1Offset
        state.undoStack[canvas.currentVectorIndex][0].properties.forceCircle =
          vectorGuiState.selectedPoint.xKey === "px1"
            ? state.undoStack[canvas.currentVectorIndex][0].properties
                .forceCircle
            : state.forceCircle
        state.undoStack[canvas.currentVectorIndex][0].opacity = 1
        vectorGuiState.selectedPoint = {
          xKey: null,
          yKey: null,
        }
        canvas.render()
      }
      break
    case "pointerout":
      if (vectorGuiState.selectedPoint.xKey) {
        vectorGuiState.selectedPoint = {
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
    let newColor = canvas.getColor(x, y, state.colorLayerGlobal)
    //not simply passing whole color in until random color function is refined
    swatches.setColor(newColor.r, newColor.g, newColor.b, "swatch btn")
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //get imageData
      canvas.consolidateLayers()
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
      if (
        state.onscreenX !== state.previousOnscreenX ||
        state.onscreenY !== state.previousOnscreenY
      ) {
        //get color
        sampleColor(state.cursorX, state.cursorY)
        //draw square
        renderRasterGUI(state, canvas, swatches)
        renderVectorGUI(state, canvas)
        renderCursor(state, canvas, swatches)
        state.previousOnscreenX = state.onscreenX
        state.previousOnscreenY = state.onscreenY
      }
      break
    default:
    //do nothing
  }
}

export function grabSteps() {
  switch (canvas.pointerEvent) {
    case "pointermove":
      canvas.xOffset =
        state.onscreenX - state.previousOnscreenX + canvas.previousXOffset
      canvas.yOffset =
        state.onscreenY - state.previousOnscreenY + canvas.previousYOffset
      canvas.draw()
      break
    case "pointerup":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      state.previousOnscreenX = state.onscreenX
      state.previousOnscreenY = state.onscreenY
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
  //Raster Tools
  brush: {
    name: "brush",
    fn: drawSteps,
    brushSize: 1,
    disabled: false,
    options: ["perfect"],
    type: "raster",
  },
  line: {
    name: "line",
    fn: lineSteps,
    brushSize: 1,
    disabled: false,
    options: [],
    type: "raster",
  },
  // shading: {
  // user selects hsl shading color which mixes with colors that the user draws on to create dynamic shading
  // },
  replace: {
    name: "replace",
    fn: replaceSteps,
    brushSize: 1,
    disabled: false,
    options: ["perfect"],
    type: "raster",
  },
  select: {
    name: "select",
    fn: selectSteps,
    brushSize: 1,
    disabled: false,
    options: ["magic wand"],
    type: "raster",
  },
  // gradient: {
  // Create a dithered gradient
  // },
  addLayer: {
    name: "addLayer",
    fn: null,
    brushSize: null,
    disabled: false,
    options: [],
    type: "raster",
  },
  clear: {
    name: "clear",
    fn: null,
    brushSize: null,
    disabled: false,
    options: [],
    type: "raster",
  },
  //Vector Tools
  fill: {
    name: "fill",
    fn: fillSteps,
    brushSize: 1,
    disabled: true,
    options: ["contiguous"],
    type: "vector",
  },
  quadCurve: {
    name: "quadCurve",
    fn: quadCurveSteps,
    brushSize: 1,
    disabled: false,
    options: [],
    type: "vector",
  },
  cubicCurve: {
    name: "cubicCurve",
    fn: cubicCurveSteps,
    brushSize: 1,
    disabled: false,
    options: [],
    type: "vector",
  },
  ellipse: {
    name: "ellipse",
    fn: ellipseSteps,
    brushSize: 1,
    disabled: false,
    options: ["radiusExcludesCenter"], // rename to something shorter
    type: "vector",
  },
  //Utility Tools (does not affect timeline)
  eyedropper: {
    name: "eyedropper",
    fn: eyedropperSteps,
    brushSize: 1,
    disabled: true,
    options: [],
    type: "utility",
  },
  grab: {
    name: "grab",
    fn: grabSteps,
    brushSize: 1,
    disabled: true,
    options: [],
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
