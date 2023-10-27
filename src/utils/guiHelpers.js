/**
 * @param {Object} canvas
 * @param {Integer} x
 * @param {Integer} y
 * @param {Integer} r
 */
export function drawCirclePath(canvas, x, y, r) {
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + x + 0.5 + r,
    canvas.yOffset + y + 0.5
  )
  canvas.vectorGuiCTX.arc(
    canvas.xOffset + x + 0.5,
    canvas.yOffset + y + 0.5,
    r,
    0,
    2 * Math.PI
  )
}

/**
 * @param {Object} canvas
 * @param {Integer} x1
 * @param {Integer} y1
 * @param {Integer} x2
 * @param {Integer} y2
 */
export function drawControlPointHandle(canvas, x1, y1, x2, y2) {
  canvas.vectorGuiCTX.moveTo(
    canvas.xOffset + x1 + 0.5,
    canvas.yOffset + y1 + 0.5
  )
  canvas.vectorGuiCTX.lineTo(
    canvas.xOffset + x2 + 0.5,
    canvas.yOffset + y2 + 0.5
  )
}

/**
 * This is quite slow due to the large amount of instructions to the canvas, consider putting it on its own canvas to avoid rerender unless necessary
 * @param {Object} canvas
 * @param {Integer} subGridSpacing
 */
export function renderGrid(canvas, subGridSpacing = null) {
  //get viewable boundaries - TODO: consider making these global properties as they may be useful for limiting other rendering functions or anything that iterates over the canvas while drawing
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
