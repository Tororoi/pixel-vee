import { vectorGui } from './vector.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import {
  checkSquarePointCollision,
  getGuiLineWidth,
  doubleStroke,
} from '../utils/guiHelpers.js'
import {
  getControlPointXOffset,
  getControlPointYOffset,
  getRenderXOffset,
  getRenderYOffset,
} from '../utils/coordinateHelpers.js'

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} pointsKeys - The keys of the control points
 * @param {boolean} modify - if true, check for collision with cursor
 * @param {object} vector - The vector to be rendered
 */
export function drawControlPoints(
  vectorProperties,
  pointsKeys,
  modify = false,
  vector = null,
) {
  for (let keys of pointsKeys) {
    const point = {
      x: vectorProperties[keys.x],
      y: vectorProperties[keys.y],
    }

    if (point.x == null || point.y == null) continue

    handleCollisionAndDraw(keys, point, modify, vector)
  }

  setCursorStyle()
}

/**
 * Resolves whether a control point on the current vector is selected or cursor-colliding.
 * Sets collision state on vectorGui/state as a side effect.
 * @param {object} keys - The x/y property keys for this control point
 * @param {number} normalizedX - Point x plus layer offset
 * @param {number} normalizedY - Point y plus layer offset
 * @param {number} collisionRadius - Collision half-width in art pixels
 * @returns {{ isActive: boolean }} Whether the point is active
 */
function resolveCurrentVectorCollision(
  keys,
  normalizedX,
  normalizedY,
  collisionRadius,
) {
  if (
    checkSquarePointCollision(
      globalState.cursor.x,
      globalState.cursor.y,
      normalizedX,
      normalizedY,
      collisionRadius,
    )
  ) {
    vectorGui.setCollision(keys)
    return { isActive: true }
  }
  return { isActive: false }
}

/**
 * Resolves whether a control point on another vector is cursor-colliding, and handles linking.
 * Sets collision state on vectorGui/state as a side effect.
 * @param {object} keys - The x/y property keys for this control point
 * @param {number} normalizedX - Point x plus layer offset
 * @param {number} normalizedY - Point y plus layer offset
 * @param {number} collisionRadius - Collision half-width in art pixels
 * @param {object} vector - The other vector being checked
 * @returns {{ isActive: boolean }} Whether the point is active
 */
function resolveOtherVectorCollision(
  keys,
  normalizedX,
  normalizedY,
  collisionRadius,
  vector,
) {
  if (
    !checkSquarePointCollision(
      globalState.cursor.x,
      globalState.cursor.y,
      normalizedX,
      normalizedY,
      collisionRadius,
    )
  ) {
    return { isActive: false }
  }

  if (keys.x === 'px1' || keys.x === 'px2') {
    globalState.vector.collidedIndex = vector.index
    vectorGui.setOtherVectorCollision(keys)
    //Only allow link if active point for selection is p1 or p2
    let linkingPoint = null
    if (vectorGui.selectedPoint.xKey) {
      linkingPoint = vectorGui.selectedPoint
    } else if (vectorGui.collidedPoint.xKey) {
      linkingPoint = vectorGui.collidedPoint
    }
    const allowLink = ['px1', 'px2'].includes(linkingPoint?.xKey)
    if (allowLink) {
      vectorGui.addLinkedVector(vector, keys.x, linkingPoint)
      if (globalState.tool.clickCounter === 0) {
        return { isActive: true }
      }
    } else if (!vectorGui.selectedPoint.xKey) {
      if (globalState.tool.clickCounter === 0) {
        return { isActive: true }
      }
    }
  } else if (
    (keys.x === 'px3' || keys.x === 'px4') &&
    !vectorGui.selectedPoint.xKey
  ) {
    globalState.vector.collidedIndex = vector.index
    //only set new radius if selected vector is not a new vector being drawn
    if (globalState.tool.clickCounter === 0) {
      return { isActive: true }
    }
  }
  return { isActive: false }
}

/**
 * Resolves linked vectors when the collided point is px3 or px4.
 * @param {object} keys - The x/y property keys for this control point
 * @param {number} normalizedX - Point x plus layer offset
 * @param {number} normalizedY - Point y plus layer offset
 * @param {object} vector - The vector being checked for linking
 */
function resolveLinkedVectors(keys, normalizedX, normalizedY, vector) {
  if (!vector) return

  const currentVectorModes =
    globalState.vector.all[globalState.vector.currentIndex]?.modes

  if (vectorGui.collidedPoint.xKey === 'px3') {
    if (
      normalizedX ===
        globalState.vector.properties.px1 + globalState.canvas.cropOffsetX &&
      normalizedY ===
        globalState.vector.properties.py1 + globalState.canvas.cropOffsetY
    ) {
      vectorGui.addLinkedVector(vector, keys.x, { xKey: 'px1', yKey: 'py1' })
    }
    // A quadCurve's px3 is its only handle and affects both endpoints,
    // so also propagate to vectors linked at px2.
    // A cubicCurve's px3 only governs p1, so skip this check for cubics.
    if (currentVectorModes?.quadCurve) {
      if (
        normalizedX ===
          globalState.vector.properties.px2 + globalState.canvas.cropOffsetX &&
        normalizedY ===
          globalState.vector.properties.py2 + globalState.canvas.cropOffsetY
      ) {
        vectorGui.addLinkedVector(vector, keys.x, { xKey: 'px2', yKey: 'py2' })
      }
    }
  }
  if (vectorGui.collidedPoint.xKey === 'px4') {
    if (
      normalizedX ===
        globalState.vector.properties.px2 + globalState.canvas.cropOffsetX &&
      normalizedY ===
        globalState.vector.properties.py2 + globalState.canvas.cropOffsetY
    ) {
      vectorGui.addLinkedVector(vector, keys.x, { xKey: 'px2', yKey: 'py2' })
    }
  }
}

