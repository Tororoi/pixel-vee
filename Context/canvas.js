import { state } from "./state.js"
import { initializeDialogBox } from "../utils/drag.js"
import {
  actionDraw,
  actionLine,
  actionFill,
  actionQuadraticCurve,
  actionCubicCurve,
  actionEllipse,
} from "../Tools/actions.js"

//===================================//
//==== * * * DOM Interface * * * ====//
//===================================//

// * Layers Interface * //
const uploadBtn = document.querySelector("#file-upload")
const newLayerBtn = document.querySelector(".new-raster-layer")

const layersContainer = document.querySelector(".layers")
const layersInterfaceContainer = document.querySelector(".layers-interface")
initializeDialogBox(layersInterfaceContainer)

// * Vectors Interface * //
const vectorsContainer = document.querySelector(".vectors")
const vectorsInterfaceContainer = document.querySelector(".vectors-interface")
initializeDialogBox(vectorsInterfaceContainer)

// * Canvas Size * //
const sizeContainer = document.querySelector(".size-container")
initializeDialogBox(sizeContainer)

const dimensionsForm = document.querySelector(".dimensions-form")
const canvasWidth = document.getElementById("canvas-width")
const canvasHeight = document.getElementById("canvas-height")

//===================================//
//======= * * * Canvas * * * ========//
//===================================//

//Set gui canvas and its context
const vectorGuiCVS = document.getElementById("vectorGui")
const vectorGuiCTX = vectorGuiCVS.getContext("2d")
vectorGuiCTX.willReadFrequently = true
const rasterGuiCVS = document.getElementById("rasterGui")
const rasterGuiCTX = rasterGuiCVS.getContext("2d")
rasterGuiCTX.willReadFrequently = true
//Set onscreen canvas and its context
const onScreenCVS = document.getElementById("onScreen")
const onScreenCTX = onScreenCVS.getContext("2d")
onScreenCTX.willReadFrequently = true
//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
const offScreenCVS = document.createElement("canvas")
const offScreenCTX = offScreenCVS.getContext("2d")
offScreenCTX.willReadFrequently = true
//Set the dimensions of the drawing canvas
offScreenCVS.width = 256
offScreenCVS.height = 256
//improve sharpness
//BUG: sharpness (8+) greatly affects performance in browsers other than chrome (can safari and firefox not handle large canvases?)
//window.devicePixelRatio is typically 2
const sharpness = window.devicePixelRatio
//adjust canvas ratio here if needed
vectorGuiCVS.width = vectorGuiCVS.offsetWidth * sharpness
vectorGuiCVS.height = vectorGuiCVS.offsetHeight * sharpness
rasterGuiCVS.width = rasterGuiCVS.offsetWidth * sharpness
rasterGuiCVS.height = rasterGuiCVS.offsetHeight * sharpness
onScreenCVS.width = onScreenCVS.offsetWidth * sharpness
onScreenCVS.height = onScreenCVS.offsetHeight * sharpness
//zoom
const setInitialZoom = (width) => {
  const ratio = 256 / width
  switch (true) {
    case ratio >= 8:
      return 16
    case ratio >= 4:
      return 8
    case ratio >= 2:
      return 4
    case ratio >= 1:
      return 2
    default:
      return 1
  }
}
const zoom = setInitialZoom(offScreenCVS.width) //zoom level should be based on absolute pixel size, not window relative to canvas
vectorGuiCTX.scale(sharpness * zoom, sharpness * zoom)
rasterGuiCTX.scale(sharpness * zoom, sharpness * zoom)
onScreenCTX.scale(sharpness * zoom, sharpness * zoom)

//Initialize offset, must be integer
const xOffset = Math.round(
  (onScreenCVS.width / sharpness / zoom - offScreenCVS.width) / 2
)
const yOffset = Math.round(
  (onScreenCVS.height / sharpness / zoom - offScreenCVS.height) / 2
)

//for adjusting canvas size, adjust onscreen canvas dimensions in proportion to offscreen
//Initialize size values
canvasWidth.value = offScreenCVS.width
canvasHeight.value = offScreenCVS.height

//====================================//
//======== * * * State * * * =========//
//====================================//

