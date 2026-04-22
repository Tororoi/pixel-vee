import {
  colorPixel,
  matchStartColor,
  getColor,
} from '../../utils/imageDataHelpers.js'
import { isOutOfBounds, minLimit, maxLimit } from '../../utils/canvasHelpers.js'
import { getWasm } from '../../wasm.js'

/**
 * NOTE: if canvas is resized and fill point exists outside canvas area, fill will not render when timeline is redrawn
 * User action for process to fill a contiguous color
 * @param {number} startX - (Integer)
 * @param {number} startY - (Integer)
 * @param {object} strokeCtx - StrokeContext
 */
export function actionFill(startX, startY, strokeCtx) {
  const { boundaryBox, layer, currentModes, customContext } = strokeCtx
  let { currentColor } = strokeCtx
  //exit if outside borders
  if (isOutOfBounds(startX, startY, 0, layer, boundaryBox)) {
    return
  }
  let xMin = minLimit(boundaryBox.xMin, 0)
  let xMax = maxLimit(boundaryBox.xMax, layer.cvs.width)
  let yMin = minLimit(boundaryBox.yMin, 0)
  let yMax = maxLimit(boundaryBox.yMax, layer.cvs.height)
  //get imageData
  let renderCtx = layer.ctx
  if (customContext) {
    renderCtx = customContext
  }
  const width = xMax - xMin
  const height = yMax - yMin
  let layerImageData = renderCtx.getImageData(xMin, yMin, width, height)
  let clickedColor = getColor(layerImageData, startX - xMin, startY - yMin)

  if (currentModes?.eraser) {
    currentColor = { color: 'rgba(0,0,0,0)', r: 0, g: 0, b: 0, a: 0 }
  }

  //exit if color is the same
  if (currentColor.color === clickedColor.color) {
    return
  }

  const wasm = getWasm()
  if (wasm) {
    wasm.flood_fill(
      layerImageData.data,
      width,
      height,
      startX - xMin,
      startY - yMin,
      clickedColor.r,
      clickedColor.g,
      clickedColor.b,
      clickedColor.a,
      currentColor.r,
      currentColor.g,
      currentColor.b,
      currentColor.a,
    )
  } else {
    // JS fallback BFS
    const pixelStack = [[startX - xMin, startY - yMin]]
    let x, y, pixelPos, reachLeft, reachRight
    while (pixelStack.length) {
      const pos = pixelStack.pop()
      x = pos[0]
      y = pos[1]
      pixelPos = (y * width + x) * 4
      while (
        y >= 0 &&
        matchStartColor(layerImageData, pixelPos, clickedColor, boundaryBox)
      ) {
        y--
        pixelPos -= width * 4
      }
      pixelPos += width * 4
      y++
      reachLeft = false
      reachRight = false
      while (
        y < height &&
        matchStartColor(layerImageData, pixelPos, clickedColor, boundaryBox)
      ) {
        colorPixel(layerImageData, pixelPos, currentColor)
        if (x > 0) {
          if (matchStartColor(layerImageData, pixelPos - 4, clickedColor, boundaryBox)) {
            if (!reachLeft) { pixelStack.push([x - 1, y]); reachLeft = true }
          } else if (reachLeft) { reachLeft = false }
        }
        if (x < width - 1) {
          if (matchStartColor(layerImageData, pixelPos + 4, clickedColor, boundaryBox)) {
            if (!reachRight) { pixelStack.push([x + 1, y]); reachRight = true }
          } else if (reachRight) { reachRight = false }
        }
        y++
        pixelPos += width * 4
      }
    }
  }
  //render floodFill result
  renderCtx.putImageData(layerImageData, xMin, yMin)
}
