import { keys } from "../Shortcuts/keys.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionEllipse } from "../Actions/pointerActions.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import { vectorGui, createActiveIndexesForRender } from "../GUI/vector.js"
import {
  updateEllipseVertex,
  updateEllipseOffsets,
  updateEllipseControlPoints,
} from "../utils/ellipse.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { enableActionsForSelection } from "../DOM/disableDomElements.js"

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
  if (vectorGui.selectedCollisionPresent && state.clickCounter === 0) {
    adjustEllipseSteps()
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
      }
      updateEllipseOffsets(state, canvas)
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
        state.selectionInversed,
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
          state.vectorProperties.radA = Math.floor(
            Math.sqrt(dxa * dxa + dya * dya)
          )
        }
        updateEllipseOffsets(state, canvas)
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
          state.selectionInversed,
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
        updateEllipseOffsets(state, canvas)
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
          state.selectionInversed,
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
        //generate new unique key for vector based on what already exists in state.vectorLookup object
        let uniqueVectorKey = 1
        while (state.vectorLookup[uniqueVectorKey]) {
          uniqueVectorKey++
        }
        state.vectorLookup[uniqueVectorKey] = state.undoStack.length
        canvas.currentVectorIndex = uniqueVectorKey
        enableActionsForSelection()
        //store control points for timeline
        addToTimeline({
          tool: state.tool,
          layer: canvas.currentLayer,
          properties: {
            // modes: { ...state.tool.modes },
            // color: { ...swatches.primary.color },
            // vectorProperties: {
            //   ...state.vectorProperties,
            //   px1: state.vectorProperties.px1 - canvas.currentLayer.x,
            //   py1: state.vectorProperties.py1 - canvas.currentLayer.y,
            //   px2: state.vectorProperties.px2 - canvas.currentLayer.x,
            //   py2: state.vectorProperties.py2 - canvas.currentLayer.y,
            //   px3: state.vectorProperties.px3 - canvas.currentLayer.x,
            //   py3: state.vectorProperties.py3 - canvas.currentLayer.y,
            // },
            maskArray,
            boundaryBox,
            selectionInversed: state.selectionInversed,
            vectors: {
              [uniqueVectorKey]: {
                index: uniqueVectorKey,
                modes: { ...state.tool.modes },
                color: { ...swatches.primary.color },
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
                // selectionInversed: state.selectionInversed,
                hidden: false,
                removed: false,
              },
            },
          },
        })
        state.clickCounter = 0
        //reset vector state forceCircle
        state.vectorProperties.forceCircle = false
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
      }
      break
    default:
    //do nothing
  }
}

/**
 * Update ellipse vector properties
 * @param {object} currentAction - The current action
 * @param {object} currentVector - The current vector
 */
function updateEllipseVectorProperties(currentAction, currentVector) {
  updateEllipseControlPoints(state, canvas, vectorGui)
  currentVector.vectorProperties = { ...state.vectorProperties }
  //Keep properties relative to layer offset
  currentVector.vectorProperties.px1 -= currentAction.layer.x
  currentVector.vectorProperties.py1 -= currentAction.layer.y
  currentVector.vectorProperties.px2 -= currentAction.layer.x
  currentVector.vectorProperties.py2 -= currentAction.layer.y
  currentVector.vectorProperties.px3 -= currentAction.layer.x
  currentVector.vectorProperties.py3 -= currentAction.layer.y
}

/**
 * Used automatically by ellipse tool after curve is completed.
 * TODO: (Low Priority) create distinct tool for adjusting that won't create a new curve when clicking.
 * Ideally a user should be able to click on a curve and render it's vector UI that way.
 */
export function adjustEllipseSteps() {
  let currentAction =
    state.undoStack[state.vectorLookup[canvas.currentVectorIndex]]
  let currentVector =
    currentAction.properties.vectors[canvas.currentVectorIndex]
  if (!(vectorGui.selectedCollisionPresent && state.clickCounter === 0)) {
    return
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedKeys.xKey,
        yKey: vectorGui.collidedKeys.yKey,
      }
      state.vectorsSavedProperties[canvas.currentVectorIndex] = {
        ...currentVector.vectorProperties,
      }
      if (
        !keys.ShiftLeft &&
        !keys.ShiftRight &&
        vectorGui.selectedPoint.xKey !== "px1"
      ) {
        //if shift key is not being held, reset forceCircle
        state.vectorProperties.forceCircle = false
        currentVector.vectorProperties.forceCircle = false
      }
      if (vectorGui.selectedPoint.xKey === "px1") {
        state.vectorProperties.forceCircle =
          currentVector.vectorProperties.forceCircle
      }
      updateEllipseVectorProperties(currentAction, currentVector)
      state.activeIndexes = createActiveIndexesForRender(
        currentVector,
        state.vectorsSavedProperties
      )
      renderCanvas(currentAction.layer, true, state.activeIndexes, true)
      // renderCanvas(currentVector.layer, true)
      break
    case "pointermove":
      updateEllipseVectorProperties(currentAction, currentVector)
      renderCanvas(currentAction.layer, true, state.activeIndexes)
      // renderCanvas(currentVector.layer, true)
      break
    case "pointerup":
      updateEllipseVectorProperties(currentAction, currentVector)
      renderCanvas(currentAction.layer, true, state.activeIndexes)
      // renderCanvas(currentVector.layer, true)
      modifyVectorAction(currentVector)
      vectorGui.selectedPoint = {
        xKey: null,
        yKey: null,
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
