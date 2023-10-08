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
