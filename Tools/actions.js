import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { tools } from "./index.js"
import { getTriangle, getAngle } from "../utils/trig.js"
import { plotCubicBezier, plotQuadBezier } from "../utils/bezier.js"
import { generateRandomRGB } from "../utils/colors.js"
import { vectorGui } from "../GUI/vector.js"
import { plotCircle, plotRotatedEllipse } from "../utils/ellipse.js"
import { renderCanvas } from "../Canvas/render.js"
import { createNewRasterLayer } from "../Canvas/layers.js"
import { getColor } from "../utils/canvasHelpers.js"

//====================================//
//===== * * * Tool Actions * * * =====//
//====================================//

//"Actions" are user-initiated events that are reversible through the undo button. This file holds the functions used for reversible actions.
//TODO: Not all reversible actions are held here currently. Clear canvas and addLayer are not present, but those don't interact with the cursor.

/**
 * Modify action in the timeline
 * Only good for vector parameters
 * @param {*} actionIndex
 */
export function modifyAction(actionIndex) {
  let action = state.undoStack[actionIndex][0]
  let oldProperties = {
    ...action.properties,
  } //shallow copy, properties must not contain any objects or references as values
  let modifiedProperties = {
    ...action.properties,
  } //shallow copy, must make deep copy, at least for x, y and properties
  modifiedProperties = { ...state.vectorProperties }
  if (action.tool.name === "ellipse") {
    modifiedProperties.forceCircle =
      vectorGui.selectedPoint.xKey === "px1"
        ? modifiedProperties.forceCircle
        : state.vectorProperties.forceCircle
  }
  state.addToTimeline({
    tool: tools.modify,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      moddedActionIndex: actionIndex,
      from: oldProperties,
      to: modifiedProperties,
    },
  })
  action.properties = {
    ...modifiedProperties,
  }
}

/**
 * Modify action in the timeline
 * Only good for vector parameters
 * @param {*} actionIndex
 * @param {*} newColor - color object {color, r, g, b, a}
 */
export function changeActionColor(actionIndex, newColor) {
  let action = state.undoStack[actionIndex][0]
  let oldColor = {
    ...action.color,
  } //shallow copy, color must not contain any objects or references as values
  let modifiedColor = {
    ...newColor,
  } //shallow copy, must make deep copy, at least for x, y and properties
  state.addToTimeline({
    tool: tools.changeColor,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      moddedActionIndex: actionIndex,
      from: oldColor,
      to: modifiedColor,
    },
  })
  action.color = {
    ...modifiedColor,
  }
}

/**
 * Modify action in the timeline
 * @param {*} actionIndex
 */
export function removeAction(actionIndex) {
  let action = state.undoStack[actionIndex][0]
  state.addToTimeline({
    tool: tools.remove,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      moddedActionIndex: actionIndex,
      from: false,
      to: true,
    },
  })
  action.removed = true
}

/**
 * Modify actions in the timeline
 * Sets all actions before it except for action index 0 to removed = true
 */
export function actionClear() {
  let upToIndex = state.undoStack.length - 1
  state.addToTimeline({
    tool: tools.clear,
    layer: canvas.currentLayer,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      upToIndex,
    },
  })
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    if (i > upToIndex) {
      return
    }
    i++
    action.forEach((p) => {
      if (p.layer === canvas.currentLayer) {
        p.removed = true
      }
    })
  })
}

/**
 * Render a stamp from the brush to the canvas
 * TODO: Find more efficient way to draw any brush shape without drawing each pixel separately. Could either be image stamp or made with rectangles
 * @param {*} coordX
 * @param {*} coordY
 * @param {*} currentColor
 * @param {*} brushStamp
 * @param {*} weight
 * @param {*} ctx
 * @param {*} currentMode
 */
