import { dom } from './dom.js'
import { setInitialZoom } from '../utils/canvasHelpers.js'

//===================================//
//======= * * * Canvas * * * ========//
//===================================//

const backgroundCVS = document.querySelector('.bg-canvas')
const backgroundCTX = backgroundCVS.getContext('2d', {
  desynchronized: true,
})
//Set gui canvas and its context
const vectorGuiCVS = document.getElementById('vector-gui-canvas')
const vectorGuiCTX = vectorGuiCVS.getContext('2d', {
  desynchronized: true,
})
const selectionGuiCVS = document.getElementById('selection-gui-canvas')
const selectionGuiCTX = selectionGuiCVS.getContext('2d', {
  desynchronized: true,
})
const resizeOverlayCVS = document.getElementById('resize-overlay-canvas')
const resizeOverlayCTX = resizeOverlayCVS.getContext('2d', {
  desynchronized: true,
})
const cursorCVS = document.getElementById('cursor-canvas')
const cursorCTX = cursorCVS.getContext('2d', {
  desynchronized: true,
})
//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
const offScreenCVS = document.createElement('canvas')
const offScreenCTX = offScreenCVS.getContext('2d', {
  willReadFrequently: true,
})
//Create preview canvas for use when rendering the cursor without affecting the actual layer's canvas
const previewCVS = document.createElement('canvas')
const previewCTX = previewCVS.getContext('2d', {
  willReadFrequently: true,
})
//thumbnail canvas for making images from canvas actions
const thumbnailCVS = document.createElement('canvas')
const thumbnailCTX = thumbnailCVS.getContext('2d', {
  willReadFrequently: true,
})

//====================================//
//======== * * * State * * * =========//
//====================================//

//Export canvas state
export const canvas = {
  //Parameters
  vectorGuiCVS,
  vectorGuiCTX,
  selectionGuiCVS,
  selectionGuiCTX,
  resizeOverlayCVS,
  resizeOverlayCTX,
  cursorCVS,
  cursorCTX,
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
  pastedLayer: null,
  hiddenLayer: null,
  bgColor: 'rgba(131, 131, 131, 0.5)',
  borderColor: 'black',
  //Cursor
  pointerEvent: 'none',
  sizePointerState: 'none',
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
  gui: {
    lineWidth: null,
    renderRadius: null,
    collisionRadius: null,
  },
}

//Initialize state
//Set the dimensions of the drawing canvas
canvas.offScreenCVS.width = 128
canvas.offScreenCVS.height = 128
canvas.previewCVS.width = canvas.offScreenCVS.width
canvas.previewCVS.height = canvas.offScreenCVS.height
//set the dimensions of the thumbnail canvas
canvas.thumbnailCVS.width = 600
canvas.thumbnailCVS.height = 256
//improve sharpness
//window.devicePixelRatio is typically 2.
//Other than performance issues, any sharpness greater than the devicePixelRatio can actually look bad because the device cannot render the fidelity expected by the canvas.
canvas.sharpness = window.devicePixelRatio
//adjust canvas ratio here if needed
canvas.vectorGuiCVS.width = canvas.vectorGuiCVS.offsetWidth * canvas.sharpness
canvas.vectorGuiCVS.height = canvas.vectorGuiCVS.offsetHeight * canvas.sharpness
canvas.selectionGuiCVS.width =
  canvas.selectionGuiCVS.offsetWidth * canvas.sharpness
canvas.selectionGuiCVS.height =
  canvas.selectionGuiCVS.offsetHeight * canvas.sharpness
canvas.resizeOverlayCVS.width =
  canvas.resizeOverlayCVS.offsetWidth * canvas.sharpness
canvas.resizeOverlayCVS.height =
  canvas.resizeOverlayCVS.offsetHeight * canvas.sharpness
canvas.cursorCVS.width = canvas.cursorCVS.offsetWidth * canvas.sharpness
canvas.cursorCVS.height = canvas.cursorCVS.offsetHeight * canvas.sharpness
canvas.backgroundCVS.width = canvas.backgroundCVS.offsetWidth * canvas.sharpness
canvas.backgroundCVS.height =
  canvas.backgroundCVS.offsetHeight * canvas.sharpness

canvas.zoom = setInitialZoom(
  canvas.offScreenCVS.width,
  canvas.offScreenCVS.height,
  canvas.vectorGuiCVS.offsetWidth,
  canvas.vectorGuiCVS.offsetHeight,
)
canvas.zoomAtLastDraw = canvas.zoom
canvas.gui = {
  lineWidth: canvas.zoom <= 8 ? 0.5 / canvas.zoom : 0.5 / 8,
  renderRadius: 4,
  collisionRadius: canvas.zoom <= 6 ? 1 : 0.5,
}
vectorGuiCTX.scale(
  canvas.sharpness * canvas.zoom,
  canvas.sharpness * canvas.zoom,
)
selectionGuiCTX.scale(
  canvas.sharpness * canvas.zoom,
  canvas.sharpness * canvas.zoom,
)
resizeOverlayCTX.scale(
  canvas.sharpness * canvas.zoom,
  canvas.sharpness * canvas.zoom,
)
cursorCTX.scale(canvas.sharpness * canvas.zoom, canvas.sharpness * canvas.zoom)
canvas.backgroundCTX.scale(
  canvas.sharpness * canvas.zoom,
  canvas.sharpness * canvas.zoom,
)
canvas.thumbnailCTX.scale(canvas.sharpness, canvas.sharpness)

//for adjusting canvas size, adjust onscreen canvas dimensions in proportion to offscreen
//Initialize size values
dom.canvasWidth.value = canvas.offScreenCVS.width
dom.canvasHeight.value = canvas.offScreenCVS.height
dom.gridSpacing.value = 8
