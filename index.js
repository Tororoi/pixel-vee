//Import order is important. 1. DOM initialization, 2. state managers
// import { initializeAllDialogBoxes } from "./DOM/dialogBox.js"
import { state } from "./Context/state.js"
import { canvas, resizeOnScreenCanvas } from "../Context/canvas.js"
import { swatches } from "./Context/swatch.js"
import { tools, adjustEllipseSteps } from "./Tools/index.js"
import { actionUndoRedo } from "./Tools/undoRedo.js"
import { vectorGui } from "./GUI/vector.js"
import { renderCursor, renderRasterGUI } from "./GUI/raster.js"
import { drawRect, drawCircle } from "./utils/brushHelpers.js"

//===================================//
//========= * * * DOM * * * =========//
//===================================//

//Get the undo buttons
let undoBtn = document.getElementById("undo")
let redoBtn = document.getElementById("redo")

//Get the reset buttons
let recenterBtn = document.querySelector(".recenter")
let clearBtn = document.querySelector(".clear")

//zoom buttons
let zoomCont = document.querySelector(".zoom")

//Get tool buttons
let toolsCont = document.querySelector(".tools")
let toolBtn = document.querySelector("#brush")
toolBtn.style.background = "rgb(255, 255, 255)"

let modesCont = document.querySelector(".modes")
let modeBtn = document.querySelector("#draw")
modeBtn.style.background = "rgb(255, 255, 255)"

//Tooltip
let tooltip = document.getElementById("tooltip")

//Options
let lineWeight = document.querySelector("#line-weight")
let brushBtn = document.querySelector(".brush-preview")
let brushPreview = document.querySelector("#brush-preview")
let brushSlider = document.querySelector("#brush-size")

//Menu
//Toggle Debugger
let debuggerBtn = document.getElementById("debugger-toggle")
//Toggle Grid
let gridBtn = document.getElementById("grid-toggle")
//Toggle Tooltips
let tooltipBtn = document.getElementById("tooltips-toggle")
//Export
let exportBtn = document.querySelector(".export")

//TODO: Add Palette that consists of a small canvas with basic paint, sample and fill erase tools.
//TODO: Add color mixer that consists of a small canvas that can be painted upon and cleared. At any time the user can click "Mix" and the colors on the canvas will be used to generate a mixed color.

//===================================//
//=== * * * Initialization * * * ====//
//===================================//

//Initialize first layer
canvas.addRasterLayer()
canvas.currentLayer = canvas.layers[0]
canvas.renderLayersToDOM()

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

const showTooltip = (message, target) => {
  if (message && target) {
    const targetRect = target.getBoundingClientRect()
    const targetCenter = targetRect.left + targetRect.width / 2
    const pageSideRight = window.innerWidth / 2 < targetCenter
    tooltip.innerText = message
    const tooltipRect = tooltip.getBoundingClientRect()
    const tooltipX = pageSideRight
      ? targetRect.left - tooltipRect.width
      : targetRect.left + targetRect.width
    const tooltipY = targetRect.top + targetRect.height + 16
    tooltip.classList.add("visible")
    if (!pageSideRight) {
      tooltip.classList.add("page-left")
    }
    tooltip.style.top = tooltipY + "px"
    tooltip.style.left = tooltipX + "px"
  } else {
    tooltip.classList.remove("visible")
    tooltip.classList.remove("page-left")
  }
}

document.body.addEventListener("mouseover", (e) => {
  if (tooltipBtn.checked) {
    const tooltipMessage = e.target.dataset?.tooltip
    showTooltip(tooltipMessage, e.target)
  }
})

//Window
window.addEventListener("resize", resizeOnScreenCanvas)

//Shortcuts
document.addEventListener("keydown", handleKeyDown)
document.addEventListener("keyup", handleKeyUp)
canvas.vectorGuiCVS.addEventListener("wheel", handleWheel, { passive: true })

