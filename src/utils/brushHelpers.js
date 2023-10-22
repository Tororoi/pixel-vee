import { dom } from "../Context/dom.js"

export function drawRect(brushSize, updateBrush = false) {
  const brushPixels = []
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

  for (let i = 0; i < brushSize; i++) {
    for (let j = 0; j < brushSize; j++) {
      brushPixels.push({ x: i, y: j })
    }
  }

  brushPixels.forEach((r) => {
    paths.push(makePathData(r.x, r.y, 1))
  })

  if (updateBrush) {
    dom.brush.innerHTML = makePath("rgba(255,255,255,255)", paths.join(""))
    dom.brush.setAttribute("stroke-width", brushSize * 2)
  }
  return brushPixels
}

//TODO: create 9 brush arrays, 1 for normal brush and 8 which contain only the offset pixels for each direction. Use the directional brush to reduce cost of rendering large brushes.
export function generateCircleBrush(brushSize, xOffset, yOffset, seen) {
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
      let x = px + xOffset
      let y = py + yOffset
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

//TODO: create 9 brush arrays, 1 for normal brush and 8 which contain only the offset pixels for each direction. Use the directional brush to reduce cost of rendering large brushes.
export function drawCircle(brushSize, updateBrush = false) {
  const seen = new Set()
  const base = generateCircleBrush(brushSize, 0, 0, seen)
  let baseBrushSet = new Set(seen)
  const east = generateCircleBrush(brushSize, 1, 0, baseBrushSet)
  baseBrushSet = new Set(seen)
  const southeast = generateCircleBrush(brushSize, 1, 1, baseBrushSet)
  baseBrushSet = new Set(seen)
  const south = generateCircleBrush(brushSize, 0, 1, baseBrushSet)
  baseBrushSet = new Set(seen)
  const southwest = generateCircleBrush(brushSize, -1, 1, baseBrushSet)
  baseBrushSet = new Set(seen)
  const west = generateCircleBrush(brushSize, -1, 0, baseBrushSet)
  baseBrushSet = new Set(seen)
  const northwest = generateCircleBrush(brushSize, -1, -1, baseBrushSet)
  baseBrushSet = new Set(seen)
  const north = generateCircleBrush(brushSize, 0, -1, baseBrushSet)
  baseBrushSet = new Set(seen)
  const northeast = generateCircleBrush(brushSize, 1, -1, baseBrushSet)

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

  base.forEach((r) => {
    paths.push(makePathData(r.x, r.y, 1))
  })

  if (updateBrush) {
    dom.brush.innerHTML = makePath("rgba(255,255,255,255)", paths.join(""))
    dom.brush.setAttribute("stroke-width", 1)
  }

  return {
    "0,0": base,
    "1,0": east,
    "1,1": southeast,
    "0,1": south,
    "-1,1": southwest,
    "-1,0": west,
    "-1,-1": northwest,
    "0,-1": north,
    "1,-1": northeast,
  }
}
