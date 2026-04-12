import { bump } from '../hooks/useAppState.js'
import { dom } from '../Context/dom.js'
import { canvas } from '../Context/canvas.js'

/**
 * Render layers interface — React reads canvas.layers directly via useAppState().
 */
export const renderLayersToDOM = () => {
  // Keep activeLayerCount in sync (used by layerActions.js)
  if (canvas.currentLayer?.removed) {
    const validLayer = canvas.layers.find(
      (l) => l.type === 'raster' && !l.removed,
    )
    if (validLayer) canvas.currentLayer = validLayer
  }
  canvas.activeLayerCount = canvas.layers.filter(
    (l) => !l.removed && !l.isPreview && l.type === 'raster',
  ).length
  bump()
}

/**
 * Open layer settings popout — React component handles via state.
 */
export function renderLayerSettingsToDOM() {
  bump()
}

/**
 * Remove temp layer from DOM and restore current layer
 */
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
