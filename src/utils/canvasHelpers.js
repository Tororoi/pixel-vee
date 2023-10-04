//Any functions that don't have any dependencies

export const setInitialZoom = (width) => {
  const ratio = 256 / width
  switch (true) {
    case ratio >= 8:
      return 16
    case ratio >= 4:
      return 8
    case ratio >= 2:
      return 4
    case ratio >= 1:
      return 2
    case ratio >= 0.5:
      return 1
    default:
      return 0.5
  }
}

//====================================//
//======== * * * Colors * * * ========//
//====================================//

/**
 * Get color of pixel at x/y coordinates
 * @param {integer} x
 * @param {integer} y
 * @param {ImageData} colorLayer
 * @returns {string} rgba color
 * dependencies - none
 */
export function getColor(x, y, colorLayer) {
  let canvasColor = {}

  let startPos = (y * colorLayer.width + x) * 4
  //clicked color
  canvasColor.r = colorLayer.data[startPos]
  canvasColor.g = colorLayer.data[startPos + 1]
  canvasColor.b = colorLayer.data[startPos + 2]
  canvasColor.a = colorLayer.data[startPos + 3]
  canvasColor.color = `rgba(${canvasColor.r},${canvasColor.g},${
    canvasColor.b
  },${canvasColor.a / 255})`
  return canvasColor
}
