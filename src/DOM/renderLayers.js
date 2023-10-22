import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"

export const renderLayersToDOM = () => {
  dom.layersContainer.innerHTML = ""
  let id = 0
  canvas.activeLayerCount = 0
  canvas.layers.forEach((l) => {
    if (!l.removed) {
      canvas.activeLayerCount++
      let layerElement = document.createElement("div")
      layerElement.className = `layer ${l.type}`
      layerElement.id = id
      id += 1
      layerElement.textContent = l.title
      layerElement.draggable = true
      if (l === canvas.currentLayer) {
        layerElement.classList.add("selected")
      }
      let hide = document.createElement("div")
      hide.className = "hide"
      if (l.opacity === 0) {
        hide.classList.add("eyeclosed")
      } else {
        hide.classList.add("eyeopen")
      }
      layerElement.appendChild(hide)
      let trash = document.createElement("div") //TODO: make clickable and sets vector action as hidden
      trash.className = "trash"
      let trashIcon = document.createElement("div")
      trashIcon.className = "icon"
      trash.appendChild(trashIcon)
      layerElement.appendChild(trash)
      dom.layersContainer.appendChild(layerElement)
      //associate object
      layerElement.layerObj = l
    }
  })
}
