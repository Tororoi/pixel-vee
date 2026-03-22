import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { renderCanvas } from "../Canvas/render/index.js"

/**
 * Grab and move entire canvas around
 */
function grabSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      state.tool.grabStartX = state.cursor.x
      state.tool.grabStartY = state.cursor.y
      break
    case "pointermove":
      canvas.xOffset = state.cursor.x - state.tool.grabStartX + canvas.previousXOffset
      canvas.yOffset = state.cursor.y - state.tool.grabStartY + canvas.previousYOffset
      renderCanvas() //affect all layers
      break
    case "pointerup":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      break
    case "pointerout":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      break
    default:
    //do nothing
  }
}

export const grab = {
  name: "grab",
  fn: grabSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: true,
  options: {},
  modes: {},
  type: "utility",
  cursor: "grab",
  activeCursor: "grabbing",
}
