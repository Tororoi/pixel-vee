import { dom } from '../../Context/dom.js'
import { canvas } from '../../Context/canvas.js'
import { renderCanvas } from '../render/index.js'
import { renderLayersToDOM } from '../../DOM/render.js'
import {
  addReferenceLayer,
  addRasterLayer,
  removeLayer,
} from '../../Actions/layer/layerActions.js'
import {
  layerInteract,
  dragLayerStart,
  dragLayerOver,
  dragLayerEnter,
  dragLayerLeave,
  dropLayer,
  dragLayerEnd,
} from './interface.js'

//====================================//
//=== * * * Event Listeners * * * ====//
//====================================//

// * Layers * //
dom.uploadBtn.addEventListener('click', (e) => {
  //reset value so that the same file can be uploaded multiple times
  e.target.value = null
})
dom.uploadBtn.addEventListener('change', addReferenceLayer)
dom.newLayerBtn.addEventListener('click', addRasterLayer)
dom.deleteLayerBtn.addEventListener('click', () => {
  let layer = canvas.currentLayer
  removeLayer(layer)
  renderCanvas(layer)
})

// * Interface * //
//TODO: (Medium Priority) Make similar to functionality of dragging dialog boxes. To make fancier dragging work, must be made compatible with a scrolling container
dom.layersContainer.addEventListener('click', layerInteract)
dom.layersContainer.addEventListener('dragstart', dragLayerStart)
dom.layersContainer.addEventListener('dragover', dragLayerOver)
dom.layersContainer.addEventListener('dragenter', dragLayerEnter)
dom.layersContainer.addEventListener('dragleave', dragLayerLeave)
dom.layersContainer.addEventListener('drop', dropLayer)
dom.layersContainer.addEventListener('dragend', dragLayerEnd)
dom.layerSettingsContainer.addEventListener('input', (e) => {
  const layer = dom.layerSettingsContainer.layerObj
  if (layer) {
    if (e.target.matches('.slider')) {
      layer.opacity = e.target.value / 255
      dom.layerSettingsContainer.querySelector(
        '.layer-opacity-label > .input-label',
      ).textContent = `Opacity: ${Math.round(layer.opacity * 255)}`
      renderCanvas(layer)
    } else if (e.target.matches('#layer-name')) {
      layer.title = e.target.value
      renderLayersToDOM()
    }
  }
})
//TODO: (Low Priority) maybe dynamically generate layer settings container when needed and only bind this event listener when it is open
document.addEventListener('pointerdown', (e) => {
  if (
    dom.layerSettingsContainer.layerObj &&
    !e.target.classList.contains('gear') &&
    !dom.layerSettingsContainer.contains(e.target)
  ) {
    dom.layerSettingsContainer.style.display = 'none'
    dom.layerSettingsContainer.layerObj = null
  }
})
