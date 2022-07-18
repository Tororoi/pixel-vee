//Import order is important. 1. DOM initialization, 2. state managers
import { initializeAllDialogBoxes } from "./DOM/dialogBox.js"
import { state } from "../Context/state.js"
import { canvas, resizeOnScreenCanvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"

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
let brush = document.querySelector(".brush")

//Menu
//Toggle Tooltips
let tooltipBtn = document.getElementById("tooltips-toggle")
//Export
let exportBtn = document.querySelector(".export")

//TODO: Add Palette that consists of a small canvas with basic paint, sample and fill erase tools.
//TODO: Add color mixer that consists of a small canvas that can be painted upon and cleared. At any time the user can click "Mix" and the colors on the canvas will be used to generate a mixed color.
//TODO: Add draggability to each interface. Each interface will have a top strip with a drag button and a title,
//as well as a collapse/expand button. Interfaces cannot be dragged offscreen.
//There should be a button to set interface layout to default.

//========================================//
//=== * * * Important References * * * ===//
//========================================//

//Tools
const tools = {
  brush: {
    name: "brush",
    fn: drawSteps,
    brushSize: 1,
    disabled: false,
    options: ["perfect"],
  },
  //FIX: allow replace to use different brush sizes
  replace: {
    name: "replace",
    fn: replaceSteps,
    brushSize: 1,
    disabled: false,
    options: ["perfect"],
  },
  select: {
    name: "select",
    fn: selectSteps,
    brushSize: 1,
    disabled: false,
    options: ["magic wand"],
  },
  // shading: {
  // user selects hsl shading color which mixes with colors that the user draws on to create dynamic shading
  // },
  line: {
    name: "line",
    fn: lineSteps,
    brushSize: 1,
    disabled: false,
    options: [],
  },
  fill: {
    name: "fill",
    fn: fillSteps,
    brushSize: 1,
    disabled: true,
    options: ["contiguous"],
  },
  // gradient: {
  // Create a dithered gradient
  // },
  curve: {
    name: "curve",
    fn: curveSteps,
    brushSize: 1,
    disabled: false,
    options: [],
  },
  // shapes: {
  // square, circle, and custom saved shape?
  // },
  eyedropper: {
    name: "eyedropper",
    fn: eyedropperSteps,
    brushSize: 1,
    disabled: true,
    options: [],
  },
  grab: {
    name: "grab",
    fn: grabSteps,
    brushSize: 1,
    disabled: true,
    options: [],
  },
  // move: {
  // Move a layer's coordinates independent of other layers
  // }
}

//Initialize default tool
state.tool = tools.brush

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
canvas.onScreenCVS.addEventListener("wheel", handleWheel, { passive: true })

//Pointer
canvas.onScreenCVS.addEventListener("pointermove", handlePointerMove)
canvas.onScreenCVS.addEventListener("pointerdown", handlePointerDown)
canvas.onScreenCVS.addEventListener("pointerup", handlePointerUp)
canvas.onScreenCVS.addEventListener("pointerout", handlePointerOut) //NOTE: Deprecated? May need to rewrite just for multistep tools such as curve that can be in use while pointer is up

canvas.onScreenCVS.addEventListener("touchstart", handleTouchStart, {
  passive: true,
})
canvas.onScreenCVS.addEventListener("mousedown", handleMouseDown)
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
        canvas.onScreenCVS.style.cursor = "move"
        break
      case "AltLeft":
      case "AltRight":
        //option key
        state.tool = tools["eyedropper"]
        canvas.onScreenCVS.style.cursor = "none"
        break
      case "ShiftLeft":
      case "ShiftRight":
        if (toolBtn.id === "brush") {
          state.tool = tools["line"]
          state.tool.brushSize = tools["brush"].brushSize
          canvas.onScreenCVS.style.cursor = "none"
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
        canvas.onScreenCVS.style.cursor = "crosshair"
        break
      case "KeyR":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#replace")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["replace"]
        canvas.onScreenCVS.style.cursor = "crosshair"
        break
      case "KeyL":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#line")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["line"]
        canvas.onScreenCVS.style.cursor = "none"
        break
      case "KeyF":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#fill")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["fill"]
        canvas.onScreenCVS.style.cursor = "none"
        break
      case "KeyC":
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)"
        //set new button
        toolBtn = document.querySelector("#curve")
        toolBtn.style.background = "rgb(255, 255, 255)"
        state.tool = tools["curve"]
        canvas.onScreenCVS.style.cursor = "none"
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
  }

  if (toolBtn.id === "grab") {
    canvas.onScreenCVS.style.cursor = "move"
  } else if (
    toolBtn.id === "replace" ||
    toolBtn.id === "brush" ||
    toolBtn.id === "curve" ||
    toolBtn.id === "fill" ||
    toolBtn.id === "line"
  ) {
    canvas.onScreenCVS.style.cursor = "crosshair"
  } else {
    canvas.onScreenCVS.style.cursor = "none"
  }
}

//========================================//
//==== * * Pointer Event Handlers * * ====//
//========================================//

