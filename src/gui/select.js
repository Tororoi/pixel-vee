import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
import { vectorGui } from '../gui/vector.js'
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
 * Returns the marching-ants dash length in art pixels for the current zoom
 * level. The length is always 1/(2n) so a dash pair (one white, one black)
 * spans exactly one art pixel, keeping the pattern visually crisp at any
 * zoom. The divisor grows with zoom so individual dashes never shrink below
 * one screen pixel at very high zoom levels.
 * @returns {number} dash length in art pixels
 */
function getMarchDashLen() {
  // zoom/20 steps the divisor up at 20×, 40×, 60× etc., keeping each
  // dash at least one screen pixel wide as zoom increases.
  return 1 / (2 * Math.max(1, Math.round(canvas.zoom / 20)))
}

// Path2D cache — rebuilt only when maskSet reference or canvas pan changes
let cachedMaskPath = null
let cachedMaskSetRef = null
let cachedPathXOffset = null
let cachedPathYOffset = null

/**
 * Builds a Path2D from the exposed edges of every pixel in the mask set.
 * Each edge is emitted as a directed segment wound clockwise so a single
 * ascending marchOffset drives the animation in the same visual direction
 * around every contiguous island of selected pixels. Coordinates are in
 * canvas space (art pixels plus pan offset) so the path strokes correctly
 * without an additional transform.
 * @param {Set<number>} maskSet - packed (y<<16)|x pixel coordinates
 * @returns {Path2D} path composed of all exposed border segments
 */
function buildMaskPath(maskSet) {
  const path = new Path2D()
  const canvasOffsetX = canvas.xOffset
  const canvasOffsetY = canvas.yOffset
  for (const key of maskSet) {
    const x = key & 0xffff
    const y = (key >> 16) & 0xffff
    // Top edge: left to right for clockwise marching
    if (!maskSet.has(((y - 1) << 16) | x)) {
      path.moveTo(canvasOffsetX + x, canvasOffsetY + y)
      path.lineTo(canvasOffsetX + x + 1, canvasOffsetY + y)
    }
    // Bottom edge: right to left for clockwise marching
    if (!maskSet.has(((y + 1) << 16) | x)) {
      path.moveTo(canvasOffsetX + x + 1, canvasOffsetY + y + 1)
      path.lineTo(canvasOffsetX + x, canvasOffsetY + y + 1)
    }
    // Left edge: bottom to top for clockwise marching
    if (!maskSet.has((y << 16) | (x - 1))) {
      path.moveTo(canvasOffsetX + x, canvasOffsetY + y + 1)
      path.lineTo(canvasOffsetX + x, canvasOffsetY + y)
    }
    // Right edge: top to bottom for clockwise marching
    if (!maskSet.has((y << 16) | (x + 1))) {
      path.moveTo(canvasOffsetX + x + 1, canvasOffsetY + y)
      path.lineTo(canvasOffsetX + x + 1, canvasOffsetY + y + 1)
    }
  }
  return path
}

let marchRenderer = renderSelectionCVS

/**
 * Single animation frame callback for the marching-ants loop. The dash
 * length is recalculated every frame so zoom changes take effect
 * immediately. marchOffset advances at a fixed fraction of a dash per
 * frame, wrapping to [0, 1) to keep arithmetic well-behaved.
 */
function tickMarchingAnts() {
  marchDashLen = getMarchDashLen()
  // 0.03125 = 1/32; advances by 1/32 of a dash per frame (~0.5 s/cycle
  // at 60 fps), giving a smooth but clearly perceptible crawl speed.
  marchOffset = (marchOffset + marchDashLen * 0.03125) % 1
  marchAnimId = requestAnimationFrame(tickMarchingAnts)
  marchRenderer()
}

/**
 * Starts the marching-ants animation loop, registering a renderer that
 * will be called once per frame. If the loop is already running, a
 * non-default renderer is still accepted so callers can redirect drawing
 * to a different canvas without restarting the RAF chain — restarting
 * would cause a one-frame flash and reset marchOffset mid-animation.
 * @param {Function} [renderer] - called each animation frame;
 *   defaults to renderSelectionCVS
 */
