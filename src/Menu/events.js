import { dom } from '../Context/dom.js'
import { globalState } from '../Context/state.js'
import { bump } from '../hooks/appState.svelte.js'
import { canvas } from '../Context/canvas.js'
import { activateResizeOverlay } from '../Canvas/resizeOverlay.js'
import { vectorGui } from '../GUI/vector.js'
import { consolidateLayers } from '../Canvas/layers.js'
import {
  setSaveFilesizePreview,
  saveDrawing,
  loadDrawing,
} from '../Save/savefile.js'
import { measureTextWidth } from '../utils/measureHelpers.js'
import {
  actionSelectAll,
  actionDeselect,
  actionDeleteSelection,
} from '../Actions/nonPointer/selectionActions.js'
import {
  actionCutSelection,
  actionPasteSelection,
  actionCopySelection,
} from '../Actions/nonPointer/clipboardActions.js'
import {
  actionFlipPixels,
  actionRotatePixels,
} from '../Actions/transform/rasterTransform.js'

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
    dom.tooltip.classList.remove('page-left')
    dom.tooltip.classList.remove('page-center')
    //get location and boundaries of target
    const targetRect = target.getBoundingClientRect()
    const targetCenter = targetRect.left + targetRect.width / 2
    //get location of element relative to page (left, center, right)
    let location = 'left'
    if (window.innerWidth * (2 / 3) < targetCenter) {
      location = 'right'
    } else if (window.innerWidth / 3 < targetCenter) {
      location = 'center'
    }
    dom.tooltip.innerText = message
    const tooltipRect = dom.tooltip.getBoundingClientRect()
    let tooltipX
    if (location === 'right') {
      tooltipX = targetRect.left - tooltipRect.width
    } else if (location === 'center') {
      tooltipX = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
    } else {
      tooltipX = targetRect.left + targetRect.width
    }
    const tooltipY = targetRect.top + targetRect.height + 16
    // dom.tooltip.classList.add("visible")
    if (location === 'left') {
      dom.tooltip.classList.add('page-left')
    } else if (location === 'center') {
      dom.tooltip.classList.add('page-center')
    }
    dom.tooltip.style.top = tooltipY + 'px'
    dom.tooltip.style.left = tooltipX + 'px'
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
  globalState.ui.saveDialogOpen = true
  if (dom.saveContainer) dom.saveContainer.style.display = 'flex'
  bump()
  setSaveFilesizePreview()
  if (dom.saveAsFileName) dom.saveAsFileName.focus()
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
      //TODO: (Medium Priority) should a new layer be created for the imported image?
      //1. logic similar to copy selection to put image into clipboard
      img.src = e.target.result
      img.onload = () => {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = img.width
        tempCanvas.height = img.height
        const tempCTX = tempCanvas.getContext('2d', {
          willReadFrequently: true,
        })
        tempCTX.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height)
        const previousClipboard = { ...globalState.clipboard.select }
        previousClipboard.selectProperties = {
          ...globalState.clipboard.select.selectProperties,
        }
        globalState.clipboard.select.selectProperties = {
          px1: 0,
          py1: 0,
          px2: img.width,
          py2: img.height,
        }
        globalState.clipboard.select.boundaryBox = {
          xMin: 0,
          yMin: 0,
          xMax: img.width,
          yMax: img.height,
        }
        globalState.clipboard.select.canvas = tempCanvas
        globalState.clipboard.select.imageData = tempCTX.getImageData(
          0,
          0,
          img.width,
          img.height,
        )
        //2. paste clipboard onto canvas
        actionPasteSelection()
        //3. clear clipboard
        globalState.clipboard.select = previousClipboard
      }
    }
    reader.readAsDataURL(this.files[0])
  }
}

/**
 * Consolidate offscreen canvases and download image
 * TODO: (Medium Priority) Open dialog box with more options such as pixel size, format (png, gif), etc.
 */
function exportImage() {
  //save .png
  consolidateLayers()
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = canvas.offScreenCVS.toDataURL()
  a.download = 'pixelvee.png'
  document.body.appendChild(a)
  a.click()
}

