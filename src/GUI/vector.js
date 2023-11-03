import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { drawCirclePath, checkPointCollision } from "../utils/guiHelpers.js"
import { renderFillVector } from "./fill.js"
import { renderCurveVector } from "./curve.js"
import { renderEllipseVector, renderOffsetEllipseVector } from "./ellipse.js"
import { renderTransformBox } from "./transform.js"
import { renderSelectVector, drawSelectOutline } from "./select.js"
import { renderGrid } from "./grid.js"

//==================================================//
//=== * * * Vector Graphics User Interface * * * ===//
//==================================================//

//Note: The Vector Graphics canvas has a mix-blend-mode: difference applied to it
export const vectorGui = {
  collisionPresent: false,
  collidedKeys: { xKey: null, yKey: null },
  selectedPoint: { xKey: null, yKey: null },
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
 */
function drawControlPoints(
  vectorProperties,
  pointsKeys,
  radius,
  modify = false,
  offset = 0
) {
  vectorGui.resetCollision()

  for (let keys of pointsKeys) {
    const point = {
      x: vectorProperties[keys.x],
      y: vectorProperties[keys.y],
    }

    if (point.x === null || point.y === null) continue

    handleCollisionAndDraw(keys, point, radius, modify, offset)
  }

  setCursorStyle()
}

/**
 *
 * @param {Object} keys
 * @param {Object} point
 * @param {Float} radius
 * @param {Boolean} modify
 * @param {Float} offset
 */
function handleCollisionAndDraw(keys, point, radius, modify, offset) {
  let r = state.touch ? radius * 2 : radius

  if (modify) {
    if (vectorGui.selectedPoint.xKey === keys.x) {
      r = radius * 2
      vectorGui.setCollision(keys)
    } else if (
      checkPointCollision(
        state.cursorX,
        state.cursorY,
        point.x - offset,
        point.y - offset,
        r + 1
      )
    ) {
      r = radius * 2
      vectorGui.setCollision(keys)
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
    canvas.vectorGuiCVS.style.cursor =
      dom.modeBtn.id === "erase" ? "none" : state.tool.cursor
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
  renderTool(state.tool.name)
  //Render select vector
  if (state.selectProperties.px1 !== null) {
    renderSelectVector(vectorGui, lineDashOffset, state.tool.name === "select")
  }
  //Render grid
  if (canvas.zoom >= 4 && state.grid) {
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
 */
function renderTool(toolName) {
  switch (toolName) {
    case "fill":
      renderFillVector(vectorGui)
      break
    case "quadCurve":
    case "cubicCurve":
      renderCurveVector(vectorGui)
      break
    case "ellipse":
      renderEllipseVector(vectorGui)
      const { x1Offset, y1Offset } = state.vectorProperties
      if (x1Offset || y1Offset) {
        renderOffsetEllipseVector("red")
      }
      break
    case "move":
      if (canvas.currentLayer.type === "reference") {
        renderTransformBox(vectorGui)
      }
      break
    default:
    //
  }
}
