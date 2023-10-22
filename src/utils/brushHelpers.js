import { dom } from "../Context/dom.js"

function updateBrushPreview(brushPixels, brushSize, updateBrush) {
  if (updateBrush) {
    dom.brush.setAttribute("viewBox", `0 -0.5 ${brushSize} ${brushSize}`)
    dom.brush.style.width = brushSize * 2
    dom.brush.style.height = brushSize * 2
  }

  function makePathData(x, y, w) {
    return "M" + x + " " + y + "h" + w + ""
  }
  function makePath(color, data) {
    return '<path stroke="' + color + '" d="' + data + '" />\n'
  }
  let paths = []

  brushPixels.forEach((r) => {
    paths.push(makePathData(r.x, r.y, 1))
  })

  if (updateBrush) {
    dom.brush.innerHTML = makePath("rgba(255,255,255,255)", paths.join(""))
    dom.brush.setAttribute("stroke-width", 1)
  }
}

//TODO: create 9 brush arrays, 1 for normal brush and 8 which contain only the offset pixels for each direction. Use the directional brush to reduce cost of rendering large brushes.
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

  function eightfoldSym(xc, yc, x, y) {
    // Helper function to add a pixel to the list
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

function generateOffsetBrush(brushPixels, offsetX, offsetY, seen) {
  const brush = []

  for (const { x, y } of brushPixels) {
    const coord = `${x + offsetX},${y + offsetY}`
    if (!seen.has(coord)) {
      brush.push({ x, y })
    }
  }

  return brush
}

/**
 * Using 9 arrays for the brush directions reduces the time complexity of iterating through the brush from ~O(n^2) to ~O(n)
 * @param {*} generatorFn
 * @param {*} brushSize
 * @param {*} updateBrush
 * @returns brushStamp object with 1 base stamp and 8 direction edge stamps
 */
function createBrushStamp(generatorFn, brushSize, updateBrush = false) {
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

  updateBrushPreview(base, brushSize, updateBrush)

  return directions
}

/**
 * draw circle brush
 * @param {*} brushSize
 * @param {*} updateBrush
 * @returns
 */
export function createCircleBrush(brushSize, updateBrush = false) {
  return createBrushStamp(generateCircleBrush, brushSize, updateBrush)
}

export function createSquareBrush(brushSize, updateBrush = false) {
  return createBrushStamp(generateSquareBrush, brushSize, updateBrush)
}
