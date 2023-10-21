import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import {
  modifyVectorAction,
  actionQuadraticCurve,
  actionCubicCurve,
} from "../Actions/actions.js"
import { vectorGui } from "../GUI/vector.js"
import { renderRasterGUI } from "../GUI/raster.js"
import { renderCanvas } from "../Canvas/render.js"

//=====================================//
//=== * * * Curve Controllers * * * ===//
//=====================================//

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
              vectorProperties: {
                px1: state.vectorProperties.px1,
                py1: state.vectorProperties.py1,
                px2: state.vectorProperties.px2,
                py2: state.vectorProperties.py2,
                px3: state.vectorProperties.px3,
                py3: state.vectorProperties.py3,
              },
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
              vectorProperties: {
                px1: state.vectorProperties.px1,
                py1: state.vectorProperties.py1,
                px2: state.vectorProperties.px2,
                py2: state.vectorProperties.py2,
                px3: state.vectorProperties.px3,
                py3: state.vectorProperties.py3,
                px4: state.vectorProperties.px4,
                py4: state.vectorProperties.py4,
              },
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
        modifyVectorAction(canvas.currentVectorIndex)
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

export const quadCurve = {
  name: "quadCurve",
  fn: quadCurveSteps,
  action: actionQuadraticCurve,
  brushSize: 1,
  disabled: false,
  options: { erase: false, inject: false },
  type: "vector",
}

export const cubicCurve = {
  name: "cubicCurve",
  fn: cubicCurveSteps,
  action: actionCubicCurve,
  brushSize: 1,
  disabled: false,
  options: { erase: false, inject: false },
  type: "vector",
}
