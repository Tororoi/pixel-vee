import { dom } from '../Context/dom.js'
import { keys } from '../Shortcuts/keys.js'
import { globalState } from '../Context/state.js'
import { swatches } from '../Context/swatch.js'
import { Picker } from './Picker.js'
import { generateRandomRGB } from '../utils/colors.js'
import { renderCanvas } from '../Canvas/render.js'
import { updateDitherPickerColors } from '../DOM/render.js'
import { changeActionVectorColor } from '../Actions/modifyTimeline/modifyTimeline.js'
import { constrainElementOffsets } from '../utils/constrainElementOffsets.js'
import { DEFAULT_PALETTES, PRESETS } from '../utils/palettes.js'

//====================================//
//===== * * * Color Picker * * * =====//
//====================================//

/**
 * Set the color of the swatch
 * @param {number} r - (Integer)
 * @param {number} g - (Integer)
 * @param {number} b - (Integer)
 * @param {number} a - (Integer)
 * @param {Element} target - The swatch to set the color of
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
      '--primary-swatch-color',
      `${r},${g},${b}`,
    )
    document.documentElement.style.setProperty(
      '--primary-swatch-alpha',
      `${a / 255}`,
    )
    picker.update(swatches.primary.color)
  } else if (target === swatches.secondary.swatch) {
    swatches.secondary.color.color = `rgba(${r},${g},${b},${a / 255})`
    swatches.secondary.color.r = r
    swatches.secondary.color.g = g
    swatches.secondary.color.b = b
    swatches.secondary.color.a = a
    document.documentElement.style.setProperty(
      '--secondary-swatch-color',
      `${r},${g},${b}`,
    )
    document.documentElement.style.setProperty(
      '--secondary-swatch-alpha',
      `${a / 255}`,
    )
  } else {
    let color = { color: `rgba(${r},${g},${b},${a / 255})`, r, g, b, a }
    target.color = color
    if (target.style) target.style.backgroundColor = color.color
    // Update inner swatch div if present (e.g. vector settings dialog color buttons)
    const innerSwatch = target.querySelector?.('.swatch')
    if (innerSwatch) innerSwatch.style.backgroundColor = color.color
    if (target.vector) {
      let vector = target.vector
      if (target.isSecondaryColor) {
        vector.secondaryColor = color
        renderCanvas(vector.layer, true)
        globalState.clearRedoStack()
      } else {
        let oldColor = { ...vector.color }
        vector.color = color
        renderCanvas(vector.layer, true)
        changeActionVectorColor(vector, oldColor)
        globalState.clearRedoStack()
      }
    }
    if (swatches.activePaletteIndex !== null) {
      if (swatches.activePaletteIndex > swatches.palette.length - 1) {
        swatches.palette.push(color)
      } else {
        swatches.palette[swatches.activePaletteIndex] = target.color
      }
      onPaletteModified()
      swatches.activePaletteIndex = null
    }
  }
  //reset selected index before render method calculates it
  swatches.selectedPaletteIndex = null
  updateDitherPickerColors()
}

/**
 * Randomize the color of the swatch
 * @param {Element} target - The swatch to randomize the color of
 */
export function randomizeColor(target) {
  let color = generateRandomRGB()
  setColor(color.r, color.g, color.b, 255, target)
}

/**
 * @param {Element} target - The swatch to initialize the color picker with
 */
export function initializeColorPicker(target) {
  if (!picker) return
  picker.swatch = target
  const initialColorReference = target.color
  picker.update(initialColorReference)
  //show colorpicker — React reads globalState.ui.colorPickerOpen via
  globalState.ui.colorPickerOpen = true
  if (dom.colorPickerContainer) {
    dom.colorPickerContainer.style.display = 'flex'
    dom.colorPickerContainer.style.top =
      dom.colorPickerContainer.offsetTop - 2 + 'px'
    dom.colorPickerContainer.style.pointerEvents = 'auto'
    if (dom.colorPickerContainer.offsetHeight !== 0) {
      constrainElementOffsets(dom.colorPickerContainer)
    }
  }
}

/**
 * @param {PointerEvent} e - pointer event on the swatch
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
    '--primary-swatch-color',
    `${swatches.primary.color.r},${swatches.primary.color.g},${swatches.primary.color.b}`,
  )
  document.documentElement.style.setProperty(
    '--primary-swatch-alpha',
    `${swatches.primary.color.a / 255}`,
  )
  swatches.secondary.color = temp
  swatches.secondary.swatch.color = temp
  document.documentElement.style.setProperty(
    '--secondary-swatch-color',
    `${temp.r},${temp.g},${temp.b}`,
  )
  document.documentElement.style.setProperty(
    '--secondary-swatch-alpha',
    `${temp.a / 255}`,
  )
  updateDitherPickerColors()
}

/**
 * @param {PointerEvent} e - pointer event on the palette
 */
