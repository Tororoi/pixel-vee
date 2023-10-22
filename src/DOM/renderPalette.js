import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"

export const renderPaletteToolsToDOM = () => {
  if (swatches.paletteMode === "edit") {
    dom.paletteEditBtn.classList.add("selected")
    dom.paletteColors.classList.add("edit-mode")
    dom.paletteRemoveBtn.classList.remove("selected")
    dom.paletteColors.classList.remove("remove-mode")
  } else if (swatches.paletteMode === "remove") {
    dom.paletteEditBtn.classList.remove("selected")
    dom.paletteColors.classList.remove("edit-mode")
    dom.paletteRemoveBtn.classList.add("selected")
    dom.paletteColors.classList.add("remove-mode")
  } else {
    dom.paletteEditBtn.classList.remove("selected")
    dom.paletteColors.classList.remove("edit-mode")
    dom.paletteRemoveBtn.classList.remove("selected")
    dom.paletteColors.classList.remove("remove-mode")
  }
}

export const renderPaletteToDOM = () => {
  dom.paletteColors.innerHTML = ""
  swatches.selectedPaletteIndex = null
  for (let i = 0; i < swatches.palette.length; i++) {
    let paletteColor = document.createElement("div")
    paletteColor.className = "palette-color"
    if (swatches.palette[i].color === swatches.primary.color.color) {
      paletteColor.classList.add("selected")
      swatches.selectedPaletteIndex = i
    }
    let swatch = document.createElement("div")
    swatch.className = "swatch"
    swatch.style.background = swatches.palette[i].color
    paletteColor.appendChild(swatch)
    dom.paletteColors.appendChild(paletteColor)

    //associate object
    swatch.color = swatches.palette[i]
  }
  // Create add color button
  let addColorBtn = document.createElement("div")
  addColorBtn.className = "add-color"
  let icon = document.createElement("div")
  icon.className = "icon"
  addColorBtn.appendChild(icon)
  dom.paletteColors.appendChild(addColorBtn)
}
