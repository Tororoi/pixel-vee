let brush = document.querySelector(".brush")

export function drawRect(brushSize, updateBrush = false) {
  let brushRects = []
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

  brushRects.push({
    x: 0,
    y: 0,
    w: brushSize,
    h: brushSize,
  })

  brushRects.forEach((r) => {
    paths.push(makePathData(r.x, r.y, r.w))
  })

  if (updateBrush) {
    brush.innerHTML = makePath("rgba(255,255,255,255)", paths.join(""))
    brush.setAttribute("stroke-width", brushSize * 2)
  }
  return brushRects
}

export function drawCircle(brushSize, updateBrush = false) {
  // let brushPoints = [];
  let brushRects = []
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
    //solid circle
    if (brushSize % 2 === 0) {
      //connect octant pairs to form solid shape
      brushRects.push({ x: xc - x, y: yc - y, w: 2 * x, h: 1 }) //3, 2
      brushRects.push({ x: xc - y, y: yc - x, w: 2 * y, h: 1 }) //4, 1
      brushRects.push({ x: xc - y, y: yc + x - 1, w: 2 * y, h: 1 }) //5, 8
      brushRects.push({ x: xc - x, y: yc + y - 1, w: 2 * x, h: 1 }) //6, 7
    } else {
      brushRects.push({ x: xc - x, y: yc - y, w: 2 * x + 1, h: 1 }) //3, 2
      brushRects.push({ x: xc - y, y: yc - x, w: 2 * y + 1, h: 1 }) //4, 1
      brushRects.push({ x: xc - y, y: yc + x, w: 2 * y + 1, h: 1 }) //5, 8
      brushRects.push({ x: xc - x, y: yc + y, w: 2 * x + 1, h: 1 }) //6, 7
    }
  }

  brushRects.forEach((r) => {
    paths.push(makePathData(r.x, r.y, r.w))
  })

  if (updateBrush) {
    brush.innerHTML = makePath("rgba(255,255,255,255)", paths.join(""))
    brush.setAttribute("stroke-width", 1)
  }
  return brushRects
}
