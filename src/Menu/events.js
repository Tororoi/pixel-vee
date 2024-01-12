import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { consolidateLayers } from "../Canvas/layers.js"
import {
  prepareDrawingForSave,
  setSaveFilesizePreview,
  saveDrawing,
  loadDrawing,
} from "../Save/savefile.js"
import { measureTextWidth } from "../utils/measureHelpers.js"

//====================================//
//======= * * * Tooltip * * * ========//
//====================================//

/**
 * @param {String} message
 * @param {Element} target
 */
const showTooltip = (message, target) => {
  if (message && target) {
    //reset tooltip
    dom.tooltip.classList.remove("page-left")
    dom.tooltip.classList.remove("page-center")
    //get location and boundaries of target
    const targetRect = target.getBoundingClientRect()
    const targetCenter = targetRect.left + targetRect.width / 2
    //get location of element relative to page (left, center, right)
    let location = "left"
    if (window.innerWidth * (2 / 3) < targetCenter) {
      location = "right"
    } else if (window.innerWidth / 3 < targetCenter) {
      location = "center"
    }
    dom.tooltip.innerText = message
    const tooltipRect = dom.tooltip.getBoundingClientRect()
    let tooltipX
    if (location === "right") {
      tooltipX = targetRect.left - tooltipRect.width
    } else if (location === "center") {
      tooltipX = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
    } else {
      tooltipX = targetRect.left + targetRect.width
    }
    const tooltipY = targetRect.top + targetRect.height + 16
    dom.tooltip.classList.add("visible")
    if (location === "left") {
      dom.tooltip.classList.add("page-left")
    } else if (location === "center") {
      dom.tooltip.classList.add("page-center")
    }
    dom.tooltip.style.top = tooltipY + "px"
    dom.tooltip.style.left = tooltipX + "px"
  } else {
    dom.tooltip.classList.remove("visible")
  }
}

//====================================//
//======== * * * Export * * * ========//
//====================================//

/**
 * Open save dialog box
 * TODO: initialize save dialog box with default settings?
 */
export function openSaveDialogBox() {
  dom.saveContainer.style.display = "flex"
  state.saveDialogOpen = true
  setSaveFilesizePreview()
  dom.saveAsFileName.focus()
}

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
dom.openSaveBtn.addEventListener("click", (e) => {
  //reset value so that the same file can be imported multiple times
  e.target.value = null
})
dom.openSaveBtn.addEventListener("change", openSavedDrawing)
dom.exportBtn.addEventListener("click", exportImage)
dom.saveBtn.addEventListener("click", openSaveDialogBox)
dom.saveAsForm.addEventListener("change", (e) => {
  if (e.target.id === "preserve-history-toggle") {
    if (e.target.checked) {
      state.saveSettings.preserveHistory = true
      dom.advancedOptionsContainer.classList.add("disabled")
    } else {
      state.saveSettings.preserveHistory = false
      dom.advancedOptionsContainer.classList.remove("disabled")
    }
    setSaveFilesizePreview()
  } else if (e.target.id === "include-palette-toggle") {
    if (e.target.checked) {
      state.saveSettings.includePalette = true
    } else {
      state.saveSettings.includePalette = false
    }
    setSaveFilesizePreview()
  } else if (e.target.id === "include-reference-layers-toggle") {
    if (e.target.checked) {
      state.saveSettings.includeReferenceLayers = true
    } else {
      state.saveSettings.includeReferenceLayers = false
    }
    setSaveFilesizePreview()
  } else if (e.target.id === "include-removed-actions-toggle") {
    if (e.target.checked) {
      state.saveSettings.includeRemovedActions = true
    } else {
      state.saveSettings.includeRemovedActions = false
    }
    setSaveFilesizePreview()
  }
})
dom.saveAsFileName.addEventListener("input", (e) => {
  state.saveSettings.saveAsFileName = e.target.value
  dom.saveAsFileName.style.width =
    measureTextWidth(state.saveSettings.saveAsFileName, "16px '04Font'") +
    2 +
    "px"
})
dom.saveDrawingBtn.addEventListener("click", (e) => {
  saveDrawing()
  dom.saveContainer.style.display = "none"
  state.saveDialogOpen = false
})
dom.cancelSaveBtn.addEventListener("click", (e) => {
  dom.saveContainer.style.display = "none"
  state.saveDialogOpen = false
})
dom.topMenu.addEventListener("click", function (e) {
  let target = e.target
  if (
    target.getAttribute("role") === "menuitem" &&
    target.getAttribute("aria-haspopup") === "true"
  ) {
    dom.fileSubMenu.classList.toggle("show")
  }
})