const setCoordinates = (e) => {
  const x = e.offsetX
  const y = e.offsetY
  canvas.subPixelX =
    Math.floor(e.offsetX) -
    Math.floor(Math.floor(e.offsetX) / canvas.zoom) * canvas.zoom
  canvas.subPixelY =
    Math.floor(e.offsetY) -
    Math.floor(Math.floor(e.offsetY) / canvas.zoom) * canvas.zoom
  state.cursorWithCanvasOffsetX = Math.floor(x / canvas.zoom)
  state.cursorWithCanvasOffsetY = Math.floor(y / canvas.zoom)
  state.cursorX = Math.round(
    state.cursorWithCanvasOffsetX -
      canvas.xOffset / (canvas.offScreenCVS.width / canvas.offScreenCVS.width)
  )
  state.cursorY = Math.round(
    state.cursorWithCanvasOffsetY -
      canvas.yOffset / (canvas.offScreenCVS.width / canvas.offScreenCVS.width)
  )
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
  //Reset Cursor for mobile
  state.onscreenX =
    state.cursorWithCanvasOffsetX *
    (canvas.offScreenCVS.width / canvas.offScreenCVS.width)
  state.onscreenY =
    state.cursorWithCanvasOffsetY *
    (canvas.offScreenCVS.width / canvas.offScreenCVS.width)
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
  // console.log(canvas.subPixelX, canvas.subPixelY)
  //Hover brush
  state.onscreenX =
    state.cursorWithCanvasOffsetX *
    (canvas.offScreenCVS.width / canvas.offScreenCVS.width)
  state.onscreenY =
    state.cursorWithCanvasOffsetY *
    (canvas.offScreenCVS.width / canvas.offScreenCVS.width)
  if (
    state.clicked ||
    (state.tool.name === "curve" && state.clickCounter > 0)
  ) {
    //run selected tool step function
    state.tool.fn()
  } else {
    //normalize cursor render to pixelgrid
    if (
      state.onscreenX !== state.previousOnscreenX ||
      state.onscreenY !== state.previousOnscreenY
    ) {
      canvas.onScreenCTX.clearRect(
        0,
        0,
        canvas.offScreenCVS.width / canvas.zoom,
        canvas.offScreenCVS.height / canvas.zoom
      )
      canvas.draw()
      renderCursor()
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
    state.undoStack.push(state.points)
  }
  state.points = []
  //Reset redostack
  state.redoStack = []
  canvas.pointerEvent = "none"
  if (!e.targetTouches) {
    renderCursor()
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
    canvas.pointerEvent = "none"
  }
}

/**
 * Zoom the canvas
 * @param {float} z - ratio to multiply zoom by
 * @param {integer} xOriginOffset - additional offset needed to keep zoom centered around cursor
 * @param {integer} yOriginOffset - additional offset needed to keep zoom centered around cursor
 */
function zoom(z, xOriginOffset, yOriginOffset) {
  canvas.zoom *= z
  canvas.xOffset = Math.round(xOriginOffset)
  canvas.yOffset = Math.round(yOriginOffset)
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  //re scale canvas
  canvas.onScreenCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.draw()
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
      zoom(z, nox, noy)
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
      zoom(z, nox, noy)
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
        zoom(z, nox, noy)
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
      if (canvas.zoom < 32) {
        zoom(z, nox, noy)
      }
    }
  }
}

function handleUndo() {
  if (state.undoStack.length > 1) {
    //length 1 prevents initial layer from being undone
    actionUndoRedo(state.redoStack, state.undoStack)
  }
}

function handleRedo() {
  if (state.redoStack.length >= 1) {
    actionUndoRedo(state.undoStack, state.redoStack)
  }
}

