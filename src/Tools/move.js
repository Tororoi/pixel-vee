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
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //TODO: (Low Priority) Make distinction for user that for general move, it's moving the layer, but for a selection, it's moving the selection area with the contents (only works for active paste)
      state.tool.grabStartX = canvas.currentLayer.x
      state.tool.grabStartY = canvas.currentLayer.y
      state.tool.startScale = canvas.currentLayer.scale
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
        canvas.currentLayer.x += state.cursor.x - state.cursor.prevX
        canvas.currentLayer.y += state.cursor.y - state.cursor.prevY
        //Move selection area
        if (state.selection.properties.px2 !== null) {
          state.selection.properties.px1 += state.cursor.x - state.cursor.prevX
          state.selection.properties.px2 += state.cursor.x - state.cursor.prevX
          state.selection.properties.py1 += state.cursor.y - state.cursor.prevY
          state.selection.properties.py2 += state.cursor.y - state.cursor.prevY
          state.setBoundaryBox(state.selection.properties)
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
          tool: state.tool.current.name,
          layer: canvas.currentLayer,
          //selectProperties: { ...state.selection.properties },
          properties: {
            from: {
              x: state.tool.grabStartX,
              y: state.tool.grabStartY,
              scale: state.tool.startScale,
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
          state.selection.previousBoundaryBox = { ...state.selection.boundaryBox }
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
          let isMirroredHorizontally = state.transform.isMirroredHorizontally
          let isMirroredVertically = state.transform.isMirroredVertically
          if (vectorGui.selectedPoint.xKey !== "px9") {
            //Don't check for mirroring when moving whole selection
            if (
              state.selection.boundaryBox.xMax === state.selection.previousBoundaryBox.xMin ||
              state.selection.boundaryBox.xMin === state.selection.previousBoundaryBox.xMax
            ) {
              isMirroredHorizontally = !state.transform.isMirroredHorizontally
            }
            if (
              state.selection.boundaryBox.yMax === state.selection.previousBoundaryBox.yMin ||
              state.selection.boundaryBox.yMin === state.selection.previousBoundaryBox.yMax
            ) {
              isMirroredVertically = !state.transform.isMirroredVertically
            }
          }
          transformRasterContent(
            canvas.currentLayer,
            state.clipboard.pastedImages[state.clipboard.currentPastedImageKey].imageData,
            state.selection.boundaryBox,
            state.transform.rotationDegrees % 360,
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
            tool: state.tool.current.name,
            layer: canvas.currentLayer,
            //selectProperties: { ...state.selection.properties },
            properties: {
              from: {
                x: state.tool.grabStartX,
                y: state.tool.grabStartY,
                scale: state.tool.startScale,
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
            state.selection.boundaryBox.xMax === state.selection.previousBoundaryBox.xMin ||
            state.selection.boundaryBox.xMin === state.selection.previousBoundaryBox.xMax
          ) {
            state.transform.isMirroredHorizontally = !state.transform.isMirroredHorizontally
          }
          if (
            state.selection.boundaryBox.yMax === state.selection.previousBoundaryBox.yMin ||
            state.selection.boundaryBox.yMin === state.selection.previousBoundaryBox.yMax
          ) {
            state.transform.isMirroredVertically = !state.transform.isMirroredVertically
          }
          state.normalizeSelectProperties()
          state.setBoundaryBox(state.selection.properties)
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
        state.tool.grabStartX +
        canvas.currentLayer.img.width * state.tool.startScale -
        state.cursor.x
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      //round change in height to snap to grid, but more useful and smooth if not snapped to grid
      let changeInHeight =
        canvas.currentLayer.img.height * state.tool.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = state.cursor.x
      canvas.currentLayer.y = state.tool.grabStartY + changeInHeight
      break
    }
    case "px2": {
      //top middle, expand or contract width
      let newHeight =
        state.tool.grabStartY +
        canvas.currentLayer.img.height * state.tool.startScale -
        state.cursor.y
      let scaleFactor = newHeight / canvas.currentLayer.img.height
      let changeInWidth =
        canvas.currentLayer.img.width * state.tool.startScale -
        canvas.currentLayer.img.width * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = state.tool.grabStartX + changeInWidth / 2
      canvas.currentLayer.y = state.cursor.y
      break
    }
    case "px3": {
      //top right corner
      let newWidth = state.cursor.x - state.tool.grabStartX
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      let changeInHeight =
        canvas.currentLayer.img.height * state.tool.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.y = state.tool.grabStartY + changeInHeight
      break
    }
    case "px4": {
      //middle right, expand or contract height
      let newWidth = state.cursor.x - state.tool.grabStartX
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      let changeInHeight =
        canvas.currentLayer.img.height * state.tool.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.y = state.tool.grabStartY + changeInHeight / 2
      break
    }
    case "px5": {
      //lower right corner
      let newWidth = state.cursor.x - state.tool.grabStartX
      let newHeight = state.cursor.y - state.tool.grabStartY
      canvas.currentLayer.scale =
        canvas.offScreenCVS.width / canvas.currentLayer.img.width >
        canvas.offScreenCVS.height / canvas.currentLayer.img.height
          ? newHeight / canvas.currentLayer.img.height
          : newWidth / canvas.currentLayer.img.width
      break
    }
    case "px6": {
      //lower middle, expand or contract width
      let newHeight = state.cursor.y - state.tool.grabStartY
      let scaleFactor = newHeight / canvas.currentLayer.img.height
      let changeInWidth =
        canvas.currentLayer.img.width * state.tool.startScale -
        canvas.currentLayer.img.width * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = state.tool.grabStartX + changeInWidth / 2
      break
    }
    case "px7": {
      //bottom left corner
      let newWidth =
        state.tool.grabStartX +
        canvas.currentLayer.img.width * state.tool.startScale -
        state.cursor.x
      let newHeight = state.cursor.y - state.tool.grabStartY

      canvas.currentLayer.scale =
        canvas.offScreenCVS.width / canvas.currentLayer.img.width >
        canvas.offScreenCVS.height / canvas.currentLayer.img.height
          ? newHeight / canvas.currentLayer.img.height
          : newWidth / canvas.currentLayer.img.width

      canvas.currentLayer.x = state.cursor.x
      break
    }
    case "px8": {
      //middle left, expand or contract height
      let newWidth =
        state.tool.grabStartX +
        canvas.currentLayer.img.width * state.tool.startScale -
        state.cursor.x
      let scaleFactor = newWidth / canvas.currentLayer.img.width
      let changeInHeight =
        canvas.currentLayer.img.height * state.tool.startScale -
        canvas.currentLayer.img.height * scaleFactor

      canvas.currentLayer.scale = scaleFactor

      canvas.currentLayer.x = state.cursor.x
      canvas.currentLayer.y = state.tool.grabStartY + changeInHeight / 2
      break
    }
    case "px9": {
      //Move layer
      canvas.currentLayer.x += state.cursor.x - state.cursor.prevX
      canvas.currentLayer.y += state.cursor.y - state.cursor.prevY
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
