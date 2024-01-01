import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { consolidateLayers } from "../Canvas/layers.js"
import { saveDrawing, loadDrawing } from "../Save/savefile.js"

//====================================//
//======= * * * Tooltip * * * ========//
//====================================//

/**
 * @param {String} message
 * @param {Element} target
 */
const showTooltip = (message, target) => {
  if (message && target) {
    const targetRect = target.getBoundingClientRect()
    const targetCenter = targetRect.left + targetRect.width / 2
    const pageSideRight = window.innerWidth / 2 < targetCenter
    dom.tooltip.innerText = message
    const tooltipRect = dom.tooltip.getBoundingClientRect()
    const tooltipX = pageSideRight
      ? targetRect.left - tooltipRect.width
      : targetRect.left + targetRect.width
    const tooltipY = targetRect.top + targetRect.height + 16
    dom.tooltip.classList.add("visible")
    if (!pageSideRight) {
      dom.tooltip.classList.add("page-left")
    }
    dom.tooltip.style.top = tooltipY + "px"
    dom.tooltip.style.left = tooltipX + "px"
  } else {
    dom.tooltip.classList.remove("visible")
    dom.tooltip.classList.remove("page-left")
  }
}

//====================================//
//======== * * * Export * * * ========//
//====================================//

/**
 * Consolidate offscreen canvases and download image
 * TODO: Open dialog box with more options such as pixel size, where to save it to, etc.
 * TODO: To support saving a complex file, we must save state.undoStack as json and be able to parse that json back to the same undoStack
 * - sets cannot be saved as json. factor out maskSet and only use maskArray in actions
 * - canvases cannot be saved as json. when restoring a save, first iterate through saved canvas.layers and create a canvas and context (offscreen and onscreen) for each layer.
 * then iterate through saved actions and assign the correct layer based on the layer's title so the layer is a referenced object instead of a new object
 */
function exportImage() {
  //save .png
  consolidateLayers()
  const a = document.createElement("a")
  a.style.display = "none"
  a.href = canvas.offScreenCVS.toDataURL()
  a.download = "pixelvee.png"
  document.body.appendChild(a)
  a.click()
  // saveDrawing()
}

/**
 * Open json file from desktop and load into layers and timeline
 * TODO: initialize loading screen and stop loading screen after loaded
 */
function openSavedDrawing() {
  let reader
  if (this.files && this.files[0]) {
    reader = new FileReader()
    reader.onload = (e) => {
      loadDrawing(e.target.result)
    }
    reader.readAsText(this.files[0])
  }
}

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

document.body.addEventListener("mouseover", (e) => {
  if (dom.tooltipBtn.checked) {
    const tooltipMessage = e.target.dataset?.tooltip
    showTooltip(tooltipMessage, e.target)
  }
})
dom.toolOptions.addEventListener("click", (e) => {
  if (e.target.type === "checkbox") {
    const optionName = e.target.id.split("-")[0]
    if (e.target.checked) {
      state.tool.options[optionName].active = true
    } else {
      state.tool.options[optionName].active = false
    }
    vectorGui.render()
  }
})
dom.gridBtn.addEventListener("click", (e) => {
  if (dom.gridBtn.checked) {
    vectorGui.grid = true
  } else {
    vectorGui.grid = false
  }
  vectorGui.render()
})
dom.tooltipBtn.addEventListener("click", (e) => {
  if (dom.tooltipBtn.checked) {
    const tooltipMessage = dom.tooltipBtn.parentNode.dataset?.tooltip
    showTooltip(tooltipMessage, dom.tooltipBtn.parentNode)
  } else {
    dom.tooltip.classList.remove("visible")
  }
})
dom.saveBtn.addEventListener("click", saveDrawing)
dom.openSaveBtn.addEventListener("click", (e) => {
  //reset value so that the same file can be imported multiple times
  e.target.value = null
})
dom.openSaveBtn.addEventListener("change", openSavedDrawing)
