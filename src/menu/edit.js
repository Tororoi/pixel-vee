import { dom } from '../context/dom.js'
import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
import { vectorGui } from '../gui/vector.js'
import { recomputeMaskBlockedSet } from '../canvas/layers.js'

/**
 * Returns the canvas + context that copy/cut/paste should operate on
 * for the given layer. When the user is editing the layer's mask and
 * the mask is enabled, those operations target the mask canvas
 * instead of the layer canvas so a selection lifted in mask-edit
 * mode picks up the mask marks (not the layer pixels) — matching
 * the brush's mask-edit routing.
 * @param {object} layer - The layer being read from / written to.
 * @returns {{cvs: HTMLCanvasElement, ctx: CanvasRenderingContext2D,
 *   isMask: boolean}} The canvas + context to use, plus a flag
 *   indicating which surface was chosen.
 */
export function getMaskEditTarget(layer) {
  if (
    layer &&
    globalState.maskEdit.active &&
    globalState.maskEdit.layerId === layer.id &&
    layer.mask?.enabled
  ) {
    return { cvs: layer.mask.cvs, ctx: layer.mask.ctx, isMask: true }
  }
  return { cvs: layer?.cvs, ctx: layer?.ctx, isMask: false }
}

//===================================//
//========= * * * Edit * * * ========//
//===================================//

/**
 * Copy selected pixels
 * Not dependent on pointer events
 */
