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
import { renderSelectVector, drawSelectOutline } from "./select.js"
import { renderGrid } from "./grid.js"
import { updateVectorProperties } from "../utils/vectorHelpers.js"
import { getAngle } from "../utils/trig.js"

//==================================================//
//=== * * * Vector Graphics User Interface * * * ===//
//==================================================//

//Note: The Vector Graphics canvas has a mix-blend-mode: difference applied to it
export const vectorGui = {
  grid: false,
  collisionPresent: false,
  collidedKeys: { xKey: null, yKey: null },
  selectedPoint: { xKey: null, yKey: null },
  otherCollidedKeys: { xKey: null, yKey: null },
  linkedVectors: {},
  drawControlPoints,
  resetCollision() {
    this.collisionPresent = false
    this.collidedKeys = { xKey: null, yKey: null }
  },
  setCollision(keys) {
    this.collisionPresent = true
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
  drawSelectOutline,
  render,
  reset,
  setVectorProperties,
}

/**
 * @param {Object} vectorProperties
 * @param {Object} pointsKeys
 * @param {Integer} radius
 * @param {Boolean} modify
 * @param {Integer} offset
 * @param {Object} vectorAction
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
 * TODO: move drawing logic to separate function so modify param doesn't need to be used
 * @param {Object} keys
 * @param {Object} point
 * @param {Float} radius
 * @param {Boolean} modify - if true, check for collision with cursor and modify radius
 * @param {Float} offset
 * @param {Object} vectorAction
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
        canvas.collidedVectorIndex = vectorAction.index
        if (keys.x === "px1" || keys.x === "px2") {
          r = radius * 2.125
          vectorGui.setOtherVectorCollision(keys)
          vectorGui.addLinkedVector(vectorAction, keys.x)
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
  if (!vectorGui.collisionPresent) {
    canvas.vectorGuiCVS.style.cursor = state.tool.modes?.eraser
      ? "none"
      : state.tool.cursor
    return
  }

  //If pointer is colliding with a vector control point:
  if (state.tool.name !== "move") {
    canvas.vectorGuiCVS.style.cursor = "move" //TODO: maybe use grab/ grabbing
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
 * @param {Object} vectorAction
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
 * @param {Float} lineDashOffset
 */
function render(lineDashOffset = 0.5) {
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
    renderSelectVector(vectorGui, lineDashOffset, state.tool.name === "select")
  }
  //Render grid
  if (canvas.zoom >= 4 && vectorGui.grid) {
    renderGrid(8)
  }
  //Animate render
  // if (state.tool.name !== "select" || !state.clicked) {
  //   window.requestAnimationFrame(() => {
  //     render(state, canvas, lineDashOffset < 2 ? lineDashOffset + 0.1 : 0)
  //   })
  // }
}

/**
 * Render based on the current tool.
 * @param {String} toolName
 * @param {Object} vectorProperties
 * @param {Boolean} selected
 * @param {Object} vectorAction
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
 * @param {String} toolName
 * @param {Object} vectorProperties
 * @param {Object} vectorAction
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
 * @param {Object} layer
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
  //render selected vector control points
  vectorGui.resetCollision()
  renderControlPoints(state.tool.name, state.vectorProperties)
}

/**
 * Render the current vector
 */