export function startMarchingAnts(renderer = renderSelectionCVS) {
  if (marchAnimId !== null) {
    // Loop already running — only update renderer if an explicit one is
    // passed, so callers that just want "ensure it's running" don't
    // silently replace a custom renderer set by another caller.
    if (renderer !== renderSelectionCVS) marchRenderer = renderer
    return
  }
  marchRenderer = renderer
  marchAnimId = requestAnimationFrame(tickMarchingAnts)
}

/**
 * Cancels the marching-ants animation loop. Safe to call when the loop
 * is not running; the null guard prevents a spurious cancelAnimationFrame
 * call that would produce a console warning in some browsers.
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
 * Strokes the current path with a thick black outer ring and a narrower
 * white inner ring, producing a high-contrast outline legible over any
 * background color. The 4× outer / 2× inner width ratio leaves exactly
 * one line-width of black visible on each side of the white stroke.
 * @param {CanvasRenderingContext2D} ctx - selection GUI canvas context
 * @param {number} lineWidth - base line width in canvas units
 * @param {Path2D|null} [path] - explicit path to stroke; uses the
 *   current path when omitted
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
 * Strokes the marching-ants pattern onto the given context path. Two
 * passes are made with the same dash array: first white, then black
 * phase-shifted by one dash length so black fills the gaps left by
 * white. Animating marchOffset each frame makes the interleaved border
 * appear to crawl. The dash array is cleared after both passes so
 * subsequent drawing calls on the same context are unaffected.
 * @param {CanvasRenderingContext2D} ctx - selection GUI canvas context
 * @param {number} [lineWidth] - line width; defaults to one art pixel
 *   at current zoom
 * @param {Path2D|null} [path] - explicit path to stroke; uses the
 *   current path when omitted
 */
export function strokeMarchingAnts(
  ctx,
  lineWidth = 1 / canvas.zoom,
  path = null,
) {
  ctx.lineWidth = lineWidth
  ctx.setLineDash([marchDashLen, marchDashLen])
  ctx.strokeStyle = 'white'
  ctx.lineDashOffset = marchOffset
  path ? ctx.stroke(path) : ctx.stroke()
  ctx.strokeStyle = 'black'
  // Shift by one dash so black lands exactly in the white gaps.
  ctx.lineDashOffset = marchOffset + marchDashLen
  path ? ctx.stroke(path) : ctx.stroke()
  ctx.setLineDash([])
}

//=============================================//
//======== * * * Outline Renders * * * ========//
//=============================================//

/**
 * Draws the animated marching-ants border around a magic-wand (mask-set)
 * selection. The Path2D is rebuilt only when the maskSet reference
 * changes or the canvas is panned, because path coordinates are in
 * canvas space: a pan shifts all art pixels, so the cached path would
 * stroke at the wrong position without a rebuild. Caching avoids
 * iterating the full pixel set on every animation frame, which is
 * expensive for large selections.
 */
