import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { consolidateLayers } from "../Canvas/layers.js"

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
 */
function exportImage() {
  consolidateLayers()
  const a = document.createElement("a")
  a.style.display = "none"
  a.href = canvas.offScreenCVS.toDataURL()
  a.download = "pixelvee.png"
  document.body.appendChild(a)
  a.click()
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

dom.debuggerBtn.addEventListener("click", (e) => {
  if (dom.debuggerBtn.checked) {
    state.debugger = true
  } else {
    state.debugger = false
  }
})
dom.gridBtn.addEventListener("click", (e) => {
  if (dom.gridBtn.checked) {
    state.grid = true
  } else {
    state.grid = false
  }
  vectorGui.render(state, canvas)
})
dom.tooltipBtn.addEventListener("click", (e) => {
  if (dom.tooltipBtn.checked) {
    const tooltipMessage = dom.tooltipBtn.parentNode.dataset?.tooltip
    showTooltip(tooltipMessage, dom.tooltipBtn.parentNode)
  } else {
    dom.tooltip.classList.remove("visible")
  }
})
dom.exportBtn.addEventListener("click", exportImage)
