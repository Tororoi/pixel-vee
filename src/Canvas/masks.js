import { canvas } from '../Context/canvas.js'
import { getWasm } from '../wasm.js'

/**
 * Create a mask set for a given color
 * @param {object} matchColor - The color to create a mask from
 * @returns {Set} - A set of all the pixels that match the color
 */
export function createColorMaskSet(matchColor) {
  // state.selection.pointsSet = new Set()
  const maskSet = new Set()
  //create mask set
  const layerImageData = canvas.currentLayer.ctx.getImageData(
    0,
    0,
    canvas.currentLayer.cvs.width,
    canvas.currentLayer.cvs.height,
  )
  if (matchColor.a < 255) {
    //draw then sample color to math premultiplied alpha version of color
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = 1
    tempCanvas.height = 1
    const tempCtx = tempCanvas.getContext('2d', {
      willReadFrequently: true,
    })

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
  const { r: mr, g: mg, b: mb, a: ma } = matchColor
  const wasm = getWasm()
  if (wasm) {
    const packed = wasm.build_color_mask(
      layerImageData.data,
      canvas.currentLayer.cvs.width,
      canvas.currentLayer.cvs.height,
      mr,
      mg,
      mb,
      ma,
    )
    for (const coord of packed) {
      maskSet.add(coord)
    }
  } else {
    const { data, width } = layerImageData
    let x = 0
    let y = 0
    for (let i = 0; i < data.length; i += 4) {
      if (
        data[i] === mr &&
        data[i + 1] === mg &&
        data[i + 2] === mb &&
        data[i + 3] === ma
      ) {
        maskSet.add((y << 16) | x)
      }
      if (++x === width) {
        x = 0
        y++
      }
    }
  }
  return maskSet
}
