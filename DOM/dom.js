//===================================//
//==== * * * DOM Interface * * * ====//
//===================================//

// * Sidebar Menu * //
const sidebarContainer = document.querySelector(".sidebar")

// * Toolbox * //
const toolboxContainer = document.querySelector(".toolbox")

// * Brush * //
const brushContainer = document.querySelector(".brush-container")

// * Layers Interface * //
const uploadBtn = document.querySelector("#file-upload")
const newLayerBtn = document.querySelector(".new-raster-layer")

const layersContainer = document.querySelector(".layers")
const layersInterfaceContainer = document.querySelector(".layers-interface")

// * Vectors Interface * //
const vectorsThumbnails = document.querySelector(".vectors")
const vectorsInterfaceContainer = document.querySelector(".vectors-interface")

// * Canvas Size * //
const sizeContainer = document.querySelector(".size-container")

const dimensionsForm = document.querySelector(".dimensions-form")
const canvasWidth = document.getElementById("canvas-width")
const canvasHeight = document.getElementById("canvas-height")

export const dom = {
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
}
