import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionLine } from "../Actions/pointerActions.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import { createActiveIndexesForRender, vectorGui } from "../GUI/vector.js"
import { updateVectorProperties } from "../utils/vectorHelpers.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import { transformVectorSteps } from "./transform.js"

//===================================//
//=== * * * Line Controller * * * ===//
//===================================//

/**
 * Supported modes: "draw, erase, inject",
 * TODO: (Medium Priority) add vector line tool. A raster line tool would still be present for ease of use.
 */
function lineSteps() {
  if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
    adjustLineSteps()
    return
  }
  //If there are selected vectors, call transformVectorSteps() instead of this function
  if (state.selectedVectorIndicesSet.size > 0) {
    transformVectorSteps()
    return
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.clickCounter += 1
      //reset control points
      vectorGui.reset()
      state.vectorProperties.type = state.tool.name
      state.vectorProperties.px1 = state.cursorX
      state.vectorProperties.py1 = state.cursorY
      state.vectorProperties.px2 = state.cursorX
      state.vectorProperties.py2 = state.cursorY
      renderCanvas(canvas.currentLayer)
      //preview line
      actionLine(
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.vectorProperties.px2,
        state.vectorProperties.py2,
        state.boundaryBox,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
        null,
        true
      )
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      state.vectorProperties.px2 = state.cursorX
      state.vectorProperties.py2 = state.cursorY
      //only draw when necessary
      renderCanvas(canvas.currentLayer)
      //preview line
      actionLine(
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.vectorProperties.px2,
        state.vectorProperties.py2,
        state.boundaryBox,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
        null,
        true
      )
      break
    case "pointerup": {
      state.vectorProperties.px2 = state.cursorX
      state.vectorProperties.py2 = state.cursorY
      actionLine(
        state.vectorProperties.px1,
        state.vectorProperties.py1,
        state.vectorProperties.px2,
        state.vectorProperties.py2,
        state.boundaryBox,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
        null
      )
      state.clickCounter = 0
      let maskArray = coordArrayFromSet(
        state.maskSet,
        canvas.currentLayer.x,
        canvas.currentLayer.y
      )
      //correct boundary box for layer offset
      const boundaryBox = { ...state.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin -= canvas.currentLayer.x
        boundaryBox.xMax -= canvas.currentLayer.x
        boundaryBox.yMin -= canvas.currentLayer.y
        boundaryBox.yMax -= canvas.currentLayer.y
      }
      //generate new unique key for vector
      state.highestVectorKey += 1
      let uniqueVectorKey = state.highestVectorKey
      state.currentVectorIndex = uniqueVectorKey
      enableActionsForSelection()
      //store control points for timeline
      addToTimeline({
        tool: state.tool.name,
        layer: canvas.currentLayer,
        properties: {
          maskArray,
          boundaryBox,
          vectorIndices: [uniqueVectorKey],
        },
      })
      //Add the vector to the state
      state.vectors[uniqueVectorKey] = {
        index: uniqueVectorKey,
        action: state.action,
        layer: canvas.currentLayer,
        modes: { ...state.tool.modes },
        color: { ...swatches.primary.color },
        brushSize: state.tool.brushSize,
        brushType: state.tool.brushType,
        vectorProperties: {
          ...state.vectorProperties,
          px1: state.vectorProperties.px1 - canvas.currentLayer.x,
          py1: state.vectorProperties.py1 - canvas.currentLayer.y,
          px2: state.vectorProperties.px2 - canvas.currentLayer.x,
          py2: state.vectorProperties.py2 - canvas.currentLayer.y,
        },
        // maskArray,
        // boundaryBox,
        hidden: false,
        removed: false,
      }
      renderCanvas(canvas.currentLayer)
      break
    }
    default:
    //do nothing
  }
}

/**
 *
 */
function adjustLineSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  let currentVector = state.vectors[state.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
        state.vectorProperties[vectorGui.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedKeys.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        state.vectorsSavedProperties[state.currentVectorIndex] = {
          ...currentVector.vectorProperties,
        }
        //save linked vectors too
        updateVectorProperties(
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        // if (state.tool.options.hold?.active) {
        //   updateLockedCurrentVectorControlHandle(
        //     currentVector,
        //     state.cursorX,
        //     state.cursorY
        //   )
        // }
        // if (state.tool.options.link?.active) {
        //   updateLinkedVectors(currentVector, true)
        // }
        state.activeIndexes = createActiveIndexesForRender(
          currentVector,
          state.vectorsSavedProperties
        )
        renderCanvas(currentVector.layer, true, state.activeIndexes, true)
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
        // if (state.tool.options.hold?.active) {
        //   updateLockedCurrentVectorControlHandle(
        //     currentVector,
        //     state.cursorX,
        //     state.cursorY
        //   )
        // }
        // if (state.tool.options.link?.active) {
        //   updateLinkedVectors(currentVector)
        // }
        renderCanvas(currentVector.layer, true, state.activeIndexes)
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
        // if (state.tool.options.hold?.active) {
        //   updateLockedCurrentVectorControlHandle(
        //     currentVector,
        //     state.cursorX,
        //     state.cursorY
        //   )
        // }
        // if (state.tool.options.link?.active) {
        //   updateLinkedVectors(currentVector)
        // }
        //Handle snapping p1 or p2 to other control points. Only snap when there are no linked vectors to selected vector.
        // if (
        //   (state.tool.options.align?.active ||
        //     state.tool.options.equal?.active ||
        //     state.tool.options.link?.active) &&
        //   Object.keys(state.vectorsSavedProperties).length === 1 &&
        //   ["px1", "px2"].includes(vectorGui.selectedPoint.xKey)
        // ) {
        //   //snap selected point to collidedVector's control point
        //   if (state.collidedVectorIndex && state.currentVectorIndex) {
        //     let collidedVector = state.vectors[state.collidedVectorIndex]
        //     let snappedToX =
        //       collidedVector.vectorProperties[
        //         vectorGui.otherCollidedKeys.xKey
        //       ] + collidedVector.layer.x
        //     let snappedToY =
        //       collidedVector.vectorProperties[
        //         vectorGui.otherCollidedKeys.yKey
        //       ] + collidedVector.layer.y
        //     state.vectorProperties[vectorGui.selectedPoint.xKey] = snappedToX
        //     state.vectorProperties[vectorGui.selectedPoint.yKey] = snappedToY
        //     updateVectorProperties(
        //       currentVector,
        //       snappedToX,
        //       snappedToY,
        //       vectorGui.selectedPoint.xKey,
        //       vectorGui.selectedPoint.yKey
        //     )
        //     if (state.tool.options.hold?.active) {
        //       updateLockedCurrentVectorControlHandle(
        //         currentVector,
        //         snappedToX,
        //         snappedToY
        //       )
        //     }
        //     //Handle options behavior on snapping
        //     if (
        //       (state.tool.options.align?.active ||
        //         state.tool.options.equal?.active) &&
        //       ["px1", "px2"].includes(vectorGui.selectedPoint.xKey)
        //     ) {
        //       //Set selected keys
        //       let selectedEndpointXKey,
        //         selectedEndpointYKey,
        //         selectedHandleXKey,
        //         selectedHandleYKey
        //       //if control point is p1, handle is line to p3, if control point is p2, handle is line to p4
        //       if (vectorGui.selectedPoint.xKey === "px1") {
        //         ;[
        //           selectedEndpointXKey,
        //           selectedEndpointYKey,
        //           selectedHandleXKey,
        //           selectedHandleYKey,
        //         ] = ["px1", "py1", "px3", "py3"]
        //       } else if (vectorGui.selectedPoint.xKey === "px2") {
        //         ;[
        //           selectedEndpointXKey,
        //           selectedEndpointYKey,
        //           selectedHandleXKey,
        //           selectedHandleYKey,
        //         ] = ["px2", "py2", "px4", "py4"]
        //       }
        //       //Set selected deltas
        //       const savedCurrentProperties =
        //         state.vectorsSavedProperties[currentVector.index]
        //       const currentHandleDeltaX =
        //         savedCurrentProperties[selectedEndpointXKey] -
        //         savedCurrentProperties[selectedHandleXKey]
        //       const currentHandleDeltaY =
        //         savedCurrentProperties[selectedEndpointYKey] -
        //         savedCurrentProperties[selectedHandleYKey]
        //       const selectedHandleDeltaX =
        //         state.vectorProperties[selectedHandleXKey] -
        //         state.vectorProperties[selectedEndpointXKey]
        //       const selectedHandleDeltaY =
        //         state.vectorProperties[selectedHandleYKey] -
        //         state.vectorProperties[selectedEndpointYKey]
        //       //Set collided deltas
        //       let collidedHandleDeltaX, collidedHandleDeltaY
        //       if (vectorGui.otherCollidedKeys.xKey === "px1") {
        //         collidedHandleDeltaX =
        //           collidedVector.vectorProperties.px3 -
        //           collidedVector.vectorProperties.px1
        //         collidedHandleDeltaY =
        //           collidedVector.vectorProperties.py3 -
        //           collidedVector.vectorProperties.py1
        //       } else if (vectorGui.otherCollidedKeys.xKey === "px2") {
        //         collidedHandleDeltaX =
        //           collidedVector.vectorProperties.px4 -
        //           collidedVector.vectorProperties.px2
        //         collidedHandleDeltaY =
        //           collidedVector.vectorProperties.py4 -
        //           collidedVector.vectorProperties.py2
        //       }
        //       let selectedHandleLength
        //       if (state.tool.options.equal?.active) {
        //         //Make selected handle length equal to collided vector' handle length
        //         selectedHandleLength = Math.sqrt(
        //           collidedHandleDeltaX ** 2 + collidedHandleDeltaY ** 2
        //         )
        //       } else {
        //         //Maintain selected handle length
        //         selectedHandleLength = Math.sqrt(
        //           currentHandleDeltaX ** 2 + currentHandleDeltaY ** 2
        //         )
        //       }
        //       let newSelectedAngle
        //       //Priority for angle is align > equal
        //       if (state.tool.options.align?.active) {
        //         //Align angle of selected control handle opposite of collided vector control handle
        //         newSelectedAngle =
        //           getAngle(collidedHandleDeltaX, collidedHandleDeltaY) + Math.PI
        //       } else if (state.tool.options.equal?.active) {
        //         //Maintain absolute angle of selected control handle
        //         newSelectedAngle = getAngle(
        //           selectedHandleDeltaX,
        //           selectedHandleDeltaY
        //         )
        //       }
        //       const newSelectedHandleDeltaX = -Math.round(
        //         Math.cos(newSelectedAngle) * selectedHandleLength
        //       )
        //       const newSelectedHandleDeltaY = -Math.round(
        //         Math.sin(newSelectedAngle) * selectedHandleLength
        //       )
        //       state.vectorProperties[selectedHandleXKey] =
        //         state.vectorProperties[selectedEndpointXKey] -
        //         newSelectedHandleDeltaX
        //       state.vectorProperties[selectedHandleYKey] =
        //         state.vectorProperties[selectedEndpointYKey] -
        //         newSelectedHandleDeltaY
        //       updateVectorProperties(
        //         currentVector,
        //         state.vectorProperties[selectedHandleXKey],
        //         state.vectorProperties[selectedHandleYKey],
        //         selectedHandleXKey,
        //         selectedHandleYKey
        //       )
        //     }
        //   }
        // }
        renderCanvas(currentVector.layer, true, state.activeIndexes)
        // renderCanvas(currentVector.layer, true)
        modifyVectorAction(currentVector)
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

export const line = {
  name: "line",
  fn: lineSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: false,
  options: {
    displayPaths: {
      active: false,
      tooltip: "Toggle Paths. \n\nShow paths for lines.",
    },
  },
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
