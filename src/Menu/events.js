import { dom } from '../Context/dom.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'

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
