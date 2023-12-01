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
import {
  vectorGui,
  updateLinkedVectors,
  updateLockedCurrentVectorControlHandle,
} from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { getAngle } from "../utils/trig.js"
import { updateVectorProperties } from "../utils/vectorHelpers.js"

//=====================================//
//=== * * * Curve Controllers * * * ===//
//=====================================//

/**
 * Draw bezier curves
 * Supported modes: "draw, erase",
 */
function quadCurveSteps() {
  if (vectorGui.collisionPresent && state.clickCounter === 0) {
    adjustCurveSteps(3)
    return
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //solidify end points
      state.clickCounter += 1
      if (state.clickCounter > 3) state.clickCounter = 1
      switch (state.clickCounter) {
        case 1:
          //reset control points
          vectorGui.reset()
          state.vectorProperties.px1 = state.cursorX
          state.vectorProperties.py1 = state.cursorY
          //endpoint starts at same point as startpoint
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
        case 3:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        default:
        //do nothing
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

      break
    case "pointermove":
      switch (state.clickCounter) {
        case 1:
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
        case 3:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        default:
        //do nothing
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

      break
    case "pointerup":
      if (state.touch && state.clickCounter === 2) {
        state.clickCounter += 1
      }
      switch (state.clickCounter) {
        case 1:
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
        case 3:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        default:
        //do nothing
      }
      //Solidify curve
      if (state.clickCounter === 3) {
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
  if (vectorGui.collisionPresent && state.clickCounter === 0) {
    adjustCurveSteps()
    return
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //solidify end points
      state.clickCounter += 1
      if (state.clickCounter > 4) state.clickCounter = 1
      switch (state.clickCounter) {
        case 1:
          //reset control points
          vectorGui.reset()
          state.vectorProperties.px1 = state.cursorX
          state.vectorProperties.py1 = state.cursorY
          //endpoint starts at same point as startpoint
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        case 3:
        case 4:
          state.vectorProperties.px4 = state.cursorX
          state.vectorProperties.py4 = state.cursorY
          break
        default:
        //do nothing
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
      break
    case "pointermove":
      switch (state.clickCounter) {
        case 1:
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        case 3:
        case 4:
          state.vectorProperties.px4 = state.cursorX
          state.vectorProperties.py4 = state.cursorY
          break
        default:
        //do nothing
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
      break
    case "pointerup":
      if (state.touch && state.clickCounter === 3) {
        state.clickCounter += 1
      }
      switch (state.clickCounter) {
        case 1:
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        case 3:
        case 4:
          state.vectorProperties.px4 = state.cursorX
          state.vectorProperties.py4 = state.cursorY
          break
        default:
        //do nothing
      }
      //Solidify curve
      if (state.clickCounter === 4) {
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
            // p1LinkedVectors: {},
            // p2LinkedVectors: {},
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
      break
    default:
    //do nothing
  }
}

//=======================================//
//======== * * * Adjusters * * * ========//
//=======================================//

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
  let currentVector = state.undoStack[canvas.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedKeys.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        state.vectorsSavedProperties[canvas.currentVectorIndex] = {
          ...currentVector.properties.vectorProperties,
        }
        //save linked vectors tooß
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        if (
          state.tool.options.snap ||
          state.tool.options.align ||
          state.tool.options.link
        ) {
          if (state.tool.options.link) {
            if (state.tool.options.align) {
              updateLockedCurrentVectorControlHandle(currentVector)
            }
            updateLinkedVectors(currentVector, true)
          }
          //if selected point is p3 or p4, updateVectorProperties x and y values must be calculated to maintain opposite angle
          //Instead of collided vector, use linked vector
          // if (
          //   state.tool.options.link &&
          //   ["px3", "px4"].includes(vectorGui.selectedPoint.xKey)
          // ) {
          //   //1. get angle of control handle between currentVector p1 and p3 or p2 and p4
          //   if (vectorGui.selectedPoint.xKey === "px3") {
          //     //get angle of control handle between currentVector p1 and p3
          //     let deltaX =
          //       currentVector.properties.vectorProperties.px3 -
          //       currentVector.properties.vectorProperties.px1
          //     let deltaY =
          //       currentVector.properties.vectorProperties.py3 -
          //       currentVector.properties.vectorProperties.py1
          //     let angle = getAngle(deltaX, deltaY)
          //     console.log(angle)
          //   } else if (vectorGui.selectedPoint.xKey === "px4") {
          //   }
          //   //2. get angle of control handle between linkedVector p1 and p3 or p2 and p4
          //   //3. as p3 or p4 of currentVector is adjusted, calculate angle and get difference between saved angle and changed angle
          //   //4. apply difference to linkedVector p3 or p4 or if align option is selected, apply exact opposite angle to linkedVector p3 or p4
          // }

          //TODO: logic to perform the action to link vectors will go here.
          //This means the regular tool function will be saved first and undoing the link will have the vector still moved into position.
          //Only the linking will be undone, which includes a transformation of the control point handle.
          //Undoing again will of course move the vector back as expected.
        }
        renderCanvas(currentVector.layer, true)
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        if (
          state.tool.options.link &&
          Object.keys(state.vectorsSavedProperties).length > 1
        ) {
          if (state.tool.options.align) {
            updateLockedCurrentVectorControlHandle(currentVector)
          }
          updateLinkedVectors(currentVector)
        }
        renderCanvas(currentVector.layer, true)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        if (
          state.tool.options.snap ||
          state.tool.options.align ||
          state.tool.options.link
        ) {
          if (
            state.tool.options.link &&
            Object.keys(state.vectorsSavedProperties).length > 1
          ) {
            if (state.tool.options.align) {
              updateLockedCurrentVectorControlHandle(currentVector)
            }
            updateLinkedVectors(currentVector)
          }
          if (canvas.collidedVectorIndex && canvas.currentVectorIndex) {
            let collidedVector = state.undoStack[canvas.collidedVectorIndex]
            //snap selected point to collidedVector's control point
            let snappedToX =
              collidedVector.properties.vectorProperties[
                vectorGui.otherCollidedKeys.xKey
              ] + collidedVector.layer.x
            let snappedToY =
              collidedVector.properties.vectorProperties[
                vectorGui.otherCollidedKeys.yKey
              ] + collidedVector.layer.y
            state.vectorProperties[vectorGui.selectedPoint.xKey] = snappedToX
            state.vectorProperties[vectorGui.selectedPoint.yKey] = snappedToY
            updateVectorProperties(
              currentVector,
              snappedToX,
              snappedToY,
              vectorGui.selectedPoint.xKey,
              vectorGui.selectedPoint.yKey
            )
            //if control point is p1, handle is line to p3, if control point is p2, handle is line to p4
            //align control handles
            if (
              state.tool.options.align &&
              Object.keys(state.vectorsSavedProperties).length === 1
            ) {
              let deltaX, deltaY
              if (vectorGui.otherCollidedKeys.xKey === "px1") {
                deltaX =
                  collidedVector.properties.vectorProperties.px3 -
                  collidedVector.properties.vectorProperties.px1
                deltaY =
                  collidedVector.properties.vectorProperties.py3 -
                  collidedVector.properties.vectorProperties.py1
              } else if (vectorGui.otherCollidedKeys.xKey === "px2") {
                deltaX =
                  collidedVector.properties.vectorProperties.px4 -
                  collidedVector.properties.vectorProperties.px2
                deltaY =
                  collidedVector.properties.vectorProperties.py4 -
                  collidedVector.properties.vectorProperties.py2
              }
              if (vectorGui.selectedPoint.xKey === "px1") {
                state.vectorProperties.px3 = state.vectorProperties.px1 - deltaX
                state.vectorProperties.py3 = state.vectorProperties.py1 - deltaY
                updateVectorProperties(
                  currentVector,
                  state.vectorProperties.px3,
                  state.vectorProperties.py3,
                  "px3",
                  "py3"
                )
              } else if (vectorGui.selectedPoint.xKey === "px2") {
                state.vectorProperties.px4 = state.vectorProperties.px2 - deltaX
                state.vectorProperties.py4 = state.vectorProperties.py2 - deltaY
                updateVectorProperties(
                  currentVector,
                  state.vectorProperties.px4,
                  state.vectorProperties.py4,
                  "px4",
                  "py4"
                )
              }
            }
            //Link control points
            if (state.tool.options.link) {
              // if (vectorGui.selectedPoint.xKey === "px1") {
              //   // Initialize the key with an empty object if it doesn't exist
              //   if (
              //     !currentVector.properties.p1LinkedVectors.hasOwnProperty(
              //       canvas.collidedVectorIndex
              //     )
              //   ) {
              //     currentVector.properties.p1LinkedVectors[
              //       canvas.collidedVectorIndex
              //     ] = {}
              //   }
              //   currentVector.properties.p1LinkedVectors[
              //     canvas.collidedVectorIndex
              //   ][vectorGui.otherCollidedKeys.xKey] = true
              // } else if (vectorGui.selectedPoint.xKey === "px2") {
              //   // Initialize the key with an empty object if it doesn't exist
              //   if (
              //     !currentVector.properties.p2LinkedVectors.hasOwnProperty(
              //       canvas.collidedVectorIndex
              //     )
              //   ) {
              //     currentVector.properties.p2LinkedVectors[
              //       canvas.collidedVectorIndex
              //     ] = {}
              //   }
              //   currentVector.properties.p2LinkedVectors[
              //     canvas.collidedVectorIndex
              //   ][vectorGui.otherCollidedKeys.xKey] = true
              // }
            }
          }

          //TODO: logic to perform the action to link vectors will go here.
          //This means the regular tool function will be saved first and undoing the link will have the vector still moved into position.
          //Only the linking will be undone, which includes a transformation of the control point handle.
          //Undoing again will of course move the vector back as expected.
          if (state.tool.options.align) {
            //TODO: if selected point is p3 or p4 and another vector is linked, maintain angle
          }
        }
        modifyVectorAction(canvas.currentVectorIndex)
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
        renderCanvas(currentVector.layer, true)
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
  options: { snap: false, align: false, link: false }, //snap: C0/G0 positional continuity, align: G1 tangent continuity, default C1 velocity continuity, link: move connected vector control point with selected control point.
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