//Pointer
canvas.vectorGuiCVS.addEventListener("pointermove", handlePointerMove)
canvas.vectorGuiCVS.addEventListener("pointerdown", handlePointerDown)
canvas.vectorGuiCVS.addEventListener("pointerup", handlePointerUp)
canvas.vectorGuiCVS.addEventListener("pointerout", handlePointerOut) //NOTE: Deprecated? May need to rewrite just for multistep tools such as curve that can be in use while pointer is up

canvas.vectorGuiCVS.addEventListener("touchstart", handleTouchStart, {
  passive: true,
})
canvas.vectorGuiCVS.addEventListener("mousedown", handleMouseDown)
//Toolbox
undoBtn.addEventListener("click", handleUndo)
redoBtn.addEventListener("click", handleRedo)

recenterBtn.addEventListener("click", handleRecenter)
clearBtn.addEventListener("click", handleClear)

zoomCont.addEventListener("click", handleZoom)

toolsCont.addEventListener("click", handleTools)
modesCont.addEventListener("click", handleModes)

brushBtn.addEventListener("click", switchBrush)
brushSlider.addEventListener("input", updateBrush)

debuggerBtn.addEventListener("click", (e) => {
  if (debuggerBtn.checked) {
    state.debugger = true
  } else {
    state.debugger = false
  }
})
gridBtn.addEventListener("click", (e) => {
  if (gridBtn.checked) {
    state.grid = true
  } else {
    state.grid = false
  }
  vectorGui.render(state, canvas)
})
tooltipBtn.addEventListener("click", (e) => {
  if (tooltipBtn.checked) {
    const tooltipMessage = tooltipBtn.parentNode.dataset?.tooltip
    showTooltip(tooltipMessage, tooltipBtn.parentNode)
  } else {
    tooltip.classList.remove("visible")
  }
})
exportBtn.addEventListener("click", exportImage)

//======================================//
//=== * * * Key Event Handlers * * * ===//
//======================================//

function handleKeyDown(e) {
  if (state.shortcuts) {
    switch (e.code) {
      case "ArrowLeft":
        if (state.debugger) {
          canvas.render()
          state.debugObject.maxSteps -= 1
          state.debugFn(state.debugObject)
        }
        break
      case "ArrowRight":
        if (state.debugger) {
          state.debugObject.maxSteps += 1
          state.debugFn(state.debugObject)
        }
        break
      case "KeyZ":
        if (e.metaKey) {
          if (e.shiftKey) {
            //shift+meta+z
            handleRedo()
          } else {
            handleUndo()
          }
        }
        break
      case "MetaLeft":
      case "MetaRight":
        //command key
        break
      case "Space":
        state.tool = tools["grab"]
        canvas.vectorGuiCVS.style.cursor = "move"
        break
      case "AltLeft":
      case "AltRight":
        //option key
        state.tool = tools["eyedropper"]
        canvas.vectorGuiCVS.style.cursor = "none"
        break
      case "ShiftLeft":
      case "ShiftRight":
        if (toolBtn.id === "brush") {
          state.tool = tools["line"]
          state.tool.brushSize = tools["brush"].brushSize
          canvas.vectorGuiCVS.style.cursor = "none"
        } else if (toolBtn.id === "ellipse") {
          state.vectorProperties.forceCircle = true
          if (vectorGui.selectedPoint.xKey && state.clickCounter === 0) {
            //while holding control point, readjust ellipse without having to move cursor.
            //TODO: update this functionality to have other radii go back to previous radii when releasing shift
            adjustEllipseSteps()
            vectorGui.render(state, canvas)
          }
        }
        break
      case "KeyS":
        swatches.randomizeColor("swatch btn")
        break
      case "KeyD":
        //reset old button
        modeBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        modeBtn = document.querySelector("#draw")
        modeBtn.style.background = "rgb(255, 255, 255)"
        state.mode = "draw"
        break
      case "KeyE":
        //reset old button
        modeBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        modeBtn = document.querySelector("#erase")
        modeBtn.style.background = "rgb(255, 255, 255)"
        state.mode = "erase"
        break
      case "KeyP":
        //reset old button
        modeBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        modeBtn = document.querySelector("#perfect")
        modeBtn.style.background = "rgb(255, 255, 255)"
        state.mode = "perfect"
        break
      case "KeyB":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#brush")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["brush"]
        canvas.vectorGuiCVS.style.cursor = "crosshair"
        break
      case "KeyR":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#replace")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["replace"]
        canvas.vectorGuiCVS.style.cursor = "crosshair"
        break
      case "KeyL":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#line")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["line"]
        canvas.vectorGuiCVS.style.cursor = "none"
        break
      case "KeyF":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#fill")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["fill"]
        canvas.vectorGuiCVS.style.cursor = "none"
        break
      case "KeyC":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#curve")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["quadCurve"]
        canvas.vectorGuiCVS.style.cursor = "none"
        break
      case "KeyJ":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#cubicCurve")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["cubicCurve"]
        canvas.vectorGuiCVS.style.cursor = "none"
        break
      case "KeyO":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#ellipse")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["ellipse"]
        canvas.vectorGuiCVS.style.cursor = "none"
        break
      default:
      //do nothing
    }
  }
}