export function actionDraw(
  coordX,
  coordY,
  currentColor,
  brushStamp,
  weight,
  ctx,
  currentMode
) {
  ctx.fillStyle = currentColor.color
  switch (currentMode) {
    case "erase":
      brushStamp.forEach((r) => {
        ctx.clearRect(
          Math.ceil(coordX - weight / 2) + r.x,
          Math.ceil(coordY - weight / 2) + r.y,
          r.w,
          r.h
        )
      })
      break
    default:
      // ctx.fillRect(Math.ceil(coordX - weight / 2), Math.ceil(coordY - weight / 2), weight, weight);
      brushStamp.forEach((r) => {
        ctx.fillRect(
          Math.ceil(coordX - weight / 2) + r.x,
          Math.ceil(coordY - weight / 2) + r.y,
          r.w,
          r.h
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
  weight
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
      currentMode
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
    currentMode
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
    renderCanvas()
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
   * @param {*} matchColor - color to isolate
   * @param {boolean} removeColor - if true, this function will remove only the matched color instead of removing everything else
   * @returns
   */
  function createMapForSpecificColor(
    currentLayer,
    matchColor,
    removeColor = false
  ) {
    const colorLayer = currentLayer.ctx.getImageData(
      0,
      0,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height
    )
    //iterate over pixel data and remove non-matching colors
    for (let i = 0; i < colorLayer.data.length; i += 4) {
      //sample color and by default, color will be removed if not a match. If removeColor is true, color will be removed if it is a match.
      if (colorLayer.data[i + 3] !== 0) {
        let matchedColor =
          colorLayer.data[i] === matchColor.r &&
          colorLayer.data[i + 1] === matchColor.g &&
          colorLayer.data[i + 2] === matchColor.b &&
          colorLayer.data[i + 3] === matchColor.a
        if (removeColor) {
          matchedColor = !matchedColor
        }
        if (!matchedColor) {
          colorLayer.data[i] = 0
          colorLayer.data[i + 1] = 0
          colorLayer.data[i + 2] = 0
          colorLayer.data[i + 3] = 0
        }
      }
    }

    return colorLayer
  }
  //creates a weird bubble effect if brushSize is larger than 1.
  //This function is inefficient due to saving thousands of points at larger canvas sizes, but parts may be useful later for implementing some kind of special "growth" feature for the bubble effect.
  // function savePointsForSpecificColor(
  //   currentLayer,
  //   tempLayer,
  //   bubble = false, //For accurate render, brushSize should be 1. Larger numbers will create bubble effect
  //   invert = false
  // ) {
  //   const colorLayer = currentLayer.ctx.getImageData(
  //     0,
  //     0,
  //     canvas.offScreenCVS.width,
  //     canvas.offScreenCVS.height
  //   )
  //   const matchColor = swatches.secondary.color
  //   const width = canvas.offScreenCVS.width
  //   const brushSize = bubble ? state.tool.brushSize : 1
  //   const brushStamp = drawCircle(brushSize)
  //   //iterate over pixel data and remove non-matching colors
  //   for (let i = 0; i < colorLayer.data.length; i += 4) {
  //     //sample color and remove if not match
  //     if (colorLayer.data[i + 3] !== 0) {
  //       let matchedPrimary = !(
  //         colorLayer.data[i] === matchColor.r &&
  //         colorLayer.data[i + 1] === matchColor.g &&
  //         colorLayer.data[i + 2] === matchColor.b &&
  //         colorLayer.data[i + 3] === matchColor.a
  //       )
  //       if (invert) {
  //         matchedPrimary = !matchedPrimary
  //       }
  //       if (matchedPrimary) {
  //         // calculate x and y
  //         const x = (i / 4) % width
  //         const y = Math.floor(i / 4 / width)
  //         let color = {
  //           color: `rgba(${colorLayer.data[i]},${colorLayer.data[i + 1]},${
  //             colorLayer.data[i + 2]
  //           },${colorLayer.data[i + 3]})`,
  //           r: colorLayer.data[i],
  //           g: colorLayer.data[i + 1],
  //           b: colorLayer.data[i + 2],
  //           a: colorLayer.data[i + 3],
  //         }
  //         if (invert) {
  //           color = swatches.primary.color
  //         }
  //         actionDraw(
  //           x,
  //           y,
  //           color,
  //           brushStamp,
  //           brushSize,
  //           tempLayer.ctx,
  //           state.mode
  //         )
  //         state.addToTimeline({
  //           tool: tools.brush,
  //           x,
  //           y,
  //           color,
  //           brushStamp,
  //           brushSize,
  //           layer: tempLayer,
  //         })
  //       }
  //     }
  //   }
  // }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //Initial step
      //create new layer temporarily
      const layer = createNewRasterLayer("Replacement Layer")
      //create isolated color map for color replacement
      const isolatedColorLayer = createMapForSpecificColor(
        canvas.currentLayer,
        swatches.secondary.color
      )
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
      if (canvas.tempLayer) {
        canvas.currentLayer.ctx.restore()
        //save only the drawn pixels to the temporary current canvas
        const isolatedDrawnColorLayer = createMapForSpecificColor(
          canvas.currentLayer,
          swatches.secondary.color,
          true
        )
        canvas.currentLayer.ctx.putImageData(isolatedDrawnColorLayer, 0, 0)
        //Merge the Replacement Layer onto the actual current layer being stored in canvas.tempLayer
        canvas.tempLayer.ctx.drawImage(canvas.currentLayer.cvs, 0, 0)
        //save only the changed pixels to image
        let image = new Image()
        image.src = canvas.currentLayer.cvs.toDataURL()
        // savePointsForSpecificColor(canvas.currentLayer, canvas.tempLayer)
        //Remove the Replacement Layer from the array of layers
        const replacementLayerIndex = canvas.layers.indexOf(canvas.currentLayer)
        canvas.layers.splice(replacementLayerIndex, 1)
        //Set the current layer back to the correct layer
        canvas.currentLayer = canvas.tempLayer
        canvas.tempLayer = null
        //TODO: One potential optimization is to save the bounding box coordinates
        //and add them to the properties so when rendering in the timeline it only
        //draws in the bounding box area instead of the whole canvas area
        state.addToTimeline({
          tool: state.tool,
          layer: canvas.currentLayer,
          properties: {
            image,
            width: canvas.currentLayer.cvs.width,
            height: canvas.currentLayer.cvs.height,
          },
        })
      }
    default:
      //No default
      break
  }
}

/**
 * NOTE: if canvas is resized and fill point exists outside canvas area, fill will not render when timeline is redrawn
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

  state.clickedColor = getColor(startX, startY, state.localColorLayer)

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
 */
function renderPoints(
  points,
  brushStamp,
  currentColor,
  weight,
  ctx,
  currentMode
) {
  function plot(point) {
    //rounded values
    let xt = Math.floor(point.x)
    let yt = Math.floor(point.y)
    // let randomColor = generateRandomRGB()
    //pass "point" instead of currentColor to visualize segments
    actionDraw(xt, yt, currentColor, brushStamp, weight, ctx, currentMode)
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
  weight
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
      weight
    )
    state.vectorProperties.px2 = state.cursorX
    state.vectorProperties.py2 = state.cursorY
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
    renderPoints(plotPoints, brushStamp, currentColor, weight, ctx, currentMode)
    state.vectorProperties.px3 = state.cursorX
    state.vectorProperties.py3 = state.cursorY
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
    renderPoints(plotPoints, brushStamp, currentColor, weight, ctx, currentMode)
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
  weight
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
      weight
    )
    //TODO: can setting state be moved to steps function?
    state.vectorProperties.px2 = state.cursorX
    state.vectorProperties.py2 = state.cursorY
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
    renderPoints(plotPoints, brushStamp, currentColor, weight, ctx, currentMode)
    state.vectorProperties.px3 = state.cursorX
    state.vectorProperties.py3 = state.cursorY
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
    renderPoints(plotPoints, brushStamp, currentColor, weight, ctx, currentMode)
    state.vectorProperties.px4 = state.cursorX
    state.vectorProperties.py4 = state.cursorY
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
        currentMode
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
        currentMode
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
 * @param {*} angle
 * @param {*} offset
 * @param {*} x1Offset
 * @param {*} y1Offset
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
    renderPoints(plotPoints, brushStamp, currentColor, weight, ctx, currentMode)
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
    renderPoints(plotPoints, brushStamp, currentColor, weight, ctx, currentMode)
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
  currentMode
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
      maxSteps,
    } = instructionsObject
    let plotPoints = plotCubicBezier(x0, y0, x1, y1, x2, y2, x3, y3, maxSteps)
    renderPoints(plotPoints, brushStamp, currentColor, weight, ctx, currentMode)
    renderCanvas()
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
    maxSteps: 1,
  }
  state.debugFn = stepPlotCubicBezier
}
