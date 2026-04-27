import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
import { renderCanvas } from '../canvas/render.js'

/**
 * Grab and move entire canvas around
 */
function grabSteps() {
  switch (canvas.pointerEvent) {
    case 'pointerdown':
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      globalState.tool.grabStartX = globalState.cursor.x
      globalState.tool.grabStartY = globalState.cursor.y
      break
    case 'pointermove':
      canvas.xOffset =
        globalState.cursor.x -
        globalState.tool.grabStartX +
        canvas.previousXOffset
      canvas.yOffset =
        globalState.cursor.y -
        globalState.tool.grabStartY +
        canvas.previousYOffset
      renderCanvas() //affect all layers
      break
    case 'pointerup':
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      break
    case 'pointerout':
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      break
    default:
    //do nothing
  }
}

export const grab = {
  name: 'grab',
  fn: grabSteps,
  brushSize: 1,
  brushType: 'circle',
  brushDisabled: true,
  options: {},
  modes: {},
  type: 'utility',
  cursor: 'grab',
  activeCursor: 'grabbing',
}
