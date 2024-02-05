import { canvas } from "../Context/canvas.js"

/**
 * This is quite slow due to the large amount of instructions to the canvas, consider putting it on its own canvas to avoid rerender unless necessary
 * @param {Object} canvas
 * @param {Integer} subGridSpacing
 */
export function renderGrid(subGridSpacing = null) {
  if (subGridSpacing === 1) {
    subGridSpacing = null
  }
  //get viewable boundaries - TODO: (Low Priority) consider making these global properties as they may be useful for limiting other rendering functions or anything that iterates over the canvas while drawing
  let xLarge = Math.ceil(
    canvas.layers[0].onscreenCvs.width / canvas.sharpness / canvas.zoom
  )
  let yLarge = Math.ceil(
    canvas.layers[0].onscreenCvs.height / canvas.sharpness / canvas.zoom
  )
  let xMin = canvas.xOffset < 0 ? -canvas.xOffset : 0
  let xMax = Math.min(xMin + xLarge, canvas.offScreenCVS.width)
  let yMin = canvas.yOffset < 0 ? -canvas.yOffset : 0
  let yMax = Math.min(yMin + yLarge, canvas.offScreenCVS.height)

  let lineWidth = 0.5 / canvas.zoom
  canvas.vectorGuiCTX.lineWidth = lineWidth
  canvas.vectorGuiCTX.strokeStyle = "rgba(255,255,255,0.5)"
  canvas.vectorGuiCTX.beginPath()
  //limit render to viewable area
  canvas.vectorGuiCTX.moveTo(canvas.xOffset, canvas.yOffset)
  for (let i = xMin; i <= xMax; i++) {
    //draw vertical grid lines
    canvas.vectorGuiCTX.moveTo(canvas.xOffset + i, canvas.yOffset + yMin)
    canvas.vectorGuiCTX.lineTo(canvas.xOffset + i, canvas.yOffset + yMax)
  }
  for (let j = yMin; j <= yMax; j++) {
    //draw horizontal grid lines
    canvas.vectorGuiCTX.moveTo(canvas.xOffset + xMin, canvas.yOffset + j)
    canvas.vectorGuiCTX.lineTo(canvas.xOffset + xMax, canvas.yOffset + j)
  }
  canvas.vectorGuiCTX.stroke()
  if (subGridSpacing) {
    //render subgrid every _ pixels
    xMin -= xMin % subGridSpacing
    yMin -= yMin % subGridSpacing
    canvas.vectorGuiCTX.lineWidth = lineWidth * 2
    canvas.vectorGuiCTX.beginPath()
    for (let i = xMin; i <= xMax; i += subGridSpacing) {
      //draw vertical grid lines
      canvas.vectorGuiCTX.moveTo(canvas.xOffset + i, canvas.yOffset + yMin)
      canvas.vectorGuiCTX.lineTo(canvas.xOffset + i, canvas.yOffset + yMax)
    }
    for (let j = yMin; j <= yMax; j += subGridSpacing) {
      //draw horizontal grid lines
      canvas.vectorGuiCTX.moveTo(canvas.xOffset + xMin, canvas.yOffset + j)
      canvas.vectorGuiCTX.lineTo(canvas.xOffset + xMax, canvas.yOffset + j)
    }
    canvas.vectorGuiCTX.stroke()
  }
}
