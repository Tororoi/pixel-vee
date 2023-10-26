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
        function translateAndWrap(ctx, dx, dy) {
          const width = ctx.canvas.width
          const height = ctx.canvas.height

          // Get current image data
          const srcData = ctx.getImageData(0, 0, width, height)
          // Create an empty image data to store the result
          const destData = ctx.createImageData(width, height)

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              // Calculate source index
              const srcIndex = (y * width + x) * 4

              // Calculate the new position with wrapping
              const newX = (x + dx + width) % width
              const newY = (y + dy + height) % height

              // Calculate destination index
              const destIndex = (newY * width + newX) * 4

              // Copy pixel data
              destData.data[destIndex] = srcData.data[srcIndex] // Red
              destData.data[destIndex + 1] = srcData.data[srcIndex + 1] // Green
              destData.data[destIndex + 2] = srcData.data[srcIndex + 2] // Blue
              destData.data[destIndex + 3] = srcData.data[srcIndex + 3] // Alpha
            }
          }

          // Put the translated image data onto the canvas
          ctx.putImageData(destData, 0, 0)
        }

        // Usage:
        const ctx = canvas.currentLayer.ctx
        translateAndWrap(
          ctx,
          state.cursorX - state.previousX,
          state.cursorY - state.previousY
        ) // Translate by 50 pixels to the right and 50 pixels down.
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
