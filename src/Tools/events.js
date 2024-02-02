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
} from "../DOM/render.js"
import { toggleMode, switchTool } from "./toolbox.js"

//Initialize default tool
state.tool = tools.brush

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
 */
export function handleTools(e) {
  const targetTool = e?.target.closest(".tool")
  switchTool(null, targetTool)
}

/**
 * @param {PointerEvent} e
 */
export function handleModes(e) {
  const targetMode = e?.target.closest(".mode")
  toggleMode(null, targetMode)
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