function handleKeyUp(e) {
  if (
    e.code === "Space" ||
    e.code === "AltLeft" ||
    e.code === "AltRight" ||
    e.code === "ShiftLeft" ||
    e.code === "ShiftRight"
  ) {
    state.tool = tools[toolBtn.id]
    state.vectorProperties.forceCircle = false
  }

  if (toolBtn.id === "grab") {
    canvas.vectorGuiCVS.style.cursor = "move"
  } else if (
    toolBtn.id === "replace" ||
    toolBtn.id === "brush" ||
    toolBtn.id === "quadCurve" ||
    toolBtn.id === "cubicCurve" ||
    toolBtn.id === "ellipse" ||
    toolBtn.id === "fill" ||
    toolBtn.id === "line"
  ) {
    canvas.vectorGuiCVS.style.cursor = "crosshair"
  } else {
    canvas.vectorGuiCVS.style.cursor = "none"
  }
}

//========================================//
//==== * * Pointer Event Handlers * * ====//
//========================================//

const setCoordinates = (e) => {
  const x = e.offsetX
  const y = e.offsetY
  const fidelity = canvas.zoom / 16
  canvas.subPixelX = Math.floor(
    (Math.floor(e.offsetX) -
      Math.floor(Math.floor(e.offsetX) / canvas.zoom) * canvas.zoom) /
      fidelity
  )
  canvas.subPixelY = Math.floor(
    (Math.floor(e.offsetY) -
      Math.floor(Math.floor(e.offsetY) / canvas.zoom) * canvas.zoom) /
      fidelity
  )
  state.cursorWithCanvasOffsetX = Math.floor(x / canvas.zoom)
  state.cursorWithCanvasOffsetY = Math.floor(y / canvas.zoom)
  state.cursorX = Math.round(state.cursorWithCanvasOffsetX - canvas.xOffset)
  state.cursorY = Math.round(state.cursorWithCanvasOffsetY - canvas.yOffset)
}

function handlePointerDown(e) {
  //reset media type, chrome dev tools niche use or computers that have touchscreen capabilities
  e.target.setPointerCapture(e.pointerId)
  canvas.pointerEvent = "pointerdown"
  state.clicked = true
  if (state.clickDisabled) {
    return
  }
  setCoordinates(e)
  // if (state.touch) {
  vectorGui.render(state, canvas) // For tablets, vectors must be rendered before running state.tool.fn in order to check control points collision logic
  // }
  canvas.draw()
  //Reset Cursor for mobile
  state.onscreenX = state.cursorWithCanvasOffsetX
  state.onscreenY = state.cursorWithCanvasOffsetY
  state.previousOnscreenX = state.onscreenX
  state.previousOnscreenY = state.onscreenY
  //if drawing on hidden layer, flash hide btn
  if (canvas.currentLayer.opacity === 0) {
    for (let i = 0; i < layersCont.children.length; i += 1) {
      if (layersCont.children[i].layerObj === canvas.currentLayer) {
        layersCont.children[i].querySelector(".hide").classList.add("warning")
      }
    }
  }
  //run selected tool step function
  state.tool.fn()
  //Re-render GUI
  renderRasterGUI(state, canvas, swatches)
  vectorGui.render(state, canvas)
}

