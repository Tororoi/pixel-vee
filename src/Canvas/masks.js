import { canvas } from '../Context/canvas.js'
import { getWasm } from '../wasm.js'

/**
 * Builds a Set of packed pixel coordinates `(y << 16) | x` for every pixel
 * in the current layer that exactly matches `matchColor`. Coordinates are
 * packed into a single integer to avoid the overhead of a Set of objects
 * and to match the format that draw.js uses for mask lookups. When
 * `matchColor` has partial transparency the browser applies premultiplied-
 * alpha rounding when it stores pixel data, so the raw rgba components of
 * a semi-transparent color differ from what `getImageData` returns. To
 * handle this, the color is drawn onto a 1×1 scratch canvas and sampled
 * back, obtaining the premultiplied form before comparison. The WASM path
 * delegates the inner scan loop to native code for large canvases; the JS
 * fallback is used when the WASM module has not finished loading.
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
    // Drawing the color and reading it back converts to the premultiplied
    // form the browser stores internally, making the pixel comparison exact.
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = 1
    tempCanvas.height = 1
    const tempCtx = tempCanvas.getContext('2d', {
      // getImageData is called immediately after fillRect on this canvas.
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
        // Pack (x, y) into a single integer so the Set holds primitives
        // rather than objects, matching the format draw.js expects.
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
