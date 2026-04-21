import { dom } from '../Context/dom.js'
import { canvas } from '../Context/canvas.js'
import { renderCanvas } from '../Canvas/render.js'
import { constrainElementOffsets } from '../utils/constrainElementOffsets.js'
import { addRasterLayer } from '../Actions/layer/layerActions.js'
import { createPreviewLayer } from './layers.js'


/**
 * Resize the onscreen canvas when adjusting the window size
 * UIEvent listener
 */
const resizeOnScreenCanvas = () => {
  //Keep canvas dimensions at 100% (requires css style width/ height 100%)
  canvas.vectorGuiCVS.width = canvas.vectorGuiCVS.offsetWidth * canvas.sharpness
  canvas.vectorGuiCVS.height =
    canvas.vectorGuiCVS.offsetHeight * canvas.sharpness
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.selectionGuiCVS.width =
    canvas.selectionGuiCVS.offsetWidth * canvas.sharpness
  canvas.selectionGuiCVS.height =
    canvas.selectionGuiCVS.offsetHeight * canvas.sharpness
  canvas.selectionGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.resizeOverlayCVS.width =
    canvas.resizeOverlayCVS.offsetWidth * canvas.sharpness
  canvas.resizeOverlayCVS.height =
    canvas.resizeOverlayCVS.offsetHeight * canvas.sharpness
  canvas.resizeOverlayCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.cursorCVS.width = canvas.cursorCVS.offsetWidth * canvas.sharpness
  canvas.cursorCVS.height = canvas.cursorCVS.offsetHeight * canvas.sharpness
  canvas.cursorCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.layers.forEach((layer) => {
    layer.onscreenCvs.width = layer.onscreenCvs.offsetWidth * canvas.sharpness
    layer.onscreenCvs.height = layer.onscreenCvs.offsetHeight * canvas.sharpness
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0,
    )
  })
  canvas.backgroundCVS.width =
    canvas.backgroundCVS.offsetWidth * canvas.sharpness
  canvas.backgroundCVS.height =
    canvas.backgroundCVS.offsetHeight * canvas.sharpness
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  renderCanvas() // render all layers
  // reset positioning styles for free moving dialog boxes
  if (dom.toolboxContainer) {
    dom.toolboxContainer.style.left = ''
    dom.toolboxContainer.style.top = ''
  }
  if (dom.sidebarContainer) {
    dom.sidebarContainer.style.left = ''
    dom.sidebarContainer.style.top = ''
  }
  if (dom.colorPickerContainer && dom.colorPickerContainer.offsetHeight !== 0) {
    constrainElementOffsets(dom.colorPickerContainer)
  }
}

//===================================//
//=== * * * Initialization * * * ====//
//===================================//

//Initialize first layer
addRasterLayer()
canvas.currentLayer = canvas.layers[0]
//Initialize offset, must be integer
canvas.xOffset = Math.round(
  (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
    canvas.offScreenCVS.width) /
    2,
)
canvas.yOffset = Math.round(
  (canvas.currentLayer.onscreenCvs.height / canvas.sharpness / canvas.zoom -
    canvas.offScreenCVS.height) /
    2,
)
canvas.previousXOffset = canvas.xOffset
canvas.previousYOffset = canvas.yOffset
renderCanvas(canvas.currentLayer)
// React components read canvas.layers / swatches directly via useAppState()

//Initialize temp layer, not added to layers array
canvas.tempLayer = createPreviewLayer()

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

// UI Canvas * //
window.addEventListener('resize', resizeOnScreenCanvas)
