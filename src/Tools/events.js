import { dom } from "../Context/dom.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { tools } from "../Tools/index.js"
import { handleUndo, handleRedo } from "../Actions/undoRedo.js"
import { vectorGui } from "../GUI/vector.js"
import { updateBrushPreview } from "../utils/brushHelpers.js"
import { actionClear } from "../Actions/modifyTimeline.js"
import { actionZoom, actionRecenter } from "../Actions/untrackedActions.js"
import { renderCanvas } from "../Canvas/render.js"
import { renderVectorsToDOM, renderBrushModesToDOM } from "../DOM/render.js"
import { renderCursor } from "../GUI/cursor.js"
import { createOptionToggle } from "../utils/optionsInterfaceHelpers.js"
import { testAction } from "../Testing/performanceTesting.js"
import { storedActions } from "../Testing/storedActions.js"

//=========================================//
//=== * * * Button Event Handlers * * * ===//
//=========================================//

/**
 * Handle zoom buttons
 * @param {PointerEvent} e
 */
function handleZoom(e) {
  //TRY: restrict zoom to fixed multiples, 125%, 150% etc
  //general zoom based on center
  if (e.target.closest(".zoombtn")) {
    let zoomBtn = e.target.closest(".zoombtn")
    let z
    if (zoomBtn.id === "minus") {
      z = 0.5
      //get new expected centered offsets based on center of canvas
      //get center coordinates
      let zoomedX = (canvas.xOffset + canvas.offScreenCVS.width / 2) / z
      let zoomedY = (canvas.yOffset + canvas.offScreenCVS.height / 2) / z
      // offset by half of canvas
      let nox = zoomedX - canvas.offScreenCVS.width / 2
      let noy = zoomedY - canvas.offScreenCVS.height / 2
      if (canvas.zoom > 0.5) {
        actionZoom(z, nox, noy)
      }
    } else if (zoomBtn.id === "plus") {
      z = 2
      //get new expected centered offsets based on center of canvas
      //get center coordinates
      let zoomedX = (canvas.xOffset + canvas.offScreenCVS.width / 2) / z
      let zoomedY = (canvas.yOffset + canvas.offScreenCVS.height / 2) / z
      //offset by half of canvas
      let nox = zoomedX - canvas.offScreenCVS.width / 2
      let noy = zoomedY - canvas.offScreenCVS.height / 2
      if (canvas.zoom < 64) {
        actionZoom(z, nox, noy)
      }
    }
  }
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
  canvas.currentLayer.ctx.clearRect(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
  actionClear(canvas.currentLayer)
  state.action = null
  state.pointsSet = null
  state.seenPixelsSet = null
  state.points = []
  state.redoStack = []
  renderCanvas(canvas.currentLayer)
  vectorGui.reset()
  state.reset()
  renderVectorsToDOM()
}

/**
 * Switch tools
 * @param {PointerEvent} e
 * @param {String} manualToolName
 */
export function handleTools(e, manualToolName = null) {
  const targetTool = e?.target.closest(".tool")
  if (targetTool || manualToolName) {
    //failsafe for hacking tool ids
    if (tools[targetTool?.id || manualToolName]) {
      //reset old button
      dom.toolBtn.classList.remove("selected")
      //get new button and select it
      if (manualToolName) {
        dom.toolBtn = document.querySelector(`#${manualToolName}`)
      } else {
        dom.toolBtn = targetTool
      }
      //Uncomment to run performance test for selected tool if testing is enabled
      // if (state.captureTesting && storedActions[dom.toolBtn.id]) {
      //   testAction(dom.toolBtn.id)
      // }
      dom.toolBtn.classList.add("selected")
      state.tool = tools[dom.toolBtn.id]
      renderCanvas(canvas.currentLayer)
      //update options
      renderBrushStampToDOM()
      dom.brushSlider.value = state.tool.brushSize
      dom.brushSlider.disabled = state.tool.disabled
      //update cursor
      if (state.tool.modes?.eraser) {
        canvas.vectorGuiCVS.style.cursor = "none"
      } else {
        canvas.vectorGuiCVS.style.cursor = state.tool.cursor
      }
      //render menu options
      renderToolOptionsToDOM()
      vectorGui.reset()
      state.reset()
      renderVectorsToDOM()
      renderBrushModesToDOM()
      renderCursor(state, canvas, swatches)
    }
  }
}

/**
 * TODO: add multi-touch mode for drawing with multiple fingers
 * TODO: add curve brush mode for freehand drawing splines
 * @param {PointerEvent} e
 * @param {String} manualModeName
 */
export function handleModes(e, manualModeName = null) {
  let targetMode = e?.target.closest(".mode")
  if (targetMode || manualModeName) {
    if (manualModeName) {
      targetMode = document.querySelector(`#${manualModeName}`)
    }
    if (targetMode.classList.contains("selected")) {
      state.tool.modes[targetMode.id] = false
    } else {
      state.tool.modes[targetMode.id] = true
      if (targetMode.id === "eraser" && state.tool.modes?.inject) {
        state.tool.modes.inject = false
      } else if (targetMode.id === "inject" && state.tool.modes?.eraser) {
        state.tool.modes.eraser = false
      }
    }
    if (state.tool.modes?.eraser) {
      canvas.vectorGuiCVS.style.cursor = "none"
    } else {
      canvas.vectorGuiCVS.style.cursor = "crosshair"
    }
    // vectorGui.reset()
    // state.reset()
    renderBrushModesToDOM()
    renderCursor(state, canvas, swatches)
  }
}

//=====================================//
//======== * * * Options * * * ========//
//=====================================//

/**
 *
 * @param {PointerEvent} e
 */
function switchBrush(e) {
  if (state.tool.brushType === "square") {
    state.tool.brushType = "circle"
  } else {
    state.tool.brushType = "square"
  }
  renderBrushStampToDOM()
}

/**
 *
 * @param {InputEvent} e
 */
function updateBrush(e) {
  switch (state.tool.name) {
    case "brush":
    case "colorMask":
    case "line":
    case "quadCurve":
    case "cubicCurve":
    case "ellipse":
    case "select":
      state.tool.brushSize = parseInt(e.target.value)
      break
    default:
    //do nothing for other tools
  }
  renderBrushStampToDOM()
}

/**
 * update brush stamp in dom
 */
export function renderBrushStampToDOM() {
  dom.lineWeight.textContent = state.tool.brushSize
  dom.brushPreview.style.width = state.tool.brushSize * 2 + "px"
  dom.brushPreview.style.height = state.tool.brushSize * 2 + "px"
  updateBrushPreview(
    brushStamps[state.tool.brushType][state.tool.brushSize]["0,0"],
    state.tool.brushSize
  )
}

/**
 *
 */
export function renderToolOptionsToDOM() {
  dom.toolOptions.innerHTML = ""
  if (
    state.tool.name === "cubicCurve" ||
    state.tool.name === "quadCurve" ||
    state.tool.name === "ellipse"
  ) {
    //render cubic curve options to menu
    Object.entries(state.tool.options).forEach(([key, value]) => {
      let optionToggle = createOptionToggle(
        key,
        value
        // option.tooltip
      )
      dom.toolOptions.appendChild(optionToggle)
    })
  }
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
