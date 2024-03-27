import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { brushStamps } from "../Context/brushStamps.js"
import { updateBrushPreview } from "../utils/brushHelpers.js"
import { createOptionToggle } from "../utils/optionsInterfaceHelpers.js"

/**
 * update brush stamp in dom
 */
export function renderBrushStampToDOM() {
  dom.lineWeight.textContent = state.tool.brushSize
  dom.brushPreview.style.width = state.tool.brushSize * 2 + "px"
  dom.brushPreview.style.height = state.tool.brushSize * 2 + "px"
  updateBrushPreview(
    brushStamps[state.tool.brushType][state.tool.brushSize]["0,0"],
    state.tool.brushSize
  )
}

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
        //add aria label
        mode.ariaLabel = "Eraser (E)"
        mode.dataset.tooltip = "Eraser (E)"
        break
      case "perfect":
        mode.ariaLabel = "Pixel Perfect (P)"
        mode.dataset.tooltip = "Pixel Perfect (P)"
        break
      case "inject":
        mode.ariaLabel = "Inject (I)"
        mode.dataset.tooltip =
          "Inject (I) \n\nTranslucent colors will be applied directly"
        break
      case "colorMask":
        mode.ariaLabel = "Color Mask (M)"
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

/**
 *
 */
export function renderToolOptionsToDOM() {
  dom.toolOptions.innerHTML = ""
  if (
    ["line", "quadCurve", "cubicCurve", "ellipse", "select"].includes(
      state.tool.name
    )
  ) {
    //render cubic curve options to menu
    Object.entries(state.tool.options).forEach(([name, option]) => {
      let optionToggle = createOptionToggle(name, option)
      dom.toolOptions.appendChild(optionToggle)
    })
  }
}
