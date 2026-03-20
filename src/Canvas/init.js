import { canvas } from '../Context/canvas.js'
import { renderCanvas } from './render/index.js'
import {
  renderLayersToDOM,
  renderPaletteToDOM,
  renderPalettePresetsToDOM,
} from '../DOM/render.js'
import { addRasterLayer } from '../Actions/layer/layerActions.js'
import { createPreviewLayer } from './layers/index.js'

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
renderLayersToDOM()
renderPaletteToDOM()
renderPalettePresetsToDOM()
// renderBrushModesToDOM()

//Initialize temp layer, not added to layers array
canvas.tempLayer = createPreviewLayer()
