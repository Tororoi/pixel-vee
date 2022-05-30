import { state } from "../Context/state.js"

//===================================//
//==== * * * DOM Interface * * * ====//
//===================================//

const uploadBtn = document.querySelector("#file-upload")
const newLayerBtn = document.querySelector(".new-raster-layer")

const layersCont = document.querySelector(".layers")

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

uploadBtn.addEventListener("change", addReferenceLayer)
newLayerBtn.addEventListener("click", addRasterLayer)

layersCont.addEventListener("click", layerInteract)

layersCont.addEventListener("dragstart", dragLayerStart)
layersCont.addEventListener("dragover", dragLayerOver)
layersCont.addEventListener("dragenter", dragLayerEnter)
layersCont.addEventListener("dragleave", dragLayerLeave)
layersCont.addEventListener("drop", dropLayer)
layersCont.addEventListener("dragend", dragLayerEnd)

//===================================//
//======= * * * Canvas * * * ========//
//===================================//

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
  //Parameters
  onScreenCVS,
  onScreenCTX,
  unsharpenedWidth,
  unsharpenedHeight,
  sharpness,
  zoom,
  zoomAtLastDraw: zoom,
  offScreenCVS,
  offScreenCTX,
  //Layers
  layers: [], //(types: raster, vector, reference)
  currentLayer: null,
  //Cursor
  mouseEvent: "none",
  //Coordinates
  //for moving canvas/ grab
  xOffset: 0,
  yOffset: 0,
  previousXOffset: 0,
  previousYOffset: 0,
  //Functions
  draw,
  consolidateLayers,
  addRasterLayer,
  renderLayersToDOM,
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
    canvas.xOffset,
    canvas.yOffset,
    canvas.unsharpenedWidth,
    canvas.unsharpenedHeight
  )
  drawLayers()
  //draw border
  canvas.onScreenCTX.beginPath()
  canvas.onScreenCTX.rect(
    canvas.xOffset - 1,
    canvas.yOffset - 1,
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
          canvas.xOffset +
            (l.x * canvas.unsharpenedWidth) / canvas.offScreenCVS.width,
          canvas.yOffset +
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
          canvas.xOffset +
            (l.x * canvas.unsharpenedWidth) / canvas.offScreenCVS.width,
          canvas.yOffset +
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

function layerInteract(e) {
  let layer = e.target.closest(".layer").layerObj
  //toggle visibility
  if (e.target.className.includes("hide")) {
    if (e.target.childNodes[0].className.includes("eyeopen")) {
      e.target.childNodes[0].className = "eyeclosed icon"
      layer.opacity = 0
    } else if (e.target.childNodes[0].className.includes("eyeclosed")) {
      e.target.childNodes[0].className = "eyeopen icon"
      layer.opacity = 1
    }
  } else {
    //select current layer
    if (layer.type === "raster") {
      canvas.currentLayer = layer
      renderLayersToDOM()
    }
  }
  canvas.draw()
}

//Drag layers
function dragLayerStart(e) {
  let layer = e.target.closest(".layer").layerObj
  let index = canvas.layers.indexOf(layer)
  //pass index through event
  e.dataTransfer.setData("text", index)
  e.target.style.boxShadow =
    "inset 2px 0px rgb(131, 131, 131), inset -2px 0px rgb(131, 131, 131), inset 0px -2px rgb(131, 131, 131), inset 0px 2px rgb(131, 131, 131)"
}

function dragLayerOver(e) {
  e.preventDefault()
}

function dragLayerEnter(e) {
  if (e.target.className.includes("layer")) {
    e.target.style.boxShadow =
      "inset 2px 0px rgb(255, 255, 255), inset -2px 0px rgb(255, 255, 255), inset 0px -2px rgb(255, 255, 255), inset 0px 2px rgb(255, 255, 255)"
  }
}

function dragLayerLeave(e) {
  if (e.target.className.includes("layer")) {
    e.target.style.boxShadow =
      "inset 2px 0px rgb(131, 131, 131), inset -2px 0px rgb(131, 131, 131), inset 0px -2px rgb(131, 131, 131), inset 0px 2px rgb(131, 131, 131)"
  }
}

function dropLayer(e) {
  let targetLayer = e.target.closest(".layer").layerObj
  let draggedIndex = parseInt(e.dataTransfer.getData("text"))
  let heldLayer = canvas.layers[draggedIndex]
  //TODO: add layer change to timeline
  if (e.target.className.includes("layer") && targetLayer !== heldLayer) {
    for (let i = 0; i < layersCont.children.length; i += 1) {
      if (layersCont.children[i] === e.target) {
        let newIndex = canvas.layers.indexOf(layersCont.children[i].layerObj)
        canvas.layers.splice(draggedIndex, 1)
        canvas.layers.splice(newIndex, 0, heldLayer)
      }
    }
    renderLayersToDOM()
    canvas.draw()
  }
}

function dragLayerEnd(e) {
  renderLayersToDOM()
}

function addRasterLayer() {
  //TODO: add to timeline.
  //once layer is added and drawn on, can no longer be deleted
  let layerCVS = document.createElement("canvas")
  let layerCTX = layerCVS.getContext("2d")
  layerCVS.width = canvas.offScreenCVS.width
  layerCVS.height = canvas.offScreenCVS.height
  let layer = {
    type: "raster",
    title: `Layer ${canvas.layers.length + 1}`,
    cvs: layerCVS,
    ctx: layerCTX,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    removed: false,
  }
  canvas.layers.push(layer)
  state.addToTimeline("addlayer", 0, 0, layer)
  state.undoStack.push(state.points)
  state.points = []
  state.redoStack = []
  renderLayersToDOM()
}

function addReferenceLayer() {
  //TODO: add to timeline
  let reader
  let img = new Image()

  if (this.files && this.files[0]) {
    reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target.result
      img.onload = () => {
        //constrain background image to canvas with scale
        let scale =
          canvas.unsharpenedWidth / img.width >
          canvas.unsharpenedHeight / img.height
            ? canvas.unsharpenedHeight / img.height
            : canvas.unsharpenedWidth / img.width
        let layer = {
          type: "reference",
          title: `Reference ${canvas.layers.length + 1}`,
          img: img,
          x: 0,
          y: 0,
          scale: scale,
          opacity: 1,
          removed: false,
        }
        canvas.layers.unshift(layer)
        renderLayersToDOM()
        canvas.draw()
      }
    }

    reader.readAsDataURL(this.files[0])
  }
}