/**
 * Open json file from desktop and load into layers and timeline
 * TODO: (Medium Priority) initialize loading screen and stop loading screen after loaded
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

//TODO: (Medium Priority) use event delegation so menu elements can be created dynamically

document.body.addEventListener('mouseover', (e) => {
  //TODO: (Low Priority) Instead of rendering here, use a timer that resets on mousemove to detect idle time and move this logic to the mousemove event
  if (!globalState.tool.touch) {
    globalState.ui.tooltipMessage = e.target.dataset?.tooltip
    if (
      canvas.currentLayer.isPreview &&
      e.target.classList.contains('deactivate-paste')
    ) {
      globalState.ui.tooltipMessage =
        globalState.ui.tooltipMessage +
        '\n\nCannot use with temporary pasted layer. Selecting will confirm pasted pixels.'
    }
    generateTooltip(globalState.ui.tooltipMessage, e.target)
    if (globalState.ui.showTooltips && globalState.ui.tooltipMessage) {
      dom.tooltip.classList.add('visible')
    } else {
      dom.tooltip.classList.remove('visible')
    }
  }
})
document.body.addEventListener('click', (e) => {
  if (!globalState.tool.touch) {
    //Hide tooltip on click
    dom.tooltip.classList.remove('visible')
  } else {
    //Handle tooltip for mobile
    let previousTooltipTarget = globalState.ui.tooltipTarget
    globalState.ui.tooltipMessage = e.target.dataset?.tooltip
    globalState.ui.tooltipTarget = e.target
    if (
      canvas.currentLayer.isPreview &&
      e.target.classList.contains('deactivate-paste')
    ) {
      globalState.ui.tooltipMessage =
        globalState.ui.tooltipMessage +
        '\n\nCannot use with temporary pasted layer. Selecting will confirm pasted pixels.'
    }
    generateTooltip(globalState.ui.tooltipMessage, e.target)
    if (
      globalState.ui.showTooltips &&
      globalState.ui.tooltipMessage &&
      globalState.ui.tooltipTarget !== previousTooltipTarget
    ) {
      dom.tooltip.classList.add('visible')
    } else {
      dom.tooltip.classList.remove('visible')
      globalState.ui.tooltipTarget = null
    }
  }
})
// tool-options click handled by NavBar React component
if (dom.toolOptions) {
  dom.toolOptions.addEventListener('click', (e) => {
    if (e.target.type === 'checkbox') {
      const optionName = e.target.id.split('-')[0]
      if (e.target.checked) {
        globalState.tool.current.options[optionName].active = true
      } else {
        globalState.tool.current.options[optionName].active = false
      }
      vectorGui.render()
    }
  })
}
// Settings/grid/cursor handled by SettingsDialog React component
if (dom.gridBtn)
  dom.gridBtn.addEventListener('click', () => {
    vectorGui.grid = dom.gridBtn.checked
    vectorGui.render()
  })
if (dom.cursorPreviewBtn)
  dom.cursorPreviewBtn.addEventListener('click', () => {
    vectorGui.showCursorPreview = dom.cursorPreviewBtn.checked
  })
if (dom.gridSpacing)
  dom.gridSpacing.addEventListener('input', (e) => {
    if (e.target.value < 1) e.target.value = 1
    else if (e.target.value > 64) e.target.value = 64
    vectorGui.gridSpacing = parseInt(e.target.value)
    vectorGui.render()
  })
if (dom.gridSpacingSpinBtn)
  dom.gridSpacingSpinBtn.addEventListener('pointerdown', (e) => {
    if (e.target.id === 'inc') vectorGui.gridSpacing++
    else if (e.target.id === 'dec') vectorGui.gridSpacing--
    if (vectorGui.gridSpacing < 1) vectorGui.gridSpacing = 1
    else if (vectorGui.gridSpacing > 64) vectorGui.gridSpacing = 64
    if (dom.gridSpacing) dom.gridSpacing.value = vectorGui.gridSpacing
    vectorGui.render()
  })
if (dom.tooltipBtn)
  dom.tooltipBtn.addEventListener('click', () => {
    if (dom.tooltipBtn.checked && globalState.ui.tooltipMessage) {
      dom.tooltip.classList.add('visible')
    } else {
      dom.tooltip.classList.remove('visible')
    }
  })
// File menu events — handled by NavBar React component; guard until migrated
if (dom.openSaveBtn)
  dom.openSaveBtn.addEventListener('click', (e) => {
    e.target.value = null
  })
if (dom.topMenu)
  dom.topMenu.addEventListener('click', (e) => {
    if (e.target.classList.contains('disabled')) {
      e.preventDefault()
      return
    }
    if (document.activeElement.classList.contains('menu-folder')) {
      if (document.activeElement.classList.contains('active')) {
        document.activeElement.classList.remove('active')
      } else {
        document.activeElement.classList.add('active')
      }
    }
  })
if (dom.topMenu)
  dom.topMenu.addEventListener('focusout', (e) => {
    if (e.target.classList.contains('menu-folder')) {
      e.target.classList.remove('active')
    }
  })
if (dom.openSaveBtn)
  dom.openSaveBtn.addEventListener('change', openSavedDrawing)
if (dom.saveBtn) dom.saveBtn.addEventListener('click', openSaveDialogBox)
if (dom.importBtn) dom.importBtn.addEventListener('change', importImage)
if (dom.exportBtn) dom.exportBtn.addEventListener('click', exportImage)
if (dom.canvasSizeBtn)
  dom.canvasSizeBtn.addEventListener('click', () => {
    if (canvas.pastedLayer) return
    globalState.ui.canvasSizeOpen = true
    if (dom.sizeContainer) dom.sizeContainer.style.display = 'flex'
    bump()
    activateResizeOverlay()
  })
if (dom.selectAllBtn)
  dom.selectAllBtn.addEventListener('click', actionSelectAll)
if (dom.deselectBtn) dom.deselectBtn.addEventListener('click', actionDeselect)
if (dom.cutBtn) dom.cutBtn.addEventListener('click', actionCutSelection)
if (dom.copyBtn) dom.copyBtn.addEventListener('click', actionCopySelection)
if (dom.pasteBtn) dom.pasteBtn.addEventListener('click', actionPasteSelection)
if (dom.deleteBtn)
  dom.deleteBtn.addEventListener('click', actionDeleteSelection)
if (dom.flipHorizontalBtn)
  dom.flipHorizontalBtn.addEventListener('click', () => actionFlipPixels(true))
if (dom.flipVerticalBtn)
  dom.flipVerticalBtn.addEventListener('click', () => actionFlipPixels(false))
if (dom.rotateBtn) dom.rotateBtn.addEventListener('click', actionRotatePixels)
// Settings button handled by NavBar React component; guard until migrated
if (dom.settingsBtn)
  dom.settingsBtn.addEventListener('click', () => {
    globalState.ui.settingsOpen = !globalState.ui.settingsOpen
    bump()
  })
// Save form events — handled by SaveDialog React component; guard until migrated
if (dom.saveAsForm)
  dom.saveAsForm.addEventListener('change', (e) => {
    if (e.target.id === 'preserve-history-toggle') {
      globalState.ui.saveSettings.preserveHistory = e.target.checked
      setSaveFilesizePreview()
    } else if (e.target.id === 'include-palette-toggle') {
      globalState.ui.saveSettings.includePalette = e.target.checked
      setSaveFilesizePreview()
    } else if (e.target.id === 'include-reference-layers-toggle') {
      globalState.ui.saveSettings.includeReferenceLayers = e.target.checked
      setSaveFilesizePreview()
    } else if (e.target.id === 'include-removed-actions-toggle') {
      globalState.ui.saveSettings.includeRemovedActions = e.target.checked
      setSaveFilesizePreview()
    }
  })
if (dom.saveAsForm)
  dom.saveAsForm.addEventListener('submit', (e) => {
    e.preventDefault()
    saveDrawing()
    globalState.ui.saveDialogOpen = false
    if (dom.saveContainer) dom.saveContainer.style.display = 'none'
    bump()
  })
if (dom.saveAsFileName)
  dom.saveAsFileName.addEventListener('input', (e) => {
    globalState.ui.saveSettings.saveAsFileName = e.target.value
    dom.saveAsFileName.style.width =
      measureTextWidth(
        globalState.ui.saveSettings.saveAsFileName,
        "16px '04Font'",
      ) +
      2 +
      'px'
  })
if (dom.cancelSaveBtn)
  dom.cancelSaveBtn.addEventListener('click', () => {
    globalState.ui.saveDialogOpen = false
    if (dom.saveContainer) dom.saveContainer.style.display = 'none'
    bump()
  })
