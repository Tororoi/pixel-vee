let brush = document.querySelector(".brush")

export function drawRect(brushSize, updateBrush = false) {
  const brushPixels = []
  if (updateBrush) {
    brush.setAttribute("viewBox", `0 -0.5 ${brushSize} ${brushSize}`)
    brush.style.width = brushSize * 2
    brush.style.height = brushSize * 2
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
    brush.innerHTML = makePath("rgba(255,255,255,255)", paths.join(""))
    brush.setAttribute("stroke-width", brushSize * 2)
  }
  return brushPixels
}

export function drawCircle(brushSize, updateBrush = false) {
  const brushPixels = []
  const seen = new Set()
  let r = Math.floor(brushSize / 2)
  let d = 4 - 2 * r //decision parameter in bresenham's algorithm
  d = (5 - 4 * r) / 4
  let x = 0,
    y = r
  let xO = r,
    yO = r

  if (updateBrush) {
    brush.setAttribute("viewBox", `0 -0.5 ${brushSize} ${brushSize}`)
    brush.style.width = brushSize * 2
    brush.style.height = brushSize * 2
  }
  function makePathData(x, y, w) {
    return "M" + x + " " + y + "h" + w + ""
  }
  function makePath(color, data) {
    return '<path stroke="' + color + '" d="' + data + '" />\n'
  }
  let paths = []

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
      const key = `${px},${py}`
      if (seen.has(key)) {
        return
      } else {
        seen.add(key)
        brushPixels.push({ x: px, y: py })
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

  brushPixels.forEach((r) => {
    paths.push(makePathData(r.x, r.y, 1))
  })

  if (updateBrush) {
    brush.innerHTML = makePath("rgba(255,255,255,255)", paths.join(""))
    brush.setAttribute("stroke-width", 1)
  }
  return brushPixels
}
