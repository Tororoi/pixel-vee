import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { renderCanvas } from "../Canvas/render.js"

function moveSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  //move raster layer or reference layer
  switch (canvas.pointerEvent) {
    case "pointermove":
      if (canvas.currentLayer.type === "reference") {
        //Physically move a reference layer
        canvas.currentLayer.x += state.cursorX - state.previousX
        canvas.currentLayer.y += state.cursorY - state.previousY
      } else if (canvas.currentLayer.type === "raster") {
        //move content
      }
      renderCanvas()
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
  disabled: false,
  options: { magicWand: false },
  type: "raster",
}
