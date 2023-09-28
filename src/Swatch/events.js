import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { Picker } from "../Tools/Picker.js"
import { generateRandomRGB } from "../utils/colors.js"
import { renderCanvas, renderVectorsToDOM } from "../Canvas/render.js"
import { changeActionColor } from "../Tools/actions.js"

//====================================//
//===== * * * Color Picker * * * =====//
//====================================//

/**
 * Set the color of the swatch
 * @param {integer} r
 * @param {integer} g
 * @param {integer} b
 * @param {integer} target - enum: ["swatch btn", "back-swatch btn"]
 * dependencies - swatches, picker
 */
export function setColor(r, g, b, target) {
  if (target === swatches.primary.swatch) {
    swatches.primary.color.color = `rgba(${r},${g},${b},255)`
    swatches.primary.color.r = r
    swatches.primary.color.g = g
    swatches.primary.color.b = b
    swatches.primary.swatch.style.background = swatches.primary.color.color
    picker.update(swatches.primary.color)
  } else if (target === swatches.secondary.swatch) {
    swatches.secondary.color.color = `rgba(${r},${g},${b},255)`
    swatches.secondary.color.r = r
    swatches.secondary.color.g = g
    swatches.secondary.color.b = b
    swatches.secondary.swatch.style.background = swatches.secondary.color.color
  } else {
    let color = { color: `rgba(${r},${g},${b},1)`, r, g, b, a: 255 }
    target.color = color
    target.style.background = color.color
    if (target.vector) {
      changeActionColor(target.vector.index, color)
      state.undoStack.push(state.points)
      state.points = []
      state.redoStack = []
      renderVectorsToDOM()
      renderCanvas(true, true)
    }
  }
}

/**
 * Randomize the color of the swatch
 * @param {string} target - enum: ["swatch btn", "back-swatch btn"]
 * dependencies - setColor
 */
export function randomizeColor(target) {
  let color = generateRandomRGB()
  setColor(color.r, color.g, color.b, target)
}

export function initializeColorPicker(target) {
  picker.swatch = target
  const initialColorReference = target.color
  picker.update(initialColorReference)
  //show colorpicker
  dom.colorPickerContainer.style.display = "flex"
  //allow colorPickerContainer events
  dom.colorPickerContainer.style.pointerEvents = "auto"
}

function openColorPicker(e) {
  initializeColorPicker(e.target)
}

/**
 * Switch primary and secondary swatches
 * dependencies - swatches
 */
function switchColors() {
  let temp = { ...swatches.primary.color }
  swatches.primary.color = swatches.secondary.color
  swatches.primary.swatch.style.background = swatches.primary.color.color
  swatches.secondary.color = temp
  swatches.secondary.swatch.style.background = swatches.secondary.color.color
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
  picker.oldcolor.style.backgroundColor =
    "hsl(" +
    picker.hsl.hue +
    "," +
    picker.hsl.saturation +
    "%," +
    picker.hsl.lightness +
    "%)"
  setColor(picker.rgb.red, picker.rgb.green, picker.rgb.blue, picker.swatch)
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
//Color Picker
dom.confirmBtn.addEventListener("click", handleConfirm)
dom.cancelBtn.addEventListener("click", closePickerWindow)
