/**
 * @param {object} canvas
 * @param {number} xOffset - (Integer)
 * @param {number} yOffset - (Integer)
 * @param {number} x - (Integer)
 * @param {number} y - (Integer)
 * @param {number} r - (Integer)
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
 * @param {object} canvas
 * @param {number} xOffset - (Integer)
 * @param {number} yOffset - (Integer)
 * @param {number} x1 - (Integer)
 * @param {number} y1 - (Integer)
 * @param {number} x2 - (Integer)
 * @param {number} y2 - (Integer)
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
 * @param {number} pointerX - (Integer)
 * @param {number} pointerY - (Integer)
 * @param {number} px - (Integer)
 * @param {number} py - (Integer)
 * @param {number} r - (Integer)
 * @returns {boolean}
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
 * @param {number} pointerX - (Integer)
 * @param {number} pointerY - (Integer)
 * @param {number} px1 - (Integer)
 * @param {number} py1 - (Integer)
 * @param {number} px2 - (Integer)
 * @param {number} py2 - (Integer)
 * @returns {boolean}
 */
export function checkAreaCollision(pointerX, pointerY, px1, py1, px2, py2) {
  return (
    pointerX >= px1 && pointerX <= px2 && pointerY >= py1 && pointerY <= py2
  )
}
