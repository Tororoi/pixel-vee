import { dom } from "../DOM/dom.js"
import {
  draw,
  redrawPoints,
  render,
  setInitialZoom,
} from "../Canvas/functions.js"
import { handleTools } from "../index.js"
import { state } from "./state.js"
import { initializeDialogBox } from "../utils/drag.js"
import {
  removeAction,
  actionDraw,
  actionLine,
  actionFill,
  actionQuadraticCurve,
  actionCubicCurve,
  actionEllipse,
} from "../Tools/actions.js"
import { tools } from "../Tools/index.js"
import { getAngle } from "../utils/trig.js"
import { vectorGui } from "../GUI/vector.js"
import { swatches, colorPickerContainer } from "./swatch.js"

//===================================//
//==== * * * DOM Interface * * * ====//
//===================================//

// * Sidebar Menu * //
initializeDialogBox(dom.sidebarContainer)

// * Toolbox * //
initializeDialogBox(dom.toolboxContainer)

// * Brush * //
initializeDialogBox(dom.brushContainer)

// * Layers Interface * //
initializeDialogBox(dom.layersInterfaceContainer)

// * Vectors Interface * //
initializeDialogBox(dom.vectorsInterfaceContainer)

// * Canvas Size * //
initializeDialogBox(dom.sizeContainer)

//===================================//
//======= * * * Canvas * * * ========//
//===================================//

//Set gui canvas and its context
const vectorGuiCVS = document.getElementById("vectorGui")
const vectorGuiCTX = vectorGuiCVS.getContext("2d")
const rasterGuiCVS = document.getElementById("rasterGui")
const rasterGuiCTX = rasterGuiCVS.getContext("2d")
//Set onscreen canvas and its context
const onScreenCVS = document.getElementById("onScreen")
const onScreenCTX = onScreenCVS.getContext("2d")
//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
const offScreenCVS = document.createElement("canvas")
const offScreenCTX = offScreenCVS.getContext("2d")
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
  rasterGuiCVS,
  rasterGuiCTX,
  onScreenCVS,
  onScreenCTX,
  offScreenCVS,
  offScreenCTX,
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
  //Functions
  draw,
  setInitialZoom,
  redrawPoints,
  render,
  //
  consolidateLayers,
  createNewRasterLayer,
  addRasterLayer,
  renderLayersToDOM,
  renderVectorsToDOM,
  getColor,
}

//Initialize state
canvas.vectorGuiCTX.willReadFrequently = true
canvas.rasterGuiCTX.willReadFrequently = true
canvas.onScreenCTX.willReadFrequently = true
canvas.offScreenCTX.willReadFrequently = true
canvas.thumbnailCTX.willReadFrequently = true
//Set the dimensions of the drawing canvas
canvas.offScreenCVS.width = 256
canvas.offScreenCVS.height = 256
//set the dimensions of the thumbnail canvas
canvas.thumbnailCVS.width = canvas.offScreenCVS.width
canvas.thumbnailCVS.height = canvas.offScreenCVS.height
//improve sharpness
//BUG: sharpness (8+) greatly affects performance in browsers other than chrome (can safari and firefox not handle large canvases?)
//window.devicePixelRatio is typically 2.
//Other than performance issues, any sharpness greater than the devicePixelRatio can actually look bad because the device cannot render the fidelity expected by the canvas.
canvas.sharpness = window.devicePixelRatio
//adjust canvas ratio here if needed
canvas.vectorGuiCVS.width = canvas.vectorGuiCVS.offsetWidth * canvas.sharpness
canvas.vectorGuiCVS.height = canvas.vectorGuiCVS.offsetHeight * canvas.sharpness
canvas.rasterGuiCVS.width = canvas.rasterGuiCVS.offsetWidth * canvas.sharpness
canvas.rasterGuiCVS.height = canvas.rasterGuiCVS.offsetHeight * canvas.sharpness
canvas.onScreenCVS.width = canvas.onScreenCVS.offsetWidth * canvas.sharpness
canvas.onScreenCVS.height = canvas.onScreenCVS.offsetHeight * canvas.sharpness

