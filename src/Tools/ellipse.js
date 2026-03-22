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
  calcEllipseConicsFromVertices,
} from "../utils/ellipse.js"
import { renderCanvas } from "../Canvas/render/index.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo/undoRedo.js"
import { enableActionsForSelection } from "../DOM/disableDomElements.js"
import { rerouteVectorStepsAction, updateEllipseOffsets } from "./adjust.js"

//======================================//
//=== * * * Ellipse Controller * * * ===//
//======================================//

/**
 * Build a StrokeContext from the current tool state
 * @param {boolean} isPreview
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
