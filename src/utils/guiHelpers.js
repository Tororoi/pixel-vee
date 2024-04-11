/**
 * @param {object} canvas - The canvas to draw on
 * @param {number} xOffset - (Integer) canvas and layer offsets
 * @param {number} yOffset - (Integer) canvas and layer offsets
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
 * @param {object} canvas - The canvas to draw on
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
 * BUG: Results in a pixellated collision check area unless subpixels are added to the logic which would mean more frequent checks (not performant)
 * @param {number} pointerX - (Integer)
 * @param {number} pointerY - (Integer)
 * @param {number} px - (Integer)
 * @param {number} py - (Integer)
 * @param {number} r - (Integer)
 * @returns {boolean} - true if pointer is inside of circle
 */
export function checkPointCollision(pointerX, pointerY, px, py, r) {
  // Calculate the distance between the point and the center of the circle
  const distance = Math.sqrt((pointerX - px) ** 2 + (pointerY - py) ** 2)

  // Check if the distance is less than or equal to the radius
  return distance <= r
}

/**
 * @param {number} pointerX - (Integer)
 * @param {number} pointerY - (Integer)
 * @param {number} px - (Integer)
 * @param {number} py - (Integer)
 * @param {number} r - (Integer)
 * @returns {boolean} - true if pointer is inside of square
 */
export function checkSquarePointCollision(pointerX, pointerY, px, py, r) {
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
 * @returns {boolean} - true if pointer is inside of area
 */
export function checkAreaCollision(pointerX, pointerY, px1, py1, px2, py2) {
  return (
    pointerX >= px1 && pointerX <= px2 && pointerY >= py1 && pointerY <= py2
  )
}
