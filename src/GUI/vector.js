import { TRANSLATE, ROTATE, SCALE } from '../utils/constants.js'
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
import { renderFillVector } from './fill.js'
import { renderCurvePath, renderCurveVector } from './curve.js'
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
    globalState.vector.collidedIndex = null
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
      ['fill', 'ellipse'].includes(vector.vectorProperties.tool) ||
      ['fill', 'ellipse'].includes(globalState.vector.properties.tool)
    ) {
      //Don't link a point to itself and don't link to fill or ellipse vectors.
      return
    }
    if (!this.linkedVectors[vector.index]) {
      this.linkedVectors[vector.index] = {}
    }
    if (vector.modes.quadCurve) {
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
 * @param {boolean} modify - if true, check for collision with cursor
 * @param {object} vector - The vector to be rendered
 */
function drawControlPoints(
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

/**
 * Reset vector state
 */
function reset() {
  globalState.vector.properties = {}
  //reset selectedpoint and collided keys
  globalState.vector.setCurrentIndex(null)
  vectorGui.render()
}

/**
 * Normalize vector properties based on layer offset
 * @param {object} vector - The vector action to base the properties on
 */
function setVectorProperties(vector) {
  if (vector.layer === canvas.currentLayer) {
    globalState.vector.properties = { ...vector.vectorProperties }
    //Keep properties relative to layer offset
    //All vector types have at least one control point
    const layerX = vector.layer.x
    const layerY = vector.layer.y
    globalState.vector.properties.px1 += layerX
    globalState.vector.properties.py1 += layerY
    //line, quadCurve, cubicCurve, ellipse
    if (globalState.vector.properties.px2 !== undefined) {
      globalState.vector.properties.px2 += layerX
      globalState.vector.properties.py2 += layerY
    }
    //quadCurve, cubicCurve, ellipse
    if (globalState.vector.properties.px3 !== undefined) {
      globalState.vector.properties.px3 += layerX
      globalState.vector.properties.py3 += layerY
    }
    //cubicCurve
    if (globalState.vector.properties.px4 !== undefined) {
      globalState.vector.properties.px4 += layerX
      globalState.vector.properties.py4 += layerY
    }
    globalState.vector.setCurrentIndex(vector.index)
    // switchTool(vector.vectorProperties.tool)
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
  if (canvas.currentLayer.type === 'reference' && canvas.currentLayer.img) {
    vectorGui.resetCollision()
    let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
    globalState.selection.properties.px1 = canvas.currentLayer.x - lineWidth
    globalState.selection.properties.py1 = canvas.currentLayer.y - lineWidth
    globalState.selection.properties.px2 =
      canvas.currentLayer.x +
      canvas.currentLayer.img.width * canvas.currentLayer.scale +
      lineWidth
    globalState.selection.properties.py2 =
      canvas.currentLayer.y +
      canvas.currentLayer.img.height * canvas.currentLayer.scale +
      lineWidth
    globalState.selection.setBoundaryBox(globalState.selection.properties)
  }
  if (
    globalState.tool.current.options.displayVectors?.active ||
    globalState.tool.current.options.equal?.active ||
    globalState.tool.current.options.align?.active ||
    globalState.tool.current.options.link?.active ||
    (globalState.vector.selectedIndices.size > 0 &&
      globalState.tool.current.type === 'vector')
  ) {
    renderLayerVectors(canvas.currentLayer)
  } else if (globalState.tool.current.type === 'vector') {
    //else render only the current vector
    renderCurrentVector()
  }
  //Render vector transform ui
  if (
    globalState.vector.selectedIndices.size > 0 &&
    globalState.vector.shapeCenterX !== null
  ) {
    switch (globalState.vector.transformMode) {
      case ROTATE:
        renderVectorRotationControl()
        break
      case TRANSLATE:
        //
        break
      case SCALE: {
        //Update shape boundary box TODO: (Medium Priority) Instead of updating shapeBoundaryBox here, update it when the vectors are changed or when the scale mode is toggled.
        // const shapeBoundaryBox = findVectorShapeBoundaryBox(
        //   globalState.vector.selectedIndices,
        //   globalState.vector.all
        // )
        // globalState.selection.properties.px1 = shapeBoundaryBox.xMin
        // globalState.selection.properties.py1 = shapeBoundaryBox.yMin
        // globalState.selection.properties.px2 = shapeBoundaryBox.xMax
        // globalState.selection.properties.py2 = shapeBoundaryBox.yMax
        // globalState.selection.setBoundaryBox(globalState.selection.properties)
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
  switch (vectorProperties.tool) {
    case 'fill':
      renderFillVector(vectorProperties, vector)
      break
    case 'curve':
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
  switch (vectorProperties.tool) {
    case 'fill':
      // renderFillVector(globalState.vector.properties)
      break
    case 'curve':
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
  if (globalState.vector.currentIndex !== null) {
    selectedVector = globalState.vector.all[globalState.vector.currentIndex]
  }
  //iterate through and render all vectors in the layer except the selected vector which will always be rendered last
  //render paths
  for (let vector of Object.values(globalState.vector.all)) {
    if (
      !vector.removed &&
      vector.layer === layer &&
      globalState.timeline.undoStack.includes(vector.action)
    ) {
      //For each vector, render paths
      if (
        (vector.vectorProperties.tool === globalState.tool.current.name &&
          globalState.vector.selectedIndices.size === 0) ||
        globalState.vector.selectedIndices.has(vector.index)
      ) {
        renderPath(vector.vectorProperties, vector)
      }
    }
  }
  //render vector path for in progress vectors
  if (
    !(
      globalState.vector.selectedIndices.size > 0 &&
      !globalState.vector.selectedIndices.has(globalState.vector.currentIndex)
    )
  ) {
    //Only render path for selected vector if it is in the selectedVectorIndicesSet
    renderPath(globalState.vector.properties)
  }
  if (
    !globalState.tool.current.options.displayPaths?.active &&
    globalState.vector.selectedIndices.size === 0
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
      globalState.vector.selectedIndices.size > 0 &&
      !globalState.vector.selectedIndices.has(globalState.vector.currentIndex)
    )
  ) {
    //Only render control points for selected vector if it is in the selectedVectorIndicesSet
    renderControlPoints(globalState.vector.properties)
  }
  //render control points
  vectorGui.resetOtherVectorCollision()
  vectorGui.resetLinkedVectors()
  for (let vector of Object.values(globalState.vector.all)) {
    if (
      !vector.removed &&
      vector.layer === layer &&
      globalState.timeline.undoStack.includes(vector.action)
    ) {
      //For each vector, render control points
      if (
        ((vector.vectorProperties.tool === globalState.tool.current.name &&
          globalState.vector.selectedIndices.size === 0) ||
          globalState.vector.selectedIndices.has(vector.index)) &&
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
  renderPath(globalState.vector.properties)
  if (!globalState.tool.current.options.displayPaths?.active) {
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
  renderControlPoints(globalState.vector.properties)
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
        globalState.tool.current.options,
        globalState.vector.savedProperties,
        linkedPoints.linkingPoint,
      )

    let x = globalState.cursor.x - globalState.canvas.cropOffsetX
    let y = globalState.cursor.y - globalState.canvas.cropOffsetY
    const linkedVector = globalState.vector.all[linkedVectorIndex]

    //As long as linked vector is quadCurve, must propogate linking to connected vectors

    if (saveVectorProperties) {
      globalState.vector.savedProperties[linkedVectorIndex] = {
        ...linkedVector.vectorProperties,
        modes: { ...linkedVector.modes },
      }
    } else if (!globalState.vector.savedProperties[linkedVectorIndex]) {
      //prevent linking vectors during pointermove
      continue
    }
    const savedProperties =
      globalState.vector.savedProperties[linkedVectorIndex]
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
      globalState.tool.current.options,
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
  globalState.vector.properties[targetXKey] = x - xDiff
  globalState.vector.properties[targetYKey] = y - yDiff
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
    globalState.vector.savedProperties[globalState.vector.currentIndex]
  let currentPointNumber, targetPointNumber
  if (savedProperties.modes.cubicCurve) {
    currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
    //point 1 holds point 3, point 2 holds point 4, point 3 and 4 don't hold any points
    switch (currentPointNumber) {
      case 1:
        targetPointNumber = 3
        break
      case 2:
        targetPointNumber = 4
        break
      default:
        targetPointNumber = currentPointNumber
    }
  } else if (savedProperties.modes.quadCurve) {
    currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
    //both point 1 and 2 hold point 3
    targetPointNumber = 3
  } else {
    currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
    //point 1 holds point 2, point 2 holds point 1
    targetPointNumber = currentPointNumber === 1 ? 2 : 1
  }
  updateVectorControl(
    currentVector,
    x,
    y,
    savedProperties,
    currentPointNumber,
    targetPointNumber,
  )
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
  ).map((key) => globalState.vector.all[key].action.index)
  let startActionIndex = Math.min(...vectorsSavedPropertiesActionKeys)
  let activeIndexes = []

  for (
    let i = startActionIndex;
    i < globalState.timeline.undoStack.length;
    i++
  ) {
    let action = globalState.timeline.undoStack[i]
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
