/**
 * Maps set to an array for optimized transformations of set
 * @param {Set} set - The set to map
 * @param {number} xOffset - The x offset to apply
 * @param {number} yOffset - The y offset to apply
 * @returns {Array|null} - An array of objects with x and y properties
 */
export function coordArrayFromSet(set, xOffset, yOffset) {
  if (set) {
    return Array.from(set).map((coord) => {
      const commaIndex = coord.indexOf(",")
      const x = Number(coord.substring(0, commaIndex)) - xOffset
      const y = Number(coord.substring(commaIndex + 1)) - yOffset
      return {
        x,
        y,
      }
    })
  }
  return null
}
