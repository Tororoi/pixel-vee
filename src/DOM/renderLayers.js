import { dom } from "../Context/dom.js"
import { canvas } from "../Context/canvas.js"
import {
  createHideElement,
  createTrashElement,
} from "../utils/actionInterfaceHelpers.js"

/**
 * Render layers interface in DOM
 */
export const renderLayersToDOM = () => {
  dom.layersContainer.innerHTML = ""
  let id = 0
  canvas.activeLayerCount = 0

  canvas.layers.forEach((l) => {
    if (!l.removed) {
      canvas.activeLayerCount++

      const layerElement = document.createElement("div")
      layerElement.className = `layer ${l.type}`
      layerElement.id = id
      id += 1
      layerElement.textContent = l.title
      layerElement.draggable = true
      if (l === canvas.currentLayer) {
        layerElement.classList.add("selected")
      }

      const hide = createHideElement(l.hidden)
      layerElement.appendChild(hide)
      const trash = createTrashElement()
      layerElement.appendChild(trash)
      dom.layersContainer.appendChild(layerElement)
      //associate object
      layerElement.layerObj = l
    }
  })
}