canvas.zoom = canvas.setInitialZoom(canvas.offScreenCVS.width) //zoom level should be based on absolute pixel size, not window relative to canvas
canvas.zoomAtLastDraw = canvas.zoom
vectorGuiCTX.scale(
  canvas.sharpness * canvas.zoom,
  canvas.sharpness * canvas.zoom
)
canvas.rasterGuiCTX.scale(
  canvas.sharpness * canvas.zoom,
  canvas.sharpness * canvas.zoom
)
canvas.onScreenCTX.scale(
  canvas.sharpness * canvas.zoom,
  canvas.sharpness * canvas.zoom
)
canvas.thumbnailCTX.scale(canvas.sharpness, canvas.sharpness)

//Initialize offset, must be integer
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

//for adjusting canvas size, adjust onscreen canvas dimensions in proportion to offscreen
//Initialize size values
dom.canvasWidth.value = canvas.offScreenCVS.width
dom.canvasHeight.value = canvas.offScreenCVS.height

//====================================//
//======== * * * Canvas * * * ========//
//====================================//

const handleIncrement = (e) => {
  let dimension = e.target.parentNode.previousSibling.previousSibling
  let max = 1024
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
  const max = 1024
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
  canvas.zoom = canvas.setInitialZoom(
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
  canvas.redrawPoints(state, canvas)
  canvas.draw(canvas)
  vectorGui.render(state, canvas)
}

const handleDimensionsSubmit = (e) => {
  e.preventDefault()
  resizeOffScreenCanvas(dom.canvasWidth.value, dom.canvasHeight.value)
}

export const resizeOnScreenCanvas = () => {
  //Keep canvas dimensions at 100% (requires css style width/ height 100%)
  canvas.vectorGuiCVS.width = canvas.vectorGuiCVS.offsetWidth * canvas.sharpness
  canvas.vectorGuiCVS.height =
    canvas.vectorGuiCVS.offsetHeight * canvas.sharpness
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.rasterGuiCVS.width = canvas.rasterGuiCVS.offsetWidth * canvas.sharpness
  canvas.rasterGuiCVS.height =
    canvas.rasterGuiCVS.offsetHeight * canvas.sharpness
  canvas.rasterGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.onScreenCVS.width = canvas.onScreenCVS.offsetWidth * canvas.sharpness
  canvas.onScreenCVS.height = canvas.onScreenCVS.offsetHeight * canvas.sharpness
  canvas.onScreenCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.draw(canvas)
  // reset positioning styles for free moving dialog boxes
  dom.toolboxContainer.style.left = ""
  dom.toolboxContainer.style.top = ""
  dom.sidebarContainer.style.left = ""
  dom.sidebarContainer.style.top = ""
  colorPickerContainer.style.left = ""
  colorPickerContainer.style.top = ""
}

resizeOnScreenCanvas()

//====================================//
//======== * * * Layers * * * ========//
//====================================//

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
    if (e.target.className.includes("eyeopen")) {
      e.target.classList.remove("eyeopen")
      e.target.classList.add("eyeclosed")
      layer.opacity = 0
    } else if (e.target.className.includes("eyeclosed")) {
      e.target.classList.remove("eyeclosed")
      e.target.classList.add("eyeopen")
      layer.opacity = 1
    }
  } else if (e.target.className.includes("trash")) {
    removeLayer(layer)
  } else {
    //select current layer
    if (layer.type === "raster") {
      if (layer !== canvas.currentLayer) {
        vectorGui.reset(canvas)
        canvas.currentLayer = layer
        renderLayersToDOM()
        renderVectorsToDOM()
      }
    }
  }
  canvas.draw(canvas)
}

//Drag layers
function dragLayerStart(e) {
  let layer = e.target.closest(".layer").layerObj
  let index = canvas.layers.indexOf(layer)
  //pass index through event
  e.dataTransfer.setData("text", index)
  e.target.style.boxShadow =
    "inset 2px 0px rgb(131, 131, 131), inset -2px 0px rgb(131, 131, 131), inset 0px -2px rgb(131, 131, 131), inset 0px 2px rgb(131, 131, 131)"
  //TODO: implement fancier dragging like dialog boxes
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
    for (let i = 0; i < dom.layersContainer.children.length; i += 1) {
      if (dom.layersContainer.children[i] === e.target) {
        let newIndex = canvas.layers.indexOf(
          dom.layersContainer.children[i].layerObj
        )
        canvas.layers.splice(draggedIndex, 1)
        canvas.layers.splice(newIndex, 0, heldLayer)
      }
    }
    renderLayersToDOM()
    canvas.draw(canvas)
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
  state.addToTimeline({
    tool: tools.addLayer,
    layer,
  })
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
        canvas.draw(canvas)
      }
    }

    reader.readAsDataURL(this.files[0])
  }
}

