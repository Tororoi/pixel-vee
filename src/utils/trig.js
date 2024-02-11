/**
 * create triangle object
 * @param {number} x1 - (Integer)
 * @param {number} y1 - (Integer)
 * @param {number} x2 - (Integer)
 * @param {number} y2 - (Integer)
 * @param {number} ang - (Float)
 * @returns {object} - {x: number, y: number, long: number}
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
 * @param {number} x - (Integer)
 * @param {number} y - (Integer)
 * @returns {number} - angle in radians
 */
export function getAngle(x, y) {
  // if (
  //   Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0) !==
  //   Math.atan2(y, x)
  // ) {
  //   console.warn({
  //     atan: Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0),
  //     atan2: Math.atan2(y, x),
  //   })
  // }
  // return Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0)
  return Math.atan2(y, x)
}
