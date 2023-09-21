import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { getTriangle, getAngle } from "../utils/trig.js"
import { plotCubicBezier, plotQuadBezier } from "../utils/bezier.js"
import { generateRandomRGB } from "../utils/colors.js"
import { vectorGuiState } from "../GUI/vector.js"
import { plotCircle, plotRotatedEllipse } from "../utils/ellipse.js"

//====================================//
//===== * * * Tool Actions * * * =====//
//====================================//

//"Actions" are user-initiated events that are reversible through the undo button. This file holds the functions used for reversible actions.
//TODO: Not all reversible actions are held here currently. Clear canvas and addLayer are not present

/**
 * Render a stamp from the brush to the canvas
 * TODO: Find more efficient way to draw any brush shape without drawing each pixel separately
 * @param {*} coordX
 * @param {*} coordY
 * @param {*} currentColor
 * @param {*} brushStamp
 * @param {*} weight
 * @param {*} ctx
 * @param {*} currentMode
 * @param {*} scale
 */
export function actionDraw(
  coordX,
  coordY,
  currentColor,
  brushStamp,
  weight,
  ctx,
  currentMode,
  scale = 1
) {
  ctx.fillStyle = currentColor.color
  switch (currentMode) {
    case "erase":
      brushStamp.forEach((r) => {
        ctx.clearRect(
          (Math.ceil(coordX - weight / 2) + r.x) * scale,
          (Math.ceil(coordY - weight / 2) + r.y) * scale,
          r.w * scale,
          r.h * scale
        )
      })
      break
    default:
      // ctx.fillRect(Math.ceil(coordX - weight / 2), Math.ceil(coordY - weight / 2), weight, weight);
      brushStamp.forEach((r) => {
        ctx.fillRect(
          (Math.ceil(coordX - weight / 2) + r.x) * scale,
          (Math.ceil(coordY - weight / 2) + r.y) * scale,
          r.w * scale,
          r.h * scale
        )
      })
    // ctx.drawImage(brushStamp, Math.ceil(coordX - weight / 2), Math.ceil(coordY - weight / 2), weight, weight);
  }
}

/**
 * Draws a pixel perfect line from point a to point b
 * @param {*} sx
 * @param {*} sy
 * @param {*} tx
 * @param {*} ty
 * @param {*} currentColor
 * @param {*} ctx
 * @param {*} currentMode
 * @param {*} brushStamp
 * @param {*} weight
 * @param {*} scale
 */
export function actionLine(
  sx,
  sy,
  tx,
  ty,
  currentColor,
  ctx,
  currentMode,
  brushStamp,
  weight,
  scale = 1
) {
  ctx.fillStyle = currentColor.color

  let angle = getAngle(tx - sx, ty - sy) // angle of line
  let tri = getTriangle(sx, sy, tx, ty, angle)

  for (let i = 0; i < tri.long; i++) {
    let thispoint = {
      x: Math.round(sx + tri.x * i),
      y: Math.round(sy + tri.y * i),
    }
    // for each point along the line
    actionDraw(
      thispoint.x,
      thispoint.y,
      currentColor,
      brushStamp,
      weight,
      ctx,
      currentMode,
      scale
    )
  }
  //fill endpoint
  actionDraw(
    Math.round(tx),
    Math.round(ty),
    currentColor,
    brushStamp,
    weight,
    ctx,
    currentMode,
    scale
  )
}

/**
 * User action for process to draw without staircasing artifacts
 * @param {*} currentX
 * @param {*} currentY
 */
export function actionPerfectPixels(currentX, currentY) {
  //if currentPixel not neighbor to lastDrawn, draw waitingpixel
  if (
    Math.abs(currentX - state.lastDrawnX) > 1 ||
    Math.abs(currentY - state.lastDrawnY) > 1
  ) {
    actionDraw(
      state.waitingPixelX,
      state.waitingPixelY,
      swatches.primary.color,
      state.brushStamp,
      state.tool.brushSize,
      canvas.currentLayer.ctx,
      state.mode
    )
    //update queue
    state.lastDrawnX = state.waitingPixelX
    state.lastDrawnY = state.waitingPixelY
    state.waitingPixelX = currentX
    state.waitingPixelY = currentY
    if (state.tool.name !== "replace") {
      //TODO: refactor so adding to timeline is performed by controller function
      state.addToTimeline({
        tool: state.tool,
        x: state.lastDrawnX,
        y: state.lastDrawnY,
        layer: canvas.currentLayer,
      })
    }
    canvas.draw()
  } else {
    state.waitingPixelX = currentX
    state.waitingPixelY = currentY
  }
}