function removeLayer(layer) {
  //set "removed" flag to true on selected layer.
  if (canvas.activeLayerCount > 1) {
    layer.removed = true
    state.addToTimeline({
      tool: tools.removeLayer,
      layer,
    })
    state.undoStack.push(state.points)
    state.points = []
    state.redoStack = []
    renderLayersToDOM()
  }
}

function renderLayersToDOM() {
  dom.layersContainer.innerHTML = ""
  let id = 0
  canvas.activeLayerCount = 0
  canvas.layers.forEach((l) => {
    if (!l.removed) {
      canvas.activeLayerCount++
      let layerElement = document.createElement("div")
      layerElement.className = `layer ${l.type}`
      layerElement.id = id
      id += 1
      layerElement.textContent = l.title
      layerElement.draggable = true
      if (l === canvas.currentLayer) {
        layerElement.classList.add("selected")
      }
      let hide = document.createElement("div")
      hide.className = "hide"
      if (l.opacity === 0) {
        hide.classList.add("eyeclosed")
      } else {
        hide.classList.add("eyeopen")
      }
      layerElement.appendChild(hide)
      let trash = document.createElement("div") //TODO: make clickable and sets vector action as hidden
      trash.className = "trash"
      let trashIcon = document.createElement("div")
      trashIcon.className = "icon"
      trash.appendChild(trashIcon)
      layerElement.appendChild(trash)
      dom.layersContainer.appendChild(layerElement)
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
    if (e.target.className.includes("eyeopen")) {
      e.target.classList.remove("eyeopen")
      e.target.classList.add("eyeclosed")
      layer.opacity = 0
    } else if (e.target.className.includes("eyeclosed")) {
      e.target.classList.remove("eyeclosed")
      e.target.classList.add("eyeopen")
      layer.opacity = 1
    }
  } else if (e.target.className.includes("actionColor")) {
    e.target.color = vector.color
    e.target.vector = vector
    swatches.initializeColorPicker(e.target)
  } else if (e.target.className.includes("trash")) {
    removeVector(vector)
  } else {
    let currentIndex = canvas.currentVectorIndex
    //switch tool
    handleTools(null, vector.tool.name)
    //select current vector
    //TODO: modify object structure of states to match object in undoStack to make assignment simpler like vectorGui.x = {...vector.x}
    vectorGui.reset(canvas)
    if (vector.index !== currentIndex) {
      state.vectorProperties = { ...vector.properties }
      canvas.currentVectorIndex = vector.index
      canvas.currentLayer = vector.layer
    }
    vectorGui.render(state, canvas)
    renderLayersToDOM()
    renderVectorsToDOM()
  }
}

function removeVector(vector) {
  //set "removed" flag to true on selected layer.
  removeAction(vector.index)
  state.undoStack.push(state.points)
  state.points = []
  state.redoStack = []
  if (canvas.currentVectorIndex === vector.index) {
    vectorGui.reset(canvas)
  }
  renderVectorsToDOM()
  canvas.render(state, canvas)
}

function renderVectorsToDOM() {
  dom.vectorsThumbnails.innerHTML = ""
  state.undoStack.forEach((action) => {
    let p = action[0]
    if (!p.removed) {
      if (p.tool.type === "vector") {
        p.index = state.undoStack.indexOf(action)
        let vectorElement = document.createElement("div")
        vectorElement.className = `vector ${p.index}`
        vectorElement.id = p.index
        dom.vectorsThumbnails.appendChild(vectorElement)
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
        let wd =
          canvas.thumbnailCVS.width /
          canvas.sharpness /
          canvas.offScreenCVS.width
        let hd =
          canvas.thumbnailCVS.height /
          canvas.sharpness /
          canvas.offScreenCVS.height
        //get the minimum dimension ratio
        let minD = Math.min(wd, hd)
        // thumbnailCTX.strokeStyle = p.color.color
        canvas.thumbnailCTX.strokeStyle = "black"
        canvas.thumbnailCTX.beginPath()
        //TODO: line tool to be added as vectors. Behavior of replace tool is like a mask, so the replaced pixels are static coordinates.
        if (p.tool.name === "fill") {
          canvas.thumbnailCTX.arc(
            minD * p.properties.px1 + 0.5,
            minD * p.properties.py1 + 0.5,
            1,
            0,
            2 * Math.PI,
            true
          )
        } else if (p.tool.name === "quadCurve") {
          canvas.thumbnailCTX.moveTo(
            minD * p.properties.px1 + 0.5,
            minD * p.properties.py1 + 0.5
          )
          canvas.thumbnailCTX.quadraticCurveTo(
            minD * p.properties.px3 + 0.5,
            minD * p.properties.py3 + 0.5,
            minD * p.properties.px2 + 0.5,
            minD * p.properties.py2 + 0.5
          )
        } else if (p.tool.name === "cubicCurve") {
          canvas.thumbnailCTX.moveTo(
            minD * p.properties.px1 + 0.5,
            minD * p.properties.py1 + 0.5
          )
          canvas.thumbnailCTX.bezierCurveTo(
            minD * p.properties.px3 + 0.5,
            minD * p.properties.py3 + 0.5,
            minD * p.properties.px4 + 0.5,
            minD * p.properties.py4 + 0.5,
            minD * p.properties.px2 + 0.5,
            minD * p.properties.py2 + 0.5
          )
        } else if (p.tool.name === "ellipse") {
          let angle = getAngle(
            p.properties.px2 - p.properties.px1,
            p.properties.py2 - p.properties.py1
          )
          canvas.thumbnailCTX.ellipse(
            minD * p.properties.px1,
            minD * p.properties.py1,
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
        tool.className = "tool"
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
        color.className = "actionColor"
        color.style.background = p.color.color
        vectorElement.appendChild(color)
        let trash = document.createElement("div") //TODO: make clickable and sets vector action as hidden
        trash.className = "trash"
        let trashIcon = document.createElement("div")
        trashIcon.className = "icon"
        trash.appendChild(trashIcon)
        vectorElement.appendChild(trash)
        // thumbnailCVS.width = thumbnailCVS.offsetWidth * canvas.sharpness
        // thumbnailCVS.height = thumbnailCVS.offsetHeight * canvas.sharpness
        // thumbnailCTX.scale(canvas.sharpness * 1, canvas.sharpness * 1)

        //associate object
        vectorElement.vectorObj = p
      }
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
dom.dimensionsForm.addEventListener("pointerdown", (e) => {
  canvas.sizePointerState = e.type
  handleSizeIncrement(e)
})
dom.dimensionsForm.addEventListener("pointerup", (e) => {
  canvas.sizePointerState = e.type
})
dom.dimensionsForm.addEventListener("pointerout", (e) => {
  canvas.sizePointerState = e.type
})
dom.dimensionsForm.addEventListener("submit", handleDimensionsSubmit)
dom.canvasWidth.addEventListener("blur", restrictSize)
dom.canvasHeight.addEventListener("blur", restrictSize)

// * Layers * //
dom.uploadBtn.addEventListener("change", addReferenceLayer)
dom.newLayerBtn.addEventListener("click", addRasterLayer)

dom.layersContainer.addEventListener("click", layerInteract)
dom.layersContainer.addEventListener("dragstart", dragLayerStart)
dom.layersContainer.addEventListener("dragover", dragLayerOver)
dom.layersContainer.addEventListener("dragenter", dragLayerEnter)
dom.layersContainer.addEventListener("dragleave", dragLayerLeave)
dom.layersContainer.addEventListener("drop", dropLayer)
dom.layersContainer.addEventListener("dragend", dragLayerEnd)

// * Vectors * //
dom.vectorsThumbnails.addEventListener("click", vectorInteract)
