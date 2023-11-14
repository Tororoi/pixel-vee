import { keys } from "../Shortcuts/keys.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import {
  modifyVectorAction,
  actionQuadraticCurve,
  actionCubicCurve,
} from "../Actions/actions.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"

//=====================================//
//=== * * * Curve Controllers * * * ===//
//=====================================//

/**
 * Draw bezier curves
 * Supported modes: "draw, erase",
 */
function quadCurveSteps() {
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
            vectorGui.reset()
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
        renderCanvas(canvas.currentLayer)
        actionQuadraticCurve(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          state.vectorProperties.px2,
          state.vectorProperties.py2,
          state.vectorProperties.px3,
          state.vectorProperties.py3,
          state.clickCounter,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          brushStamps[state.tool.brushType][state.tool.brushSize],
          state.tool.brushSize,
          state.maskSet,
          true
        )
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
        renderCanvas(canvas.currentLayer)
        actionQuadraticCurve(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          state.vectorProperties.px2,
          state.vectorProperties.py2,
          state.vectorProperties.px3,
          state.vectorProperties.py3,
          state.clickCounter,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          brushStamps[state.tool.brushType][state.tool.brushSize],
          state.tool.brushSize,
          state.maskSet,
          true
        )
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
            canvas.currentLayer,
            state.tool.modes,
            brushStamps[state.tool.brushType][state.tool.brushSize],
            state.tool.brushSize,
            state.maskSet
          )
          state.clickCounter = 0
          let maskArray = coordArrayFromSet(
            state.maskSet,
            canvas.currentLayer.x,
            canvas.currentLayer.y
          )
          //store control points for timeline
          state.addToTimeline({
            tool: state.tool,
            layer: canvas.currentLayer,
            properties: {
              vectorProperties: {
                px1: state.vectorProperties.px1 - canvas.currentLayer.x,
                py1: state.vectorProperties.py1 - canvas.currentLayer.y,
                px2: state.vectorProperties.px2 - canvas.currentLayer.x,
                py2: state.vectorProperties.py2 - canvas.currentLayer.y,
                px3: state.vectorProperties.px3 - canvas.currentLayer.x,
                py3: state.vectorProperties.py3 - canvas.currentLayer.y,
              },
              maskSet: state.maskSet,
              maskArray,
            },
          })
          renderCanvas(canvas.currentLayer)
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
function cubicCurveSteps() {
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
            vectorGui.reset()
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
        renderCanvas(canvas.currentLayer)
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
          canvas.currentLayer,
          state.tool.modes,
          brushStamps[state.tool.brushType][state.tool.brushSize],
          state.tool.brushSize,
          state.maskSet,
          true
        )
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
        renderCanvas(canvas.currentLayer)
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
          canvas.currentLayer,
          state.tool.modes,
          brushStamps[state.tool.brushType][state.tool.brushSize],
          state.tool.brushSize,
          state.maskSet,
          true
        )
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
            canvas.currentLayer,
            state.tool.modes,
            brushStamps[state.tool.brushType][state.tool.brushSize],
            state.tool.brushSize,
            state.maskSet
          )
          state.clickCounter = 0
          let maskArray = coordArrayFromSet(
            state.maskSet,
            canvas.currentLayer.x,
            canvas.currentLayer.y
          )
          //store control points for timeline
          state.addToTimeline({
            tool: state.tool,
            layer: canvas.currentLayer,
            properties: {
              vectorProperties: {
                px1: state.vectorProperties.px1 - canvas.currentLayer.x,
                py1: state.vectorProperties.py1 - canvas.currentLayer.y,
                px2: state.vectorProperties.px2 - canvas.currentLayer.x,
                py2: state.vectorProperties.py2 - canvas.currentLayer.y,
                px3: state.vectorProperties.px3 - canvas.currentLayer.x,
                py3: state.vectorProperties.py3 - canvas.currentLayer.y,
                px4: state.vectorProperties.px4 - canvas.currentLayer.x,
                py4: state.vectorProperties.py4 - canvas.currentLayer.y,
              },
              maskSet: state.maskSet,
              maskArray,
            },
          })
          renderCanvas(canvas.currentLayer)
          vectorGui.render()
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
 * @param {*} numPoints
 */
function adjustCurveSteps(numPoints = 4) {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  let action = state.undoStack[canvas.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedKeys.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        action.hidden = true
        if (numPoints === 3) {
          renderCanvas(action.layer, true)
          actionQuadraticCurve(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            3,
            action.color,
            action.layer,
            action.modes,
            brushStamps[action.tool.brushType][action.tool.brushSize],
            action.tool.brushSize,
            action.maskSet,
            true
          )
        } else {
          renderCanvas(action.layer, true)
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
            action.color,
            action.layer,
            action.modes,
            brushStamps[action.tool.brushType][action.tool.brushSize],
            action.tool.brushSize,
            action.maskSet,
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
          renderCanvas(action.layer)
          actionQuadraticCurve(
            state.vectorProperties.px1,
            state.vectorProperties.py1,
            state.vectorProperties.px2,
            state.vectorProperties.py2,
            state.vectorProperties.px3,
            state.vectorProperties.py3,
            3,
            action.color,
            action.layer,
            action.modes,
            brushStamps[action.tool.brushType][action.tool.brushSize],
            action.tool.brushSize,
            action.maskSet,
            true
          )
        } else {
          renderCanvas(action.layer)
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
            action.color,
            action.layer,
            action.modes,
            brushStamps[action.tool.brushType][action.tool.brushSize],
            action.tool.brushSize,
            action.maskSet,
            true
          )
        }
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        action.hidden = false
        modifyVectorAction(canvas.currentVectorIndex)
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
        renderCanvas(action.layer, true)
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
  brushType: "circle",
  disabled: false,
  options: {},
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}

export const cubicCurve = {
  name: "cubicCurve",
  fn: cubicCurveSteps,
  action: actionCubicCurve,
  brushSize: 1,
  brushType: "circle",
  disabled: false,
  options: {},
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