//Export canvas state
export const canvas = {
  //Parameters
  vectorGuiCVS,
  vectorGuiCTX,
  rasterGuiCVS,
  rasterGuiCTX,
  onScreenCVS,
  onScreenCTX,
  sharpness,
  zoom,
  zoomAtLastDraw: zoom,
  offScreenCVS,
  offScreenCTX,
  //Layers
  layers: [], //(types: raster, vector, reference)
  currentLayer: null,
  tempLayer: null,
  bgColor: "rgba(131, 131, 131, 0.5)",
  borderColor: "black",
  //Cursor
  pointerEvent: "none",
  sizePointerState: "none",
  //Coordinates
  //for moving canvas/ grab
  xOffset: xOffset,
  yOffset: yOffset,
  previousXOffset: xOffset,
  previousYOffset: yOffset,
  subPixelX: null,
  subPixelY: null,
  zoomPixelX: null,
  zoomPixelY: null,
  //Functions
  draw,
  drawLayers,
  redrawPoints,
  consolidateLayers,
  createNewRasterLayer,
  addRasterLayer,
  renderLayersToDOM,
  getColor,
  setInitialZoom,
}

//====================================//
//======== * * * Canvas * * * ========//
//====================================//

const handleIncrement = (e) => {
  let dimension = e.target.parentNode.previousSibling.previousSibling
  let max = 800
  let min = 8
  if (e.target.id === "inc") {
    let newValue = Math.floor(+dimension.value)
    if (newValue < max) {
      dimension.value = newValue + 1
    }
  } else if (e.target.id === "dec") {
    let newValue = Math.floor(+dimension.value)
    if (newValue > min) {
      dimension.value = newValue - 1
    }
  }
}

/**
 * increment values while rgb button is held down
 * @param {event} e
 */
const handleSizeIncrement = (e) => {
  if (canvas.sizePointerState === "pointerdown") {
    handleIncrement(e)
    window.setTimeout(() => handleSizeIncrement(e), 150)
  }
}

const restrictSize = (e) => {
  const max = 800
  const min = 8
  if (e.target.value > max) {
    e.target.value = max
  } else if (e.target.value < min) {
    e.target.value = min
  }
}

const resizeOffScreenCanvas = (width, height) => {
  canvas.offScreenCVS.width = width
  canvas.offScreenCVS.height = height
  //reset canvas state
  canvas.zoom = setInitialZoom(canvas.offScreenCVS.width)
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.rasterGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.onScreenCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.xOffset = Math.round(
    (canvas.onScreenCVS.width / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.width) /
      2
  )
  canvas.yOffset = Math.round(
    (canvas.onScreenCVS.height / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.height) /
      2
  )
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  canvas.subPixelX = null
  canvas.subPixelY = null
  canvas.zoomPixelX = null
  canvas.zoomPixelY = null
  //resize layers. Per function, it's cheaper to run this inside the existing iterator in drawLayers, but since drawLayers runs so often, it's preferable to only run this here where it's needed.
  canvas.layers.forEach((l) => {
    if (
      l.cvs.width !== canvas.offScreenCVS.width ||
      l.cvs.height !== canvas.offScreenCVS.height
    ) {
      l.cvs.width = canvas.offScreenCVS.width
      l.cvs.height = canvas.offScreenCVS.height
    }
  })
  canvas.redrawPoints()
  canvas.draw()
}

const handleDimensionsSubmit = (e) => {
  e.preventDefault()
  resizeOffScreenCanvas(canvasWidth.value, canvasHeight.value)
}

export const resizeOnScreenCanvas = () => {
  //Keep canvas dimensions at 100% (requires css style width/ height 100%)
  canvas.vectorGuiCVS.width = canvas.vectorGuiCVS.offsetWidth * sharpness
  canvas.vectorGuiCVS.height = canvas.vectorGuiCVS.offsetHeight * sharpness
  canvas.vectorGuiCTX.setTransform(
    sharpness * zoom,
    0,
    0,
    sharpness * zoom,
    0,
    0
  )
  canvas.rasterGuiCVS.width = canvas.rasterGuiCVS.offsetWidth * sharpness
  canvas.rasterGuiCVS.height = canvas.rasterGuiCVS.offsetHeight * sharpness
  canvas.rasterGuiCTX.setTransform(
    sharpness * zoom,
    0,
    0,
    sharpness * zoom,
    0,
    0
  )
  canvas.onScreenCVS.width = canvas.onScreenCVS.offsetWidth * sharpness
  canvas.onScreenCVS.height = canvas.onScreenCVS.offsetHeight * sharpness
  canvas.onScreenCTX.setTransform(
    sharpness * zoom,
    0,
    0,
    sharpness * zoom,
    0,
    0
  )
  canvas.draw()
}

resizeOnScreenCanvas()