/**
 * User action for process to replace a specific color where the user's brush moves
 */
export function actionReplace() {
  /**
   * Used for replace tool
   * @param {*} currentLayer
   * @returns
   */
  function createMapForSpecificColor(currentLayer) {
    const colorLayer = currentLayer.ctx.getImageData(
      0,
      0,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height
    )
    const matchColor = swatches.secondary.color
    //iterate over pixel data and remove non-matching colors
    for (let i = 0; i < colorLayer.data.length; i += 4) {
      //sample color and remove if not match
      if (colorLayer.data[i + 3] !== 0) {
        if (
          !(
            colorLayer.data[i] === matchColor.r &&
            colorLayer.data[i + 1] === matchColor.g &&
            colorLayer.data[i + 2] === matchColor.b &&
            colorLayer.data[i + 3] === matchColor.a
          )
        ) {
          colorLayer.data[i] = 0
          colorLayer.data[i + 1] = 0
          colorLayer.data[i + 2] = 0
          colorLayer.data[i + 3] = 0
        }
      }
    }

    return colorLayer
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //Initial step
      //create new layer temporarily
      const layer = canvas.createNewRasterLayer("Replacement Layer")
      //create isolated color map for color replacement
      const isolatedColorLayer = createMapForSpecificColor(canvas.currentLayer)
      layer.ctx.putImageData(isolatedColorLayer, 0, 0)
      //store reference to current layer
      canvas.tempLayer = canvas.currentLayer
      //layer must be in canvas.layers for draw to show in real time
      const currentLayerIndex = canvas.layers.indexOf(canvas.currentLayer)
      //add layer at position just on top of current layer
      canvas.layers.splice(currentLayerIndex + 1, 0, layer)
      //set new layer to current layer so it can be drawn onto
      canvas.currentLayer = layer
      //Non-transparent pixels on color replacement layer will be drawn over by the new color by setting globalCompositeOperation = "source-atop"
      canvas.currentLayer.ctx.save()
      canvas.currentLayer.ctx.globalCompositeOperation = "source-atop"
      break
    case "pointerup":
    case "pointerout":
      //Final step
      canvas.currentLayer.ctx.restore()
      //Merge the Replacement Layer onto the actual current layer being stored in canvas.tempLayer
      //TODO: instead of drawing the image here, iterate through currentlayer and save points to timeline for every pixel that matches current color
      // can use similar code to createMapForSpecificColor except if it matches color push x and y to an array similar to how the draw action works
      canvas.tempLayer.ctx.drawImage(canvas.currentLayer.cvs, 0, 0) //SOON TO BE DEPRECATED
      //Remove the Replacement Layer from the array of layers
      const replacementLayerIndex = canvas.layers.indexOf(canvas.currentLayer)
      canvas.layers.splice(replacementLayerIndex, 1)
      //Set the current layer back to the correct layer
      canvas.currentLayer = canvas.tempLayer
      let image = new Image() //SOON TO BE DEPRECATED
      image.src = canvas.currentLayer.cvs.toDataURL() //SOON TO BE DEPRECATED
      //TODO: refactor so adding to timeline is performed by controller function
      state.addToTimeline({
        tool: state.tool,
        layer: canvas.currentLayer,
        properties: {
          image,
          width: canvas.currentLayer.cvs.width,
          height: canvas.currentLayer.cvs.height,
        },
      }) //SOON TO BE DEPRECATED - replace with
    //state.addToTimeline({
    //   tool: state.tool,
    //   x: state.cursorX,
    //   y: state.cursorY,
    //   layer: canvas.currentLayer,
    // }) on each pixel of color matched map
    default:
      //No default
      break
  }
}

/**
 * TODO: BUG: if canvas is resized and fill point exists outside canvas area, fill will not render when timeline is redrawn
 * User action for process to fill a contiguous color
 * @param {*} startX
 * @param {*} startY
 * @param {*} currentColor
 * @param {*} ctx
 * @param {*} currentMode
 * @returns
 */