function renderMaskContourOutline() {
  const maskSet = globalState.selection.maskSet
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
 * Draws the rectangular selection outline and, optionally, the eight
 * transform-handle control points. Pasted layers and reference layers
 * receive a static solid border rather than marching ants because they
 * are not true pixel-mask selections — they behave as floating objects,
 * and the solid border communicates that distinction to the user.
 * Control-point radius is larger at low zoom so handles remain
 * comfortably clickable when art pixels are small on screen.
 * @param {boolean} drawPoints - when true, render the eight resize handles
 */
export function renderSelectionBoxOutline(drawPoints) {
  const ctx = canvas.selectionGuiCTX
  const lineWidth = getGuiLineWidth()
  ctx.save()
  ctx.lineCap = 'round'

  if (globalState.selection.boundaryBox.xMax !== null) {
    ctx.beginPath()
    ctx.rect(
      canvas.xOffset + globalState.selection.boundaryBox.xMin,
      canvas.yOffset + globalState.selection.boundaryBox.yMin,
      globalState.selection.boundaryBox.xMax -
        globalState.selection.boundaryBox.xMin,
      globalState.selection.boundaryBox.yMax -
        globalState.selection.boundaryBox.yMin,
    )
    if (!canvas.pastedLayer && canvas.currentLayer.type !== 'reference') {
      strokeMarchingAnts(ctx)
    } else {
      // Pasted/reference layers are floating objects, not pixel masks;
      // use a static border to signal they move as a unit.
      strokeBorderOnTop(ctx, lineWidth)
    }
  }

  if (drawPoints) {
    // Below zoom 4 the art pixels are tiny; grow handles proportionally
    // so they stay at least 8 screen pixels across and remain clickable.
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
      globalState.selection.boundaryBox,
      pointsKeys,
      circleRadius / 2,
      true,
      0.5,
    )
  }

  ctx.restore()
}

/**
 * Main entry point for repainting the selection overlay canvas. Clears
 * the entire canvas first, then renders a dim overlay, mask contour, or
 * bounding-box outline depending on the active selection type. The
 * marching-ants loop is started here when a raster selection becomes
 * active and stopped when it clears, so animation lifetime is tied
 * directly to selection visibility. The resizeOverlayActive guard
 * suppresses the stop call and the dim overlay so the resize-handle
 * canvas layer can operate independently on the same element.
 */
export function renderSelectionCVS() {
  const ctx = canvas.selectionGuiCTX
  ctx.clearRect(
    0,
    0,
    canvas.selectionGuiCVS.width,
    canvas.selectionGuiCVS.height,
  )
  const isRasterSelection = globalState.selection.boundaryBox.xMax !== null
  // const isVectorSelection =
  //   globalState.vector.selectedIndices.size > 0 &&
  //   globalState.tool.current.type === 'vector'

  if (isRasterSelection) {
    startMarchingAnts()
    if (
      !globalState.selection.maskSet &&
      !globalState.canvas.resizeOverlayActive
    ) {
      renderSelectionDimOverlay(ctx)
    }
    if (globalState.selection.maskSet) {
      renderMaskContourOutline()
    } else {
      // Show resize handles for the select tool, move tool with a pasted
      // layer, reference layers, and vector scale mode — these are the
      // contexts where the user can resize or reposition the selection.
      const shouldRenderPoints =
        globalState.tool.current.name === 'select' ||
        (globalState.tool.current.name === 'move' && canvas.pastedLayer) ||
        canvas.currentLayer.type === 'reference' ||
        globalState.vector.transformMode === SCALE
      renderSelectionBoxOutline(shouldRenderPoints)
    }
  } else if (!globalState.canvas.resizeOverlayActive) {
    // Only stop the loop when not in resize mode; the canvas clear at
    // the top still runs and is needed during resize.
    stopMarchingAnts()
  }
}

//=============================================//
//===== * * * Control Point Rendering * * * ===//
//=============================================//