function handleTools(e) {
  if (e.target.closest(".tool")) {
    //failsafe for hacking tool ids
    if (tools[e.target.closest(".tool").id]) {
      //reset old button
      toolBtn.style.background = "rgb(131, 131, 131)"
      //get new button and select it
      toolBtn = e.target.closest(".tool")
      toolBtn.style.background = "rgb(255, 255, 255)"
      state.tool = tools[toolBtn.id]
      //update options
      updateStamp()
      brushSlider.value = state.tool.brushSize
      brushSlider.disabled = state.tool.disabled
      //update cursor
      if (toolBtn.id === "grab") {
        canvas.onScreenCVS.style.cursor = "move"
      } else if (
        toolBtn.id === "replace" ||
        toolBtn.id === "brush" ||
        toolBtn.id === "curve" ||
        toolBtn.id === "fill" ||
        toolBtn.id === "line"
      ) {
        canvas.onScreenCVS.style.cursor = "crosshair"
      } else {
        canvas.onScreenCVS.style.cursor = "none"
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

function renderCursor() {
  switch (state.tool.name) {
    case "grab":
      //show nothing
      break
    case "eyedropper":
      //empty square
      drawCursorBox()
      break
    default:
      drawCurrentPixel()
    // drawCursorBox();
  }
}

function drawCurrentPixel() {
  //draw onscreen current pixel
  actionDraw(
    state.cursorWithCanvasOffsetX,
    state.cursorWithCanvasOffsetY,
    swatches.primary.color,
    state.brushStamp,
    state.tool.brushSize,
    canvas.onScreenCTX,
    state.mode,
    canvas.offScreenCVS.width / canvas.offScreenCVS.width
  )
}

function drawCursorBox() {
  let brushOffset =
    Math.floor(state.tool.brushSize / 2) *
    (canvas.offScreenCVS.width / canvas.offScreenCVS.width)
  let x0 = state.onscreenX - brushOffset
  let y0 = state.onscreenY - brushOffset
  let x1 =
    x0 +
    (canvas.offScreenCVS.width / canvas.offScreenCVS.width) *
      state.tool.brushSize
  let y1 =
    y0 +
    (canvas.offScreenCVS.width / canvas.offScreenCVS.width) *
      state.tool.brushSize
  //line offset to stroke offcenter;
  let ol = 0.25
  canvas.onScreenCTX.beginPath()
  canvas.onScreenCTX.lineWidth = 0.5
  canvas.onScreenCTX.strokeStyle = "black"
  //top
  canvas.onScreenCTX.moveTo(x0, y0 - ol)
  canvas.onScreenCTX.lineTo(x1, y0 - ol)
  //right
  canvas.onScreenCTX.moveTo(x1 + ol, y0)
  canvas.onScreenCTX.lineTo(x1 + ol, y1)
  //bottom
  canvas.onScreenCTX.moveTo(x0, y1 + ol)
  canvas.onScreenCTX.lineTo(x1, y1 + ol)
  //left
  canvas.onScreenCTX.moveTo(x0 - ol, y0)
  canvas.onScreenCTX.lineTo(x0 - ol, y1)

  canvas.onScreenCTX.stroke()
}

function drawRect() {
  let brushRects = []
  brush.setAttribute(
    "viewBox",
    `0 -0.5 ${state.tool.brushSize} ${state.tool.brushSize}`
  )
  brush.style.width = state.tool.brushSize * 2
  brush.style.height = state.tool.brushSize * 2
  function makePathData(x, y, w) {
    return "M" + x + " " + y + "h" + w + ""
  }
  function makePath(color, data) {
    return '<path stroke="' + color + '" d="' + data + '" />\n'
  }
  let paths = []

  brushRects.push({
    x: 0,
    y: 0,
    w: state.tool.brushSize,
    h: state.tool.brushSize,
  })

  brushRects.forEach((r) => {
    paths.push(makePathData(r.x, r.y, r.w))
  })

  brush.innerHTML = makePath("rgba(255,255,255,255)", paths.join(""))
  brush.setAttribute("stroke-width", state.tool.brushSize * 2)
  return brushRects
}

function drawCircle() {
  // let brushPoints = [];
  let brushRects = []
  let r = Math.floor(state.tool.brushSize / 2)
  let d = 4 - 2 * r //decision parameter in bresenham's algorithm
  d = (5 - 4 * r) / 4
  let x = 0,
    y = r
  let xO = r,
    yO = r

  brush.setAttribute(
    "viewBox",
    `0 -0.5 ${state.tool.brushSize} ${state.tool.brushSize}`
  )
  brush.style.width = state.tool.brushSize * 2
  brush.style.height = state.tool.brushSize * 2
  function makePathData(x, y, w) {
    return "M" + x + " " + y + "h" + w + ""
  }
  function makePath(color, data) {
    return '<path stroke="' + color + '" d="' + data + '" />\n'
  }
  let paths = []

  eightfoldSym(xO, yO, x, y)
  while (x < y) {
    x++
    if (d >= 0) {
      y--
      d += 2 * (x - y) + 1 //outside circle
    } else {
      d += 2 * x + 1 //inside circle
    }
    eightfoldSym(xO, yO, x, y)
  }

  function eightfoldSym(xc, yc, x, y) {
    //solid circle
    if (state.tool.brushSize % 2 === 0) {
      //connect octant pairs to form solid shape
      brushRects.push({ x: xc - x, y: yc - y, w: 2 * x, h: 1 }) //3, 2
      brushRects.push({ x: xc - y, y: yc - x, w: 2 * y, h: 1 }) //4, 1
      brushRects.push({ x: xc - y, y: yc + x - 1, w: 2 * y, h: 1 }) //5, 8
      brushRects.push({ x: xc - x, y: yc + y - 1, w: 2 * x, h: 1 }) //6, 7
    } else {
      brushRects.push({ x: xc - x, y: yc - y, w: 2 * x + 1, h: 1 }) //3, 2
      brushRects.push({ x: xc - y, y: yc - x, w: 2 * y + 1, h: 1 }) //4, 1
      brushRects.push({ x: xc - y, y: yc + x, w: 2 * y + 1, h: 1 }) //5, 8
      brushRects.push({ x: xc - x, y: yc + y, w: 2 * x + 1, h: 1 }) //6, 7
    }
  }

  brushRects.forEach((r) => {
    paths.push(makePathData(r.x, r.y, r.w))
  })

  brush.innerHTML = makePath("rgba(255,255,255,255)", paths.join(""))
  brush.setAttribute("stroke-width", 1)
  return brushRects
}

//====================================//
//===== * * * Action Tools * * * =====//
//====================================//

//"Steps" functions are controllers for the process
function drawSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //set colorlayer, then for each brushpoint, alter colorlayer and add each to timeline
      actionDraw(
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        state.brushStamp,
        state.tool.brushSize,
        canvas.currentLayer.ctx,
        state.mode
      )
      state.previousX = state.cursorX
      state.previousY = state.cursorY
      //for perfect pixels
      state.lastDrawnX = state.cursorX
      state.lastDrawnY = state.cursorY
      state.waitingPixelX = state.cursorX
      state.waitingPixelY = state.cursorY
      if (state.tool.name !== "replace") {
        state.addToTimeline(
          state.tool.name,
          state.cursorX,
          state.cursorY,
          canvas.currentLayer
        )
      }
      canvas.draw()
      break
    case "pointermove":
      if (state.mode === "perfect") {
        drawCurrentPixel()
      }
      if (
        state.previousX !== state.cursorX ||
        state.previousY !== state.cursorY
      ) {
        //draw between points when drawing fast
        if (
          Math.abs(state.cursorX - state.previousX) > 1 ||
          Math.abs(state.cursorY - state.previousY) > 1
        ) {
          actionLine(
            state.previousX,
            state.previousY,
            state.cursorX,
            state.cursorY,
            swatches.primary.color,
            canvas.currentLayer.ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
          if (state.tool.name !== "replace") {
            state.addToTimeline(
              "line",
              { x1: state.previousX, x2: state.cursorX },
              { y1: state.previousY, y2: state.cursorY },
              canvas.currentLayer
            )
          }
          canvas.draw()
        } else {
          //FIX: perfect will be option, not mode
          if (state.mode === "perfect") {
            canvas.draw()
            drawCurrentPixel()
            perfectPixels(state.cursorX, state.cursorY)
          } else {
            actionDraw(
              state.cursorX,
              state.cursorY,
              swatches.primary.color,
              state.brushStamp,
              state.tool.brushSize,
              canvas.currentLayer.ctx,
              state.mode
            )
            if (state.tool.name !== "replace") {
              state.addToTimeline(
                state.tool.name,
                state.cursorX,
                state.cursorY,
                canvas.currentLayer
              )
            }
            canvas.draw()
          }
        }
      }
      // save last point
      state.previousX = state.cursorX
      state.previousY = state.cursorY
      break
    case "pointerup":
      //only needed if perfect pixels option is on
      actionDraw(
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        state.brushStamp,
        state.tool.brushSize,
        canvas.currentLayer.ctx,
        state.mode
      )
      if (state.tool.name !== "replace") {
        state.addToTimeline(
          state.tool.name,
          state.cursorX,
          state.cursorY,
          canvas.currentLayer
        )
      }
      canvas.draw()
      break
    default:
    //do nothing
  }
}

function perfectPixels(currentX, currentY) {
  //if currentPixel not neighbor to lastDrawn, draw waitingpixel
  if (
    Math.abs(currentX - state.lastDrawnX) > 1 ||
    Math.abs(currentY - state.lastDrawnY) > 1
  ) {
    actionDraw(
      state.waitingPixelX,
      state.waitingPixelY,
      swatches.primary.color,
      state.brushStamp,
      state.tool.brushSize,
      canvas.currentLayer.ctx,
      state.mode
    )
    //update queue
    state.lastDrawnX = state.waitingPixelX
    state.lastDrawnY = state.waitingPixelY
    state.waitingPixelX = currentX
    state.waitingPixelY = currentY
    if (state.tool.name !== "replace") {
      state.addToTimeline(
        state.tool.name,
        state.lastDrawnX,
        state.lastDrawnY,
        canvas.currentLayer
      )
    }
    canvas.draw()
  } else {
    state.waitingPixelX = currentX
    state.waitingPixelY = currentY
  }
}

function actionDraw(
  coordX,
  coordY,
  currentColor,
  brushStamp,
  weight,
  ctx,
  currentMode,
  scale = 1
) {
  ctx.fillStyle = currentColor.color
  switch (currentMode) {
    case "erase":
      brushStamp.forEach((r) => {
        ctx.clearRect(
          (Math.ceil(coordX - weight / 2) + r.x) * scale,
          (Math.ceil(coordY - weight / 2) + r.y) * scale,
          r.w * scale,
          r.h * scale
        )
      })
      break
    default:
      // ctx.fillRect(Math.ceil(coordX - weight / 2), Math.ceil(coordY - weight / 2), weight, weight);
      brushStamp.forEach((r) => {
        ctx.fillRect(
          (Math.ceil(coordX - weight / 2) + r.x) * scale,
          (Math.ceil(coordY - weight / 2) + r.y) * scale,
          r.w * scale,
          r.h * scale
        )
      })
    // ctx.drawImage(brushStamp, Math.ceil(coordX - weight / 2), Math.ceil(coordY - weight / 2), weight, weight);
  }
}

function lineSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      state.previousX = state.cursorX
      state.previousY = state.cursorY
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //only draw when necessary
      if (
        state.onscreenX !== state.previousOnscreenX ||
        state.onscreenY !== state.previousOnscreenY
      ) {
        canvas.onScreenCTX.clearRect(
          0,
          0,
          canvas.offScreenCVS.width / canvas.zoom,
          canvas.offScreenCVS.height / canvas.zoom
        )
        canvas.draw()
        actionLine(
          state.previousX +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.previousY +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.cursorWithCanvasOffsetX,
          state.cursorWithCanvasOffsetY,
          swatches.primary.color,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          canvas.offScreenCVS.width / canvas.offScreenCVS.width
        )
        state.previousOnscreenX = state.onscreenX
        state.previousOnscreenY = state.onscreenY
      }
      break
    case "pointerup":
      actionLine(
        state.previousX,
        state.previousY,
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        canvas.currentLayer.ctx,
        state.mode,
        state.brushStamp,
        state.tool.brushSize
      )
      state.addToTimeline(
        state.tool.name,
        { x1: state.previousX, x2: state.cursorX },
        { y1: state.previousY, y2: state.cursorY },
        canvas.currentLayer
      )
      canvas.draw()
      break
    default:
    //do nothing
  }
}

function actionLine(
  sx,
  sy,
  tx,
  ty,
  currentColor,
  ctx,
  currentMode,
  brushStamp,
  weight,
  scale = 1
) {
  ctx.fillStyle = currentColor.color
  //create triangle object
  let tri = {}
  function getTriangle(x1, y1, x2, y2, ang) {
    if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
      tri.x = Math.sign(Math.cos(ang))
      tri.y = Math.tan(ang) * Math.sign(Math.cos(ang))
      tri.long = Math.abs(x1 - x2)
    } else {
      tri.x =
        Math.tan(Math.PI / 2 - ang) * Math.sign(Math.cos(Math.PI / 2 - ang))
      tri.y = Math.sign(Math.cos(Math.PI / 2 - ang))
      tri.long = Math.abs(y1 - y2)
    }
  }
  // finds the angle of (x,y) on a plane from the origin
  function getAngle(x, y) {
    return Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0)
  }
  let angle = getAngle(tx - sx, ty - sy) // angle of line
  getTriangle(sx, sy, tx, ty, angle)

  for (let i = 0; i < tri.long; i++) {
    let thispoint = {
      x: Math.round(sx + tri.x * i),
      y: Math.round(sy + tri.y * i),
    }
    // for each point along the line
    actionDraw(
      thispoint.x,
      thispoint.y,
      currentColor,
      brushStamp,
      weight,
      ctx,
      currentMode,
      scale
    )
  }
  //fill endpoint
  actionDraw(
    Math.round(tx),
    Math.round(ty),
    currentColor,
    brushStamp,
    weight,
    ctx,
    currentMode,
    scale
  )
}

function replaceSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //get global colorlayer data to use while pointer is down
      state.localColorLayer = canvas.currentLayer.ctx.getImageData(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      //create clip mask
      canvas.currentLayer.ctx.save()
      state.clipMask = createClipMask(state.localColorLayer)
      //Visualize clipmask
      let r = Math.floor(Math.random() * 256)
      let g = Math.floor(Math.random() * 256)
      let b = Math.floor(Math.random() * 256)
      // const color = `rgba(${r},${g},${b},255)`
      const color = "red"
      canvas.currentLayer.ctx.strokeStyle = color
      canvas.currentLayer.ctx.stroke(state.clipMask)
      //clip the masked area
      canvas.currentLayer.ctx.clip(state.clipMask)
      drawSteps()
      break
    case "pointermove":
      drawSteps()
      break
    case "pointerup":
      drawSteps()
      finalReplaceStep()
      break
    case "pointerout":
      finalReplaceStep()
      break
    default:
    //do nothing
  }
}

function finalReplaceStep() {
  canvas.currentLayer.ctx.restore()
  let image = new Image()
  image.src = canvas.currentLayer.cvs.toDataURL()
  state.addToTimeline(state.tool.name, image, null, canvas.currentLayer)
}

function selectSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //1. set drag origin
      //2. save context
      break
    case "pointermove":
      //1. if state.clicked create strokeable path using drag origin and current x/y as opposite corners of rectangle
      //2. stroke outline path with animated "marching ants".
      break
    case "pointerup":
      //1. create clip mask using drag origin and current x/y as opposite corners of rectangle
      break
    case "pointerout":
      //1. create clip mask using drag origin and last x/y as opposite corners of rectangle
      break
    default:
    //do nothing
  }
}

function createRectMask(colorLayer) {
  //
}

function createSelectOutline(path) {
  //
}

function mapColoredPixels(colorLayer) {
  //identify pixels of secondary color
  let pixels = []
  for (let y = 0; y < colorLayer.height; y++) {
    pixels.push([])
    for (let x = 0; x < colorLayer.width; x++) {
      //sample color and add to path if match
      let clickedColor = canvas.getColor(x, y, colorLayer)
      if (clickedColor.color === swatches.secondary.color.color) {
        //add pixel to clip path
        pixels[y].push(1)
      } else if (
        // tracing needs an additional pixel width to the right and down
        canvas.getColor(x - 1, y, colorLayer).color ===
          swatches.secondary.color.color ||
        canvas.getColor(x, y - 1, colorLayer).color ===
          swatches.secondary.color.color ||
        canvas.getColor(x - 1, y - 1, colorLayer).color ===
          swatches.secondary.color.color
      ) {
        //add pixel to clip path. This extends clipping area 1 pixel to the right and 1 down and 1 diagonal down-right
        pixels[y].push(1)
      } else {
        pixels[y].push(0)
      }
    }
  }
  return pixels
}

function findStartPoint(pixels, colorLayer) {
  for (let y = 0; y < colorLayer.height; y++) {
    for (let x = 0; x < colorLayer.width; x++) {
      //sample color and add to path if match
      //check 4 directions
      if (pixels[y][x] === 1) {
        return { x: x, y: y, dir: 0 }
      }
    }
  }
  return null
}

function rotatePoint(dir, rotation) {
  if (rotation === "right") {
    //clockwise
    return dir === 0 ? 3 : dir - 1
  } else if (rotation === "left") {
    //counter clockwise
    return dir === 3 ? 0 : dir + 1
  } else {
    //no rotation
    return dir
  }
}

