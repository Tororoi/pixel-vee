import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { enableActionsForClipboard } from "../DOM/disableDomElements.js"

//===================================//
//========= * * * Edit * * * ========//
//===================================//

/**
 * Copy selected pixels
 * Not dependent on pointer events
 */
export function copySelectedPixels() {
  const { xMin, yMin, xMax, yMax } = state.selection.boundaryBox
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
  state.clipboard.select.selectProperties = { ...state.selection.properties }
  state.clipboard.select.boundaryBox = {
    ...state.selection.boundaryBox,
  }
  state.clipboard.select.canvas = tempCanvas
  state.clipboard.select.imageData = canvas.currentLayer.ctx.getImageData(
    xMin,
    yMin,
    xMax - xMin,
    yMax - yMin
  )
  state.clipboard.select.vectors = {}
  enableActionsForClipboard()
}

/**
 * Copy selected vectors
 */
export function copySelectedVectors() {
  let selectedVectors = {}
  state.vector.selectedIndices.forEach((vectorIndex) => {
    let vector = state.vector.all[vectorIndex]
    selectedVectors[vectorIndex] = {
      ...vector,
    }
  })
  if (state.vector.selectedIndices.size === 0) {
    let currentVector = state.vector.all[state.vector.currentIndex]
    selectedVectors[state.vector.currentIndex] = {
      ...currentVector,
    }
  }
  state.clipboard.select.selectProperties = { ...state.selection.properties }
  state.clipboard.select.boundaryBox = {
    xMin: null,
    yMin: null,
    xMax: null,
    yMax: null,
  }
  state.clipboard.select.canvas = null
  state.clipboard.select.vectors = selectedVectors
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
  const { xMin, yMin, xMax, yMax } = state.selection.boundaryBox
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

  // if raster paste, adjust selectProperties and boundaryBox
  state.selection.properties = { ...clipboard.selectProperties }
  state.selection.properties.px1 += offsetX
  state.selection.properties.px2 += offsetX
  state.selection.properties.py1 += offsetY
  state.selection.properties.py2 += offsetY
  state.setBoundaryBox(state.selection.properties)
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
  const { boundaryBox } = clipboard
  //render the clipboard canvas onto the temporary layer
  layer.ctx.drawImage(
    clipboard.canvas,
    boundaryBox.xMin + offsetX,
    boundaryBox.yMin + offsetY,
    boundaryBox.xMax - boundaryBox.xMin,
    boundaryBox.yMax - boundaryBox.yMin
  )
}
