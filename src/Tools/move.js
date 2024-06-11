import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { renderCanvas } from "../Canvas/render.js"
import { vectorGui } from "../GUI/vector.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { transformRasterContent } from "../utils/transformHelpers.js"
import { addTransformToTimeline } from "../Actions/nonPointerActions.js"
import { transformBoundaries } from "./transform.js"

/**
 * Move the contents of a layer relative to other layers
 */
function moveSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  // move raster layer or reference layer
  console.log("moveSteps", canvas.pointerEvent)
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //TODO: (Low Priority) Make distinction for user that for general move, it's moving the layer, but for a selection, it's moving the selection area with the contents (only works for active paste)
      state.grabStartX = canvas.currentLayer.x
      state.grabStartY = canvas.currentLayer.y
      state.startScale = canvas.currentLayer.scale
      vectorGui.render()
      if (vectorGui.selectedCollisionPresent) {
        transformSteps()
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        transformSteps()
      } else {
        //Move layer
        canvas.currentLayer.x += state.cursorX - state.previousX
        canvas.currentLayer.y += state.cursorY - state.previousY
        //Move selection area
        if (state.selectProperties.px2 !== null) {
          state.selectProperties.px1 += state.cursorX - state.previousX
          state.selectProperties.px2 += state.cursorX - state.previousX
          state.selectProperties.py1 += state.cursorY - state.previousY
          state.selectProperties.py2 += state.cursorY - state.previousY
          state.setBoundaryBox(state.selectProperties)
        }
        renderCanvas(canvas.currentLayer, true)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        transformSteps()
      } else {
        renderCanvas(canvas.currentLayer, true)
        //save start and end coordinates
        addToTimeline({
          tool: state.tool.name,
          layer: canvas.currentLayer,
          //selectProperties: { ...state.selectProperties },
          properties: {
            from: {
              x: state.grabStartX,
              y: state.grabStartY,
              scale: state.startScale,
            },
            to: {
              x: canvas.currentLayer.x,
              y: canvas.currentLayer.y,
              scale: canvas.currentLayer.scale,
            },
          },
        })
      }
      break
    default:
    //do nothing
  }
}

/**
 * Scale selection. Currently only for resizing reference images
 */
function transformSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  //move raster layer or reference layer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.selectedCollisionPresent) {
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedPoint.xKey,
          yKey: vectorGui.collidedPoint.yKey,
        }
        if (canvas.currentLayer.type === "raster") {
          state.previousBoundaryBox = { ...state.boundaryBox }
        }
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        if (canvas.currentLayer.type === "reference") {
          scaleReference()
        } else if (
          canvas.currentLayer.type === "raster" &&
          canvas.currentLayer.isPreview
        ) {
          transformBoundaries()
          let isMirroredHorizontally = state.isMirroredHorizontally
          let isMirroredVertically = state.isMirroredVertically
          if (vectorGui.selectedPoint.xKey !== "px9") {
            //Don't check for mirroring when moving whole selection
            if (
              state.boundaryBox.xMax === state.previousBoundaryBox.xMin ||
              state.boundaryBox.xMin === state.previousBoundaryBox.xMax
            ) {
              isMirroredHorizontally = !state.isMirroredHorizontally
            }
            if (
              state.boundaryBox.yMax === state.previousBoundaryBox.yMin ||
              state.boundaryBox.yMin === state.previousBoundaryBox.yMax
            ) {
              isMirroredVertically = !state.isMirroredVertically
            }
          }
          transformRasterContent(
            canvas.currentLayer,
            state.pastedImages[state.currentPastedImageKey].imageData,
            state.boundaryBox,
            state.transformationRotationDegrees % 360,
            isMirroredHorizontally,
            isMirroredVertically
          )
        }
        renderCanvas(canvas.currentLayer)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        if (canvas.currentLayer.type === "reference") {
          addToTimeline({
            tool: state.tool.name,
            layer: canvas.currentLayer,
            //selectProperties: { ...state.selectProperties },
            properties: {
              from: {
                x: state.grabStartX,
                y: state.grabStartY,
                scale: state.startScale,
              },
              to: {
                x: canvas.currentLayer.x,
                y: canvas.currentLayer.y,
                scale: canvas.currentLayer.scale,
              },
            },
          })
        } else if (
          canvas.currentLayer.type === "raster" &&
          canvas.currentLayer.isPreview
        ) {
          if (
            state.boundaryBox.xMax === state.previousBoundaryBox.xMin ||
            state.boundaryBox.xMin === state.previousBoundaryBox.xMax
          ) {
            state.isMirroredHorizontally = !state.isMirroredHorizontally
          }
          if (
            state.boundaryBox.yMax === state.previousBoundaryBox.yMin ||
            state.boundaryBox.yMin === state.previousBoundaryBox.yMax
          ) {
            state.isMirroredVertically = !state.isMirroredVertically
          }
          state.normalizeSelectProperties()
          state.setBoundaryBox(state.selectProperties)
          addTransformToTimeline()
        }
        renderCanvas(canvas.currentLayer) //TODO: (Low Priority) QA to figure out need to redraw timeline?
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

