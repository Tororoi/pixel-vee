import { TRANSLATE, ROTATE, SCALE } from '../utils/constants.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
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
