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
  const w = xMax - xMin
  const h = yMax - yMin
  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = w
  tempCanvas.height = h
  const tempCTX = tempCanvas.getContext("2d", {
    willReadFrequently: true,
  })
  if (state.selection.maskSet) {
    //Only copy pixels that are in the maskSet — leave the rest transparent
    const srcImageData = canvas.currentLayer.ctx.getImageData(xMin, yMin, w, h)
    const dstImageData = tempCTX.createImageData(w, h)
    const src = srcImageData.data
    const dst = dstImageData.data
    for (const key of state.selection.maskSet) {
      const cx = key & 0xffff
      const cy = (key >> 16) & 0xffff
      const bx = cx - xMin
      const by = cy - yMin
      const idx = (by * w + bx) * 4
      dst[idx] = src[idx]
      dst[idx + 1] = src[idx + 1]
      dst[idx + 2] = src[idx + 2]
      dst[idx + 3] = src[idx + 3]
    }
    tempCTX.putImageData(dstImageData, 0, 0)
  } else {
    tempCTX.drawImage(canvas.currentLayer.cvs, xMin, yMin, w, h, 0, 0, w, h)
  }
  state.clipboard.select.selectProperties = { ...state.selection.properties }
  state.clipboard.select.boundaryBox = {
    ...state.selection.boundaryBox,
  }
  state.clipboard.select.canvas = tempCanvas
  state.clipboard.select.imageData = canvas.currentLayer.ctx.getImageData(
    xMin,
    yMin,
    w,
    h
  )
  state.clipboard.select.vectors = {}
  //Store the layer offset at copy time so paste can correctly position content
  //even if the layer is moved between copy and paste
  state.clipboard.select.layerX = canvas.currentLayer.x
  state.clipboard.select.layerY = canvas.currentLayer.y
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
  if (state.selection.maskSet) {
    //Only clear pixels that are in the maskSet
    const { xMin, yMin, xMax, yMax } = state.selection.boundaryBox
    const w = xMax - xMin
    const h = yMax - yMin
    const imageData = canvas.currentLayer.ctx.getImageData(xMin, yMin, w, h)
    const { data } = imageData
    for (const key of state.selection.maskSet) {
      const bx = (key & 0xffff) - xMin
      const by = ((key >> 16) & 0xffff) - yMin
      const idx = (by * w + bx) * 4
      data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = 0
    }
    canvas.currentLayer.ctx.putImageData(imageData, xMin, yMin)
  } else {
    const { xMin, yMin, xMax, yMax } = state.selection.boundaryBox
    //Clear boundaryBox area
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
    if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = false
  })
  //Store current layer in a separate variable to restore it after confirming pasted content
  canvas.pastedLayer = layer
  canvas.currentLayer = canvas.tempLayer
  canvas.currentLayer.inactiveTools.forEach((tool) => {
    if (dom[`${tool}Btn`]) dom[`${tool}Btn`].classList.add("deactivate-paste")
  })

  // if raster paste, adjust selectProperties and boundaryBox
  state.selection.properties = { ...clipboard.selectProperties }
  state.selection.properties.px1 += offsetX
  state.selection.properties.px2 += offsetX
  state.selection.properties.py1 += offsetY
  state.selection.properties.py2 += offsetY
  state.selection.setBoundaryBox(state.selection.properties)
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
