/**
 * WARNING: This function directly manipulates the vector's properties in the history.
 * @param {Object} vector
 * @param {Integer} x
 * @param {Integer} y
 * @param {String} xKey
 * @param {String} yKey
 */
export function updateVectorProperties(vector, x, y, xKey, yKey) {
  vector.properties.vectorProperties[xKey] = x - vector.layer.x
  vector.properties.vectorProperties[yKey] = y - vector.layer.y
}
