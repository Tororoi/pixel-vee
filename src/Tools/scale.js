import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { renderCanvas } from "../Canvas/render.js"

function scaleSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  //move raster layer or reference layer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //
      break
    case "pointermove":
      if (canvas.currentLayer.type === "reference") {
        //lower right corner
        let width = state.cursorX - canvas.currentLayer.x
        let height = state.cursorY - canvas.currentLayer.y
        canvas.currentLayer.scale =
          canvas.offScreenCVS.width / canvas.currentLayer.img.width >
          canvas.offScreenCVS.height / canvas.currentLayer.img.height
            ? height / canvas.currentLayer.img.height
            : width / canvas.currentLayer.img.width
      } else if (canvas.currentLayer.type === "raster") {
        //do nothing yet
      }
      renderCanvas(canvas.currentLayer, null, true, true)
      break
    case "pointerup":
      renderCanvas(canvas.currentLayer, null, true, true)
      //save start and end coordinates
      // state.addToTimeline({
      //   tool: state.tool,
      //   layer: canvas.currentLayer,
      //   properties: {
      //     from: { x: state.grabStartX, y: state.grabStartY },
      //     to: { x: canvas.currentLayer.x, y: canvas.currentLayer.y },
      //   },
      // })
      break
    default:
    //do nothing
  }
}

export const scale = {
  name: "scale",
  fn: scaleSteps,
  action: null, //actionMove
  brushSize: 1,
  disabled: true,
  options: {},
  type: "raster",
}
