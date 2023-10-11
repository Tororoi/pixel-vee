import { actionDraw } from "../Tools/actions.js"
import { vectorGui } from "./vector.js"
import { renderCanvas } from "../Canvas/render.js"

//===========================================//
//=== * * * Graphics User Interface * * * ===//
//===========================================//

export function renderRasterGUI(state, canvas, swatches) {
  canvas.rasterGuiCTX.clearRect(
    0,
    0,
    canvas.rasterGuiCVS.width / canvas.zoom,
    canvas.rasterGuiCVS.height / canvas.zoom
  )
}

export function renderCursor(state, canvas, swatches) {
  switch (state.tool.name) {
    case "grab":
      //show nothing
      break
    case "eyedropper":
      //empty square
      vectorGui.drawCursorBox(state, canvas, 2)
      break
    default:
      //TODO: erase mode is somewhat buggy with rendering. Find way to have it render without calling draw() more than needed.
      if (!vectorGui.collisionPresent) {
        drawCurrentPixel(state, canvas, swatches)
        if (state.mode === "erase") {
          // vectorGui.drawCursorBox(state, canvas, 1)
          vectorGui.drawSelectOutline(state, canvas)
        }
      } else {
        renderCanvas()
      }
  }
}

export function drawCurrentPixel(state, canvas, swatches) {
  //draw onscreen current pixel
  renderCanvas()
  canvas.onScreenCTX.fillStyle = swatches.primary.color.color
  state.brushStamp.forEach((pixel) => {
    const x = Math.ceil(state.cursorX - state.tool.brushSize / 2) + pixel.x
    const y = Math.ceil(state.cursorY - state.tool.brushSize / 2) + pixel.y
    const drawX =
      Math.ceil(state.cursorWithCanvasOffsetX - state.tool.brushSize / 2) +
      pixel.x
    const drawY =
      Math.ceil(state.cursorWithCanvasOffsetY - state.tool.brushSize / 2) +
      pixel.y

    if (state.pointsSet) {
      const key = `${x},${y}`
      if (state.pointsSet.has(key)) {
        return // skip this point
      }
    }
    switch (state.mode) {
      case "erase":
        canvas.onScreenCTX.clearRect(drawX, drawY, 1, 1)
        break
      case "inject":
        canvas.onScreenCTX.clearRect(drawX, drawY, 1, 1)
        canvas.onScreenCTX.fillRect(drawX, drawY, 1, 1)
        break
      default:
        canvas.onScreenCTX.fillRect(drawX, drawY, 1, 1)
    }
  })
}
