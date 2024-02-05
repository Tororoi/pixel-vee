/**
 * @param {Object} canvas
 * @param {Integer} xOffset
 * @param {Integer} yOffset
 * @param {Integer} x
 * @param {Integer} y
 * @param {Integer} r
 */
export function drawCirclePath(canvas, xOffset, yOffset, x, y, r) {
  canvas.vectorGuiCTX.moveTo(xOffset + x + 0.5 + r, yOffset + y + 0.5)
  canvas.vectorGuiCTX.arc(
    xOffset + x + 0.5,
    yOffset + y + 0.5,
    r,
    0,
    2 * Math.PI
  )
}

/**
 * @param {Object} canvas
 * @param {Integer} xOffset
 * @param {Integer} yOffset
 * @param {Integer} x1
 * @param {Integer} y1
 * @param {Integer} x2
 * @param {Integer} y2
 */
export function drawControlPointHandle(
  canvas,
  xOffset,
  yOffset,
  x1,
  y1,
  x2,
  y2
) {
  canvas.vectorGuiCTX.moveTo(xOffset + x1 + 0.5, yOffset + y1 + 0.5)
  canvas.vectorGuiCTX.lineTo(xOffset + x2 + 0.5, yOffset + y2 + 0.5)
}

/**
 *
 * @param {Integer} pointerX
 * @param {Integer} pointerY
 * @param {Integer} px
 * @param {Integer} py
 * @param {Integer} r
 * @returns {Boolean}
 */
export function checkPointCollision(pointerX, pointerY, px, py, r) {
  //currently a square detection field, TODO: (Low Priority) change to circle
  return (
    pointerX >= px - r &&
    pointerX <= px + r &&
    pointerY >= py - r &&
    pointerY <= py + r
  )
}

/**
 * @param {Integer} pointerX
 * @param {Integer} pointerY
 * @param {Integer} px1
 * @param {Integer} py1
 * @param {Integer} px2
 * @param {Integer} py2
 * @returns {Boolean}
 */
export function checkAreaCollision(pointerX, pointerY, px1, py1, px2, py2) {
  return (
    pointerX >= px1 && pointerX <= px2 && pointerY >= py1 && pointerY <= py2
  )
}
