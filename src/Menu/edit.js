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
} from "../Actions/pointerActions.js"

//===================================//
//========= * * * Edit * * * ========//
//===================================//

/**
 * Copy selected pixels
 * Not dependent on pointer events
 * TODO: (High Priority) Allow copying vectors if selected. Conditions are must be on vector tool and state.vectorProperties must be populated.
 */
export function copySelectedPixels() {
  const { xMin, yMin, xMax, yMax } = state.boundaryBox
  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = canvas.currentLayer.cvs.width
  tempCanvas.height = canvas.currentLayer.cvs.height
  const tempCTX = tempCanvas.getContext("2d", { willReadFrequently: true })
  //clip boundaryBox
  tempCTX.save()
  tempCTX.beginPath()
  if (state.selectionInversed) {
    //get data for entire canvas area minus boundaryBox
    tempCTX.rect(0, 0, tempCanvas.width, tempCanvas.height)
  }
  tempCTX.rect(xMin, yMin, xMax - xMin, yMax - yMin)
  tempCTX.clip("evenodd")
  tempCTX.drawImage(
    canvas.currentLayer.cvs,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height
  )
  tempCTX.restore()
  state.selectClipboard.selectProperties = { ...state.selectProperties }
  state.selectClipboard.boundaryBox = {
    xMin: 0,
    yMin: 0,
    xMax: tempCanvas.width,
    yMax: tempCanvas.height,
  }
  state.selectClipboard.canvas = tempCanvas
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
 */
export function cutSelectedPixels() {
  copySelectedPixels()
  const { xMin, yMin, xMax, yMax } = state.boundaryBox
  if (state.selectionInversed) {
    //inverted selection: clear entire canvas area minus boundaryBox
    //create a clip mask for the boundaryBox to prevent clearing the inner area
    canvas.currentLayer.ctx.save()
    canvas.currentLayer.ctx.beginPath()
    //define rectangle for canvas area
    canvas.currentLayer.ctx.rect(
      0,
      0,
      canvas.currentLayer.cvs.width,
      canvas.currentLayer.cvs.height
    )
    canvas.currentLayer.ctx.rect(xMin, yMin, xMax - xMin, yMax - yMin)
    canvas.currentLayer.ctx.clip("evenodd")
    canvas.currentLayer.ctx.clearRect(
      0,
      0,
      canvas.currentLayer.cvs.width,
      canvas.currentLayer.cvs.height
    )
    canvas.currentLayer.ctx.restore()
  } else {
    //non-inverted selection: clear boundaryBox area
    canvas.currentLayer.ctx.clearRect(xMin, yMin, xMax - xMin, yMax - yMin)
  }
}

/**
 * Paste selected pixels
 * Not dependent on pointer events
 * @param {object} clipboard - clipboard object
 * @param {object} layer - layer object to paste onto
 * @param {number} offsetX - x offset
 * @param {number} offsetY - y offset
 * TODO: (Highest Priority) Make sure selection inversed status is handled correctly, without relying on state (new param required)
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
            false,
            vector.color,
            layer,
            vector.modes,
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
            false,
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
            false,
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
            false,
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
