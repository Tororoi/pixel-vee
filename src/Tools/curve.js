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
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import {
  adjustVectorSteps,
  moveVectorRotationPointSteps,
  transformVectorSteps,
} from "./transform.js"

//=====================================//
//=== * * * Curve Controllers * * * ===//
//=====================================//

/**
 * Draw bezier curves
 * Supported modes: "draw, erase",
 */
function quadCurveSteps() {
  //for selecting another vector via the canvas, collisionPresent is false since it is currently based on collision with selected vector.
  if (
    state.collidedVectorIndex !== null &&
    !vectorGui.selectedCollisionPresent &&
    state.clickCounter === 0
  ) {
    let collidedVector = state.vectors[state.collidedVectorIndex]
    vectorGui.setVectorProperties(collidedVector)
    //Render new selected vector before running standard render routine
    //First render makes the new selected vector collidable with other vectors and the next render handles the collision normally.
    // renderCurrentVector() //May not be needed after changing order of render calls in renderLayerVectors
    vectorGui.render()
  }
  if (
    ((vectorGui.collidedPoint.xKey === "rotationx" &&
      vectorGui.selectedPoint.xKey === null) ||
      vectorGui.selectedPoint.xKey === "rotationx") &&
    state.clickCounter === 0
  ) {
    moveVectorRotationPointSteps()
    return
  }
  if (
    vectorGui.selectedCollisionPresent &&
    state.clickCounter === 0 &&
    state.currentVectorIndex !== null
  ) {
    adjustVectorSteps()
    return
  }
  //If there are selected vectors, call transformVectorSteps() instead of this function
  if (state.selectedVectorIndicesSet.size > 0) {
    transformVectorSteps()
    return
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //solidify end points
      state.clickCounter += 1
      if (state.clickCounter > 2) state.clickCounter = 1
      switch (state.clickCounter) {
        case 1:
          //reset control points
          vectorGui.reset()
          state.vectorProperties.type = state.tool.name
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
      switch (state.clickCounter) {
        case 1:
          state.vectorProperties.px2 = state.cursorX
          state.vectorProperties.py2 = state.cursorY
          break
        case 2:
          state.vectorProperties.px3 = state.cursorX
          state.vectorProperties.py3 = state.cursorY
          break
        default:
        //do nothing
      }
      //Solidify curve
      if (state.clickCounter === 2) {
        actionQuadraticCurve(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          state.vectorProperties.px2,
          state.vectorProperties.py2,
          state.vectorProperties.px3,
          state.vectorProperties.py3,
          state.boundaryBox,
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
            px3: state.vectorProperties.px3 - canvas.currentLayer.x,
            py3: state.vectorProperties.py3 - canvas.currentLayer.y,
          },
          // maskArray,
          // boundaryBox,
          hidden: false,
          removed: false,
        }
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
  if (
    state.collidedVectorIndex !== null &&
    !vectorGui.selectedCollisionPresent &&
    state.clickCounter === 0
  ) {
    let collidedVector = state.vectors[state.collidedVectorIndex]
    vectorGui.setVectorProperties(collidedVector)
    //Render new selected vector before running standard render routine
    //First render makes the new selected vector collidable with other vectors and the next render handles the collision normally.
    // renderCurrentVector() //May not be needed after changing order of render calls in renderLayerVectors
    vectorGui.render()
  }
  if (
    ((vectorGui.collidedPoint.xKey === "rotationx" &&
      vectorGui.selectedPoint.xKey === null) ||
      vectorGui.selectedPoint.xKey === "rotationx") &&
    state.clickCounter === 0
  ) {
    moveVectorRotationPointSteps()
    return
  }
  if (
    vectorGui.selectedCollisionPresent &&
    state.clickCounter === 0 &&
    state.currentVectorIndex !== null
  ) {
    adjustVectorSteps()
    return
  }
  //If there are selected vectors, call transformVectorSteps() instead of this function
  if (state.selectedVectorIndicesSet.size > 0) {
    transformVectorSteps()
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
          state.vectorProperties.type = state.tool.name
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
          state.vectorProperties.px4 = state.cursorX
          state.vectorProperties.py4 = state.cursorY
          break
        default:
        //do nothing
      }
      //Solidify curve
      if (state.clickCounter === 3) {
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
        //Store vector in state
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
            px3: state.vectorProperties.px3 - canvas.currentLayer.x,
            py3: state.vectorProperties.py3 - canvas.currentLayer.y,
            px4: state.vectorProperties.px4 - canvas.currentLayer.x,
            py4: state.vectorProperties.py4 - canvas.currentLayer.y,
          },
          // maskArray, //default to action's maskArray
          // boundaryBox, //default to action's boundaryBox
          hidden: false,
          removed: false,
        }
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
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
    //Priority hierarchy of options: Equal = Align > Hold > Link
    equal: {
      active: false,
      tooltip:
        "Toggle Equal Length (=). \n\nEnsures magnitude continuity of control handles for linked vectors.",
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
        "Toggle Equal Length (=). \n\nEnsures magnitude continuity of control handles for linked vectors.",
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