//FIX: Improve performance by keeping track of "redraw regions" instead of redrawing the whole thing.
//Draw Canvas
function draw() {
  //clear canvas
  canvas.onScreenCTX.clearRect(
    0,
    0,
    canvas.onScreenCVS.width / canvas.zoom,
    canvas.onScreenCVS.height / canvas.zoom
  )
  //Prevent blurring
  canvas.onScreenCTX.imageSmoothingEnabled = false
  //fill background with neutral gray
  canvas.onScreenCTX.fillStyle = canvas.bgColor
  canvas.onScreenCTX.fillRect(
    0,
    0,
    canvas.onScreenCVS.width / canvas.zoom,
    canvas.onScreenCVS.height / canvas.zoom
  )
  //BUG: How to mask outside drawing space?
  //clear drawing space
  canvas.onScreenCTX.clearRect(
    canvas.xOffset,
    canvas.yOffset,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
  drawLayers(canvas.onScreenCTX)
  //draw border
  canvas.onScreenCTX.beginPath()
  canvas.onScreenCTX.rect(
    canvas.xOffset - 1,
    canvas.yOffset - 1,
    canvas.offScreenCVS.width + 2,
    canvas.offScreenCVS.height + 2
  )
  canvas.onScreenCTX.lineWidth = 2
  canvas.onScreenCTX.strokeStyle = canvas.borderColor
  canvas.onScreenCTX.stroke()
}

function redrawPoints() {
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    action.forEach((p) => {
      switch (p.tool) {
        case "addlayer":
          p.layer.removed = false
          canvas.renderLayersToDOM()
          break
        case "clear":
          p.layer.ctx.clearRect(
            0,
            0,
            canvas.offScreenCVS.width,
            canvas.offScreenCVS.height
          )
          break
        case "fill":
          actionFill(p.x, p.y, p.color, p.layer.ctx, p.mode)
          break
        case "line":
          actionLine(
            p.x.px1,
            p.y.py1,
            p.x.px2,
            p.y.py2,
            p.color,
            p.layer.ctx,
            p.mode,
            p.brush,
            p.weight
          )
          break
        case "quadCurve":
          actionQuadraticCurve(
            p.x.px1,
            p.y.py1,
            p.x.px2,
            p.y.py2,
            p.x.px3,
            p.y.py3,
            3,
            p.opacity === 0
              ? { color: "rgba(0,0,0,0)", r: 0, g: 0, b: 0, a: 0 }
              : p.color,
            p.layer.ctx,
            p.mode,
            p.brush,
            p.weight
          )
          break
        case "cubicCurve":
          //TODO: pass source on history objects to avoid debugging actions from the timeline unless desired
          actionCubicCurve(
            p.x.px1,
            p.y.py1,
            p.x.px2,
            p.y.py2,
            p.x.px3,
            p.y.py3,
            p.x.px4,
            p.y.py4,
            4,
            p.opacity === 0
              ? { color: "rgba(0,0,0,0)", r: 0, g: 0, b: 0, a: 0 }
              : p.color,
            p.layer.ctx,
            p.mode,
            p.brush,
            p.weight
          )
          break
        case "ellipse":
          actionEllipse(
            p.x.px1,
            p.y.py1,
            p.x.px2,
            p.y.py2,
            p.x.px3,
            p.y.py3,
            p.properties.radA,
            p.properties.radB,
            2,
            p.opacity === 0
              ? { color: "rgba(0,0,0,0)", r: 0, g: 0, b: 0, a: 0 }
              : p.color,
            p.layer.ctx,
            p.mode,
            p.brush,
            p.weight
          )
          break
        case "replace":
          p.layer.ctx.drawImage(
            p.properties.image,
            0,
            0,
            p.properties.width,
            p.properties.height
          )
          break
        default:
          actionDraw(p.x, p.y, p.color, p.brush, p.weight, p.layer.ctx, p.mode)
      }
    })
  })
  state.redoStack.forEach((action) => {
    action.forEach((p) => {
      if (p.tool === "addlayer") {
        p.layer.removed = true
        if (p.layer === canvas.currentLayer) {
          canvas.currentLayer = layersCont.children[0].layerObj
        }
        canvas.renderLayersToDOM()
      }
    })
  })
}

//====================================//
//======== * * * Layers * * * ========//
//====================================//

