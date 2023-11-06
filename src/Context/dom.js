//===================================//
//==== * * * DOM Interface * * * ====//
//===================================//

// * Raster Layers Container * //
const canvasLayers = document.querySelector(".canvas-layers")

// * Tooltip * //
const tooltip = document.getElementById("tooltip")

//====================================//
//========= * * * Menu * * * =========//
//====================================//

// * Toggle Grid * //
const gridBtn = document.getElementById("grid-toggle")
// * Toggle Tooltips * //
const tooltipBtn = document.getElementById("tooltips-toggle")
// * Export * //
const exportBtn = document.querySelector(".export")

//====================================//
//======= * * * Toolbox * * * ========//
//====================================//

// * Toolbox Interface * //
const toolboxContainer = document.querySelector(".toolbox")

// * Undo buttons * //
const undoBtn = document.getElementById("undo")
const redoBtn = document.getElementById("redo")

// * Reset buttons * //
const recenterBtn = document.querySelector(".recenter")
const clearBtn = document.querySelector(".clear")

// * Zoom buttons * //
const zoomContainer = document.querySelector(".zoom")

// * Tool buttons * //
const toolsContainer = document.querySelector(".tools")

const tools = [
  "brush",
  "colorMask",
  "fill",
  "line",
  "quadCurve",
  "cubicCurve",
  "ellipse",
  // "select",
  "eyedropper",
  "grab",
  "move",
]

const toolButtons = {}

tools.forEach((tool) => {
  toolButtons[`${tool}Btn`] = toolsContainer.querySelector(`#${tool}`)
})

const toolBtn = document.querySelector("#brush")
toolBtn.classList.add("selected")

const modesContainer = document.querySelector(".modes")
const modeBtn = document.querySelector("#draw")
modeBtn.classList.add("selected")

//====================================//
//===== * * * Color Picker * * * =====//
//====================================//

// * Swatches * //
const swatch = document.querySelector(".swatch")
const backSwatch = document.querySelector(".back-swatch")
const colorSwitch = document.querySelector(".color-switch")

// * Color Picker * //
const colorPickerContainer = document.querySelector(".picker-container")
const confirmBtn = document.getElementById("confirm-btn")
const cancelBtn = document.getElementById("cancel-btn")

//====================================//
//======= * * * Sidebar * * * ========//
//====================================//

// * Sidebar Menu * //
const sidebarContainer = document.querySelector(".sidebar")

// * Brush Interface * //
const brushContainer = document.querySelector(".brush-container")
const lineWeight = document.querySelector("#line-weight")
const brushDisplay = document.querySelector(".brush-preview")
const brushPreview = document.querySelector("#brush-preview")
const brushSlider = document.querySelector("#brush-size")
const brushStamp = document.querySelector(".brush-stamp")

// * Palette Interface * //
const paletteInterfaceContainer = document.querySelector(".palette-interface")
const paletteContainer = document.querySelector(".palette-container")
const paletteColors = document.querySelector(".palette-colors")
const paletteEditBtn = document.querySelector(".palette-edit")
const paletteRemoveBtn = document.querySelector(".palette-remove")
//TODO: Add color button, edit colors button, remove color button, move main swatches to here. Clicking a palette swatch should change primary color to that color
// button to create palette from canvas

// * Layers Interface * //
const uploadBtn = document.querySelector("#file-upload")
const newLayerBtn = document.querySelector(".new-raster-layer")
const layersContainer = document.querySelector(".layers")
const layersInterfaceContainer = document.querySelector(".layers-interface")

// * Vectors Interface * //
const vectorsThumbnails = document.querySelector(".vectors")
const vectorsInterfaceContainer = document.querySelector(".vectors-interface")

// * Canvas Size Interface * //
const sizeContainer = document.querySelector(".size-container")

const dimensionsForm = document.querySelector(".dimensions-form")
const canvasWidth = document.getElementById("canvas-width")
const canvasHeight = document.getElementById("canvas-height")

//====================================//
//======= * * * Preload * * * ========//
//====================================//

// * Preload images that don't show up on initial load * //
const preloadContainer = document.getElementById("preload-container")
const images = [
  //tools icons
  "public/pixelv-line-hover.png",
  "public/pixelv-line.png",
  "public/pixelv-quadCurve-hover.png",
  "public/pixelv-quadCurve.png",
  "public/pixelv-cubicCurve-hover.png",
  "public/pixelv-cubicCurve.png",
  "public/pixelv-ellipse-hover.png",
  "public/pixelv-ellipse.png",
  "public/pixelv-eyedropper-hover.png",
  "public/pixelv-eyedropper.png",
  "public/pixelv-grab-hover.png",
  "public/pixelv-grab.png",
  "public/pixelv-move-hover.png",
  "public/pixelv-move.png",
  //modes icons
  "public/pixelv-pencil-hover.png",
  "public/pixelv-pencil.png",
  "public/pixelv-eraser-hover.png",
  "public/pixelv-eraser.png",
  "public/pixelv-mechanical-hover.png",
  "public/pixelv-mechanical.png",
  "public/pixelv-inject-hover.png",
  "public/pixelv-inject.png",
  //one-off actions icons
  "public/pixelv-undo-hover.png",
  "public/pixelv-undo.png",
  "public/pixelv-redo-hover.png",
  "public/pixelv-redo.png",
  "public/pixelv-recenter-hover.png",
  "public/pixelv-recenter.png",
  "public/pixelv-clear-hover.png",
  "public/pixelv-clear.png",
  "public/pixelv-switch-hover.png",
  "public/pixelv-switch.png",
  "public/pixelv-plus-hover.png",
  "public/pixelv-plus.png",
  "public/pixelv-minus-hover.png",
  "public/pixelv-minus.png",
  //layer icons
  "public/pixelv-eyeopen-hover.png",
  "public/pixelv-eyeopen.png",
  "public/pixelv-eyeclosed-hover.png",
  "public/pixelv-eyeclosed.png",
  "public/pixelv-trash-hover.png",
  "public/pixelv-trash.png",
  "public/pixelv-addlayer-hover.png",
  "public/pixelv-addlayer.png",
  "public/pixelv-reference-hover.png",
  "public/pixelv-reference.png",
]
images.forEach((url) => {
  let img = new Image()
  img.src = url
  preloadContainer.appendChild(img)
})

//====================================//
//========= * * * State * * * ========//
//====================================//

export const dom = {
  canvasLayers,
  tooltip,
  //menu
  gridBtn,
  tooltipBtn,
  exportBtn,
  //toolbox
  toolboxContainer,
  undoBtn,
  redoBtn,
  recenterBtn,
  clearBtn,
  zoomContainer,
  toolsContainer,
  ...toolButtons,
  toolBtn,
  modesContainer,
  modeBtn,
  //color picker
  swatch,
  backSwatch,
  colorSwitch,
  colorPickerContainer,
  confirmBtn,
  cancelBtn,
  //sidebar
  sidebarContainer,
  brushContainer,
  lineWeight,
  brushDisplay,
  brushPreview,
  brushSlider,
  brushStamp,
  paletteInterfaceContainer,
  paletteContainer,
  paletteColors,
  paletteEditBtn,
  paletteRemoveBtn,
  uploadBtn,
  newLayerBtn,
  layersContainer,
  layersInterfaceContainer,
  vectorsThumbnails,
  vectorsInterfaceContainer,
  sizeContainer,
  dimensionsForm,
  canvasWidth,
  canvasHeight,
}
