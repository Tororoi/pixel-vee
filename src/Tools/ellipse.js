import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { ditherPatterns } from "../Context/ditherPatterns.js"
import { actionEllipse } from "../Actions/pointer/ellipse.js"
import { createStrokeContext } from "../Actions/pointer/strokeContext.js"
import { vectorGui } from "../GUI/vector.js"
import {
  getOpposingEllipseVertex,
  findHalf,
  calcEllipseConicsFromVertices,
} from "../utils/ellipse.js"
import { getAngle } from "../utils/trig.js"
import { renderCanvas } from "../Canvas/render.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo/undoRedo.js"
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import { rerouteVectorStepsAction } from "./adjust.js"

//============================================//
//=== * * * Ellipse Adjust Helpers * * * ===//
//============================================//

/**
 * Update the offsets of an ellipse
 * @param {object} vectorProperties - The properties of the vector
 * @param {boolean|null|undefined} overrideForceCircle - force circle if passed in
 * @param {number} angleOffset - angle offset
 */
export function updateEllipseOffsets(
  vectorProperties,
  overrideForceCircle,
  angleOffset = 0
) {
  const forceCircle = overrideForceCircle ?? vectorProperties.forceCircle
  vectorProperties.angle = getAngle(
    vectorProperties.px2 - vectorProperties.px1,
    vectorProperties.py2 - vectorProperties.py1
  )
  if (state.tool.current.options.useSubpixels?.active) {
    vectorProperties.unifiedOffset = findHalf(
      canvas.subPixelX,
      canvas.subPixelY,
      vectorProperties.angle + angleOffset
    )
  } else {
    vectorProperties.unifiedOffset = 0
  }
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  while (vectorProperties.angle < 0) {
    vectorProperties.angle += 2 * Math.PI
  }
  let index =
    Math.floor(
      (vectorProperties.angle + angleOffset + Math.PI / 2 + Math.PI / 8) /
        (Math.PI / 4)
    ) % 8
  let compassDir = directions[index]
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
 * @param {string} shiftedXKey - The key of the shifted x value
 * @param {string} shiftedYKey - The key of the shifted y value
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
    vectorProperties[shiftedXKey] = newX
    vectorProperties[shiftedYKey] = newY
    vectorProperties.px2 = vectorProperties.px1 + dxa
    vectorProperties.py2 = vectorProperties.py1 + dya
    vectorProperties.px3 = vectorProperties.px1 + dxb
    vectorProperties.py3 = vectorProperties.py1 + dyb
  } else if (shiftedXKey === "px2") {
    vectorProperties.radA = Math.sqrt(dxa * dxa + dya * dya)
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
    vectorProperties.radB = Math.sqrt(dxb * dxb + dyb * dyb)
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
  let conicControlPoints = calcEllipseConicsFromVertices(
    vectorProperties.px1,
    vectorProperties.py1,
    vectorProperties.radA,
    vectorProperties.radB,
    vectorProperties.angle,
    vectorProperties.x1Offset,
    vectorProperties.y1Offset
  )
  vectorProperties.weight = conicControlPoints.weight
  vectorProperties.leftTangentX = conicControlPoints.leftTangentX
  vectorProperties.leftTangentY = conicControlPoints.leftTangentY
  vectorProperties.topTangentX = conicControlPoints.topTangentX
  vectorProperties.topTangentY = conicControlPoints.topTangentY
  vectorProperties.rightTangentX = conicControlPoints.rightTangentX
  vectorProperties.rightTangentY = conicControlPoints.rightTangentY
  vectorProperties.bottomTangentX = conicControlPoints.bottomTangentX
  vectorProperties.bottomTangentY = conicControlPoints.bottomTangentY
}

/**
 * Update ellipse vector properties for the current selected point and cursor position.
 * @param {object} currentVector - The current vector
 */
export function updateEllipseVectorProperties(currentVector) {
  syncEllipseProperties(
    state.vector.properties,
    vectorGui.selectedPoint.xKey,
    vectorGui.selectedPoint.yKey,
    state.cursor.x,
    state.cursor.y
  )
  currentVector.vectorProperties = {
    ...state.vector.properties,
  }
  currentVector.vectorProperties.px1 -= currentVector.layer.x
  currentVector.vectorProperties.py1 -= currentVector.layer.y
  currentVector.vectorProperties.px2 -= currentVector.layer.x
  currentVector.vectorProperties.py2 -= currentVector.layer.y
  currentVector.vectorProperties.px3 -= currentVector.layer.x
  currentVector.vectorProperties.py3 -= currentVector.layer.y
  currentVector.vectorProperties.leftTangentX -= currentVector.layer.x
  currentVector.vectorProperties.leftTangentY -= currentVector.layer.y
  currentVector.vectorProperties.topTangentX -= currentVector.layer.x
  currentVector.vectorProperties.topTangentY -= currentVector.layer.y
  currentVector.vectorProperties.rightTangentX -= currentVector.layer.x
  currentVector.vectorProperties.rightTangentY -= currentVector.layer.y
  currentVector.vectorProperties.bottomTangentX -= currentVector.layer.x
  currentVector.vectorProperties.bottomTangentY -= currentVector.layer.y
}

