import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { handleUndo, handleRedo } from "../Actions/undoRedo.js"
import { vectorGui } from "../GUI/vector.js"
import { actionClear } from "../Actions/modifyTimeline.js"
import { actionZoom, actionRecenter } from "../Actions/untrackedActions.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderVectorsToDOM,
  renderBrushStampToDOM,
  renderDitherOptionsToDOM,
  initDitherPicker,
  highlightSelectedDitherPattern,
} from "../DOM/render.js"
import { toggleMode, switchTool, initToolGroups } from "./toolbox.js"
import { ZOOM_LEVELS } from "../utils/constants.js"

//Initialize default tool
state.tool.current = tools.brush
initToolGroups()

//=========================================//
//=== * * * Button Event Handlers * * * ===//
//=========================================//

/**
 * Handle zoom buttons
 * @param {PointerEvent} e - click event
 */
function handleZoom(e) {
  const zoomBtn = e.target.closest(".zoombtn")
  if (!zoomBtn) return
  let idx = ZOOM_LEVELS.findIndex((l) => l >= canvas.zoom)
  if (idx === -1) idx = ZOOM_LEVELS.length - 1
  const nextIdx = zoomBtn.id === "minus" ? idx - 1 : idx + 1
  if (nextIdx < 0 || nextIdx >= ZOOM_LEVELS.length) return
  const z = ZOOM_LEVELS[nextIdx] / canvas.zoom
  //get new expected centered offsets based on center of canvas
  const zoomedX = (canvas.xOffset + canvas.offScreenCVS.width / 2) / z
  const zoomedY = (canvas.yOffset + canvas.offScreenCVS.height / 2) / z
  const nox = zoomedX - canvas.offScreenCVS.width / 2
  const noy = zoomedY - canvas.offScreenCVS.height / 2
  actionZoom(z, nox, noy)
}

/**
 * Recenter canvas. Does not affect timeline
 */
function handleRecenter() {
  actionRecenter()
}

/**
 * Non-cursor action that affects the timeline
 */
function handleClearCanvas() {
  //Do not allow clearing if active paste is happening
  if (canvas.pastedLayer) {
    return
  }
  canvas.currentLayer.ctx.clearRect(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
  state.selection.pointsSet = null
  state.selection.seenPixelsSet = null
  state.timeline.clearPoints()
  vectorGui.reset()
  state.reset()
  actionClear(canvas.currentLayer)

  state.clearRedoStack()
  renderCanvas(canvas.currentLayer)
  renderVectorsToDOM()
}

/**
 * Switch tools
 * @param {PointerEvent} e - click event
 */
export function handleTools(e) {
  // Handle group button click — toggle popout open/closed
  const groupBtn = e?.target.closest(".tool-group-btn")
  if (groupBtn) {
    groupBtn.closest(".tool-group")?.classList.toggle("open")
    return
  }
  // Handle tool click (works for both regular tools and tools inside popouts)
  const targetTool = e?.target.closest(".tool")
  if (!targetTool) return
  // Close any open popout before switching
  document
    .querySelectorAll(".tool-group.open")
    .forEach((g) => g.classList.remove("open"))
  switchTool(null, targetTool)
  renderVectorsToDOM()
}

// Close open popouts when clicking outside any tool group
document.addEventListener("click", (e) => {
  if (!e.target.closest(".tool-group")) {
    document
      .querySelectorAll(".tool-group.open")
      .forEach((g) => g.classList.remove("open"))
  }
})

/**
 * @param {PointerEvent} e - click event
 */
export function handleModes(e) {
  const targetMode = e?.target.closest(".mode")
  toggleMode(null, targetMode)
}

//=====================================//
//======== * * * Options * * * ========//
//=====================================//

/**
 * @param {PointerEvent} e - click event
 */
function switchBrush(e) {
  if (state.tool.current.brushType === "square") {
    state.tool.current.brushType = "circle"
  } else {
    state.tool.current.brushType = "square"
  }
  renderBrushStampToDOM()
}

/**
 * @param {InputEvent} e - input event
 */
function updateBrush(e) {
  switch (state.tool.current.name) {
    case "brush":
    case "ditherBrush":
    case "colorMask":
    case "line":
    case "quadCurve":
    case "cubicCurve":
    case "ellipse":
    case "select":
      state.tool.current.brushSize = parseInt(e.target.value)
      break
    default:
    //do nothing for other tools
  }
  renderBrushStampToDOM()
}

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

dom.undoBtn.addEventListener("click", handleUndo)
dom.redoBtn.addEventListener("click", handleRedo)

dom.recenterBtn.addEventListener("click", handleRecenter)
dom.clearBtn.addEventListener("click", handleClearCanvas)

dom.zoomContainer.addEventListener("click", handleZoom)

dom.toolsContainer.addEventListener("click", handleTools)
dom.modesContainer.addEventListener("click", handleModes)

// * Brush * //
dom.brushDisplay.addEventListener("click", switchBrush)
dom.brushSlider.addEventListener("input", updateBrush)

// * Dither Brush * //
document.querySelector(".dither-preview")?.addEventListener("click", () => {
  const picker = document.querySelector(".dither-picker")
  if (!picker) return
  initDitherPicker()
  picker.style.display = picker.style.display === "none" ? "" : "none"
})

document.querySelector(".dither-grid")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".dither-grid-btn")
  if (!btn || state.tool.current.name !== "ditherBrush") return
  state.tool.current.ditherPatternIndex = parseInt(btn.dataset.patternIndex)
  highlightSelectedDitherPattern()
  renderDitherOptionsToDOM()
})

document.getElementById("dither-two-color")?.addEventListener("change", (e) => {
  if (state.tool.current.name === "ditherBrush") {
    state.tool.current.modes.twoColor = e.target.checked
  }
})