/**
 * Draws a crosshair with a small center dot for a hovered/selected control point.
 * @param {number} cx - Canvas x coordinate (with offsets and 0.5 subpixel adjustment)
 * @param {number} cy - Canvas y coordinate (with offsets and 0.5 subpixel adjustment)
 * @param {number} r - Active radius
 * @param {number} lw - GUI line width
 */
function drawActiveControlPoint(cx, cy, r, lw) {
  const gap = r * 0.55
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.moveTo(cx - r, cy)
  canvas.vectorGuiCTX.lineTo(cx - gap, cy)
  canvas.vectorGuiCTX.moveTo(cx + gap, cy)
  canvas.vectorGuiCTX.lineTo(cx + r, cy)
  canvas.vectorGuiCTX.moveTo(cx, cy - r)
  canvas.vectorGuiCTX.lineTo(cx, cy - gap)
  canvas.vectorGuiCTX.moveTo(cx, cy + gap)
  canvas.vectorGuiCTX.lineTo(cx, cy + r)
  canvas.vectorGuiCTX.lineCap = 'square'
  doubleStroke(canvas.vectorGuiCTX, lw, 'black', 'white')
  canvas.vectorGuiCTX.lineCap = 'butt'
  // Small filled circle at center
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.arc(cx, cy, r * 0.2, 0, 2 * Math.PI)
  canvas.vectorGuiCTX.lineWidth = lw * 2
  canvas.vectorGuiCTX.strokeStyle = 'black'
  canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.fillStyle = 'white'
  canvas.vectorGuiCTX.fill()
}

/**
 * Draws a filled circle (modify=true) or outline circle (modify=false) for a non-active point.
 * The outline circle is skipped when the cursor is close enough that the modify pass will
 * draw a crosshair instead.
 * @param {number} cx - Canvas x coordinate (with offsets and 0.5 subpixel adjustment)
 * @param {number} cy - Canvas y coordinate (with offsets and 0.5 subpixel adjustment)
 * @param {number} renderRadius - Radius used for visual circle drawing
 * @param {number} lw - GUI line width
 * @param {boolean} modify - If true, draw interactive filled circle; otherwise draw outline circle
 * @param {object} keys - The x/y property keys for this control point
 * @param {number} normalizedX - Point x plus layer offset
 * @param {number} normalizedY - Point y plus layer offset
 * @param {number} collisionRadius - Collision half-width in art pixels (used for wouldBeActive check)
 */
function drawInactiveControlPoint(
  cx,
  cy,
  renderRadius,
  lw,
  modify,
  keys,
  normalizedX,
  normalizedY,
  collisionRadius,
) {
  if (modify) {
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.arc(cx, cy, renderRadius * 1.5, 0, 2 * Math.PI)
    canvas.vectorGuiCTX.lineWidth = lw * 2
    canvas.vectorGuiCTX.strokeStyle = 'black'
    canvas.vectorGuiCTX.stroke()
    canvas.vectorGuiCTX.fillStyle = 'white'
    canvas.vectorGuiCTX.fill()
  } else {
    // Skip if the modify pass will draw a crosshair here
    const wouldBeActive =
      vectorGui.selectedPoint.xKey === keys.x ||
      checkSquarePointCollision(
        globalState.cursor.x,
        globalState.cursor.y,
        normalizedX,
        normalizedY,
        collisionRadius,
      )
    if (!wouldBeActive) {
      canvas.vectorGuiCTX.beginPath()
      canvas.vectorGuiCTX.arc(cx, cy, renderRadius * 1.5, 0, 2 * Math.PI)
      doubleStroke(canvas.vectorGuiCTX, lw, 'black', 'white')
    }
  }
}

/**
 * TODO: (Low Priority) radius is set progressively as the render function iterates through points,
 * but ideally only the points corresponding to selectedPoint and collidedPoint should be rendered
 * with an expanded radius.
 * @param {object} keys - The keys of the control points
 * @param {object} point - The coordinates of the control point
 * @param {boolean} modify - if true, check for collision with cursor
 * @param {object} vector - The vector to be rendered
 */
