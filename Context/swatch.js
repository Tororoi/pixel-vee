import { state } from "./state.js"
import { Picker } from "../Tools/Picker.js"

//===================================//
//==== * * * DOM Interface * * * ====//
//===================================//

//Main
const fullPage = document.querySelector(".full-page")
//Swatches
const swatch = document.querySelector(".swatch")
const backSwatch = document.querySelector(".back-swatch")
const colorSwitch = document.querySelector(".color-switch")
//Color Picker
const colorPickerContainer = document.querySelector(".color-container")
const confirmBtn = document.getElementById("confirm-btn")
const cancelBtn = document.getElementById("cancel-btn")

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

swatch.addEventListener("click", openColorPicker)
backSwatch.addEventListener("click", openColorPicker)
colorSwitch.addEventListener("click", switchColors)
//Color Picker
confirmBtn.addEventListener("click", (e) => {
  handleConfirm(e)
})
cancelBtn.addEventListener("click", (e) => {
  handleCancel(e)
})

//====================================//
//======== * * * State * * * ========//
//====================================//

export const swatches = {
  primary: {
    ref: swatch,
    color: { color: "rgba(0,0,0,255)", r: 0, g: 0, b: 0, a: 255 },
  },
  secondary: {
    ref: backSwatch,
    color: { color: "rgba(255,255,255,255)", r: 255, g: 255, b: 255, a: 255 },
  },
  //Functions
  randomizeColor,
  setColor,
}

//====================================//
//======= * * * Swatches * * * =======//
//====================================//

/**
 * Switch primary and secondary swatches
 * dependencies - state.brushColor, state.backColor, swatch, backSwatch
 */
function switchColors() {
  let temp = { ...state.brushColor }
  state.brushColor = state.backColor
  swatch.style.background = state.brushColor.color
  state.backColor = temp
  backSwatch.style.background = state.backColor.color
}

/**
 * Set the color of the swatch
 * @param {integer} r
 * @param {integer} g
 * @param {integer} b
 * @param {integer} target - enum: ["swatch btn", "back-swatch btn"]
 * dependencies - state.brushColor, state.backColor, swatch, backSwatch
 */
function setColor(r, g, b, target) {
  if (target === "swatch btn") {
    state.brushColor.color = `rgba(${r},${g},${b},255)`
    state.brushColor.r = r
    state.brushColor.g = g
    state.brushColor.b = b
    swatch.style.background = state.brushColor.color
  } else {
    state.backColor.color = `rgba(${r},${g},${b},255)`
    state.backColor.r = r
    state.backColor.g = g
    state.backColor.b = b
    backSwatch.style.background = state.backColor.color
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
  setColor,
  state.brushColor
)

//Draw
picker.build(state.brushColor)

function openColorPicker(e) {
  picker.swatch = e.target.className
  const initialColorReference =
    picker.swatch === "back-swatch btn" ? state.backColor : state.brushColor
  picker.update(initialColorReference)
  //main page can't be interacted with
  fullPage.style.pointerEvents = "none"
  //disable shortcuts
  state.shortcuts = false
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
  //restore pointer events to page
  fullPage.style.pointerEvents = "auto"
  //enable keyboard shortcuts
  state.shortcuts = true
}

/**
 * This function sets the color according to the currently selected parameters and closes the picker window
 * @param {event} e
 */
function handleConfirm(e) {
  //set color to brush
  setColor(picker.rgb.red, picker.rgb.green, picker.rgb.blue, picker.swatch)
  //close window
  closePickerWindow()
}

function handleCancel(e) {
  //close window
  closePickerWindow()
}
