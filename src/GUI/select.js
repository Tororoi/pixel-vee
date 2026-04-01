import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { vectorGui } from '../GUI/vector.js'
import {
  checkSquarePointCollision,
  checkAreaCollision,
  getGuiLineWidth,
} from '../utils/guiHelpers.js'
import { SCALE } from '../utils/constants.js'

//=============================================//
//======= * * * Marching Ants Loop * * * ======//
//=============================================//

let marchOffset = 0
let marchAnimId = null

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

/**
 * Advances the march offset and re-renders the selection canvas each frame.
 */
function tickMarchingAnts() {
  marchOffset += 0.25 / canvas.zoom
  marchOffset %= 8
  marchAnimId = requestAnimationFrame(tickMarchingAnts)
  renderSelectionCVS()
}

/**
 * Starts the marching ants animation loop if not already running.
 */
function startMarchingAnts() {
  if (marchAnimId !== null) return
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
 * @param {number} dashOffset - current marchOffset
 * @param {Path2D|null} path - optional Path2D; uses current path if omitted
 */
function strokeMarchingAnts(ctx, dashOffset, path = null) {
  ctx.lineWidth = 1 / canvas.zoom
  ctx.setLineDash([8 / canvas.zoom, 8 / canvas.zoom])
  ctx.strokeStyle = 'white'
  ctx.lineDashOffset = dashOffset
  path ? ctx.stroke(path) : ctx.stroke()
  ctx.strokeStyle = 'black'
  ctx.lineDashOffset = dashOffset + 8 / canvas.zoom
  path ? ctx.stroke(path) : ctx.stroke()
  ctx.setLineDash([])
}

//=============================================//
//======== * * * Outline Renders * * * ========//
//=============================================//

/**
 * Renders the marching-ants contour outline for magic wand selections.
 * Uses a cached Path2D rebuilt only when the maskSet or canvas pan changes.
 * @param {number} lineDashOffset - current march offset
 */
function renderMaskContourOutline(lineDashOffset) {
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

  strokeMarchingAnts(ctx, lineDashOffset, cachedMaskPath)
  ctx.restore()
}

/**
 * Renders the selection box outline and optional transform control points.
 * @param {number} lineDashOffset - current march offset
 * @param {boolean} drawPoints - if true, draw transform control points
 */
export function renderSelectionBoxOutline(lineDashOffset, drawPoints) {
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
      strokeMarchingAnts(ctx, lineDashOffset)
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

/**
 * Adds a single vector shape's path to the current canvas path.
 * @param {CanvasRenderingContext2D} ctx - selection GUI canvas rendering context
 * @param {object} vp - vectorProperties object
 * @param {number} xOffset - horizontal draw offset
 * @param {number} yOffset - vertical draw offset
 */
function addVectorToPath(ctx, vp, xOffset, yOffset) {
  switch (vp.type) {
    case 'fill':
      // TODO: (Low Priority) improve visual indicator for fill vector selection
      ctx.moveTo(xOffset + vp.px1 + 0.5, yOffset + vp.py1 + 0.5)
      ctx.lineTo(xOffset + vp.px1 + 0.5, yOffset + vp.py1 + 0.5)
      break
    case 'line':
      ctx.moveTo(xOffset + vp.px1 + 0.5, yOffset + vp.py1 + 0.5)
      ctx.lineTo(xOffset + vp.px2 + 0.5, yOffset + vp.py2 + 0.5)
      break
    case 'quadCurve':
      ctx.moveTo(xOffset + vp.px1 + 0.5, yOffset + vp.py1 + 0.5)
      ctx.quadraticCurveTo(
        xOffset + vp.px3 + 0.5,
        yOffset + vp.py3 + 0.5,
        xOffset + vp.px2 + 0.5,
        yOffset + vp.py2 + 0.5,
      )
      break
    case 'cubicCurve':
      ctx.moveTo(xOffset + vp.px1 + 0.5, yOffset + vp.py1 + 0.5)
      ctx.bezierCurveTo(
        xOffset + vp.px3 + 0.5,
        yOffset + vp.py3 + 0.5,
        xOffset + vp.px4 + 0.5,
        yOffset + vp.py4 + 0.5,
        xOffset + vp.px2 + 0.5,
        yOffset + vp.py2 + 0.5,
      )
      break
    case 'ellipse': {
      const { px1, py1, px3, radA, radB, angle, x1Offset, y1Offset } = vp
      const majorAxis = radA + x1Offset / 2 > 0 ? radA + x1Offset / 2 : 0
      let minorAxis = radB + y1Offset / 2 > 0 ? radB + y1Offset / 2 : 0
      if (!Number.isInteger(px3)) minorAxis = majorAxis
      const centerX = xOffset + px1 + 0.5 + x1Offset / 2
      const centerY = yOffset + py1 + 0.5 + y1Offset / 2
      // Start point at angle=0 on the ellipse
      ctx.moveTo(
        centerX + majorAxis * Math.cos(angle),
        centerY + majorAxis * Math.sin(angle),
      )
      ctx.ellipse(centerX, centerY, majorAxis, minorAxis, angle, 0, 2 * Math.PI)
      break
    }
    default:
  }
}

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
  const isVectorSelection =
    state.vector.selectedIndices.size > 0 &&
    state.tool.current.type === 'vector'

  if (isRasterSelection || isVectorSelection) {
    startMarchingAnts()
    ctx.save()
    ctx.beginPath()

    if (isRasterSelection) {
      if (!state.selection.maskSet) {
        // Grey overlay outside the rectangular selection (evenodd clip)
        ctx.rect(
          canvas.xOffset,
          canvas.yOffset,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height,
        )
        ctx.rect(
          canvas.xOffset + state.selection.boundaryBox.xMin,
          canvas.yOffset + state.selection.boundaryBox.yMin,
          state.selection.boundaryBox.xMax - state.selection.boundaryBox.xMin,
          state.selection.boundaryBox.yMax - state.selection.boundaryBox.yMin,
        )
        ctx.clip('evenodd')
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
        ctx.fillRect(
          canvas.xOffset,
          canvas.yOffset,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height,
        )
      }
      ctx.restore()
      if (state.selection.maskSet) {
        renderMaskContourOutline(marchOffset)
      } else {
        const shouldRenderPoints =
          state.tool.current.name === 'select' ||
          (state.tool.current.name === 'move' && canvas.pastedLayer) ||
          canvas.currentLayer.type === 'reference' ||
          state.vector.transformMode === SCALE
        renderSelectionBoxOutline(marchOffset, shouldRenderPoints)
      }
    } else if (isVectorSelection) {
      if (vectorGui.outlineVectorSelection) {
        // Grey overlay over entire canvas
        ctx.rect(
          canvas.xOffset,
          canvas.yOffset,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height,
        )
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(
          canvas.xOffset,
          canvas.yOffset,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height,
        )

        // Build combined path for all selected vectors
        const xOffset = canvas.currentLayer.x + canvas.xOffset
        const yOffset = canvas.currentLayer.y + canvas.yOffset
        ctx.beginPath()
        for (const vectorIndex of state.vector.selectedIndices) {
          const vector = state.vector.all[vectorIndex]
          if (vector.hidden || vector.removed) continue
          addVectorToPath(ctx, vector.vectorProperties, xOffset, yOffset)
        }

        // Stroke with animated dashed outline + eraser pass to clear grey over vectors
        const lineWidth = getGuiLineWidth()
        ctx.lineWidth = lineWidth * 19
        ctx.lineCap = 'round'
        ctx.strokeStyle = 'white'
        ctx.stroke()
        ctx.lineDashOffset = marchOffset * 2
        ctx.setLineDash([lineWidth * 12, lineWidth * 12])
        ctx.lineWidth = lineWidth * 20
        ctx.lineCap = 'butt'
        ctx.strokeStyle = 'black'
        ctx.stroke()
        ctx.setLineDash([])
        ctx.lineWidth = lineWidth * 17
        ctx.lineCap = 'round'
        ctx.strokeStyle = 'black'
        ctx.stroke()
        ctx.restore()
      }
    }
  } else {
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
 */
export function drawSelectControlPoints(
  boundaryBox,
  pointsKeys,
  radius,
  modify = false,
  offset = 0,
  vectorAction = null,
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
 */
function handleSelectCollisionAndDraw(
  keys,
  point,
  radius,
  modify,
  offset,
  vectorAction,
) {
  const ctx = canvas.selectionGuiCTX
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
          state.selection.boundaryBox.xMin + r * 2,
          point.y - offset + yOffset - r * 2,
          state.selection.boundaryBox.xMax - r * 2 - 1,
          point.y - offset + yOffset + r * 2,
        )) ||
      (['px4', 'px8'].includes(keys.x) &&
        checkAreaCollision(
          state.cursor.x,
          state.cursor.y,
          point.x - offset + xOffset - r * 2,
          state.selection.boundaryBox.yMin + r * 2,
          point.x - offset + xOffset + r * 2,
          state.selection.boundaryBox.yMax - r * 2 - 1,
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
