import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { drawCirclePath, checkPointCollision } from "../utils/guiHelpers.js"
import { renderFillVector } from "./fill.js"
import { renderCurveVector, renderCurvePath } from "./curve.js"
import { renderEllipseVector, renderOffsetEllipseVector } from "./ellipse.js"
import { renderTransformBox } from "./transform.js"
import { renderSelectVector, drawSelectOutline } from "./select.js"
import { renderGrid } from "./grid.js"

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
    this.otherCollidedKeys = { xKey: null, yKey: null }
  },
  setOtherVectorCollision(keys) {
    this.otherCollidedKeys.xKey = keys.x
    this.otherCollidedKeys.yKey = keys.y
  },
  drawSelectOutline,
  render,
  reset,
}

/**
 * @param {Object} vectorProperties
 * @param {Object} pointsKeys
 * @param {Integer} radius
 * @param {Boolean} modify
 * @param {Integer} offset
 * @param {Boolean} selected
 */
function drawControlPoints(
  vectorProperties,
  pointsKeys,
  radius,
  modify = false,
  offset = 0,
  selected = false,
  action = null
) {
  // vectorGui.resetCollision()

  for (let keys of pointsKeys) {
    const point = {
      x: vectorProperties[keys.x],
      y: vectorProperties[keys.y],
    }

    if (point.x === null || point.y === null) continue

    handleCollisionAndDraw(
      keys,
      point,
      radius,
      modify,
      offset,
      selected,
      action
    )
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
 * @param {Boolean} selected
 */
function handleCollisionAndDraw(
  keys,
  point,
  radius,
  modify,
  offset,
  selected,
  action
) {
  let r = state.touch ? radius * 2 : radius

  if (modify) {
    if (vectorGui.selectedPoint.xKey === keys.x && selected) {
      r = radius * 2.125 // increase  radius of fill to match stroked circle
      vectorGui.setCollision(keys)
    } else if (
      checkPointCollision(
        state.cursorX,
        state.cursorY,
        point.x - offset,
        point.y - offset,
        r * 2.125
      )
    ) {
      //if cursor is colliding with a control point not on the selected vector, set collided keys specifically for collided vector
      if (action?.index && action?.index !== canvas.currentVectorIndex) {
        canvas.collidedVectorIndex = action.index
        if (keys.x === "px1" || keys.x === "px2") {
          r = radius * 2.125
          vectorGui.setOtherVectorCollision(keys)
        }
      } else {
        r = radius * 2.125
        vectorGui.setCollision(keys)
      }
    }
  }

  drawCirclePath(canvas, point.x - offset, point.y - offset, r)
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
  renderLayerVectors(canvas.currentLayer)
  // console.log(
  //   canvas.currentVectorIndex,
  //   canvas.collidedVectorIndex,
  //   vectorGui.collidedKeys
  // )
  // renderPath(state.tool.name, state.vectorProperties) //all paths should be rendered before all control points
  // renderTool(state.tool.name, state.vectorProperties)
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
 * @param {Object} action
 */
function renderTool(
  toolName,
  vectorProperties,
  selected = false,
  action = null
) {
  switch (toolName) {
    case "fill":
      renderFillVector(vectorProperties)
      break
    case "quadCurve":
    case "cubicCurve":
      renderCurveVector(vectorProperties, selected, action)
      break
    case "ellipse":
      renderEllipseVector(vectorProperties)
      const { x1Offset, y1Offset } = vectorProperties
      if (x1Offset || y1Offset) {
        renderOffsetEllipseVector(vectorProperties, "red")
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

function renderPath(toolName, vectorProperties) {
  switch (toolName) {
    case "fill":
      // renderFillVector(state.vectorProperties)
      break
    case "quadCurve":
    case "cubicCurve":
      renderCurvePath(vectorProperties)
      break
    case "ellipse":
      // renderEllipseVector(state.vectorProperties)
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

//For each vector action in the undoStack in a given layer, render it
function renderLayerVectors(layer) {
  //render paths
  for (let action of state.undoStack) {
    if (
      !action.hidden &&
      !action.removed &&
      action.layer === layer &&
      action.tool.type === "vector"
    ) {
      renderPath(action.tool.name, action.properties.vectorProperties)
    }
  }
  renderPath(state.tool.name, state.vectorProperties)
  //render control points
  let selectedVector = null
  if (canvas.currentVectorIndex) {
    selectedVector = state.undoStack[canvas.currentVectorIndex]
  }
  //render all vectors in the layer except the selected vector
  vectorGui.resetOtherVectorCollision()
  for (let action of state.undoStack) {
    if (
      !action.hidden &&
      !action.removed &&
      action.layer === layer &&
      action.tool.type === "vector" &&
      action !== selectedVector
    ) {
      // console.log(action === selectedVector)
      renderTool(
        action.tool.name,
        action.properties.vectorProperties,
        false,
        action
      )
    }
  }
  //render selected vector
  vectorGui.resetCollision()
  renderTool(state.tool.name, state.vectorProperties, true, selectedVector)
}
