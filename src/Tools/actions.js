import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { tools } from "./index.js"
import { getTriangle, getAngle } from "../utils/trig.js"
import { plotCubicBezier, plotQuadBezier } from "../utils/bezier.js"
import { vectorGui } from "../GUI/vector.js"
import { plotCircle, plotRotatedEllipse } from "../utils/ellipse.js"
import { createNewRasterLayer } from "../Canvas/layers.js"
import { getColor } from "../utils/canvasHelpers.js"
import { colorPixel, matchStartColor } from "../utils/imageDataHelpers.js"

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
  let action = state.undoStack[actionIndex]
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
 * @param {*} actionIndex
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
 * @param {*} coordX
 * @param {*} coordY
 * @param {*} currentColor
 * @param {*} brushStamp
 * @param {*} brushSize
 * @param {*} ctx
 * @param {*} currentMode
 * @param {Set} seenPointsSet
 * @param {Array} points
 * @param {boolean} excludeFromSet - even if new point, don't add to seenPointsSet if true
 */
export function actionDraw(
  coordX,
  coordY,
  currentColor,
  brushStamp,
  brushSize,
  ctx,
  currentMode,
  seenPointsSet = null,
  points = null,
  excludeFromSet = false
) {
  ctx.fillStyle = currentColor.color
  if (points) {
    points.push({
      x: coordX,
      y: coordY,
      color: { ...currentColor },
      brushStamp,
      brushSize,
    })
  }
  brushStamp.forEach((pixel) => {
    const x = Math.ceil(coordX - brushSize / 2) + pixel.x
    const y = Math.ceil(coordY - brushSize / 2) + pixel.y

    if (seenPointsSet) {
      const key = `${x},${y}`
      if (seenPointsSet.has(key)) {
        return // skip this point
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
  })
}

/**
 * Render a stamp from the brush to the canvas
 * Depending on a special option, color could be put directly to canvas or rendered to an offscreen canvas first (rasterGuiCVS)
 * @param {*} coordX
 * @param {*} coordY
 * @param {*} currentColor
 * @param {*} brushStamp
 * @param {*} brushSize
 * @param {*} cvs
 * @param {*} ctx
 * @param {*} currentMode
 * @param {*} imageData
 * @param {*} ignoreInvisible
 * @param {Set} seenPointsSet
 * @param {Array} points
 */
export function actionPut(
  coordX,
  coordY,
  currentColor,
  brushStamp,
  brushSize,
  cvs,
  ctx,
  currentMode,
  imageData,
  ignoreInvisible = false,
  seenPointsSet = null,
  points = null
) {
  if (points) {
    points.push({
      x: coordX,
      y: coordY,
      color: { ...currentColor },
      brushStamp,
      brushSize,
    })
  }
  if (currentMode === "erase")
    currentColor = { color: "rgba(0,0,0,0)", r: 0, g: 0, b: 0, a: 0 }
  brushStamp.forEach((p) => {
    //for each rectangle, given the center point of the overall brush at coordX and coordY, find the pixel's position
    let x = Math.ceil(coordX - brushSize / 2) + p.x
    let y = Math.ceil(coordY - brushSize / 2) + p.y
    // check that pixel is inside canvas area or else it will roll over on image data
    if (x < cvs.width && x >= 0 && y < cvs.height && y >= 0) {
      if (seenPointsSet) {
        const key = `${x},${y}`
        if (seenPointsSet.has(key)) {
          return // skip this point
        }
        seenPointsSet.add(key)
      }
      let pixelPos = (y * cvs.width + x) * 4
      //ignore pixels that are already 0 opacity unless !ignoreInvisible
      if (imageData.data[pixelPos + 3] !== 0 || !ignoreInvisible) {
        colorPixel(imageData, pixelPos, currentColor)
      }
    }
  })
  ctx.putImageData(imageData, 0, 0)
}

/**
 * Draws a pixel perfect line from point a to point b
 * TODO: use actionPut but also create a tempLayer so pixels aren't replaced
 * @param {*} sx
 * @param {*} sy
 * @param {*} tx
 * @param {*} ty
 * @param {*} currentColor
 * @param {*} ctx
 * @param {*} currentMode
 * @param {*} brushStamp
 * @param {*} brushSize
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
    brushSize,
    ctx,
    currentMode,
    seen
  )
}

/**
 * NOTE: if canvas is resized and fill point exists outside canvas area, fill will not render when timeline is redrawn
 * User action for process to fill a contiguous color
 * @param {*} startX
 * @param {*} startY
 * @param {*} currentColor
 * @param {*} layer
 * @param {*} currentMode
 * @returns
 */
export function actionFill(startX, startY, currentColor, layer, currentMode) {
  //exit if outside borders
  if (
    startX < 0 ||
    startX >= layer.cvs.width ||
    startY < 0 ||
    startY >= layer.cvs.height
  ) {
    return
  }
  //get imageData
  let layerImageData = layer.ctx.getImageData(
    0,
    0,
    layer.cvs.width,
    layer.cvs.height
  )

  let clickedColor = getColor(startX, startY, layerImageData)

  if (currentMode === "erase")
    currentColor = { color: "rgba(0,0,0,0)", r: 0, g: 0, b: 0, a: 0 }

  //exit if color is the same
  if (currentColor.color === clickedColor.color) {
    return
  }
  //Start with click coords
  let pixelStack = [[startX, startY]]
  let newPos, x, y, pixelPos, reachLeft, reachRight
  floodFill()
  //render floodFill result
  layer.ctx.putImageData(layerImageData, 0, 0)

  //helpers
  function floodFill() {
    newPos = pixelStack.pop()
    x = newPos[0]
    y = newPos[1]

    //get current pixel position
    pixelPos = (y * layer.cvs.width + x) * 4
    // Go up as long as the color matches and are inside the canvas
    while (y >= 0 && matchStartColor(layerImageData, pixelPos, clickedColor)) {
      y--
      pixelPos -= layer.cvs.width * 4
    }
    //Don't overextend
    pixelPos += layer.cvs.width * 4
    y++
    reachLeft = false
    reachRight = false
    // Go down as long as the color matches and in inside the canvas
    while (
      y < layer.cvs.height &&
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

      if (x < layer.cvs.width - 1) {
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
      pixelPos += layer.cvs.width * 4
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
 * @param {*} brushSize
 * @param {*} ctx
 * @param {*} currentMode
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
  function plot(point) {
    //rounded values
    let xt = Math.floor(point.x)
    let yt = Math.floor(point.y)
    // let randomColor = generateRandomRGB()
    //pass "point" instead of currentColor to visualize segments
    actionDraw(
      xt,
      yt,
      currentColor,
      brushStamp,
      brushSize,
      ctx,
      currentMode,
      seen
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
 * @param {*} brushSize
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
 * @param {*} brushSize
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
 * @param {*} brushSize
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
