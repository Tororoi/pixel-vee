import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { renderCanvas } from "../Canvas/render.js"

export function grabSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      state.grabStartX = state.cursorX
      state.grabStartY = state.cursorY
      break
    case "pointermove":
      canvas.xOffset = state.cursorX - state.grabStartX + canvas.previousXOffset
      canvas.yOffset = state.cursorY - state.grabStartY + canvas.previousYOffset
      renderCanvas()
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
  action: null,
  brushSize: 1,
  disabled: true,
  options: {},
  type: "utility",
}
