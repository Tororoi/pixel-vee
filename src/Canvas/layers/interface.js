import { dom } from '../../Context/dom.js'
import { canvas } from '../../Context/canvas.js'
import { state } from '../../Context/state.js'
import { renderCanvas } from '../render/index.js'
import {
  renderLayersToDOM,
  renderLayerSettingsToDOM,
  renderVectorsToDOM,
} from '../../DOM/render.js'
import { vectorGui } from '../../GUI/vector.js'
import { switchTool } from '../../Tools/toolbox.js'

/**
 * Clicking on a layer in the layers interface
 * @param {PointerEvent} e - The pointer event
 */
export function layerInteract(e) {
  if (canvas.pastedLayer) {
    e.preventDefault()
    //if there is a pasted layer, temporary layer is active and layers configuration should not be messed with
    return
  }
  let layer = e.target.closest('.layer').layerObj
  //toggle visibility
  if (e.target.className.includes('eyeopen')) {
    e.target.classList.remove('eyeopen')
    e.target.classList.add('eyeclosed')
    layer.hidden = true
  } else if (e.target.className.includes('eyeclosed')) {
    e.target.classList.remove('eyeclosed')
    e.target.classList.add('eyeopen')
    layer.hidden = false
  } else if (e.target.className.includes('gear')) {
    //open settings dialog
    const domLayer = e.target.closest('.layer')
    //set top offset of layer settings container to match
    if (
      dom.layerSettingsContainer.style.display === 'flex' &&
      // && layer settings layer is the same as the one that was clicked
      dom.layerSettingsContainer.layerObj === layer
    ) {
      dom.layerSettingsContainer.style.display = 'none'
      dom.layerSettingsContainer.layerObj = null
    } else {
      dom.layerSettingsContainer.style.display = 'flex'
      dom.layerSettingsContainer.layerObj = layer
      renderLayerSettingsToDOM(domLayer)
    }
  } else {
    //TODO: (Low Priority) allow selecting multiple layers for moving purposes only
    //select current layer
    if (layer !== canvas.currentLayer) {
      if (canvas.currentLayer.type === 'reference') {
        state.deselect()
      }
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        dom[`${tool}Btn`].disabled = false
      })
      canvas.currentLayer = layer
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        dom[`${tool}Btn`].disabled = true
      })
      vectorGui.reset()
      vectorGui.render()
      if (layer.type === 'reference') {
        switchTool('move')
      }
      renderLayersToDOM()
      renderVectorsToDOM()
    }
  }
  renderCanvas(layer)
}

/**
 * Start dragging a layer in the layers interface
 * @param {DragEvent} e - The drag event
 */
export function dragLayerStart(e) {
  if (canvas.pastedLayer) {
    e.preventDefault()
    //if there is a pasted layer, temporary layer is active and layers configuration should not be messed with
    return
  }
  let layer = e.target.closest('.layer').layerObj
  let index = canvas.layers.indexOf(layer)
  //pass index through event
  e.dataTransfer.setData('text', index)
  e.target.style.boxShadow =
    'inset 2px 0 rgb(131, 131, 131), inset -2px 0 rgb(131, 131, 131), inset 0 -2px rgb(131, 131, 131), inset 0 2px rgb(131, 131, 131)'
}

/**
 * Prevent default behavior for drag over
 * @param {DragEvent} e - The drag event
 */
export function dragLayerOver(e) {
  e.preventDefault()
}

/**
 * Dragging a layer into another layer's space
 * @param {DragEvent} e - The drag event
 */
export function dragLayerEnter(e) {
  if (e.target.className.includes('layer')) {
    e.target.style.boxShadow =
      'inset 2px 0 rgb(255, 255, 255), inset -2px 0 rgb(255, 255, 255), inset 0 -2px rgb(255, 255, 255), inset 0 2px rgb(255, 255, 255)'
  }
}

/**
 * Dragging a layer out of another layer's space
 * @param {DragEvent} e - The drag event
 */
export function dragLayerLeave(e) {
  if (e.target.className.includes('layer')) {
    e.target.style.boxShadow =
      'inset 2px 0 rgb(131, 131, 131), inset -2px 0 rgb(131, 131, 131), inset 0 -2px rgb(131, 131, 131), inset 0 2px rgb(131, 131, 131)'
  }
}

/**
 * Drop a layer into another layer's space and reorder layers to match
 * @param {DragEvent} e - The drag event
 */
export function dropLayer(e) {
  let targetLayer = e.target.closest('.layer').layerObj
  let draggedIndex = parseInt(e.dataTransfer.getData('text'))
  let heldLayer = canvas.layers[draggedIndex]
  //TODO: (Low Priority) should layer order change be added to timeline?
  if (e.target.className.includes('layer') && targetLayer !== heldLayer) {
    for (let i = 0; i < dom.layersContainer.children.length; i += 1) {
      if (dom.layersContainer.children[i] === e.target) {
        let newIndex = canvas.layers.indexOf(
          dom.layersContainer.children[i].layerObj,
        )
        canvas.layers.splice(draggedIndex, 1)
        canvas.layers.splice(newIndex, 0, heldLayer)

        // reorder layer canvases in DOM
        dom.canvasLayers.removeChild(heldLayer.onscreenCvs) // remove the dragged canvas
        if (newIndex >= dom.canvasLayers.children.length) {
          // if newIndex is at or beyond the end, append
          dom.canvasLayers.appendChild(heldLayer.onscreenCvs)
        } else {
          // otherwise, insert before the canvas at the new index
          dom.canvasLayers.insertBefore(
            heldLayer.onscreenCvs,
            dom.canvasLayers.children[newIndex],
          )
        }
      }
    }
    renderLayersToDOM()
  }
}

/**
 * Stop dragging a layer
 * @param {DragEvent} e - The drag event
 */
export function dragLayerEnd(e) {
  renderLayersToDOM()
}
