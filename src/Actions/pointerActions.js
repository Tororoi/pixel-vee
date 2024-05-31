import { canvas } from "../Context/canvas.js"
import { getTriangle, getAngle } from "../utils/trig.js"
import { plotCubicBezier, plotQuadBezier } from "../utils/bezier.js"
import {
  plotCircle,
  plotRotatedEllipse,
  plotRotatedEllipseConics,
} from "../utils/ellipse.js"
import {
  colorPixel,
  matchStartColor,
  getColor,
} from "../utils/imageDataHelpers.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"
import { isOutOfBounds, minLimit, maxLimit } from "../utils/canvasHelpers.js"

//====================================//
//===== * * * Tool Actions * * * =====//
//====================================//

//"Actions" are user-initiated events that are reversible through the undo button.
//This file holds the functions used for reversible actions as the result of a tool.

/**
 * Render a stamp from the brush to the canvas
 * @param {number} coordX - (Integer)
 * @param {number} coordY - (Integer)
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} directionalBrushStamp - brushStamp[brushDirection]
 * @param {number} brushSize - (Integer)
 * @param {object} layer - the affected layer
 * @param {object} currentModes - {eraser, inject, perfect, colorMask}
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {Set} seenPixelsSet - set of coordinates already drawn on
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by renderCursor and perfect pixels mode
 * @param {boolean} excludeFromSet - don't add to seenPixelsSet if true
 */
export function actionDraw(
  coordX,
  coordY,
  boundaryBox,
  currentColor,
  directionalBrushStamp,
  brushSize,
  layer,
  currentModes,
  maskSet,
  seenPixelsSet,
  customContext = null,
  isPreview = false,
  excludeFromSet = false
) {
  let offsetX = 0
  let offsetY = 0
  let ctx = layer.ctx
  if (customContext) {
    ctx = customContext
  } else if (isPreview) {
    ctx = layer.onscreenCtx
    offsetX = canvas.xOffset
    offsetY = canvas.yOffset
  }
  ctx.fillStyle = currentColor.color
  //check if brush is outside bounds
  if (isOutOfBounds(coordX, coordY, brushSize, layer, boundaryBox)) {
    //don't iterate brush outside bounds to reduce time cost of render
    return
  }
  const baseX = Math.ceil(coordX - brushSize / 2)
  const baseY = Math.ceil(coordY - brushSize / 2)
  for (const pixel of directionalBrushStamp) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y
    if (isOutOfBounds(x, y, 0, layer, boundaryBox)) {
      //don't draw outside bounds to reduce time cost of render
      continue
    }
    const key = `${x},${y}`
    //if maskSet exists, only draw if it contains coordinates
    if (maskSet) {
      if (!maskSet.has(key)) {
        continue
      }
    }
    if (seenPixelsSet) {
      if (seenPixelsSet.has(key)) {
        continue // skip this point
      }
      if (!excludeFromSet) {
        seenPixelsSet.add(key)
      }
    }
    if (currentModes?.eraser || currentModes?.inject) {
      ctx.clearRect(x + offsetX, y + offsetY, 1, 1)
    }
    if (!currentModes?.eraser) {
      ctx.fillRect(x + offsetX, y + offsetY, 1, 1)
    }
  }
}

/**
 * Draws a pixel perfect line from point a to point b
 * @param {number} sx - (Integer)
 * @param {number} sy - (Integer)
 * @param {number} tx - (Integer)
 * @param {number} ty - (Integer)
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} layer - the affected layer
 * @param {object} currentModes - modes to be used for rendering
 * @param {object} brushStamp - entire brushStamp array with all directions
 * @param {number} brushSize - (Integer)
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {Set} seenPixelsSet - set of coordinates already drawn on
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by line tool and brush tool before line is confirmed
 */
export function actionLine(
  sx,
  sy,
  tx,
  ty,
  boundaryBox,
  currentColor,
  layer,
  currentModes,
  brushStamp,
  brushSize,
  maskSet,
  seenPixelsSet = null,
  customContext = null,
  isPreview = false
) {
  let angle = getAngle(tx - sx, ty - sy) // angle of line
  let tri = getTriangle(sx, sy, tx, ty, angle)
  const seen = seenPixelsSet ? new Set(seenPixelsSet) : new Set()
  let previousX = sx
  let previousY = sy
  let brushDirection = "0,0"
  for (let i = 0; i < tri.long; i++) {
    let thispoint = {
      x: Math.round(sx + tri.x * i),
      y: Math.round(sy + tri.y * i),
    }
    brushDirection = calculateBrushDirection(
      thispoint.x,
      thispoint.y,
      previousX,
      previousY
    )
    // for each point along the line
    actionDraw(
      thispoint.x,
      thispoint.y,
      boundaryBox,
      currentColor,
      brushStamp[brushDirection],
      brushSize,
      layer,
      currentModes,
      maskSet,
      seen,
      customContext,
      isPreview
    )
    previousX = thispoint.x
    previousY = thispoint.y
  }
  //fill endpoint
  brushDirection = calculateBrushDirection(tx, ty, previousX, previousY)
  actionDraw(
    tx,
    ty,
    boundaryBox,
    currentColor,
    brushStamp[brushDirection],
    brushSize,
    layer,
    currentModes,
    maskSet,
    seen,
    customContext,
    isPreview
  )
}

