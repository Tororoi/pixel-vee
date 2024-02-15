import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { renderCanvas, resizeOffScreenCanvas } from "../Canvas/render.js"
import {
  renderLayersToDOM,
  renderLayerSettingsToDOM,
  renderVectorsToDOM,
  renderPaletteToDOM,
} from "../DOM/render.js"
import { removeAction, changeActionMode } from "../Actions/modifyTimeline.js"
import { vectorGui } from "../GUI/vector.js"
// import { setInitialZoom } from "../utils/canvasHelpers.js"
import { initializeColorPicker } from "../Swatch/events.js"
import { constrainElementOffsets } from "../utils/constrainElementOffsets.js"
import { dragStart, dragMove, dragStop } from "../utils/drag.js"
import {
  addReferenceLayer,
  addRasterLayer,
  removeLayer,
} from "../Actions/nonPointerActions.js"
import { createPreviewLayer } from "./layers.js"
import { switchTool } from "../Tools/toolbox.js"

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

// /**
//  * Resize the offscreen canvas and all layers
//  * @param {number} width - (Integer)
//  * @param {number} height - (Integer)
//  */
// const resizeOffScreenCanvas = (width, height) => {
//   canvas.offScreenCVS.width = width
//   canvas.offScreenCVS.height = height
//   canvas.previewCVS.width = width
//   canvas.previewCVS.height = height
//   // canvas.thumbnailCVS.width = canvas.offScreenCVS.width
//   // canvas.thumbnailCVS.height = canvas.offScreenCVS.height
//   //reset canvas state
//   canvas.zoom = setInitialZoom(
//     Math.max(canvas.offScreenCVS.width, canvas.offScreenCVS.height)
//   )
//   canvas.vectorGuiCTX.setTransform(
//     canvas.sharpness * canvas.zoom,
//     0,
//     0,
//     canvas.sharpness * canvas.zoom,
//     0,
//     0
//   )
//   canvas.rasterGuiCTX.setTransform(
//     canvas.sharpness * canvas.zoom,
//     0,
//     0,
//     canvas.sharpness * canvas.zoom,
//     0,
//     0
//   )
//   canvas.layers.forEach((layer) => {
//     layer.onscreenCtx.setTransform(
//       canvas.sharpness * canvas.zoom,
//       0,
//       0,
//       canvas.sharpness * canvas.zoom,
//       0,
//       0
//     )
//   })
//   canvas.backgroundCTX.setTransform(
//     canvas.sharpness * canvas.zoom,
//     0,
//     0,
//     canvas.sharpness * canvas.zoom,
//     0,
//     0
//   )
//   canvas.xOffset = Math.round(
//     (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
//       canvas.offScreenCVS.width) /
//       2
//   )
//   canvas.yOffset = Math.round(
//     (canvas.currentLayer.onscreenCvs.height / canvas.sharpness / canvas.zoom -
//       canvas.offScreenCVS.height) /
//       2
//   )
//   canvas.previousXOffset = canvas.xOffset
//   canvas.previousYOffset = canvas.yOffset
//   canvas.subPixelX = null
//   canvas.subPixelY = null
//   canvas.zoomPixelX = null
//   canvas.zoomPixelY = null
//   //resize layers. Per function, it's cheaper to run this inside the existing iterator in drawLayers, but since drawLayers runs so often, it's preferable to only run this here where it's needed.
//   canvas.layers.forEach((layer) => {
//     if (layer.type === "raster") {
//       if (
//         layer.cvs.width !== canvas.offScreenCVS.width ||
//         layer.cvs.height !== canvas.offScreenCVS.height
//       ) {
//         layer.cvs.width = canvas.offScreenCVS.width
//         layer.cvs.height = canvas.offScreenCVS.height
//       }
//     }
//   })
//   renderCanvas(null, true) //render all layers and redraw timeline
//   vectorGui.render()
// }

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
  renderCanvas() // render all layers
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
  if (canvas.pastedLayer) {
    e.preventDefault()
    //if there is a pasted layer, temporary layer is active and layers configuration should not be messed with
    return
  }
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
  } else if (e.target.className.includes("gear")) {
    //open settings dialog
    const domLayer = e.target.closest(".layer")
    //set top offset of layer settings container to match
    if (
      dom.layerSettingsContainer.style.display === "flex" &&
      // && layer settings layer is the same as the one that was clicked
      dom.layerSettingsContainer.layerObj === layer
    ) {
      dom.layerSettingsContainer.style.display = "none"
      dom.layerSettingsContainer.layerObj = null
    } else {
      dom.layerSettingsContainer.style.display = "flex"
      dom.layerSettingsContainer.layerObj = layer
      renderLayerSettingsToDOM(domLayer)
    }
  } else {
    //TODO: (Low Priority) allow selecting multiple layers for moving purposes only
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
        switchTool("move")
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
  if (canvas.pastedLayer) {
    e.preventDefault()
    //if there is a pasted layer, temporary layer is active and layers configuration should not be messed with
    return
  }
  let layer = e.target.closest(".layer").layerObj
  let index = canvas.layers.indexOf(layer)
  //pass index through event
  e.dataTransfer.setData("text", index)
  e.target.style.boxShadow =
    "inset 2px 0px rgb(131, 131, 131), inset -2px 0px rgb(131, 131, 131), inset 0px -2px rgb(131, 131, 131), inset 0px 2px rgb(131, 131, 131)"
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
  //TODO: (Low Priority) should layer order change be added to timeline?
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

//====================================//
//======= * * * Vectors * * * ========//
//====================================//

/**
 * Clicking on a vector in the vectors interface
 * @param {PointerEvent} e
 */
function vectorInteract(e) {
  if (canvas.pastedLayer) {
    e.preventDefault()
    //if there is a pasted layer, temporary layer is active and vectors configuration should not be messed with
    return
  }
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
    switchTool(vector.tool.name)
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
 * @param {object} vector
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
 * @param {object} vector
 * @param {string} modeKey
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

//Initialize temp layer, not added to layers array
canvas.tempLayer = createPreviewLayer()

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
dom.canvasSizeCancelBtn.addEventListener("click", () => {
  dom.sizeContainer.style.display = "none"
})
// * Layers * //
dom.uploadBtn.addEventListener("click", (e) => {
  //reset value so that the same file can be uploaded multiple times
  e.target.value = null
})
dom.uploadBtn.addEventListener("change", addReferenceLayer)
dom.newLayerBtn.addEventListener("click", addRasterLayer)
dom.deleteLayerBtn.addEventListener("click", () => {
  let layer = canvas.currentLayer
  removeLayer(layer)
  renderCanvas(layer)
})

//TODO: (Middle Priority) Make similar to functionality of dragging dialog boxes. To make fancier dragging work, must be made compatible with a scrolling container
dom.layersContainer.addEventListener("click", layerInteract)
dom.layersContainer.addEventListener("dragstart", dragLayerStart)
dom.layersContainer.addEventListener("dragover", dragLayerOver)
dom.layersContainer.addEventListener("dragenter", dragLayerEnter)
dom.layersContainer.addEventListener("dragleave", dragLayerLeave)
dom.layersContainer.addEventListener("drop", dropLayer)
dom.layersContainer.addEventListener("dragend", dragLayerEnd)
// dom.layersContainer.addEventListener("pointerdown", () =>
//   dragStart(e, e.target.closest(".layer"))
// )
// dom.layersContainer.addEventListener("pointerup", dragStop)
// dom.layersContainer.addEventListener("pointerout", dragStop)
// dom.layersContainer.addEventListener("pointermove", dragMove)
dom.layerSettingsContainer.addEventListener("input", (e) => {
  const layer = dom.layerSettingsContainer.layerObj
  if (layer) {
    if (e.target.matches(".slider")) {
      layer.opacity = e.target.value / 255
      dom.layerSettingsContainer.querySelector(
        ".layer-opacity-label > .input-label"
      ).textContent = `Opacity: ${Math.round(layer.opacity * 255)}`
      renderCanvas(layer)
    } else if (e.target.matches("#layer-name")) {
      layer.title = e.target.value
      renderLayersToDOM()
    }
  }
})
//TODO: (Low Priority) maybe dynamically generate layer settings container when needed and only bind this event listener when it is open
document.addEventListener("pointerdown", (e) => {
  if (
    dom.layerSettingsContainer.layerObj &&
    !e.target.classList.contains("gear") &&
    !dom.layerSettingsContainer.contains(e.target)
  ) {
    dom.layerSettingsContainer.style.display = "none"
    dom.layerSettingsContainer.layerObj = null
  }
})

// * Vectors * //
dom.vectorsThumbnails.addEventListener("click", vectorInteract)
