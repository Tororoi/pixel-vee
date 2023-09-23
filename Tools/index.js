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
              layer: canvas.currentLayer,
              properties: {
                px1: state.previousX,
                py1: state.previousY,
                px2: state.cursorX,
                py2: state.cursorY,
              },
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
 * Supported modes: "draw, perfect"
 * TODO: support "erase"
 * creates a copy of the canvas with just the secondary color parts. This is used as a mask so the user can draw normally.
 * When the user finishes drawing, the changed pixels are saved as points and will be rerendered in the timeline as single pixel brush points
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
 * Should use a mask layer that only draws black for selected area
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
        layer: canvas.currentLayer,
        properties: {
          px1: state.previousX,
          py1: state.previousY,
          px2: state.cursorX,
          py2: state.cursorY,
        },
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
        state.vectorProperties.px1 = state.cursorX
        state.vectorProperties.py1 = state.cursorY
        actionFill(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          swatches.primary.color,
          canvas.currentLayer.ctx,
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
      if (vectorGuiState.collisionPresent) {
        state.vectorProperties[vectorGuiState.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGuiState.collidedKeys.yKey] = state.cursorY
        vectorGuiState.selectedPoint = {
          xKey: vectorGuiState.collidedKeys.xKey,
          yKey: vectorGuiState.collidedKeys.yKey,
        }
        state.undoStack[canvas.currentVectorIndex][0].hidden = true
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
          state.vectorProperties[vectorGuiState.selectedPoint.xKey] =
            state.cursorX
          state.vectorProperties[vectorGuiState.selectedPoint.yKey] =
            state.cursorY
        }
      }
      break
    case "pointerup":
      if (vectorGuiState.selectedPoint.xKey) {
        state.vectorProperties[vectorGuiState.selectedPoint.xKey] =
          state.cursorX
        state.vectorProperties[vectorGuiState.selectedPoint.yKey] =
          state.cursorY
        state.undoStack[canvas.currentVectorIndex][0].properties[
          vectorGuiState.selectedPoint.xKey
        ] = state.cursorX
        state.undoStack[canvas.currentVectorIndex][0].properties[
          vectorGuiState.selectedPoint.yKey
        ] = state.cursorY
        state.undoStack[canvas.currentVectorIndex][0].hidden = false
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
            state.vectorProperties.px1 = state.cursorX
            state.vectorProperties.py1 = state.cursorY
            //reset control points
            state.vectorProperties.px2 = null
            state.vectorProperties.py2 = null
            state.vectorProperties.px3 = null
            state.vectorProperties.py3 = null
            state.vectorProperties.px4 = null
            state.vectorProperties.py4 = null
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
        actionQuadraticCurve(
          state.vectorProperties.px1 + canvas.xOffset,
          state.vectorProperties.py1 + canvas.yOffset,
          state.vectorProperties.px2 + canvas.xOffset,
          state.vectorProperties.py2 + canvas.yOffset,
          state.vectorProperties.px3 + canvas.xOffset,
          state.vectorProperties.py3 + canvas.yOffset,
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
            state.vectorProperties.px3 = state.cursorX
            state.vectorProperties.py3 = state.cursorY
          }
          //onscreen preview
          actionQuadraticCurve(
            state.vectorProperties.px1 + canvas.xOffset,
            state.vectorProperties.py1 + canvas.yOffset,
            state.vectorProperties.px2 + canvas.xOffset,
            state.vectorProperties.py2 + canvas.yOffset,
            state.vectorProperties.px3 + canvas.xOffset,
            state.vectorProperties.py3 + canvas.yOffset,
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
            state.vectorProperties.px1 = state.cursorX
            state.vectorProperties.py1 = state.cursorY
            //reset control points
            state.vectorProperties.px2 = null
            state.vectorProperties.py2 = null
            state.vectorProperties.px3 = null
            state.vectorProperties.py3 = null
            state.vectorProperties.px4 = null
            state.vectorProperties.py4 = null
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
        actionCubicCurve(
          state.vectorProperties.px1 + canvas.xOffset,
          state.vectorProperties.py1 + canvas.yOffset,
          state.vectorProperties.px2 + canvas.xOffset,
          state.vectorProperties.py2 + canvas.yOffset,
          state.vectorProperties.px3 + canvas.xOffset,
          state.vectorProperties.py3 + canvas.yOffset,
          state.vectorProperties.px4 + canvas.xOffset,
          state.vectorProperties.py4 + canvas.yOffset,
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
            state.vectorProperties.px4 = state.cursorX
            state.vectorProperties.py4 = state.cursorY
          }
          //onscreen preview
          actionCubicCurve(
            state.vectorProperties.px1 + canvas.xOffset,
            state.vectorProperties.py1 + canvas.yOffset,
            state.vectorProperties.px2 + canvas.xOffset,
            state.vectorProperties.py2 + canvas.yOffset,
            state.vectorProperties.px3 + canvas.xOffset,
            state.vectorProperties.py3 + canvas.yOffset,
            state.vectorProperties.px4 + canvas.xOffset,
            state.vectorProperties.py4 + canvas.yOffset,
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
          if (!state.debugger) {
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
        state.vectorProperties[vectorGuiState.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGuiState.collidedKeys.yKey] = state.cursorY
        vectorGuiState.selectedPoint = {
          xKey: vectorGuiState.collidedKeys.xKey,
          yKey: vectorGuiState.collidedKeys.yKey,
        }
        state.undoStack[canvas.currentVectorIndex][0].hidden = true
        canvas.render()
        if (numPoints === 3) {
          actionQuadraticCurve(
            state.vectorProperties.px1 + canvas.xOffset,
            state.vectorProperties.py1 + canvas.yOffset,
            state.vectorProperties.px2 + canvas.xOffset,
            state.vectorProperties.py2 + canvas.yOffset,
            state.vectorProperties.px3 + canvas.xOffset,
            state.vectorProperties.py3 + canvas.yOffset,
            3,
            state.undoStack[canvas.currentVectorIndex][0].color,
            canvas.onScreenCTX,
            state.undoStack[canvas.currentVectorIndex][0].mode,
            state.undoStack[canvas.currentVectorIndex][0].brush,
            state.undoStack[canvas.currentVectorIndex][0].weight
          )
        } else {
          actionCubicCurve(
            state.vectorProperties.px1 + canvas.xOffset,
            state.vectorProperties.py1 + canvas.yOffset,
            state.vectorProperties.px2 + canvas.xOffset,
            state.vectorProperties.py2 + canvas.yOffset,
            state.vectorProperties.px3 + canvas.xOffset,
            state.vectorProperties.py3 + canvas.yOffset,
            state.vectorProperties.px4 + canvas.xOffset,
            state.vectorProperties.py4 + canvas.yOffset,
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
        state.vectorProperties[vectorGuiState.selectedPoint.xKey] =
          state.cursorX
        state.vectorProperties[vectorGuiState.selectedPoint.yKey] =
          state.cursorY
        canvas.draw()
        if (numPoints === 3) {
          actionQuadraticCurve(
            state.vectorProperties.px1 + canvas.xOffset,
            state.vectorProperties.py1 + canvas.yOffset,
            state.vectorProperties.px2 + canvas.xOffset,
            state.vectorProperties.py2 + canvas.yOffset,
            state.vectorProperties.px3 + canvas.xOffset,
            state.vectorProperties.py3 + canvas.yOffset,
            3,
            state.undoStack[canvas.currentVectorIndex][0].color,
            canvas.onScreenCTX,
            state.undoStack[canvas.currentVectorIndex][0].mode,
            state.undoStack[canvas.currentVectorIndex][0].brush,
            state.undoStack[canvas.currentVectorIndex][0].weight
          )
        } else {
          actionCubicCurve(
            state.vectorProperties.px1 + canvas.xOffset,
            state.vectorProperties.py1 + canvas.yOffset,
            state.vectorProperties.px2 + canvas.xOffset,
            state.vectorProperties.py2 + canvas.yOffset,
            state.vectorProperties.px3 + canvas.xOffset,
            state.vectorProperties.py3 + canvas.yOffset,
            state.vectorProperties.px4 + canvas.xOffset,
            state.vectorProperties.py4 + canvas.yOffset,
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
        state.vectorProperties[vectorGuiState.selectedPoint.xKey] =
          state.cursorX
        state.vectorProperties[vectorGuiState.selectedPoint.yKey] =
          state.cursorY
        state.undoStack[canvas.currentVectorIndex][0].properties[
          vectorGuiState.selectedPoint.xKey
        ] = state.cursorX
        state.undoStack[canvas.currentVectorIndex][0].properties[
          vectorGuiState.selectedPoint.yKey
        ] = state.cursorY
        state.undoStack[canvas.currentVectorIndex][0].hidden = false
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
            state.vectorProperties.px1 = state.cursorX
            state.vectorProperties.py1 = state.cursorY
            //reset control points
            state.vectorProperties.px2 = null
            state.vectorProperties.py2 = null
            state.vectorProperties.px3 = null
            state.vectorProperties.py3 = null
            state.vectorProperties.px4 = null
            state.vectorProperties.py4 = null
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
          vectorGuiState,
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
        actionEllipse(
          state.vectorProperties.px1 + canvas.xOffset,
          state.vectorProperties.py1 + canvas.yOffset,
          state.vectorProperties.px2 + canvas.xOffset,
          state.vectorProperties.py2 + canvas.yOffset,
          state.vectorProperties.px3 + canvas.xOffset,
          state.vectorProperties.py3 + canvas.yOffset,
          state.vectorProperties.radA,
          state.vectorProperties.radB,
          state.vectorProperties.forceCircle, //force circle initially
          swatches.primary.color,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          canvas.offScreenCVS.width / canvas.offScreenCVS.width,
          state.vectorProperties.angle,
          state.vectorProperties.offset,
          state.vectorProperties.x1Offset,
          state.vectorProperties.y1Offset
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
            vectorGuiState,
            state,
            canvas,
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2
          )
          //onscreen preview
          actionEllipse(
            state.vectorProperties.px1 + canvas.xOffset,
            state.vectorProperties.py1 + canvas.yOffset,
            state.vectorProperties.px2 + canvas.xOffset,
            state.vectorProperties.py2 + canvas.yOffset,
            state.vectorProperties.px3 + canvas.xOffset,
            state.vectorProperties.py3 + canvas.yOffset,
            state.vectorProperties.radA,
            state.vectorProperties.radB,
            state.vectorProperties.forceCircle, //force circle initially
            swatches.primary.color,
            canvas.onScreenCTX,
            state.mode,
            state.brushStamp,
            state.tool.brushSize,
            canvas.offScreenCVS.width / canvas.offScreenCVS.width,
            state.vectorProperties.angle,
            state.vectorProperties.offset,
            state.vectorProperties.x1Offset,
            state.vectorProperties.y1Offset
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
          updateEllipseOffsets(
            vectorGuiState,
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
            1,
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
          //reset vector state
          canvas.draw()
          renderRasterGUI(state, canvas, swatches)
          renderVectorGUI(state, canvas)
        }
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
 * BUG: On tablets, pointer is forced into dragging P2 no matter where a user clicks
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
        state.undoStack[canvas.currentVectorIndex][0].hidden = true
        canvas.render()
        //angle and offset passed should consider which point is being adjusted. For p1, use current state.offset instead of recalculating. For p3, add 1.5 * Math.PI to angle
        actionEllipse(
          state.vectorProperties.px1 + canvas.xOffset,
          state.vectorProperties.py1 + canvas.yOffset,
          state.vectorProperties.px2 + canvas.xOffset,
          state.vectorProperties.py2 + canvas.yOffset,
          state.vectorProperties.px3 + canvas.xOffset,
          state.vectorProperties.py3 + canvas.yOffset,
          state.vectorProperties.radA,
          state.vectorProperties.radB,
          vectorGuiState.selectedPoint.xKey === "px1"
            ? state.undoStack[canvas.currentVectorIndex][0].properties
                .forceCircle
            : state.vectorProperties.forceCircle,
          state.undoStack[canvas.currentVectorIndex][0].color,
          canvas.onScreenCTX,
          state.undoStack[canvas.currentVectorIndex][0].mode,
          state.undoStack[canvas.currentVectorIndex][0].brush,
          state.undoStack[canvas.currentVectorIndex][0].weight,
          1,
          state.vectorProperties.angle,
          state.vectorProperties.offset,
          state.vectorProperties.x1Offset,
          state.vectorProperties.y1Offset
        )
      }
      break
    case "pointermove":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        updateEllipseControlPoints(state, canvas, vectorGuiState)
        canvas.draw()
        actionEllipse(
          state.vectorProperties.px1 + canvas.xOffset,
          state.vectorProperties.py1 + canvas.yOffset,
          state.vectorProperties.px2 + canvas.xOffset,
          state.vectorProperties.py2 + canvas.yOffset,
          state.vectorProperties.px3 + canvas.xOffset,
          state.vectorProperties.py3 + canvas.yOffset,
          state.vectorProperties.radA,
          state.vectorProperties.radB,
          vectorGuiState.selectedPoint.xKey === "px1"
            ? state.undoStack[canvas.currentVectorIndex][0].properties
                .forceCircle
            : state.vectorProperties.forceCircle,
          state.undoStack[canvas.currentVectorIndex][0].color,
          canvas.onScreenCTX,
          state.undoStack[canvas.currentVectorIndex][0].mode,
          state.undoStack[canvas.currentVectorIndex][0].brush,
          state.undoStack[canvas.currentVectorIndex][0].weight,
          1,
          state.vectorProperties.angle,
          state.vectorProperties.offset,
          state.vectorProperties.x1Offset,
          state.vectorProperties.y1Offset
        )
      }
      break
    case "pointerup":
      if (vectorGuiState.selectedPoint.xKey && state.clickCounter === 0) {
        updateEllipseControlPoints(state, canvas, vectorGuiState)
        state.undoStack[canvas.currentVectorIndex][0].hidden = false
        let oldProperties = {
          ...state.undoStack[canvas.currentVectorIndex][0].properties,
        } //shallow copy, properties must not contain any objects or references as values
        let modifiedProperties = {
          ...state.undoStack[canvas.currentVectorIndex][0].properties,
        } //shallow copy, must make deep copy, at least for x, y and properties
        modifiedProperties = { ...state.vectorProperties }
        modifiedProperties.forceCircle =
          vectorGuiState.selectedPoint.xKey === "px1"
            ? modifiedProperties.forceCircle
            : state.vectorProperties.forceCircle
        state.addToTimeline({
          tool: tools.modify,
          layer: canvas.currentLayer,
          properties: {
            //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
            moddedActionIndex: canvas.currentVectorIndex,
            from: oldProperties,
            to: modifiedProperties,
          },
        })
        state.undoStack[canvas.currentVectorIndex][0].properties = {
          ...modifiedProperties,
        }
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
  //Modify history Tool
  modify: {
    name: "modify",
    fn: null,
    brushSize: null,
    disabled: false,
    options: [],
    type: "modify",
  },
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
  //Non-cursor tools
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
