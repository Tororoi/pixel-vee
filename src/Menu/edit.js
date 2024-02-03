import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { renderLayersToDOM, renderVectorsToDOM } from "../DOM/render.js"
import { addToTimeline } from "../Actions/undoRedo.js"

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
 * @param {Object} clipboard - clipboard object
 * @param {Object} layer - layer object to paste onto
 * TODO: add to timeline
 */
export function pasteSelectedPixels(clipboard, layer) {
  vectorGui.reset()
  //Paste onto a temporary canvas layer that can be moved around/
  //transformed and then draw that canvas onto the main canvas when hitting return or selecting another tool
  //update tempLayer dimensions to match the current layer canvas
  canvas.tempLayer.cvs.width = layer.cvs.width
  canvas.tempLayer.cvs.height = layer.cvs.height
  //add the temp canvas to the dom and set onscreen canvas dimensions and scale
  dom.canvasLayers.appendChild(canvas.tempLayer.onscreenCvs)
  //insert canvas right after the current layer's canvas in the DOM
  // layer.onscreenCvs.after(canvas.tempLayer.onscreenCvs)
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
  canvas.currentLayer.inactiveTools.forEach((tool) => {
    dom[`${tool}Btn`].disabled = true
  })

  const { selectProperties, boundaryBox } = clipboard
  // if xOffset and yOffset present, adjust selectProperties and boundaryBox
  //render the clipboard canvas onto the temporary layer
  state.selectProperties = { ...selectProperties }
  state.setBoundaryBox(state.selectProperties)
  canvas.currentLayer.ctx.drawImage(
    clipboard.canvas,
    boundaryBox.xMin,
    boundaryBox.yMin,
    boundaryBox.xMax - boundaryBox.xMin,
    boundaryBox.yMax - boundaryBox.yMin
  )
  //TODO: need to tell that it's a modified version of the selection, so no dotted line and include transform control points for resizing (not currently implemented)
  vectorGui.render()
}

/**
 * Confirm pasted pixels
 * Not dependent on pointer events
 */
export function confirmPastedPixels(
  clipboardCanvas,
  boundaryBox,
  layer,
  xOffset,
  yOffset
) {
  //draw the current layer onto the pasted layer
  layer.ctx.drawImage(
    clipboardCanvas,
    boundaryBox.xMin + xOffset - layer.x,
    boundaryBox.yMin + yOffset - layer.y,
    boundaryBox.xMax - boundaryBox.xMin,
    boundaryBox.yMax - boundaryBox.yMin
  )
}