function handlePointerMove(e) {
  if (state.clickDisabled && state.clicked) {
    return
  }
  canvas.pointerEvent = "pointermove"
  state.clickDisabled = false
  //currently only square dimensions work
  canvas.zoomAtLastDraw = canvas.zoom //* */
  //coords
  setCoordinates(e)
  //Hover brush
  state.onscreenX = state.cursorWithCanvasOffsetX
  state.onscreenY = state.cursorWithCanvasOffsetY
  renderRasterGUI(state, canvas, swatches)
  vectorGui.render(state, canvas)
  if (
    state.clicked ||
    ((state.tool.name === "quadCurve" ||
      state.tool.name === "cubicCurve" ||
      state.tool.name === "fill") &&
      state.clickCounter > 0)
  ) {
    //run selected tool step function
    state.tool.fn()
    if (state.tool.name !== "grab") {
      if (
        state.onscreenX !== state.previousOnscreenX ||
        state.onscreenY !== state.previousOnscreenY
      ) {
        state.previousOnscreenX = state.onscreenX
        state.previousOnscreenY = state.onscreenY
      }
    }
  } else {
    renderCursor(state, canvas, swatches)
    //normalize cursor render to pixelgrid
    if (
      state.onscreenX !== state.previousOnscreenX ||
      state.onscreenY !== state.previousOnscreenY
    ) {
      state.previousOnscreenX = state.onscreenX
      state.previousOnscreenY = state.onscreenY
    }
  }
}

function handlePointerUp(e) {
  canvas.pointerEvent = "pointerup"
  state.clicked = false
  if (state.clickDisabled) {
    return
  }
  setCoordinates(e)
  if (canvas.currentLayer.opacity === 0) {
    for (let i = 0; i < layersCont.children.length; i += 1) {
      if (layersCont.children[i].layerObj === canvas.currentLayer) {
        layersCont.children[i]
          .querySelector(".hide")
          .classList.remove("warning")
      }
    }
  }
  //run selected tool step function
  state.tool.fn()
  //add to undo stack
  if (state.points.length) {
    //TODO: for modification actions, set "to" values on moddedActionIndex before pushing
    state.undoStack.push(state.points)

    if (
      state.tool.name === "fill" ||
      state.tool.name === "quadCurve" ||
      state.tool.name === "cubicCurve" ||
      state.tool.name === "ellipse"
    ) {
      if (state.points[0].tool.type === "vector") {
        canvas.currentVectorIndex = state.undoStack.indexOf(state.points)
      } else if (state.points[0].tool.type === "modify") {
        canvas.currentVectorIndex = state.points[0].properties.moddedActionIndex
      }
      canvas.renderVectorsToDOM()
    }
  }
  state.points = []
  //Reset redostack
  state.redoStack = []
  canvas.pointerEvent = "none"
  if (!e.targetTouches) {
    renderRasterGUI(state, canvas, swatches)
    vectorGui.render(state, canvas)
    renderCursor(state, canvas, swatches)
  }
}
function handlePointerOut(e) {
  //TODO: if touchscreen, need to handle differently. Currently cannot reach next code since clicked will be false.
  //Only purpose is to rerender with multi step tools such as curve when moving out or in the case of touch, lifting finger
  // if (state.clicked) {
  //   canvas.pointerEvent = "pointerout"
  //   state.clicked = false
  //   state.tool.fn()
  //   //add to undo stack
  //   if (state.points.length) {
  //     state.undoStack.push(state.points)
  //   }
  //   state.points = []
  //   //Reset redostack
  //   state.redoStack = []
  // }
  if (!state.touch) {
    canvas.draw()
    renderRasterGUI(state, canvas, swatches)
    vectorGui.render(state, canvas)
    // canvas.draw()
    canvas.pointerEvent = "none"
  }
}

