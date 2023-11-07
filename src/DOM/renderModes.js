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
    const mode = document.createElement("div")
    mode.className = `mode ${key}`
    mode.id = key
    // mode.innerHTML = key
    if (value) mode.classList.add("selected")
    dom.modesContainer.appendChild(mode)
  }
}
