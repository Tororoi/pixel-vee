import { TRANSLATE, ROTATE, SCALE } from '../utils/constants.js'
import { state } from '../Context/state.js'
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
import { renderFillVector } from './fill.js'
import { renderCurveVector, renderCurvePath } from './curve.js'
import {
  renderEllipseVector,
  renderOffsetEllipseVector,
  renderEllipsePath,
} from './ellipse.js'
import { renderPolygonVector, renderPolygonPath } from './polygon.js'
import { renderVectorRotationControl } from './transform.js'
import { renderSelectionCVS } from './select.js'
import { renderGrid } from './grid.js'
import {
  updateVectorProperties,
  calculateCurrentVectorDeltas,
  handleOptionsAndUpdateVector,
  // findVectorShapeBoundaryBox,
} from '../utils/vectorHelpers.js'
import {
  disableActionsForNoSelection,
  enableActionsForSelection,
} from '../DOM/disableDomElements.js'
import { renderLinePath, renderLineVector } from './line.js'
import { renderResizeOverlayCVS } from '../Canvas/resizeOverlay.js'
// import { switchTool } from "../Tools/toolbox.js"

//==================================================//
//=== * * * Vector Graphics User Interface * * * ===//
//==================================================//

//Note: The Vector Graphics canvas has a mix-blend-mode: difference applied to it
export const vectorGui = {
  grid: false,
  gridSpacing: 8,
  showCursorPreview: true,
  mother: {
    x: null,
    y: null,
    newRotation: 0,
    currentRotation: 0,
    rotationOrigin: { x: null, y: null },
  },
  selectedCollisionPresent: false,
  collidedPoint: { xKey: null, yKey: null },
  selectedPoint: { xKey: null, yKey: null },
  otherCollidedKeys: { xKey: null, yKey: null },
  linkedVectors: {},
  drawControlPoints,
  resetCollision() {
    this.selectedCollisionPresent = false
    this.collidedPoint = { xKey: null, yKey: null }
  },
  setCollision(keys) {
    this.selectedCollisionPresent = true
    this.collidedPoint.xKey = keys.x
    this.collidedPoint.yKey = keys.y
  },
  resetOtherVectorCollision() {
    state.vector.collidedIndex = null
    this.otherCollidedKeys = { xKey: null, yKey: null }
  },
  setOtherVectorCollision(keys) {
    this.otherCollidedKeys.xKey = keys.x
    this.otherCollidedKeys.yKey = keys.y
  },
  resetLinkedVectors() {
    if (this.selectedPoint.xKey) {
      return
    }
    this.linkedVectors = {}
  },
  addLinkedVector(vector, xKey, linkingPoint) {
    if (
      this.selectedPoint.xKey ||
      ['fill', 'ellipse'].includes(vector.vectorProperties.type) ||
      ['fill', 'ellipse'].includes(state.vector.properties.type)
    ) {
      //Don't link a point to itself and don't link to fill or ellipse vectors.
      return
    }
    if (!this.linkedVectors[vector.index]) {
      this.linkedVectors[vector.index] = {}
    }
    if (vector.vectorProperties.type === 'quadCurve') {
      //prevent linking to same vector on px2 if px1 is already linked and vector is quadCurve
      if (xKey === 'px2' && this.linkedVectors[vector.index]['px1']) {
        return
      }
      //if vector is quadCurve and px2 is already linked and xKey is px1, remove px2 link
      if (xKey === 'px1' && this.linkedVectors[vector.index]['px2']) {
        delete this.linkedVectors[vector.index]['px2']
      }
    }
    this.linkedVectors[vector.index].linkingPoint = linkingPoint
    this.linkedVectors[vector.index][xKey] = true
  },
  removeLinkedVector(vector) {
    delete this.linkedVectors[vector.index]
  },
  // drawSelectOutline,
  render,
  reset,
  setVectorProperties,
}

