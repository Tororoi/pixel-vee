import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { createRasterLayer } from "../Canvas/layers.js"
import { handleTools } from "../Tools/events.js"
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
  state.selectClipboard.pastedBoundaryBox = { ...state.boundaryBox }
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
 * TODO: add to timeline
 */
export function pasteSelectedPixels() {
  //Paste onto a temporary canvas layer that can be moved around/
  //transformed and then draw that canvas onto the main canvas when hitting return or selecting another tool
  const tempLayer = createRasterLayer("preview")
  canvas.layers.push(tempLayer)
  canvas.currentLayer.inactiveTools.forEach((tool) => {
    dom[`${tool}Btn`].disabled = false
  })
  //Store current layer in a separate variable to restore it after confirming pasted content
  canvas.pastedLayer = canvas.currentLayer
  canvas.currentLayer = tempLayer
  canvas.currentLayer.inactiveTools.forEach((tool) => {
    dom[`${tool}Btn`].disabled = true
  })
  vectorGui.reset()
  state.deselect()
  //render the clipboard canvas onto the temporary layer
  state.selectProperties = {
    px1: state.selectClipboard.pastedBoundaryBox.xMin,
    py1: state.selectClipboard.pastedBoundaryBox.yMin,
    px2: state.selectClipboard.pastedBoundaryBox.xMax,
    py2: state.selectClipboard.pastedBoundaryBox.yMax,
  }
  state.setBoundaryBox(state.selectProperties)
  //TODO: need to tell that it's a modified version of the selection, so no dotted line and include transform control points for resizing (not currently implemented)
  vectorGui.render()
  handleTools(null, "move")
  canvas.currentLayer.ctx.drawImage(
    state.selectClipboard.canvas,
    state.selectClipboard.boundaryBox.xMin,
    state.selectClipboard.boundaryBox.yMin,
    state.selectClipboard.boundaryBox.xMax -
      state.selectClipboard.boundaryBox.xMin,
    state.selectClipboard.boundaryBox.yMax -
      state.selectClipboard.boundaryBox.yMin
  )
  //add to timeline
  // addToTimeline({
  //   tool: tools.paste,
  //   layer: canvas.pastedLayer,
  //   properties: {
  //     selectClipboard: { ...state.selectClipboard },
  //   },
  // })

  renderCanvas(canvas.currentLayer)
  renderLayersToDOM()
  renderVectorsToDOM()
}

/**
 * Confirm pasted pixels
 * Not dependent on pointer events
 */
// export function confirmPastedPixels() {
//   //restore the original layer
//   canvas.layers.splice(canvas.layers.indexOf(canvas.currentLayer), 1)
//   canvas.currentLayer = canvas.pastedLayer
//   canvas.pastedLayer = null
//   canvas.currentLayer.inactiveTools.forEach((tool) => {
//     dom[`${tool}Btn`].disabled = false
//   })
//   renderCanvas(canvas.currentLayer)
//   renderLayersToDOM()
//   renderVectorsToDOM()
//   state.deselect()
//   vectorGui.render()
// }
