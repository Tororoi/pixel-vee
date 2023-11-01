//===================================//
//=== * * Picker Calculations * * ===//
//===================================//

/**
 *
 * @param {Object} pickerCircle - { x, y, width, height }
 * @param {Object} hsl - { hue, saturation, lightness }
 * @param {Integer} width
 * @param {Integer} height
 * @returns
 */
export const calcHSLSelectorCoordinates = (
  pickerCircle,
  hsl,
  width,
  height
) => {
  pickerCircle.x =
    Math.round((hsl.saturation * width) / 100) - pickerCircle.width / 2
  pickerCircle.y =
    Math.round((hsl.lightness * height) / 100) - pickerCircle.height / 2
  return pickerCircle
}

//===================================//
//==== * * * Picker Renders * * * ===//
//===================================//

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} pickerCircle
 * @param {String} color
 * @param {Integer} offset
 */
const drawSelectorSides = (ctx, pickerCircle, color, offset = 0) => {
  const { x, y, width, height } = pickerCircle
  const lineCenterOffset = offset + 0.5
  // draw selector
  ctx.beginPath()
  //top
  ctx.moveTo(x, y - lineCenterOffset)
  ctx.lineTo(x + width, y - lineCenterOffset)
  //right
  ctx.moveTo(x + width + lineCenterOffset, y)
  ctx.lineTo(x + width + lineCenterOffset, y + height)
  //bottom
  ctx.moveTo(x, y + height + lineCenterOffset)
  ctx.lineTo(x + width, y + height + lineCenterOffset)
  //left
  ctx.moveTo(x - lineCenterOffset, y)
  ctx.lineTo(x - lineCenterOffset, y + height)
  //stroke path
  ctx.lineWidth = 1
  ctx.strokeStyle = color
  ctx.stroke()
  ctx.closePath()
}

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} pickerCircle
 */
export const drawSelector = (ctx, pickerCircle) => {
  const { x, y, width, height } = pickerCircle
  // draw selector
  drawSelectorSides(ctx, pickerCircle, "black")
  //draw contrasting outline
  drawSelectorSides(ctx, pickerCircle, "white", 1)
  //corners
  ctx.fillStyle = "white"
  ctx.fillRect(x - 1, y - 1, 1, 1)
  ctx.fillRect(x + width, y - 1, 1, 1)
  ctx.fillRect(x - 1, y + height, 1, 1)
  ctx.fillRect(x + width, y + height, 1, 1)
}

/**
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Integer} width
 * @param {Integer} height
 * @param {Integer} hue
 */
export const drawHSLGradient = (ctx, width, height, hue) => {
  // draw HSL gradient
  for (let row = 0; row < height; row++) {
    const saturation = (row / height) * 100
    const grad = ctx.createLinearGradient(0, 0, width, 0)
    grad.addColorStop(0, `hsl(${hue}, 0%, ${saturation}%)`)
    grad.addColorStop(1, `hsl(${hue}, 100%, ${saturation}%)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, row, width, 1)
  }
}
