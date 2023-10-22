import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderLayersToDOM,
  renderVectorsToDOM,
  renderPaletteToDOM,
} from "../DOM/render.js"
import { createNewRasterLayer } from "./layers.js"
import { handleTools } from "../Tools/events.js"
import { removeAction } from "../Actions/actions.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { swatches } from "../Context/swatch.js"
import { setInitialZoom } from "../utils/canvasHelpers.js"
import { initializeColorPicker } from "../Swatch/events.js"

//====================================//
//==== * * * Canvas Resize * * * =====//
//====================================//

/**
 * Increment canvas dimensions values
 * @param {PointerEvent} e
 */
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
 * Increment values while rgb button is held down
 * @param {PointerEvent} e
 */
const handleSizeIncrement = (e) => {
  if (canvas.sizePointerState === "pointerdown") {
    handleIncrement(e)
    window.setTimeout(() => handleSizeIncrement(e), 150)
  }
}

/**
 * Limit the min and max size of the canvas
 * @param {FocusEvent} e
 */
const restrictSize = (e) => {
  const max = 1024
  const min = 8
  if (e.target.value > max) {
    e.target.value = max
  } else if (e.target.value < min) {
    e.target.value = min
  }
}

/**
 * Resize the offscreen canvas and all layers
 * @param {Integer} width
 * @param {Integer} height
 */
const resizeOffScreenCanvas = (width, height) => {
  canvas.offScreenCVS.width = width
  canvas.offScreenCVS.height = height
  canvas.previewCVS.width = width
  canvas.previewCVS.height = height
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
  renderCanvas(null, false, true)
  vectorGui.render(state, canvas)
}

/**
 * Submit new dimensions for the offscreen canvas
 * @param {SubmitEvent} e
 */
const handleDimensionsSubmit = (e) => {
  e.preventDefault()
  resizeOffScreenCanvas(dom.canvasWidth.value, dom.canvasHeight.value)
}

/**
 * Resize the onscreen canvas when adjusting the window size
 * UIEvent listener
 */
const resizeOnScreenCanvas = () => {
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
  renderCanvas()
  // reset positioning styles for free moving dialog boxes
  dom.toolboxContainer.style.left = ""
  dom.toolboxContainer.style.top = ""
  dom.sidebarContainer.style.left = ""
  dom.sidebarContainer.style.top = ""
  dom.colorPickerContainer.style.left = ""
  dom.colorPickerContainer.style.top = ""
}

resizeOnScreenCanvas()

//====================================//
//======== * * * Layers * * * ========//
//====================================//

/**
 * Clicking on a layer in the layers interface
 * @param {PointerEvent} e
 */
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
  renderCanvas()
}

/**
 * Start dragging a layer in the layers interface
 * @param {DragEvent} e
 */
function dragLayerStart(e) {
  let layer = e.target.closest(".layer").layerObj
  let index = canvas.layers.indexOf(layer)
  //pass index through event
  e.dataTransfer.setData("text", index)
  e.target.style.boxShadow =
    "inset 2px 0px rgb(131, 131, 131), inset -2px 0px rgb(131, 131, 131), inset 0px -2px rgb(131, 131, 131), inset 0px 2px rgb(131, 131, 131)"
  //TODO: implement fancier dragging like dialog boxes
}

/**
 * Prevent default behavior for drag over
 * @param {DragEvent} e
 */
function dragLayerOver(e) {
  e.preventDefault()
}

/**
 * Dragging a layer into another layer's space
 * @param {DragEvent} e
 */
function dragLayerEnter(e) {
  if (e.target.className.includes("layer")) {
    e.target.style.boxShadow =
      "inset 2px 0px rgb(255, 255, 255), inset -2px 0px rgb(255, 255, 255), inset 0px -2px rgb(255, 255, 255), inset 0px 2px rgb(255, 255, 255)"
  }
}

/**
 * Dragging a layer out of another layer's space
 * @param {DragEvent} e
 */
function dragLayerLeave(e) {
  if (e.target.className.includes("layer")) {
    e.target.style.boxShadow =
      "inset 2px 0px rgb(131, 131, 131), inset -2px 0px rgb(131, 131, 131), inset 0px -2px rgb(131, 131, 131), inset 0px 2px rgb(131, 131, 131)"
  }
}

