import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { brushStamps } from "../Context/brushStamps.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { enableActionsForClipboard } from "../DOM/disableDomElements.js"
import {
  actionFill,
  actionQuadraticCurve,
  actionCubicCurve,
  actionEllipse,
  actionLine,
} from "../Actions/pointerActions.js"

//===================================//
//========= * * * Edit * * * ========//
//===================================//

/**
 * Copy selected pixels
 * Not dependent on pointer events
 */
export function copySelectedPixels() {
  const { xMin, yMin, xMax, yMax } = state.boundaryBox
  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = xMax - xMin
  tempCanvas.height = yMax - yMin
  const tempCTX = tempCanvas.getContext("2d", {
    willReadFrequently: true,
  })
  tempCTX.drawImage(
    canvas.currentLayer.cvs,
    xMin,
    yMin,
    xMax - xMin,
    yMax - yMin,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  )
  state.selectClipboard.selectProperties = { ...state.selectProperties }
  state.selectClipboard.boundaryBox = {
    ...state.boundaryBox,
  }
  state.selectClipboard.canvas = tempCanvas
  state.selectClipboard.imageData = canvas.currentLayer.ctx.getImageData(
    xMin,
    yMin,
    xMax - xMin,
    yMax - yMin
  )
  state.selectClipboard.vectors = {}
  enableActionsForClipboard()
}

/**
 * Copy selected vectors
 */
export function copySelectedVectors() {
  let selectedVectors = {}
  state.selectedVectorIndicesSet.forEach((vectorIndex) => {
    let vector = state.vectors[vectorIndex]
    selectedVectors[vectorIndex] = {
      ...vector,
    }
  })
  if (state.selectedVectorIndicesSet.size === 0) {
    let currentVector = state.vectors[state.currentVectorIndex]
    selectedVectors[state.currentVectorIndex] = {
      ...currentVector,
    }
  }
  state.selectClipboard.selectProperties = { ...state.selectProperties }
  state.selectClipboard.boundaryBox = {
    xMin: null,
    yMin: null,
    xMax: null,
    yMax: null,
  }
  state.selectClipboard.canvas = null
  state.selectClipboard.vectors = selectedVectors
  enableActionsForClipboard()
}

/**
 * Cut selected pixels
 * Not dependent on pointer events
 * @param {boolean} copyToClipboard - whether to copy selected pixels to clipboard (delete method doesn't copy)
 */
export function cutSelectedPixels(copyToClipboard) {
  if (copyToClipboard) {
    copySelectedPixels()
  }
  const { xMin, yMin, xMax, yMax } = state.boundaryBox
  //Clear boundaryBox area
  canvas.currentLayer.ctx.clearRect(xMin, yMin, xMax - xMin, yMax - yMin)
}

/**
 * Paste selected pixels
 * Not dependent on pointer events
 * @param {object} clipboard - clipboard object
 * @param {object} layer - layer object to paste onto
 * @param {number} offsetX - x offset
 * @param {number} offsetY - y offset
 */
export function pasteSelectedPixels(clipboard, layer, offsetX, offsetY) {
  vectorGui.reset()
  //Paste onto a temporary canvas layer that can be moved around/
  //transformed and then draw that canvas onto the main canvas when hitting return or selecting another tool
  //update tempLayer dimensions to match the current layer canvas
  canvas.tempLayer.cvs.width = layer.cvs.width
  canvas.tempLayer.cvs.height = layer.cvs.height
  //insert temp canvas right after the current layer's canvas in the DOM
  let nextSibling = layer.onscreenCvs.nextSibling // Get the next sibling of the current onscreen canvas
  // Check if there is a next sibling; if so, insert before it, otherwise append to canvas layers
  if (nextSibling) {
    dom.canvasLayers.insertBefore(canvas.tempLayer.onscreenCvs, nextSibling)
  } else {
    dom.canvasLayers.appendChild(canvas.tempLayer.onscreenCvs)
  }
  // set onscreen canvas dimensions and scale
  canvas.tempLayer.onscreenCvs.width =
    canvas.tempLayer.onscreenCvs.offsetWidth * canvas.sharpness
  canvas.tempLayer.onscreenCvs.height =
    canvas.tempLayer.onscreenCvs.offsetHeight * canvas.sharpness
  canvas.tempLayer.onscreenCtx.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.tempLayer.x = layer.x
  canvas.tempLayer.y = layer.y
  canvas.tempLayer.opacity = layer.opacity
  //splice the tempLayer just after the layer index
  canvas.layers.splice(canvas.layers.indexOf(layer) + 1, 0, canvas.tempLayer)
  layer.inactiveTools.forEach((tool) => {
    dom[`${tool}Btn`].disabled = false
  })
  //Store current layer in a separate variable to restore it after confirming pasted content
  canvas.pastedLayer = layer
  canvas.currentLayer = canvas.tempLayer
  // canvas.currentLayer.inactiveTools.forEach((tool) => {
  //   dom[`${tool}Btn`].disabled = true
  // })
  canvas.currentLayer.inactiveTools.forEach((tool) => {
    dom[`${tool}Btn`].classList.add("deactivate-paste")
  })

  if (Object.keys(clipboard.vectors).length === 0) {
    // if raster paste, adjust selectProperties and boundaryBox
    state.selectProperties = { ...clipboard.selectProperties }
    state.selectProperties.px1 += offsetX
    state.selectProperties.px2 += offsetX
    state.selectProperties.py1 += offsetY
    state.selectProperties.py2 += offsetY
    state.setBoundaryBox(state.selectProperties)
  }
  renderPaste(clipboard, canvas.tempLayer, offsetX, offsetY)
  //TODO: (Medium Priority) include transform control points for resizing, rotating, etc. (not currently implemented)
  vectorGui.render()
}

