import { canvas } from "../Context/canvas.js"

//====================================//
//========= * * * Core * * * =========//
//====================================//

//Main pillar of the code structure
export function actionUndoRedo(pushStack, popStack) {
  pushStack.push(popStack.pop())
  //clear all layers in preparation to redraw them.
  //DRY: do all layers and actions need to be rerendered for redo?
  canvas.layers.forEach((l) => {
    if (l.type === "raster") {
      l.ctx.clearRect(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
    }
  })
  canvas.redrawPoints()
  canvas.draw()
}
