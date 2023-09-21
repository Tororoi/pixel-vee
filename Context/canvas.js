import { handleTools } from "../index.js"
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
import { tools } from "../Tools/index.js"
import { getAngle } from "../utils/trig.js"
import { vectorGuiState, renderVectorGUI } from "../GUI/vector.js"
import { colorPickerContainer } from "./swatch.js"

//===================================//
//==== * * * DOM Interface * * * ====//
//===================================//

// * Sidebar Menu * //
const sidebarContainer = document.querySelector(".sidebar")
initializeDialogBox(sidebarContainer)

// * Toolbox * //
const toolboxContainer = document.querySelector(".toolbox")
initializeDialogBox(toolboxContainer)

// * Brush * //
const brushContainer = document.querySelector(".brush-container")
initializeDialogBox(brushContainer)

// * Layers Interface * //
const uploadBtn = document.querySelector("#file-upload")
const newLayerBtn = document.querySelector(".new-raster-layer")

const layersContainer = document.querySelector(".layers")
const layersInterfaceContainer = document.querySelector(".layers-interface")
initializeDialogBox(layersInterfaceContainer)

// * Vectors Interface * //
const vectorsThumbnails = document.querySelector(".vectors")
const vectorsContainer = document.querySelector(".vectors-container") //dynamically set max height based on height of page minus other menu boxes heights
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
//thumbnail canvas for making images from canvas actions
const thumbnailCVS = document.createElement("canvas")
const thumbnailCTX = thumbnailCVS.getContext("2d")
thumbnailCTX.willReadFrequently = true
thumbnailCVS.width = 256
thumbnailCVS.height = 256
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
thumbnailCTX.scale(sharpness, sharpness)

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
  thumbnailCVS,
  thumbnailCTX,
  //Layers
  layers: [], //(types: raster, vector, reference)
  currentLayer: null,
  tempLayer: null,
  bgColor: "rgba(131, 131, 131, 0.5)",
  borderColor: "black",
  //Vectors
  currentVectorIndex: null,
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
  previousSubPixelX: null,
  previousSubPixelY: null,
  zoomPixelX: null,
  zoomPixelY: null,
  //Functions
  draw,
  drawLayers,
  redrawPoints,
  render,
  consolidateLayers,
  createNewRasterLayer,
  addRasterLayer,
  renderLayersToDOM,
  renderVectorsToDOM,
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
  // canvas.thumbnailCVS.width = canvas.offScreenCVS.width
  // canvas.thumbnailCVS.height = canvas.offScreenCVS.height
  //reset canvas state
  canvas.zoom = setInitialZoom(
    Math.max(canvas.offScreenCVS.width, canvas.offScreenCVS.height)
  )
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
  renderVectorGUI(state, canvas)
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
  // reset positioning styles for free moving dialog boxes
  toolboxContainer.style.left = ""
  toolboxContainer.style.top = ""
  sidebarContainer.style.left = ""
  sidebarContainer.style.top = ""
  colorPickerContainer.style.left = ""
  colorPickerContainer.style.top = ""
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

/**
 *
 * @param {*} index - optional parameter to limit render up to a specific action
 */