// /**
//  * 2-way data binding for grid
//  */
// Object.defineProperty(vectorGui, "grid", {
//   get() {
//     //update state according to dom
//     return dom.gridBtn.checked
//   },
//   set(newValue) {
//     //update dom according to state
//     dom.gridBtn.checked = newValue
//     //render grid
//     vectorGui.render()
//   },
// })

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} pointsKeys - The keys of the control points
 * @param {number} radius - (Float)
 * @param {boolean} modify - if true, check for collision with cursor and modify radius
 * @param {object} vector - The vector to be rendered
 */
function drawControlPoints(
  vectorProperties,
  pointsKeys,
  radius,
  modify = false,
  vector = null,
) {
  for (let keys of pointsKeys) {
    const point = {
      x: vectorProperties[keys.x],
      y: vectorProperties[keys.y],
    }

    if (point.x == null || point.y == null) continue

    handleCollisionAndDraw(keys, point, radius, modify, vector)
  }

  setCursorStyle()
}

/**
 * Resolves whether a control point on the current vector is selected or cursor-colliding.
 * Sets collision state on vectorGui/state as a side effect.
 * @param {object} keys - The x/y property keys for this control point
 * @param {number} normalizedX - Point x plus layer offset
 * @param {number} normalizedY - Point y plus layer offset
 * @param {number} r - Current effective radius
 * @param {number} radius - Base radius before touch/active scaling
 * @returns {{ r: number, isActive: boolean }} Updated radius and active state
 */
function resolveCurrentVectorCollision(
  keys,
  normalizedX,
  normalizedY,
  r,
  radius,
) {
  if (
    checkSquarePointCollision(
      state.cursor.x,
      state.cursor.y,
      normalizedX,
      normalizedY,
      r * 3.125,
    )
  ) {
    vectorGui.setCollision(keys)
    return { r: radius * 3.125, isActive: true }
  }
  return { r, isActive: false }
}

/**
 * Resolves whether a control point on another vector is cursor-colliding, and handles linking.
 * Sets collision state on vectorGui/state as a side effect.
 * @param {object} keys - The x/y property keys for this control point
 * @param {number} normalizedX - Point x plus layer offset
 * @param {number} normalizedY - Point y plus layer offset
 * @param {number} r - Current effective radius
 * @param {number} radius - Base radius before touch/active scaling
 * @param {object} vector - The other vector being checked
 * @returns {{ r: number, isActive: boolean }} Updated radius and active state
 */
