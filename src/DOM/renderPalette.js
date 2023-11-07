import { dom } from "../Context/dom.js"
import { swatches } from "../Context/swatch.js"

/**
 * Render palette tools in DOM
 */
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

/**
 * Render palette interface in DOM
 */
export const renderPaletteToDOM = () => {
  dom.paletteColors.innerHTML = ""
  swatches.selectedPaletteIndex = null

  for (let i = 0; i < swatches.palette.length; i++) {
    createPaletteSwatch(swatches.palette[i], i)
  }

  createAddColorButton()
}

/**
 * Create a swatch for a given palette color
 * @param {Object} colorObj
 * @param {Integer} index
 */
const createPaletteSwatch = (colorObj, index) => {
  const paletteColor = document.createElement("div")
  paletteColor.className = "palette-color"

  if (colorObj.color === swatches.primary.color.color) {
    paletteColor.classList.add("selected")
    swatches.selectedPaletteIndex = index
  }

  const swatch = document.createElement("div")
  swatch.className = "swatch"
  swatch.style.background = colorObj.color

  //associate object
  swatch.color = colorObj

  paletteColor.appendChild(swatch)
  dom.paletteColors.appendChild(paletteColor)
}

/**
 * Create the button for adding a color to the palette
 */
const createAddColorButton = () => {
  const addColorBtn = document.createElement("div")
  addColorBtn.className = "add-color plus"
  dom.paletteColors.appendChild(addColorBtn)
}