function removeLayer(e) {
  //set "removed" flag to true on selected layer
  //add to timeline
  let layer = e.target.closest(".layer").layerObj
  layer.removed = true
}

function renderLayersToDOM() {
  layersCont.innerHTML = ""
  let id = 0
  canvas.layers.forEach((l) => {
    if (!l.removed) {
      let layerElement = document.createElement("div")
      layerElement.className = `layer ${l.type}`
      layerElement.id = id
      id += 1
      layerElement.textContent = l.title
      layerElement.draggable = true
      if (l === canvas.currentLayer) {
        layerElement.style.background = "rgb(255, 255, 255)"
        layerElement.style.color = "rgb(0, 0, 0)"
      }
      let hide = document.createElement("div")
      hide.className = "hide btn"
      let eye = document.createElement("span")
      if (l.opacity === 0) {
        eye.className = "eyeclosed icon"
      } else {
        eye.className = "eyeopen icon"
      }
      hide.appendChild(eye)
      layerElement.appendChild(hide)
      layersCont.appendChild(layerElement)
      //associate object
      layerElement.layerObj = l
    }
  })
}

//add move tool and scale tool for reference layers

// QUESTION: How to deal with undo/redo when deleting a layer?
//If a layer is removed, actions associated with that layer will be removed
//and can't easily be added back in the correct order.

//vector layers have an option to create a raster copy layer

//vector layers need movable control points, how to organize order of added control points?