function walkPath(pixels, contour, point, iteration) {
  switch (point.dir) {
    case 0:
      //right
      //p1
      if (pixels[point.y - 1]) {
        if (pixels[point.y - 1][point.x + 1] === 1) {
          contour.lineTo(point.x + 1, point.y) //p2
          contour.lineTo(point.x + 1, point.y - 1) //p1
          //set point to p1 and rotate dir 90 degrees counter clockwise
          point.x += 1
          point.y -= 1
          point.dir = rotatePoint(point.dir, "left")
          break
        }
      }
      //p2
      if (pixels[point.y][point.x + 1] === 1) {
        contour.lineTo(point.x + 1, point.y) //p2
        //set point to p2
        point.x += 1
        break
      }
      //p3
      if (pixels[point.y + 1]) {
        if (pixels[point.y + 1][point.x + 1] === 1) {
          contour.lineTo(point.x, point.y + 1) //p4
          contour.lineTo(point.x + 1, point.y + 1) //p3
          //set point to p3
          point.x += 1
          point.y += 1
          break
        }
      }
      //chosenPoint does not have any colored points in front of it, rotate direction 90 degrees clockwise and try again
      //if iteration reaches 3, on isolated pixel
      point.dir = rotatePoint(point.dir, "right")
      // return walkPath(pixels, contour, p0, point, (iteration += 1))
      return { point: point, iteration: (iteration += 1) }
    case 1:
      //up
      //p1
      if (pixels[point.y - 1]) {
        if (pixels[point.y - 1][point.x - 1] === 1) {
          contour.lineTo(point.x, point.y - 1) //p2
          contour.lineTo(point.x - 1, point.y - 1) //p1
          //set point to p1 and rotate dir 90 degrees counter clockwise
          point.x -= 1
          point.y -= 1
          point.dir = rotatePoint(point.dir, "left")
          break
        }
        //p2
        if (pixels[point.y - 1][point.x] === 1) {
          contour.lineTo(point.x, point.y - 1) //p2
          //set point to p2
          point.y -= 1
          break
        }
        //p3
        if (pixels[point.y - 1][point.x + 1] === 1) {
          contour.lineTo(point.x + 1, point.y) //p4
          contour.lineTo(point.x + 1, point.y - 1) //p3
          //set point to p3
          point.x += 1
          point.y -= 1
          break
        }
      }
      //chosenPoint does not have any colored points in front of it, rotate direction 90 degrees clockwise and try again
      //if iteration reaches 3, on isolated pixel
      point.dir = rotatePoint(point.dir, "right")
      // return walkPath(pixels, contour, p0, point, (iteration += 1))
      return { point: point, iteration: (iteration += 1) }
    case 2:
      //left
      //p1
      if (pixels[point.y + 1]) {
        if (pixels[point.y + 1][point.x - 1] === 1) {
          contour.lineTo(point.x - 1, point.y) //p2
          contour.lineTo(point.x - 1, point.y + 1) //p1
          //set point to p1 and rotate dir 90 degrees counter clockwise
          point.x -= 1
          point.y += 1
          point.dir = rotatePoint(point.dir, "left")
          break
        }
      }
      //p2
      if (pixels[point.y][point.x - 1] === 1) {
        contour.lineTo(point.x - 1, point.y) //p2
        //set point to p2
        point.x -= 1
        break
      }
      //p3
      if (pixels[point.y - 1]) {
        if (pixels[point.y - 1][point.x - 1] === 1) {
          contour.lineTo(point.x, point.y - 1) //p4
          contour.lineTo(point.x - 1, point.y - 1) //p3
          //set point to p3
          point.x -= 1
          point.y -= 1
          break
        }
      }
      //chosenPoint does not have any colored points in front of it, rotate direction 90 degrees clockwise and try again
      //if iteration reaches 3, on isolated pixel
      point.dir = rotatePoint(point.dir, "right")
      // return walkPath(pixels, contour, p0, point, (iteration += 1))
      return { point: point, iteration: (iteration += 1) }
    case 3:
      //down
      //p1
      if (pixels[point.y + 1]) {
        if (pixels[point.y + 1][point.x + 1] === 1) {
          contour.lineTo(point.x, point.y + 1) //p2
          contour.lineTo(point.x + 1, point.y + 1) //p1
          //set point to p1 and rotate dir 90 degrees counter clockwise
          point.x += 1
          point.y += 1
          point.dir = rotatePoint(point.dir, "left")
          break
        }
        //p2
        if (pixels[point.y + 1][point.x] === 1) {
          contour.lineTo(point.x, point.y + 1) //p2
          //set point to p2
          point.y += 1
          break
        }
        //p3
        if (pixels[point.y + 1][point.x - 1] === 1) {
          contour.lineTo(point.x - 1, point.y) //p4
          contour.lineTo(point.x - 1, point.y + 1) //p3
          //set point to p3
          point.x -= 1
          point.y += 1
          break
        }
      }
      //chosenPoint does not have any colored points in front of it, rotate direction 90 degrees clockwise and try again
      //if iteration reaches 3, on isolated pixel
      point.dir = rotatePoint(point.dir, "right")
      // return walkPath(pixels, contour, p0, point, (iteration += 1))
      return { point: point, iteration: (iteration += 1) }
    default:
    //
  }
  return { point: point, iteration: 0 }
}

function pavlidisAlgorithm(colorLayer) {
  //TODO: can be reduced by directly checking color instead of mapping pixels first
  let pixels = mapColoredPixels(colorLayer)
  const contour = new Path2D()
  const p0 = findStartPoint(pixels, colorLayer)
  if (!p0) {
    return contour
  }
  contour.moveTo(p0.x, p0.y)
  let chosenPoint = { ...p0 }
  let walkingPath
  let currentIteration = 0
  while (walkingPath !== "finished") {
    const { point, iteration } = walkPath(
      pixels,
      contour,
      chosenPoint,
      currentIteration
    )
    if ((p0.x === point.x && p0.y === point.y) || iteration === 3) {
      walkingPath = "finished"
    } else {
      chosenPoint = point
      currentIteration = iteration
    }
  }
  contour.closePath()
  return contour
}