/**
 * Zoom the canvas
 * @param {float} z - ratio to multiply zoom by
 * @param {integer} xOriginOffset - additional offset needed to keep zoom centered around cursor
 * @param {integer} yOriginOffset - additional offset needed to keep zoom centered around cursor
 */
function zoomCanvas(z, xOriginOffset, yOriginOffset) {
  canvas.zoom *= z
  canvas.xOffset = Math.round(xOriginOffset)
  canvas.yOffset = Math.round(yOriginOffset)
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  //re scale canvas
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.rasterGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.onScreenCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.draw()
  renderRasterGUI(state, canvas, swatches)
  vectorGui.render(state, canvas)
}

function handleWheel(e) {
  let delta = Math.sign(e.deltaY)
  //BUG: zoom doesn't stay centered, wobbles slightly (due to forcing the normalization to the pixelgrid?)
  //zoom based on pointer coords
  let z
  setCoordinates(e)
  if (delta < 0) {
    z = 0.5
    //get target coordinates
    let zoomedX = state.cursorWithCanvasOffsetX / z
    let zoomedY = state.cursorWithCanvasOffsetY / z
    //offset by cursor coords
    let nox = zoomedX - state.cursorX
    let noy = zoomedY - state.cursorY
    if (canvas.zoom > 0.5) {
      zoomCanvas(z, nox, noy)
    }
  } else if (delta > 0) {
    z = 2
    //get target coordinates
    let zoomedX = state.cursorWithCanvasOffsetX / z
    let zoomedY = state.cursorWithCanvasOffsetY / z
    //offset by half of canvas
    let nox = zoomedX - state.cursorX
    let noy = zoomedY - state.cursorY
    if (canvas.zoom < 32) {
      zoomCanvas(z, nox, noy)
    }
  }
}

//=========================================//
//=== * * * Button Event Handlers * * * ===//
//=========================================//

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
        zoomCanvas(z, nox, noy)
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
        zoomCanvas(z, nox, noy)
      }
    }
  }
}

//TODO: to allow modifications of past actions, check last action in undoStack. If it is a modification action, reverse it.
//This means setting the modded action's values back. Normally they are structured as {moddedActionIndex, from:, to:}, so set them back to the "from" values
function handleUndo() {
  //length 1 prevents initial layer from being undone
  if (state.undoStack.length > 1) {
    actionUndoRedo(state.redoStack, state.undoStack, "from")
  }
}

function handleRedo() {
  if (state.redoStack.length >= 1) {
    actionUndoRedo(state.undoStack, state.redoStack, "to")
  }
}

