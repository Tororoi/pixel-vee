import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { consolidateLayers } from "../Canvas/layers.js"
import {
  setSaveFilesizePreview,
  saveDrawing,
  loadDrawing,
} from "../Save/savefile.js"
import { measureTextWidth } from "../utils/measureHelpers.js"
import {
  actionSelectAll,
  actionDeselect,
  actionInvertSelection,
  actionCutSelection,
  actionPasteSelection,
} from "../Actions/nonPointerActions.js"
import { actionCopySelection } from "../Actions/untrackedActions.js"

//====================================//
//======= * * * Tooltip * * * ========//
//====================================//

/**
 * @param {string} message - The message to be displayed in the tooltip
 * @param {Element} target - The target element the tooltip is associated with
 */
export const generateTooltip = (message, target) => {
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
    // dom.tooltip.classList.add("visible")
    if (location === "left") {
      dom.tooltip.classList.add("page-left")
    } else if (location === "center") {
      dom.tooltip.classList.add("page-center")
    }
    dom.tooltip.style.top = tooltipY + "px"
    dom.tooltip.style.left = tooltipX + "px"
  } else {
    // dom.tooltip.classList.remove("visible")
  }
}

//====================================//
//======== * * * Export * * * ========//
//====================================//

/**
 * Open save dialog box
 * TODO: (Low Priority) initialize save dialog box with default settings?
 */
export function openSaveDialogBox() {
  dom.saveContainer.style.display = "flex"
  state.saveDialogOpen = true
  setSaveFilesizePreview()
  dom.saveAsFileName.focus()
}

/**
 * Import image from desktop
 */
function importImage() {
  let reader
  let img = new Image()

  if (this.files && this.files[0]) {
    reader = new FileReader()
    reader.onload = (e) => {
      //TODO: (Medium Priority) check if image is too large and prompt user to resize
      //TODO: (High Priority) should a new layer be created for the imported image? Or maybe allow raster layers to be selected or created during active paste action and move temp layer accordingly?
      //1. logic similar to copy selection to put image into clipboard
      img.src = e.target.result
      img.onload = () => {
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = img.width
        tempCanvas.height = img.height
        const tempCTX = tempCanvas.getContext("2d", {
          willReadFrequently: true,
        })
        tempCTX.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)
        const previousClipboard = { ...state.selectClipboard }
        previousClipboard.selectProperties = {
          ...state.selectClipboard.selectProperties,
        }
        state.selectClipboard.selectProperties = {
          px1: 0,
          py1: 0,
          px2: img.width,
          py2: img.height,
        }
        state.selectClipboard.boundaryBox = {
          xMin: 0,
          yMin: 0,
          xMax: img.width,
          yMax: img.height,
        }
        state.selectClipboard.canvas = tempCanvas
        //2. paste clipboard onto canvas
        actionPasteSelection()
        //3. clear clipboard
        state.selectClipboard = previousClipboard
      }
    }
    reader.readAsDataURL(this.files[0])
  }
}

/**
 * Consolidate offscreen canvases and download image
 * TODO: (Middle Priority) Open dialog box with more options such as pixel size, etc.
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
 * TODO: (Middle Priority) initialize loading screen and stop loading screen after loaded
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
  //TODO: (Low Priority) Instead of rendering here, use a timer that resets on mousemove to detect idle time and move this logic to the mousemove event
  if (!state.touch) {
    state.tooltipMessage = e.target.dataset?.tooltip
    if (
      canvas.currentLayer.isPreview &&
      e.target.classList.contains("deactivate-paste")
    ) {
      state.tooltipMessage =
        state.tooltipMessage +
        "\n\nCannot use with temporary pasted layer. Selecting will confirm pasted pixels."
    }
    generateTooltip(state.tooltipMessage, e.target)
    if (dom.tooltipBtn.checked && state.tooltipMessage) {
      dom.tooltip.classList.add("visible")
    } else {
      dom.tooltip.classList.remove("visible")
    }
  }
})
document.body.addEventListener("click", (e) => {
  if (!state.touch) {
    //Hide tooltip on click
    dom.tooltip.classList.remove("visible")
  } else {
    //Handle tooltip for mobile
    let previousTooltipTarget = state.tooltipTarget
    state.tooltipMessage = e.target.dataset?.tooltip
    state.tooltipTarget = e.target
    if (
      canvas.currentLayer.isPreview &&
      e.target.classList.contains("deactivate-paste")
    ) {
      state.tooltipMessage =
        state.tooltipMessage +
        "\n\nCannot use with temporary pasted layer. Selecting will confirm pasted pixels."
    }
    generateTooltip(state.tooltipMessage, e.target)
    if (
      dom.tooltipBtn.checked &&
      state.tooltipMessage &&
      state.tooltipTarget !== previousTooltipTarget
    ) {
      dom.tooltip.classList.add("visible")
    } else {
      dom.tooltip.classList.remove("visible")
      state.tooltipTarget = null
    }
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
dom.gridBtn.addEventListener("click", () => {
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
dom.tooltipBtn.addEventListener("click", () => {
  if (dom.tooltipBtn.checked && state.tooltipMessage) {
    dom.tooltip.classList.add("visible")
  } else {
    dom.tooltip.classList.remove("visible")
  }
})
dom.openSaveBtn.addEventListener("click", (e) => {
  //reset value so that the same file can be imported multiple times
  e.target.value = null
})
dom.topMenu.addEventListener("click", (e) => {
  if (e.target.classList.contains("disabled")) {
    e.preventDefault()
    return
  }
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
dom.saveBtn.addEventListener("click", openSaveDialogBox)
dom.importBtn.addEventListener("change", importImage)
dom.exportBtn.addEventListener("click", exportImage)
//Edit Submenu events
dom.canvasSizeBtn.addEventListener("click", () => {
  if (canvas.pastedLayer) {
    //if there is a pasted layer active, do not open canvas size dialog
    return
  }
  dom.sizeContainer.style.display = "flex"
})
dom.selectAllBtn.addEventListener("click", actionSelectAll)
dom.deselectBtn.addEventListener("click", actionDeselect)
dom.invertSelectionBtn.addEventListener("click", actionInvertSelection)
dom.cutBtn.addEventListener("click", actionCutSelection)
dom.copyBtn.addEventListener("click", actionCopySelection)
dom.pasteBtn.addEventListener("click", actionPasteSelection)
// dom.flipHorizontalBtn.addEventListener("click", (e) => {
//   //TODO: (High Priority) flip selected pixels horizontally
// })
// dom.flipVerticalBtn.addEventListener("click", (e) => {
//   //TODO: (High Priority) flip selected pixels vertically
// })
// dom.rotateBtn.addEventListener("click", (e) => {
//   //TODO: (High Priority) rotate selected pixels
// })
//Settings events
dom.settingsBtn.addEventListener("click", () => {
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
dom.cancelSaveBtn.addEventListener("click", () => {
  dom.saveContainer.style.display = "none"
  state.saveDialogOpen = false
})
