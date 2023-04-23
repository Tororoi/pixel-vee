import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { getTriangle, getAngle } from "../utils/trig.js"

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
      state.addToTimeline(
        state.tool.name,
        state.lastDrawnX,
        state.lastDrawnY,
        canvas.currentLayer
      )
    }
    canvas.draw()
  } else {
    state.waitingPixelX = currentX
    state.waitingPixelY = currentY
  }
}

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
      canvas.tempLayer.ctx.drawImage(canvas.currentLayer.cvs, 0, 0)
      //Remove the Replacement Layer from the array of layers
      const replacementLayerIndex = canvas.layers.indexOf(canvas.currentLayer)
      canvas.layers.splice(replacementLayerIndex, 1)
      //Set the current layer back to the correct layer
      canvas.currentLayer = canvas.tempLayer
      let image = new Image()
      image.src = canvas.currentLayer.cvs.toDataURL()
      //TODO: refactor so adding to timeline is performed by controller function
      state.addToTimeline(
        state.tool.name,
        0,
        0,
        canvas.currentLayer,
        image,
        canvas.currentLayer.cvs.width,
        canvas.currentLayer.cvs.height
      )
    default:
      //No default
      break
  }
}

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

export function actionCurve(
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
  function renderCurve(controlX, controlY) {
    function plot(x, y) {
      //rounded values
      let xt = Math.floor(x)
      let yt = Math.floor(y)
      // let brushOffset = Math.floor(weight / 2) * scale;
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
      // if (currentMode === "erase") {
      //     ctx.clearRect(xt * scale - brushOffset, yt * scale - brushOffset, scale * weight, scale * weight);
      // } else {
      //     ctx.fillRect(xt * scale - brushOffset, yt * scale - brushOffset, scale * weight, scale * weight);
      // }
    }

    function assert(condition, message) {
      if (!condition) {
        throw new Error(message || "Assertion failed")
      }
    }

    //p1, p2 are global endpoints
    plotQuadBezier(startx, starty, controlX, controlY, endx, endy)

    function plotQuadBezier(x0, y0, x1, y1, x2, y2) {
      /* plot any quadratic Bezier curve */
      let x = x0 - x1,
        y = y0 - y1
      let t = x0 - 2 * x1 + x2,
        r
      if (x * (x2 - x1) > 0) {
        /* horizontal cut at P4? */
        if (y * (y2 - y1) > 0)
          if (Math.abs(((y0 - 2 * y1 + y2) * x) / t) > Math.abs(y)) {
            /* vertical cut at P6 too? */
            /* which first? */
            x0 = x2
            x2 = x + x1
            y0 = y2
            y2 = y + y1 /* swap points */
          } /* now horizontal cut at P4 comes first */
        t = (x0 - x1) / t
        r = (1 - t) * ((1 - t) * y0 + 2.0 * t * y1) + t * t * y2 /* By(t=P4) */
        t = ((x0 * x2 - x1 * x1) * t) / (x0 - x1) /* gradient dP4/dx=0 */
        x = Math.floor(t + 0.5)
        y = Math.floor(r + 0.5)
        r = ((y1 - y0) * (t - x0)) / (x1 - x0) + y0 /* intersect P3 | P0 P1 */
        plotQuadBezierSeg(x0, y0, x, Math.floor(r + 0.5), x, y)
        r = ((y1 - y2) * (t - x2)) / (x1 - x2) + y2 /* intersect P4 | P1 P2 */
        x0 = x1 = x
        y0 = y
        y1 = Math.floor(r + 0.5) /* P0 = P4, P1 = P8 */
      }
      if ((y0 - y1) * (y2 - y1) > 0) {
        /* vertical cut at P6? */
        t = y0 - 2 * y1 + y2
        t = (y0 - y1) / t
        r = (1 - t) * ((1 - t) * x0 + 2.0 * t * x1) + t * t * x2 /* Bx(t=P6) */
        t = ((y0 * y2 - y1 * y1) * t) / (y0 - y1) /* gradient dP6/dy=0 */
        x = Math.floor(r + 0.5)
        y = Math.floor(t + 0.5)
        r = ((x1 - x0) * (t - y0)) / (y1 - y0) + x0 /* intersect P6 | P0 P1 */
        plotQuadBezierSeg(x0, y0, Math.floor(r + 0.5), y, x, y)
        r = ((x1 - x2) * (t - y2)) / (y1 - y2) + x2 /* intersect P7 | P1 P2 */
        x0 = x
        x1 = Math.floor(r + 0.5)
        y0 = y1 = y /* P0 = P6, P1 = P7 */
      }
      plotQuadBezierSeg(x0, y0, x1, y1, x2, y2) /* remaining part */
    }

    //Bresenham's algorithm for bezier limited to gradients without sign change.
    function plotQuadBezierSeg(x0, y0, x1, y1, x2, y2) {
      let sx = x2 - x1,
        sy = y2 - y1
      let xx = x0 - x1,
        yy = y0 - y1,
        xy /* relative values for checks */
      let dx,
        dy,
        err,
        cur = xx * sy - yy * sx /* curvature */

      assert(
        xx * sx <= 0 && yy * sy <= 0,
        "sign of gradient must not change"
      ) /* sign of gradient must not change */

      if (sx * sx + sy * sy > xx * xx + yy * yy) {
        /* begin with longer part */
        x2 = x0
        x0 = sx + x1
        y2 = y0
        y0 = sy + y1
        cur = -cur /* swap P0 P2 */
      }
      if (cur != 0) {
        /* no straight line */
        xx += sx
        xx *= sx = x0 < x2 ? 1 : -1 /* x step direction */
        yy += sy
        yy *= sy = y0 < y2 ? 1 : -1 /* y step direction */
        xy = 2 * xx * yy
        xx *= xx
        yy *= yy /* differences 2nd degree */
        if (cur * sx * sy < 0) {
          /* negated curvature? */
          xx = -xx
          yy = -yy
          xy = -xy
          cur = -cur
        }
        dx = 4.0 * sy * cur * (x1 - x0) + xx - xy /* differences 1st degree */
        dy = 4.0 * sx * cur * (y0 - y1) + yy - xy
        xx += xx
        yy += yy
        err = dx + dy + xy /* error 1st step */
        while (dy < dx) {
          /* gradient negates -> algorithm fails */
          plot(x0, y0) /* plot curve */
          if (x0 == x2 && y0 == y2) return /* last pixel -> curve finished */
          y1 = 2 * err < dx /* save value for test of y step */
          if (2 * err > dy) {
            x0 += sx
            dx -= xy
            err += dy += yy
          } /* x step */
          if (y1) {
            y0 += sy
            dy -= xy
            err += dx += xx
          } /* y step */
        }
      }
      /* plot remaining part to end */
      if (stepNum === 2 || stepNum === 3) {
        let angle = getAngle(x2 - x0, y2 - y0) // angle of line
        let tri = getTriangle(x0, y0, x2, y2, angle)

        for (let i = 0; i < tri.long; i++) {
          let thispoint = {
            x: Math.round(x0 + tri.x * i),
            y: Math.round(y0 + tri.y * i),
          }
          // for each point along the line
          plot(thispoint.x, thispoint.y)
        }
        //fill endpoint
        plot(x2, y2)
      } else if (stepNum === 4) {
        actionLine(
          x0,
          y0,
          x2,
          y2,
          currentColor,
          ctx,
          currentMode,
          brushStamp,
          weight,
          scale
        )
      }
    }
  }

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
  } else if (stepNum === 2 || stepNum === 3) {
    // after defining x2y2
    //onscreen preview curve
    //somehow use rendercurve2 for flatter curves
    renderCurve(state.cursorWithCanvasOffsetX, state.cursorWithCanvasOffsetY)
  } else if (stepNum === 4) {
    //curve after defining x3y3
    renderCurve(controlx, controly)
  }
}
