import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import {
  actionQuadraticCurve,
  actionCubicCurve,
} from "../Actions/pointerActions.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import {
  vectorGui,
  updateLinkedVectors,
  updateLockedCurrentVectorControlHandle,
  createActiveIndexesForRender,
} from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { getAngle } from "../utils/trig.js"
import { updateVectorProperties } from "../utils/vectorHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"

//=====================================//
//=== * * * Curve Controllers * * * ===//
//=====================================//

/**
 * Draw bezier curves
 * Supported modes: "draw, erase",
 */
function quadCurveSteps() {
  if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
    adjustCurveSteps()
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
        state.boundaryBox,
        state.selectionInversed,
        state.clickCounter,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
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
        state.boundaryBox,
        state.selectionInversed,
        state.clickCounter,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
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
          state.boundaryBox,
          state.selectionInversed,
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
        //correct boundary box for layer offset
        const boundaryBox = { ...state.boundaryBox }
        if (boundaryBox.xMax !== null) {
          boundaryBox.xMin -= canvas.currentLayer.x
          boundaryBox.xMax -= canvas.currentLayer.x
          boundaryBox.yMin -= canvas.currentLayer.y
          boundaryBox.yMax -= canvas.currentLayer.y
        }
        //store control points for timeline
        addToTimeline({
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
            maskArray,
            boundaryBox,
            selectionInversed: state.selectionInversed,
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
  //for selecting another vector via the canvas, collisionPresent is false since it is currently based on collision with selected vector.
  //To select via the canvas, need to check for canvas.collidedVectorIndex and then use vectorGui.setVectorProperties(collidedVectorAction)
  if (
    canvas.collidedVectorIndex &&
    !vectorGui.selectedCollisionPresent &&
    state.clickCounter === 0
  ) {
    let collidedVector = state.undoStack[canvas.collidedVectorIndex]
    vectorGui.setVectorProperties(collidedVector)
    //Render new selected vector before running standard render routine
    //First render makes the new selected vector collidable with other vectors and the next render handles the collision normally.
    // renderCurrentVector() //May not be needed after changing order of render calls in renderLayerVectors
    vectorGui.render()
  }
  if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
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
        state.boundaryBox,
        state.selectionInversed,
        state.clickCounter,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
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
        state.boundaryBox,
        state.selectionInversed,
        state.clickCounter,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.maskSet,
        null,
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
          state.boundaryBox,
          state.selectionInversed,
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
        //correct boundary box for layer offset
        const boundaryBox = { ...state.boundaryBox }
        if (boundaryBox.xMax !== null) {
          boundaryBox.xMin -= canvas.currentLayer.x
          boundaryBox.xMax -= canvas.currentLayer.x
          boundaryBox.yMin -= canvas.currentLayer.y
          boundaryBox.yMax -= canvas.currentLayer.y
        }
        //store control points for timeline
        addToTimeline({
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
            maskArray,
            //TODO: (Medium Priority) allow toggling boundary box on/off in vector interface
            boundaryBox,
            selectionInversed: state.selectionInversed,
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
 * TODO: (Low Priority) create distinct tool for adjusting that won't create a new curve when clicking.
 * Ideally a user should be able to click on a curve and render it's vector UI that way.
 * BUG: cut selection not rendered properly in timeline
 */
function adjustCurveSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  let currentVector = state.undoStack[canvas.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
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
        if (state.tool.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            state.cursorX,
            state.cursorY
          )
        }
        if (state.tool.options.link?.active) {
          updateLinkedVectors(currentVector, true)
        }
        state.activeIndexes = createActiveIndexesForRender(
          currentVector,
          state.vectorsSavedProperties,
          state.undoStack
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
        if (state.tool.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            state.cursorX,
            state.cursorY
          )
        }
        if (state.tool.options.link?.active) {
          updateLinkedVectors(currentVector)
        }
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
        if (state.tool.options.hold?.active) {
          updateLockedCurrentVectorControlHandle(
            currentVector,
            state.cursorX,
            state.cursorY
          )
        }
        if (state.tool.options.link?.active) {
          updateLinkedVectors(currentVector)
        }
        //Handle snapping p1 or p2 to other control points. Only snap when there are no linked vectors to selected vector.
        if (
          (state.tool.options.align?.active ||
            state.tool.options.equal?.active ||
            state.tool.options.link?.active) &&
          Object.keys(state.vectorsSavedProperties).length === 1 &&
          ["px1", "px2"].includes(vectorGui.selectedPoint.xKey)
        ) {
          //snap selected point to collidedVector's control point
          if (canvas.collidedVectorIndex && canvas.currentVectorIndex) {
            let collidedVector = state.undoStack[canvas.collidedVectorIndex]
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
            if (state.tool.options.hold?.active) {
              updateLockedCurrentVectorControlHandle(
                currentVector,
                snappedToX,
                snappedToY
              )
            }
            //Handle options behavior on snapping
            if (
              (state.tool.options.align?.active ||
                state.tool.options.equal?.active) &&
              ["px1", "px2"].includes(vectorGui.selectedPoint.xKey)
            ) {
              //Set selected keys
              let selectedEndpointXKey,
                selectedEndpointYKey,
                selectedHandleXKey,
                selectedHandleYKey
              //if control point is p1, handle is line to p3, if control point is p2, handle is line to p4
              if (vectorGui.selectedPoint.xKey === "px1") {
                ;[
                  selectedEndpointXKey,
                  selectedEndpointYKey,
                  selectedHandleXKey,
                  selectedHandleYKey,
                ] = ["px1", "py1", "px3", "py3"]
              } else if (vectorGui.selectedPoint.xKey === "px2") {
                ;[
                  selectedEndpointXKey,
                  selectedEndpointYKey,
                  selectedHandleXKey,
                  selectedHandleYKey,
                ] = ["px2", "py2", "px4", "py4"]
              }
              //Set selected deltas
              const savedCurrentProperties =
                state.vectorsSavedProperties[currentVector.index]
              const currentHandleDeltaX =
                savedCurrentProperties[selectedEndpointXKey] -
                savedCurrentProperties[selectedHandleXKey]
              const currentHandleDeltaY =
                savedCurrentProperties[selectedEndpointYKey] -
                savedCurrentProperties[selectedHandleYKey]
              const selectedHandleDeltaX =
                state.vectorProperties[selectedHandleXKey] -
                state.vectorProperties[selectedEndpointXKey]
              const selectedHandleDeltaY =
                state.vectorProperties[selectedHandleYKey] -
                state.vectorProperties[selectedEndpointYKey]
              //Set collided deltas
              let collidedHandleDeltaX, collidedHandleDeltaY
              if (vectorGui.otherCollidedKeys.xKey === "px1") {
                collidedHandleDeltaX =
                  collidedVector.properties.vectorProperties.px3 -
                  collidedVector.properties.vectorProperties.px1
                collidedHandleDeltaY =
                  collidedVector.properties.vectorProperties.py3 -
                  collidedVector.properties.vectorProperties.py1
              } else if (vectorGui.otherCollidedKeys.xKey === "px2") {
                collidedHandleDeltaX =
                  collidedVector.properties.vectorProperties.px4 -
                  collidedVector.properties.vectorProperties.px2
                collidedHandleDeltaY =
                  collidedVector.properties.vectorProperties.py4 -
                  collidedVector.properties.vectorProperties.py2
              }
              let selectedHandleLength
              if (state.tool.options.equal?.active) {
                //Make selected handle length equal to collided vector' handle length
                selectedHandleLength = Math.sqrt(
                  collidedHandleDeltaX ** 2 + collidedHandleDeltaY ** 2
                )
              } else {
                //Maintain selected handle length
                selectedHandleLength = Math.sqrt(
                  currentHandleDeltaX ** 2 + currentHandleDeltaY ** 2
                )
              }
              let newSelectedAngle
              //Priority for angle is align > equal
              if (state.tool.options.align?.active) {
                //Align angle of selected control handle opposite of collided vector control handle
                newSelectedAngle =
                  getAngle(collidedHandleDeltaX, collidedHandleDeltaY) + Math.PI
              } else if (state.tool.options.equal?.active) {
                //Maintain absolute angle of selected control handle
                newSelectedAngle = getAngle(
                  selectedHandleDeltaX,
                  selectedHandleDeltaY
                )
              }
              const newSelectedHandleDeltaX = -Math.round(
                Math.cos(newSelectedAngle) * selectedHandleLength
              )
              const newSelectedHandleDeltaY = -Math.round(
                Math.sin(newSelectedAngle) * selectedHandleLength
              )
              state.vectorProperties[selectedHandleXKey] =
                state.vectorProperties[selectedEndpointXKey] -
                newSelectedHandleDeltaX
              state.vectorProperties[selectedHandleYKey] =
                state.vectorProperties[selectedEndpointYKey] -
                newSelectedHandleDeltaY
              updateVectorProperties(
                currentVector,
                state.vectorProperties[selectedHandleXKey],
                state.vectorProperties[selectedHandleYKey],
                selectedHandleXKey,
                selectedHandleYKey
              )
            }
          }
        }
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

export const quadCurve = {
  name: "quadCurve",
  fn: quadCurveSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: false,
  options: {
    displayPaths: {
      active: false,
      tooltip: "Toggle Paths. \n\nShow paths for curves.",
    },
  },
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}

export const cubicCurve = {
  name: "cubicCurve",
  fn: cubicCurveSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: false,
  options: {
    //Priority hierarchy of options: Equal = Align > Hold > Link
    equal: {
      active: false,
      tooltip:
        "Toggle Equal Length (Shift). \n\nEnsures magnitude continuity of control handles for linked vectors.",
    }, // Magnitude continuity
    align: {
      active: true,
      tooltip:
        "Toggle Align (A). \n\nEnsures tangential continuity by moving the control handle to the opposite angle for linked vectors.",
    }, // Tangential continuity
    hold: {
      active: false,
      tooltip:
        "Toggle Hold (H). \n\nMaintain relative angles of all control handles attached to selected control point.",
    },
    link: {
      active: true,
      tooltip:
        "Toggle Linking (L). \n\nConnected control points of other vectors will move with selected control point.",
    }, // Positional continuity
    // displayVectors: false,
    displayPaths: {
      active: false,
      tooltip: "Toggle Paths. \n\nShow paths for curves.",
    },
  },
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