/**
 * Drop a layer into another layer's space and reorder layers to match
 * @param {DragEvent} e
 */
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
    renderCanvas()
  }
}

/**
 * Stop dragging a layer
 * @param {DragEvent} e
 */
function dragLayerEnd(e) {
  renderLayersToDOM()
}

/**
 * Upload an image and create a new reference layer
 * TODO: allow user to set pixel scale between 0.125 and 8
 */
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
        renderCanvas()
      }
    }

    reader.readAsDataURL(this.files[0])
  }
}

/**
 * Mark a layer as removed
 * TODO: This is a timeline action and should be moved to an actions file
 * @param {Object} layer
 */
function removeLayer(layer) {
  //set "removed" flag to true on selected layer.
  if (canvas.activeLayerCount > 1) {
    layer.removed = true
    if (layer === canvas.currentLayer) {
      canvas.currentLayer = canvas.layers.find(
        (l) => l.type === "raster" && !l.removed
      )
      vectorGui.reset(canvas)
    }
    state.addToTimeline({
      tool: tools.removeLayer,
      layer,
    })
    state.undoStack.push(state.action)
    state.action = null
    state.redoStack = []
    renderLayersToDOM()
    renderVectorsToDOM()
  }
}

/**
 * Add a new raster layer
 * TODO: This is a timeline action and should be moved to an actions file
 */
function addRasterLayer() {
  //once layer is added to timeline and drawn on, can no longer be deleted
  const layer = createNewRasterLayer(`Layer ${canvas.layers.length + 1}`)
  canvas.layers.push(layer)
  state.addToTimeline({
    tool: tools.addLayer,
    layer,
  })
  state.undoStack.push(state.action)
  state.action = null
  state.redoStack = []
  renderLayersToDOM()
}

//====================================//
//======= * * * Vectors * * * ========//
//====================================//

/**
 * Clicking on a vector in the vectors interface
 * @param {PointerEvent} e
 */
function vectorInteract(e) {
  let vector = e.target.closest(".vector").vectorObj
  //toggle visibility
  if (e.target.className.includes("eye")) {
    if (e.target.className.includes("eyeopen")) {
      e.target.classList.remove("eyeopen")
      e.target.classList.add("eyeclosed")
      vector.hidden = true
    } else if (e.target.className.includes("eyeclosed")) {
      e.target.classList.remove("eyeclosed")
      e.target.classList.add("eyeopen")
      vector.hidden = false
    }
    renderCanvas(null, true, true)
  } else if (e.target.className.includes("actionColor")) {
    e.target.color = vector.color
    e.target.vector = vector
    initializeColorPicker(e.target)
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
      state.vectorProperties = { ...vector.properties.vectorProperties }
      canvas.currentVectorIndex = vector.index
      canvas.currentLayer = vector.layer
    }
    vectorGui.render(state, canvas)
    renderLayersToDOM()
    renderVectorsToDOM()
  }
}

/**
 * Mark a vector action as removed
 * @param {Object} vector
 */
function removeVector(vector) {
  //set "removed" flag to true on selected layer.
  removeAction(vector.index)
  state.undoStack.push(state.action)
  state.action = null
  state.redoStack = []
  if (canvas.currentVectorIndex === vector.index) {
    vectorGui.reset(canvas)
  }
  renderVectorsToDOM()
  renderCanvas(null, true, true)
}

//TODO: add move tool and scale tool for reference layers

//===================================//
//=== * * * Initialization * * * ====//
//===================================//

//Initialize first layer
addRasterLayer()
canvas.currentLayer = canvas.layers[0]
renderLayersToDOM()
renderPaletteToDOM()

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

// UI Canvas * //
window.addEventListener("resize", resizeOnScreenCanvas)

// * Canvas Size * //
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

//TODO: Make similar to functionality of dragging dialog boxes.
dom.layersContainer.addEventListener("click", layerInteract)
dom.layersContainer.addEventListener("dragstart", dragLayerStart)
dom.layersContainer.addEventListener("dragover", dragLayerOver)
dom.layersContainer.addEventListener("dragenter", dragLayerEnter)
dom.layersContainer.addEventListener("dragleave", dragLayerLeave)
dom.layersContainer.addEventListener("drop", dropLayer)
dom.layersContainer.addEventListener("dragend", dragLayerEnd)

// * Vectors * //
dom.vectorsThumbnails.addEventListener("click", vectorInteract)
