import { dom } from "../Context/dom.js"
import { canvas } from "../Context/canvas.js"
import {
  createHideElement,
  createSettingsElement,
} from "../utils/actionInterfaceHelpers.js"

/**
 * Update layers after redo
 * Helper for redrawTimelineActions
 */
function selectValidLayer() {
  canvas.currentLayer.inactiveTools.forEach((tool) => {
    dom[`${tool}Btn`].disabled = false
  })
  canvas.currentLayer = canvas.layers.find(
    (layer) => layer.type === "raster" && layer.removed === false
  )
  canvas.currentLayer.inactiveTools.forEach((tool) => {
    dom[`${tool}Btn`].disabled = true
  })
}

/**
 * Render layers interface in DOM
 */
export const renderLayersToDOM = () => {
  dom.layersContainer.innerHTML = ""
  let id = 0
  canvas.activeLayerCount = 0

  if (canvas.currentLayer?.removed) {
    selectValidLayer()
  }

  canvas.layers.forEach((l) => {
    if (!l.removed && !l.isPreview) {
      if (l.type === "raster") {
        canvas.activeLayerCount++
      }

      const layerElement = document.createElement("div")
      layerElement.className = `layer ${l.type}` //draggable v-drag
      layerElement.id = id
      id += 1
      layerElement.textContent = l.title
      layerElement.draggable = true
      if (
        l === canvas.currentLayer ||
        (l === canvas.pastedLayer && canvas.currentLayer.isPreview) //case for active pasted content which exists on preview layer
      ) {
        layerElement.classList.add("selected")
      }

      const hide = createHideElement(l.hidden, "Hide/Show Layer")
      layerElement.appendChild(hide)
      const settings = createSettingsElement("Adjust Layer Settings")
      layerElement.appendChild(settings)
      dom.layersContainer.appendChild(layerElement)
      //associate object
      layerElement.layerObj = l
    }
  })

  //active paste happening, disable layer interface. NOTE: Possible room for improvement: allow hide and settings buttons to be interacted with since they are not tied to the undoStack
  if (canvas.pastedLayer) {
    dom.layersInterfaceContainer.classList.add("disabled")
  } else {
    dom.layersInterfaceContainer.classList.remove("disabled")
    if (
      canvas.activeLayerCount <= 1 &&
      canvas.currentLayer?.type !== "reference"
    ) {
      dom.deleteLayerBtn.disabled = true
    } else {
      dom.deleteLayerBtn.disabled = false
    }
  }
}

/**
 * Render layer settings interface in DOM
 * @param {object} domLayer - The layer to render settings for
 */
export function renderLayerSettingsToDOM(domLayer) {
  /**
   * Helper function to create and configure an element
   * @param {string} type - The type of element to create
   * @param {object} options - The options to configure the element with
   * @returns {HTMLElement} - The created element
   */
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

/**
 * Remove temp layer from DOM and restore current layer
 */
export function removeTempLayerFromDOM() {
  //check if canvas.layers contains tempLayer
  if (!canvas.layers.includes(canvas.tempLayer)) {
    return
  }
  //remove the temporary layer
  canvas.layers.splice(canvas.layers.indexOf(canvas.tempLayer), 1)
  dom.canvasLayers.removeChild(canvas.tempLayer.onscreenCvs)
  canvas.tempLayer.inactiveTools.forEach((tool) => {
    dom[`${tool}Btn`].disabled = false
    dom[`${tool}Btn`].classList.remove("deactivate-paste")
  })
  //restore the original layer
  canvas.currentLayer = canvas.pastedLayer
  canvas.pastedLayer = null
  canvas.currentLayer.inactiveTools.forEach((tool) => {
    dom[`${tool}Btn`].disabled = true
  })
}
