/**
 *
 * @param {array} pointsDrawn
 * @param {integer} willDrawX
 * @param {integer} willDrawY
 * @returns
 */
export function checkPixelAlreadyDrawn(pointsDrawn, willDrawX, willDrawY) {
  //check if pixel already drawn in current action. Reduces cost of subsequent renders and prevents colors with opacity from stacking on eachother.
  for (let i = 0; i < pointsDrawn.length; i++) {
    if (pointsDrawn[i].x === willDrawX && pointsDrawn[i].y === willDrawY) {
      return true
    }
  }
  return false
}

/**
 *
 * @param {Integer} currentX
 * @param {Integer} currentY
 * @param {Integer} previousX
 * @param {Integer} previousY
 * @returns {String} brushDirection
 */
export function calculateBrushDirection(
  currentX,
  currentY,
  previousX,
  previousY
) {
  let xDir = currentX - previousX
  let yDir = currentY - previousY
  //If distance is more than 1 pixel in any direction, set direction to 0,0
  if (xDir < -1 || xDir > 1 || yDir < -1 || yDir > 1) {
    xDir = 0
    yDir = 0
  }
  return `${xDir},${yDir}`
}