//======================================//
//=== * * * Ellipse Controller * * * ===//
//======================================//

/**
 * Build a StrokeContext from the current tool state
 * @param {boolean} isPreview - Whether this context is for a preview render
 * @returns {object} StrokeContext
 */
function buildEllipseCtx(isPreview = false) {
  return createStrokeContext({
    layer: canvas.currentLayer,
    isPreview,
    boundaryBox: state.selection.boundaryBox,
    currentColor: swatches.primary.color,
    currentModes: state.tool.current.modes,
    maskSet: state.selection.maskSet,
    brushStamp: brushStamps[state.tool.current.brushType][state.tool.current.brushSize],
    brushSize: state.tool.current.brushSize,
    ditherPattern: ditherPatterns[state.tool.current.ditherPatternIndex],
    twoColorMode: state.tool.current.modes?.twoColor ?? false,
    secondaryColor: swatches.secondary.color,
    ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
    ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
  })
}

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
      state.tool.clickCounter += 1
      if (state.tool.clickCounter > 2) state.tool.clickCounter = 1
      switch (state.tool.clickCounter) {
        case 1:
          //reset control points
          vectorGui.reset()
          state.vector.properties.type = state.tool.current.name
          state.vector.properties.px1 = state.cursor.x
          state.vector.properties.py1 = state.cursor.y
          state.vector.properties.forceCircle = true //force circle initially
          break
        default:
        //do nothing
      }
      if (state.tool.clickCounter === 1) {
        //initialize circle with radius 15 by default?
        state.vector.properties.px2 = state.cursor.x
        state.vector.properties.py2 = state.cursor.y
        let dxa = state.vector.properties.px2 - state.vector.properties.px1
        let dya = state.vector.properties.py2 - state.vector.properties.py1
        state.vector.properties.radA = Math.sqrt(dxa * dxa + dya * dya)
      }
      updateEllipseOffsets(state.vector.properties)
      //onscreen preview
      renderCanvas(canvas.currentLayer)
      state.vector.properties = {
        ...state.vector.properties,
        ...calcEllipseConicsFromVertices(
          state.vector.properties.px1,
          state.vector.properties.py1,
          state.vector.properties.radA,
          state.vector.properties.radA,
          state.vector.properties.angle,
          state.vector.properties.x1Offset,
          state.vector.properties.y1Offset
        ),
      }
      actionEllipse(
        state.vector.properties.weight,
        state.vector.properties.leftTangentX,
        state.vector.properties.leftTangentY,
        state.vector.properties.topTangentX,
        state.vector.properties.topTangentY,
        state.vector.properties.rightTangentX,
        state.vector.properties.rightTangentY,
        state.vector.properties.bottomTangentX,
        state.vector.properties.bottomTangentY,
        buildEllipseCtx(true),
      )
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //normalize pointermove to pixelgrid
      if (
        state.cursor.x + canvas.subPixelX !==
          state.cursor.prevX + canvas.previousSubPixelX ||
        state.cursor.y + canvas.subPixelY !==
          state.cursor.prevY + canvas.previousSubPixelY
      ) {
        if (state.tool.clickCounter === 1) {
          state.vector.properties.px2 = state.cursor.x
          state.vector.properties.py2 = state.cursor.y
          let dxa = state.vector.properties.px2 - state.vector.properties.px1
          let dya = state.vector.properties.py2 - state.vector.properties.py1
          state.vector.properties.radA = Math.sqrt(dxa * dxa + dya * dya)
        }
        updateEllipseOffsets(state.vector.properties)
        //onscreen preview
        renderCanvas(canvas.currentLayer)
        state.vector.properties = {
          ...state.vector.properties,
          ...calcEllipseConicsFromVertices(
            state.vector.properties.px1,
            state.vector.properties.py1,
            state.vector.properties.radA,
            state.vector.properties.radA,
            state.vector.properties.angle,
            state.vector.properties.x1Offset,
            state.vector.properties.y1Offset
          ),
        }
        actionEllipse(
          state.vector.properties.weight,
          state.vector.properties.leftTangentX,
          state.vector.properties.leftTangentY,
          state.vector.properties.topTangentX,
          state.vector.properties.topTangentY,
          state.vector.properties.rightTangentX,
          state.vector.properties.rightTangentY,
          state.vector.properties.bottomTangentX,
          state.vector.properties.bottomTangentY,
          buildEllipseCtx(true),
        )
      }
      break
    case "pointerup":
      if (state.tool.clickCounter === 1) {
        let dxa = state.vector.properties.px2 - state.vector.properties.px1
        let dya = state.vector.properties.py2 - state.vector.properties.py1
        state.vector.properties.radA = Math.sqrt(dxa * dxa + dya * dya)

        //set px3 at right angle on the circle
        let newVertex = getOpposingEllipseVertex(
          state.vector.properties.px1,
          state.vector.properties.py1,
          state.vector.properties.px2,
          state.vector.properties.py2,
          -Math.PI / 2,
          state.vector.properties.radA
        )
        state.vector.properties.px3 = newVertex.x
        state.vector.properties.py3 = newVertex.y
        //set rb
        let dxb = state.vector.properties.px3 - state.vector.properties.px1
        let dyb = state.vector.properties.py3 - state.vector.properties.py1
        state.vector.properties.radB = Math.sqrt(dxb * dxb + dyb * dyb)

        updateEllipseOffsets(state.vector.properties)
        state.vector.properties = {
          ...state.vector.properties,
          ...calcEllipseConicsFromVertices(
            state.vector.properties.px1,
            state.vector.properties.py1,
            state.vector.properties.radA,
            state.vector.properties.radB,
            state.vector.properties.angle,
            state.vector.properties.x1Offset,
            state.vector.properties.y1Offset
          ),
        }
        actionEllipse(
          state.vector.properties.weight,
          state.vector.properties.leftTangentX,
          state.vector.properties.leftTangentY,
          state.vector.properties.topTangentX,
          state.vector.properties.topTangentY,
          state.vector.properties.rightTangentX,
          state.vector.properties.rightTangentY,
          state.vector.properties.bottomTangentX,
          state.vector.properties.bottomTangentY,
          buildEllipseCtx(false),
        )
        let maskArray = coordArrayFromSet(
          state.selection.maskSet,
          canvas.currentLayer.x,
          canvas.currentLayer.y
        )
        //correct boundary box for layer offset
        const boundaryBox = { ...state.selection.boundaryBox }
        if (boundaryBox.xMax !== null) {
          boundaryBox.xMin -= canvas.currentLayer.x
          boundaryBox.xMax -= canvas.currentLayer.x
          boundaryBox.yMin -= canvas.currentLayer.y
          boundaryBox.yMax -= canvas.currentLayer.y
        }
        //generate new unique key for vector
        const uniqueVectorKey = state.vector.nextKey()
        state.vector.setCurrentIndex(uniqueVectorKey)
        enableActionsForSelection()
        //store control points for timeline
        addToTimeline({
          tool: state.tool.current.name,
          layer: canvas.currentLayer,
          properties: {
            maskArray,
            boundaryBox,
            vectorIndices: [uniqueVectorKey],
          },
        })
        //Store vector in state
        state.vector.all[uniqueVectorKey] = {
          index: uniqueVectorKey,
          action: state.timeline.currentAction,
          layer: canvas.currentLayer,
          modes: { ...state.tool.current.modes },
          color: { ...swatches.primary.color },
          secondaryColor: { ...swatches.secondary.color },
          ditherPatternIndex: state.tool.current.ditherPatternIndex,
          ditherOffsetX: state.tool.current.ditherOffsetX ?? 0,
          ditherOffsetY: state.tool.current.ditherOffsetY ?? 0,
          recordedLayerX: canvas.currentLayer.x,
          recordedLayerY: canvas.currentLayer.y,
          brushSize: state.tool.current.brushSize,
          brushType: state.tool.current.brushType,
          vectorProperties: {
            ...state.vector.properties,
            px1: state.vector.properties.px1 - canvas.currentLayer.x,
            py1: state.vector.properties.py1 - canvas.currentLayer.y,
            px2: state.vector.properties.px2 - canvas.currentLayer.x,
            py2: state.vector.properties.py2 - canvas.currentLayer.y,
            px3: state.vector.properties.px3 - canvas.currentLayer.x,
            py3: state.vector.properties.py3 - canvas.currentLayer.y,
            weight: state.vector.properties.weight,
            leftTangentX:
              state.vector.properties.leftTangentX - canvas.currentLayer.x,
            leftTangentY:
              state.vector.properties.leftTangentY - canvas.currentLayer.y,
            topTangentX:
              state.vector.properties.topTangentX - canvas.currentLayer.x,
            topTangentY:
              state.vector.properties.topTangentY - canvas.currentLayer.y,
            rightTangentX:
              state.vector.properties.rightTangentX - canvas.currentLayer.x,
            rightTangentY:
              state.vector.properties.rightTangentY - canvas.currentLayer.y,
            bottomTangentX:
              state.vector.properties.bottomTangentX - canvas.currentLayer.x,
            bottomTangentY:
              state.vector.properties.bottomTangentY - canvas.currentLayer.y,
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
  ditherPatternIndex: 64,
  ditherOffsetX: 0,
  ditherOffsetY: 0,
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
  modes: { eraser: false, inject: false, twoColor: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
