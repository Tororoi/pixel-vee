import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { renderCanvas } from "../Canvas/render.js"
import { translateAndWrap, translateWithoutWrap } from "../utils/moveHelpers.js"
import { vectorGui } from "../GUI/vector.js"

/**
 * Move the contents of a layer relative to other layers
 * TODO: When select tool is implemented fully, handle moving selected area
 */
function moveSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  //move raster layer or reference layer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.grabStartX = canvas.currentLayer.x
      state.grabStartY = canvas.currentLayer.y
      state.startScale = canvas.currentLayer.scale
      vectorGui.render()
      if (vectorGui.collisionPresent) {
        scaleSteps()
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        scaleSteps()
      } else {
        if (canvas.currentLayer.type === "reference") {
          //Physically move a reference layer
          canvas.currentLayer.x += state.cursorX - state.previousX
          canvas.currentLayer.y += state.cursorY - state.previousY
        } else if (canvas.currentLayer.type === "raster") {
          //move content
          // translateWithoutWrap(
          //   canvas.currentLayer.ctx,
          //   state.cursorX - state.previousX,
          //   state.cursorY - state.previousY
          // )
          canvas.currentLayer.x += state.cursorX - state.previousX
          canvas.currentLayer.y += state.cursorY - state.previousY
        }
        renderCanvas(canvas.currentLayer, true)
      }
      break
    case "pointerup":
      if (vectorGui.selectedPoint.xKey) {
        scaleSteps()
      }
      renderCanvas(canvas.currentLayer, true)
      //save start and end coordinates
      state.addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
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
function scaleSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  //move raster layer or reference layer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      if (vectorGui.collisionPresent) {
        vectorGui.selectedPoint = {
          xKey: vectorGui.collidedKeys.xKey,
          yKey: vectorGui.collidedKeys.yKey,
        }
      }
      break
    case "pointermove":
      if (vectorGui.selectedPoint.xKey) {
        if (canvas.currentLayer.type === "reference") {
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
        } else if (canvas.currentLayer.type === "raster") {
          //do nothing yet
        }
        renderCanvas(canvas.currentLayer, true)
      }
      break
    case "pointerup":
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

export const move = {
  name: "move",
  fn: moveSteps,
  action: null, //actionMove
  brushSize: 1,
  brushType: "circle",
  disabled: true,
  options: {},
  modes: {},
  type: "raster",
  cursor: "move",
  activeCursor: "move",
}
