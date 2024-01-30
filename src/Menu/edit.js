import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
import { createRasterLayer } from "../Canvas/layers.js"

//===================================//
//========= * * * Edit * * * ========//
//===================================//

export function copySelectedPixels() {
  const { xMin, yMin, xMax, yMax } = state.boundaryBox
  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = canvas.currentLayer.cvs.width
  tempCanvas.height = canvas.currentLayer.cvs.height
  const tempCTX = tempCanvas.getContext("2d", { willReadFrequently: true })
  // if (state.selectionInversed) {
  //inverted selection: get dataURL for entire canvas area minus boundaryBox
  //clip boundaryBox
  tempCTX.save()
  tempCTX.beginPath()
  if (state.selectionInversed) {
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
  state.selectClipboard.boundaryBox = {
    xMin: 0,
    yMin: 0,
    xMax: tempCanvas.width,
    yMax: tempCanvas.height,
  }
  // } else {
  //   //non-inverted selection
  //   //get dataURL for clipboard of boundaryBox area
  //   tempCTX.drawImage(
  //     canvas.currentLayer.cvs,
  //     xMin,
  //     yMin,
  //     xMax - xMin,
  //     yMax - yMin
  //     // 0,
  //     // 0,
  //     // tempCanvas.width,
  //     // tempCanvas.height
  //   )
  //   state.selectClipboard.boundaryBox = { ...state.boundaryBox }
  // }
  state.selectClipboard.canvas = tempCanvas
}

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

export function pasteSelectedPixels() {
  //draw clipboard canvas onto layer canvas
  // canvas.currentLayer.ctx.drawImage(
  //   state.selectClipboard.canvas,
  //   // 0,
  //   // 0,
  //   // canvas.currentLayer.cvs.width,
  //   // canvas.currentLayer.cvs.height,
  //   state.selectClipboard.boundaryBox.xMin,
  //   state.selectClipboard.boundaryBox.yMin,
  //   state.selectClipboard.boundaryBox.xMax -
  //     state.selectClipboard.boundaryBox.xMin,
  //   state.selectClipboard.boundaryBox.yMax -
  //     state.selectClipboard.boundaryBox.yMin
  // )
  //Alternative: Instead of pasting directly onto canvas layer,
  //paste onto a temporary canvas layer that can be moved around/
  //transformed and then draw that canvas onto the main canvas when hitting return or selecting another tool
  const tempLayer = createRasterLayer("preview")
  canvas.layers.push(tempLayer)
  // canvas.currentLayer = tempLayer
  tempLayer.ctx.drawImage(
    state.selectClipboard.canvas,
    state.selectClipboard.boundaryBox.xMin,
    state.selectClipboard.boundaryBox.yMin,
    state.selectClipboard.boundaryBox.xMax -
      state.selectClipboard.boundaryBox.xMin,
    state.selectClipboard.boundaryBox.yMax -
      state.selectClipboard.boundaryBox.yMin
  )
  renderCanvas(tempLayer)
}
