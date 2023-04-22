import { state } from "./state.js"
import { Picker } from "../Tools/Picker.js"
import { initializeDialogBox } from "../utils/drag.js"

//===================================//
//==== * * * DOM Interface * * * ====//
//===================================//

//Swatches
const swatch = document.querySelector(".swatch")
const backSwatch = document.querySelector(".back-swatch")
const colorSwitch = document.querySelector(".color-switch")
//Color Picker
const colorPickerContainer = document.querySelector(".picker-container")
initializeDialogBox(colorPickerContainer)
const confirmBtn = document.getElementById("confirm-btn")
const cancelBtn = document.getElementById("cancel-btn")

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

swatch.addEventListener("click", openColorPicker)
backSwatch.addEventListener("click", openColorPicker)
colorSwitch.addEventListener("click", switchColors)
//Color Picker
confirmBtn.addEventListener("click", handleConfirm)
cancelBtn.addEventListener("click", closePickerWindow)

//====================================//
//======== * * * State * * * ========//
//====================================//

export const swatches = {
  primary: {
    swatch: swatch,
    color: { color: "rgba(0,0,0,255)", r: 0, g: 0, b: 0, a: 255 }, //default black. While drawing, always the color used
  },
  secondary: {
    swatch: backSwatch,
    color: { color: "rgba(255,255,255,255)", r: 255, g: 255, b: 255, a: 255 }, //default white
  },
  palette: {},
  //Functions
  randomizeColor,
  setColor,
}

//====================================//
//======= * * * Swatches * * * =======//
//====================================//

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
 * Set the color of the swatch
 * @param {integer} r
 * @param {integer} g
 * @param {integer} b
 * @param {integer} target - enum: ["swatch btn", "back-swatch btn"]
 * dependencies - swatches, picker
 */
function setColor(r, g, b, target) {
  if (target === "swatch btn") {
    swatches.primary.color.color = `rgba(${r},${g},${b},255)`
    swatches.primary.color.r = r
    swatches.primary.color.g = g
    swatches.primary.color.b = b
    swatches.primary.swatch.style.background = swatches.primary.color.color
    picker.update(swatches.primary.color)
  } else {
    swatches.secondary.color.color = `rgba(${r},${g},${b},255)`
    swatches.secondary.color.r = r
    swatches.secondary.color.g = g
    swatches.secondary.color.b = b
    swatches.secondary.swatch.style.background = swatches.secondary.color.color
  }
}

/**
 * Randomize the color of the swatch
 * @param {string} target - enum: ["swatch btn", "back-swatch btn"]
 * dependencies - setColor
 */
function randomizeColor(target) {
  let r = Math.floor(Math.random() * 256)
  let g = Math.floor(Math.random() * 256)
  let b = Math.floor(Math.random() * 256)
  setColor(r, g, b, target)
}

//====================================//
//===== * * * Color Picker * * * =====//
//====================================//

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

function openColorPicker(e) {
  picker.swatch = e.target.className
  const initialColorReference =
    picker.swatch === "back-swatch btn"
      ? swatches.secondary.color
      : swatches.primary.color
  picker.update(initialColorReference)
  //show colorpicker
  colorPickerContainer.style.display = "flex"
  //allow colorPickerContainer events
  colorPickerContainer.style.pointerEvents = "auto"
}

/**
 * Close the picker window
 */
function closePickerWindow() {
  // hide colorpicker
  colorPickerContainer.style.display = "none"
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