function handlePalette(e) {
  if (e.target.className.includes('swatch')) {
    //if palette-color and edit mode, open color picker, else
    if (swatches.paletteMode === 'edit') {
      swatches.activePaletteIndex = swatches.palette.indexOf(e.target.color)
      initializeColorPicker(e.target)
    } else if (swatches.paletteMode === 'remove') {
      let activePaletteIndex = swatches.palette.indexOf(e.target.color)
      if (activePaletteIndex !== -1) {
        // Ensure the color is found in the palette
        swatches.palette.splice(activePaletteIndex, 1)
        onPaletteModified()
        if (!keys['KeyX']) {
          //reset paletteMode unless holding x
          swatches.paletteMode = 'select'
        }
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
  } else if (e.target.className.includes('add-color')) {
    //add new color to palette
    let swatch = document.createElement('div')
    swatch.className = 'swatch'

    //associate object
    swatch.color = swatches.primary.color

    swatches.activePaletteIndex = swatches.palette.length
    initializeColorPicker(swatch)
  } else if (e.target.className.includes('palette-remove')) {
    if (swatches.paletteMode !== 'remove') {
      swatches.paletteMode = 'remove'
    } else {
      swatches.paletteMode = 'select'
    }
  } else if (e.target.className.includes('palette-edit')) {
    if (swatches.paletteMode !== 'edit') {
      swatches.paletteMode = 'edit'
    } else {
      swatches.paletteMode = 'select'
    }
  }
}

/**
 * Close the picker window
 */
export function closePickerWindow() {
  if (!picker) return
  picker.selectedCustomKey = null
  picker.editingCustomKey = null
  // hide colorpicker
  globalState.ui.colorPickerOpen = false
  if (dom.colorPickerContainer) dom.colorPickerContainer.style.display = 'none'
}

/**
 * This function sets the color according to the currently selected parameters and closes the picker window
 */
export function confirmColor() {
  if (!picker) return
  const { red: r, green: g, blue: b } = picker.rgb
  const a = picker.alpha
  //set color to brush
  document.documentElement.style.setProperty(
    '--old-swatch-color',
    `${r},${g},${b}`,
  )
  document.documentElement.style.setProperty('--old-swatch-alpha', `${a / 255}`)
  setColor(r, g, b, a, picker.swatch)
  //close window
  closePickerWindow()
}

//===================================//
//=== * * * Initialization * * * ====//
//===================================//

// Picker is initialized lazily — the canvas element (#color-picker) is
// rendered by ColorPickerDialog (React). registerPicker() is called from
// ColorPickerDialog's useEffect after the canvas is in the DOM.
let picker = null

/**
 * Register the Picker instance created by ColorPickerDialog.
 * Must be called once after the picker canvas has been mounted.
 * @param {Picker} p - The Picker instance to register
 */
export function registerPicker(p) {
  picker = p
}

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

/**
 * Add the current picker color to the palette without closing the picker
 */
export function addToPalette() {
  if (!picker) return
  const { red: r, green: g, blue: b } = picker.rgb
  const a = picker.alpha
  swatches.palette.push({
    color: `rgba(${r},${g},${b},${a / 255})`,
    r,
    g,
    b,
    a,
  })
  onPaletteModified()
}

/**
 * Load a preset or custom palette by id
 * @param {string} id - preset or custom palette id
 */
function handlePresetSelect(id) {
  if (id in DEFAULT_PALETTES) {
    swatches.palette = DEFAULT_PALETTES[id].map((c) => ({ ...c }))
  } else if (id in swatches.customPalettes) {
    swatches.palette = swatches.customPalettes[id].colors.map((c) => ({
      ...c,
    }))
  } else {
    return
  }
  swatches.currentPreset = id
}

/**
 * Track palette modifications: create a new custom entry when on a preset,
 * or update the existing custom entry in place.
 */
function onPaletteModified() {
  const id = swatches.currentPreset
  if (id in DEFAULT_PALETTES) {
    const base = PRESETS.find((p) => p.id === id)?.label ?? id
    const existingCount = Object.keys(swatches.customPalettes).filter((k) =>
      k.startsWith(`custom_${id}_`),
    ).length
    const n = existingCount + 1
    const customId = `custom_${id}_${n}`
    const label = n === 1 ? `Custom (${base})` : `Custom (${base}) ${n}`
    swatches.customPalettes[customId] = {
      label,
      colors: swatches.palette.map((c) => ({ ...c })),
    }
    swatches.currentPreset = customId
  } else if (id in swatches.customPalettes) {
    swatches.customPalettes[id].colors = swatches.palette.map((c) => ({
      ...c,
    }))
  }
}

// * Swatch / Palette * — handled by PalettePanel React component; guard until migrated
if (dom.swatch) dom.swatch.addEventListener('click', openColorPicker)
if (dom.backSwatch) dom.backSwatch.addEventListener('click', openColorPicker)
if (dom.colorSwitch) dom.colorSwitch.addEventListener('click', switchColors)
if (dom.paletteContainer)
  dom.paletteContainer.addEventListener('click', handlePalette)
if (dom.palettePresetsBtn)
  dom.palettePresetsBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    const container = dom.palettePresetsBtn.parentElement
    const isOpen = container.classList.toggle('open')
    if (dom.paletteInterfaceContainer)
      dom.paletteInterfaceContainer.style.zIndex = isOpen ? '200' : ''
  })
if (dom.palettePresetsList)
  dom.palettePresetsList.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-id]')
    if (!li) return
    handlePresetSelect(li.dataset.id)
    dom.palettePresetsBtn.parentElement.classList.remove('open')
    if (dom.paletteInterfaceContainer)
      dom.paletteInterfaceContainer.style.zIndex = ''
  })
// * Color Picker * — handled by ColorPickerDialog React component; guard until migrated
if (dom.confirmBtn) dom.confirmBtn.addEventListener('click', confirmColor)
if (dom.cancelBtn) dom.cancelBtn.addEventListener('click', closePickerWindow)
if (dom.newColorBtn) dom.newColorBtn.addEventListener('click', addToPalette)