function createClipMask(colorLayer, context) {
  let mask = new Path2D()

  //TODO: hole searching algorithm
  //TODO: contour tracing algorithm on each hole
  const contour = pavlidisAlgorithm(colorLayer)
  return contour

  //REMOVE: old algorithm, not scalable for large canvases due to inefficient masking
  // for (let y = 0; y < colorLayer.height; y++) {
  //   for (let x = 0; x < colorLayer.width; x++) {
  //     //sample color and add to path if match
  //     let clickedColor = canvas.getColor(x, y, colorLayer)
  //     if (clickedColor.color === swatches.secondary.color.color) {
  //       //add pixel to clip path
  //       let p = new Path2D()
  //       p.rect(x, y, 1, 1)
  //       mask.addPath(p)
  //     }
  //   }
  // }
  // // mask.closePath()
  // return mask
}

function fillSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      actionFill(
        state.cursorX,
        state.cursorY,
        swatches.primary.color,
        canvas.currentLayer.ctx,
        state.mode
      )
      //For undo ability, store starting coords and settings and pass them into actionFill
      state.addToTimeline(
        state.tool.name,
        state.cursorX,
        state.cursorY,
        canvas.currentLayer
      )
      canvas.draw()
      break
    case "pointerup":
      //redraw canvas to allow onscreen cursor to render
      canvas.draw()
    default:
    //do nothing
  }
}

function actionFill(startX, startY, currentColor, ctx, currentMode) {
  //exit if outside borders
  if (
    startX < 0 ||
    startX >= canvas.offScreenCVS.width ||
    startY < 0 ||
    startY >= canvas.offScreenCVS.height
  ) {
    return
  }
  //get imageData
  state.localColorLayer = ctx.getImageData(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )

  state.clickedColor = canvas.getColor(startX, startY, state.localColorLayer)

  if (currentMode === "erase")
    currentColor = { color: "rgba(0,0,0,0)", r: 0, g: 0, b: 0, a: 0 }

  //exit if color is the same
  if (currentColor.color === state.clickedColor.color) {
    return
  }
  //Start with click coords
  let pixelStack = [[startX, startY]]
  let newPos, x, y, pixelPos, reachLeft, reachRight
  floodFill()
  function floodFill() {
    newPos = pixelStack.pop()
    x = newPos[0]
    y = newPos[1]

    //get current pixel position
    pixelPos = (y * canvas.offScreenCVS.width + x) * 4
    // Go up as long as the color matches and are inside the canvas
    while (y >= 0 && matchStartColor(pixelPos)) {
      y--
      pixelPos -= canvas.offScreenCVS.width * 4
    }
    //Don't overextend
    pixelPos += canvas.offScreenCVS.width * 4
    y++
    reachLeft = false
    reachRight = false
    // Go down as long as the color matches and in inside the canvas
    while (y < canvas.offScreenCVS.height && matchStartColor(pixelPos)) {
      colorPixel(pixelPos)

      if (x > 0) {
        if (matchStartColor(pixelPos - 4)) {
          if (!reachLeft) {
            //Add pixel to stack
            pixelStack.push([x - 1, y])
            reachLeft = true
          }
        } else if (reachLeft) {
          reachLeft = false
        }
      }

      if (x < canvas.offScreenCVS.width - 1) {
        if (matchStartColor(pixelPos + 4)) {
          if (!reachRight) {
            //Add pixel to stack
            pixelStack.push([x + 1, y])
            reachRight = true
          }
        } else if (reachRight) {
          reachRight = false
        }
      }
      y++
      pixelPos += canvas.offScreenCVS.width * 4
    }

    if (pixelStack.length) {
      floodFill()
    }
  }

  //render floodFill result
  ctx.putImageData(state.localColorLayer, 0, 0)

  //helpers
  function matchStartColor(pixelPos) {
    let r = state.localColorLayer.data[pixelPos]
    let g = state.localColorLayer.data[pixelPos + 1]
    let b = state.localColorLayer.data[pixelPos + 2]
    let a = state.localColorLayer.data[pixelPos + 3]
    return (
      r === state.clickedColor.r &&
      g === state.clickedColor.g &&
      b === state.clickedColor.b &&
      a === state.clickedColor.a
    )
  }

  function colorPixel(pixelPos) {
    state.localColorLayer.data[pixelPos] = currentColor.r
    state.localColorLayer.data[pixelPos + 1] = currentColor.g
    state.localColorLayer.data[pixelPos + 2] = currentColor.b
    //not ideal
    state.localColorLayer.data[pixelPos + 3] = currentColor.a
  }
}

function curveSteps() {
  //FIX: new routine, should be 1. pointerdown, 2. drag to p2,
  //3. pointerup solidify p2, 4. pointerdown/move to drag p3, 5. pointerup to solidify p3
  //this routine would be better for touchscreens, and no worse with pointer
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //solidify end points
      state.clickCounter += 1
      if (state.clickCounter > 3) state.clickCounter = 1
      switch (state.clickCounter) {
        case 1:
          state.px1 = state.cursorX
          state.py1 = state.cursorY
          break
        case 2:
          if (!state.touch) {
            state.px2 = state.cursorX
            state.py2 = state.cursorY
          }
          break
        default:
        //do nothing
      }
      break
    case "pointermove":
      //draw line from origin point to current point onscreen
      //normalize pointermove to pixelgrid
      if (
        state.onscreenX !== state.previousOnscreenX ||
        state.onscreenY !== state.previousOnscreenY
      ) {
        // canvas.onScreenCTX.clearRect(0, 0, canvas.offScreenCVS.width / canvas.zoom, canvas.offScreenCVS.height / canvas.zoom);
        canvas.draw()
        //onscreen preview
        actionCurve(
          state.px1 +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.py1 +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.px2 +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.py2 +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.px3 +
            canvas.xOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.py3 +
            canvas.yOffset /
              (canvas.offScreenCVS.width / canvas.offScreenCVS.width),
          state.clickCounter,
          swatches.primary.color,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          canvas.offScreenCVS.width / canvas.offScreenCVS.width
        )
        state.previousOnscreenX = state.onscreenX
        state.previousOnscreenY = state.onscreenY
      }
      break
    case "pointerup":
      //For touchscreens
      if (state.touch) {
        if (state.clickCounter === 1) {
          state.px2 = state.cursorX
          state.py2 = state.cursorY
        }
        if (state.clickCounter === 2) {
          state.clickCounter += 1
        }
      }
      //Solidify curve
      if (state.clickCounter === 3) {
        //solidify control point
        state.px3 = state.cursorX
        state.py3 = state.cursorY
        actionCurve(
          state.px1,
          state.py1,
          state.px2,
          state.py2,
          state.px3,
          state.py3,
          state.clickCounter + 1,
          swatches.primary.color,
          canvas.currentLayer.ctx,
          state.mode,
          state.brushStamp,
          state.tool.brushSize
        )
        state.clickCounter = 0
        //store control points for timeline
        state.addToTimeline(
          state.tool.name,
          { x1: state.px1, x2: state.px2, x3: state.px3 },
          { y1: state.py1, y2: state.py2, y3: state.py3 },
          canvas.currentLayer
        )
        canvas.draw()
      }
      break
    case "pointerout":
      //cancel curve
      state.clickCounter = 0
      break
    default:
    //do nothing
  }
}

