import { dom } from "../Context/dom.js"
import { canvas } from "../Context/canvas.js"
import {
  createHideElement,
  createTrashElement,
  createSettingsElement,
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
      if (l.type === "raster") {
        canvas.activeLayerCount++
      }

      const layerElement = document.createElement("div")
      layerElement.className = `layer ${l.type}` //draggable v-drag
      layerElement.id = id
      id += 1
      layerElement.textContent = l.title
      layerElement.draggable = true
      if (l === canvas.currentLayer) {
        layerElement.classList.add("selected")
      }

      const hide = createHideElement(l.hidden)
      layerElement.appendChild(hide)
      // const trash = createTrashElement()
      // layerElement.appendChild(trash)
      const settings = createSettingsElement()
      layerElement.appendChild(settings)
      dom.layersContainer.appendChild(layerElement)
      //associate object
      layerElement.layerObj = l
    }
  })

  if (canvas.activeLayerCount <= 1) {
    dom.deleteLayerBtn.disabled = true
  } else {
    dom.deleteLayerBtn.disabled = false
  }
}

export function renderLayerSettingsToDOM(domLayer) {
  // Helper function to create and configure an element
  function createElement(type, options = {}) {
    const element = document.createElement(type)
    Object.entries(options).forEach(([key, value]) => {
      if (key === "textContent") {
        element.textContent = value
      } else {
        element.setAttribute(key, value)
      }
    })
    return element
  }
  const layer = domLayer.layerObj

  // Clear existing settings
  dom.layerSettingsContainer.innerHTML = ""

  // Create layer settings header
  const layerSettingsHeader = createElement("div", {
    class: "header",
    textContent: "Layer Settings",
  })

  // Create layer name input
  const layerNameInput = createElement("label", {
    class: "layer-name-label",
    for: "layer-name",
  })
  layerNameInput.appendChild(
    createElement("span", { class: "input-label", textContent: "Name:" })
  )
  layerNameInput.appendChild(
    createElement("input", {
      type: "text",
      id: "layer-name",
      name: "layer-name",
      placeholder: layer.title,
      maxLength: 12,
    })
  )

  // Create layer opacity input
  const layerOpacityInput = createElement("label", {
    class: "layer-opacity-label",
    for: "layer-opacity",
  })
  layerOpacityInput.appendChild(
    createElement("div", {
      class: "input-label",
      textContent: `Opacity: ${Math.round(layer.opacity * 255)}`,
    })
  )
  layerOpacityInput.appendChild(
    createElement("input", {
      type: "range",
      min: "0",
      max: "255",
      value: Math.round(layer.opacity * 255),
      class: "slider",
      id: "layer-opacity",
      name: "layer-opacity",
      dataTooltip: "Adjust layer opacity",
    })
  )

  // Append all elements to the layer settings container
  dom.layerSettingsContainer.appendChild(layerSettingsHeader)
  dom.layerSettingsContainer.appendChild(layerNameInput)
  dom.layerSettingsContainer.appendChild(layerOpacityInput)

  // Position layer settings container
  const domLayerRect = domLayer.getBoundingClientRect()
  dom.layerSettingsContainer.style.top = `${
    domLayerRect.top -
    dom.layerSettingsContainer.offsetHeight / 2 +
    domLayer.offsetHeight / 2
  }px`
  dom.layerSettingsContainer.style.left = `${domLayerRect.right + 12}px`
}
