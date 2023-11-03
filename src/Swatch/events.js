import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { Picker } from "./Picker.js"
import { generateRandomRGB } from "../utils/colors.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderVectorsToDOM,
  renderPaletteToolsToDOM,
  renderPaletteToDOM,
} from "../DOM/render.js"
import { changeActionColor } from "../Actions/actions.js"
import { constrainElementOffsets } from "../utils/constrainElementOffsets.js"

//====================================//
//===== * * * Color Picker * * * =====//
//====================================//

/**
 * Set the color of the swatch
 * @param {Integer} r
 * @param {Integer} g
 * @param {Integer} b
 * @param {Integer} a
 * @param {Element} target
 */
export function setColor(r, g, b, a, target) {
  a = parseInt(a)
  if (target === swatches.primary.swatch) {
    swatches.primary.color.color = `rgba(${r},${g},${b},${a / 255})`
    swatches.primary.color.r = r
    swatches.primary.color.g = g
    swatches.primary.color.b = b
    swatches.primary.color.a = a
    document.documentElement.style.setProperty(
      "--primary-swatch-color",
      `${r},${g},${b}`
    )
    document.documentElement.style.setProperty(
      "--primary-swatch-alpha",
      `${a / 255}`
    )
    picker.update(swatches.primary.color)
  } else if (target === swatches.secondary.swatch) {
    swatches.secondary.color.color = `rgba(${r},${g},${b},${a / 255})`
    swatches.secondary.color.r = r
    swatches.secondary.color.g = g
    swatches.secondary.color.b = b
    swatches.secondary.color.a = a
    document.documentElement.style.setProperty(
      "--secondary-swatch-color",
      `${r},${g},${b}`
    )
    document.documentElement.style.setProperty(
      "--secondary-swatch-alpha",
      `${a / 255}`
    )
  } else {
    let color = { color: `rgba(${r},${g},${b},${a / 255})`, r, g, b, a }
    target.color = color
    target.style.background = color.color
    if (target.vector) {
      changeActionColor(target.vector.index, color)
      state.undoStack.push(state.action)
      state.action = null
      state.redoStack = []
      renderVectorsToDOM()
      renderCanvas(target.vector.layer, null, true, true)
    }
    if (swatches.activePaletteIndex !== null) {
      if (swatches.activePaletteIndex > swatches.palette.length - 1) {
        swatches.palette.push(color)
        let paletteColor = document.createElement("div")
        paletteColor.className = "palette-color"
        paletteColor.appendChild(target)

        let lastChild = dom.paletteColors.lastElementChild
        dom.paletteColors.insertBefore(paletteColor, lastChild)
      } else {
        swatches.palette[swatches.activePaletteIndex] = target.color
      }
      swatches.activePaletteIndex = null
    }
  }
  //reset selected index before render method calculates it
  swatches.selectedPaletteIndex = null
  //only render when s key (randomize color) is not being pressed
  if (!keys.KeyR) {
    renderPaletteToDOM()
  }
}

/**
 * Randomize the color of the swatch
 * @param {Element} target
 */
export function randomizeColor(target) {
  let color = generateRandomRGB()
  setColor(color.r, color.g, color.b, 255, target)
}

/**
 * @param {Element} target
 */
export function initializeColorPicker(target) {
  picker.swatch = target
  const initialColorReference = target.color
  picker.update(initialColorReference)
  //show colorpicker
  dom.colorPickerContainer.style.display = "flex"
  dom.colorPickerContainer.style.top =
    dom.colorPickerContainer.offsetTop - 2 + "px"
  //allow colorPickerContainer events
  dom.colorPickerContainer.style.pointerEvents = "auto"
  if (dom.colorPickerContainer.offsetHeight !== 0) {
    constrainElementOffsets(dom.colorPickerContainer)
  }
}

/**
 * @param {PointerEvent} e
 */
function openColorPicker(e) {
  initializeColorPicker(e.target)
}

/**
 * Switch primary and secondary swatches
 */
