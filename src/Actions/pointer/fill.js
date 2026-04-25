import {
  colorPixel,
  matchStartColor,
  getColor,
} from '../../utils/imageDataHelpers.js'
import { isOutOfBounds, minLimit, maxLimit } from '../../utils/canvasHelpers.js'
import { getWasm } from '../../wasm.js'

/**
 * Flood-fill contiguous pixels of the same color starting at (startX, startY).
 *
 * Replaces all pixels connected to the start point that match its color with
 * `currentColor`. The fill is constrained by the boundary box, and an optional
 * mask set can restrict it further to only specific coordinates.
 *
 * Two implementations are available:
 *  - WASM: calls the compiled Rust `flood_fill` function directly on the raw
 *    ImageData buffer. This is significantly faster for large areas and is
 *    used whenever the WASM module is loaded.
 *  - JS fallback: a scanline BFS (breadth-first search) that walks the image
 *    row by row, expanding left and right along each horizontal run before
 *    queuing the rows above and below. Used when WASM is unavailable.
 *
 * NOTE: If the canvas is resized after a fill action is recorded, replaying
 * the timeline may produce no visible result if the fill origin now falls
 * outside the canvas bounds.
 * @param {number} startX - X coordinate of the fill origin (integer).
 * @param {number} startY - Y coordinate of the fill origin (integer).
 * @param {object} strokeCtx - StrokeContext for this render pass. The
 *   `currentColor`, `boundaryBox`, `layer`, `currentModes`, and
 *   `customContext` fields are used.
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

  // In eraser mode, replace the clicked color with full transparency.
  if (currentModes?.eraser) {
    currentColor = { color: 'rgba(0,0,0,0)', r: 0, g: 0, b: 0, a: 0 }
  }

  //exit if color is the same
  if (currentColor.color === clickedColor.color) {
    return
  }

  const wasm = getWasm()
  if (wasm) {
    // WASM path: pass the raw pixel buffer and color channels directly to
    // the compiled flood-fill algorithm for maximum performance.
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
      // Walk upward until we leave the matching color band.
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
      // Scan downward, coloring each matching pixel and queuing neighbors.
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
  }
  //render floodFill result
  renderCtx.putImageData(layerImageData, xMin, yMin)
}
