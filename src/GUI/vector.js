import { TRANSLATE, ROTATE, SCALE } from "../utils/constants.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import {
  drawCirclePath,
  checkSquarePointCollision,
} from "../utils/guiHelpers.js"
import { renderFillVector } from "./fill.js"
import { renderCurveVector, renderCurvePath } from "./curve.js"
import {
  renderEllipseVector,
  renderOffsetEllipseVector,
  renderEllipsePath,
} from "./ellipse.js"
import { renderVectorRotationControl } from "./transform.js"
import { renderSelectionCVS } from "./select.js"
import { renderGrid } from "./grid.js"
import {
  updateVectorProperties,
  calculateCurrentVectorDeltas,
  handleOptionsAndUpdateVector,
  // findVectorShapeBoundaryBox,
} from "../utils/vectorHelpers.js"
import {
  disableActionsForNoSelection,
  enableActionsForSelection,
} from "../DOM/disableDomElements.js"
import { renderLinePath, renderLineVector } from "./line.js"
// import { switchTool } from "../Tools/toolbox.js"

//==================================================//
//=== * * * Vector Graphics User Interface * * * ===//
//==================================================//

//Note: The Vector Graphics canvas has a mix-blend-mode: difference applied to it
export const vectorGui = {
  grid: false,
  gridSpacing: 8,
  outlineVectorSelection: false,
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
    state.collidedVectorIndex = null
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
      ["fill", "ellipse"].includes(vector.vectorProperties.type) ||
      ["fill", "ellipse"].includes(state.vectorProperties.type)
    ) {
      //Don't link a point to itself and don't link to fill or ellipse vectors.
      return
    }
    if (!this.linkedVectors[vector.index]) {
      this.linkedVectors[vector.index] = {}
    }
    if (vector.vectorProperties.type === "quadCurve") {
      //prevent linking to same vector on px2 if px1 is already linked and vector is quadCurve
      if (xKey === "px2" && this.linkedVectors[vector.index]["px1"]) {
        return
      }
      //if vector is quadCurve and px2 is already linked and xKey is px1, remove px2 link
      if (xKey === "px1" && this.linkedVectors[vector.index]["px2"]) {
        delete this.linkedVectors[vector.index]["px2"]
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
  vector = null
) {
  for (let keys of pointsKeys) {
    const point = {
      x: vectorProperties[keys.x],
      y: vectorProperties[keys.y],
    }

    if (point.x === null || point.y === null) continue

    handleCollisionAndDraw(keys, point, radius, modify, vector)
  }

  setCursorStyle()
}

/**
 * TODO: (Low Priority) move drawing logic to separate function so modify param doesn't need to be used
 * @param {object} keys - The keys of the control points
 * @param {object} point - The coordinates of the control point
 * @param {number} radius - (Float)
 * @param {boolean} modify - if true, check for collision with cursor and modify radius
 * @param {object} vector - The vector to be rendered
 */
function handleCollisionAndDraw(keys, point, radius, modify, vector) {
  let r = state.touch ? radius * 2 : radius
  const xOffset = vector ? vector.layer.x : 0
  const yOffset = vector ? vector.layer.y : 0

  const normalizedX = point.x + xOffset
  const normalizedY = point.y + yOffset

  if (modify) {
    if (vectorGui.selectedPoint.xKey === keys.x && !vector) {
      r = radius * 2.125 // increase  radius of fill to match stroked circle
      vectorGui.setCollision(keys)
    } else if (
      checkSquarePointCollision(
        state.cursorX,
        state.cursorY,
        normalizedX,
        normalizedY,
        r * 2.125
      )
    ) {
      //if cursor is colliding with a control point not on the selected vector, set collided keys specifically for collided vector
      if (vector) {
        if (keys.x === "px1" || keys.x === "px2") {
          state.collidedVectorIndex = vector.index
          //Only allow link if active point for selection is p1 or p2
          let linkingPoint = null
          if (vectorGui.selectedPoint.xKey) {
            linkingPoint = vectorGui.selectedPoint
          } else if (vectorGui.collidedPoint.xKey) {
            linkingPoint = vectorGui.collidedPoint
          }
          let allowLink = ["px1", "px2"].includes(linkingPoint?.xKey)
          if (allowLink) {
            vectorGui.setOtherVectorCollision(keys)
            vectorGui.addLinkedVector(vector, keys.x, linkingPoint)
            if (state.clickCounter === 0) r = radius * 2.125
          } else if (!vectorGui.selectedPoint.xKey) {
            if (state.clickCounter === 0) r = radius * 2.125
          }
        } else if (
          (keys.x === "px3" || keys.x === "px4") &&
          !vectorGui.selectedPoint.xKey
        ) {
          state.collidedVectorIndex = vector.index
          //only set new radius if selected vector is not a new vector being drawn
          if (state.clickCounter === 0) r = radius * 2.125
        }
      } else {
        r = radius * 2.125
        vectorGui.setCollision(keys)
      }
    }
    //else if selectedpoint is p3 or p4, setLinkedVector if vector's control point coords are the same as the selected point
    if (vectorGui.collidedPoint.xKey === "px3" && vector) {
      if (
        normalizedX === state.vectorProperties.px1 &&
        normalizedY === state.vectorProperties.py1
      ) {
        vectorGui.addLinkedVector(vector, keys.x, { xKey: "px1", yKey: "py1" })
      }
      if (state.tool.name === "quadCurve") {
        if (
          normalizedX === state.vectorProperties.px2 &&
          normalizedY === state.vectorProperties.py2
        ) {
          vectorGui.addLinkedVector(vector, keys.x, {
            xKey: "px2",
            yKey: "py2",
          })
        }
      }
    }
    if (vectorGui.collidedPoint.xKey === "px4" && vector) {
      if (
        normalizedX === state.vectorProperties.px2 &&
        normalizedY === state.vectorProperties.py2
      ) {
        vectorGui.addLinkedVector(vector, keys.x, { xKey: "px2", yKey: "py2" })
      }
    }
  }
  //TODO: (Low Priority) radius is set progressively as the render function iterates through points, but ideally only the points corresponding to selectedPoint and collidedPoint should be rendered with an expanded radius.
  //Possible solution is to not change radius in this function, but instead at the end of the renderLayerVectors function, render a circle with the expanded radius for the selected and collided points.
  drawCirclePath(
    canvas.vectorGuiCTX,
    canvas.xOffset + xOffset,
    canvas.yOffset + yOffset,
    point.x,
    point.y,
    r
  )
}

/**
 * Set css cursor for vector interaction
 */
function setCursorStyle() {
  if (!vectorGui.selectedCollisionPresent && !state.collidedVectorIndex) {
    if (
      state.selectedVectorIndicesSet.size > 0 &&
      state.tool.type === "vector"
    ) {
      //For transform actions
      canvas.vectorGuiCVS.style.cursor = "move"
      return
    }
    canvas.vectorGuiCVS.style.cursor = state.tool.modes?.eraser
      ? "none"
      : state.clicked
      ? state.tool.activeCursor
      : state.tool.cursor
    return
  }

  //If pointer is colliding with a vector control point:
  if (state.tool.name !== "move") {
    if (state.clickCounter !== 0) {
      //creating new vector, don't use grab cursor
      canvas.vectorGuiCVS.style.cursor = "move"
    } else if (state.clicked) {
      canvas.vectorGuiCVS.style.cursor = "grabbing"
    } else {
      canvas.vectorGuiCVS.style.cursor = "grab"
    }
  } else {
    //Handle cursor for transform
    const xKey = vectorGui.collidedPoint.xKey
    if (["px1", "px4"].includes(xKey)) {
      canvas.vectorGuiCVS.style.cursor = "nwse-resize"
    } else if (["px2", "px3"].includes(xKey)) {
      canvas.vectorGuiCVS.style.cursor = "nesw-resize"
    }
  }
}

/**
 * Reset vector state
 */
function reset() {
  state.vectorProperties = {}
  //reset selectedpoint and collided keys
  state.currentVectorIndex = null
  disableActionsForNoSelection()
  vectorGui.render()
}

/**
 * Normalize vector properties based on layer offset
 * @param {object} vector - The vector action to base the properties on
 */
function setVectorProperties(vector) {
  if (vector.layer === canvas.currentLayer) {
    state.vectorProperties = { ...vector.vectorProperties }
    //Keep properties relative to layer offset
    //All vector types have at least one control point
    state.vectorProperties.px1 += vector.layer.x
    state.vectorProperties.py1 += vector.layer.y
    //line, quadCurve, cubicCurve, ellipse
    if (state.vectorProperties.px2 !== undefined) {
      state.vectorProperties.px2 += vector.layer.x
      state.vectorProperties.py2 += vector.layer.y
    }
    //quadCurve, cubicCurve, ellipse
    if (state.vectorProperties.px3 !== undefined) {
      state.vectorProperties.px3 += vector.layer.x
      state.vectorProperties.py3 += vector.layer.y
    }
    //cubicCurve
    if (state.vectorProperties.px4 !== undefined) {
      state.vectorProperties.px4 += vector.layer.x
      state.vectorProperties.py4 += vector.layer.y
    }
    state.currentVectorIndex = vector.index
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
    canvas.vectorGuiCVS.height / canvas.zoom
  )
  //Prevent blurring
  canvas.vectorGuiCTX.imageSmoothingEnabled = false
  //if linking, render all vectors in the layer
  if (canvas.currentLayer.type === "reference") {
    vectorGui.resetCollision()
    let lineWidth = canvas.zoom <= 8 ? 1 / canvas.zoom : 1 / 8
    state.selectProperties.px1 = canvas.currentLayer.x - lineWidth
    state.selectProperties.py1 = canvas.currentLayer.y - lineWidth
    state.selectProperties.px2 =
      canvas.currentLayer.x +
      canvas.currentLayer.img.width * canvas.currentLayer.scale +
      lineWidth
    state.selectProperties.py2 =
      canvas.currentLayer.y +
      canvas.currentLayer.img.height * canvas.currentLayer.scale +
      lineWidth
    state.setBoundaryBox(state.selectProperties)
  }
  if (
    state.tool.options.displayVectors?.active ||
    state.tool.options.equal?.active ||
    state.tool.options.align?.active ||
    state.tool.options.link?.active ||
    (state.selectedVectorIndicesSet.size > 0 && state.tool.type === "vector")
  ) {
    renderLayerVectors(canvas.currentLayer)
  } else if (state.tool.type === "vector") {
    //else render only the current vector
    renderCurrentVector()
  }
  //Render vector transform ui
  if (state.selectedVectorIndicesSet.size > 0 && state.shapeCenterX !== null) {
    switch (state.vectorTransformMode) {
      case ROTATE:
        renderVectorRotationControl()
        break
      case TRANSLATE:
        //
        break
      case SCALE: {
        //Update shape boundary box TODO: (Medium Priority) Instead of updating shapeBoundaryBox here, update it when the vectors are changed or when the scale mode is toggled.
        // const shapeBoundaryBox = findVectorShapeBoundaryBox(
        //   state.selectedVectorIndicesSet,
        //   state.vectors
        // )
        // state.selectProperties.px1 = shapeBoundaryBox.xMin
        // state.selectProperties.py1 = shapeBoundaryBox.yMin
        // state.selectProperties.px2 = shapeBoundaryBox.xMax
        // state.selectProperties.py2 = shapeBoundaryBox.yMax
        // state.setBoundaryBox(state.selectProperties)
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
    case "fill":
      renderFillVector(vectorProperties, vector)
      break
    case "line":
      renderLineVector(vectorProperties, vector)
      break
    case "quadCurve":
    case "cubicCurve":
      renderCurveVector(vectorProperties, vector)
      break
    case "ellipse":
      renderEllipseVector(vectorProperties, vector)
      if (vectorProperties.x1Offset || vectorProperties.y1Offset) {
        renderOffsetEllipseVector(vectorProperties, vector)
      }
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
    case "fill":
      // renderFillVector(state.vectorProperties)
      break
    case "line":
      renderLinePath(vectorProperties, vector)
      break
    case "quadCurve":
    case "cubicCurve":
      renderCurvePath(vectorProperties, vector)
      break
    case "ellipse":
      renderEllipsePath(vectorProperties, vector)
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
  if (state.currentVectorIndex !== null) {
    selectedVector = state.vectors[state.currentVectorIndex]
  }
  //iterate through and render all vectors in the layer except the selected vector which will always be rendered last
  //render paths
  for (let vector of Object.values(state.vectors)) {
    if (
      !vector.removed &&
      vector.layer === layer &&
      state.undoStack.includes(vector.action)
    ) {
      //For each vector, render paths
      if (
        (vector.vectorProperties.type === state.tool.name &&
          state.selectedVectorIndicesSet.size === 0) ||
        state.selectedVectorIndicesSet.has(vector.index)
      ) {
        renderPath(vector.vectorProperties, vector)
      }
    }
  }
  //render vector path for in progress vectors
  if (
    !(
      state.selectedVectorIndicesSet.size > 0 &&
      !state.selectedVectorIndicesSet.has(state.currentVectorIndex)
    )
  ) {
    //Only render path for selected vector if it is in the selectedVectorIndicesSet
    renderPath(state.vectorProperties)
  }
  if (
    !state.tool.options.displayPaths?.active &&
    state.selectedVectorIndicesSet.size === 0
  ) {
    // Clear strokes from drawing area
    canvas.vectorGuiCTX.clearRect(
      canvas.xOffset,
      canvas.yOffset,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height
    )
  }
  //render selected vector control points
  vectorGui.resetCollision()
  if (
    !(
      state.selectedVectorIndicesSet.size > 0 &&
      !state.selectedVectorIndicesSet.has(state.currentVectorIndex)
    )
  ) {
    //Only render control points for selected vector if it is in the selectedVectorIndicesSet
    renderControlPoints(state.vectorProperties)
  }
  //render control points
  vectorGui.resetOtherVectorCollision()
  vectorGui.resetLinkedVectors()
  for (let vector of Object.values(state.vectors)) {
    if (
      !vector.removed &&
      vector.layer === layer &&
      state.undoStack.includes(vector.action)
    ) {
      //For each vector, render control points
      if (
        ((vector.vectorProperties.type === state.tool.name &&
          state.selectedVectorIndicesSet.size === 0) ||
          state.selectedVectorIndicesSet.has(vector.index)) &&
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
  renderPath(state.vectorProperties)
  if (!state.tool.options.displayPaths?.active) {
    // Clear strokes from drawing area
    canvas.vectorGuiCTX.clearRect(
      canvas.xOffset,
      canvas.yOffset,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height
    )
  }
  vectorGui.resetCollision()
  //render control points
  renderControlPoints(state.vectorProperties)
}

/**
 *
 * @param {object} currentVector - The vector action to base other vector handling on
 * @param {boolean} saveVectorProperties - if true, save the properties of the vector
 * quadCurve must run this twice. Two sets of linked vectors should be maintained, one for p1 and one for p2 of the quad curve.
 */
export function updateLinkedVectors(
  currentVector,
  saveVectorProperties = false
) {
  for (const [linkedVectorIndex, linkedPoints] of Object.entries(
    vectorGui.linkedVectors
  )) {
    //Values are 0 across the board for p1 or p2 as selected point
    const { currentDeltaX, currentDeltaY, currentDeltaAngle } =
      calculateCurrentVectorDeltas(
        currentVector,
        vectorGui.selectedPoint,
        state.tool.options,
        state.vectorsSavedProperties,
        linkedPoints.linkingPoint
      )

    let x = state.cursorX
    let y = state.cursorY
    const linkedVector = state.vectors[linkedVectorIndex]

    //As long as linked vector is quadCurve, must propogate linking to connected vectors

    if (saveVectorProperties) {
      state.vectorsSavedProperties[linkedVectorIndex] = {
        ...linkedVector.vectorProperties,
      }
    } else if (!state.vectorsSavedProperties[linkedVectorIndex]) {
      //prevent linking vectors during pointermove
      continue
    }
    const savedProperties = state.vectorsSavedProperties[linkedVectorIndex]
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
      state.tool.options
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
  targetPointNumber
) {
  const currentXKey = `px${currentPointNumber}`
  const currentYKey = `py${currentPointNumber}`
  const targetXKey = `px${targetPointNumber}`
  const targetYKey = `py${targetPointNumber}`
  const xDiff = savedProperties[currentXKey] - savedProperties[targetXKey]
  const yDiff = savedProperties[currentYKey] - savedProperties[targetYKey]
  state.vectorProperties[targetXKey] = x - xDiff
  state.vectorProperties[targetYKey] = y - yDiff
  updateVectorProperties(
    currentVector,
    x - xDiff,
    y - yDiff,
    targetXKey,
    targetYKey
  )
}

/**
 * @param {object} currentVector - The vector action to update
 * @param {number} x - The x coordinate of new endpoint
 * @param {number} y - The y coordinate of new endpoint
 */
export function updateLockedCurrentVectorControlHandle(currentVector, x, y) {
  const savedProperties = state.vectorsSavedProperties[state.currentVectorIndex]
  //cubic curve
  switch (savedProperties.type) {
    case "cubicCurve": {
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
        targetPointNumber
      )
      break
    }
    case "quadCurve": {
      const currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
      //both point 1 and 2 hold point 3
      const targetPointNumber = 3
      updateVectorControl(
        currentVector,
        x,
        y,
        savedProperties,
        currentPointNumber,
        targetPointNumber
      )
      break
    }
    case "line": {
      const currentPointNumber = parseInt(vectorGui.selectedPoint.xKey[2])
      //point 1 holds point 2, point 2 holds point 1
      const targetPointNumber = currentPointNumber === 1 ? 2 : 1
      updateVectorControl(
        currentVector,
        x,
        y,
        savedProperties,
        currentPointNumber,
        targetPointNumber
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
  vectorsSavedProperties
) {
  const vectorsSavedPropertiesActionKeys = Object.keys(
    vectorsSavedProperties
  ).map((key) => state.vectors[key].action.index)
  let startActionIndex = Math.min(...vectorsSavedPropertiesActionKeys)
  let activeIndexes = []

  for (let i = startActionIndex; i < state.undoStack.length; i++) {
    let action = state.undoStack[i]
    if (
      action.layer === currentVector.layer &&
      (action.tool === "fill" ||
        action.tool === "cut" ||
        action?.modes?.eraser ||
        action?.modes?.inject ||
        vectorsSavedPropertiesActionKeys.includes(i))
    ) {
      activeIndexes.push(i)
    }
  }
  return activeIndexes
}
