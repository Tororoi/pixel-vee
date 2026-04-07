import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { vectorGui } from '../GUI/vector.js'
import {
  checkSquarePointCollision,
  checkAreaCollision,
  getGuiLineWidth,
  renderSelectionDimOverlay,
} from '../utils/guiHelpers.js'
import { SCALE } from '../utils/constants.js'

//=============================================//
//======= * * * Marching Ants Loop * * * ======//
//=============================================//

let marchOffset = 0
let marchDashLen = 0
let marchAnimId = null

/**
 * Returns the marching-ants dash length in art pixels for the current zoom level.
 * Always 1/(2n) so two colors tile evenly into 1 art pixel at any zoom.
 * @returns {number} dash length in art pixels
 */
function getMarchDashLen() {
  return 1 / (2 * Math.max(1, Math.round(canvas.zoom / 20)))
}

// Path2D cache — rebuilt only when maskSet reference or canvas pan changes
let cachedMaskPath = null
let cachedMaskSetRef = null
let cachedPathXOffset = null
let cachedPathYOffset = null

/**
 * Builds a Path2D from the maskSet edge segments.
 * Each edge is oriented clockwise so a single marchOffset animates all borders correctly.
 * @param {Set<number>} maskSet - packed (y<<16)|x pixel set
 * @returns {Path2D} path of all border segments
 */
function buildMaskPath(maskSet) {
  const path = new Path2D()
  const ox = canvas.xOffset
  const oy = canvas.yOffset
  for (const key of maskSet) {
    const x = key & 0xffff
    const y = (key >> 16) & 0xffff
    // Top edge: left to right for clockwise marching
    if (!maskSet.has(((y - 1) << 16) | x)) {
      path.moveTo(ox + x, oy + y)
      path.lineTo(ox + x + 1, oy + y)
    }
    // Bottom edge: right to left for clockwise marching
    if (!maskSet.has(((y + 1) << 16) | x)) {
      path.moveTo(ox + x + 1, oy + y + 1)
      path.lineTo(ox + x, oy + y + 1)
    }
    // Left edge: bottom to top for clockwise marching
    if (!maskSet.has((y << 16) | (x - 1))) {
      path.moveTo(ox + x, oy + y + 1)
      path.lineTo(ox + x, oy + y)
    }
    // Right edge: top to bottom for clockwise marching
    if (!maskSet.has((y << 16) | (x + 1))) {
      path.moveTo(ox + x + 1, oy + y)
      path.lineTo(ox + x + 1, oy + y + 1)
    }
  }
  return path
}

let marchRenderer = renderSelectionCVS

/**
 * Advances the march offset and re-renders via the active renderer each frame.
 */
function tickMarchingAnts() {
  marchDashLen = getMarchDashLen()
  marchOffset = (marchOffset + marchDashLen * 0.03125) % 1
  marchAnimId = requestAnimationFrame(tickMarchingAnts)
  marchRenderer()
}

/**
 * Starts the marching ants animation loop.
 * Updates the renderer and starts the loop if not already running.
 * @param {Function} [renderer] - called each animation frame; defaults to renderSelectionCVS
 */
export function startMarchingAnts(renderer = renderSelectionCVS) {
  if (marchAnimId !== null) {
    // Loop already running — only update renderer if an explicit one is passed
    if (renderer !== renderSelectionCVS) marchRenderer = renderer
    return
  }
  marchRenderer = renderer
  marchAnimId = requestAnimationFrame(tickMarchingAnts)
}

/**
 * Stops the marching ants animation loop.
 */
export function stopMarchingAnts() {
  if (marchAnimId !== null) {
    cancelAnimationFrame(marchAnimId)
    marchAnimId = null
  }
}

//=============================================//
//======== * * * Stroke Helpers * * * =========//
//=============================================//

/**
 * Strokes the current path (or a Path2D) with a black outer ring and white inner.
 * @param {CanvasRenderingContext2D} ctx - selection GUI canvas rendering context
 * @param {number} lineWidth - base line width
 * @param {Path2D|null} path - optional Path2D; uses current path if omitted
 */
function strokeBorderOnTop(ctx, lineWidth, path = null) {
  ctx.lineWidth = lineWidth * 4
  ctx.strokeStyle = 'black'
  path ? ctx.stroke(path) : ctx.stroke()
  ctx.lineWidth = lineWidth * 2
  ctx.strokeStyle = 'white'
  path ? ctx.stroke(path) : ctx.stroke()
}