export function actionFill(startX, startY, currentColor, ctx, currentMode) {
  //exit if outside borders
  if (
    startX < 0 ||
    startX >= canvas.offScreenCVS.width ||
    startY < 0 ||
    startY >= canvas.offScreenCVS.height
  ) {
    return
  }
  //TODO: actions should not use state directly to maintain timeline integrity
  //get imageData
  state.localColorLayer = ctx.getImageData(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )

  state.clickedColor = canvas.getColor(startX, startY, state.localColorLayer)

  if (currentMode === "erase")
    currentColor = { color: "rgba(0,0,0,0)", r: 0, g: 0, b: 0, a: 0 }

  //exit if color is the same
  if (currentColor.color === state.clickedColor.color) {
    return
  }
  //Start with click coords
  let pixelStack = [[startX, startY]]
  let newPos, x, y, pixelPos, reachLeft, reachRight
  floodFill()
  //render floodFill result
  ctx.putImageData(state.localColorLayer, 0, 0)

  //helpers
  function matchStartColor(pixelPos) {
    let r = state.localColorLayer.data[pixelPos]
    let g = state.localColorLayer.data[pixelPos + 1]
    let b = state.localColorLayer.data[pixelPos + 2]
    let a = state.localColorLayer.data[pixelPos + 3]
    return (
      r === state.clickedColor.r &&
      g === state.clickedColor.g &&
      b === state.clickedColor.b &&
      a === state.clickedColor.a
    )
  }

  function colorPixel(pixelPos) {
    state.localColorLayer.data[pixelPos] = currentColor.r
    state.localColorLayer.data[pixelPos + 1] = currentColor.g
    state.localColorLayer.data[pixelPos + 2] = currentColor.b
    //not ideal
    state.localColorLayer.data[pixelPos + 3] = currentColor.a
  }

  function floodFill() {
    newPos = pixelStack.pop()
    x = newPos[0]
    y = newPos[1]

    //get current pixel position
    pixelPos = (y * canvas.offScreenCVS.width + x) * 4
    // Go up as long as the color matches and are inside the canvas
    while (y >= 0 && matchStartColor(pixelPos)) {
      y--
      pixelPos -= canvas.offScreenCVS.width * 4
    }
    //Don't overextend
    pixelPos += canvas.offScreenCVS.width * 4
    y++
    reachLeft = false
    reachRight = false
    // Go down as long as the color matches and in inside the canvas
    while (y < canvas.offScreenCVS.height && matchStartColor(pixelPos)) {
      colorPixel(pixelPos)

      if (x > 0) {
        if (matchStartColor(pixelPos - 4)) {
          if (!reachLeft) {
            //Add pixel to stack
            pixelStack.push([x - 1, y])
            reachLeft = true
          }
        } else if (reachLeft) {
          reachLeft = false
        }
      }

      if (x < canvas.offScreenCVS.width - 1) {
        if (matchStartColor(pixelPos + 4)) {
          if (!reachRight) {
            //Add pixel to stack
            pixelStack.push([x + 1, y])
            reachRight = true
          }
        } else if (reachRight) {
          reachRight = false
        }
      }
      y++
      pixelPos += canvas.offScreenCVS.width * 4
    }

    if (pixelStack.length) {
      floodFill()
    }
  }
}

/**
 * Helper function. TODO: move to external helper file for rendering
 * To render a pixel perfect curve, points are plotted instead of using t values, which are not equidistant.
 * @param {*} points
 * @param {*} brushStamp
 * @param {*} currentColor
 * @param {*} weight
 * @param {*} ctx
 * @param {*} currentMode
 * @param {*} scale
 */
function renderPoints(
  points,
  brushStamp,
  currentColor,
  weight,
  ctx,
  currentMode,
  scale
) {
  function plot(point) {
    //rounded values
    let xt = Math.floor(point.x)
    let yt = Math.floor(point.y)
    // let brushOffset = Math.floor(weight / 2) * scale;
    // let randomColor = generateRandomRGB()
    //pass "point" instead of currentColor to visualize segments
    actionDraw(
      xt,
      yt,
      currentColor,
      brushStamp,
      weight,
      ctx,
      currentMode,
      scale
    )
  }
  points.forEach((point) => plot(point))
}

