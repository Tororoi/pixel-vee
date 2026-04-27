import { vectorGui } from './vector.js'
import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
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
 * Iterates over a list of control point key objects and draws each
 * one, skipping points whose coordinates are null (not yet placed
 * during a multi-click draw sequence). After all points are drawn the
 * cursor style is updated once so the last collision to register wins
 * — matching the draw-order priority used elsewhere in the vector GUI.
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
 * Checks whether the cursor is within collision distance of a control
 * point on the current in-progress vector. If so, records the hit on
 * vectorGui so downstream drawing and cursor logic can treat the point
 * as hovered. Called only during modify passes (when an adjustable
 * tool is active), so no further guard is needed inside this function.
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
 * Checks cursor proximity to a control point on a stored (non-current)
 * vector and handles cross-vector linking. Only endpoints (px1/px2)
 * can form links; handle points (px3/px4) on other vectors can only
 * set the collided-vector index so the active tool can inherit a
 * radius value. The clickCounter guard prevents collisions from
 * registering while the user is actively placing points — snapping to
 * a stored vector during an in-progress draw would create an
 * unintended link. Returns isActive only for idle-hover interactions.
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
    // Links only make sense at endpoints; handles have no chain semantics
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
    // Mid-draw the radius is being set interactively; don't override it
    if (globalState.tool.clickCounter === 0) {
      return { isActive: true }
    }
  }
  return { isActive: false }
}

/**
 * When the currently collided point is a handle (px3 or px4), scans
 * the given neighbor vector to see if any of its endpoints coincide
 * with the current vector's endpoints. If they do, the neighbor is
 * registered as a linked vector so dragging the handle propagates to
 * it. The quadCurve special-case exists because a quad's single handle
 * (px3) governs both endpoints geometrically; a cubic's px3 only
 * governs the p1 side, so the px2 propagation is skipped for cubics.
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
 * Draws a crosshair with a small filled center dot for a hovered or
 * selected control point. The four arms are broken at 55 % of the
 * outer radius to leave a gap around the focal point, visually
 * distinguishing an active point from a plain cross. The lineCap is
 * explicitly reset to 'butt' after the arms so subsequent strokes in
 * the same render pass inherit the canvas default. The center dot is
 * drawn as a separate arc so it can carry its own fill and outline
 * without affecting the arm stroke style.
 * @param {number} cx - Canvas x coordinate (with subpixel snap applied)
 * @param {number} cy - Canvas y coordinate (with subpixel snap applied)
 * @param {number} r - Active radius in canvas pixels
 * @param {number} lw - GUI line width in canvas pixels
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
  // Separate arc fills the gap so the exact point coordinate is marked
  canvas.vectorGuiCTX.beginPath()
  canvas.vectorGuiCTX.arc(cx, cy, r * 0.2, 0, 2 * Math.PI)
  canvas.vectorGuiCTX.lineWidth = lw * 2
  canvas.vectorGuiCTX.strokeStyle = 'black'
  canvas.vectorGuiCTX.stroke()
  canvas.vectorGuiCTX.fillStyle = 'white'
  canvas.vectorGuiCTX.fill()
}

/**
 * Draws a circle for a control point that is not currently active.
 * The visual differs by pass: modify=true (interactive) renders a
 * filled white circle with black border at 1.5× renderRadius;
 * modify=false (preview) renders only an outlined circle and skips it
 * entirely when the cursor is already close enough that the modify
 * pass will draw a crosshair there. Skipping prevents a ghost circle
 * from appearing beneath the crosshair when both passes render the
 * same canvas in the same frame.
 * @param {number} cx - Canvas x coordinate (with subpixel snap applied)
 * @param {number} cy - Canvas y coordinate (with subpixel snap applied)
 * @param {number} renderRadius - Base radius for circle drawing
 * @param {number} lw - GUI line width in canvas pixels
 * @param {boolean} modify - If true, draw interactive filled circle
 * @param {object} keys - The x/y property keys for this control point
 * @param {number} normalizedX - Point x in cursor (art-pixel) space
 * @param {number} normalizedY - Point y in cursor (art-pixel) space
 * @param {number} collisionRadius - Collision half-width in art pixels
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
 * Core per-point dispatch: computes radii, resolves collision state,
 * and routes to the appropriate draw function. Preview circles are
 * rendered at 3× the interactive radius so they are large enough to
 * see without being in modify mode. Two coordinate systems are needed:
 * normalizedX/Y (cursor/art-pixel space) for hit-testing, and cx/cy
 * (canvas-pixel space with pan offset) for drawing. The 0.5 subpixel
 * offset on cx/cy sharpens 1 px strokes on integer-aligned canvases.
 * Linked-vector resolution runs after the main collision branch so it
 * always has the latest collidedPoint state regardless of which branch
 * ran.
 * TODO: (Low Priority) radius is set progressively as the render
 * function iterates through points; ideally only selectedPoint and
 * collidedPoint should use the expanded radius.
 * @param {object} keys - The keys of the control points
 * @param {object} point - The coordinates of the control point
 * @param {boolean} modify - if true, check for collision with cursor
 * @param {object} vector - The vector to be rendered
 */