function resolveOtherVectorCollision(
  keys,
  normalizedX,
  normalizedY,
  r,
  radius,
  vector,
) {
  if (
    !checkSquarePointCollision(
      state.cursor.x,
      state.cursor.y,
      normalizedX,
      normalizedY,
      r * 3.125,
    )
  ) {
    return { r, isActive: false }
  }

  if (keys.x === 'px1' || keys.x === 'px2') {
    state.vector.collidedIndex = vector.index
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
      if (state.tool.clickCounter === 0) {
        return { r: radius * 3.125, isActive: true }
      }
    } else if (!vectorGui.selectedPoint.xKey) {
      if (state.tool.clickCounter === 0) {
        return { r: radius * 3.125, isActive: true }
      }
    }
  } else if (
    (keys.x === 'px3' || keys.x === 'px4') &&
    !vectorGui.selectedPoint.xKey
  ) {
    state.vector.collidedIndex = vector.index
    //only set new radius if selected vector is not a new vector being drawn
    if (state.tool.clickCounter === 0) {
      return { r: radius * 3.125, isActive: true }
    }
  }
  return { r, isActive: false }
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

  if (vectorGui.collidedPoint.xKey === 'px3') {
    if (
      normalizedX === state.vector.properties.px1 + state.canvas.cropOffsetX &&
      normalizedY === state.vector.properties.py1 + state.canvas.cropOffsetY
    ) {
      vectorGui.addLinkedVector(vector, keys.x, { xKey: 'px1', yKey: 'py1' })
    }
    if (state.tool.current.name === 'quadCurve') {
      if (
        normalizedX ===
          state.vector.properties.px2 + state.canvas.cropOffsetX &&
        normalizedY === state.vector.properties.py2 + state.canvas.cropOffsetY
      ) {
        vectorGui.addLinkedVector(vector, keys.x, { xKey: 'px2', yKey: 'py2' })
      }
    }
  }
  if (vectorGui.collidedPoint.xKey === 'px4') {
    if (
      normalizedX === state.vector.properties.px2 + state.canvas.cropOffsetX &&
      normalizedY === state.vector.properties.py2 + state.canvas.cropOffsetY
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
 * @param {number} r - Effective radius
 * @param {number} lw - GUI line width
 * @param {boolean} modify - If true, draw interactive filled circle; otherwise draw outline circle
 * @param {object} keys - The x/y property keys for this control point
 * @param {number} normalizedX - Point x plus layer offset
 * @param {number} normalizedY - Point y plus layer offset
 */
function drawInactiveControlPoint(
  cx,
  cy,
  r,
  lw,
  modify,
  keys,
  normalizedX,
  normalizedY,
) {
  if (modify) {
    canvas.vectorGuiCTX.beginPath()
    canvas.vectorGuiCTX.arc(cx, cy, r, 0, 2 * Math.PI)
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
        state.cursor.x,
        state.cursor.y,
        normalizedX,
        normalizedY,
        r,
      )
    if (!wouldBeActive) {
      canvas.vectorGuiCTX.beginPath()
      canvas.vectorGuiCTX.arc(cx, cy, r, 0, 2 * Math.PI)
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
 * @param {number} radius - (Float)
 * @param {boolean} modify - if true, check for collision with cursor and modify radius
 * @param {object} vector - The vector to be rendered
 */
function handleCollisionAndDraw(keys, point, radius, modify, vector) {
  // Double the radius on touch devices so control points are easier to tap.
  let r = state.tool.touch ? radius * 2 : radius

  // Translate the stored layer-relative point into cursor space (art-pixel,
  // pan-agnostic) so it can be compared directly with state.cursor.x/y.
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
      r = radius * 3.125 // increase radius of fill to match stroked circle
      isActive = true
      vectorGui.setCollision(keys)
    } else if (vector) {
      // Point belongs to a stored (non-current) vector — check whether the
      // cursor is close enough to register a collision with it.
      const result = resolveOtherVectorCollision(
        keys,
        normalizedX,
        normalizedY,
        r,
        radius,
        vector,
      )
      r = result.r
      isActive = result.isActive
    } else {
      // Point belongs to the current (in-progress) vector — check proximity
      // to determine whether this point should be considered hovered/grabbed.
      const result = resolveCurrentVectorCollision(
        keys,
        normalizedX,
        normalizedY,
        r,
        radius,
      )
      r = result.r
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
    drawActiveControlPoint(cx, cy, r, lw)
  } else {
    drawInactiveControlPoint(
      cx,
      cy,
      r,
      lw,
      modify,
      keys,
      normalizedX,
      normalizedY,
    )
  }
}

/**
 * Returns true if the current collision is on a chainable endpoint (px1/px2 of a line vector).
 * Used to suppress the grab cursor when chain mode is active.
 * @returns {boolean} True if the collision is on a chainable endpoint, false otherwise
 */
function isChainableCollision() {
  const chainableTypes = ['line', 'quadCurve', 'cubicCurve']
  const endpointKeys = ['px1', 'px2']
  if (
    vectorGui.selectedCollisionPresent &&
    state.vector.currentIndex !== null &&
    endpointKeys.includes(vectorGui.collidedPoint.xKey)
  ) {
    const cv = state.vector.all[state.vector.currentIndex]
    if (chainableTypes.includes(cv?.vectorProperties.type)) return true
  }
  if (
    state.vector.collidedIndex !== null &&
    endpointKeys.includes(vectorGui.otherCollidedKeys.xKey)
  ) {
    const ov = state.vector.all[state.vector.collidedIndex]
    if (chainableTypes.includes(ov?.vectorProperties.type)) return true
  }
  return false
}

/**
 * Set css cursor for vector interaction
 */
function setCursorStyle() {
  if (!vectorGui.selectedCollisionPresent && !state.vector.collidedIndex) {
    if (
      state.vector.selectedIndices.size > 0 &&
      state.tool.current.type === 'vector'
    ) {
      //For transform actions
      canvas.vectorGuiCVS.style.cursor = 'move'
      return
    }
    canvas.vectorGuiCVS.style.cursor = state.tool.current.modes?.eraser
      ? 'none'
      : state.cursor.clicked
        ? state.tool.current.activeCursor
        : state.tool.current.cursor
    return
  }

  //If pointer is colliding with a vector control point:
  if (state.tool.current.name !== 'move') {
    if (state.tool.clickCounter !== 0) {
      //creating new vector, don't use grab cursor
      canvas.vectorGuiCVS.style.cursor = 'move'
    } else if (
      state.tool.current.options?.chain?.active &&
      isChainableCollision()
    ) {
      //chain mode: show normal tool cursor over chainable endpoints
      canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
    } else if (state.cursor.clicked) {
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

/**
 * Reset vector state
 */
function reset() {
  state.vector.properties = {}
  //reset selectedpoint and collided keys
  state.vector.setCurrentIndex(null)
  disableActionsForNoSelection()
  vectorGui.render()
}

/**
 * Normalize vector properties based on layer offset
 * @param {object} vector - The vector action to base the properties on
 */
function setVectorProperties(vector) {
  if (vector.layer === canvas.currentLayer) {
    state.vector.properties = { ...vector.vectorProperties }
    //Keep properties relative to layer offset
    //All vector types have at least one control point
    const lx = vector.layer.x
    const ly = vector.layer.y
    state.vector.properties.px1 += lx
    state.vector.properties.py1 += ly
    //line, quadCurve, cubicCurve, ellipse
    if (state.vector.properties.px2 !== undefined) {
      state.vector.properties.px2 += lx
      state.vector.properties.py2 += ly
    }
    //quadCurve, cubicCurve, ellipse
    if (state.vector.properties.px3 !== undefined) {
      state.vector.properties.px3 += lx
      state.vector.properties.py3 += ly
    }
    //cubicCurve
    if (state.vector.properties.px4 !== undefined) {
      state.vector.properties.px4 += lx
      state.vector.properties.py4 += ly
    }
    state.vector.setCurrentIndex(vector.index)
    // switchTool(vector.vectorProperties.type)
    enableActionsForSelection()
  }
}

/**
 * Render vector graphical interface
 */
function render() {
  canvas.vectorGuiCTX.clearRect(
    0,
    0,
    canvas.vectorGuiCVS.width / canvas.zoom,
    canvas.vectorGuiCVS.height / canvas.zoom,
  )
  canvas.cursorCTX.clearRect(
    0,
    0,
    canvas.cursorCVS.width / canvas.zoom,
    canvas.cursorCVS.height / canvas.zoom,
  )
  //Prevent blurring
  canvas.vectorGuiCTX.imageSmoothingEnabled = false
  //if linking, render all vectors in the layer
  if (canvas.currentLayer.type === 'reference') {
    vectorGui.resetCollision()
    let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
    state.selection.properties.px1 = canvas.currentLayer.x - lineWidth
    state.selection.properties.py1 = canvas.currentLayer.y - lineWidth
    state.selection.properties.px2 =
      canvas.currentLayer.x +
      canvas.currentLayer.img.width * canvas.currentLayer.scale +
      lineWidth
    state.selection.properties.py2 =
      canvas.currentLayer.y +
      canvas.currentLayer.img.height * canvas.currentLayer.scale +
      lineWidth
    state.selection.setBoundaryBox(state.selection.properties)
  }
  if (
    state.tool.current.options.displayVectors?.active ||
    state.tool.current.options.equal?.active ||
    state.tool.current.options.align?.active ||
    state.tool.current.options.link?.active ||
    (state.vector.selectedIndices.size > 0 &&
      state.tool.current.type === 'vector')
  ) {
    renderLayerVectors(canvas.currentLayer)
  } else if (state.tool.current.type === 'vector') {
    //else render only the current vector
    renderCurrentVector()
  }
  //Render vector transform ui
  if (
    state.vector.selectedIndices.size > 0 &&
    state.vector.shapeCenterX !== null
  ) {
    switch (state.vector.transformMode) {
      case ROTATE:
        renderVectorRotationControl()
        break
      case TRANSLATE:
        //
        break
      case SCALE: {
        //Update shape boundary box TODO: (Medium Priority) Instead of updating shapeBoundaryBox here, update it when the vectors are changed or when the scale mode is toggled.
        // const shapeBoundaryBox = findVectorShapeBoundaryBox(
        //   state.vector.selectedIndices,
        //   state.vector.all
        // )
        // state.selection.properties.px1 = shapeBoundaryBox.xMin
        // state.selection.properties.py1 = shapeBoundaryBox.yMin
        // state.selection.properties.px2 = shapeBoundaryBox.xMax
        // state.selection.properties.py2 = shapeBoundaryBox.yMax
        // state.selection.setBoundaryBox(state.selection.properties)
        break
      }
      default:
    }
  }
  //Render selection outline and selection control points
  renderSelectionCVS()
  //Render grid
  if (canvas.zoom >= 4 && vectorGui.grid) {
    renderGrid(vectorGui.gridSpacing)
  }
}

/**
 * Render based on the current tool.
 * @param {object} vectorProperties - The properties of the vector
 * @param {object|null} vector - The vector action to base the properties on
 */
function renderControlPoints(vectorProperties, vector = null) {
  switch (vectorProperties.type) {
    case 'fill':
      renderFillVector(vectorProperties, vector)
      break
    case 'line':
      renderLineVector(vectorProperties, vector)
      break
    case 'quadCurve':
    case 'cubicCurve':
      renderCurveVector(vectorProperties, vector)
      break
    case 'ellipse':
      renderEllipseVector(vectorProperties, vector)
      if (vectorProperties.x1Offset || vectorProperties.y1Offset) {
        renderOffsetEllipseVector(vectorProperties, vector)
      }
      break
    case 'polygon':
      renderPolygonVector(vectorProperties, vector)
      break
    default:
    //
  }
}

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object|null} vector - The vector to be rendered
 */
function renderPath(vectorProperties, vector = null) {
  switch (vectorProperties.type) {
    case 'fill':
      // renderFillVector(state.vector.properties)
      break
    case 'line':
      renderLinePath(vectorProperties, vector)
      break
    case 'quadCurve':
    case 'cubicCurve':
      renderCurvePath(vectorProperties, vector)
      break
    case 'ellipse':
      renderEllipsePath(vectorProperties, vector)
      break
    case 'polygon':
      renderPolygonPath(vectorProperties, vector)
      break
    default:
    //
  }
}

/**
 * For each vector action in the undoStack in a given layer, render it
 * @param {object} layer - The layer to render the vectors for
 */
function renderLayerVectors(layer) {
  let selectedVector = null
  if (state.vector.currentIndex !== null) {
    selectedVector = state.vector.all[state.vector.currentIndex]
  }
  //iterate through and render all vectors in the layer except the selected vector which will always be rendered last
  //render paths
  for (let vector of Object.values(state.vector.all)) {
    if (
      !vector.removed &&
      vector.layer === layer &&
      state.timeline.undoStack.includes(vector.action)
    ) {
      //For each vector, render paths
      if (
        (vector.vectorProperties.type === state.tool.current.name &&
          state.vector.selectedIndices.size === 0) ||
        state.vector.selectedIndices.has(vector.index)
      ) {
        renderPath(vector.vectorProperties, vector)
      }
    }
  }
  //render vector path for in progress vectors
  if (
    !(
      state.vector.selectedIndices.size > 0 &&
      !state.vector.selectedIndices.has(state.vector.currentIndex)
    )
  ) {
    //Only render path for selected vector if it is in the selectedVectorIndicesSet
    renderPath(state.vector.properties)
  }
  if (
    !state.tool.current.options.displayPaths?.active &&
    state.vector.selectedIndices.size === 0
  ) {
    // Clear strokes from drawing area
    canvas.vectorGuiCTX.clearRect(
      canvas.xOffset,
      canvas.yOffset,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height,
    )
  }
  //render selected vector control points
  vectorGui.resetCollision()
  if (
    !(
      state.vector.selectedIndices.size > 0 &&
      !state.vector.selectedIndices.has(state.vector.currentIndex)
    )
  ) {
    //Only render control points for selected vector if it is in the selectedVectorIndicesSet
    renderControlPoints(state.vector.properties)
  }
  //render control points
  vectorGui.resetOtherVectorCollision()
  vectorGui.resetLinkedVectors()
  for (let vector of Object.values(state.vector.all)) {
    if (
      !vector.removed &&
      vector.layer === layer &&
      state.timeline.undoStack.includes(vector.action)
    ) {
      //For each vector, render control points
      if (
        ((vector.vectorProperties.type === state.tool.current.name &&
          state.vector.selectedIndices.size === 0) ||
          state.vector.selectedIndices.has(vector.index)) &&
        vector !== selectedVector
      ) {
        renderControlPoints(vector.vectorProperties, vector)
      }
    }
  }
}

/**
 * Render the current vector
 */
export function renderCurrentVector() {
  //render paths
  renderPath(state.vector.properties)
  if (!state.tool.current.options.displayPaths?.active) {
    // Clear strokes from drawing area
    canvas.vectorGuiCTX.clearRect(
      canvas.xOffset,
      canvas.yOffset,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height,
    )
  }
  vectorGui.resetCollision()
  //render control points
  renderControlPoints(state.vector.properties)
}

/**
 *
 * @param {object} currentVector - The vector action to base other vector handling on
 * @param {boolean} saveVectorProperties - if true, save the properties of the vector
 * quadCurve must run this twice. Two sets of linked vectors should be maintained, one for p1 and one for p2 of the quad curve.
 */
export function updateLinkedVectors(
  currentVector,
  saveVectorProperties = false,
) {
  for (const [linkedVectorIndex, linkedPoints] of Object.entries(
    vectorGui.linkedVectors,
  )) {
    //Values are 0 across the board for p1 or p2 as selected point
    const { currentDeltaX, currentDeltaY, currentDeltaAngle } =
      calculateCurrentVectorDeltas(
        currentVector,
        vectorGui.selectedPoint,
        state.tool.current.options,
        state.vector.savedProperties,
        linkedPoints.linkingPoint,
      )

    let x = state.cursor.x - state.canvas.cropOffsetX
    let y = state.cursor.y - state.canvas.cropOffsetY
    const linkedVector = state.vector.all[linkedVectorIndex]

    //As long as linked vector is quadCurve, must propogate linking to connected vectors

    if (saveVectorProperties) {
      state.vector.savedProperties[linkedVectorIndex] = {
        ...linkedVector.vectorProperties,
      }
    } else if (!state.vector.savedProperties[linkedVectorIndex]) {
      //prevent linking vectors during pointermove
      continue
    }
    const savedProperties = state.vector.savedProperties[linkedVectorIndex]
    handleOptionsAndUpdateVector(
      x,
      y,
      currentDeltaX,
      currentDeltaY,
      currentDeltaAngle,
      vectorGui.selectedPoint.xKey,
      linkedVector,
      linkedPoints,
      savedProperties,
      state.tool.current.options,
    )
  }
}

/**
 * Helper function to update vector properties based on the control handle selection.
 * @param {object} currentVector - The vector action to update
 * @param {number} x - The new x coordinate
 * @param {number} y - The new y coordinate
 * @param {object} savedProperties - Previously saved properties of the vector
 * @param {number} currentPointNumber - The number of the currently selected control point
 * @param {number} targetPointNumber - The number of the target control point to update
 */
function updateVectorControl(
  currentVector,
  x,
  y,
  savedProperties,
  currentPointNumber,
  targetPointNumber,
) {
  const currentXKey = `px${currentPointNumber}`
  const currentYKey = `py${currentPointNumber}`
  const targetXKey = `px${targetPointNumber}`
  const targetYKey = `py${targetPointNumber}`
  const xDiff = savedProperties[currentXKey] - savedProperties[targetXKey]
  const yDiff = savedProperties[currentYKey] - savedProperties[targetYKey]
  state.vector.properties[targetXKey] = x - xDiff
  state.vector.properties[targetYKey] = y - yDiff
  updateVectorProperties(
    currentVector,
    x - xDiff,
    y - yDiff,
    targetXKey,
    targetYKey,
  )
}

/**
 * @param {object} currentVector - The vector action to update
 * @param {number} x - The x coordinate of new endpoint
 * @param {number} y - The y coordinate of new endpoint
 */
export function updateLockedCurrentVectorControlHandle(currentVector, x, y) {
  const savedProperties =
    state.vector.savedProperties[state.vector.currentIndex]
  //cubic curve
  switch (savedProperties.type) {
    case 'cubicCurve': {
      const currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
      //point 1 holds point 3, point 2 holds point 4, point 3 and 4 don't hold any points
      let targetPointNumber = currentPointNumber
      switch (currentPointNumber) {
        case 1:
          targetPointNumber = 3
          break
        case 2:
          targetPointNumber = 4
          break
        default:
        //do nothing
      }
      updateVectorControl(
        currentVector,
        x,
        y,
        savedProperties,
        currentPointNumber,
        targetPointNumber,
      )
      break
    }
    case 'quadCurve': {
      const currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
      //both point 1 and 2 hold point 3
      const targetPointNumber = 3
      updateVectorControl(
        currentVector,
        x,
        y,
        savedProperties,
        currentPointNumber,
        targetPointNumber,
      )
      break
    }
    case 'line': {
      const currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
      //point 1 holds point 2, point 2 holds point 1
      const targetPointNumber = currentPointNumber === 1 ? 2 : 1
      updateVectorControl(
        currentVector,
        x,
        y,
        savedProperties,
        currentPointNumber,
        targetPointNumber,
      )
      break
    }
    default:
    //do nothing
  }
}

/**
 * For efficient rendering, create an array of indexes of vectors that need to be re-rendered.
 * Other actions will be saved to between canvases to avoid multiple ununecessary renders in redrawTimelineActions
 * Can't simply save images and draw them for the betweenCvs because this will ignore actions using erase or inject modes.
 * @param {object} currentVector - The vector action to base the active indexes on
 * @param {object} vectorsSavedProperties - will have at least one entry, corresponding to currentVector
 * @returns {Array} activeIndexes
 */
export function createActiveIndexesForRender(
  currentVector,
  vectorsSavedProperties,
) {
  const vectorsSavedPropertiesActionKeys = Object.keys(
    vectorsSavedProperties,
  ).map((key) => state.vector.all[key].action.index)
  let startActionIndex = Math.min(...vectorsSavedPropertiesActionKeys)
  let activeIndexes = []

  for (let i = startActionIndex; i < state.timeline.undoStack.length; i++) {
    let action = state.timeline.undoStack[i]
    if (
      action.layer === currentVector.layer &&
      (action.tool === 'fill' ||
        action.tool === 'cut' ||
        action?.modes?.eraser ||
        action?.modes?.inject ||
        vectorsSavedPropertiesActionKeys.includes(i))
    ) {
      activeIndexes.push(i)
    }
  }
  return activeIndexes
}