/**
 * User action for process to set control points for quadratic bezier
 * @param {*} startx
 * @param {*} starty
 * @param {*} endx
 * @param {*} endy
 * @param {*} controlx
 * @param {*} controly
 * @param {*} stepNum
 * @param {*} currentColor
 * @param {*} ctx
 * @param {*} currentMode
 * @param {*} brushStamp
 * @param {*} weight
 * @param {*} scale
 */
export function actionQuadraticCurve(
  startx,
  starty,
  endx,
  endy,
  controlx,
  controly,
  stepNum,
  currentColor,
  ctx,
  currentMode,
  brushStamp,
  weight,
  scale = 1
) {
  //force coords to int
  startx = Math.round(startx)
  starty = Math.round(starty)
  endx = Math.round(endx)
  endy = Math.round(endy)
  controlx = Math.round(controlx)
  controly = Math.round(controly)

  ctx.fillStyle = currentColor.color

  //BUG: On touchscreen, hits gradient sign error if first tool used
  if (stepNum === 1) {
    //after defining x0y0
    actionLine(
      startx,
      starty,
      state.cursorWithCanvasOffsetX,
      state.cursorWithCanvasOffsetY,
      currentColor,
      canvas.onScreenCTX,
      currentMode,
      brushStamp,
      weight,
      scale
    )
    vectorGuiState.px2 = state.cursorX
    vectorGuiState.py2 = state.cursorY
  } else if (stepNum === 2) {
    // after defining x2y2, plot quad bezier with x3 and y3 arguments matching x2 and y2
    //onscreen preview curve
    //somehow use rendercurve2 for flatter curves
    let plotPoints = plotQuadBezier(
      startx,
      starty,
      state.cursorWithCanvasOffsetX,
      state.cursorWithCanvasOffsetY,
      endx,
      endy
    )
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      weight,
      ctx,
      currentMode,
      scale
    )
    vectorGuiState.px3 = state.cursorX
    vectorGuiState.py3 = state.cursorY
  } else if (stepNum === 3) {
    //curve after defining x3y3, plot quad bezier with x3 and y3 arguments matching x2 and y2
    let plotPoints = plotQuadBezier(
      startx,
      starty,
      controlx,
      controly,
      endx,
      endy
    )
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      weight,
      ctx,
      currentMode,
      scale
    )
  }
}

/**
 * User action for process to set control points for cubic bezier
 * @param {*} startx
 * @param {*} starty
 * @param {*} endx
 * @param {*} endy
 * @param {*} controlx1
 * @param {*} controly1
 * @param {*} controlx2
 * @param {*} controly2
 * @param {*} stepNum
 * @param {*} currentColor
 * @param {*} ctx
 * @param {*} currentMode
 * @param {*} brushStamp
 * @param {*} weight
 * @param {*} scale
 */
export function actionCubicCurve(
  startx,
  starty,
  endx,
  endy,
  controlx1,
  controly1,
  controlx2,
  controly2,
  stepNum,
  currentColor,
  ctx,
  currentMode,
  brushStamp,
  weight,
  scale = 1
) {
  //force coords to int
  startx = Math.round(startx)
  starty = Math.round(starty)
  controlx1 = Math.round(controlx1)
  controly1 = Math.round(controly1)
  controlx2 = Math.round(controlx2)
  controly2 = Math.round(controly2)
  endx = Math.round(endx)
  endy = Math.round(endy)

  ctx.fillStyle = currentColor.color

  //BUG: On touchscreen, hits gradient sign error if first tool used
  if (stepNum === 1) {
    //after defining x0y0
    actionLine(
      startx,
      starty,
      state.cursorWithCanvasOffsetX,
      state.cursorWithCanvasOffsetY,
      currentColor,
      canvas.onScreenCTX,
      currentMode,
      brushStamp,
      weight,
      scale
    )
    vectorGuiState.px2 = state.cursorX
    vectorGuiState.py2 = state.cursorY
  } else if (stepNum === 2) {
    // after defining x2y2
    //onscreen preview curve
    //somehow use rendercurve2 for flatter curves
    let plotPoints = plotQuadBezier(
      startx,
      starty,
      state.cursorWithCanvasOffsetX,
      state.cursorWithCanvasOffsetY,
      endx,
      endy
    )
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      weight,
      ctx,
      currentMode,
      scale
    )
    vectorGuiState.px3 = state.cursorX
    vectorGuiState.py3 = state.cursorY
  } else if (stepNum === 3) {
    //curve after defining x3y3
    //onscreen preview curve
    let plotPoints = plotCubicBezier(
      startx,
      starty,
      controlx1,
      controly1,
      state.cursorWithCanvasOffsetX,
      state.cursorWithCanvasOffsetY,
      endx,
      endy
    )
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      weight,
      ctx,
      currentMode,
      scale
    )
    vectorGuiState.px4 = state.cursorX
    vectorGuiState.py4 = state.cursorY
  } else if (stepNum === 4) {
    //curve after defining x4y4
    if (state.debugger) {
      slowPlotCubicBezier(
        startx,
        starty,
        controlx1,
        controly1,
        controlx2,
        controly2,
        endx,
        endy,
        brushStamp,
        currentColor,
        weight,
        ctx,
        currentMode,
        scale
      )
    } else {
      let plotPoints = plotCubicBezier(
        startx,
        starty,
        controlx1,
        controly1,
        controlx2,
        controly2,
        endx,
        endy
      )
      renderPoints(
        plotPoints,
        brushStamp,
        currentColor,
        weight,
        ctx,
        currentMode,
        scale
      )
    }
  }
}