function switchColors() {
  let temp = { ...swatches.primary.color }
  swatches.primary.color = swatches.secondary.color
  swatches.primary.swatch.color = swatches.secondary.color
  document.documentElement.style.setProperty(
    "--primary-swatch-color",
    `${swatches.primary.color.r},${swatches.primary.color.g},${swatches.primary.color.b}`
  )
  document.documentElement.style.setProperty(
    "--primary-swatch-alpha",
    `${swatches.primary.color.a / 255}`
  )
  swatches.secondary.color = temp
  swatches.secondary.swatch.color = temp
  document.documentElement.style.setProperty(
    "--secondary-swatch-color",
    `${temp.r},${temp.g},${temp.b}`
  )
  document.documentElement.style.setProperty(
    "--secondary-swatch-alpha",
    `${temp.a / 255}`
  )
  renderPaletteToDOM()
}

/**
 * @param {PointerEvent} e
 */
function handlePalette(e) {
  if (e.target.className.includes("swatch")) {
    //if palette-color and edit mode, open color picker, else
    if (swatches.paletteMode === "edit") {
      swatches.activePaletteIndex = swatches.palette.indexOf(e.target.color)
      initializeColorPicker(e.target)
    } else if (swatches.paletteMode === "remove") {
      let activePaletteIndex = swatches.palette.indexOf(e.target.color)
      if (activePaletteIndex !== -1) {
        // Ensure the color is found in the palette
        swatches.palette.splice(activePaletteIndex, 1)
        if (!keys["KeyX"]) {
          //reset paletteMode unless holding x
          swatches.paletteMode = "select"
          renderPaletteToolsToDOM()
        }
        renderPaletteToDOM()
      }
    } else {
      //select mode
      if (
        swatches.palette.indexOf(e.target.color) ===
        swatches.selectedPaletteIndex
      ) {
        //selecting color that's already selected opens color picker
        swatches.activePaletteIndex = swatches.selectedPaletteIndex
        initializeColorPicker(e.target)
      } else {
        const { r, g, b, a } = e.target.color
        setColor(r, g, b, a, swatches.primary.swatch)
      }
    }
  } else if (e.target.className.includes("icon")) {
    //add new color to palette
    let swatch = document.createElement("div")
    swatch.className = "swatch"

    //associate object
    swatch.color = swatches.primary.color

    swatches.activePaletteIndex = swatches.palette.length
    initializeColorPicker(swatch)
  } else if (e.target.className.includes("palette-remove")) {
    if (swatches.paletteMode !== "remove") {
      swatches.paletteMode = "remove"
    } else {
      swatches.paletteMode = "select"
    }
    renderPaletteToolsToDOM()
  } else if (e.target.className.includes("palette-edit")) {
    if (swatches.paletteMode !== "edit") {
      swatches.paletteMode = "edit"
    } else {
      swatches.paletteMode = "select"
    }
    renderPaletteToolsToDOM()
  }
}

/**
 * Close the picker window
 */
function closePickerWindow() {
  // hide colorpicker
  dom.colorPickerContainer.style.display = "none"
}

/**
 * This function sets the color according to the currently selected parameters and closes the picker window
 */
function handleConfirm() {
  //set color to brush
  document.documentElement.style.setProperty(
    "--old-swatch-color",
    `${picker.rgb.red},${picker.rgb.green},${picker.rgb.blue}`
  )
  document.documentElement.style.setProperty(
    "--old-swatch-alpha",
    `${picker.alpha / 255}`
  )
  // picker.oldcolor.style.backgroundColor =
  //   "hsl(" +
  //   picker.hsl.hue +
  //   "," +
  //   picker.hsl.saturation +
  //   "%," +
  //   picker.hsl.lightness +
  //   "%)"
  setColor(
    picker.rgb.red,
    picker.rgb.green,
    picker.rgb.blue,
    picker.alpha,
    picker.swatch
  )
  //close window
  closePickerWindow()
}

//===================================//
//=== * * * Initialization * * * ====//
//===================================//

//Initialize Color Picker
//Create an instance passing it the canvas, width, height, and setColor fn
let picker = new Picker(
  document.getElementById("color-picker"),
  250,
  250,
  swatches.primary.color
)

//Construct picker
picker.build()

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

dom.swatch.addEventListener("click", openColorPicker)
dom.backSwatch.addEventListener("click", openColorPicker)
dom.colorSwitch.addEventListener("click", switchColors)
//Palette
dom.paletteContainer.addEventListener("click", handlePalette)
//Color Picker
dom.confirmBtn.addEventListener("click", handleConfirm)
dom.cancelBtn.addEventListener("click", closePickerWindow)