/**
 * Confirm pasted pixels
 * Not dependent on pointer events
 * @param {object} clipboard - clipboard object
 * @param {object} layer - layer to paste onto
 */
export function confirmPastedPixels(clipboard, layer) {
  // const { boundaryBox, vectors } = clipboard
  const offsetX = layer.x
  const offsetY = layer.y
  renderPaste(clipboard, layer, offsetX, offsetY)
}

/**
 *
 * @param {object} clipboard - clipboard object
 * @param {object} layer - layer to paste onto
 * @param {number} offsetX - x offset
 * @param {number} offsetY - y offset
 */
function renderPaste(clipboard, layer, offsetX, offsetY) {
  const { boundaryBox, vectors } = clipboard
  if (Object.keys(vectors).length === 0) {
    //render the clipboard canvas onto the temporary layer
    layer.ctx.drawImage(
      clipboard.canvas,
      boundaryBox.xMin + offsetX,
      boundaryBox.yMin + offsetY,
      boundaryBox.xMax - boundaryBox.xMin,
      boundaryBox.yMax - boundaryBox.yMin
    )
  } else {
    //for clipboard.vectors, draw vectors onto the temporary layer
    //render vectors
    for (const [vectorIndex, vector] of Object.entries(vectors)) {
      if (vector.hidden || vector.removed) continue
      switch (vector.vectorProperties.type) {
        case "fill":
          actionFill(
            vector.vectorProperties.px1 + offsetX,
            vector.vectorProperties.py1 + offsetY,
            boundaryBox,
            vector.color,
            layer,
            vector.modes,
            null //maskSet made from action.maskArray
          )
          break
        case "line":
          actionLine(
            vector.vectorProperties.px1 + offsetX,
            vector.vectorProperties.py1 + offsetY,
            vector.vectorProperties.px2 + offsetX,
            vector.vectorProperties.py2 + offsetY,
            boundaryBox,
            vector.color,
            layer,
            vector.modes,
            brushStamps[vector.brushType][vector.brushSize],
            vector.brushSize,
            null //maskSet made from action.maskArray
          )
          break
        case "quadCurve":
          actionQuadraticCurve(
            vector.vectorProperties.px1 + offsetX,
            vector.vectorProperties.py1 + offsetY,
            vector.vectorProperties.px2 + offsetX,
            vector.vectorProperties.py2 + offsetY,
            vector.vectorProperties.px3 + offsetX,
            vector.vectorProperties.py3 + offsetY,
            boundaryBox,
            3,
            vector.color,
            layer,
            vector.modes,
            brushStamps[vector.brushType][vector.brushSize],
            vector.brushSize,
            null //maskSet made from action.maskArray
          )
          break
        case "cubicCurve":
          actionCubicCurve(
            vector.vectorProperties.px1 + offsetX,
            vector.vectorProperties.py1 + offsetY,
            vector.vectorProperties.px2 + offsetX,
            vector.vectorProperties.py2 + offsetY,
            vector.vectorProperties.px3 + offsetX,
            vector.vectorProperties.py3 + offsetY,
            vector.vectorProperties.px4 + offsetX,
            vector.vectorProperties.py4 + offsetY,
            boundaryBox,
            4,
            vector.color,
            layer,
            vector.modes,
            brushStamps[vector.brushType][vector.brushSize],
            vector.brushSize,
            null //maskSet made from action.maskArray
          )
          break
        case "ellipse":
          actionEllipse(
            vector.vectorProperties.px1 + offsetX,
            vector.vectorProperties.py1 + offsetY,
            vector.vectorProperties.px2 + offsetX,
            vector.vectorProperties.py2 + offsetY,
            vector.vectorProperties.px3 + offsetX,
            vector.vectorProperties.py3 + offsetY,
            vector.vectorProperties.radA,
            vector.vectorProperties.radB,
            vector.vectorProperties.forceCircle,
            boundaryBox,
            vector.color,
            layer,
            vector.modes,
            brushStamps[vector.brushType][vector.brushSize],
            vector.brushSize,
            vector.vectorProperties.angle,
            vector.vectorProperties.unifiedOffset,
            vector.vectorProperties.x1Offset,
            vector.vectorProperties.y1Offset,
            null //maskSet made from action.maskArray
          )
          break
        default:
        //do nothing
      }
    }
  }
}
