import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionLine } from "../Actions/pointerActions.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import {
  createActiveIndexesForRender,
  updateLinkedVectors,
  updateLockedCurrentVectorControlHandle,
  vectorGui,
} from "../GUI/vector.js"
import { updateVectorProperties } from "../utils/vectorHelpers.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import {
  adjustVectorSteps,
  moveVectorRotationPointSteps,
  transformVectorSteps,
} from "./transform.js"

//===================================//
//=== * * * Line Controller * * * ===//
//===================================//

/**
 * Supported modes: "draw, erase, inject",
 * TODO: (Medium Priority) add vector line tool. A raster line tool would still be present for ease of use.
 */
function lineSteps() {
  if (
    state.collidedVectorIndex &&
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
      //Handle snapping p1 or p2 to other control points. Only snap when there are no linked vectors to selected vector.
      if (
        state.tool.options.align?.active ||
        state.tool.options.equal?.active ||
        state.tool.options.link?.active
      ) {
        //snap selected point to collidedVector's control point
        if (state.collidedVectorIndex !== null) {
          let collidedVector = state.vectors[state.collidedVectorIndex]
          let snappedToX =
            collidedVector.vectorProperties[vectorGui.otherCollidedKeys.xKey] +
            collidedVector.layer.x
          let snappedToY =
            collidedVector.vectorProperties[vectorGui.otherCollidedKeys.yKey] +
            collidedVector.layer.y
          state.vectorProperties.px2 = snappedToX
          state.vectorProperties.py2 = snappedToY
        }
      }
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

export const line = {
  name: "line",
  fn: lineSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: false,
  options: {
    //Priority hierarchy of options: Equal = Align > Hold > Link
    // equal: {
    //   active: false,
    //   tooltip:
    //     "Toggle Equal Length (=). \n\nEnsures magnitude continuity of control handles for linked vectors.",
    // }, // Magnitude continuity
    // align: {
    //   active: false,
    //   tooltip:
    //     "Toggle Align (A). \n\nEnsures tangential continuity by moving the control handle to the opposite angle for linked vectors.",
    // }, // Tangential continuity
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
      tooltip: "Toggle Paths. \n\nShow paths for lines.",
    },
  },
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
