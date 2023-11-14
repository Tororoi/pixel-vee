import { keys } from "../Shortcuts/keys.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { modifyVectorAction, actionEllipse } from "../Actions/actions.js"
import { vectorGui } from "../GUI/vector.js"
import {
  updateEllipseVertex,
  updateEllipseOffsets,
  updateEllipseControlPoints,
} from "../utils/ellipse.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"

//======================================//
//=== * * * Ellipse Controller * * * ===//
//======================================//

/**
 * Draw ellipse
 * Supported modes: "draw, erase",
 * Due to method of modifying radius on a pixel grid, only odd diameter circles are created. Eg. 15px radius creates a 31px diameter circle. To fix this, allow half pixel increments.
 */
function ellipseSteps() {
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
            vectorGui.reset()
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
        renderCanvas(canvas.currentLayer)
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
          canvas.currentLayer,
          state.tool.modes,
          brushStamps[state.tool.brushType][state.tool.brushSize],
          state.tool.brushSize,
          state.vectorProperties.angle,
          state.vectorProperties.offset,
          state.vectorProperties.x1Offset,
          state.vectorProperties.y1Offset,
          state.maskSet,
          true
        )
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
          renderCanvas(canvas.currentLayer)
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
            canvas.currentLayer,
            state.tool.modes,
            brushStamps[state.tool.brushType][state.tool.brushSize],
            state.tool.brushSize,
            state.vectorProperties.angle,
            state.vectorProperties.offset,
            state.vectorProperties.x1Offset,
            state.vectorProperties.y1Offset,
            state.maskSet,
            true
          )
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
            canvas.currentLayer,
            state.tool.modes,
            brushStamps[state.tool.brushType][state.tool.brushSize],
            state.tool.brushSize,
            state.vectorProperties.angle,
            state.vectorProperties.offset,
            state.vectorProperties.x1Offset,
            state.vectorProperties.y1Offset,
            state.maskSet
          )
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
                radA: state.vectorProperties.radA,
                radB: state.vectorProperties.radB,
                angle: state.vectorProperties.angle,
                offset: state.vectorProperties.offset,
                x1Offset: state.vectorProperties.x1Offset,
                y1Offset: state.vectorProperties.y1Offset,
                forceCircle: state.vectorProperties.forceCircle,
                //add bounding box minima maxima x and y?
              },
              maskSet: state.maskSet,
              maskArray,
            },
          })
          state.clickCounter = 0
          //reset vector state TODO: forceCircle needs to be reset
          state.vectorProperties.forceCircle = false
          renderCanvas(canvas.currentLayer)
          vectorGui.render()
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
 */
export function adjustEllipseSteps() {
  let action = state.undoStack[canvas.currentVectorIndex]
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
        action.hidden = true
        //angle and offset passed should consider which point is being adjusted. For p1, use current state.vectorProperties.offset instead of recalculating. For p3, add 1.5 * Math.PI to angle
        renderCanvas(action.layer, true, canvas.currentVectorIndex)
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
            ? action.properties.vectorProperties.forceCircle
            : state.vectorProperties.forceCircle,
          action.color,
          action.layer,
          action.modes,
          brushStamps[action.tool.brushType][action.tool.brushSize],
          action.tool.brushSize,
          state.vectorProperties.angle,
          state.vectorProperties.offset,
          state.vectorProperties.x1Offset,
          state.vectorProperties.y1Offset,
          action.maskSet,
          true
        )
        //TODO: render canvas actions after current index onto a canvas that is overlaid on top of the current layer canvas. Then remove it on pointerup
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        updateEllipseControlPoints(state, canvas, vectorGui)
        renderCanvas(action.layer, false, canvas.currentVectorIndex)
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
            ? action.properties.vectorProperties.forceCircle
            : state.vectorProperties.forceCircle,
          action.color,
          action.layer,
          action.modes,
          brushStamps[action.tool.brushType][action.tool.brushSize],
          action.tool.brushSize,
          state.vectorProperties.angle,
          state.vectorProperties.offset,
          state.vectorProperties.x1Offset,
          state.vectorProperties.y1Offset,
          action.maskSet,
          true
        )
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
        updateEllipseControlPoints(state, canvas, vectorGui)
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

export const ellipse = {
  name: "ellipse",
  fn: ellipseSteps,
  action: actionEllipse,
  brushSize: 1,
  brushType: "circle",
  disabled: false,
  options: {
    useSubPixels: true,
    radiusExcludesCenter: false,
  }, // need to expand radiusExcludesCenter to cover multiple scenarios, centerx = 0 or 1 and centery = 0 or 1
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