function redrawPoints(index = null) {
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    if (index && i > index) {
      return
    }
    i++
    action.forEach((p) => {
      switch (p.tool.name) {
        case "addLayer":
          p.layer.removed = false
          canvas.renderLayersToDOM()
          canvas.renderVectorsToDOM()
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
          if (p.hidden) {
            break
          }
          actionFill(p.x.px1, p.y.py1, p.color, p.layer.ctx, p.mode)
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
          if (p.hidden) {
            break
          }
          actionQuadraticCurve(
            p.x.px1,
            p.y.py1,
            p.x.px2,
            p.y.py2,
            p.x.px3,
            p.y.py3,
            3,
            p.color,
            p.layer.ctx,
            p.mode,
            p.brush,
            p.weight
          )
          break
        case "cubicCurve":
          if (p.hidden) {
            break
          }
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
            p.color,
            p.layer.ctx,
            p.mode,
            p.brush,
            p.weight
          )
          break
        case "ellipse":
          if (p.hidden) {
            break
          }
          actionEllipse(
            p.x.px1,
            p.y.py1,
            p.x.px2,
            p.y.py2,
            p.x.px3,
            p.y.py3,
            p.properties.radA,
            p.properties.radB,
            p.properties.forceCircle,
            p.color,
            p.layer.ctx,
            p.mode,
            p.brush,
            p.weight,
            1,
            p.properties.angle,
            p.properties.offset,
            p.properties.x1Offset,
            p.properties.y1Offset
          )
          break
        case "replace":
          //TODO IMPORTANT: drawing an image is not compatible with vector concept.
          //Any previous vectors would be fully rasterized.
          //Even if image only depicts replaced pixels, those that were replaced cannot be moved.
          //Tool needs to be reworked for only raster and force users to convert vectors to raster before using replace tool on them.
          // For example, the program would assemble the canvas without vector renders and replacing black with teal would succeed on raster pixels.
          //Then, any vector pixels on top of replaced pixels would be still rendered in black.
          //maybe a separate tool could exist for replacing vector pixels as a modification of one vector, as if the vector's render acts as a mask.
          //maybe collision detection could be used somehow? probably expensive.
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
      if (p.tool.name === "addLayer") {
        p.layer.removed = true
        if (p.layer === canvas.currentLayer) {
          canvas.currentLayer = layersCont.children[0].layerObj
        }
        canvas.renderLayersToDOM()
        canvas.renderVectorsToDOM()
      }
    })
  })
}

/**
 *
 * @param {*} index - optional parameter to limit render up to a specific action
 */
