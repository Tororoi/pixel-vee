//===================================//
//==== * * * DOM Interface * * * ====//
//===================================//

//====================================//
//======= * * * Sidebar * * * ========//
//====================================//

// * Sidebar Menu * //
const sidebarContainer = document.querySelector(".sidebar")

// * Toolbox Interface * //
const toolboxContainer = document.querySelector(".toolbox")

// * Brush Interface * //
const brushContainer = document.querySelector(".brush-container")

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

//Preload images that don't show up on initial load
const preloadContainer = document.getElementById("preload-container")
const images = [
  "public/pixelv-addlayer-hover.png",
  "public/pixelv-eyeopen-hover.png",
  "public/pixelv-eyeclosed-hover.png",
  "public/pixelv-eyeclosed.png",
  "public/pixelv-reference-hover.png",
  "public/pixelv-trash-hover.png",
]
images.forEach((url) => {
  let img = new Image()
  img.src = url
  preloadContainer.appendChild(img)
})

export const dom = {
  //sidebar
  sidebarContainer,
  toolboxContainer,
  brushContainer,
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
  //color picker
  swatch,
  backSwatch,
  colorSwitch,
  colorPickerContainer,
  confirmBtn,
  cancelBtn,
}
