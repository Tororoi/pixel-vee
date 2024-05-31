import { keys } from "../Shortcuts/keys.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionEllipse } from "../Actions/pointerActions.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import { vectorGui, createActiveIndexesForRender } from "../GUI/vector.js"
import { getAngle } from "../utils/trig.js"
import {
  getOpposingEllipseVertex,
  findHalf,
  calcEllipseConicsFromVertices,
} from "../utils/ellipse.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import {
  adjustVectorSteps,
  moveVectorRotationPointSteps,
  rerouteVectorStepsAction,
  transformVectorSteps,
  updateEllipseOffsets,
} from "./transform.js"

//======================================//
//=== * * * Ellipse Controller * * * ===//
//======================================//

/**
 * TODO: (Medium Priority) Add control points on opposite side of point 2 and 3, for a total of 5 control points
 * Draw ellipse
 * Supported modes: "draw, erase",
 * Due to method of modifying radius on a pixel grid, only odd diameter circles are created. Eg. 15px radius creates a 31px diameter circle. To fix this, allow half pixel increments.
 */
function ellipseSteps() {
  if (rerouteVectorStepsAction()) return
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
        state.vectorProperties.radA = Math.sqrt(dxa * dxa + dya * dya)
      }
      updateEllipseOffsets(state.vectorProperties)
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
        state.boundaryBox,
        swatches.primary.color,
        canvas.currentLayer,
        state.tool.modes,
        brushStamps[state.tool.brushType][state.tool.brushSize],
        state.tool.brushSize,
        state.vectorProperties.angle,
        state.vectorProperties.unifiedOffset,
        state.vectorProperties.x1Offset,
        state.vectorProperties.y1Offset,
        state.maskSet,
        null,
        true
      )
      break
    case "pointermove":
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
          state.vectorProperties.radA = Math.sqrt(dxa * dxa + dya * dya)
        }
        updateEllipseOffsets(state.vectorProperties)
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
          state.boundaryBox,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          brushStamps[state.tool.brushType][state.tool.brushSize],
          state.tool.brushSize,
          state.vectorProperties.angle,
          state.vectorProperties.unifiedOffset,
          state.vectorProperties.x1Offset,
          state.vectorProperties.y1Offset,
          state.maskSet,
          null,
          true
        )
      }
      break
    case "pointerup":
      if (state.clickCounter === 1) {
        let dxa = state.vectorProperties.px2 - state.vectorProperties.px1
        let dya = state.vectorProperties.py2 - state.vectorProperties.py1
        state.vectorProperties.radA = Math.sqrt(dxa * dxa + dya * dya)

        //set px3 at right angle on the circle
        let newVertex = getOpposingEllipseVertex(
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
        state.vectorProperties.radB = Math.sqrt(dxb * dxb + dyb * dyb)

        updateEllipseOffsets(state.vectorProperties)
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
          state.boundaryBox,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          brushStamps[state.tool.brushType][state.tool.brushSize],
          state.tool.brushSize,
          state.vectorProperties.angle,
          state.vectorProperties.unifiedOffset,
          state.vectorProperties.x1Offset,
          state.vectorProperties.y1Offset,
          state.maskSet
        )
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
        //Define conic control points
        let conicControlPoints = calcEllipseConicsFromVertices(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          state.vectorProperties.radA,
          state.vectorProperties.radB,
          state.vectorProperties.angle,
          state.vectorProperties.x1Offset,
          state.vectorProperties.y1Offset
        )
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
            ...conicControlPoints,
          },
          // maskArray,
          // boundaryBox,
          hidden: false,
          removed: false,
        }
        state.reset()
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
      }
      break
    default:
    //do nothing
  }
}

/**
 * Ellipse tool
 */
export const ellipse = {
  name: "ellipse",
  fn: ellipseSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: false,
  options: {
    useSubpixels: {
      active: true,
      tooltip:
        "Toggle use subpixels. \n\nUse subpixels to control handling of origin point for radii. Determines odd or even length bounding box for ellipse.",
    },
    // radiusExcludesCenter: false,
    displayPaths: {
      active: false,
      tooltip: "Toggle Paths. \n\nShow paths for ellipse.",
    },
    //forceCircle: {active: false} //affects timeline, may need to handle this in a way that controls vectorProperties.forceCircle instead of replacing vectorProperties.forceCircle
  }, // need to expand radiusExcludesCenter to cover multiple scenarios, centerx = 0 or 1 and centery = 0 or 1
  modes: { eraser: false, inject: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
