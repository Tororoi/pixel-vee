import { state } from "../Context/state.js"
//Set onscreen canvas and its context
const onScreenCVS = document.getElementById("onScreen")
const onScreenCTX = onScreenCVS.getContext("2d")
//original canvas width/height
let unsharpenedWidth = onScreenCVS.width
let unsharpenedHeight = onScreenCVS.height
//improve sharpness
//BUG: sharpness (8+) greatly affects performance in browsers other than chrome (can safari and firefox not handle large canvases?)
let sharpness = 4
let zoom = 1
//adjust canvas ratio here if needed
onScreenCVS.width = unsharpenedWidth * sharpness
onScreenCVS.height = unsharpenedHeight * sharpness
onScreenCTX.scale(sharpness * zoom, sharpness * zoom)

//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
let offScreenCVS = document.createElement("canvas")
let offScreenCTX = offScreenCVS.getContext("2d")
//Set the dimensions of the drawing canvas
offScreenCVS.width = 256
offScreenCVS.height = 256
//for adjusting canvas size, adjust onscreen canvas dimensions in proportion to offscreen

//Export canvas state
export const canvas = {
  onScreenCVS,
  onScreenCTX,
  unsharpenedWidth,
  unsharpenedHeight,
  sharpness,
  zoom,
  offScreenCVS,
  offScreenCTX,
  //Layers
  layers: [], //(types: raster, vector, reference)
  currentLayer: null,
  //Functions
  draw,
  consolidateLayers,
}

//FIX: Improve performance by keeping track of "redraw regions" instead of redrawing the whole thing.
//Draw Canvas
function draw() {
  //clear canvas
  canvas.onScreenCTX.clearRect(
    0,
    0,
    canvas.unsharpenedWidth / canvas.zoom,
    canvas.unsharpenedHeight / canvas.zoom
  )
  //Prevent blurring
  canvas.onScreenCTX.imageSmoothingEnabled = false
  //fill background
  canvas.onScreenCTX.fillStyle = "gray"
  canvas.onScreenCTX.fillRect(
    0,
    0,
    canvas.unsharpenedWidth / canvas.zoom,
    canvas.unsharpenedHeight / canvas.zoom
  )
  //BUG: How to mask outside drawing space?
  canvas.onScreenCTX.clearRect(
    state.xOffset,
    state.yOffset,
    canvas.unsharpenedWidth,
    canvas.unsharpenedHeight
  )
  drawLayers()
  //draw border
  canvas.onScreenCTX.beginPath()
  canvas.onScreenCTX.rect(
    state.xOffset - 1,
    state.yOffset - 1,
    canvas.unsharpenedWidth + 2,
    canvas.unsharpenedHeight + 2
  )
  canvas.onScreenCTX.lineWidth = 2
  canvas.onScreenCTX.strokeStyle = "black"
  canvas.onScreenCTX.stroke()
}

//====================================//
//======== * * * Layers * * * ========//
//====================================//

function drawLayers() {
  canvas.layers.forEach((l) => {
    if (!l.removed) {
      if (l.type === "reference") {
        canvas.onScreenCTX.save()
        canvas.onScreenCTX.globalAlpha = l.opacity
        //l.x, l.y need to be normalized to the pixel grid
        canvas.onScreenCTX.drawImage(
          l.img,
          state.xOffset +
            (l.x * canvas.unsharpenedWidth) / canvas.offScreenCVS.width,
          state.yOffset +
            (l.y * canvas.unsharpenedWidth) / canvas.offScreenCVS.width,
          l.img.width * l.scale,
          l.img.height * l.scale
        )
        canvas.onScreenCTX.restore()
      } else {
        canvas.onScreenCTX.save()
        canvas.onScreenCTX.globalAlpha = l.opacity
        //l.x, l.y need to be normalized to the pixel grid
        canvas.onScreenCTX.drawImage(
          l.cvs,
          state.xOffset +
            (l.x * canvas.unsharpenedWidth) / canvas.offScreenCVS.width,
          state.yOffset +
            (l.y * canvas.unsharpenedWidth) / canvas.offScreenCVS.width,
          canvas.unsharpenedWidth,
          canvas.unsharpenedHeight
        )
        canvas.onScreenCTX.restore()
      }
    }
  })
}

//Draw all layers onto offscreen canvas to prepare for sampling or export
function consolidateLayers() {
  canvas.layers.forEach((l) => {
    if (l.type === "raster") {
      canvas.offScreenCTX.save()
      canvas.offScreenCTX.globalAlpha = l.opacity
      canvas.offScreenCTX.drawImage(
        l.cvs,
        l.x,
        l.y,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      canvas.offScreenCTX.restore()
    }
  })
}
