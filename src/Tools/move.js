import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { renderCanvas } from "../Canvas/render.js"
import { vectorGui } from "../GUI/vector.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import {
  stretchRasterContent,
  transformRasterContent,
} from "../utils/transformHelpers.js"
import { tools } from "./index.js"
import { addTransformToTimeline } from "../Actions/nonPointerActions.js"

/**
 * Move the contents of a layer relative to other layers
 */
function moveSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  //move raster layer or reference layer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //TODO: (High Priority) Make distinction that for general move, it's moving the layer, but for a selection, it's moving the selection area with the contents (only works for active paste or vector tools)
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
      }
      renderCanvas(canvas.currentLayer, true)
      //save start and end coordinates
      addToTimeline({
        tool: state.tool,
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
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
        if (canvas.currentLayer.type === "raster") {
          //set original pixels for transform //TODO: (High Priority) Instead of definining the original here, to reduce loss of data as much as possible only define it upon paste
          // state.originalImageDataForTransform =
          //   canvas.currentLayer.ctx.getImageData(
          //     state.boundaryBox.xMin,
          //     state.boundaryBox.yMin,
          //     state.boundaryBox.xMax - state.boundaryBox.xMin,
          //     state.boundaryBox.yMax - state.boundaryBox.yMin
          //   )
          state.previousBoundaryBox = { ...state.boundaryBox }
        }
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        if (canvas.currentLayer.type === "reference") {
          scaleReference()
        } else if (canvas.currentLayer.type === "raster") {
          //TODO: (High Priority) Add transform logic for 9 control points
          console.log(
            vectorGui.selectedPoint.xKey,
            vectorGui.selectedPoint.yKey
          )
          transformBoundaries()
          //TODO: (High Priority) Need way to track rotation across multiple transforms or it will be reset by the original data
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
            state.originalImageDataForTransform,
            state.originalBoundaryBox,
            state.boundaryBox,
            state.transformationRotationDegrees,
            isMirroredHorizontally,
            isMirroredVertically
          )
          // stretchRasterContent(
          //   canvas.currentLayer,
          //   state.originalImageDataForTransform,
          //   state.originalBoundaryBox,
          //   state.boundaryBox,
          //   isMirroredHorizontally,
          //   isMirroredVertically
          // )
        }
        renderCanvas(canvas.currentLayer)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
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
 * Transform selected area by dragging one of eight control points or move selected area by dragging inside selected area
 * TODO: (Medium Priority) Make shortcuts for maintaining ratio while dragging
 * NOTE: Template from select tool, must be modified to actually transform contents.
 * TODO: (High Priority) Create function for resize contents of selection
 */
function transformBoundaries() {
  //selectedPoint does not correspond to the selectProperties key. Based on selected point, adjust boundaryBox.
  switch (vectorGui.selectedPoint.xKey) {
    case "px1":
      state.selectProperties.px1 = state.cursorX
      state.selectProperties.py1 = state.cursorY
      break
    case "px2":
      state.selectProperties.py1 = state.cursorY
      break
    case "px3":
      state.selectProperties.px2 = state.cursorX
      state.selectProperties.py1 = state.cursorY
      break
    case "px4":
      state.selectProperties.px2 = state.cursorX
      break
    case "px5":
      state.selectProperties.px2 = state.cursorX
      state.selectProperties.py2 = state.cursorY
      break
    case "px6":
      state.selectProperties.py2 = state.cursorY
      break
    case "px7":
      state.selectProperties.px1 = state.cursorX
      state.selectProperties.py2 = state.cursorY
      break
    case "px8":
      state.selectProperties.px1 = state.cursorX
      break
    case "px9": {
      //move selected contents
      const deltaX = state.cursorX - state.previousX
      const deltaY = state.cursorY - state.previousY
      state.selectProperties.px1 += deltaX
      state.selectProperties.py1 += deltaY
      state.selectProperties.px2 += deltaX
      state.selectProperties.py2 += deltaY
      break
    }
    default:
    //do nothing
  }
  state.setBoundaryBox(state.selectProperties)
}

/**
 *
 */
function scaleReference() {
  if (vectorGui.selectedPoint.xKey === "px1") {
    //top left corner
    let newWidth =
      canvas.currentLayer.x +
      canvas.currentLayer.img.width * canvas.currentLayer.scale -
      state.cursorX
    let scaleFactor = newWidth / canvas.currentLayer.img.width
    let changeInHeight =
      canvas.currentLayer.img.height * canvas.currentLayer.scale -
      canvas.currentLayer.img.height * scaleFactor

    canvas.currentLayer.scale = scaleFactor

    canvas.currentLayer.x = state.cursorX
    canvas.currentLayer.y += changeInHeight
  } else if (vectorGui.selectedPoint.xKey === "px2") {
    //top right corner
    let newWidth = state.cursorX - canvas.currentLayer.x
    let scaleFactor = newWidth / canvas.currentLayer.img.width
    let changeInHeight =
      canvas.currentLayer.img.height * canvas.currentLayer.scale -
      canvas.currentLayer.img.height * scaleFactor

    canvas.currentLayer.scale = scaleFactor

    canvas.currentLayer.y += changeInHeight
  } else if (vectorGui.selectedPoint.xKey === "px3") {
    //bottom left corner
    let width =
      canvas.currentLayer.x +
      canvas.currentLayer.img.width * canvas.currentLayer.scale -
      state.cursorX
    let height = state.cursorY - canvas.currentLayer.y

    canvas.currentLayer.scale =
      canvas.offScreenCVS.width / canvas.currentLayer.img.width >
      canvas.offScreenCVS.height / canvas.currentLayer.img.height
        ? height / canvas.currentLayer.img.height
        : width / canvas.currentLayer.img.width

    canvas.currentLayer.x = state.cursorX
  } else if (vectorGui.selectedPoint.xKey === "px4") {
    //lower right corner, don't change canvas.currentLayer.x or canvas.currentLayer.y
    let width = state.cursorX - canvas.currentLayer.x
    let height = state.cursorY - canvas.currentLayer.y
    canvas.currentLayer.scale =
      canvas.offScreenCVS.width / canvas.currentLayer.img.width >
      canvas.offScreenCVS.height / canvas.currentLayer.img.height
        ? height / canvas.currentLayer.img.height
        : width / canvas.currentLayer.img.width
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
