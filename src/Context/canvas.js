import { dom } from "./dom.js"
import { setInitialZoom } from "../utils/canvasHelpers.js"

//===================================//
//======= * * * Canvas * * * ========//
//===================================//

const backgroundCVS = document.querySelector(".bg-canvas")
const backgroundCTX = backgroundCVS.getContext("2d")
//Set gui canvas and its context
const vectorGuiCVS = document.getElementById("vectorGui")
const vectorGuiCTX = vectorGuiCVS.getContext("2d")
//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
const offScreenCVS = document.createElement("canvas")
const offScreenCTX = offScreenCVS.getContext("2d")
//Create preview canvas for use when rendering the cursor without affecting the actual layer's canvas
const previewCVS = document.createElement("canvas")
const previewCTX = previewCVS.getContext("2d")
//thumbnail canvas for making images from canvas actions
const thumbnailCVS = document.createElement("canvas")
const thumbnailCTX = thumbnailCVS.getContext("2d")

//====================================//
//======== * * * State * * * =========//
//====================================//

//Export canvas state
export const canvas = {
  //Parameters
  vectorGuiCVS,
  vectorGuiCTX,
  backgroundCVS,
  backgroundCTX,
  offScreenCVS,
  offScreenCTX,
  previewCVS,
  previewCTX,
  thumbnailCVS,
  thumbnailCTX,
  //Canvas zoom/ sharpness
  sharpness: null,
  zoom: null,
  zoomAtLastDraw: null,
  //Layers
  layers: [], //(types: raster, vector, reference)
  activeLayerCount: 0,
  currentLayer: null,
  tempLayer: null,
  hiddenLayer: null,
  bgColor: "rgba(131, 131, 131, 0.5)",
  borderColor: "black",
  //Vectors
  currentVectorIndex: null,
  //Cursor
  pointerEvent: "none",
  sizePointerState: "none",
  //Coordinates
  //for moving canvas/ grab
  xOffset: null,
  yOffset: null,
  previousXOffset: null,
  previousYOffset: null,
  subPixelX: null,
  subPixelY: null,
  previousSubPixelX: null,
  previousSubPixelY: null,
  zoomPixelX: null,
  zoomPixelY: null,
}

//Initialize state
canvas.vectorGuiCTX.willReadFrequently = true
canvas.backgroundCTX.willReadFrequently = true
canvas.offScreenCTX.willReadFrequently = true
canvas.previewCTX.willReadFrequently = true
canvas.thumbnailCTX.willReadFrequently = true
//Set the dimensions of the drawing canvas
canvas.offScreenCVS.width = 256
canvas.offScreenCVS.height = 256
canvas.previewCVS.width = canvas.offScreenCVS.width
canvas.previewCVS.height = canvas.offScreenCVS.height
//set the dimensions of the thumbnail canvas
canvas.thumbnailCVS.width = canvas.offScreenCVS.width + 344
canvas.thumbnailCVS.height = canvas.offScreenCVS.height
//improve sharpness
//BUG: sharpness (8+) greatly affects performance in browsers other than chrome (can safari and firefox not handle large canvases?)
//window.devicePixelRatio is typically 2.
//Other than performance issues, any sharpness greater than the devicePixelRatio can actually look bad because the device cannot render the fidelity expected by the canvas.
canvas.sharpness = window.devicePixelRatio
//adjust canvas ratio here if needed
canvas.vectorGuiCVS.width = canvas.vectorGuiCVS.offsetWidth * canvas.sharpness
canvas.vectorGuiCVS.height = canvas.vectorGuiCVS.offsetHeight * canvas.sharpness
canvas.backgroundCVS.width = canvas.backgroundCVS.offsetWidth * canvas.sharpness
canvas.backgroundCVS.height =
  canvas.backgroundCVS.offsetHeight * canvas.sharpness

canvas.zoom = setInitialZoom(canvas.offScreenCVS.width) //zoom level should be based on absolute pixel size, not window relative to canvas
canvas.zoomAtLastDraw = canvas.zoom
vectorGuiCTX.scale(
  canvas.sharpness * canvas.zoom,
  canvas.sharpness * canvas.zoom
)
canvas.backgroundCTX.scale(
  canvas.sharpness * canvas.zoom,
  canvas.sharpness * canvas.zoom
)
canvas.thumbnailCTX.scale(canvas.sharpness, canvas.sharpness)

//for adjusting canvas size, adjust onscreen canvas dimensions in proportion to offscreen
//Initialize size values
dom.canvasWidth.value = canvas.offScreenCVS.width
dom.canvasHeight.value = canvas.offScreenCVS.height
