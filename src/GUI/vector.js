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
import { renderTransformBox } from "./transform.js"
import { renderRasterCVS } from "./select.js"
import { renderGrid } from "./grid.js"
import {
  updateVectorProperties,
  calculateCurrentVectorDeltas,
  handleOptionsAndUpdateVector,
} from "../utils/vectorHelpers.js"
import {
  disableActionsForNoSelection,
  enableActionsForSelection,
} from "../DOM/disableDomElements.js"

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
  addLinkedVector(vector, xKey) {
    if (this.selectedPoint.xKey) {
      return
    }
    if (!this.linkedVectors[vector.index]) {
      this.linkedVectors[vector.index] = {}
    }
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

/**
 * @param {object} vectorProperties - The properties of the vector
 * @param {object} pointsKeys - The keys of the control points
 * @param {number} radius - (Float)
 * @param {boolean} modify - if true, check for collision with cursor and modify radius
 * @param {number} offset - (Integer)
 * @param {object} action - The vector action to be rendered
 * @param {object} vector - The vector to be rendered
 */
function drawControlPoints(
  vectorProperties,
  pointsKeys,
  radius,
  modify = false,
  offset = 0,
  action = null,
  vector = null
) {
  for (let keys of pointsKeys) {
    const point = {
      x: vectorProperties[keys.x],
      y: vectorProperties[keys.y],
    }

    if (point.x === null || point.y === null) continue

    handleCollisionAndDraw(keys, point, radius, modify, offset, action, vector)
  }

  setCursorStyle()
}

/**
 * TODO: (Low Priority) move drawing logic to separate function so modify param doesn't need to be used
 * @param {object} keys - The keys of the control points
 * @param {object} point - The coordinates of the control point
 * @param {number} radius - (Float)
 * @param {boolean} modify - if true, check for collision with cursor and modify radius
 * @param {number} offset - (Float)
 * @param {object} action - The vector action to be rendered
 * @param {object} vector - The vector to be rendered
 */
function handleCollisionAndDraw(
  keys,
  point,
  radius,
  modify,
  offset,
  action,
  vector
) {
  let r = state.touch ? radius * 2 : radius
  const xOffset = action ? action.layer.x : 0
  const yOffset = action ? action.layer.y : 0

  if (modify) {
    if (vectorGui.selectedPoint.xKey === keys.x && !vector) {
      r = radius * 2.125 // increase  radius of fill to match stroked circle
      vectorGui.setCollision(keys)
    } else if (
      checkSquarePointCollision(
        state.cursorX,
        state.cursorY,
        point.x - offset + xOffset,
        point.y - offset + yOffset,
        r * 2.125
      )
    ) {
      //if cursor is colliding with a control point not on the selected vector, set collided keys specifically for collided vector
      if (vector) {
        if (keys.x === "px1" || keys.x === "px2") {
          state.collidedVectorIndex = vector.index
          //Only allow link if active point for selection is p1 or p2
          let activeKey =
            vectorGui.selectedPoint.xKey || vectorGui.collidedKeys.xKey
          let allowLink = ["px1", "px2"].includes(activeKey)
          if (allowLink) {
            vectorGui.setOtherVectorCollision(keys)
            vectorGui.addLinkedVector(vector, keys.x)
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
    if (vectorGui.collidedKeys.xKey === "px3" && vector) {
      if (
        point.x === state.vectorProperties.px1 &&
        point.y === state.vectorProperties.py1
      ) {
        vectorGui.addLinkedVector(vector, keys.x)
      }
    }
    if (vectorGui.collidedKeys.xKey === "px4" && vector) {
      if (
        point.x === state.vectorProperties.px2 &&
        point.y === state.vectorProperties.py2
      ) {
        vectorGui.addLinkedVector(vector, keys.x)
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
 */
function setCursorStyle() {
  if (!vectorGui.selectedCollisionPresent && !state.collidedVectorIndex) {
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
    // ...{
    //   type: null,
    //   px1: null,
    //   py1: null,
    //   px2: null,
    //   py2: null,
    //   px3: null,
    //   py3: null,
    //   px4: null,
    //   py4: null,
    //   radA: null,
    //   radB: null,
    //   angle: null,
    //   unifiedOffset: null,
    //   x1Offset: 0,
    //   y1Offset: 0,
    //   forceCircle: false,
    // },
  }
  //reset selectedpoint and collided keys
  state.currentVectorIndex = null
  disableActionsForNoSelection()
  vectorGui.render()
}

/**
 * Normalize vector properties based on layer offset
 * @param {object} action - The vector action
 * @param {object} vector - The vector action to base the properties on
 */
function setVectorProperties(action, vector) {
  if (action.layer === canvas.currentLayer) {
    state.vectorProperties = { ...vector.vectorProperties }
    //Keep properties relative to layer offset
    state.vectorProperties.px1 += action.layer.x
    state.vectorProperties.py1 += action.layer.y
    if (
      vector.vectorProperties.type === "quadCurve" ||
      vector.vectorProperties.type === "cubicCurve" ||
      vector.vectorProperties.type === "ellipse"
    ) {
      state.vectorProperties.px2 += action.layer.x
      state.vectorProperties.py2 += action.layer.y

      state.vectorProperties.px3 += action.layer.x
      state.vectorProperties.py3 += action.layer.y
    }

    if (vector.vectorProperties.type === "cubicCurve") {
      state.vectorProperties.px4 += action.layer.x
      state.vectorProperties.py4 += action.layer.y
    }
    state.currentVectorIndex = vector.index
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
  //TODO: (High Priority) Need special render function for unconfirmed pasted vectors and selected vectors
  // if (Object.keys(state.selectedVectors).length !== 0) {
  //   // renderSelectedVectors()
  // }
  //Render selection outline
  if (
    state.selectProperties.px1 !== null ||
    Object.keys(state.selectedVectors).length > 0
  ) {
    renderRasterCVS()
  }
  //Render grid
  if (canvas.zoom >= 4 && vectorGui.grid) {
    renderGrid(vectorGui.gridSpacing)
  }
}

/**
 * Render based on the current tool.
 * @param {string} toolName - The name of the tool
 * @param {object} vectorProperties - The properties of the vector
 * @param {object|null} action - The vector action to be rendered
 * @param {object|null} vector - The vector action to base the properties on
 */
function renderControlPoints(
  toolName,
  vectorProperties,
  action = null,
  vector = null
) {
  switch (toolName) {
    case "fill":
      renderFillVector(vectorProperties, action, vector)
      break
    case "quadCurve":
    case "cubicCurve":
      renderCurveVector(vectorProperties, action, vector)
      break
    case "ellipse":
      renderEllipseVector(vectorProperties, action, vector)
      if (vectorProperties.x1Offset || vectorProperties.y1Offset) {
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
 * @param {string} toolName - The name of the tool
 * @param {object} vectorProperties - The properties of the vector
 * @param {object|null} action - The vector's action
 * @param {object|null} vector - The vector to be rendered
 */
function renderPath(toolName, vectorProperties, action = null, vector = null) {
  switch (toolName) {
    case "fill":
      // renderFillVector(state.vectorProperties)
      break
    case "quadCurve":
    case "cubicCurve":
      renderCurvePath(vectorProperties, action, vector)
      break
    case "ellipse":
      renderEllipsePath(vectorProperties, action)
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
 * @param {object} layer - The layer to render the vectors for
 * TODO: (High Priority) Get vectors as sub actions of group actions, eg. selectedVector = state.lookupVector(state.currentVectorIndex)
 */
function renderLayerVectors(layer) {
  let selectedVectorAction = null
  let selectedVector = null
  if (state.currentVectorIndex !== null) {
    selectedVectorAction =
      state.undoStack[state.vectorLookup[state.currentVectorIndex]]
    selectedVector = selectedVectorAction.vectors[state.currentVectorIndex]
  }
  //iterate through and render all vectors in the layer except the selected vector which will always be rendered last
  //render paths
  for (let action of state.undoStack) {
    if (
      !action.removed &&
      action.layer === layer &&
      action.tool.type === "vector"
    ) {
      //For each of action.vectors, render paths
      for (let vectorIndex in action.vectors) {
        let vector = action.vectors[vectorIndex]
        if (
          !vector.removed &&
          vector.vectorProperties.type === state.tool.name
          // &&
          // vector !== selectedVector
        ) {
          renderPath(
            vector.vectorProperties.type,
            vector.vectorProperties,
            action,
            vector
          )
        }
      }
    }
  }
  //render vector path for in progress vectors
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
      action.tool.type === "vector"
    ) {
      //For each of action.vectors, render control points
      for (let vectorIndex in action.vectors) {
        let vector = action.vectors[vectorIndex]
        if (
          !vector.removed &&
          vector.vectorProperties.type === state.tool.name &&
          vector !== selectedVector
        ) {
          renderControlPoints(
            vector.vectorProperties.type,
            vector.vectorProperties,
            action,
            vector
          )
        }
      }
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
 * @param {object} currentVector - The vector action to base other vector handling on
 * @param {boolean} saveVectorProperties - if true, save the properties of the vector
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
    const linkedVectorAction =
      state.undoStack[state.vectorLookup[linkedVectorIndex]]
    const linkedVector = linkedVectorAction.vectors[linkedVectorIndex]

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
      linkedVectorAction,
      linkedVector,
      linkedPoints,
      savedProperties,
      state.tool.options
    )
  }
}

/**
 * @param {object} currentAction - The action that contains the vector
 * @param {object} currentVector - The vector action to update
 * @param {number} x - The x coordinate of new endpoint
 * @param {number} y - The y coordinate of new endpoint
 */
export function updateLockedCurrentVectorControlHandle(
  currentAction,
  currentVector,
  x,
  y
) {
  const savedProperties = state.vectorsSavedProperties[state.currentVectorIndex]
  if (vectorGui.selectedPoint.xKey === "px1") {
    //update px3 and py3
    const xDiff = savedProperties.px1 - savedProperties.px3
    const yDiff = savedProperties.py1 - savedProperties.py3
    state.vectorProperties.px3 = x - xDiff
    state.vectorProperties.py3 = y - yDiff
    updateVectorProperties(
      currentAction,
      currentVector,
      x - xDiff,
      y - yDiff,
      "px3",
      "py3"
    )
  } else if (vectorGui.selectedPoint.xKey === "px2") {
    //update px4 and py4
    const xDiff = savedProperties.px2 - savedProperties.px4
    const yDiff = savedProperties.py2 - savedProperties.py4
    state.vectorProperties.px4 = x - xDiff
    state.vectorProperties.py4 = y - yDiff
    updateVectorProperties(
      currentAction,
      currentVector,
      x - xDiff,
      y - yDiff,
      "px4",
      "py4"
    )
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
  ).map((key) => state.vectorLookup[key])
  let startActionIndex =
    state.vectorLookup[Object.keys(vectorsSavedProperties)[0]]
  let currentAction = state.undoStack[state.vectorLookup[currentVector.index]]
  let activeIndexes = []

  for (let i = startActionIndex; i < state.undoStack.length; i++) {
    let action = state.undoStack[i]
    if (
      action.layer === currentAction.layer &&
      (action.tool.name === "fill" ||
        action.tool.name === "cut" ||
        action?.modes?.eraser ||
        action?.modes?.inject ||
        vectorsSavedPropertiesActionKeys.includes(i))
    ) {
      activeIndexes.push(i)
    }
  }
  return activeIndexes
}