function handleCollisionAndDraw(keys, point, modify, vector) {
  // Preview circles are 3× larger than interactive — large enough to
  // see without being in modify mode. renderRadius scales against
  // lineWidth so circles stay proportional across zoom levels.
  // Touch devices pre-double canvas.gui.renderRadius and
  // canvas.gui.collisionRadius.
  const renderRadius =
    canvas.gui.renderRadius * canvas.gui.lineWidth * (modify ? 1 : 3)
  const collisionRadius = canvas.gui.collisionRadius

  // Translate the stored layer-relative point into cursor space (art-pixel,
  // pan-agnostic) so it can be compared directly with globalState.cursor.x/y.
  const xOffset = getControlPointXOffset(vector)
  const yOffset = getControlPointYOffset(vector)
  const normalizedX = point.x + xOffset
  const normalizedY = point.y + yOffset

  // Collision detection — only when modify=true
  // (i.e. an adjustable tool is active).
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

  // Compute the final on-screen position (cursor space + pan offset +
  // half-pixel snap) and draw the point as active or inactive.
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
 * Returns true when the cursor is hovering over an endpoint (px1 or
 * px2) of a curve-tool vector, whether that is the current in-progress
 * vector or a stored one. Chain mode uses this to display the regular
 * tool cursor over chainable endpoints instead of the grab cursor,
 * signaling that a click will extend the chain rather than move the
 * point. Only 'curve' tool vectors support chaining, so non-curve
 * collisions always return false even if they hit px1/px2.
 * @returns {boolean} True if the collision is on a chainable endpoint
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
 * Updates the CSS cursor on the vector GUI canvas overlay based on the
 * current collision and tool state. Priority order: (1) no collision
 * and no targeted vector — fall back to the tool default (eraser
 * forces none; a non-empty selection shows 'move'); (2) collision
 * during active draw (clickCounter > 0) — show 'move' to signal point
 * placement rather than grab; (3) chain-mode collision on a chainable
 * endpoint — show the tool's default cursor to signal chain
 * continuation; (4) normal collision — grab / grabbing; (5) transform
 * tool collision — diagonal resize matching the collided corner.
 * Called once per frame after all points are drawn so a single cursor
 * state covers the whole overlay.
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
      // No collision: the whole selection translates, so 'move' fits
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

  // Collision detected: cursor reflects drag potential, not tool state
  if (globalState.tool.current.name !== 'move') {
    if (globalState.tool.clickCounter !== 0) {
      // Clicking places a new point here, not drags an existing one
      canvas.vectorGuiCVS.style.cursor = 'move'
    } else if (
      globalState.tool.current.options?.chain?.active &&
      isChainableCollision()
    ) {
      // Tool cursor signals chain continuation, not a point grab
      canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
    } else if (globalState.cursor.clicked) {
      canvas.vectorGuiCVS.style.cursor = 'grabbing'
    } else {
      canvas.vectorGuiCVS.style.cursor = 'grab'
    }
  } else {
    // Resize direction depends on which bounding-box corner is grabbed
    const xKey = vectorGui.collidedPoint.xKey
    if (['px1', 'px4'].includes(xKey)) {
      canvas.vectorGuiCVS.style.cursor = 'nwse-resize'
    } else if (['px2', 'px3'].includes(xKey)) {
      canvas.vectorGuiCVS.style.cursor = 'nesw-resize'
    }
  }
}
