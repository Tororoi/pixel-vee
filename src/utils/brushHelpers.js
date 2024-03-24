import { dom } from "../Context/dom.js"

/**
 * update the brush preview in the dom
 * @param {Array} brushPixels - array of coordinates representing the pixels of a base brush stamp
 * @param {number} brushSize - (Integer)
 */
export function updateBrushPreview(brushPixels, brushSize) {
  dom.brushStamp.setAttribute("viewBox", `0 -0.5 ${brushSize} ${brushSize}`)
  dom.brushStamp.style.width = brushSize * 2
  dom.brushStamp.style.height = brushSize * 2

  /**
   * @param {number} x - (Integer)
   * @param {number} y - (Integer)
   * @param {number} w - (Integer)
   * @returns {string} - path data
   */
  function makePathData(x, y, w) {
    return "M" + x + " " + y + "h" + w + ""
  }

  /**
   * @param {string} color - rgba color
   * @param {string} data - path data
   * @returns {string} - path element
   */
  function makePath(color, data) {
    return '<path stroke="' + color + '" d="' + data + '" />\n'
  }
  let paths = []

  brushPixels.forEach((r) => {
    paths.push(makePathData(r.x, r.y, 1))
  })

  dom.brushStamp.innerHTML = makePath("rgba(255,255,255,255)", paths.join(""))
  dom.brushStamp.setAttribute("stroke-width", 1)
}

/**
 * @param {number} brushSize - (Integer)
 * @param {number} offsetX - (-1, 0, 1) (Integer)
 * @param {number} offsetY - (-1, 0, 1) (Integer)
 * @param {Set} seen - set of pixels already seen
 * @returns {Array} - array of coordinates representing the pixels of a base brush stamp
 */
function generateCircleBrush(brushSize, offsetX, offsetY, seen) {
  const brushPixels = []
  let r = Math.floor(brushSize / 2)
  let d = 4 - 2 * r //decision parameter in bresenham's algorithm
  d = (5 - 4 * r) / 4
  let x = 0,
    y = r
  let xO = r,
    yO = r

  eightfoldSym(xO, yO, x, y)
  while (x < y) {
    x++
    if (d >= 0) {
      y--
      d += 2 * (x - y) + 1 //outside circle
    } else {
      d += 2 * x + 1 //inside circle
    }
    eightfoldSym(xO, yO, x, y)
  }

  /**
   * Create eightfold symmetry of a pixellated circle
   * @param {number} xc - (Integer)
   * @param {number} yc - (Integer)
   * @param {number} x - (Integer)
   * @param {number} y - (Integer)
   */
  function eightfoldSym(xc, yc, x, y) {
    /**
     * Helper function to add a pixel to the list of brush pixels
     * @param {number} px - (Integer)
     * @param {number} py - (Integer)
     */
    function addPixel(px, py) {
      //put hole
      // if (px === 8 && py === 8) {
      //   return
      // }
      //
      let x = px + offsetX
      let y = py + offsetY
      const key = `${x},${y}`
      if (seen.has(key)) {
        return
      } else {
        seen.add(key)
        brushPixels.push({
          x: px,
          y: py,
        })
      }
    }

    const xLoopEnd = brushSize % 2 === 0 ? 2 * x : 2 * x + 1
    const yLoopEnd = brushSize % 2 === 0 ? 2 * y : 2 * y + 1
    const offset = brushSize % 2 === 0 ? 1 : 0
    // Octant 2 & 3
    for (let i = 0; i < xLoopEnd; i++) {
      addPixel(xc - x + i, yc - y)
    }

    // Octant 1 & 4
    for (let i = 0; i < yLoopEnd; i++) {
      addPixel(xc - y + i, yc - x)
    }
    // Octant 5 & 8
    for (let i = 0; i < yLoopEnd; i++) {
      addPixel(xc - y + i, yc + x - offset)
    }

    // Octant 6 & 7
    for (let i = 0; i < xLoopEnd; i++) {
      addPixel(xc - x + i, yc + y - offset)
    }
  }
  return brushPixels
}

/**
 * @param {number} brushSize - (Integer)
 * @param {number} offsetX - (-1, 0, 1) (Integer)
 * @param {number} offsetY - (-1, 0, 1) (Integer)
 * @param {Set} seen - set of pixels already seen
 * @returns {Array} - array of coordinates representing the pixels of a base brush stamp
 */
function generateSquareBrush(brushSize, offsetX, offsetY, seen) {
  const brush = []

  for (let y = 0; y < brushSize; y++) {
    for (let x = 0; x < brushSize; x++) {
      const coord = `${x + offsetX},${y + offsetY}`
      if (!seen.has(coord)) {
        brush.push({ x, y })
        seen.add(coord)
      }
    }
  }

  return brush
}

/**
 * @param {Array} brushPixels - array of coordinates representing the pixels of a base brush stamp
 * @param {number} offsetX - (-1, 0, 1) (Integer)
 * @param {number} offsetY - (-1, 0, 1) (Integer)
 * @param {Set} seen - set of pixels already seen
 * @returns {Array} - array of coordinates representing the pixels on the edge of a brush stamp for a given offset direction
 */
function generateOffsetBrush(brushPixels, offsetX, offsetY, seen) {
  const offsetBrush = []

  for (const { x, y } of brushPixels) {
    const coord = `${x + offsetX},${y + offsetY}`
    if (!seen.has(coord)) {
      offsetBrush.push({ x, y })
    }
  }

  return offsetBrush
}

/**
 * Using 9 arrays for the brush directions reduces the time complexity of iterating through the brush from ~O(n^2) to ~O(n)
 * @param {Function} generatorFn - function to generate the base brush stamp
 * @param {number} brushSize - (Integer)
 * @returns {object} - brushStamp object with 1 base stamp and 8 direction edge stamps
 */
function createBrushStamp(generatorFn, brushSize) {
  const seen = new Set()
  const base = generatorFn(brushSize, 0, 0, seen)
  const offsets = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
  ]
  const directions = {
    "0,0": base,
  }
  for (const [x, y] of offsets) {
    directions[`${x},${y}`] = generateOffsetBrush(base, x, y, seen)
  }

  return directions
}

/**
 * draw circle brush
 * @param {number} brushSize - (Integer)
 * @returns {object} - brushStamp object with 1 base stamp and 8 direction edge stamps
 */
export function createCircleBrush(brushSize) {
  return createBrushStamp(generateCircleBrush, brushSize)
}

/**
 * draw square brush
 * @param {number} brushSize - (Integer)
 * @returns {object} - brushStamp object with 1 base stamp and 8 direction edge stamps
 */
export function createSquareBrush(brushSize) {
  return createBrushStamp(generateSquareBrush, brushSize)
}

/**
 * @param {string} brushType - "circle" or "square"
 * @returns {object} - brushStamp object with 1 base stamp and 8 direction edge stamps
 */
export function generateBrushStamps(brushType) {
  let brushStamp = {}
  if (brushType === "circle") {
    for (let i = 1; i <= 32; i++) {
      brushStamp[i] = createCircleBrush(i)
    }
  } else if (brushType === "square") {
    for (let i = 1; i <= 32; i++) {
      brushStamp[i] = createSquareBrush(i)
    }
  }
  return brushStamp
}
