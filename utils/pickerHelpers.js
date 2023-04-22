//===================================//
//=== * * Picker Calculations * * ===//
//===================================//

/**
 *
 * @param {object} pickerCircle - { x, y, width, height }
 * @param {object} hsl - { hue, saturation, lightness }
 * @param {integer} width
 * @param {integer} height
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

const drawSelectorSides = (context, pickerCircle, color, offset = 0) => {
  const { x, y, width, height } = pickerCircle
  const lineCenterOffset = offset + 0.5
  // draw selector
  context.beginPath()
  //top
  context.moveTo(x, y - lineCenterOffset)
  context.lineTo(x + width, y - lineCenterOffset)
  //right
  context.moveTo(x + width + lineCenterOffset, y)
  context.lineTo(x + width + lineCenterOffset, y + height)
  //bottom
  context.moveTo(x, y + height + lineCenterOffset)
  context.lineTo(x + width, y + height + lineCenterOffset)
  //left
  context.moveTo(x - lineCenterOffset, y)
  context.lineTo(x - lineCenterOffset, y + height)
  //stroke path
  context.lineWidth = 1
  context.strokeStyle = color
  context.stroke()
  context.closePath()
}

export const drawSelector = (context, pickerCircle) => {
  const { x, y, width, height } = pickerCircle
  // draw selector
  drawSelectorSides(context, pickerCircle, "black")
  //draw contrasting outline
  drawSelectorSides(context, pickerCircle, "white", 1)
  //corners
  context.fillStyle = "white"
  context.fillRect(x - 1, y - 1, 1, 1)
  context.fillRect(x + width, y - 1, 1, 1)
  context.fillRect(x - 1, y + height, 1, 1)
  context.fillRect(x + width, y + height, 1, 1)
}

export const drawHSLGradient = (context, width, height, hue) => {
  // draw HSL gradient
  for (let row = 0; row < height; row++) {
    const saturation = (row / height) * 100
    const grad = context.createLinearGradient(0, 0, width, 0)
    grad.addColorStop(0, `hsl(${hue}, 0%, ${saturation}%)`)
    grad.addColorStop(1, `hsl(${hue}, 100%, ${saturation}%)`)
    context.fillStyle = grad
    context.fillRect(0, row, width, 1)
  }
}