/**
 * Strokes the marching-ants pill pattern: black outer ring + white inner.
 * Sets lineCap, dash, and offset before stroking; resets dash after.
 * @param {CanvasRenderingContext2D} ctx - selection GUI canvas rendering context
 * @param {number} lineWidth - line width in art pixels (default 1/canvas.zoom)
 * @param {Path2D|null} path - optional Path2D; uses current path if omitted
 */
export function strokeMarchingAnts(ctx, lineWidth = 1 / canvas.zoom, path = null) {
  ctx.lineWidth = lineWidth
  ctx.setLineDash([marchDashLen, marchDashLen])
  ctx.strokeStyle = 'white'
  ctx.lineDashOffset = marchOffset
  path ? ctx.stroke(path) : ctx.stroke()
  ctx.strokeStyle = 'black'
  ctx.lineDashOffset = marchOffset + marchDashLen
  path ? ctx.stroke(path) : ctx.stroke()
  ctx.setLineDash([])
}

//=============================================//
//======== * * * Outline Renders * * * ========//
//=============================================//

/**
 * Renders the marching-ants contour outline for magic wand selections.
 * Uses a cached Path2D rebuilt only when the maskSet or canvas pan changes.
 */
function renderMaskContourOutline() {
  const maskSet = state.selection.maskSet
  if (!maskSet || maskSet.size === 0) return
  const ctx = canvas.selectionGuiCTX
  ctx.save()

  if (
    maskSet !== cachedMaskSetRef ||
    canvas.xOffset !== cachedPathXOffset ||
    canvas.yOffset !== cachedPathYOffset
  ) {
    cachedMaskSetRef = maskSet
    cachedPathXOffset = canvas.xOffset
    cachedPathYOffset = canvas.yOffset
    cachedMaskPath = buildMaskPath(maskSet)
  }

  strokeMarchingAnts(ctx, undefined, cachedMaskPath)
  ctx.restore()
}

/**
 * Renders the selection box outline and optional transform control points.
 * @param {boolean} drawPoints - if true, draw transform control points
 */
export function renderSelectionBoxOutline(drawPoints) {
  const ctx = canvas.selectionGuiCTX
  const lineWidth = getGuiLineWidth()
  ctx.save()
  ctx.lineCap = 'round'

  if (state.selection.boundaryBox.xMax !== null) {
    ctx.beginPath()
    ctx.rect(
      canvas.xOffset + state.selection.boundaryBox.xMin,
      canvas.yOffset + state.selection.boundaryBox.yMin,
      state.selection.boundaryBox.xMax - state.selection.boundaryBox.xMin,
      state.selection.boundaryBox.yMax - state.selection.boundaryBox.yMin,
    )
    if (!canvas.pastedLayer && canvas.currentLayer.type !== 'reference') {
      strokeMarchingAnts(ctx)
    } else {
      strokeBorderOnTop(ctx, lineWidth)
    }
  }

  if (drawPoints) {
    const circleRadius = canvas.zoom <= 4 ? 8 / canvas.zoom : 1.5
    const pointsKeys = [
      { x: 'px1', y: 'py1' },
      { x: 'px2', y: 'py2' },
      { x: 'px3', y: 'py3' },
      { x: 'px4', y: 'py4' },
      { x: 'px5', y: 'py5' },
      { x: 'px6', y: 'py6' },
      { x: 'px7', y: 'py7' },
      { x: 'px8', y: 'py8' },
    ]
    drawSelectControlPoints(
      state.selection.boundaryBox,
      pointsKeys,
      circleRadius / 2,
      true,
      0.5,
    )
  }

  ctx.restore()
}