/**
 * Draws the eight resize handles around the selection bounding box and
 * registers a px9 interior collision zone so the pointer cursor switches
 * to "move" when hovering anywhere inside the box. The interior check
 * runs before the handle loop so px9 is always registered even when the
 * cursor is not near any edge handle. Handle positions are derived from
 * the box corners and axis midpoints; pointsKeys controls which subset
 * of the eight positions are drawn and their collision key names.
 * @param {object} boundaryBox - bounding box with xMin/yMin/xMax/yMax
 * @param {Array} pointsKeys - ordered {x, y} key-name pairs mapping to
 *   the eight handle positions
 * @param {number} radius - base hit-test and draw radius in art pixels
 * @param {boolean} [modify] - when true, run cursor collision detection
 *   and enlarge the radius on hit
 * @param {number} [offset] - sub-pixel offset applied to each handle
 *   center for crisp rendering
 * @param {object|null} [vectorAction] - optional vector action whose
 *   layer offset is added to all handle coordinates
 * @param {CanvasRenderingContext2D} [ctx] - rendering context; defaults
 *   to selectionGuiCTX
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

  // Register the interior as the px9 "move" zone before processing edge
  // handles so the zone exists even when no edge handle is hovered.
  if (
    globalState.cursor.x >= xMin &&
    globalState.cursor.x < xMax &&
    globalState.cursor.y >= yMin &&
    globalState.cursor.y < yMax
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
    // indexOf maps each keys entry to its position in points — the two
    // arrays are intentionally parallel.
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
 * Runs cursor-collision detection for one control-point handle and draws
 * it. Corner handles (px1/3/5/7) render as squares; edge handles
 * (px2/4/6/8) render as 45°-rotated diamonds to visually communicate
 * their single-axis resize direction. Edge handles also receive a
 * full-axis hit strip so users can grab them anywhere along the edge
 * rather than only on the small diamond center. Touch mode doubles the
 * radius because finger targets require a larger hit area than a mouse
 * cursor. When a handle is the currently selected (dragged) point and no
 * vectorAction override is present, collision is forced on to keep the
 * cursor style correct during drags that wander off the handle center.
 * @param {object} keys - {x, y} key names identifying this control point
 * @param {object} point - {x, y} art-pixel coordinates of the handle
 * @param {number} radius - base radius in art pixels
 * @param {boolean} modify - when true, run collision detection
 * @param {number} offset - sub-pixel centering offset
 * @param {object|null} vectorAction - optional layer-offset source
 * @param {object} boundaryBox - bounding box for edge-strip hit bounds
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
  // Touch targets need twice the radius to be reliably tappable.
  let r = globalState.tool.touch ? radius * 2 : radius
  const xOffset = vectorAction ? vectorAction.layer.x : 0
  const yOffset = vectorAction ? vectorAction.layer.y : 0

  if (modify) {
    const collisionPresent =
      checkSquarePointCollision(
        globalState.cursor.x,
        globalState.cursor.y,
        point.x - offset + xOffset,
        point.y - offset + yOffset,
        r * 2.125,
      ) ||
      (['px2', 'px6'].includes(keys.x) &&
        checkAreaCollision(
          globalState.cursor.x,
          globalState.cursor.y,
          boundaryBox.xMin + r * 2,
          point.y - offset + yOffset - r * 2,
          boundaryBox.xMax - r * 2 - 1,
          point.y - offset + yOffset + r * 2,
        )) ||
      (['px4', 'px8'].includes(keys.x) &&
        checkAreaCollision(
          globalState.cursor.x,
          globalState.cursor.y,
          point.x - offset + xOffset - r * 2,
          boundaryBox.yMin + r * 2,
          point.x - offset + xOffset + r * 2,
          boundaryBox.yMax - r * 2 - 1,
        ))
    if (collisionPresent) {
      r = radius * 2.125
      vectorGui.setCollision(keys)
    } else if (vectorGui.selectedPoint.xKey === keys.x && !vectorAction) {
      // Force collision active for the dragged point so the cursor does
      // not flicker back to the default style mid-drag.
      vectorGui.setCollision(keys)
    }
  }

  // Cap line-width growth at zoom 8 to prevent handles from becoming
  // visually overwhelming at very high zoom levels.
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
    // Side points: diamond — scale r by √2 so the tip-to-center distance
    // matches the corner handle's half-width before the 45° rotation.
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
 * Updates the vector-GUI canvas CSS cursor to reflect which selection
 * handle the pointer is currently over. The cursor reverts to the active
 * tool's default when no collision is present. Diagonal corners map to
 * nwse/nesw to match their physical orientation on screen; edge handles
 * use single-axis ns/ew cursors. The interior zone (px9) shows "move"
 * because dragging from inside the box translates the selection rather
 * than resizing it.
 */
function setSelectionCursorStyle() {
  if (!vectorGui.selectedCollisionPresent) {
    canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
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