/**
 *
 */
function scaleReference() {
  switch (vectorGui.selectedPoint.xKey) {
    case "px1": {
      //top left corner
      let newWidth =
        state.grabStartX +
        canvas.currentLayer.img.width * state.startScale -
        state.cursorX
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      //round change in height to snap to grid, but more useful and smooth if not snapped to grid
      let changeInHeight =
        canvas.currentLayer.img.height * state.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = state.cursorX
      canvas.currentLayer.y = state.grabStartY + changeInHeight
      break
    }
    case "px2": {
      //top middle, expand or contract width
      let newHeight =
        state.grabStartY +
        canvas.currentLayer.img.height * state.startScale -
        state.cursorY
      let scaleFactor = newHeight / canvas.currentLayer.img.height
      let changeInWidth =
        canvas.currentLayer.img.width * state.startScale -
        canvas.currentLayer.img.width * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = state.grabStartX + changeInWidth / 2
      canvas.currentLayer.y = state.cursorY
      break
    }
    case "px3": {
      //top right corner
      let newWidth = state.cursorX - state.grabStartX
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      let changeInHeight =
        canvas.currentLayer.img.height * state.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.y = state.grabStartY + changeInHeight
      break
    }
    case "px4": {
      //middle right, expand or contract height
      let newWidth = state.cursorX - state.grabStartX
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      let changeInHeight =
        canvas.currentLayer.img.height * state.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.y = state.grabStartY + changeInHeight / 2
      break
    }
    case "px5": {
      //lower right corner
      let newWidth = state.cursorX - state.grabStartX
      let newHeight = state.cursorY - state.grabStartY
      canvas.currentLayer.scale =
        canvas.offScreenCVS.width / canvas.currentLayer.img.width >
        canvas.offScreenCVS.height / canvas.currentLayer.img.height
          ? newHeight / canvas.currentLayer.img.height
          : newWidth / canvas.currentLayer.img.width
      break
    }
    case "px6": {
      //lower middle, expand or contract width
      let newHeight = state.cursorY - state.grabStartY
      let scaleFactor = newHeight / canvas.currentLayer.img.height
      let changeInWidth =
        canvas.currentLayer.img.width * state.startScale -
        canvas.currentLayer.img.width * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = state.grabStartX + changeInWidth / 2
      break
    }
    case "px7": {
      //bottom left corner
      let newWidth =
        state.grabStartX +
        canvas.currentLayer.img.width * state.startScale -
        state.cursorX
      let newHeight = state.cursorY - state.grabStartY

      canvas.currentLayer.scale =
        canvas.offScreenCVS.width / canvas.currentLayer.img.width >
        canvas.offScreenCVS.height / canvas.currentLayer.img.height
          ? newHeight / canvas.currentLayer.img.height
          : newWidth / canvas.currentLayer.img.width

      canvas.currentLayer.x = state.cursorX
      break
    }
    case "px8": {
      //middle left, expand or contract height
      let newWidth =
        state.grabStartX +
        canvas.currentLayer.img.width * state.startScale -
        state.cursorX
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      let changeInHeight =
        canvas.currentLayer.img.height * state.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = state.cursorX
      canvas.currentLayer.y = state.grabStartY + changeInHeight / 2
      break
    }
    case "px9": {
      //Move layer
      canvas.currentLayer.x += state.cursorX - state.previousX
      canvas.currentLayer.y += state.cursorY - state.previousY
      break
    }
    default:
    //do nothing
  }
}

export const move = {
  name: "move",
  fn: moveSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: true,
  options: {},
  modes: {},
  type: "utility",
  cursor: "move",
  activeCursor: "move",
}