function actionCurve(
  startx,
  starty,
  endx,
  endy,
  controlx,
  controly,
  stepNum,
  currentColor,
  ctx,
  currentMode,
  brushStamp,
  weight,
  scale = 1
) {
  //force coords to int
  startx = Math.round(startx)
  starty = Math.round(starty)
  endx = Math.round(endx)
  endy = Math.round(endy)
  controlx = Math.round(controlx)
  controly = Math.round(controly)

  ctx.fillStyle = currentColor.color

  //BUG: On touchscreen, hits gradient sign error if first tool used
  function renderCurve(controlX, controlY) {
    function plot(x, y) {
      //rounded values
      let xt = Math.floor(x)
      let yt = Math.floor(y)
      // let brushOffset = Math.floor(weight / 2) * scale;
      actionDraw(
        xt,
        yt,
        currentColor,
        brushStamp,
        weight,
        ctx,
        currentMode,
        scale
      )
      // if (currentMode === "erase") {
      //     ctx.clearRect(xt * scale - brushOffset, yt * scale - brushOffset, scale * weight, scale * weight);
      // } else {
      //     ctx.fillRect(xt * scale - brushOffset, yt * scale - brushOffset, scale * weight, scale * weight);
      // }
    }

    function assert(condition, message) {
      if (!condition) {
        throw new Error(message || "Assertion failed")
      }
    }

    //p1, p2 are global endpoints
    plotQuadBezier(startx, starty, controlX, controlY, endx, endy)

    function plotQuadBezier(x0, y0, x1, y1, x2, y2) {
      /* plot any quadratic Bezier curve */
      let x = x0 - x1,
        y = y0 - y1
      let t = x0 - 2 * x1 + x2,
        r
      if (x * (x2 - x1) > 0) {
        /* horizontal cut at P4? */
        if (y * (y2 - y1) > 0)
          if (Math.abs(((y0 - 2 * y1 + y2) * x) / t) > Math.abs(y)) {
            /* vertical cut at P6 too? */
            /* which first? */
            x0 = x2
            x2 = x + x1
            y0 = y2
            y2 = y + y1 /* swap points */
          } /* now horizontal cut at P4 comes first */
        t = (x0 - x1) / t
        r = (1 - t) * ((1 - t) * y0 + 2.0 * t * y1) + t * t * y2 /* By(t=P4) */
        t = ((x0 * x2 - x1 * x1) * t) / (x0 - x1) /* gradient dP4/dx=0 */
        x = Math.floor(t + 0.5)
        y = Math.floor(r + 0.5)
        r = ((y1 - y0) * (t - x0)) / (x1 - x0) + y0 /* intersect P3 | P0 P1 */
        plotQuadBezierSeg(x0, y0, x, Math.floor(r + 0.5), x, y)
        r = ((y1 - y2) * (t - x2)) / (x1 - x2) + y2 /* intersect P4 | P1 P2 */
        x0 = x1 = x
        y0 = y
        y1 = Math.floor(r + 0.5) /* P0 = P4, P1 = P8 */
      }
      if ((y0 - y1) * (y2 - y1) > 0) {
        /* vertical cut at P6? */
        t = y0 - 2 * y1 + y2
        t = (y0 - y1) / t
        r = (1 - t) * ((1 - t) * x0 + 2.0 * t * x1) + t * t * x2 /* Bx(t=P6) */
        t = ((y0 * y2 - y1 * y1) * t) / (y0 - y1) /* gradient dP6/dy=0 */
        x = Math.floor(r + 0.5)
        y = Math.floor(t + 0.5)
        r = ((x1 - x0) * (t - y0)) / (y1 - y0) + x0 /* intersect P6 | P0 P1 */
        plotQuadBezierSeg(x0, y0, Math.floor(r + 0.5), y, x, y)
        r = ((x1 - x2) * (t - y2)) / (y1 - y2) + x2 /* intersect P7 | P1 P2 */
        x0 = x
        x1 = Math.floor(r + 0.5)
        y0 = y1 = y /* P0 = P6, P1 = P7 */
      }
      plotQuadBezierSeg(x0, y0, x1, y1, x2, y2) /* remaining part */
    }

    //Bresenham's algorithm for bezier limited to gradients without sign change.
    function plotQuadBezierSeg(x0, y0, x1, y1, x2, y2) {
      let sx = x2 - x1,
        sy = y2 - y1
      let xx = x0 - x1,
        yy = y0 - y1,
        xy /* relative values for checks */
      let dx,
        dy,
        err,
        cur = xx * sy - yy * sx /* curvature */

      assert(
        xx * sx <= 0 && yy * sy <= 0,
        "sign of gradient must not change"
      ) /* sign of gradient must not change */

      if (sx * sx + sy * sy > xx * xx + yy * yy) {
        /* begin with longer part */
        x2 = x0
        x0 = sx + x1
        y2 = y0
        y0 = sy + y1
        cur = -cur /* swap P0 P2 */
      }
      if (cur != 0) {
        /* no straight line */
        xx += sx
        xx *= sx = x0 < x2 ? 1 : -1 /* x step direction */
        yy += sy
        yy *= sy = y0 < y2 ? 1 : -1 /* y step direction */
        xy = 2 * xx * yy
        xx *= xx
        yy *= yy /* differences 2nd degree */
        if (cur * sx * sy < 0) {
          /* negated curvature? */
          xx = -xx
          yy = -yy
          xy = -xy
          cur = -cur
        }
        dx = 4.0 * sy * cur * (x1 - x0) + xx - xy /* differences 1st degree */
        dy = 4.0 * sx * cur * (y0 - y1) + yy - xy
        xx += xx
        yy += yy
        err = dx + dy + xy /* error 1st step */
        while (dy < dx) {
          /* gradient negates -> algorithm fails */
          plot(x0, y0) /* plot curve */
          if (x0 == x2 && y0 == y2) return /* last pixel -> curve finished */
          y1 = 2 * err < dx /* save value for test of y step */
          if (2 * err > dy) {
            x0 += sx
            dx -= xy
            err += dy += yy
          } /* x step */
          if (y1) {
            y0 += sy
            dy -= xy
            err += dx += xx
          } /* y step */
        }
      }
      /* plot remaining part to end */
      if (stepNum === 2 || stepNum === 3) {
        //REFACTOR, dry it up
        //create triangle object
        let tri = {}
        function getTriangle(x1, y1, x2, y2, ang) {
          if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
            tri.x = Math.sign(Math.cos(ang))
            tri.y = Math.tan(ang) * Math.sign(Math.cos(ang))
            tri.long = Math.abs(x1 - x2)
          } else {
            tri.x =
              Math.tan(Math.PI / 2 - ang) *
              Math.sign(Math.cos(Math.PI / 2 - ang))
            tri.y = Math.sign(Math.cos(Math.PI / 2 - ang))
            tri.long = Math.abs(y1 - y2)
          }
        }
        // finds the angle of (x,y) on a plane from the origin
        function getAngle(x, y) {
          return Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0)
        }
        let angle = getAngle(x2 - x0, y2 - y0) // angle of line
        getTriangle(x0, y0, x2, y2, angle)

        for (let i = 0; i < tri.long; i++) {
          let thispoint = {
            x: Math.round(x0 + tri.x * i),
            y: Math.round(y0 + tri.y * i),
          }
          // for each point along the line
          plot(thispoint.x, thispoint.y)
        }
        //fill endpoint
        plot(x2, y2)
      } else if (stepNum === 4) {
        actionLine(
          x0,
          y0,
          x2,
          y2,
          currentColor,
          ctx,
          currentMode,
          brushStamp,
          weight,
          scale
        )
      }
    }
  }

  if (stepNum === 1) {
    //after defining x0y0
    actionLine(
      startx,
      starty,
      state.cursorWithCanvasOffsetX,
      state.cursorWithCanvasOffsetY,
      currentColor,
      canvas.onScreenCTX,
      currentMode,
      brushStamp,
      weight,
      scale
    )
  } else if (stepNum === 2 || stepNum === 3) {
    // after defining x2y2
    //onscreen preview curve
    //somehow use rendercurve2 for flatter curves
    renderCurve(state.cursorWithCanvasOffsetX, state.cursorWithCanvasOffsetY)
  } else if (stepNum === 4) {
    //curve after defining x3y3
    renderCurve(controlx, controly)
  }
}

