import { keys } from "../Shortcuts/keys.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionEllipse } from "../Actions/pointerActions.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import { vectorGui, createActiveIndexesForRender } from "../GUI/vector.js"
import { getAngle } from "../utils/trig.js"
import { getOpposingEllipseVertex, findHalf } from "../utils/ellipse.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import { transformVectorSteps } from "./transform.js"

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
          state.vectorProperties.radA = Math.floor(
            Math.sqrt(dxa * dxa + dya * dya)
          )
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
        state.vectorProperties.radA = Math.floor(
          Math.sqrt(dxa * dxa + dya * dya)
        )
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
        state.vectorProperties.radB = Math.floor(
          Math.sqrt(dxb * dxb + dyb * dyb)
        )
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
 * Update ellipse vector properties
 * @param {object} currentVector - The current vector
 */
function updateEllipseVectorProperties(currentVector) {
  syncEllipseProperties(
    state.vectorProperties,
    vectorGui.selectedPoint.xKey,
    vectorGui.selectedPoint.yKey,
    state.cursorX,
    state.cursorY
  )
  currentVector.vectorProperties = { ...state.vectorProperties }
  //Keep properties relative to layer offset
  currentVector.vectorProperties.px1 -= currentVector.layer.x
  currentVector.vectorProperties.py1 -= currentVector.layer.y
  currentVector.vectorProperties.px2 -= currentVector.layer.x
  currentVector.vectorProperties.py2 -= currentVector.layer.y
  currentVector.vectorProperties.px3 -= currentVector.layer.x
  currentVector.vectorProperties.py3 -= currentVector.layer.y
}

/**
 * Used automatically by ellipse tool after curve is completed.
 * TODO: (Low Priority) create distinct tool for adjusting that won't create a new curve when clicking.
 * Ideally a user should be able to click on a curve and render it's vector UI that way.
 */