// /**
//  * Adds a single vector shape's path to the current canvas path.
//  * @param {CanvasRenderingContext2D} ctx - selection GUI canvas rendering context
//  * @param {object} vp - vectorProperties object
//  * @param {number} xOffset - horizontal draw offset
//  * @param {number} yOffset - vertical draw offset
//  */
// function addVectorToPath(ctx, vp, xOffset, yOffset) {
//   switch (vp.type) {
//     case 'fill':
//       // TODO: (Low Priority) improve visual indicator for fill vector selection
//       ctx.moveTo(xOffset + vp.px1 + 0.5, yOffset + vp.py1 + 0.5)
//       ctx.lineTo(xOffset + vp.px1 + 0.5, yOffset + vp.py1 + 0.5)
//       break
//     case 'line':
//       ctx.moveTo(xOffset + vp.px1 + 0.5, yOffset + vp.py1 + 0.5)
//       ctx.lineTo(xOffset + vp.px2 + 0.5, yOffset + vp.py2 + 0.5)
//       break
//     case 'quadCurve':
//       ctx.moveTo(xOffset + vp.px1 + 0.5, yOffset + vp.py1 + 0.5)
//       ctx.quadraticCurveTo(
//         xOffset + vp.px3 + 0.5,
//         yOffset + vp.py3 + 0.5,
//         xOffset + vp.px2 + 0.5,
//         yOffset + vp.py2 + 0.5,
//       )
//       break
//     case 'cubicCurve':
//       ctx.moveTo(xOffset + vp.px1 + 0.5, yOffset + vp.py1 + 0.5)
//       ctx.bezierCurveTo(
//         xOffset + vp.px3 + 0.5,
//         yOffset + vp.py3 + 0.5,
//         xOffset + vp.px4 + 0.5,
//         yOffset + vp.py4 + 0.5,
//         xOffset + vp.px2 + 0.5,
//         yOffset + vp.py2 + 0.5,
//       )
//       break
//     case 'ellipse': {
//       const { px1, py1, px3, radA, radB, angle, x1Offset, y1Offset } = vp
//       const majorAxis = radA + x1Offset / 2 > 0 ? radA + x1Offset / 2 : 0
//       let minorAxis = radB + y1Offset / 2 > 0 ? radB + y1Offset / 2 : 0
//       if (!Number.isInteger(px3)) minorAxis = majorAxis
//       const centerX = xOffset + px1 + 0.5 + x1Offset / 2
//       const centerY = yOffset + py1 + 0.5 + y1Offset / 2
//       // Start point at angle=0 on the ellipse
//       ctx.moveTo(
//         centerX + majorAxis * Math.cos(angle),
//         centerY + majorAxis * Math.sin(angle),
//       )
//       ctx.ellipse(centerX, centerY, majorAxis, minorAxis, angle, 0, 2 * Math.PI)
//       break
//     }
//     default:
//   }
// }

/**
 * Renders the selection overlay and outline. Starts the marching ants animation
 * loop when a selection is active and stops it when nothing is selected.
 */
export function renderSelectionCVS() {
  const ctx = canvas.selectionGuiCTX
  ctx.clearRect(
    0,
    0,
    canvas.selectionGuiCVS.width,
    canvas.selectionGuiCVS.height,
  )
  const isRasterSelection = state.selection.boundaryBox.xMax !== null
  // const isVectorSelection =
  //   state.vector.selectedIndices.size > 0 &&
  //   state.tool.current.type === 'vector'

  if (isRasterSelection) {
    startMarchingAnts()
    if (!state.selection.maskSet && !state.canvas.resizeOverlayActive) {
      renderSelectionDimOverlay(ctx)
    }
    if (state.selection.maskSet) {
      renderMaskContourOutline()
    } else {
      const shouldRenderPoints =
        state.tool.current.name === 'select' ||
        (state.tool.current.name === 'move' && canvas.pastedLayer) ||
        canvas.currentLayer.type === 'reference' ||
        state.vector.transformMode === SCALE
      renderSelectionBoxOutline(shouldRenderPoints)
    }
  } else if (!state.canvas.resizeOverlayActive) {
    stopMarchingAnts()
  }
}

//=============================================//
//===== * * * Control Point Rendering * * * ===//
//=============================================//

/**
 * Renders transform control points for the selection boundary box.
 * @param {object} boundaryBox - The boundary box of the selection
 * @param {Array} pointsKeys - The keys of the control points
 * @param {number} radius - (Float)
 * @param {boolean} modify - if true, check for collision with cursor and modify radius
 * @param {number} offset - (Integer)
 * @param {object} vectorAction - The vector action to be rendered (NOTE: Not certain if ever needed for this function)
 * @param {CanvasRenderingContext2D} [ctx] - rendering context; defaults to selectionGuiCTX
 */
export function drawSelectControlPoints(
  boundaryBox,
  pointsKeys,
  radius,
  modify = false,
  offset = 0,
  vectorAction = null,
  ctx = canvas.selectionGuiCTX,
) {
  const { xMin, yMin, xMax, yMax } = boundaryBox
  const midX = xMin + (xMax - xMin) / 2
  const midY = yMin + (yMax - yMin) / 2

  if (
    state.cursor.x >= xMin &&
    state.cursor.x < xMax &&
    state.cursor.y >= yMin &&
    state.cursor.y < yMax
  ) {
    vectorGui.setCollision({ x: 'px9', y: 'py9' })
  }

  const points = [
    { x: xMin, y: yMin }, // Top-left
    { x: midX, y: yMin }, // Top-center
    { x: xMax, y: yMin }, // Top-right
    { x: xMax, y: midY }, // Right-center
    { x: xMax, y: yMax }, // Bottom-right
    { x: midX, y: yMax }, // Bottom-center
    { x: xMin, y: yMax }, // Bottom-left
    { x: xMin, y: midY }, // Left-center
  ]
  for (const keys of pointsKeys) {
    const point = points[pointsKeys.indexOf(keys)]
    handleSelectCollisionAndDraw(
      keys,
      point,
      radius,
      modify,
      offset,
      vectorAction,
      boundaryBox,
      ctx,
    )
  }

  setSelectionCursorStyle()
}

