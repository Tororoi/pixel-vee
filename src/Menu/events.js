import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { consolidateLayers } from "../Canvas/layers.js"
import {
  prepareDrawingForSave,
  setSaveFilesizePreview,
  saveDrawing,
  loadDrawing,
} from "../Save/savefile.js"
import { measureTextWidth } from "../utils/measureHelpers.js"
import {
  actionDeselect,
  actionInvertSelection,
  actionCutSelection,
  actionPasteSelection,
} from "../Actions/nonPointerActions.js"
import { addToTimeline } from "../Actions/undoRedo.js"
import { actionCopySelection } from "../Actions/untrackedActions.js"

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
dom.gridSpacing.addEventListener("input", (e) => {
  //constrain value to min/max
  if (e.target.value < 1) {
    e.target.value = 1
  } else if (e.target.value > 64) {
    e.target.value = 64
  }
  vectorGui.gridSpacing = parseInt(e.target.value)
  vectorGui.render()
})
dom.gridSpacingSpinBtn.addEventListener("pointerdown", (e) => {
  if (e.target.id === "inc") {
    vectorGui.gridSpacing++
  } else if (e.target.id === "dec") {
    vectorGui.gridSpacing--
  }
  //constraint value to min/max
  if (vectorGui.gridSpacing < 1) {
    vectorGui.gridSpacing = 1
  } else if (vectorGui.gridSpacing > 64) {
    vectorGui.gridSpacing = 64
  }
  dom.gridSpacing.value = vectorGui.gridSpacing
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
dom.topMenu.addEventListener("click", (e) => {
  //check if active element has class menu-folder and class "active"
  if (document.activeElement.classList.contains("menu-folder")) {
    //if so, toggle the active class
    if (document.activeElement.classList.contains("active")) {
      document.activeElement.classList.remove("active")
    } else {
      document.activeElement.classList.add("active")
    }
  }
})
dom.topMenu.addEventListener("focusout", (e) => {
  //check if active element has class menu-folder
  if (e.target.classList.contains("menu-folder")) {
    //if so, remove the active class
    e.target.classList.remove("active")
  }
})
//File Submenu events
dom.openSaveBtn.addEventListener("change", openSavedDrawing)
dom.exportBtn.addEventListener("click", exportImage)
dom.saveBtn.addEventListener("click", openSaveDialogBox)
//Edit Submenu events
dom.canvasSizeBtn.addEventListener("click", (e) => {
  dom.sizeContainer.style.display = "flex"
})
dom.selectAllBtn.addEventListener("click", (e) => {
  //select all pixels on canvas
  if (canvas.currentLayer.type === "raster") {
    state.selectProperties.px1 = 0
    state.selectProperties.py1 = 0
    state.selectProperties.px2 = canvas.currentLayer.cvs.width
    state.selectProperties.py2 = canvas.currentLayer.cvs.height
    state.setBoundaryBox(state.selectProperties)
    addToTimeline({
      tool: tools.select,
      layer: canvas.currentLayer,
      properties: {
        deselect: false,
        invertSelection: state.selectionInversed,
        selectProperties: { ...state.selectProperties },
      },
    })
    vectorGui.render()
  }
})
dom.deselectBtn.addEventListener("click", actionDeselect)
dom.invertSelectionBtn.addEventListener("click", actionInvertSelection)
dom.cutBtn.addEventListener("click", actionCutSelection)
dom.copyBtn.addEventListener("click", actionCopySelection)
dom.pasteBtn.addEventListener("click", actionPasteSelection)
// dom.flipHorizontalBtn.addEventListener("click", (e) => {
//   //TODO: flip selected pixels horizontally
// })
// dom.flipVerticalBtn.addEventListener("click", (e) => {
//   //TODO: flip selected pixels vertically
// })
//Settings events
dom.settingsBtn.addEventListener("click", (e) => {
  //if settings container is already open, close it, else open it
  if (dom.settingsContainer.style.display === "flex") {
    dom.settingsContainer.style.display = "none"
  } else {
    dom.settingsContainer.style.display = "flex"
  }
})
//Save/Export events
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
dom.saveAsForm.addEventListener("submit", (e) => {
  //prevent default form submission
  e.preventDefault()
  saveDrawing()
  dom.saveContainer.style.display = "none"
  state.saveDialogOpen = false
})
dom.saveAsFileName.addEventListener("input", (e) => {
  state.saveSettings.saveAsFileName = e.target.value
  dom.saveAsFileName.style.width =
    measureTextWidth(state.saveSettings.saveAsFileName, "16px '04Font'") +
    2 +
    "px"
})
dom.cancelSaveBtn.addEventListener("click", (e) => {
  dom.saveContainer.style.display = "none"
  state.saveDialogOpen = false
})
