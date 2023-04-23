/**
 * create triangle object
 * @param {*} x1
 * @param {*} y1
 * @param {*} x2
 * @param {*} y2
 * @param {*} ang
 * @returns
 */
export function getTriangle(x1, y1, x2, y2, ang) {
  let tri = {}
  if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
    tri.x = Math.sign(Math.cos(ang))
    tri.y = Math.tan(ang) * Math.sign(Math.cos(ang))
    tri.long = Math.abs(x1 - x2)
  } else {
    tri.x = Math.tan(Math.PI / 2 - ang) * Math.sign(Math.cos(Math.PI / 2 - ang))
    tri.y = Math.sign(Math.cos(Math.PI / 2 - ang))
    tri.long = Math.abs(y1 - y2)
  }
  return tri
}

/**
 * Finds the angle of (x,y) on a plane from the origin
 * @param {*} x
 * @param {*} y
 * @returns
 */
export function getAngle(x, y) {
  return Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0)
}