export function copySelectedPixels() {
  const { xMin, yMin, xMax, yMax } = globalState.selection.boundaryBox
  const w = xMax - xMin
  const h = yMax - yMin
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w
  tempCanvas.height = h
  const tempCTX = tempCanvas.getContext('2d', {
    willReadFrequently: true,
  })
  // In mask-edit mode the selection lifts pixels from the mask
  // canvas rather than the layer canvas, matching the brush's
  // mask-edit routing.
  const source = getMaskEditTarget(canvas.currentLayer)
  if (globalState.selection.maskSet) {
    //Only copy pixels that are in the maskSet — leave the rest transparent
    const srcImageData = source.ctx.getImageData(xMin, yMin, w, h)
    const dstImageData = tempCTX.createImageData(w, h)
    const src = srcImageData.data
    const dst = dstImageData.data
    for (const key of globalState.selection.maskSet) {
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
    tempCTX.drawImage(source.cvs, xMin, yMin, w, h, 0, 0, w, h)
  }
  globalState.clipboard.select.selectProperties = {
    ...globalState.selection.properties,
  }
  globalState.clipboard.select.boundaryBox = {
    ...globalState.selection.boundaryBox,
  }
  globalState.clipboard.select.canvas = tempCanvas
  globalState.clipboard.select.imageData = source.ctx.getImageData(
    xMin,
    yMin,
    w,
    h,
  )
  globalState.clipboard.select.vectors = {}
  //Store the layer offset at copy time so paste can correctly position content
  //even if the layer is moved between copy and paste
  globalState.clipboard.select.layerX = canvas.currentLayer.x
  globalState.clipboard.select.layerY = canvas.currentLayer.y
  // Remember whether the clipboard content came from a mask so paste
  // can default to the same target when committing.
  globalState.clipboard.select.sourceWasMask = source.isMask
}

/**
 * Copy selected vectors
 */
export function copySelectedVectors() {
  let selectedVectors = {}
  globalState.vector.selectedIndices.forEach((vectorIndex) => {
    let vector = globalState.vector.all[vectorIndex]
    selectedVectors[vectorIndex] = {
      ...vector,
    }
  })
  if (globalState.vector.selectedIndices.size === 0) {
    let currentVector = globalState.vector.all[globalState.vector.currentIndex]
    selectedVectors[globalState.vector.currentIndex] = {
      ...currentVector,
    }
  }
  globalState.clipboard.select.selectProperties = {
    ...globalState.selection.properties,
  }
  globalState.clipboard.select.boundaryBox = {
    xMin: null,
    yMin: null,
    xMax: null,
    yMax: null,
  }
  globalState.clipboard.select.canvas = null
  globalState.clipboard.select.vectors = selectedVectors
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
  // Cut targets the mask canvas in mask-edit mode (matching copy).
  const target = getMaskEditTarget(canvas.currentLayer)
  if (globalState.selection.maskSet) {
    //Only clear pixels that are in the maskSet
    const { xMin, yMin, xMax, yMax } = globalState.selection.boundaryBox
    const w = xMax - xMin
    const h = yMax - yMin
    const imageData = target.ctx.getImageData(xMin, yMin, w, h)
    const { data } = imageData
    for (const key of globalState.selection.maskSet) {
      const bx = (key & 0xffff) - xMin
      const by = ((key >> 16) & 0xffff) - yMin
      const idx = (by * w + bx) * 4
      data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = 0
    }
    target.ctx.putImageData(imageData, xMin, yMin)
  } else {
    const { xMin, yMin, xMax, yMax } = globalState.selection.boundaryBox
    //Clear boundaryBox area
    target.ctx.clearRect(xMin, yMin, xMax - xMin, yMax - yMin)
  }
  // When the cut hit the mask, refresh blockedSet so the draw gate
  // sees the new state on the next stroke.
  if (target.isMask) recomputeMaskBlockedSet(canvas.currentLayer)
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
  // Use the layer's actual parent so this works in both normal mode (dom.canvasLayers)
  // and navigator mode (the nav overlay), where layer.onscreenCvs is not a child of
  // dom.canvasLayers and any naive dom.canvasLayers.insertBefore call would throw.
  const layerParent = layer.onscreenCvs.parentElement || dom.canvasLayers
  const nextSibling = layer.onscreenCvs.nextSibling
  if (nextSibling) {
    layerParent.insertBefore(canvas.tempLayer.onscreenCvs, nextSibling)
  } else {
    layerParent.appendChild(canvas.tempLayer.onscreenCvs)
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
    0,
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
    if (dom[`${tool}Btn`]) dom[`${tool}Btn`].classList.add('deactivate-paste')
  })

  // if raster paste, adjust selectProperties and boundaryBox
  globalState.selection.properties = { ...clipboard.selectProperties }
  globalState.selection.properties.px1 += offsetX
  globalState.selection.properties.px2 += offsetX
  globalState.selection.properties.py1 += offsetY
  globalState.selection.properties.py2 += offsetY
  globalState.selection.setBoundaryBox(globalState.selection.properties)
  // The live floating paste always renders onto the tempLayer
  // canvas; the mask-edit redirect only applies at confirm time.
  renderPaste(clipboard, canvas.tempLayer.ctx, offsetX, offsetY)
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
  // Confirm targets the mask canvas in mask-edit mode so a paste
  // started while editing the mask commits onto the mask. The
  // tempLayer used for floating positioning is unchanged.
  const target = getMaskEditTarget(layer)
  renderPaste(clipboard, target.ctx, offsetX, offsetY)
  if (target.isMask) recomputeMaskBlockedSet(layer)
}

/**
 * Draw the clipboard canvas onto the given context at the paste
 * offset. Used both for the live tempLayer preview during a paste
 * and for committing the pasted pixels onto the destination
 * (layer.ctx or mask.ctx).
 * @param {object} clipboard - clipboard object
 * @param {CanvasRenderingContext2D} ctx - destination context
 * @param {number} offsetX - x offset
 * @param {number} offsetY - y offset
 */
function renderPaste(clipboard, ctx, offsetX, offsetY) {
  const { boundaryBox } = clipboard
  ctx.drawImage(
    clipboard.canvas,
    boundaryBox.xMin + offsetX,
    boundaryBox.yMin + offsetY,
    boundaryBox.xMax - boundaryBox.xMin,
    boundaryBox.yMax - boundaryBox.yMin,
  )
}
