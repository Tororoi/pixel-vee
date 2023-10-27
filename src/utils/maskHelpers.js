/**
 * Maps set to an array for optimized transformations of set
 * @param {Set} set
 * @returns
 */
export function coordArrayFromSet(set, xOffset, yOffset) {
  let maskArray = []
  if (set) {
    maskArray = Array.from(set).map((coord) => {
      const commaIndex = coord.indexOf(",")
      const x = Number(coord.substring(0, commaIndex)) - xOffset
      const y = Number(coord.substring(commaIndex + 1)) - yOffset
      return {
        x,
        y,
      }
    })
  }
  return maskArray
}