function renderCurrentVector() {
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
 * @param {Object} currentVector
 * @param {Boolean} saveVectorProperties
 */
export function updateLinkedVectors(
  currentVector,
  saveVectorProperties = false
) {
  let currentDeltaX, currentDeltaY, currentDeltaAngle //for calculating angle when using px3, px4
  let deltaX, deltaY //for setting new angle when using px3, px4
  if (vectorGui.selectedPoint.xKey === "px3") {
    // get angle of control handle between currentVector p1 and p3
    currentDeltaX =
      currentVector.properties.vectorProperties.px1 -
      currentVector.properties.vectorProperties.px3
    currentDeltaY =
      currentVector.properties.vectorProperties.py1 -
      currentVector.properties.vectorProperties.py3
    if (!state.tool.options.align?.active) {
      let angle = getAngle(currentDeltaX, currentDeltaY)
      let savedCurrentProperties =
        state.vectorsSavedProperties[currentVector.index]
      let savedDeltaX = savedCurrentProperties.px1 - savedCurrentProperties.px3
      let savedDeltaY = savedCurrentProperties.py1 - savedCurrentProperties.py3
      let savedAngle = getAngle(savedDeltaX, savedDeltaY)
      currentDeltaAngle = angle - savedAngle
    }
  } else if (vectorGui.selectedPoint.xKey === "px4") {
    // get angle of control handle between currentVector p2 and p4
    currentDeltaX =
      currentVector.properties.vectorProperties.px2 -
      currentVector.properties.vectorProperties.px4
    currentDeltaY =
      currentVector.properties.vectorProperties.py2 -
      currentVector.properties.vectorProperties.py4
    if (!state.tool.options.align?.active) {
      let angle = getAngle(currentDeltaX, currentDeltaY)
      let savedCurrentProperties =
        state.vectorsSavedProperties[currentVector.index]
      let savedDeltaX = savedCurrentProperties.px2 - savedCurrentProperties.px4
      let savedDeltaY = savedCurrentProperties.py2 - savedCurrentProperties.py4
      let savedAngle = getAngle(savedDeltaX, savedDeltaY)
      currentDeltaAngle = angle - savedAngle
    }
  }

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

    // Check if px1 is linked
    if (linkedPoints.px1) {
      if (
        vectorGui.selectedPoint.xKey === "px1" ||
        vectorGui.selectedPoint.xKey === "px2"
      ) {
        updateVectorProperties(linkedVector, x, y, "px1", "py1")
        if (state.tool.options.align?.active) {
          //update px3 and py3
          const xDiff = savedProperties.px1 - savedProperties.px3
          const yDiff = savedProperties.py1 - savedProperties.py3
          updateVectorProperties(
            linkedVector,
            x - xDiff,
            y - yDiff,
            "px3",
            "py3"
          )
        }
      } else if (
        vectorGui.selectedPoint.xKey === "px3" ||
        vectorGui.selectedPoint.xKey === "px4"
      ) {
        if (state.tool.options.align?.active) {
          deltaX = currentDeltaX * 2
          deltaY = currentDeltaY * 2
        } else {
          let linkedDeltaX = savedProperties.px1 - savedProperties.px3
          let linkedDeltaY = savedProperties.py1 - savedProperties.py3
          let linkedAngle = getAngle(linkedDeltaX, linkedDeltaY)
          let linkedHandleLength = Math.sqrt(
            linkedDeltaX ** 2 + linkedDeltaY ** 2
          )
          let newLinkedAngle = linkedAngle + currentDeltaAngle
          deltaX =
            currentDeltaX -
            Math.round(Math.cos(newLinkedAngle) * linkedHandleLength)
          deltaY =
            currentDeltaY -
            Math.round(Math.sin(newLinkedAngle) * linkedHandleLength)
        }
        updateVectorProperties(
          linkedVector,
          x + deltaX,
          y + deltaY,
          "px3",
          "py3"
        )
      }
    }

    // Check if px2 is linked
    if (linkedPoints.px2) {
      if (
        vectorGui.selectedPoint.xKey === "px1" ||
        vectorGui.selectedPoint.xKey === "px2"
      ) {
        updateVectorProperties(linkedVector, x, y, "px2", "py2")
        if (state.tool.options.align?.active) {
          //update px4 and py4
          const xDiff = savedProperties.px2 - savedProperties.px4
          const yDiff = savedProperties.py2 - savedProperties.py4
          updateVectorProperties(
            linkedVector,
            x - xDiff,
            y - yDiff,
            "px4",
            "py4"
          )
        }
      } else if (
        vectorGui.selectedPoint.xKey === "px3" ||
        vectorGui.selectedPoint.xKey === "px4"
      ) {
        if (state.tool.options.align?.active) {
          deltaX = currentDeltaX * 2
          deltaY = currentDeltaY * 2
        } else {
          let linkedDeltaX = savedProperties.px2 - savedProperties.px4
          let linkedDeltaY = savedProperties.py2 - savedProperties.py4
          let linkedAngle = getAngle(linkedDeltaX, linkedDeltaY)
          let linkedHandleLength = Math.sqrt(
            linkedDeltaX ** 2 + linkedDeltaY ** 2
          )
          let newLinkedAngle = linkedAngle + currentDeltaAngle
          deltaX =
            currentDeltaX -
            Math.round(Math.cos(newLinkedAngle) * linkedHandleLength)
          deltaY =
            currentDeltaY -
            Math.round(Math.sin(newLinkedAngle) * linkedHandleLength)
        }
        updateVectorProperties(
          linkedVector,
          x + deltaX,
          y + deltaY,
          "px4",
          "py4"
        )
      }
    }
  }
}

/**
 *
 * @param {Object} currentVector
 */
export function updateLockedCurrentVectorControlHandle(currentVector) {
  const savedProperties =
    state.vectorsSavedProperties[canvas.currentVectorIndex]
  if (vectorGui.selectedPoint.xKey === "px1") {
    //update px3 and py3
    const xDiff = savedProperties.px1 - savedProperties.px3
    const yDiff = savedProperties.py1 - savedProperties.py3
    state.vectorProperties.px3 = state.cursorX - xDiff
    state.vectorProperties.py3 = state.cursorY - yDiff
    updateVectorProperties(
      currentVector,
      state.cursorX - xDiff,
      state.cursorY - yDiff,
      "px3",
      "py3"
    )
  } else if (vectorGui.selectedPoint.xKey === "px2") {
    //update px4 and py4
    const xDiff = savedProperties.px2 - savedProperties.px4
    const yDiff = savedProperties.py2 - savedProperties.py4
    state.vectorProperties.px4 = state.cursorX - xDiff
    state.vectorProperties.py4 = state.cursorY - yDiff
    updateVectorProperties(
      currentVector,
      state.cursorX - xDiff,
      state.cursorY - yDiff,
      "px4",
      "py4"
    )
  }
}

/**
 *
 * @param {Object} currentVector
 * @returns {Array} activeIndexes
 */
export function createActiveIndexesForRender(currentVector) {
  let activeIndexes = Object.keys(state.vectorsSavedProperties).map((key) =>
    parseInt(key)
  )
  //add fill actions to activeIndexes starting at first active index
  for (let i = activeIndexes[0]; i < state.undoStack.length; i++) {
    let action = state.undoStack[i]
    if (
      action.layer === currentVector.layer &&
      action.tool.name === "fill" &&
      action !== currentVector &&
      currentVector.tool.name !== "fill"
    ) {
      activeIndexes.push(i)
    }
  }
  //sort activeIndexes
  activeIndexes.sort((a, b) => a - b)
  return activeIndexes
}
