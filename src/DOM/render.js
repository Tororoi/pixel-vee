import { dom } from '../Context/dom.js'
import { canvas } from '../Context/canvas.js'

export const renderLayersToDOM = () => {
  if (canvas.currentLayer?.removed) {
    const validLayer = canvas.layers.find(
      (l) => l.type === 'raster' && !l.removed,
    )
    if (validLayer) canvas.currentLayer = validLayer
  }
  canvas.activeLayerCount = canvas.layers.filter(
    (l) => !l.removed && !l.isPreview && l.type === 'raster',
  ).length
}

export function removeTempLayerFromDOM() {
  if (!canvas.layers.includes(canvas.tempLayer)) {
    return
  }
  canvas.layers.splice(canvas.layers.indexOf(canvas.tempLayer), 1)
  dom.canvasLayers.removeChild(canvas.tempLayer.onscreenCvs)
  canvas.tempLayer.inactiveTools.forEach((tool) => {
    if (dom[`${tool}Btn`]) {
      dom[`${tool}Btn`].disabled = false
      dom[`${tool}Btn`].classList.remove('deactivate-paste')
    }
  })
  canvas.currentLayer = canvas.pastedLayer
  canvas.pastedLayer = null
  canvas.currentLayer.inactiveTools.forEach((tool) => {
    if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
  })
}

export {
  renderVectorsToDOM,
  renderVectorSettingsToDOM,
  initVectorDitherPicker,
  updateVectorDitherPickerColors,
  updateVectorDitherControls,
  highlightVectorDitherPattern,
  updateVectorDitherPreview,
} from './renderVectors.js'
export {
  renderBrushStampToDOM,
  renderBrushModesToDOM,
  renderToolOptionsToDOM,
  updateDitherPickerColors,
  createDitherPatternSVG,
  applyDitherOffset,
  applyDitherOffsetControl,
} from './renderBrush.js'