function handleClear() {
  state.addToTimeline("clear", 0, 0, canvas.currentLayer)
  //FIX: restructure stacked items. Currently each is an array, but each should be an object with more info plus an array
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
}

//====================================//
//=== * * * Non-Action Tools * * * ===//
//====================================//

function handleRecenter(e) {
  canvas.zoom = canvas.setInitialZoom(canvas.offScreenCVS.width)
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
}

function moveSteps() {
  //move contents of selection around canvas
  //default selection is entire canvas contents
}

//Eyedropper
//TODO: add magnifying glass view that shows zoomed in view of area being sampled
function eyedropperSteps() {
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //get imageData
      canvas.consolidateLayers()
      state.colorLayerGlobal = canvas.offScreenCTX.getImageData(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      //set color
      sampleColor(state.cursorX, state.cursorY)
      break
    case "pointermove":
      //normalize pointermove to pixelgrid, get color here too
      if (
        state.onscreenX !== state.previousOnscreenX ||
        state.onscreenY !== state.previousOnscreenY
      ) {
        //get color
        sampleColor(state.cursorX, state.cursorY)
        //draw square
        canvas.draw()
        renderCursor()
        state.previousOnscreenX = state.onscreenX
        state.previousOnscreenY = state.onscreenY
      }
      break
    default:
    //do nothing
  }
}

//eyedropper helper function
function sampleColor(x, y) {
  let newColor = canvas.getColor(x, y, state.colorLayerGlobal)
  //not simply passing whole color in until random color function is refined
  swatches.setColor(newColor.r, newColor.g, newColor.b, "swatch btn")
}

function grabSteps() {
  switch (canvas.pointerEvent) {
    case "pointermove":
      canvas.xOffset =
        state.onscreenX - state.previousOnscreenX + canvas.previousXOffset
      canvas.yOffset =
        state.onscreenY - state.previousOnscreenY + canvas.previousYOffset
      canvas.draw()
      break
    case "pointerup":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      state.previousOnscreenX = state.onscreenX
      state.previousOnscreenY = state.onscreenY
      break
    case "pointerout":
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      break
    default:
    //do nothing
  }
}

//====================================//
//========= * * * Core * * * =========//
//====================================//

//Main pillar of the code structure
function actionUndoRedo(pushStack, popStack) {
  pushStack.push(popStack.pop())
  //clear all layers in preparation to redraw them.
  //DRY: do all layers and actions need to be rerendered for redo?
  canvas.layers.forEach((l) => {
    if (l.type === "raster") {
      l.ctx.clearRect(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
    }
  })
  redrawPoints()
  canvas.draw()
}

//TODO: move all tools to separate file so this isn't exported from index
export function redrawPoints() {
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    action.forEach((p) => {
      switch (p.tool) {
        case "addlayer":
          p.layer.removed = false
          canvas.renderLayersToDOM()
          break
        case "clear":
          p.layer.ctx.clearRect(
            0,
            0,
            canvas.offScreenCVS.width,
            canvas.offScreenCVS.height
          )
          break
        case "fill":
          actionFill(p.x, p.y, p.color, p.layer.ctx, p.mode)
          break
        case "line":
          actionLine(
            p.x.x1,
            p.y.y1,
            p.x.x2,
            p.y.y2,
            p.color,
            p.layer.ctx,
            p.mode,
            p.brush,
            p.weight
          )
          break
        case "curve":
          actionCurve(
            p.x.x1,
            p.y.y1,
            p.x.x2,
            p.y.y2,
            p.x.x3,
            p.y.y3,
            4,
            p.color,
            p.layer.ctx,
            p.mode,
            p.brush,
            p.weight
          )
          break
        case "replace":
          p.layer.ctx.drawImage(
            p.x,
            0,
            0,
            canvas.offScreenCVS.width,
            canvas.offScreenCVS.height
          )
          break
        default:
          actionDraw(p.x, p.y, p.color, p.brush, p.weight, p.layer.ctx, p.mode)
      }
    })
  })
  state.redoStack.forEach((action) => {
    action.forEach((p) => {
      if (p.tool === "addlayer") {
        p.layer.removed = true
        if (p.layer === canvas.currentLayer) {
          canvas.currentLayer = layersCont.children[0].layerObj
        }
        canvas.renderLayersToDOM()
      }
    })
  })
}

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
    case "curve":
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
    state.brushStamp = drawCircle() //circle
  } else {
    state.brushStamp = drawRect() //square
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
    state.touch = false
  }
}
