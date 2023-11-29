import { state } from "../Context/state.js"
import { tools } from "../Tools/index.js"
import { brushStamps } from "../Context/brushStamps.js"
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
import { canvas } from "../Context/canvas.js"
import { saveEllipseAsTest } from "../Testing/ellipseTest.js"

//====================================//
//===== * * * Tool Actions * * * =====//
//====================================//

//"Actions" are user-initiated events that are reversible through the undo button. This file holds the functions used for reversible actions.
//Not all reversible actions are held here currently. Clear canvas and addLayer are not present, but those don't interact with the cursor.

/**
 * Modify action in the timeline
 * Only good for vector parameters
 * @param {Integer} actionIndex
 */
export function modifyVectorAction(actionIndex) {
  //loop through the object state.vectorsSavedProperties and for each key which represents an action index and value which is a shallow object with various properties, create an object with properties moddedActionIndex, from (the saved properties), and to (the new properties found on state.undoStack[actionIndex].properties.vectorProperties)
  let processedActions = []

  for (let vectorIndex in state.vectorsSavedProperties) {
    // Extract the saved properties
    let fromProperties = { ...state.vectorsSavedProperties[vectorIndex] }

    // Extract the new properties
    let toProperties = {
      ...state.undoStack[vectorIndex].properties.vectorProperties,
    }

    // Create the new object with the required properties
    let moddedAction = {
      moddedActionIndex: vectorIndex,
      from: fromProperties,
      to: toProperties,
    }

    // Add the new object to the processedActions array
    processedActions.push(moddedAction)
  }
  state.vectorsSavedProperties = {}
  state.addToTimeline({
    tool: tools.modify,
    properties: {
      moddedActionIndex: actionIndex,
      processedActions,
    },
  })
  // let action = state.undoStack[actionIndex]
  // let oldProperties = {
  //   ...action.properties.vectorProperties,
  // } //shallow copy, properties must not contain any objects or references as values
  // let oldProperties = {
  //   ...state.vectorsSavedProperties[actionIndex],
  // } //shallow copy, properties must not contain any objects or references as values
  // let modifiedProperties = {
  //   ...action.properties.vectorProperties,
  // } //shallow copy, must make deep copy, at least for x, y and properties
  // modifiedProperties = { ...state.vectorProperties }
  // //Keep properties relative to layer offset
  // modifiedProperties.px1 -= action.layer.x
  // modifiedProperties.py1 -= action.layer.y
  // if (
  //   action.tool.name === "quadCurve" ||
  //   action.tool.name === "cubicCurve" ||
  //   action.tool.name === "ellipse"
  // ) {
  //   modifiedProperties.px2 -= action.layer.x
  //   modifiedProperties.py2 -= action.layer.y

  //   modifiedProperties.px3 -= action.layer.x
  //   modifiedProperties.py3 -= action.layer.y
  // }

  // if (action.tool.name === "cubicCurve") {
  //   modifiedProperties.px4 -= action.layer.x
  //   modifiedProperties.py4 -= action.layer.y
  // }

  //maintain forceCircle property if point being adjusted is p1
  // if (action.tool.name === "ellipse") {
  //   modifiedProperties.forceCircle =
  //     vectorGui.selectedPoint.xKey === "px1"
  //       ? oldProperties.forceCircle
  //       : state.vectorProperties.forceCircle
  // }
  // action.properties.vectorProperties = {
  //   ...modifiedProperties,
  // }
  // state.addToTimeline({
  //   tool: tools.modify,
  //   properties: {
  //     //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
  //     moddedActionIndex: actionIndex,
  //     from: oldProperties,
  //     to: modifiedProperties,
  //   },
  // })
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
 * Modify action in the timeline
 * @param {Integer} actionIndex
 * @param {String} modeKey
 */
export function changeActionMode(actionIndex, modeKey) {
  let action = state.undoStack[actionIndex]
  let oldModes = { ...action.modes }
  action.modes[modeKey] = !action.modes[modeKey]
  //resolve conflicting modes
  if (action.modes[modeKey]) {
    if (modeKey === "eraser" && action.modes.inject) {
      action.modes.inject = false
    } else if (modeKey === "inject" && action.modes.eraser) {
      action.modes.eraser = false
    }
  }
  let newModes = { ...action.modes }
  state.addToTimeline({
    tool: tools.changeMode,
    properties: {
      //normally properties don't contain objects as values, but the modify action is a special case because a modify action itself will never be modified
      moddedActionIndex: actionIndex,
      from: oldModes,
      to: newModes,
    },
  })
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
 * @param {Integer} coordX
 * @param {Integer} coordY
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} directionalBrushStamp - brushStamp[brushDirection]
 * @param {Integer} brushSize
 * @param {Object} layer
 * @param {Object} currentModes
 * @param {Set} maskSet
 * @param {Set} seenPixelsSet
 * @param {Boolean} isPreview
 * @param {Boolean} excludeFromSet - don't add to seenPixelsSet if true
 */
export function actionDraw(
  coordX,
  coordY,
  currentColor,
  directionalBrushStamp,
  brushSize,
  layer,
  currentModes,
  maskSet,
  seenPixelsSet,
  isPreview = false,
  excludeFromSet = false
) {
  let offsetX = 0
  let offsetY = 0
  let ctx = layer.ctx
  if (isPreview) {
    ctx = layer.onscreenCtx
    offsetX = canvas.xOffset
    offsetY = canvas.yOffset
  }
  ctx.fillStyle = currentColor.color
  if (
    coordX >= layer.cvs.width + brushSize / 2 ||
    coordX <= -brushSize / 2 ||
    coordY >= layer.cvs.height + brushSize / 2 ||
    coordY <= -brushSize / 2
  ) {
    //don't iterate brush outside bounds to reduce time cost of render
    return
  }
  const baseX = Math.ceil(coordX - brushSize / 2)
  const baseY = Math.ceil(coordY - brushSize / 2)
  for (const pixel of directionalBrushStamp) {
    const x = baseX + pixel.x
    const y = baseY + pixel.y
    if (x >= layer.cvs.width || x < 0 || y >= layer.cvs.height || y < 0) {
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
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} layer
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} currentModes
 * @param {Object} brushStamp
 * @param {Integer} brushSize
 * @param {Set} maskSet
 * @param {Set} seenPixelsSet
 * @param {Boolean} isPreview
 */
export function actionLine(
  sx,
  sy,
  tx,
  ty,
  currentColor,
  layer,
  currentModes,
  brushStamp,
  brushSize,
  maskSet,
  seenPixelsSet = null,
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
      currentColor,
      brushStamp[brushDirection],
      brushSize,
      layer,
      currentModes,
      maskSet,
      seen,
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
    currentColor,
    brushStamp[brushDirection],
    brushSize,
    layer,
    currentModes,
    maskSet,
    seen,
    isPreview
  )
}

/**
 * NOTE: if canvas is resized and fill point exists outside canvas area, fill will not render when timeline is redrawn
 * User action for process to fill a contiguous color
 * @param {Integer} startX
 * @param {Integer} startY
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} layer
 * @param {Object} currentModes
 * @param {Object} selectProperties
 * @param {Set} maskSet
 * @param {Boolean} isPreview
 * @returns
 */
export function actionFill(
  startX,
  startY,
  currentColor,
  layer,
  currentModes,
  selectProperties,
  maskSet,
  isPreview = false
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
  let ctx = layer.ctx
  if (isPreview) {
    ctx = canvas.previewCTX
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
 * @param {Object} brushStamp
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Integer} brushSize
 * @param {Object} layer
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} currentModes
 * @param {Set} maskSet
 * @param {Boolean} isPreview
 */
function renderPoints(
  points,
  brushStamp,
  currentColor,
  brushSize,
  layer,
  currentModes,
  maskSet,
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
      currentColor,
      brushStamp[brushDirection],
      brushSize,
      layer,
      currentModes,
      maskSet,
      seen,
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
 * @param {Integer} stepNum
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} layer
 * @param {Object} currentModes
 * @param {Object} brushStamp
 * @param {Integer} brushSize
 * @param {Set} maskSet
 * @param {Boolean} isPreview
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
  layer,
  currentModes,
  brushStamp,
  brushSize,
  maskSet,
  isPreview = false
) {
  if (stepNum === 1) {
    actionLine(
      startx,
      starty,
      endx,
      endy,
      currentColor,
      layer,
      currentModes,
      brushStamp,
      brushSize,
      maskSet,
      null,
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
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
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
 * @param {Integer} stepNum
 * @param {Object} currentColor - {color, r, g, b, a}
 * @param {Object} layer
 * @param {Object} currentModes
 * @param {Object} brushStamp
 * @param {Integer} brushSize
 * @param {Set} maskSet
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
  stepNum,
  currentColor,
  layer,
  currentModes,
  brushStamp,
  brushSize,
  maskSet,
  isPreview = false
) {
  if (stepNum === 1) {
    actionLine(
      startx,
      starty,
      endx,
      endy,
      currentColor,
      layer,
      currentModes,
      brushStamp,
      brushSize,
      maskSet,
      null,
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
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
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
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
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
  isPreview = false
) {
  //force coords to int
  // centerx = Math.floor(centerx)
  // centery = Math.floor(centery)
  // xa = Math.floor(xa)
  // ya = Math.floor(ya)
  // xb = Math.floor(xb)
  // yb = Math.floor(yb)

  if (forceCircle) {
    let plotPoints = plotCircle(centerx + 0.5, centery + 0.5, ra, offset)
    renderPoints(
      plotPoints,
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
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
      brushStamp,
      currentColor,
      brushSize,
      layer,
      currentModes,
      maskSet,
      isPreview
    )
  }
}
