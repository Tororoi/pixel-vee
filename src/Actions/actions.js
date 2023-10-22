import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { tools } from "../Tools/index.js"
import { getTriangle, getAngle } from "../utils/trig.js"
import { plotCubicBezier, plotQuadBezier } from "../utils/bezier.js"
import { vectorGui } from "../GUI/vector.js"
import { plotCircle, plotRotatedEllipse } from "../utils/ellipse.js"
import { getColor } from "../utils/canvasHelpers.js"
import { colorPixel, matchStartColor } from "../utils/imageDataHelpers.js"
import { renderCanvas } from "../Canvas/render.js"

//====================================//
//===== * * * Tool Actions * * * =====//
//====================================//

//"Actions" are user-initiated events that are reversible through the undo button. This file holds the functions used for reversible actions.
//TODO: Not all reversible actions are held here currently. Clear canvas and addLayer are not present, but those don't interact with the cursor.

/**
 * Modify action in the timeline
 * Only good for vector parameters
 * @param {Integer} actionIndex
 */
export function modifyVectorAction(actionIndex) {
  let action = state.undoStack[actionIndex]
  let oldProperties = {
    ...action.properties.vectorProperties,
  } //shallow copy, properties must not contain any objects or references as values
  let modifiedProperties = {
    ...action.properties.vectorProperties,
  } //shallow copy, must make deep copy, at least for x, y and properties
  modifiedProperties = { ...state.vectorProperties }
  if (action.tool.name === "ellipse") {
    modifiedProperties.forceCircle =
      vectorGui.selectedPoint.xKey === "px1"
        ? oldProperties.forceCircle
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
  action.properties.vectorProperties = {
    ...modifiedProperties,
  }
}

/**
 * Modify action in the timeline
 * Only good for vector parameters
 * @param {Integer} actionIndex
 * @param {Object} newColor - {color, r, g, b, a}
 */
export function changeActionColor(actionIndex, newColor) {
  let action = state.undoStack[actionIndex]
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
 * @param {Integer} actionIndex
 */
export function removeAction(actionIndex) {
  let action = state.undoStack[actionIndex]
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
 * @param {Object} layer
 */
export function actionClear(layer) {
  let upToIndex = state.undoStack.length - 1
  state.addToTimeline({
    tool: tools.clear,
    layer: layer,
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
    if (action.layer === layer) {
      action.removed = true
    }
  })
}

/**
 * Render a stamp from the brush to the canvas
 * TODO: Find more efficient way to draw any brush shape without drawing each pixel separately. Could either be image stamp or made with rectangles
 * @param {Integer} coordX
 * @param {Integer} coordY
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} brushStamp
 * @param {Integer} brushSize
 * @param {CanvasRenderingContext2D} ctx
 * @param {String} currentMode
 * @param {Set} seenPointsSet
 * @param {Array} points
 * @param {Boolean} excludeFromSet - even if new point, don't add to seenPointsSet if true
 */
export function actionDraw(
  coordX,
  coordY,
  currentColor,
  brushStamp,
  brushStampDir,
  brushSize,
  ctx,
  currentMode,
  seenPointsSet = null,
  points = null,
  excludeFromSet = false
) {
  ctx.fillStyle = currentColor.color
  if (points) {
    if (!state.pointsSet.has(`${coordX},${coordY}`)) {
      points.push({
        x: coordX,
        y: coordY,
        color: { ...currentColor },
        brushStamp,
        brushSize,
      })
      state.pointsSet.add(`${coordX},${coordY}`)
    }
  }
  if (
    coordX >= ctx.canvas.width + brushSize / 2 ||
    coordX <= -brushSize / 2 ||
    coordY >= ctx.canvas.height + brushSize / 2 ||
    coordY <= -brushSize / 2
  ) {
    //don't draw outside bounds to reduce time cost of render
    return
  }
  const baseX = Math.ceil(coordX - brushSize / 2)
  const baseY = Math.ceil(coordY - brushSize / 2)
  for (const pixel of brushStamp[brushStampDir]) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y

    if (seenPointsSet) {
      const key = `${x},${y}`
      if (seenPointsSet.has(key)) {
        continue // skip this point
      }
      if (!excludeFromSet) {
        seenPointsSet.add(key)
      }
    }
    switch (currentMode) {
      case "erase":
        ctx.clearRect(x, y, 1, 1)
        break
      case "inject":
        ctx.clearRect(x, y, 1, 1)
        ctx.fillRect(x, y, 1, 1)
        break
      default:
        ctx.fillRect(x, y, 1, 1)
    }
  }
}

/**
 * Draws a pixel perfect line from point a to point b
 * @param {Integer} sx
 * @param {Integer} sy
 * @param {Integer} tx
 * @param {Integer} ty
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {CanvasRenderingContext2D} ctx
 * @param {String} currentMode
 * @param {Object} brushStamp
 * @param {Integer} brushSize
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
  brushSize,
  seenPointsSet = null
) {
  ctx.fillStyle = currentColor.color

  let angle = getAngle(tx - sx, ty - sy) // angle of line
  let tri = getTriangle(sx, sy, tx, ty, angle)
  const seen = seenPointsSet ? new Set(seenPointsSet) : new Set()
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
      "0,0",
      brushSize,
      ctx,
      currentMode,
      seen
    )
  }
  //fill endpoint
  actionDraw(
    Math.round(tx),
    Math.round(ty),
    currentColor,
    brushStamp,
    "0,0",
    brushSize,
    ctx,
    currentMode,
    seen
  )
}

/**
 * NOTE: if canvas is resized and fill point exists outside canvas area, fill will not render when timeline is redrawn
 * User action for process to fill a contiguous color
 * @param {Integer} startX
 * @param {Integer} startY
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} layer
 * @param {String} currentMode
 * @param {Object} selectProperties
 * @param {Set} maskSet
 * @returns
 */
export function actionFill(
  startX,
  startY,
  currentColor,
  layer,
  currentMode,
  selectProperties,
  maskSet
) {
  let xMin = 0
  let xMax = layer.cvs.width
  let yMin = 0
  let yMax = layer.cvs.height
  if (selectProperties?.px1) {
    const { px1, py1, px2, py2 } = selectProperties
    xMin = Math.max(0, Math.min(px1, px2))
    xMax = Math.min(layer.cvs.width, Math.max(px1, px2))
    yMin = Math.max(0, Math.min(py1, py2))
    yMax = Math.min(layer.cvs.height, Math.max(py1, py2))
  }
  //exit if outside borders
  if (startX < xMin || startX >= xMax || startY < yMin || startY >= yMax) {
    return
  }
  //get imageData
  let layerImageData = layer.ctx.getImageData(
    xMin,
    yMin,
    xMax - xMin,
    yMax - yMin
  )

  let clickedColor = getColor(startX - xMin, startY - yMin, layerImageData)

  if (currentMode === "erase") {
    currentColor = { color: "rgba(0,0,0,0)", r: 0, g: 0, b: 0, a: 0 }
  }

  //exit if color is the same
  if (currentColor.color === clickedColor.color) {
    return
  }
  //Start with click coords
  let pixelStack = [[startX - xMin, startY - yMin]]
  let newPos, x, y, pixelPos, reachLeft, reachRight
  floodFill()
  //render floodFill result
  layer.ctx.putImageData(layerImageData, xMin, yMin)

  //helpers
  function floodFill() {
    newPos = pixelStack.pop()
    x = newPos[0]
    y = newPos[1]
    //get current pixel position
    pixelPos = (y * (xMax - xMin) + x) * 4
    // Go up as long as the color matches and are inside the canvas
    while (y >= 0 && matchStartColor(layerImageData, pixelPos, clickedColor)) {
      y--
      pixelPos -= (xMax - xMin) * 4
    }
    //Don't overextend
    pixelPos += (xMax - xMin) * 4
    y++
    reachLeft = false
    reachRight = false
    // Go down as long as the color matches and in inside the canvas
    while (
      y < yMax - yMin &&
      matchStartColor(layerImageData, pixelPos, clickedColor)
    ) {
      colorPixel(layerImageData, pixelPos, currentColor)

      if (x > 0) {
        if (matchStartColor(layerImageData, pixelPos - 4, clickedColor)) {
          if (!reachLeft) {
            //Add pixel to stack
            pixelStack.push([x - 1, y])
            reachLeft = true
          }
        } else if (reachLeft) {
          reachLeft = false
        }
      }

      if (x < xMax - xMin - 1) {
        if (matchStartColor(layerImageData, pixelPos + 4, clickedColor)) {
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
      pixelPos += (xMax - xMin) * 4
    }

    if (pixelStack.length) {
      floodFill()
    }
  }
}

/**
 * Helper function. TODO: move to external helper file for rendering
 * To render a pixel perfect curve, points are plotted instead of using t values, which are not equidistant.
 * @param {Array} points
 * @param {Object} brushStamp
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Integer} brushSize
 * @param {CanvasRenderingContext2D} ctx
 * @param {String} currentMode
 */
function renderPoints(
  points,
  brushStamp,
  currentColor,
  brushSize,
  ctx,
  currentMode
) {
  const seen = new Set()
  let previousX = Math.floor(points[0].x)
  let previousY = Math.floor(points[0].y)
  //performance: ellipse with a 360px radius and a 32px brush, using the brush direction decreases render time from 148ms to 22ms
  for (const { x, y } of points) {
    //rounded values
    let xt = Math.floor(x)
    let yt = Math.floor(y)
    let xDir = xt - previousX
    let yDir = yt - previousY
    if (xDir < -1 || xDir > 1 || yDir < -1 || yDir > 1) {
      xDir = 0
      yDir = 0
    }
    actionDraw(
      xt,
      yt,
      currentColor,
      brushStamp,
      `${xDir},${yDir}`,
      brushSize,
      ctx,
      currentMode,
      seen
    )
    previousX = xt
    previousY = yt
  }
}

/**
 * User action for process to set control points for quadratic bezier
 * @param {Integer} startx
 * @param {Integer} starty
 * @param {Integer} endx
 * @param {Integer} endy
 * @param {Integer} controlx
 * @param {Integer} controly
 * @param {Integer} stepNum
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {CanvasRenderingContext2D} ctx
 * @param {String} currentMode
 * @param {Object} brushStamp
 * @param {Integer} brushSize
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
  brushSize
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
      state.cursorX,
      state.cursorY,
      currentColor,
      ctx,
      currentMode,
      brushStamp,
      brushSize
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
      state.cursorX,
      state.cursorY,
      endx,
      endy
    )
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      brushSize,
      ctx,
      currentMode
    )
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
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      brushSize,
      ctx,
      currentMode
    )
  }
}

/**
 * User action for process to set control points for cubic bezier
 * @param {Integer} startx
 * @param {Integer} starty
 * @param {Integer} endx
 * @param {Integer} endy
 * @param {Integer} controlx1
 * @param {Integer} controly1
 * @param {Integer} controlx2
 * @param {Integer} controly2
 * @param {Integer} stepNum
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {CanvasRenderingContext2D} ctx
 * @param {String} currentMode
 * @param {Object} brushStamp
 * @param {Integer} brushSize
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
  brushSize
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
      state.cursorX,
      state.cursorY,
      currentColor,
      ctx,
      currentMode,
      brushStamp,
      brushSize
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
      state.cursorX,
      state.cursorY,
      endx,
      endy
    )
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      brushSize,
      ctx,
      currentMode
    )
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
      state.cursorX,
      state.cursorY,
      endx,
      endy
    )
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      brushSize,
      ctx,
      currentMode
    )
    state.vectorProperties.px4 = state.cursorX
    state.vectorProperties.py4 = state.cursorY
  } else if (stepNum === 4) {
    //curve after defining x4y4
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
      brushSize,
      ctx,
      currentMode
    )
  }
}

/**
 * User action for process to set control points for cubic bezier
 * @param {Integer} centerx
 * @param {Integer} centery
 * @param {Integer} xa
 * @param {Integer} ya
 * @param {Integer} xb
 * @param {Integer} yb
 * @param {Integer} stepNum
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {CanvasRenderingContext2D} ctx
 * @param {String} currentMode
 * @param {Object} brushStamp
 * @param {Integer} brushSize
 * @param {Float} angle - Radians
 * @param {Integer} offset
 * @param {Integer} x1Offset
 * @param {Integer} y1Offset
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
  brushSize,
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
      brushSize,
      ctx,
      currentMode
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
      brushSize,
      ctx,
      currentMode
    )
  }
}
