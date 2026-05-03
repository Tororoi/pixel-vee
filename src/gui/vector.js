import { TRANSLATE, ROTATE, SCALE } from '../utils/constants.js'
import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
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
import { drawControlPoints } from './vectorControlPoints.js'
// import { switchTool } from "../tools/toolbox.js"

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
  /**
   * Clears the collision state for the selected vector's control
   * points. Called before every hit-test pass so stale data from the
   * previous frame cannot produce a false positive.
   */
  resetCollision() {
    this.selectedCollisionPresent = false
    this.collidedPoint = { xKey: null, yKey: null }
  },
  /**
   * Marks a hit between the cursor and a control point on the selected
   * vector. Both axis keys are stored so callers can identify the
   * exact point without re-scanning the property set.
   * @param {{x: string, y: string}} keys - Key pair naming the
   *   colliding control point (e.g. `{ x: 'px1', y: 'py1' }`).
   */
  setCollision(keys) {
    this.selectedCollisionPresent = true
    this.collidedPoint.xKey = keys.x
    this.collidedPoint.yKey = keys.y
  },
  /**
   * Clears collision state for non-selected ("other") vectors and
   * nulls the global collided-vector index. The global index is
   * cleared alongside the local keys because it lives in globalState
   * rather than this object; both must be zeroed together to keep
   * them in sync.
   */
  resetOtherVectorCollision() {
    globalState.vector.collidedIndex = null
    this.otherCollidedKeys = { xKey: null, yKey: null }
  },
  /**
   * Records that the cursor overlaps a control point on a non-selected
   * vector. Only the point keys are stored here; the vector index is
   * written to globalState by the caller so the two concerns remain
   * decoupled.
   * @param {{x: string, y: string}} keys - Key pair of the colliding
   *   point on the other vector.
   */
  setOtherVectorCollision(keys) {
    this.otherCollidedKeys.xKey = keys.x
    this.otherCollidedKeys.yKey = keys.y
  },
  /**
   * Clears the linked-vector registry, but only when no control point
   * is actively held. The guard lets links accumulate for the full
   * duration of a drag; the registry is only wiped once the user
   * releases the point and selectedPoint.xKey becomes null.
   */
  resetLinkedVectors() {
    if (this.selectedPoint.xKey) {
      return
    }
    this.linkedVectors = {}
  },
  /**
   * Registers a foreign vector's control point as linked to the point
   * currently being dragged on the selected vector. Fill and ellipse
   * vectors are excluded because their endpoints are not independently
   * linkable. For quadCurve vectors only one endpoint may be linked at
   * a time — linking both px1 and px2 would cause both to track the
   * same anchor, which collapses the curve. When px1 arrives after
   * px2 was registered, px2 is evicted so px1 takes precedence.
   * @param {object} vector - The foreign vector action to link.
   * @param {string} xKey - The x-axis property key of the point to
   *   link (e.g. `'px1'`).
   * @param {object} linkingPoint - Canvas coordinates of the shared
   *   anchor.
   */
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
      // px1 has priority; if px1 is claimed, silently reject px2.
      if (xKey === 'px2' && this.linkedVectors[vector.index]['px1']) {
        return
      }
      // px1 is arriving; evict the earlier px2 so px1 can take the slot.
      if (xKey === 'px1' && this.linkedVectors[vector.index]['px2']) {
        delete this.linkedVectors[vector.index]['px2']
      }
    }
    this.linkedVectors[vector.index].linkingPoint = linkingPoint
    this.linkedVectors[vector.index][xKey] = true
  },
  /**
   * Removes a vector from the linked-vector registry when it no longer
   * overlaps the active control point.
   * @param {object} vector - The vector action to deregister.
   */
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
 * Fully resets the vector subsystem: clears the active properties
 * object, deselects the current vector index, and triggers a
 * re-render. Called on tool switches or explicit deselection so
 * subsequent render passes start from a clean slate.
 */
function reset() {
  globalState.vector.properties = {}
  //reset selectedpoint and collided keys
  globalState.vector.setCurrentIndex(null)
  vectorGui.render()
}

/**
 * Copies a vector's stored properties into the live active state and
 * translates every control-point coordinate by the layer's current
 * position offset. The translation is applied on read rather than at
 * write time so the canonical layer-relative coordinates remain valid
 * if the layer is later moved. Only vectors on the active layer are
 * accepted to prevent accidental cross-layer edits.
 * @param {object} vector - The vector action to promote to active
 *   state.
 */