function drawLayers(ctx) {
  canvas.layers.forEach((l) => {
    if (!l.removed) {
      if (l.type === "reference") {
        ctx.save()
        ctx.globalAlpha = l.opacity
        //l.x, l.y need to be normalized to the pixel grid
        ctx.drawImage(
          l.img,
          canvas.xOffset +
            (l.x * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          canvas.yOffset +
            (l.y * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          l.img.width * l.scale,
          l.img.height * l.scale
        )
        ctx.restore()
      } else {
        ctx.save()
        ctx.globalAlpha = l.opacity
        //l.x, l.y need to be normalized to the pixel grid
        ctx.drawImage(
          l.cvs,
          canvas.xOffset +
            (l.x * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          canvas.yOffset +
            (l.y * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height
        )
        ctx.restore()
      }
    }
  })
}

//Draw all layers onto offscreen canvas to prepare for sampling or export
function consolidateLayers() {
  canvas.layers.forEach((l) => {
    if (l.type === "raster" && l.opacity > 0) {
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
      e.target.childNodes[0].classList.remove("eyeopen")
      e.target.childNodes[0].classList.add("eyeclosed")
      layer.opacity = 0
    } else if (e.target.childNodes[0].className.includes("eyeclosed")) {
      e.target.childNodes[0].classList.remove("eyeclosed")
      e.target.childNodes[0].classList.add("eyeopen")
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
    for (let i = 0; i < layersContainer.children.length; i += 1) {
      if (layersContainer.children[i] === e.target) {
        let newIndex = canvas.layers.indexOf(
          layersContainer.children[i].layerObj
        )
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

function createNewRasterLayer(name) {
  let layerCVS = document.createElement("canvas")
  let layerCTX = layerCVS.getContext("2d")
  layerCTX.willReadFrequently = true
  layerCVS.width = canvas.offScreenCVS.width
  layerCVS.height = canvas.offScreenCVS.height
  let layer = {
    type: "raster",
    title: name,
    cvs: layerCVS,
    ctx: layerCTX,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    removed: false,
  }
  return layer
}

function addRasterLayer() {
  //once layer is added to timeline and drawn on, can no longer be deleted
  const layer = createNewRasterLayer(`Layer ${canvas.layers.length + 1}`)
  canvas.layers.push(layer)
  state.addToTimeline({ tool: "addlayer", layer })
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
          canvas.offScreenCVS.width / img.width >
          canvas.offScreenCVS.height / img.height
            ? canvas.offScreenCVS.height / img.height
            : canvas.offScreenCVS.width / img.width
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
  //set "removed" flag to true on selected layer. NOTE: Currently not implemented
  //TODO: add to timeline
  let layer = e.target.closest(".layer").layerObj
  layer.removed = true
}

function renderLayersToDOM() {
  layersContainer.innerHTML = ""
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
      eye.classList.add("eye")
      if (l.opacity === 0) {
        eye.classList.add("eyeclosed")
      } else {
        eye.classList.add("eyeopen")
      }
      hide.appendChild(eye)
      layerElement.appendChild(hide)
      layersContainer.appendChild(layerElement)
      //associate object
      layerElement.layerObj = l
    }
  })
}

//====================================//
//======== * * * Colors * * * ========//
//====================================//

/**
 * Get color of pixel at x/y coordinates
 * @param {integer} x
 * @param {integer} y
 * @param {ImageData} colorLayer
 * @returns {string} rgba color
 * dependencies - none
 */
function getColor(x, y, colorLayer) {
  let canvasColor = {}

  let startPos = (y * colorLayer.width + x) * 4
  //clicked color
  canvasColor.r = colorLayer.data[startPos]
  canvasColor.g = colorLayer.data[startPos + 1]
  canvasColor.b = colorLayer.data[startPos + 2]
  canvasColor.a = colorLayer.data[startPos + 3]
  canvasColor.color = `rgba(${canvasColor.r},${canvasColor.g},${canvasColor.b},${canvasColor.a})`
  return canvasColor
}

//add move tool and scale tool for reference layers

// QUESTION: How to deal with undo/redo when deleting a layer?
//If a layer is removed, actions associated with that layer will be removed
//and can't easily be added back in the correct order.

//vector layers have an option to create a raster copy layer

//vector layers need movable control points, how to organize order of added control points?

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

// * Canvas * //
dimensionsForm.addEventListener("pointerdown", (e) => {
  canvas.sizePointerState = e.type
  handleSizeIncrement(e)
})
dimensionsForm.addEventListener("pointerup", (e) => {
  canvas.sizePointerState = e.type
})
dimensionsForm.addEventListener("pointerout", (e) => {
  canvas.sizePointerState = e.type
})
dimensionsForm.addEventListener("submit", handleDimensionsSubmit)
canvasWidth.addEventListener("blur", restrictSize)
canvasHeight.addEventListener("blur", restrictSize)

// * Layers * //
uploadBtn.addEventListener("change", addReferenceLayer)
newLayerBtn.addEventListener("click", addRasterLayer)

layersContainer.addEventListener("click", layerInteract)

layersContainer.addEventListener("dragstart", dragLayerStart)
layersContainer.addEventListener("dragover", dragLayerOver)
layersContainer.addEventListener("dragenter", dragLayerEnter)
layersContainer.addEventListener("dragleave", dragLayerLeave)
layersContainer.addEventListener("drop", dropLayer)
layersContainer.addEventListener("dragend", dragLayerEnd)
