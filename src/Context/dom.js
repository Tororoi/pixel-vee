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
const navBar = document.querySelector(".nav")

const topMenu = document.getElementById("top-menu")

// * Tool Options * //
const toolOptions = document.querySelector(".tool-options") //TODO: (High Priority) Will become quick menu

// * File Menu * //
const fileSubMenu = document.getElementById("file-submenu")
// * Save * //
const saveBtn = document.getElementById("save")
// * Open Save * //
const openSaveBtn = document.getElementById("drawing-upload")
// * Import * //
const importBtn = document.getElementById("import")
// * Export * //
const exportBtn = document.getElementById("export")

// * Edit Menu * //
const editSubMenu = document.getElementById("edit-submenu")
// * Canvas Size * //
const canvasSizeBtn = document.getElementById("canvas-size")
// * Select All * //
const selectAllBtn = document.getElementById("select-all")
// * Deselect * //
const deselectBtn = document.getElementById("deselect")
// * Invert Selection * //
const invertSelectionBtn = document.getElementById("invert-selection")
// * Cut * //
const cutBtn = document.getElementById("cut-selection")
// * Copy * //
const copyBtn = document.getElementById("copy-selection")
// * Paste * //
const pasteBtn = document.getElementById("paste-selection")
// * Delete * //
const deleteBtn = document.getElementById("delete-selection")
// * Flip Horizontal * //
const flipHorizontalBtn = document.getElementById("flip-horizontal")
// * Flip Vertical * //
const flipVerticalBtn = document.getElementById("flip-vertical")
// * Rotate * //
const rotateBtn = document.getElementById("rotate-right")

// * Settings Button * //
const settingsBtn = document.getElementById("settings-btn")

//====================================//
//========= * * * Settings * * * =====//
//====================================//

// * Settings Container * //
const settingsContainer = document.querySelector(".settings-container")

// * Settings Form * //
//TODO: (Medium Priority) options dialog box where user can set default options such as display vectors, paths, or auto select most recently created vector, custom shortcuts, etc.
// * Toggle Tooltips * //
const tooltipBtn = document.getElementById("tooltips-toggle")
// * Toggle Grid * //
const gridBtn = document.getElementById("grid-toggle")
// * Grid Spacing * //
const gridSpacingSpinBtn = document.querySelector(".grid-spacing-spin")
const gridSpacing = document.getElementById("grid-spacing")

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
// TODO: (Low Priority) button to create palette from colors on canvas

// * Layers Interface * //
const layersInterfaceContainer = document.querySelector(".layers-interface")
const uploadBtn = document.querySelector("#file-upload")
const newLayerBtn = document.querySelector(".add-layer")
const deleteLayerBtn = document.querySelector("#delete-layer")
const layersContainer = document.querySelector(".layers")
const layerSettingsContainer = document.querySelector(".layer-settings")

// * Vectors Interface * //
const vectorsThumbnails = document.querySelector(".vectors")
const vectorsInterfaceContainer = document.querySelector(".vectors-interface")

// * Canvas Size Interface * //
const sizeContainer = document.querySelector(".size-container")

const dimensionsForm = document.querySelector(".dimensions-form")
const canvasWidth = document.getElementById("canvas-width")
const canvasHeight = document.getElementById("canvas-height")
const canvasSizeCancelBtn = document.getElementById("cancel-resize-button")

//====================================//
//========= * * * State * * * ========//
//====================================//

export const dom = {
  canvasLayers,
  tooltip,
  //menu
  navBar,
  topMenu,
  toolOptions,
  //File Menu
  fileSubMenu,
  saveBtn,
  openSaveBtn,
  importBtn,
  exportBtn,
  //Edit Menu
  editSubMenu,
  canvasSizeBtn,
  selectAllBtn,
  deselectBtn,
  invertSelectionBtn,
  cutBtn,
  copyBtn,
  pasteBtn,
  deleteBtn,
  flipHorizontalBtn,
  flipVerticalBtn,
  rotateBtn,
  //Settings
  settingsBtn,
  //settings
  settingsContainer,
  tooltipBtn,
  gridBtn,
  gridSpacingSpinBtn,
  gridSpacing,
  //save/export
  saveContainer,
  saveAsForm,
  saveAsFileName,
  fileSizePreview,
  advancedOptionsContainer,
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
  //layers
  uploadBtn,
  newLayerBtn,
  deleteLayerBtn,
  layersContainer,
  layersInterfaceContainer,
  layerSettingsContainer,
  //vectors
  vectorsThumbnails,
  vectorsInterfaceContainer,
  //canvas size
  sizeContainer,
  dimensionsForm,
  canvasWidth,
  canvasHeight,
  canvasSizeCancelBtn,
}
