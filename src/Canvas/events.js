import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderLayersToDOM,
  renderVectorsToDOM,
  renderPaletteToDOM,
} from "../DOM/render.js"
import { createNewRasterLayer } from "./layers.js"
import { handleTools } from "../Tools/events.js"
import { removeAction, changeActionMode } from "../Actions/modifyTimeline.js"
import { vectorGui } from "../GUI/vector.js"
import { setInitialZoom } from "../utils/canvasHelpers.js"
import { initializeColorPicker } from "../Swatch/events.js"
import { constrainElementOffsets } from "../utils/constrainElementOffsets.js"
import { dragStart, dragMove, dragStop } from "../utils/drag.js"

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
  canvas.layers.forEach((layer) => {
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0
    )
  })
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.xOffset = Math.round(
    (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.width) /
      2
  )
  canvas.yOffset = Math.round(
    (canvas.currentLayer.onscreenCvs.height / canvas.sharpness / canvas.zoom -
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
  canvas.layers.forEach((layer) => {
    if (layer.type === "raster") {
      if (
        layer.cvs.width !== canvas.offScreenCVS.width ||
        layer.cvs.height !== canvas.offScreenCVS.height
      ) {
        layer.cvs.width = canvas.offScreenCVS.width
        layer.cvs.height = canvas.offScreenCVS.height
      }
    }
  })
  renderCanvas(null, true) //render all layers and redraw timeline
  vectorGui.render()
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
  canvas.layers.forEach((layer) => {
    layer.onscreenCvs.width = layer.onscreenCvs.offsetWidth * canvas.sharpness
    layer.onscreenCvs.height = layer.onscreenCvs.offsetHeight * canvas.sharpness
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0
    )
  })
  canvas.backgroundCVS.width =
    canvas.backgroundCVS.offsetWidth * canvas.sharpness
  canvas.backgroundCVS.height =
    canvas.backgroundCVS.offsetHeight * canvas.sharpness
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  renderCanvas(null) // render all layers
  // reset positioning styles for free moving dialog boxes
  dom.toolboxContainer.style.left = ""
  dom.toolboxContainer.style.top = ""
  dom.sidebarContainer.style.left = ""
  dom.sidebarContainer.style.top = ""
  if (dom.colorPickerContainer.offsetHeight !== 0) {
    constrainElementOffsets(dom.colorPickerContainer)
  }
}

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
  if (e.target.className.includes("eyeopen")) {
    e.target.classList.remove("eyeopen")
    e.target.classList.add("eyeclosed")
    layer.hidden = true
  } else if (e.target.className.includes("eyeclosed")) {
    e.target.classList.remove("eyeclosed")
    e.target.classList.add("eyeopen")
    layer.hidden = false
  } else if (e.target.className.includes("trash")) {
    removeLayer(layer)
  } else {
    //select current layer
    if (layer !== canvas.currentLayer) {
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        dom[`${tool}Btn`].disabled = false
      })
      canvas.currentLayer = layer
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        dom[`${tool}Btn`].disabled = true
      })
      vectorGui.reset()
      vectorGui.render()
      if (layer.type === "reference") {
        handleTools(null, "move")
      }
      renderLayersToDOM()
      renderVectorsToDOM()
    }
  }
  renderCanvas(layer)
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
  //TODO: should layer order change be added to timeline?
  if (e.target.className.includes("layer") && targetLayer !== heldLayer) {
    for (let i = 0; i < dom.layersContainer.children.length; i += 1) {
      if (dom.layersContainer.children[i] === e.target) {
        let newIndex = canvas.layers.indexOf(
          dom.layersContainer.children[i].layerObj
        )
        canvas.layers.splice(draggedIndex, 1)
        canvas.layers.splice(newIndex, 0, heldLayer)

        // reorder layer canvases in DOM
        dom.canvasLayers.removeChild(heldLayer.onscreenCvs) // remove the dragged canvas
        if (newIndex >= dom.canvasLayers.children.length) {
          // if newIndex is at or beyond the end, append
          dom.canvasLayers.appendChild(heldLayer.onscreenCvs)
        } else {
          // otherwise, insert before the canvas at the new index
          dom.canvasLayers.insertBefore(
            heldLayer.onscreenCvs,
            dom.canvasLayers.children[newIndex]
          )
        }
      }
    }
    renderLayersToDOM()
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
 */
function addReferenceLayer() {
  let reader
  let img = new Image()

  if (this.files && this.files[0]) {
    reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target.result
      img.onload = () => {
        let onscreenLayerCVS = document.createElement("canvas")
        let onscreenLayerCTX = onscreenLayerCVS.getContext("2d")
        onscreenLayerCTX.willReadFrequently = true
        onscreenLayerCVS.className = "onscreen-canvas"
        dom.canvasLayers.insertBefore(
          onscreenLayerCVS,
          dom.canvasLayers.children[0]
        )
        onscreenLayerCVS.width = onscreenLayerCVS.offsetWidth * canvas.sharpness
        onscreenLayerCVS.height =
          onscreenLayerCVS.offsetHeight * canvas.sharpness
        onscreenLayerCTX.setTransform(
          canvas.sharpness * canvas.zoom,
          0,
          0,
          canvas.sharpness * canvas.zoom,
          0,
          0
        )
        //constrain background image to canvas with scale
        let scale =
          canvas.offScreenCVS.width / img.width >
          canvas.offScreenCVS.height / img.height
            ? canvas.offScreenCVS.height / img.height
            : canvas.offScreenCVS.width / img.width //TODO: should be method, not var so width and height can be adjusted without having to set scale again
        let layer = {
          type: "reference",
          title: `Reference ${canvas.layers.length + 1}`,
          img: img,
          // dataUrl: img.src,
          onscreenCvs: onscreenLayerCVS,
          onscreenCtx: onscreenLayerCTX,
          x: 0,
          y: 0,
          scale: scale,
          opacity: 1,
          inactiveTools: [
            "brush",
            "fill",
            "line",
            "quadCurve",
            "cubicCurve",
            "ellipse",
            // "select",
          ],
          hidden: false,
          removed: false,
        }
        canvas.layers.unshift(layer)
        state.addToTimeline({
          tool: tools.addLayer,
          layer,
        })
        state.action = null
        state.redoStack = []
        renderLayersToDOM()
        renderCanvas(null)
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
  if (canvas.activeLayerCount > 1 || layer.type !== "raster") {
    layer.removed = true
    if (layer === canvas.currentLayer) {
      canvas.currentLayer = canvas.layers.find(
        (l) => l.type === "raster" && !l.removed
      )
      vectorGui.reset()
    }
    state.addToTimeline({
      tool: tools.removeLayer,
      layer,
    })
    state.action = null
    state.redoStack = []
    renderLayersToDOM()
    renderVectorsToDOM()
  }
}

/**
 * Add layer
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
  if (e.target.className.includes("eraser")) {
    //change mode
    toggleVectorMode(vector, "eraser")
  } else if (e.target.className.includes("inject")) {
    //change mode
    toggleVectorMode(vector, "inject")
  } else if (e.target.className.includes("actionColor")) {
    //change color
    e.target.color = vector.color
    e.target.vector = vector
    initializeColorPicker(e.target)
  } else if (e.target.className.includes("eyeopen")) {
    //toggle visibility
    e.target.classList.remove("eyeopen")
    e.target.classList.add("eyeclosed")
    vector.hidden = true
    renderCanvas(vector.layer, true)
  } else if (e.target.className.includes("eyeclosed")) {
    //toggle visibility
    e.target.classList.remove("eyeclosed")
    e.target.classList.add("eyeopen")
    vector.hidden = false
    renderCanvas(vector.layer, true)
  } else if (e.target.className.includes("trash")) {
    //remove vector
    removeVector(vector)
  } else {
    let currentIndex = canvas.currentVectorIndex
    //switch tool
    handleTools(null, vector.tool.name)
    //select current vector
    vectorGui.reset()
    if (vector.index !== currentIndex) {
      vectorGui.setVectorProperties(vector)
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        dom[`${tool}Btn`].disabled = false
      })
      canvas.currentLayer = vector.layer
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        dom[`${tool}Btn`].disabled = true
      })
    }
    vectorGui.render()
    renderLayersToDOM()
    renderVectorsToDOM()
  }
}

/**
 * Mark a vector action as removed
 * @param {Object} vector
 */
function removeVector(vector) {
  vector.removed = true
  renderCanvas(vector.layer, true)
  removeAction(vector)
  state.action = null
  state.redoStack = []
  if (canvas.currentVectorIndex === vector.index) {
    vectorGui.reset()
  }
  renderVectorsToDOM()
}

/**
 * Change a vector action's modes
 * @param {Object} vector
 * @param {String} modeKey
 */
function toggleVectorMode(vector, modeKey) {
  let oldModes = { ...vector.modes }
  vector.modes[modeKey] = !vector.modes[modeKey]
  //resolve conflicting modes
  if (vector.modes[modeKey]) {
    if (modeKey === "eraser" && vector.modes.inject) {
      vector.modes.inject = false
    } else if (modeKey === "inject" && vector.modes.eraser) {
      vector.modes.eraser = false
    }
  }
  let newModes = { ...vector.modes }
  renderCanvas(vector.layer, true)
  changeActionMode(vector, oldModes, newModes)
  state.action = null
  state.redoStack = []
  renderVectorsToDOM()
}

//===================================//
//=== * * * Initialization * * * ====//
//===================================//

//Initialize first layer
addRasterLayer()
canvas.currentLayer = canvas.layers[0]
//Initialize offset, must be integer
canvas.xOffset = Math.round(
  (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
    canvas.offScreenCVS.width) /
    2
)
canvas.yOffset = Math.round(
  (canvas.currentLayer.onscreenCvs.height / canvas.sharpness / canvas.zoom -
    canvas.offScreenCVS.height) /
    2
)
canvas.previousXOffset = canvas.xOffset
canvas.previousYOffset = canvas.yOffset
renderCanvas(canvas.currentLayer)
renderLayersToDOM()
renderPaletteToDOM()
// renderBrushModesToDOM()

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
dom.uploadBtn.addEventListener("click", (e) => {
  //reset value so that the same file can be uploaded multiple times
  e.target.value = null
})
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
//TODO: To make fancier dragging work, must be made compatible with a scrolling container
// dom.layersContainer.addEventListener("pointerdown", () =>
//   dragStart(e, e.target.closest(".layer"))
// )
// dom.layersContainer.addEventListener("pointerup", dragStop)
// dom.layersContainer.addEventListener("pointerout", dragStop)
// dom.layersContainer.addEventListener("pointermove", dragMove)

// * Vectors * //
dom.vectorsThumbnails.addEventListener("click", vectorInteract)