//Non-tool action.
//TODO: must also update all vectors to be "removed" in a non destructive way, think about what that means for the timeline
export function handleClear() {
  state.addToTimeline({ tool: tools.clear, layer: canvas.currentLayer })
  //FIX: restructure stacked items. Currently each is an array, but each should be an object with more info plus an array
  //TODO: set all actions to hidden 
  state.undoStack.push(state.points)
  state.points = []
  state.redoStack = []
  canvas.currentLayer.ctx.clearRect(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
  canvas.draw()
  vectorGui.reset(canvas)
  state.reset()
}

export function handleRecenter(e) {
  canvas.zoom = canvas.setInitialZoom(
    Math.max(canvas.offScreenCVS.width, canvas.offScreenCVS.height)
  )
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.rasterGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.onScreenCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.xOffset = Math.round(
    (canvas.onScreenCVS.width / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.width) /
      2
  )
  canvas.yOffset = Math.round(
    (canvas.onScreenCVS.height / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.height) /
      2
  )
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  canvas.draw()
  renderRasterGUI(state, canvas, swatches)
  vectorGui.render(state, canvas)
}

export function handleTools(e, manualToolName = null) {
  const targetTool = e?.target.closest(".tool")
  if (targetTool || manualToolName) {
    //failsafe for hacking tool ids
    if (tools[targetTool?.id || manualToolName]) {
      //reset old button
      toolBtn.style.background = "rgb(131, 131, 131)"
      //get new button and select it
      if (manualToolName) {
        toolBtn = document.querySelector(`#${manualToolName}`)
      } else {
        toolBtn = targetTool
      }
      toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools[toolBtn.id]
      canvas.draw()
      //update options
      updateStamp()
      brushSlider.value = state.tool.brushSize
      brushSlider.disabled = state.tool.disabled
      //update cursor
      if (toolBtn.id === "grab") {
        canvas.vectorGuiCVS.style.cursor = "move"
      } else if (
        toolBtn.id === "replace" ||
        toolBtn.id === "brush" ||
        toolBtn.id === "quadCurve" ||
        toolBtn.id === "cubicCurve" ||
        toolBtn.id === "ellipse" ||
        toolBtn.id === "fill" ||
        toolBtn.id === "line"
      ) {
        canvas.vectorGuiCVS.style.cursor = "crosshair"
        vectorGui.reset(canvas)
        state.reset()
      } else {
        canvas.vectorGuiCVS.style.cursor = "none"
      }
    }
  }
}

//TODO: modes should allow multiple at once, not one at a time
//TODO: add multi-touch mode for drawing with multiple fingers
function handleModes(e) {
  if (e.target.closest(".mode")) {
    //reset old button
    modeBtn.style.background = "rgb(131, 131, 131)"
    //get new button and select it
    modeBtn = e.target.closest(".mode")
    modeBtn.style.background = "rgb(255, 255, 255)"
    state.mode = modeBtn.id
  }
}

//===========================================//
//=== * * * Graphics User Interface * * * ===//
//===========================================//

//=====================================//
//======== * * * Options * * * ========//
//=====================================//

function switchBrush(e) {
  if (state.brushType === "square") {
    state.brushType = "circle"
  } else {
    state.brushType = "square"
  }
  updateStamp()
}

function updateBrush(e) {
  switch (state.tool.name) {
    case "brush":
      state.tool.brushSize = parseInt(e.target.value)
      break
    case "replace":
      state.tool.brushSize = parseInt(e.target.value)
      break
    case "line":
      state.tool.brushSize = parseInt(e.target.value)
      break
    case "quadCurve":
      state.tool.brushSize = parseInt(e.target.value)
      break
    case "cubicCurve":
      state.tool.brushSize = parseInt(e.target.value)
      break
    case "ellipse":
      state.tool.brushSize = parseInt(e.target.value)
      break
    default:
    //do nothing for other tools
  }
  updateStamp()
}

function updateStamp() {
  lineWeight.textContent = state.tool.brushSize
  brushPreview.style.width = state.tool.brushSize * 2 + "px"
  brushPreview.style.height = state.tool.brushSize * 2 + "px"
  if (state.brushType === "circle") {
    state.brushStamp = drawCircle(state.tool.brushSize, true) //circle
  } else {
    state.brushStamp = drawRect(state.tool.brushSize, true) //square
  }
}

//====================================//
//======== * * * Export * * * ========//
//====================================//

function exportImage() {
  canvas.consolidateLayers()
  const a = document.createElement("a")
  a.style.display = "none"
  a.href = canvas.offScreenCVS.toDataURL()
  a.download = "pixelvee.png"
  document.body.appendChild(a)
  a.click()
}

//====================================//
//===== * * * Touchscreens * * * =====//
//====================================//

//Fit canvas and tools so no scrolling necessary

//Maximize drawing space:
//Tools and other dialog boxes should be collapsed and
//accessible upon touching, which reveals list of options/tools
//hub icon, can store all dialog boxes, can drag out and in dialog boxes which user wants for a customized toolset

//Identify whether program is being used by touchscreen or mouse. Important for multi-step tools such as curve
function handleTouchStart(e) {
  state.touch = true
}

function handleMouseDown(e) {
  if (e.type === "mousedown") {
    state.touch = false // NOTE: this also triggers when in tablet mode in chrome. Comment this out while testing
  }
}
