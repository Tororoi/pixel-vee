import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools, toolGroups } from "../Tools/index.js"
import { handleUndo, handleRedo } from "../Actions/undoRedo/undoRedo.js"
import { brush, rebuildBuildUpDensityMap, BAYER_STEPS } from "../Tools/brush.js"
import { vectorGui } from "../GUI/vector.js"
import { actionClear } from "../Actions/modifyTimeline/modifyTimeline.js"
import { actionZoom, actionRecenter } from "../Actions/untracked/viewActions.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderVectorsToDOM,
  renderBrushStampToDOM,
  renderDitherOptionsToDOM,
  renderDitherControlsToDOM,
  renderBuildUpStepsToDOM,
  initDitherPicker,
  highlightSelectedDitherPattern,
  updateDitherPickerColors,
  applyDitherOffset,
  applyDitherOffsetControl,
} from "../DOM/render.js"
import { toggleMode, switchTool, initToolGroups } from "./toolbox.js"
import { ZOOM_LEVELS } from "../utils/constants.js"

//Initialize default tool
state.tool.current = tools.brush
initToolGroups()
renderDitherOptionsToDOM()

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
    const thisGroup = groupBtn.closest(".tool-group")
    document
      .querySelectorAll(".tool-group.open")
      .forEach((g) => { if (g !== thisGroup) g.classList.remove("open") })
    thisGroup?.classList.toggle("open")
    const groupName = groupBtn.dataset.group
    const activeTool = toolGroups[groupName]?.activeTool
    if (activeTool) {
      switchTool(activeTool)
      renderVectorsToDOM()
    }
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
    case "colorMask":
    case "line":
    case "quadCurve":
    case "cubicCurve":
    case "ellipse":
    case "rectangle":
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

dom.undoBtn.addEventListener("click", () => {
  handleUndo()
  if (brush.modes.buildUpDither) rebuildBuildUpDensityMap()
})
dom.redoBtn.addEventListener("click", () => {
  handleRedo()
  if (brush.modes.buildUpDither) rebuildBuildUpDensityMap()
})

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
  if (!dom.ditherPickerContainer) return
  initDitherPicker()
  updateDitherPickerColors()
  dom.ditherPickerContainer.style.display =
    dom.ditherPickerContainer.style.display === "flex" ? "none" : "flex"
})

const DITHER_TOOLS = ["brush", "line", "quadCurve", "cubicCurve", "ellipse"]

document.querySelector(".dither-grid")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".dither-grid-btn")
  if (!btn) return
  const patternIndex = parseInt(btn.dataset.patternIndex)

  if (!DITHER_TOOLS.includes(state.tool.current.name)) return
  if (brush.buildUpActiveStepSlot !== null) {
    // Assign the selected pattern to the active build-up step slot
    brush.buildUpSteps[brush.buildUpActiveStepSlot] = patternIndex
    brush.buildUpActiveStepSlot = null
    renderBuildUpStepsToDOM()
  } else {
    state.tool.current.ditherPatternIndex = patternIndex
    highlightSelectedDitherPattern()
    renderDitherOptionsToDOM()
  }
})

document.getElementById("dither-ctrl-two-color")?.addEventListener("click", () => {
  if (!DITHER_TOOLS.includes(state.tool.current.name)) return
  state.tool.current.modes.twoColor = !state.tool.current.modes.twoColor
  renderDitherControlsToDOM()
  updateDitherPickerColors()
  renderDitherOptionsToDOM()
})

document.querySelector('.dither-picker-container')?.addEventListener('pointerdown', (e) => {
  const control = e.target.closest('.dither-offset-control')
  if (!control) return
  if (!DITHER_TOOLS.includes(state.tool.current.name)) return
  control.setPointerCapture(e.pointerId)
  const startX = e.clientX
  const startY = e.clientY
  const startOffsetX = state.tool.current.ditherOffsetX ?? 0
  const startOffsetY = state.tool.current.ditherOffsetY ?? 0
  const onMove = (ev) => {
    const ox = ((startOffsetX - Math.round((ev.clientX - startX) / 4)) % 8 + 8) % 8
    const oy = ((startOffsetY - Math.round((ev.clientY - startY) / 4)) % 8 + 8) % 8
    state.tool.current.ditherOffsetX = ox
    state.tool.current.ditherOffsetY = oy
    const picker = document.querySelector('.dither-picker-container')
    if (picker) applyDitherOffset(picker, ox, oy)
    const preview = document.querySelector('.dither-preview')
    if (preview) applyDitherOffset(preview, ox, oy)
    applyDitherOffsetControl(control.parentElement, ox, oy)
  }
  control.addEventListener('pointermove', onMove)
  control.addEventListener('pointerup', () => control.removeEventListener('pointermove', onMove), { once: true })
})

document.getElementById("dither-ctrl-build-up")?.addEventListener("click", () => {
  if (state.tool.current.name !== "brush") return
  brush.modes.buildUpDither = !brush.modes.buildUpDither
  if (brush.modes.buildUpDither) {
    rebuildBuildUpDensityMap()
  } else {
    brush._buildUpDensityMap = new Map()
    brush.buildUpActiveStepSlot = null
  }
  renderDitherControlsToDOM()
  renderDitherOptionsToDOM()
})

document.getElementById("dither-ctrl-build-up-reset")?.addEventListener("click", () => {
  if (state.tool.current.name !== "brush") return
  brush._buildUpResetAtIndex = state.timeline.undoStack.length
  brush._buildUpDensityMap = new Map()
})

// Build-up mode selector (Custom / 2×2 / 4×4 / 8×8)
document.querySelector(".build-up-mode-selector")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".build-up-mode-btn")
  if (!btn || state.tool.current.name !== "brush") return
  const mode = btn.dataset.mode
  // Save custom steps before leaving custom mode
  if (brush.buildUpMode === "custom" && mode !== "custom") {
    brush._customBuildUpSteps = [...brush.buildUpSteps]
  }
  brush.buildUpMode = mode
  if (mode === "custom") {
    brush.buildUpSteps = [...brush._customBuildUpSteps]
  } else {
    brush.buildUpSteps = [...BAYER_STEPS[mode]]
  }
  brush.buildUpActiveStepSlot = null
  renderBuildUpStepsToDOM()
})

// Step slot clicks: set the active slot index then open the dither picker
document.querySelector(".build-up-step-slots")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".build-up-step-btn")
  if (!btn) return
  const slotIndex = parseInt(btn.dataset.stepSlot)
  brush.buildUpActiveStepSlot = brush.buildUpActiveStepSlot === slotIndex ? null : slotIndex
  renderBuildUpStepsToDOM()
  // Ensure the picker is open for pattern selection
  if (brush.buildUpActiveStepSlot !== null && dom.ditherPickerContainer) {
    initDitherPicker()
    updateDitherPickerColors()
    dom.ditherPickerContainer.style.display = "flex"
  }
})