function render(index) {
  canvas.layers.forEach((l) => {
    if (l.type === "raster") {
      l.ctx.clearRect(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
    }
  })
  canvas.redrawPoints(index)
  canvas.draw()
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
  state.addToTimeline({ tool: tools.addLayer, layer })
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

//Vectors
function vectorInteract(e) {
  let vector = e.target.closest(".vector").vectorObj
  //toggle visibility
  if (e.target.className.includes("hide")) {
    if (e.target.childNodes[0].className.includes("eyeopen")) {
      e.target.childNodes[0].classList.remove("eyeopen")
      e.target.childNodes[0].classList.add("eyeclosed")
      vector.opacity = 0
    } else if (e.target.childNodes[0].className.includes("eyeclosed")) {
      e.target.childNodes[0].classList.remove("eyeclosed")
      e.target.childNodes[0].classList.add("eyeopen")
      vector.opacity = 1
    }
  } else {
    //switch tool
    handleTools(null, vector.tool.name)
    //select current vector
    //TODO: modify object structure of states to match object in undoStack to make assignment simpler like vectorGuiState.x = {...vector.x}
    vectorGuiState.reset(canvas)
    vectorGuiState.px1 = vector.x.px1
    vectorGuiState.py1 = vector.y.py1
    vectorGuiState.px2 = vector.x.px2
    vectorGuiState.py2 = vector.y.py2
    vectorGuiState.px3 = vector.x.px3
    vectorGuiState.py3 = vector.y.py3
    vectorGuiState.px4 = vector.x.px4
    vectorGuiState.py4 = vector.y.py4
    vectorGuiState.radA = vector.properties?.radA
    vectorGuiState.radB = vector.properties?.radB
    // if (vector.type === "raster") {
    canvas.currentVectorIndex = vector.index
    state.angle = vector.properties?.angle
    state.angleOffset = 0
    state.x1Offset = vector.properties?.x1Offset
    state.y1Offset = vector.properties?.y1Offset
    state.offset = vector.properties?.offset
    renderVectorGUI(state, canvas)
    //BUG: renderVectorsToDOM resets scroll, so figure out way to only modify existing DOM. Layers doesn't do this, why?
    renderVectorsToDOM()
    // }
  }
  // canvas.draw()
}

function renderVectorsToDOM() {
  vectorsThumbnails.innerHTML = ""
  state.undoStack.forEach((action) => {
    let p = action[0]
    if (p.tool.type === "vector") {
      p.index = state.undoStack.indexOf(action)
      let vectorElement = document.createElement("div")
      vectorElement.className = `vector ${p.index}`
      vectorElement.id = p.index
      vectorsThumbnails.appendChild(vectorElement)
      vectorElement.draggable = true
      canvas.thumbnailCTX.clearRect(
        0,
        0,
        canvas.thumbnailCVS.width,
        canvas.thumbnailCVS.height
      )
      //TODO: find a way to constrain coordinates to fit canvas viewing area for maximum size of vector without changing the size of the canvas for each vector thumbnail
      // Save minima and maxima for x and y plotted coordinates to get the bounding box when plotting the curve. Then, here we can constrain the coords to fit a maximal bounding box in the thumbnail canvas
      thumbnailCTX.lineWidth = 2
      let wd = canvas.thumbnailCVS.width / sharpness / canvas.offScreenCVS.width
      let hd =
        canvas.thumbnailCVS.height / sharpness / canvas.offScreenCVS.height
      //get the minimum dimension ratio
      let minD = Math.min(wd, hd)
      // thumbnailCTX.strokeStyle = p.color.color
      canvas.thumbnailCTX.strokeStyle = "black"
      canvas.thumbnailCTX.beginPath()
      //TODO: line tool and fill tool to be added as vectors. Behavior of replace tool is like a mask, so the replaced pixels are static coordinates.
      if (p.tool.name === "fill") {
        canvas.thumbnailCTX.arc(
          minD * p.x.px1 + 0.5,
          minD * p.y.py1 + 0.5,
          1,
          0,
          2 * Math.PI,
          true
        )
      } else if (p.tool.name === "quadCurve") {
        canvas.thumbnailCTX.moveTo(minD * p.x.px1 + 0.5, minD * p.y.py1 + 0.5)
        canvas.thumbnailCTX.quadraticCurveTo(
          minD * p.x.px3 + 0.5,
          minD * p.y.py3 + 0.5,
          minD * p.x.px2 + 0.5,
          minD * p.y.py2 + 0.5
        )
      } else if (p.tool.name === "cubicCurve") {
        canvas.thumbnailCTX.moveTo(minD * p.x.px1 + 0.5, minD * p.y.py1 + 0.5)
        canvas.thumbnailCTX.bezierCurveTo(
          minD * p.x.px3 + 0.5,
          minD * p.y.py3 + 0.5,
          minD * p.x.px4 + 0.5,
          minD * p.y.py4 + 0.5,
          minD * p.x.px2 + 0.5,
          minD * p.y.py2 + 0.5
        )
      } else if (p.tool.name === "ellipse") {
        let angle = getAngle(p.x.px2 - p.x.px1, p.y.py2 - p.y.py1)
        canvas.thumbnailCTX.ellipse(
          minD * p.x.px1,
          minD * p.y.py1,
          minD * p.properties.radA,
          minD * p.properties.radB,
          angle,
          0,
          2 * Math.PI
        )
      }
      canvas.thumbnailCTX.stroke()
      if (p.index === canvas.currentVectorIndex) {
        canvas.thumbnailCTX.fillStyle = "rgb(0, 0, 0)"
      } else {
        canvas.thumbnailCTX.fillStyle = "rgb(51, 51, 51)"
      }
      canvas.thumbnailCTX.fillRect(
        minD * canvas.offScreenCVS.width,
        0,
        thumbnailCVS.width,
        thumbnailCVS.height
      )
      canvas.thumbnailCTX.fillRect(
        0,
        minD * canvas.offScreenCVS.height,
        thumbnailCVS.width,
        thumbnailCVS.height
      )
      let thumb = new Image()
      thumb.src = canvas.thumbnailCVS.toDataURL()
      // vectorElement.appendChild(thumbnailCVS)
      vectorElement.appendChild(thumb)
      let tool = document.createElement("div")
      tool.className = "tool btn"
      let icon = document.createElement("div")
      icon.className = p.tool.name
      if (p.index === canvas.currentVectorIndex) {
        tool.style.background = "rgb(255, 255, 255)"
        vectorElement.style.background = "rgb(0, 0, 0)"
      } else {
        vectorElement.style.background = "rgb(51, 51, 51)"
      }
      tool.appendChild(icon)
      vectorElement.appendChild(tool)
      let color = document.createElement("div") //TODO: make clickable and color can be rechosen via colorpicker
      color.className = "actionColor btn"
      color.style.background = p.color.color
      vectorElement.appendChild(color)
      // thumbnailCVS.width = thumbnailCVS.offsetWidth * sharpness
      // thumbnailCVS.height = thumbnailCVS.offsetHeight * sharpness
      // thumbnailCTX.scale(sharpness * 1, sharpness * 1)

      //associate object
      vectorElement.vectorObj = p
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

// * Vectors * //
vectorsThumbnails.addEventListener("click", vectorInteract)
