import { getWasm } from '../wasm.js'

/**
 * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
 * @param {number} dx - (Integer)
 * @param {number} dy - (Integer)
 */
export function translateAndWrap(ctx, dx, dy) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const srcData = ctx.getImageData(0, 0, width, height)
  const wasm = getWasm()
  if (wasm) {
    wasm.translate_and_wrap(srcData.data, width, height, dx, dy)
    ctx.putImageData(srcData, 0, 0)
    return
  }
  const destData = ctx.createImageData(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIndex = (y * width + x) * 4
      const newX = (x + dx + width) % width
      const newY = (y + dy + height) % height
      const destIndex = (newY * width + newX) * 4
      destData.data[destIndex] = srcData.data[srcIndex]
      destData.data[destIndex + 1] = srcData.data[srcIndex + 1]
      destData.data[destIndex + 2] = srcData.data[srcIndex + 2]
      destData.data[destIndex + 3] = srcData.data[srcIndex + 3]
    }
  }
  ctx.putImageData(destData, 0, 0)
}

/**
 * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
 * @param {number} dx - (Integer)
 * @param {number} dy - (Integer)
 */
export function translateWithoutWrap(ctx, dx, dy) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const srcData = ctx.getImageData(0, 0, width, height)
  const wasm = getWasm()
  if (wasm) {
    wasm.translate_without_wrap(srcData.data, width, height, dx, dy)
    ctx.putImageData(srcData, 0, 0)
    return
  }
  const destData = ctx.createImageData(width, height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIndex = (y * width + x) * 4
      const newX = x + dx
      const newY = y + dy
      if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
        const destIndex = (newY * width + newX) * 4
        destData.data[destIndex] = srcData.data[srcIndex]
        destData.data[destIndex + 1] = srcData.data[srcIndex + 1]
        destData.data[destIndex + 2] = srcData.data[srcIndex + 2]
        destData.data[destIndex + 3] = srcData.data[srcIndex + 3]
      }
    }
  }
  ctx.putImageData(destData, 0, 0)
}