/**
 * User action for process to set control points for cubic bezier
 * @param {*} centerx
 * @param {*} centery
 * @param {*} xa
 * @param {*} ya
 * @param {*} xb
 * @param {*} yb
 * @param {*} stepNum
 * @param {*} currentColor
 * @param {*} ctx
 * @param {*} currentMode
 * @param {*} brushStamp
 * @param {*} weight
 * @param {*} scale
 */
export function actionEllipse(
  centerx,
  centery,
  xa,
  ya,
  xb,
  yb,
  ra,
  rb,
  forceCircle,
  currentColor,
  ctx,
  currentMode,
  brushStamp,
  weight,
  scale = 1,
  angle,
  offset,
  x1Offset,
  y1Offset
) {
  //force coords to int
  centerx = Math.floor(centerx)
  centery = Math.floor(centery)
  xa = Math.floor(xa)
  ya = Math.floor(ya)
  xb = Math.floor(xb)
  yb = Math.floor(yb)

  ctx.fillStyle = currentColor.color

  if (forceCircle) {
    let plotPoints = plotCircle(centerx + 0.5, centery + 0.5, ra, offset)
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      weight,
      ctx,
      currentMode,
      scale
    )
  } else {
    let plotPoints = plotRotatedEllipse(
      centerx,
      centery,
      ra,
      rb,
      angle,
      xa,
      ya,
      x1Offset,
      y1Offset
    )
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      weight,
      ctx,
      currentMode,
      scale
    )
  }
}

/**
 * Step through cubic bezier in debug mode, sets debug function and debug object
 * @param {*} x0
 * @param {*} y0
 * @param {*} x1
 * @param {*} y1
 * @param {*} x2
 * @param {*} y2
 * @param {*} x3
 * @param {*} y3
 * @param {*} brushStamp
 * @param {*} currentColor
 * @param {*} weight
 * @param {*} ctx
 * @param {*} currentMode
 * @param {*} scale
 */
function slowPlotCubicBezier(
  x0,
  y0,
  x1,
  y1,
  x2,
  y2,
  x3,
  y3,
  brushStamp,
  currentColor,
  weight,
  ctx,
  currentMode,
  scale
) {
  function stepPlotCubicBezier(instructionsObject) {
    const {
      x0,
      y0,
      x1,
      y1,
      x2,
      y2,
      x3,
      y3,
      brushStamp,
      currentColor,
      weight,
      ctx,
      currentMode,
      scale,
      maxSteps,
    } = instructionsObject
    let plotPoints = plotCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3, maxSteps)
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      weight,
      ctx,
      currentMode,
      scale
    )
    canvas.draw()
  }
  state.debugObject = {
    x0,
    y0,
    x1,
    y1,
    x2,
    y2,
    x3,
    y3,
    brushStamp,
    currentColor,
    weight,
    ctx,
    currentMode,
    scale,
    maxSteps: 1,
  }
  state.debugFn = stepPlotCubicBezier
}
