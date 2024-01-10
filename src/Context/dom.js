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

// * Nav * //
const topMenu = document.querySelector(".nav")

// * Tool Options * //
const toolOptions = document.querySelector(".tool-options")
//TODO: options dialog box where user can set default options such as display vectors, paths, or auto select most recently created vector
// * Toggle Grid * //
const gridBtn = document.getElementById("grid-toggle")
// * Toggle Tooltips * //
const tooltipBtn = document.getElementById("tooltips-toggle")
// * Save * //
const saveBtn = document.querySelector(".save")
// * Open Save * //
const openSaveBtn = document.getElementById("drawing-upload")
// * Export * //
const exportBtn = document.querySelector(".export")

// * File Menu * //
const fileMenu = document.querySelector("#file-menu")
const fileSubMenu = document.querySelector("#file-submenu")

//====================================//
//====== * * * Save/Export * * * =====//
//====================================//

// * Save Container * //
const saveContainer = document.querySelector(".save-container")
// * Save Form * //
const saveAsForm = document.querySelector("#save-interface")
// * File Name * //
const saveAsFileName = document.querySelector("#save-file-name")
// * File Size Preview * //
const fileSizePreview = document.querySelector("#savefile-size")
// * Advanced Options * //
const advancedOptionsContainer = document.querySelector(
  "#save-advanced-options"
)
// * Save Button * //
const saveDrawingBtn = document.querySelector("#save-button")
// * Cancel Button * //
const cancelSaveBtn = document.querySelector("#cancel-save-button")

// * Export Container * //
const exportContainer = document.querySelector(".export-container")

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
  "select",
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
const modesContainer = document.querySelector(".modes-container")

// * Palette Interface * //
const paletteInterfaceContainer = document.querySelector(".palette-interface")
const paletteContainer = document.querySelector(".palette-container")
const paletteColors = document.querySelector(".palette-colors")
const paletteEditBtn = document.querySelector(".palette-edit")
const paletteRemoveBtn = document.querySelector(".palette-remove")
// TODO: button to create palette from colors on canvas

// * Layers Interface * //
const uploadBtn = document.querySelector("#file-upload")
const newLayerBtn = document.querySelector(".add-layer")
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
//========= * * * State * * * ========//
//====================================//

export const dom = {
  canvasLayers,
  tooltip,
  //menu
  topMenu,
  toolOptions,
  gridBtn,
  tooltipBtn,
  saveBtn,
  openSaveBtn,
  exportBtn,
  fileMenu,
  fileSubMenu,
  //save/export
  saveContainer,
  saveAsForm,
  saveAsFileName,
  fileSizePreview,
  advancedOptionsContainer,
  saveDrawingBtn,
  cancelSaveBtn,
  exportContainer,
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
  modesContainer,
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