export function adjustEllipseSteps() {
  let currentVector = state.vectors[state.currentVectorIndex]
  if (!(vectorGui.selectedCollisionPresent && state.clickCounter === 0)) {
    return
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      vectorGui.selectedPoint = {
        xKey: vectorGui.collidedKeys.xKey,
        yKey: vectorGui.collidedKeys.yKey,
      }
      state.vectorsSavedProperties[state.currentVectorIndex] = {
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
      updateEllipseVectorProperties(currentVector)
      state.activeIndexes = createActiveIndexesForRender(
        currentVector,
        state.vectorsSavedProperties
      )
      renderCanvas(currentVector.layer, true, state.activeIndexes, true)
      // renderCanvas(currentVector.layer, true)
      break
    case "pointermove":
      updateEllipseVectorProperties(currentVector)
      renderCanvas(currentVector.layer, true, state.activeIndexes)
      // renderCanvas(currentVector.layer, true)
      break
    case "pointerup":
      updateEllipseVectorProperties(currentVector)
      renderCanvas(currentVector.layer, true, state.activeIndexes)
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

//Helper functions for ellipse tool

/**
 * Update the offsets of an ellipse
 * @param {object} vectorProperties - The properties of the vector
 * @param {boolean|null|undefined} overrideForceCircle - force circle if passed in
 * @param {number} angleOffset - angle offset
 */
function updateEllipseOffsets(
  vectorProperties,
  overrideForceCircle,
  angleOffset = 0
) {
  const forceCircle = overrideForceCircle ?? vectorProperties.forceCircle
  vectorProperties.angle = getAngle(
    vectorProperties.px2 - vectorProperties.px1,
    vectorProperties.py2 - vectorProperties.py1
  )
  if (state.tool.options.useSubpixels?.active) {
    vectorProperties.unifiedOffset = findHalf(
      canvas.subPixelX,
      canvas.subPixelY,
      vectorProperties.angle + angleOffset
    )
  } else {
    vectorProperties.unifiedOffset = 0 // TODO: (Medium Priority) need logic to manually select offset values
  }
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  while (vectorProperties.angle < 0) {
    vectorProperties.angle += 2 * Math.PI
  }
  // Determine the slice in which the angle exists
  let index =
    Math.floor(
      (vectorProperties.angle + angleOffset + Math.PI / 2 + Math.PI / 8) /
        (Math.PI / 4)
    ) % 8
  let compassDir = directions[index]
  //based on direction update x and y offsets in state
  //TODO: (Medium Priority) keep offset consistent during radius adjustment and use another gui element to control the way radius is handled, drawn as a compass, 8 options plus default center which is no offset
  //Direction shrinks opposite side. eg. radius 7 goes from diameter 15 to diameter 14
  //gui element could have 2 sliders, vertical and horizontal with 3 values each, offset -1, 0, 1 (right, none, left)
  //should only x1 and y1 offsets be available since they represent the center point being part of radius or not?
  if (forceCircle) {
    vectorProperties.x1Offset = -vectorProperties.unifiedOffset
    vectorProperties.y1Offset = -vectorProperties.unifiedOffset
  } else {
    switch (compassDir) {
      case "N":
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case "NE":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case "E":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        break
      case "SE":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case "S":
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case "SW":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      case "W":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        break
      case "NW":
        vectorProperties.x1Offset = -vectorProperties.unifiedOffset
        vectorProperties.y1Offset = -vectorProperties.unifiedOffset
        break
      default:
      //none
    }
  }
}

/**
 * Update the opposing control points of an ellipse
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} shiftedPoint - The shifted point
 * @param {string} shiftedXKey
 * @param {string} shiftedYKey
 * @param {number} newX - The new x value for the shifted point
 * @param {number} newY - The new y value for the shifted point
 */
export function syncEllipseProperties(
  vectorProperties,
  shiftedXKey,
  shiftedYKey,
  newX,
  newY
) {
  if (shiftedXKey !== "px1") {
    vectorProperties[shiftedXKey] = newX
    vectorProperties[shiftedYKey] = newY
  }
  let dxa = vectorProperties.px2 - vectorProperties.px1
  let dya = vectorProperties.py2 - vectorProperties.py1
  let dxb = vectorProperties.px3 - vectorProperties.px1
  let dyb = vectorProperties.py3 - vectorProperties.py1
  if (shiftedXKey === "px1") {
    //Moving center point, shift other control points to match
    vectorProperties[shiftedXKey] = newX
    vectorProperties[shiftedYKey] = newY
    vectorProperties.px2 = vectorProperties.px1 + dxa
    vectorProperties.py2 = vectorProperties.py1 + dya
    vectorProperties.px3 = vectorProperties.px1 + dxb
    vectorProperties.py3 = vectorProperties.py1 + dyb
  } else if (shiftedXKey === "px2") {
    //Moving px2, adjust radA and px3
    vectorProperties.radA = Math.floor(Math.sqrt(dxa * dxa + dya * dya))
    //radB remains constant while radA changes unless forceCircle is true
    if (vectorProperties.forceCircle) {
      vectorProperties.radB = vectorProperties.radA
    }
    let newVertex = getOpposingEllipseVertex(
      vectorProperties.px1,
      vectorProperties.py1,
      vectorProperties.px2,
      vectorProperties.py2,
      -Math.PI / 2,
      vectorProperties.radB
    )
    vectorProperties.px3 = newVertex.x
    vectorProperties.py3 = newVertex.y
    updateEllipseOffsets(vectorProperties, vectorProperties.forceCircle, 0)
  } else if (shiftedXKey === "px3") {
    //Moving px3, adjust radB and px2
    vectorProperties.radB = Math.floor(Math.sqrt(dxb * dxb + dyb * dyb))
    //radA remains constant while radB changes unless forceCircle is true
    if (vectorProperties.forceCircle) {
      vectorProperties.radA = vectorProperties.radB
    }
    let newVertex = getOpposingEllipseVertex(
      vectorProperties.px1,
      vectorProperties.py1,
      vectorProperties.px3,
      vectorProperties.py3,
      Math.PI / 2,
      vectorProperties.radA
    )
    vectorProperties.px2 = newVertex.x
    vectorProperties.py2 = newVertex.y
    updateEllipseOffsets(
      vectorProperties,
      vectorProperties.forceCircle,
      1.5 * Math.PI
    )
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