function setVectorProperties(vector) {
  if (vector.layer === canvas.currentLayer) {
    globalState.vector.properties = { ...vector.vectorProperties }
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
 * Clears and redraws the entire vector GUI overlay: control points,
 * paths, transform handles, selection outline, and optional grid. The
 * cursor canvas is also cleared here so cursor previews never outlive
 * the frame. Rendering strategy (all-layer vs. current-only) is
 * chosen based on the active tool's options and the current selection
 * set.
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
  // Reference layers hold a raster image with no vector control points;
  // compute a selection bounding box from the image dimensions so
  // selection handles appear around the image rather than the canvas.
  if (canvas.currentLayer.type === 'reference' && canvas.currentLayer.img) {
    vectorGui.resetCollision()
    // Outset by lineWidth so the border doesn't clip the image edge;
    // capped at zoom 8 to avoid an oversized border at low zoom.
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
  // Tools that compare, align, or link vectors need to see all layer
  // vectors simultaneously, as does any multi-selection in vector mode.
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
    renderCurrentVector()
  } else {
    // Non-vector tools (move, grab, etc.) don't render control points, so
    // stale collision state from a prior vector-tool render must be cleared
    // here. Without this, selectedCollisionPresent can remain true after
    // switching away from a vector tool, causing moveSteps to incorrectly
    // enter transformSteps() instead of moving the layer.
    vectorGui.resetCollision()
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
 * Dispatches to the per-tool control-point renderer. Separating
 * dispatch from the individual renderers lets each tool define its own
 * hit-zones and handle shapes without coupling to the others. The
 * ellipse renderer runs a second pass when an offset is present
 * because the offset creates a visually distinct secondary control
 * point that needs its own handles.
 * @param {object} vectorProperties - Properties of the vector to
 *   render.
 * @param {object|null} vector - Backing vector action; null when
 *   rendering an in-progress draw.
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
 * Dispatches to the per-tool path renderer (the stroke preview drawn
 * beneath control points). Fill has no path preview because its
 * region is rendered by the rasterizer, not the vector GUI. The
 * default case is intentionally empty; unknown tools produce no path.
 * @param {object} vectorProperties - Properties of the vector whose
 *   path is rendered.
 * @param {object|null} vector - Backing vector action; null for an
 *   in-progress draw.
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
 * Draws every active, non-removed vector in the given layer: paths
 * first, then control points, with the selected vector's control
 * points always rendered last so they appear on top. Paths and
 * control points are rendered in separate loops so path strokes of
 * later vectors cannot occlude control-point handles of earlier ones.
 * The path-clear step runs only when displayPaths is inactive to
 * prevent stroke bleed into the pixel art area.
 * @param {object} layer - The layer whose vectors should be rendered.
 */
function renderLayerVectors(layer) {
  let selectedVector = null
  if (globalState.vector.currentIndex !== null) {
    selectedVector = globalState.vector.all[globalState.vector.currentIndex]
  }
  //render paths
  for (let vector of Object.values(globalState.vector.all)) {
    if (
      !vector.removed &&
      vector.layer === layer &&
      globalState.timeline.undoStack.includes(vector.action)
    ) {
      if (
        (vector.vectorProperties.tool === globalState.tool.current.name &&
          globalState.vector.selectedIndices.size === 0) ||
        globalState.vector.selectedIndices.has(vector.index)
      ) {
        renderPath(vector.vectorProperties, vector)
      }
    }
  }
  //render path for the in-progress/selected vector
  if (
    !(
      globalState.vector.selectedIndices.size > 0 &&
      !globalState.vector.selectedIndices.has(globalState.vector.currentIndex)
    )
  ) {
    // Only render if the current vector belongs to the active selection;
    // skipping it prevents a stale in-progress path from overdrawing a
    // multi-select where this vector was not included.
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
  //render control points for the in-progress/selected vector first
  vectorGui.resetCollision()
  if (
    !(
      globalState.vector.selectedIndices.size > 0 &&
      !globalState.vector.selectedIndices.has(globalState.vector.currentIndex)
    )
  ) {
    // Same guard as the path pass above: only draw when the current
    // vector is part of the active selection, or no multi-select is
    // in effect.
    renderControlPoints(globalState.vector.properties)
  }
  //render control points for all other vectors
  vectorGui.resetOtherVectorCollision()
  vectorGui.resetLinkedVectors()
  for (let vector of Object.values(globalState.vector.all)) {
    if (
      !vector.removed &&
      vector.layer === layer &&
      globalState.timeline.undoStack.includes(vector.action)
    ) {
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
 * Renders just the active (in-progress or selected) vector: its path
 * preview, then its control points. The path-clear step mirrors the
 * one in renderLayerVectors so both call-sites behave consistently:
 * path strokes are wiped from the pixel canvas unless the tool
 * explicitly enables displayPaths.
 */
export function renderCurrentVector() {
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
  renderControlPoints(globalState.vector.properties)
}
