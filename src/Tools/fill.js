import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { actionFill } from "../Actions/pointerActions.js"
import { modifyVectorAction } from "../Actions/modifyTimeline.js"
import { vectorGui, createActiveIndexesForRender } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { updateVectorProperties } from "../utils/vectorHelpers.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { addToTimeline } from "../Actions/undoRedo.js"

//===================================//
//=== * * * Fill Controller * * * ===//
//===================================//

/**
 * Fill an area with the specified color
 * Supported modes: "draw, erase"
 */
function fillSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      vectorGui.render()
      if (vectorGui.selectedCollisionPresent) {
        adjustFillSteps()
      } else {
        // //reset control points
        vectorGui.reset()
        state.vectorProperties.type = state.tool.name
        state.vectorProperties.px1 = state.cursorX
        state.vectorProperties.py1 = state.cursorY
        actionFill(
          state.vectorProperties.px1,
          state.vectorProperties.py1,
          state.boundaryBox,
          state.selectionInversed,
          swatches.primary.color,
          canvas.currentLayer,
          state.tool.modes,
          state.maskSet
        )
        //For undo ability, store starting coords and settings and pass them into actionFill
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
        let uniqueVectorKey = 0
        while (state.vectorLookup[uniqueVectorKey]) {
          uniqueVectorKey++
        }
        state.vectorLookup[uniqueVectorKey] = state.undoStack.length
        canvas.currentVectorIndex = uniqueVectorKey
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
            // },
            maskArray,
            boundaryBox,
            selectionInversed: state.selectionInversed,
            // hidden: false,
            // removed: false,
            vectors: {
              [uniqueVectorKey]: {
                index: uniqueVectorKey,
                modes: { ...state.tool.modes },
                color: { ...swatches.primary.color },
                vectorProperties: {
                  ...state.vectorProperties,
                  px1: state.vectorProperties.px1 - canvas.currentLayer.x,
                  py1: state.vectorProperties.py1 - canvas.currentLayer.y,
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
        renderCanvas(canvas.currentLayer)
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        adjustFillSteps()
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        adjustFillSteps()
      }
      //redraw canvas to allow onscreen cursor to render
      renderCanvas(canvas.currentLayer)
      break
    default:
    //do nothing
  }
}

/**
 * Used automatically by fill tool after fill is completed.
 * TODO: (High Priority) for linking fill vector, fill would be limited by active linked vectors as borders, position unchanged
 * How should fill vector be linked, since it won't be via positioning?
 */
export function adjustFillSteps() {
  let currentAction =
    state.undoStack[state.vectorLookup[canvas.currentVectorIndex]]
  let currentVector =
    currentAction.properties.vectors[canvas.currentVectorIndex]
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.selectedCollisionPresent) {
        state.vectorProperties[vectorGui.collidedKeys.xKey] = state.cursorX
        state.vectorProperties[vectorGui.collidedKeys.yKey] = state.cursorY
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        state.vectorsSavedProperties[canvas.currentVectorIndex] = {
          ...currentVector.vectorProperties,
        }
        updateVectorProperties(
          currentAction,
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        state.activeIndexes = createActiveIndexesForRender(
          currentVector,
          state.vectorsSavedProperties
        )
        renderCanvas(currentAction.layer, true, state.activeIndexes, true)
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        //code gets past check twice here so figure out where tool fn is being called again
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        updateVectorProperties(
          currentAction,
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        renderCanvas(currentAction.layer, true, state.activeIndexes)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        state.vectorProperties[vectorGui.selectedPoint.xKey] = state.cursorX
        state.vectorProperties[vectorGui.selectedPoint.yKey] = state.cursorY
        updateVectorProperties(
          currentAction,
          currentVector,
          state.cursorX,
          state.cursorY,
          vectorGui.selectedPoint.xKey,
          vectorGui.selectedPoint.yKey
        )
        renderCanvas(currentAction.layer, true, state.activeIndexes)
        modifyVectorAction(currentVector)
        vectorGui.selectedPoint = {
          xKey: null,
          yKey: null,
        }
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

export const fill = {
  name: "fill",
  fn: fillSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: true,
  options: { contiguous: { active: true } },
  modes: { eraser: false },
  type: "vector",
  cursor: "crosshair",
  activeCursor: "crosshair",
}
