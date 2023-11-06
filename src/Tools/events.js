import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { handleUndo, handleRedo } from "../Actions/undoRedo.js"
import { vectorGui } from "../GUI/vector.js"
import { createSquareBrush, createCircleBrush } from "../utils/brushHelpers.js"
import { actionClear } from "../Actions/actions.js"
import { actionZoom, actionRecenter } from "../Actions/untrackedActions.js"
import { renderCanvas } from "../Canvas/render.js"
import { renderVectorsToDOM } from "../DOM/render.js"

//=========================================//
//=== * * * Button Event Handlers * * * ===//
//=========================================//

/**
 * Handle zoom buttons
 * @param {PointerEvent} e
 */
function handleZoom(e) {
  //BUG: zoom doesn't stay centered, wobbles slightly (due to forcing the normalization to the pixelgrid?)
  //BUG: on mobile zoom causes cursor coords to desync with pixelgrid
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
      //offset by half of canvas
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
  actionClear(canvas.currentLayer)
  state.undoStack.push(state.action)
  state.action = null
  state.pointsSet = null
  state.drawnPointsSet = null
  state.points = []
  state.redoStack = []
  canvas.currentLayer.ctx.clearRect(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
  renderCanvas(null) //render all layers
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
      dom.toolBtn.classList.add("selected")
      state.tool = tools[dom.toolBtn.id]
      renderCanvas(canvas.currentLayer)
      //update options
      updateStamp()
      dom.brushSlider.value = state.tool.brushSize
      dom.brushSlider.disabled = state.tool.disabled
      //update cursor
      if (dom.modeBtn.id === "erase") {
        canvas.vectorGuiCVS.style.cursor = "none"
      } else {
        canvas.vectorGuiCVS.style.cursor = state.tool.cursor
      }
      vectorGui.reset()
      state.reset()
      renderVectorsToDOM()
    }
  }
}

/**
 * TODO: modes should allow multiple at once, not one at a time
 * TODO: add multi-touch mode for drawing with multiple fingers
 * @param {PointerEvent} e
 * @param {String} manualModeName
 */
export function handleModes(e, manualModeName = null) {
  const targetMode = e?.target.closest(".mode")
  if (targetMode || manualModeName) {
    //reset old button
    dom.modeBtn.classList.remove("selected")
    //get new button and select it
    if (manualModeName) {
      dom.modeBtn = document.querySelector(`#${manualModeName}`)
    } else {
      dom.modeBtn = targetMode
    }
    dom.modeBtn.classList.add("selected")
    state.mode = dom.modeBtn.id
    if (dom.modeBtn.id === "erase") {
      canvas.vectorGuiCVS.style.cursor = "none"
    } else {
      canvas.vectorGuiCVS.style.cursor = "crosshair"
    }
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
  if (state.brushType === "square") {
    state.brushType = "circle"
  } else {
    state.brushType = "square"
  }
  updateStamp()
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
  updateStamp()
}

/**
 * update brush stamp
 */
export function updateStamp() {
  dom.lineWeight.textContent = state.tool.brushSize
  dom.brushPreview.style.width = state.tool.brushSize * 2 + "px"
  dom.brushPreview.style.height = state.tool.brushSize * 2 + "px"
  if (state.brushType === "circle") {
    state.brushStamp = createCircleBrush(state.tool.brushSize, true) //circle
  } else {
    state.brushStamp = createSquareBrush(state.tool.brushSize, true) //square
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