/**
 * NOTE: if canvas is resized and fill point exists outside canvas area, fill will not render when timeline is redrawn
 * User action for process to fill a contiguous color
 * @param {number} startX - (Integer)
 * @param {number} startY - (Integer)
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} layer - the affected layer
 * @param {object} currentModes - modes to be used for rendering
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {CanvasRenderingContext2D} [customContext] - use custom context if provided
 */
export function actionFill(
  startX,
  startY,
  boundaryBox,
  currentColor,
  layer,
  currentModes,
  maskSet,
  customContext = null
) {
  //exit if outside borders
  if (isOutOfBounds(startX, startY, 0, layer, boundaryBox)) {
    return
  }
  let xMin = minLimit(boundaryBox.xMin, 0)
  let xMax = maxLimit(boundaryBox.xMax, layer.cvs.width)
  let yMin = minLimit(boundaryBox.yMin, 0)
  let yMax = maxLimit(boundaryBox.yMax, layer.cvs.height)
  //get imageData
  let ctx = layer.ctx
  if (customContext) {
    ctx = customContext
  }
  let layerImageData = ctx.getImageData(xMin, yMin, xMax - xMin, yMax - yMin)
  let clickedColor = getColor(layerImageData, startX - xMin, startY - yMin)

  if (currentModes?.eraser) {
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
  ctx.putImageData(layerImageData, xMin, yMin)

  //helpers
  /**
   * Recursive function to fill a contiguous color
   */
  function floodFill() {
    newPos = pixelStack.pop()
    x = newPos[0]
    y = newPos[1]
    //get current pixel position
    pixelPos = (y * (xMax - xMin) + x) * 4
    // Go up as long as the color matches and are inside the canvas
    while (
      y >= 0 &&
      matchStartColor(layerImageData, pixelPos, clickedColor, boundaryBox)
    ) {
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
      matchStartColor(layerImageData, pixelPos, clickedColor, boundaryBox)
    ) {
      colorPixel(layerImageData, pixelPos, currentColor)

      if (x > 0) {
        if (
          matchStartColor(
            layerImageData,
            pixelPos - 4,
            clickedColor,
            boundaryBox
          )
        ) {
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
        if (
          matchStartColor(
            layerImageData,
            pixelPos + 4,
            clickedColor,
            boundaryBox
          )
        ) {
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
 * Helper function. TODO: (Low Priority) move to external helper file for rendering
 * To render a pixel perfect curve, points are plotted instead of using t values, which are not equidistant.
 * @param {Array} points - array of points to render
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {object} brushStamp - entire brushStamp array with all directions
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {number} brushSize - (Integer)
 * @param {object} layer - the affected layer
 * @param {object} currentModes - modes to be used for rendering
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by vector tools before line is confirmed
 */
function renderPoints(
  points,
  boundaryBox,
  brushStamp,
  currentColor,
  brushSize,
  layer,
  currentModes,
  maskSet,
  customContext = null,
  isPreview = false
) {
  const seen = new Set()
  let previousX = Math.floor(points[0].x)
  let previousY = Math.floor(points[0].y)
  for (const { x, y } of points) {
    //rounded values
    let xt = Math.floor(x)
    let yt = Math.floor(y)
    let brushDirection = calculateBrushDirection(xt, yt, previousX, previousY)
    actionDraw(
      xt,
      yt,
      boundaryBox,
      currentColor,
      brushStamp[brushDirection],
      brushSize,
      layer,
      currentModes,
      maskSet,
      seen,
      customContext,
      isPreview
    )
    previousX = xt
    previousY = yt
  }
}

/**
 * User action for process to set control points for quadratic bezier
 * @param {number} startx - (Integer)
 * @param {number} starty - (Integer)
 * @param {number} endx - (Integer)
 * @param {number} endy - (Integer)
 * @param {number} controlx - (Integer)
 * @param {number} controly - (Integer)
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {number} stepNum - (Integer)
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} layer - the affected layer
 * @param {object} currentModes - modes to be used for rendering
 * @param {object} brushStamp - entire brushStamp array with all directions
 * @param {number} brushSize - (Integer)
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by vector tools before line is confirmed
 */
export function actionQuadraticCurve(
  startx,
  starty,
  endx,
  endy,
  controlx,
  controly,
  boundaryBox,
  stepNum,
  currentColor,
  layer,
  currentModes,
  brushStamp,
  brushSize,
  maskSet,
  customContext = null,
  isPreview = false
) {
  if (stepNum === 1) {
    actionLine(
      startx,
      starty,
      endx,
      endy,
      boundaryBox,
      currentColor,
      layer,
      currentModes,
      brushStamp,
      brushSize,
      maskSet,
      null,
      customContext,
      isPreview
    )
  } else if (stepNum === 2) {
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
      boundaryBox,
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
      customContext,
      isPreview
    )
  }
}

/**
 * User action for process to set control points for cubic bezier
 * @param {number} startx - (Integer)
 * @param {number} starty - (Integer)
 * @param {number} endx - (Integer)
 * @param {number} endy - (Integer)
 * @param {number} controlx1 - (Integer)
 * @param {number} controly1 - (Integer)
 * @param {number} controlx2 - (Integer)
 * @param {number} controly2 - (Integer)
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {number} stepNum - (Integer)
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} layer - the affected layer
 * @param {object} currentModes - modes to be used for rendering
 * @param {object} brushStamp - entire brushStamp array with all directions
 * @param {number} brushSize - (Integer)
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by vector tools before line is confirmed
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
  boundaryBox,
  stepNum,
  currentColor,
  layer,
  currentModes,
  brushStamp,
  brushSize,
  maskSet,
  customContext = null,
  isPreview = false
) {
  if (stepNum === 1) {
    actionLine(
      startx,
      starty,
      endx,
      endy,
      boundaryBox,
      currentColor,
      layer,
      currentModes,
      brushStamp,
      brushSize,
      maskSet,
      null,
      customContext,
      isPreview
    )
  } else if (stepNum === 2) {
    let plotPoints = plotQuadBezier(
      startx,
      starty,
      controlx1,
      controly1,
      endx,
      endy
    )
    renderPoints(
      plotPoints,
      boundaryBox,
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
      customContext,
      isPreview
    )
  } else if (stepNum === 3) {
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
      boundaryBox,
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
      customContext,
      isPreview
    )
  }
}

/**
 * User action for process to set control points for ellipse based on vertices
 * @param vectorProperties
 * @param {number} centerx - (Integer)
 * @param {number} centery - (Integer)
 * @param {number} xa - (Integer)
 * @param {number} ya - (Integer)
 * @param {number} xb - (Integer)
 * @param {number} yb - (Integer)
 * @param {number} radA - (Integer)
 * @param {number} radB - (Integer)
 * @param {boolean} forceCircle - whether to force a circle
 * @param {object} boundaryBox - {xMin, xMax, yMin, yMax}
 * @param {object} currentColor - {color, r, g, b, a}
 * @param {object} layer - the affected layer
 * @param {object} currentModes - modes to be used for rendering
 * @param {object} brushStamp - entire brushStamp array with all directions
 * @param {number} brushSize - (Integer)
 * @param {number} angle - Radians (Float)
 * @param {number} unifiedOffset - (Integer)
 * @param {number} x1Offset - (Integer)
 * @param {number} y1Offset - (Integer)
 * @param {Set} maskSet - set of coordinates to draw on if mask is active
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {boolean} isPreview - whether the action is a preview (not on main canvas) - used by vector tools before line is confirmed
 * @returns {object} controlPoints - array of control points for ellipse conic segments
 */
export function actionEllipse(
  vectorProperties,
  centerx,
  centery,
  xa,
  ya,
  xb,
  yb,
  radA,
  radB,
  forceCircle,
  boundaryBox,
  currentColor,
  layer,
  currentModes,
  brushStamp,
  brushSize,
  angle,
  unifiedOffset,
  x1Offset,
  y1Offset,
  maskSet,
  customContext = null,
  isPreview = false
) {
  if (forceCircle) {
    const plotPoints = plotCircle(
      centerx + 0.5,
      centery + 0.5,
      radA,
      unifiedOffset
    )
    renderPoints(
      plotPoints,
      boundaryBox,
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
      customContext,
      isPreview
    )
  } else {
    //Temp: use plot function that passes conics parameters instead of radii, angle
    // const plotPoints = plotRotatedEllipse(
    //   centerx,
    //   centery,
    //   radA,
    //   radB,
    //   angle,
    //   xa,
    //   ya,
    //   x1Offset,
    //   y1Offset
    // )
    const plotPoints = plotRotatedEllipseConics(
      vectorProperties.weight,
      vectorProperties.leftTangentX,
      vectorProperties.leftTangentY,
      vectorProperties.topTangentX,
      vectorProperties.topTangentY,
      vectorProperties.rightTangentX,
      vectorProperties.rightTangentY,
      vectorProperties.bottomTangentX,
      vectorProperties.bottomTangentY
    )
    renderPoints(
      plotPoints,
      boundaryBox,
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
      customContext,
      isPreview
    )
  }
}
