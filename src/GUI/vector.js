import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { drawCirclePath, checkPointCollision } from "../utils/guiHelpers.js"
import { renderFillVector } from "./fill.js"
import { renderCurveVector, renderCurvePath } from "./curve.js"
import {
  renderEllipseVector,
  renderOffsetEllipseVector,
  renderEllipsePath,
} from "./ellipse.js"
import { renderTransformBox } from "./transform.js"
import { renderSelectVector, renderRasterCVS } from "./select.js"
import { renderGrid } from "./grid.js"
import {
  updateVectorProperties,
  calculateCurrentVectorDeltas,
  handleOptionsAndUpdateVector,
} from "../utils/vectorHelpers.js"

//==================================================//
//=== * * * Vector Graphics User Interface * * * ===//
//==================================================//

//Note: The Vector Graphics canvas has a mix-blend-mode: difference applied to it
export const vectorGui = {
  grid: false,
  gridSpacing: 8,
  selectedCollisionPresent: false,
  collidedKeys: { xKey: null, yKey: null },
  selectedPoint: { xKey: null, yKey: null },
  otherCollidedKeys: { xKey: null, yKey: null },
  linkedVectors: {},
  drawControlPoints,
  resetCollision() {
    this.selectedCollisionPresent = false
    this.collidedKeys = { xKey: null, yKey: null }
  },
  setCollision(keys) {
    this.selectedCollisionPresent = true
    this.collidedKeys.xKey = keys.x
    this.collidedKeys.yKey = keys.y
  },
  resetOtherVectorCollision() {
    canvas.collidedVectorIndex = null
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
  addLinkedVector(vectorAction, xKey) {
    if (this.selectedPoint.xKey) {
      return
    }
    if (!this.linkedVectors[vectorAction.index]) {
      this.linkedVectors[vectorAction.index] = {}
    }
    this.linkedVectors[vectorAction.index][xKey] = true
  },
  removeLinkedVector(vectorAction) {
    delete this.linkedVectors[vectorAction.index]
  },
  // drawSelectOutline,
  render,
  reset,
  setVectorProperties,
}

/**
 * @param {object} vectorProperties
 * @param {object} pointsKeys
 * @param {number} radius - (Float)
 * @param {boolean} modify
 * @param {number} offset - (Integer)
 * @param {object} vectorAction
 */
function drawControlPoints(
  vectorProperties,
  pointsKeys,
  radius,
  modify = false,
  offset = 0,
  vectorAction = null
) {
  for (let keys of pointsKeys) {
    const point = {
      x: vectorProperties[keys.x],
      y: vectorProperties[keys.y],
    }

    if (point.x === null || point.y === null) continue

    handleCollisionAndDraw(keys, point, radius, modify, offset, vectorAction)
  }

  setCursorStyle()
}

/**
 * TODO: (Low Priority) move drawing logic to separate function so modify param doesn't need to be used
 * @param {object} keys
 * @param {object} point
 * @param {number} radius - (Float)
 * @param {boolean} modify - if true, check for collision with cursor and modify radius
 * @param {number} offset - (Float)
 * @param {object} vectorAction
 */
function handleCollisionAndDraw(
  keys,
  point,
  radius,
  modify,
  offset,
  vectorAction
) {
  let r = state.touch ? radius * 2 : radius
  const xOffset = vectorAction ? vectorAction.layer.x : 0
  const yOffset = vectorAction ? vectorAction.layer.y : 0

  if (modify) {
    if (vectorGui.selectedPoint.xKey === keys.x && !vectorAction) {
      r = radius * 2.125 // increase  radius of fill to match stroked circle
      vectorGui.setCollision(keys)
    } else if (
      checkPointCollision(
        state.cursorX,
        state.cursorY,
        point.x - offset + xOffset,
        point.y - offset + yOffset,
        r * 2.125
      )
    ) {
      //if cursor is colliding with a control point not on the selected vector, set collided keys specifically for collided vector
      if (vectorAction) {
        if (keys.x === "px1" || keys.x === "px2") {
          canvas.collidedVectorIndex = vectorAction.index
          //Only allow link if active point for selection is p1 or p2
          let activeKey =
            vectorGui.selectedPoint.xKey || vectorGui.collidedKeys.xKey
          let allowLink = ["px1", "px2"].includes(activeKey)
          if (allowLink) {
            vectorGui.setOtherVectorCollision(keys)
            vectorGui.addLinkedVector(vectorAction, keys.x)
            if (state.clickCounter === 0) r = radius * 2.125
          } else if (!vectorGui.selectedPoint.xKey) {
            if (state.clickCounter === 0) r = radius * 2.125
          }
        } else if (
          (keys.x === "px3" || keys.x === "px4") &&
          !vectorGui.selectedPoint.xKey
        ) {
          canvas.collidedVectorIndex = vectorAction.index
          //only set new radius if selected vector is not a new vector being drawn
          if (state.clickCounter === 0) r = radius * 2.125
        }
      } else {
        r = radius * 2.125
        vectorGui.setCollision(keys)
      }
    }
    //else if selectedpoint is p3 or p4, setLinkedVector if vector's control point coords are the same as the selected point
    if (vectorGui.collidedKeys.xKey === "px3" && vectorAction) {
      if (
        point.x === state.vectorProperties.px1 &&
        point.y === state.vectorProperties.py1
      ) {
        vectorGui.addLinkedVector(vectorAction, keys.x)
      }
    }
    if (vectorGui.collidedKeys.xKey === "px4" && vectorAction) {
      if (
        point.x === state.vectorProperties.px2 &&
        point.y === state.vectorProperties.py2
      ) {
        vectorGui.addLinkedVector(vectorAction, keys.x)
      }
    }
  }
  //TODO: (Low Priority) radius is set progressively as the render function iterates through points, but ideally only the points corresponding to selectedPoint and collidedKeys should be rendered with an expanded radius.
  //Possible solution is to not change radius in this function, but instead at the end of the renderLayerVectors function, render a circle with the expanded radius for the selected and collided points.
  drawCirclePath(
    canvas,
    canvas.xOffset + xOffset,
    canvas.yOffset + yOffset,
    point.x - offset,
    point.y - offset,
    r
  )
}

/**
 * Set css cursor for vector interaction
 * @returns
 */
function setCursorStyle() {
  if (!vectorGui.selectedCollisionPresent && !canvas.collidedVectorIndex) {
    canvas.vectorGuiCVS.style.cursor = state.tool.modes?.eraser
      ? "none"
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
    const xKey = vectorGui.collidedKeys.xKey
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
  state.vectorProperties = {
    ...{
      px1: null,
      py1: null,
      px2: null,
      py2: null,
      px3: null,
      py3: null,
      px4: null,
      py4: null,
      radA: null,
      radB: null,
      angle: null,
      x1Offset: 0,
      y1Offset: 0,
      offset: null, //rename to something more specific
      forceCircle: false,
    },
  }
  //reset selectedpoint and collided keys
  canvas.currentVectorIndex = null
  vectorGui.render()
}

/**
 * Normalize vector properties based on layer offset
 * @param {object} vectorAction
 */
function setVectorProperties(vectorAction) {
  if (vectorAction.layer === canvas.currentLayer) {
    state.vectorProperties = { ...vectorAction.properties.vectorProperties }
    //Keep properties relative to layer offset
    state.vectorProperties.px1 += vectorAction.layer.x
    state.vectorProperties.py1 += vectorAction.layer.y
    if (
      vectorAction.tool.name === "quadCurve" ||
      vectorAction.tool.name === "cubicCurve" ||
      vectorAction.tool.name === "ellipse"
    ) {
      state.vectorProperties.px2 += vectorAction.layer.x
      state.vectorProperties.py2 += vectorAction.layer.y

      state.vectorProperties.px3 += vectorAction.layer.x
      state.vectorProperties.py3 += vectorAction.layer.y
    }

    if (vectorAction.tool.name === "cubicCurve") {
      state.vectorProperties.px4 += vectorAction.layer.x
      state.vectorProperties.py4 += vectorAction.layer.y
    }
    canvas.currentVectorIndex = vectorAction.index
  }
}

/**
 * Render vector graphical interface
 * @param {number} lineDashOffset - (Float)
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
  if (
    state.tool.options.displayVectors?.active ||
    state.tool.options.equal?.active ||
    state.tool.options.align?.active ||
    state.tool.options.link?.active
  ) {
    renderLayerVectors(canvas.currentLayer)
  } else {
    //else render only the current vector
    renderCurrentVector()
  }
  //Render select vector
  if (state.selectProperties.px1 !== null) {
    // renderSelectVector(0.5, state.tool.name === "select")
    renderRasterCVS()
  }
  //Render grid
  if (canvas.zoom >= 4 && vectorGui.grid) {
    renderGrid(vectorGui.gridSpacing)
  }
}

/**
 * Render based on the current tool.
 * @param {string} toolName
 * @param {object} vectorProperties
 * @param {boolean} selected
 * @param {object} vectorAction
 */
function renderControlPoints(toolName, vectorProperties, vectorAction = null) {
  switch (toolName) {
    case "fill":
      renderFillVector(vectorProperties, vectorAction)
      break
    case "quadCurve":
    case "cubicCurve":
      renderCurveVector(vectorProperties, vectorAction)
      break
    case "ellipse":
      renderEllipseVector(vectorProperties, vectorAction)
      const { x1Offset, y1Offset } = vectorProperties
      if (x1Offset || y1Offset) {
        renderOffsetEllipseVector(vectorProperties)
      }
      break
    case "move":
      if (canvas.currentLayer.type === "reference") {
        renderTransformBox()
      }
      break
    default:
    //
  }
}

/**
 * @param {string} toolName
 * @param {object} vectorProperties
 * @param {object} vectorAction
 */
function renderPath(toolName, vectorProperties, vectorAction = null) {
  switch (toolName) {
    case "fill":
      // renderFillVector(state.vectorProperties)
      break
    case "quadCurve":
    case "cubicCurve":
      renderCurvePath(vectorProperties, vectorAction)
      break
    case "ellipse":
      renderEllipsePath(vectorProperties, vectorAction)
      break
    case "move":
      // if (canvas.currentLayer.type === "reference") {
      //   renderTransformBox()
      // }
      break
    default:
    //
  }
}

/**
 * For each vector action in the undoStack in a given layer, render it
 * @param {object} layer
 */
function renderLayerVectors(layer) {
  let selectedVector = null
  if (canvas.currentVectorIndex) {
    selectedVector = state.undoStack[canvas.currentVectorIndex]
  }
  //iterate through and render all vectors in the layer except the selected vector which will always be rendered last
  //render paths
  for (let action of state.undoStack) {
    if (
      !action.removed &&
      action.layer === layer &&
      action.tool.type === "vector" &&
      action.tool.name === state.tool.name &&
      action !== selectedVector
    ) {
      renderPath(action.tool.name, action.properties.vectorProperties, action)
    }
  }
  //render selected vector path
  renderPath(state.tool.name, state.vectorProperties)
  if (!state.tool.options.displayPaths?.active) {
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
  renderControlPoints(state.tool.name, state.vectorProperties)
  //render control points
  vectorGui.resetOtherVectorCollision()
  vectorGui.resetLinkedVectors()
  for (let action of state.undoStack) {
    if (
      !action.removed &&
      action.layer === layer &&
      action.tool.type === "vector" &&
      action.tool.name === state.tool.name &&
      action !== selectedVector
    ) {
      renderControlPoints(
        action.tool.name,
        action.properties.vectorProperties,
        action
      )
    }
  }
  // //render selected vector control points
  // vectorGui.resetCollision()
  // renderControlPoints(state.tool.name, state.vectorProperties)
}

/**
 * Render the current vector
 */
export function renderCurrentVector() {
  //render paths
  renderPath(state.tool.name, state.vectorProperties)
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
  renderControlPoints(state.tool.name, state.vectorProperties)
}

/**
 *
 * @param {object} currentVector
 * @param {boolean} saveVectorProperties
 */
export function updateLinkedVectors(
  currentVector,
  saveVectorProperties = false
) {
  const { currentDeltaX, currentDeltaY, currentDeltaAngle } =
    calculateCurrentVectorDeltas(
      currentVector,
      vectorGui.selectedPoint.xKey,
      state.tool.options,
      state.vectorsSavedProperties
    )

  for (const [linkedVectorIndex, linkedPoints] of Object.entries(
    vectorGui.linkedVectors
  )) {
    let x = state.cursorX
    let y = state.cursorY
    const linkedVector = state.undoStack[linkedVectorIndex]

    if (saveVectorProperties) {
      state.vectorsSavedProperties[linkedVectorIndex] = {
        ...linkedVector.properties.vectorProperties,
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
 *
 * @param {object} currentVector
 */
export function updateLockedCurrentVectorControlHandle(currentVector, x, y) {
  const savedProperties =
    state.vectorsSavedProperties[canvas.currentVectorIndex]
  if (vectorGui.selectedPoint.xKey === "px1") {
    //update px3 and py3
    const xDiff = savedProperties.px1 - savedProperties.px3
    const yDiff = savedProperties.py1 - savedProperties.py3
    state.vectorProperties.px3 = x - xDiff
    state.vectorProperties.py3 = y - yDiff
    updateVectorProperties(currentVector, x - xDiff, y - yDiff, "px3", "py3")
  } else if (vectorGui.selectedPoint.xKey === "px2") {
    //update px4 and py4
    const xDiff = savedProperties.px2 - savedProperties.px4
    const yDiff = savedProperties.py2 - savedProperties.py4
    state.vectorProperties.px4 = x - xDiff
    state.vectorProperties.py4 = y - yDiff
    updateVectorProperties(currentVector, x - xDiff, y - yDiff, "px4", "py4")
  }
}

/**
 * For efficient rendering, create an array of indexes of vectors that need to be re-rendered.
 * Other actions will be saved to between canvases to avoid multiple ununecessary renders in redrawTimelineActions
 * Can't simply save images and draw them for the betweenCvs because this will ignore actions using erase or inject modes.
 * @param {object} currentVector
 * @param {object} vectorsSavedProperties - will have at least one entry, corresponding to currentVector
 * @param {Array} undoStack
 * @returns {Array} activeIndexes
 */
export function createActiveIndexesForRender(
  currentVector,
  vectorsSavedProperties,
  undoStack
) {
  const vectorsSavedPropertiesKeys = Object.keys(vectorsSavedProperties).map(
    (key) => parseInt(key)
  )
  let activeIndexes = []

  // Check the conditions only if currentVector's tool is not 'fill'
  // if (currentVector.tool.name !== "fill") {
  for (let i = vectorsSavedPropertiesKeys[0]; i < undoStack.length; i++) {
    let action = undoStack[i]
    if (
      action.layer === currentVector.layer &&
      (action.tool.name === "fill" ||
        action.tool.name === "cut" ||
        vectorsSavedProperties[i] ||
        action.modes?.eraser ||
        action.modes?.inject)
    ) {
      activeIndexes.push(i)
    }
  }
  // } else {
  //   activeIndexes.push(vectorsSavedPropertiesKeys[0])
  // }
  return activeIndexes
}