function handleCollisionAndDraw(keys, point, modify, vector) {
  // Preview (modify=false) circles are 3× larger than interactive circles.
  // renderRadius is a multiplier against lineWidth so circles stay proportional across zoom levels.
  // Touch devices have pre-doubled canvas.gui.renderRadius and canvas.gui.collisionRadius.
  const renderRadius =
    canvas.gui.renderRadius * canvas.gui.lineWidth * (modify ? 1 : 3)
  const collisionRadius = canvas.gui.collisionRadius

  // Translate the stored layer-relative point into cursor space (art-pixel,
  // pan-agnostic) so it can be compared directly with globalState.cursor.x/y.
  const xOffset = getControlPointXOffset(vector)
  const yOffset = getControlPointYOffset(vector)
  const normalizedX = point.x + xOffset
  const normalizedY = point.y + yOffset

  // Collision detection — only when modify=true (i.e. an adjustable tool is active).
  let isActive = false
  if (modify) {
    if (vectorGui.selectedPoint.xKey === keys.x && !vector) {
      // This point is already selected on the current (in-progress) vector —
      // mark active and record the collision without doing a proximity check.
      isActive = true
      vectorGui.setCollision(keys)
    } else if (vector) {
      // Point belongs to a stored (non-current) vector — check whether the
      // cursor is close enough to register a collision with it.
      const result = resolveOtherVectorCollision(
        keys,
        normalizedX,
        normalizedY,
        collisionRadius,
        vector,
      )
      isActive = result.isActive
    } else {
      // Point belongs to the current (in-progress) vector — check proximity
      // to determine whether this point should be considered hovered/grabbed.
      const result = resolveCurrentVectorCollision(
        keys,
        normalizedX,
        normalizedY,
        collisionRadius,
      )
      isActive = result.isActive
    }
    // Update any vectors that share an endpoint with this point so their
    // collision state stays in sync (used for chaining/linking).
    resolveLinkedVectors(keys, normalizedX, normalizedY, vector)
  }

  // Compute the final on-screen position (cursor space + pan offset + half-pixel
  // snap) and draw the control point as active (filled) or inactive (stroked).
  const lw = getGuiLineWidth()
  const renderXOffset = getRenderXOffset(vector)
  const renderYOffset = getRenderYOffset(vector)
  const cx = point.x + renderXOffset + 0.5
  const cy = point.y + renderYOffset + 0.5
  if (isActive) {
    drawActiveControlPoint(cx, cy, renderRadius * 5, lw)
  } else {
    drawInactiveControlPoint(
      cx,
      cy,
      renderRadius,
      lw,
      modify,
      keys,
      normalizedX,
      normalizedY,
      collisionRadius,
    )
  }
}

/**
 * Returns true if the current collision is on a chainable endpoint (px1/px2 of a line vector).
 * Used to suppress the grab cursor when chain mode is active.
 * @returns {boolean} True if the collision is on a chainable endpoint, false otherwise
 */
function isChainableCollision() {
  const endpointKeys = ['px1', 'px2']
  if (
    vectorGui.selectedCollisionPresent &&
    globalState.vector.currentIndex !== null &&
    endpointKeys.includes(vectorGui.collidedPoint.xKey)
  ) {
    const currentVector =
      globalState.vector.all[globalState.vector.currentIndex]
    if (currentVector?.vectorProperties.tool === 'curve') return true
  }
  if (
    globalState.vector.collidedIndex !== null &&
    endpointKeys.includes(vectorGui.otherCollidedKeys.xKey)
  ) {
    const collidedVector =
      globalState.vector.all[globalState.vector.collidedIndex]
    if (collidedVector?.vectorProperties.tool === 'curve') return true
  }
  return false
}

/**
 * Set css cursor for vector interaction
 */
function setCursorStyle() {
  if (
    !vectorGui.selectedCollisionPresent &&
    !globalState.vector.collidedIndex
  ) {
    if (
      globalState.vector.selectedIndices.size > 0 &&
      globalState.tool.current.type === 'vector'
    ) {
      //For transform actions
      canvas.vectorGuiCVS.style.cursor = 'move'
      return
    }
    canvas.vectorGuiCVS.style.cursor = globalState.tool.current.modes?.eraser
      ? 'none'
      : globalState.cursor.clicked
        ? globalState.tool.current.activeCursor
        : globalState.tool.current.cursor
    return
  }

  //If pointer is colliding with a vector control point:
  if (globalState.tool.current.name !== 'move') {
    if (globalState.tool.clickCounter !== 0) {
      //creating new vector, don't use grab cursor
      canvas.vectorGuiCVS.style.cursor = 'move'
    } else if (
      globalState.tool.current.options?.chain?.active &&
      isChainableCollision()
    ) {
      //chain mode: show normal tool cursor over chainable endpoints
      canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
    } else if (globalState.cursor.clicked) {
      canvas.vectorGuiCVS.style.cursor = 'grabbing'
    } else {
      canvas.vectorGuiCVS.style.cursor = 'grab'
    }
  } else {
    //Handle cursor for transform
    const xKey = vectorGui.collidedPoint.xKey
    if (['px1', 'px4'].includes(xKey)) {
      canvas.vectorGuiCVS.style.cursor = 'nwse-resize'
    } else if (['px2', 'px3'].includes(xKey)) {
      canvas.vectorGuiCVS.style.cursor = 'nesw-resize'
    }
  }
}
