import {
  colorPixel,
  matchStartColor,
  getColor,
} from '../../utils/imageDataHelpers.js'
import { isOutOfBounds, minLimit, maxLimit } from '../../utils/canvasHelpers.js'

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
  let layerImageData = renderCtx.getImageData(
    xMin,
    yMin,
    xMax - xMin,
    yMax - yMin,
  )
  let clickedColor = getColor(layerImageData, startX - xMin, startY - yMin)

  if (currentModes?.eraser) {
    currentColor = { color: 'rgba(0,0,0,0)', r: 0, g: 0, b: 0, a: 0 }
  }

  //exit if color is the same
  if (currentColor.color === clickedColor.color) {
    return
  }
  //Start with click coords
  const pixelStack = [[startX - xMin, startY - yMin]]
  let x, y, pixelPos, reachLeft, reachRight
  const width = xMax - xMin
  const height = yMax - yMin
  while (pixelStack.length) {
    const pos = pixelStack.pop()
    x = pos[0]
    y = pos[1]
    //get current pixel position
    pixelPos = (y * width + x) * 4
    // Go up as long as the color matches and are inside the canvas
    while (
      y >= 0 &&
      matchStartColor(layerImageData, pixelPos, clickedColor, boundaryBox)
    ) {
      y--
      pixelPos -= width * 4
    }
    //Don't overextend
    pixelPos += width * 4
    y++
    reachLeft = false
    reachRight = false
    // Go down as long as the color matches and inside the canvas
    while (
      y < height &&
      matchStartColor(layerImageData, pixelPos, clickedColor, boundaryBox)
    ) {
      colorPixel(layerImageData, pixelPos, currentColor)

      if (x > 0) {
        if (
          matchStartColor(
            layerImageData,
            pixelPos - 4,
            clickedColor,
            boundaryBox,
          )
        ) {
          if (!reachLeft) {
            //Add pixel to stack
            pixelStack.push([x - 1, y])
            reachLeft = true
          }
        } else if (reachLeft) {
          reachLeft = false
        }
      }

      if (x < width - 1) {
        if (
          matchStartColor(
            layerImageData,
            pixelPos + 4,
            clickedColor,
            boundaryBox,
          )
        ) {
          if (!reachRight) {
            //Add pixel to stack
            pixelStack.push([x + 1, y])
            reachRight = true
          }
        } else if (reachRight) {
          reachRight = false
        }
      }
      y++
      pixelPos += width * 4
    }
  }
  //render floodFill result
  renderCtx.putImageData(layerImageData, xMin, yMin)
}
