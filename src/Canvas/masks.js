import { canvas } from "../Context/canvas.js"
import { getColor } from "../utils/imageDataHelpers.js"

/**
 * Create a mask set for a given color
 * @param {object} matchColor - The color to create a mask from
 * @returns {Set} - A set of all the pixels that match the color
 */
export function createColorMaskSet(matchColor) {
  // state.pointsSet = new Set()
  const maskSet = new Set()
  //create mask set
  const layerImageData = canvas.currentLayer.ctx.getImageData(
    0,
    0,
    canvas.currentLayer.cvs.width,
    canvas.currentLayer.cvs.height
  )
  if (matchColor.a < 255) {
    //draw then sample color to math premultiplied alpha version of color
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = 1
    tempCanvas.height = 1
    const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true })

    tempCtx.fillStyle = `rgba(${matchColor.r}, ${matchColor.g}, ${
      matchColor.b
    }, ${matchColor.a / 255})`
    tempCtx.fillRect(0, 0, 1, 1)

    const sampledColor = tempCtx.getImageData(0, 0, 1, 1).data
    matchColor = {
      color: `rgba(${sampledColor[0]}, ${sampledColor[1]}, ${
        sampledColor[2]
      }, ${sampledColor[3] / 255})`,
      r: sampledColor[0],
      g: sampledColor[1],
      b: sampledColor[2],
      a: sampledColor[3],
    }
  }
  for (let x = 0; x < canvas.currentLayer.cvs.width; x++) {
    for (let y = 0; y < canvas.currentLayer.cvs.height; y++) {
      let color = getColor(layerImageData, x, y)
      if (
        color.r === matchColor.r &&
        color.g === matchColor.g &&
        color.b === matchColor.b &&
        color.a === matchColor.a
      ) {
        const key = `${x},${y}`
        maskSet.add(key)
      }
    }
  }
  return maskSet
}
