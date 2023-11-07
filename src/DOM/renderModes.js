import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { swatches } from "../Context/swatch.js"

/**
 * Render palette interface in DOM
 */
export const renderBrushModesToDOM = () => {
  dom.modesContainer.innerHTML = ""

  //iterate through object keys in state.tool.options
  for (const [key, value] of Object.entries(state.tool.modes)) {
    const mode = document.createElement("button")
    mode.type = "button"
    mode.className = `mode ${key}`
    mode.id = key
    switch (key) {
      case "eraser":
        mode.dataset.tooltip = "Eraser (E)"
        break
      case "perfect":
        mode.dataset.tooltip = "Pixel Perfect (P)"
        break
      case "inject":
        mode.dataset.tooltip =
          "Inject (I) \n\nTranslucent colors will be applied directly"
        // if (state.tool.modes.eraser) {
        //   mode.disabled = true
        // }
        break
      case "colorMask":
        mode.dataset.tooltip =
          "Color Mask (M) \n\nOnly draw over selected secondary swatch color"
        break
      default:
      //
    }
    // mode.innerHTML = key
    if (value) mode.classList.add("selected")
    dom.modesContainer.appendChild(mode)
  }
}