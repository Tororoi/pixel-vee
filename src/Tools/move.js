import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { renderCanvas } from "../Canvas/render.js"
import { translateAndWrap, translateWithoutWrap } from "../utils/moveHelpers.js"

function moveSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  //move raster layer or reference layer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.grabStartX = canvas.currentLayer.x
      state.grabStartY = canvas.currentLayer.y
      break
    case "pointermove":
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
      renderCanvas(canvas.currentLayer, null, true, true)
      break
    case "pointerup":
      renderCanvas(canvas.currentLayer, null, true, true)
      //save start and end coordinates
      state.addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: {
          from: { x: state.grabStartX, y: state.grabStartY },
          to: { x: canvas.currentLayer.x, y: canvas.currentLayer.y },
        },
      })
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
  disabled: true,
  options: {},
  type: "raster",
}
