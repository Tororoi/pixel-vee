import { canvas } from "../Context/canvas.js"
import { getTriangle, getAngle } from "../utils/trig.js"
import { plotCubicBezier, plotQuadBezier } from "../utils/bezier.js"
import { vectorGui } from "../GUI/vector.js"
import { plotCircle, plotRotatedEllipse } from "../utils/ellipse.js"
import {
  colorPixel,
  matchStartColor,
  getColor,
} from "../utils/imageDataHelpers.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"
import { saveEllipseAsTest } from "../Testing/ellipseTest.js"
import { isOutOfBounds, minLimit, maxLimit } from "../utils/canvasHelpers.js"

//====================================//
//===== * * * Tool Actions * * * =====//
//====================================//

//"Actions" are user-initiated events that are reversible through the undo button.
//This file holds the functions used for reversible actions as the result of a tool.

/**
 * Render a stamp from the brush to the canvas
 * @param {Integer} coordX
 * @param {Integer} coordY
 * @param {Object} boundaryBox
 * @param {Boolean} selectionInversed
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} directionalBrushStamp - brushStamp[brushDirection]
 * @param {Integer} brushSize
 * @param {Object} layer
 * @param {Object} currentModes
 * @param {Set} maskSet
 * @param {Set} seenPixelsSet
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {Boolean} isPreview
 * @param {Boolean} excludeFromSet - don't add to seenPixelsSet if true
 */
export function actionDraw(
  coordX,
  coordY,
  boundaryBox,
  selectionInversed,
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
  if (
    isOutOfBounds(
      coordX,
      coordY,
      brushSize,
      layer,
      boundaryBox,
      selectionInversed
    )
  ) {
    //don't iterate brush outside bounds to reduce time cost of render
    return
  }
  const baseX = Math.ceil(coordX - brushSize / 2)
  const baseY = Math.ceil(coordY - brushSize / 2)
  for (const pixel of directionalBrushStamp) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y
    if (isOutOfBounds(x, y, 0, layer, boundaryBox, selectionInversed)) {
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
 * @param {Integer} sx
 * @param {Integer} sy
 * @param {Integer} tx
 * @param {Integer} ty
 * @param {Object} boundaryBox
 * @param {Boolean} selectionInversed
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} layer
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} currentModes
 * @param {Object} brushStamp
 * @param {Integer} brushSize
 * @param {Set} maskSet
 * @param {Set} seenPixelsSet
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {Boolean} isPreview
 */
export function actionLine(
  sx,
  sy,
  tx,
  ty,
  boundaryBox,
  selectionInversed,
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
      selectionInversed,
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
    selectionInversed,
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
 * @param {Integer} startX
 * @param {Integer} startY
 * @param {Object} boundaryBox
 * @param {Boolean} selectionInversed
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} layer
 * @param {Object} currentModes
 * @param {Set} maskSet
 * @param {CanvasRenderingContext2D} [customContext] - use custom context if provided
 * @returns
 */
export function actionFill(
  startX,
  startY,
  boundaryBox,
  selectionInversed,
  currentColor,
  layer,
  currentModes,
  maskSet,
  customContext = null
) {
  //exit if outside borders
  if (isOutOfBounds(startX, startY, 0, layer, boundaryBox, selectionInversed)) {
    return
  }
  //TODO: need logic for selectionInversed
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
 * @param {Object} boundaryBox
 * @param {Boolean} selectionInversed
 * @param {Object} brushStamp
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Integer} brushSize
 * @param {Object} layer
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} currentModes
 * @param {Set} maskSet
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {Boolean} isPreview
 */
function renderPoints(
  points,
  boundaryBox,
  selectionInversed,
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
      selectionInversed,
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
  //Uncomment for performance testing
  // if (state.captureTesting) {
  //   if (state.tool.name === "ellipse") saveEllipseAsTest(points)
  // }
}

/**
 * User action for process to set control points for quadratic bezier
 * @param {Integer} startx
 * @param {Integer} starty
 * @param {Integer} endx
 * @param {Integer} endy
 * @param {Integer} controlx
 * @param {Integer} controly
 * @param {Object} boundaryBox
 * @param {Boolean} selectionInversed
 * @param {Integer} stepNum
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} layer
 * @param {Object} currentModes
 * @param {Object} brushStamp
 * @param {Integer} brushSize
 * @param {Set} maskSet
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {Boolean} isPreview
 */
export function actionQuadraticCurve(
  startx,
  starty,
  endx,
  endy,
  controlx,
  controly,
  boundaryBox,
  selectionInversed,
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
      selectionInversed,
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
  } else if (stepNum === 2 || stepNum === 3) {
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
      selectionInversed,
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
 * @param {Integer} startx
 * @param {Integer} starty
 * @param {Integer} endx
 * @param {Integer} endy
 * @param {Integer} controlx1
 * @param {Integer} controly1
 * @param {Integer} controlx2
 * @param {Integer} controly2
 * @param {Object} boundaryBox
 * @param {Boolean} selectionInversed
 * @param {Integer} stepNum
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} layer
 * @param {Object} currentModes
 * @param {Object} brushStamp
 * @param {Integer} brushSize
 * @param {Set} maskSet
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {Boolean} isPreview
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
  selectionInversed,
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
      selectionInversed,
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
      selectionInversed,
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
      customContext,
      isPreview
    )
  } else if (stepNum === 3 || stepNum === 4) {
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
      selectionInversed,
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
 * @param {Integer} centerx
 * @param {Integer} centery
 * @param {Integer} xa
 * @param {Integer} ya
 * @param {Integer} xb
 * @param {Integer} yb
 * @param {Integer} ra
 * @param {Integer} rb
 * @param {Boolean} forceCircle
 * @param {Object} boundaryBox
 * @param {Boolean} selectionInversed
 * @param {Integer} stepNum
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} layer
 * @param {Object} currentModes
 * @param {Object} brushStamp
 * @param {Integer} brushSize
 * @param {Float} angle - Radians
 * @param {Integer} offset
 * @param {Integer} x1Offset
 * @param {Integer} y1Offset
 * @param {Set} maskSet
 * @param {CanvasRenderingContext2D} customContext - use custom context if provided
 * @param {Boolean} isPreview
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
  boundaryBox,
  selectionInversed,
  currentColor,
  layer,
  currentModes,
  brushStamp,
  brushSize,
  angle,
  offset,
  x1Offset,
  y1Offset,
  maskSet,
  customContext = null,
  isPreview = false
) {
  if (forceCircle) {
    let plotPoints = plotCircle(centerx + 0.5, centery + 0.5, ra, offset)
    renderPoints(
      plotPoints,
      boundaryBox,
      selectionInversed,
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
      boundaryBox,
      selectionInversed,
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