/**
 * TODO: (Low Priority) move drawing logic to separate function so modify param doesn't need to be used
 * @param {object} keys - The keys of the control point
 * @param {object} point - The control point
 * @param {number} radius - (Float)
 * @param {boolean} modify - if true, check for collision with cursor and modify radius
 * @param {number} offset - (Float)
 * @param {object} vectorAction - The vector action to be rendered
 * @param {object} boundaryBox - The boundary box used for edge-strip collision
 * @param {CanvasRenderingContext2D} ctx - rendering context to draw onto
 */
function handleSelectCollisionAndDraw(
  keys,
  point,
  radius,
  modify,
  offset,
  vectorAction,
  boundaryBox,
  ctx,
) {
  let r = state.tool.touch ? radius * 2 : radius
  const xOffset = vectorAction ? vectorAction.layer.x : 0
  const yOffset = vectorAction ? vectorAction.layer.y : 0

  if (modify) {
    const collisionPresent =
      checkSquarePointCollision(
        state.cursor.x,
        state.cursor.y,
        point.x - offset + xOffset,
        point.y - offset + yOffset,
        r * 2.125,
      ) ||
      (['px2', 'px6'].includes(keys.x) &&
        checkAreaCollision(
          state.cursor.x,
          state.cursor.y,
          boundaryBox.xMin + r * 2,
          point.y - offset + yOffset - r * 2,
          boundaryBox.xMax - r * 2 - 1,
          point.y - offset + yOffset + r * 2,
        )) ||
      (['px4', 'px8'].includes(keys.x) &&
        checkAreaCollision(
          state.cursor.x,
          state.cursor.y,
          point.x - offset + xOffset - r * 2,
          boundaryBox.yMin + r * 2,
          point.x - offset + xOffset + r * 2,
          boundaryBox.yMax - r * 2 - 1,
        ))
    if (collisionPresent) {
      r = radius * 2.125
      vectorGui.setCollision(keys)
    } else if (vectorGui.selectedPoint.xKey === keys.x && !vectorAction) {
      vectorGui.setCollision(keys)
    }
  }

  const lw = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
  const cx = canvas.xOffset + xOffset + point.x - offset + 0.5
  const cy = canvas.yOffset + yOffset + point.y - offset + 0.5

  if (['px1', 'px3', 'px5', 'px7'].includes(keys.x)) {
    // Corner points: square
    ctx.beginPath()
    ctx.rect(cx - r, cy - r, r * 2, r * 2)
    ctx.lineWidth = lw * 2
    ctx.strokeStyle = 'black'
    ctx.stroke()
    ctx.fillStyle = 'white'
    ctx.fill()
  } else if (['px2', 'px4', 'px6', 'px8'].includes(keys.x)) {
    // Side points: diamond
    r *= Math.sqrt(2)
    ctx.beginPath()
    ctx.moveTo(cx - r, cy)
    ctx.lineTo(cx, cy - r)
    ctx.lineTo(cx + r, cy)
    ctx.lineTo(cx, cy + r)
    ctx.closePath()
    ctx.lineWidth = lw * 2
    ctx.strokeStyle = 'black'
    ctx.stroke()
    ctx.fillStyle = 'white'
    ctx.fill()
  }
}

/**
 * Sets the CSS cursor style based on which selection control point is being hovered.
 */
function setSelectionCursorStyle() {
  if (!vectorGui.selectedCollisionPresent) {
    canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
    return
  }
  const xKey = vectorGui.collidedPoint.xKey
  if (['px1', 'px5'].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = 'nwse-resize'
  } else if (['px3', 'px7'].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = 'nesw-resize'
  } else if (['px2', 'px6'].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = 'ns-resize'
  } else if (['px4', 'px8'].includes(xKey)) {
    canvas.vectorGuiCVS.style.cursor = 'ew-resize'
  } else if (xKey === 'px9') {
    canvas.vectorGuiCVS.style.cursor = 'move'
  }
}
