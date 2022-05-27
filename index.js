import { Picker } from "../Tools/Picker.js"
import { state } from "../Context/state.js"
import { canvas } from "../Canvas/canvas.js"

//===================================//
//========= * * * DOM * * * =========//
//===================================//

//Main
let fullPage = document.querySelector(".full-page")

//Get the undo buttons
let undoBtn = document.getElementById("undo")
let redoBtn = document.getElementById("redo")

//Get swatch
let swatch = document.querySelector(".swatch")
let backSwatch = document.querySelector(".back-swatch")
let colorSwitch = document.querySelector(".color-switch")

let colorPickerContainer = document.querySelector(".color-container")
//color picker OK/Cancel
let confirmBtn = document.getElementById("confirm-btn")
let cancelBtn = document.getElementById("cancel-btn")

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

//Options
let lineWeight = document.querySelector("#line-weight")
let brushBtn = document.querySelector(".brush-preview")
let brushPreview = document.querySelector("#brush-preview")
let brushSlider = document.querySelector("#brush-size")
let brush = document.querySelector(".brush")

//Export
let exportBtn = document.querySelector(".export")

//Layers
//Reference upload
let uploadBtn = document.querySelector("#file-upload")
let newLayerBtn = document.querySelector(".new-raster-layer")

let layersCont = document.querySelector(".layers")

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
  picker: {
    name: "picker",
    fn: pickerSteps,
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
addRasterLayer()
canvas.currentLayer = canvas.layers[0]
renderLayersToDOM()

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

//Shortcuts
document.addEventListener("keydown", handleKeyDown)
document.addEventListener("keyup", handleKeyUp)

canvas.onScreenCVS.addEventListener("wheel", handleWheel, { passive: true })

//Mouse
canvas.onScreenCVS.addEventListener("mousemove", handleMouseMove)
canvas.onScreenCVS.addEventListener("mousedown", handleMouseDown)
canvas.onScreenCVS.addEventListener("mouseup", handleMouseUp)
canvas.onScreenCVS.addEventListener("mouseout", handleMouseOut)

//Touch
canvas.onScreenCVS.addEventListener("touchstart", handleTouchStart, { passive: true })
canvas.onScreenCVS.addEventListener("touchmove", handleTouchMove, { passive: true })
canvas.onScreenCVS.addEventListener("touchend", handleTouchEnd, { passive: true })
canvas.onScreenCVS.addEventListener("touchcancel", handleTouchCancel, {
  passive: true,
})

//Toolbox
undoBtn.addEventListener("click", handleUndo)
redoBtn.addEventListener("click", handleRedo)

recenterBtn.addEventListener("click", handleRecenter)
clearBtn.addEventListener("click", handleClear)

zoomCont.addEventListener("click", handleZoom)

swatch.addEventListener("click", openColorPicker)
backSwatch.addEventListener("click", openColorPicker)
colorSwitch.addEventListener("click", switchColors)

toolsCont.addEventListener("click", handleTools)
modesCont.addEventListener("click", handleModes)

brushBtn.addEventListener("click", switchBrush)
brushSlider.addEventListener("input", updateBrush)

exportBtn.addEventListener("click", exportImage)

uploadBtn.addEventListener("change", addReferenceLayer)
newLayerBtn.addEventListener("click", addRasterLayer)

layersCont.addEventListener("click", layerInteract)

layersCont.addEventListener("dragstart", dragLayerStart)
layersCont.addEventListener("dragover", dragLayerOver)
layersCont.addEventListener("dragenter", dragLayerEnter)
layersCont.addEventListener("dragleave", dragLayerLeave)
layersCont.addEventListener("drop", dropLayer)
layersCont.addEventListener("dragend", dragLayerEnd)

//Color Picker
//Interface listeners
confirmBtn.addEventListener("click", (e) => {
  handleConfirm(e)
})
cancelBtn.addEventListener("click", (e) => {
  handleCancel(e)
})

//======================================//
//=== * * * Key Event Handlers * * * ===//
//======================================//

function handleKeyDown(e) {
  // console.log(e.key)
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
        state.tool = tools["picker"]
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
        let r = Math.floor(Math.random() * 256)
        let g = Math.floor(Math.random() * 256)
        let b = Math.floor(Math.random() * 256)
        setColor(r, g, b, "swatch btn")
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
//=== * * * Mouse Event Handlers * * * ===//
//========================================//

function handleMouseDown(e) {
  //reset media type, chrome dev tools niche use or computers that have touchscreen capabilities
  if (e.type === "mousedown") {
    state.touch = false
  }
  state.event = "mousedown"
  state.clicked = true
  if (state.clickDisabled) {
    return
  }
  state.trueRatio = (canvas.onScreenCVS.offsetWidth / canvas.offScreenCVS.width) * canvas.zoom
  let x, y
  if (e.targetTouches) {
    let rect = e.target.getBoundingClientRect()
    x = Math.round(e.targetTouches[0].pageX - rect.left)
    y = Math.round(e.targetTouches[0].pageY - rect.top)
  } else {
    x = e.offsetX
    y = e.offsetY
  }
  state.mox = Math.floor(x / state.trueRatio)
  state.moy = Math.floor(y / state.trueRatio)
  state.mouseX = Math.round(state.mox - (state.xOffset / state.ratio) * canvas.zoom)
  state.mouseY = Math.round(state.moy - (state.yOffset / state.ratio) * canvas.zoom)
  //Reset Cursor for mobile
  state.onX = (state.mox * state.ratio) / canvas.zoom
  state.onY = (state.moy * state.ratio) / canvas.zoom
  state.lastOnX = state.onX
  state.lastOnY = state.onY
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

function handleMouseMove(e) {
  if (state.clickDisabled && state.clicked) {
    return
  }
  state.event = "mousemove"
  state.clickDisabled = false
  //currently only square dimensions work
  state.trueRatio = (canvas.onScreenCVS.offsetWidth / canvas.offScreenCVS.width) * canvas.zoom
  state.ratio = (canvas.unsharpenedWidth / canvas.offScreenCVS.width) * canvas.zoom
  //coords
  let x, y
  if (e.targetTouches) {
    let rect = e.target.getBoundingClientRect()
    x = Math.round(e.targetTouches[0].pageX - rect.left)
    y = Math.round(e.targetTouches[0].pageY - rect.top)
  } else {
    x = e.offsetX
    y = e.offsetY
  }
  state.mox = Math.floor(x / state.trueRatio)
  state.moy = Math.floor(y / state.trueRatio)
  state.mouseX = Math.round(state.mox - (state.xOffset / state.ratio) * canvas.zoom)
  state.mouseY = Math.round(state.moy - (state.yOffset / state.ratio) * canvas.zoom)
  //Hover brush
  state.onX = (state.mox * state.ratio) / canvas.zoom
  state.onY = (state.moy * state.ratio) / canvas.zoom
  if (
    state.clicked ||
    (state.tool.name === "curve" && state.clickCounter > 0)
  ) {
    //run selected tool step function
    state.tool.fn()
  } else {
    //normalize cursor render to pixelgrid
    if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
      canvas.onScreenCTX.clearRect(
        0,
        0,
        canvas.unsharpenedWidth / canvas.zoom,
        canvas.unsharpenedHeight / canvas.zoom
      )
      canvas.draw()
      renderCursor()
      state.lastOnX = state.onX
      state.lastOnY = state.onY
    }
  }
}

function handleMouseUp(e) {
  state.event = "mouseup"
  state.clicked = false
  if (state.clickDisabled) {
    return
  }
  state.trueRatio = (canvas.onScreenCVS.offsetWidth / canvas.offScreenCVS.width) * canvas.zoom
  let x, y
  if (e.targetTouches) {
    let rect = e.target.getBoundingClientRect()
    x = Math.round(e.changedTouches[0].pageX - rect.left)
    y = Math.round(e.changedTouches[0].pageY - rect.top)
  } else {
    x = e.offsetX
    y = e.offsetY
  }
  state.mox = Math.floor(x / state.trueRatio)
  state.moy = Math.floor(y / state.trueRatio)
  state.mouseX = Math.round(state.mox - (state.xOffset / state.ratio) * canvas.zoom)
  state.mouseY = Math.round(state.moy - (state.yOffset / state.ratio) * canvas.zoom)
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
  state.event = "none"
  if (!e.targetTouches) {
    renderCursor()
  }
}

function handleMouseOut(e) {
  if (state.clicked) {
    state.event = "mouseout"
    state.clicked = false
    state.tool.fn()
    //add to undo stack
    if (state.points.length) {
      state.undoStack.push(state.points)
    }
    state.points = []
    //Reset redostack
    state.redoStack = []
  }
  canvas.draw()
  state.event = "none"
}

function handleWheel(e) {
  let delta = Math.sign(e.deltaY)
  //BUG: zoom doesn't stay centered, wobbles slightly (due to forcing the normalization to the pixelgrid?)
  //zoom based on mouse coords
  let z
  let rw = canvas.unsharpenedWidth / canvas.offScreenCVS.width
  let nox = Math.round((state.mox * state.ratio) / 5 / canvas.zoom / rw) * rw
  let noy = Math.round((state.moy * state.ratio) / 5 / canvas.zoom / rw) * rw
  let lox = Math.round((state.mox * state.ratio) / 4 / canvas.zoom / rw) * rw
  let loy = Math.round((state.moy * state.ratio) / 4 / canvas.zoom / rw) * rw
  if (delta < 0) {
    z = 0.8
    canvas.zoom *= z
    state.xOffset += lox
    state.yOffset += loy
  } else if (delta > 0) {
    z = 1.25
    state.xOffset -= nox
    state.yOffset -= noy
    canvas.zoom *= z
  }
  //re scale canvas
  canvas.onScreenCTX.scale(z, z)
  state.lastOffsetX = state.xOffset
  state.lastOffsetY = state.yOffset
  canvas.draw()
  // state.clickDisabled = true;
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
    let rw = canvas.unsharpenedWidth / canvas.offScreenCVS.width
    //next origin
    let nox = Math.round(canvas.unsharpenedWidth / 10 / canvas.zoom / rw) * rw
    let noy = Math.round(canvas.unsharpenedHeight / 10 / canvas.zoom / rw) * rw
    let lox = Math.round(canvas.unsharpenedWidth / 8 / canvas.zoom / rw) * rw
    let loy = Math.round(canvas.unsharpenedHeight / 8 / canvas.zoom / rw) * rw
    if (zoomBtn.id === "minus") {
      z = 0.8
      canvas.zoom *= z
      state.xOffset += lox
      state.yOffset += loy
    } else if (zoomBtn.id === "plus") {
      z = 1.25
      canvas.zoom *= z
      state.xOffset -= nox
      state.yOffset -= noy
    }
    //re scale canvas
    canvas.onScreenCTX.scale(z, z)
    state.lastOffsetX = state.xOffset
    state.lastOffsetY = state.yOffset
    canvas.draw()
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
      // toolBtn.querySelector(".icon").style = "opacity: 0.6;"
      //get new button and select it
      toolBtn = e.target.closest(".tool")
      toolBtn.style.background = "rgb(255, 255, 255)"
      // toolBtn.querySelector(".icon").style = "opacity: 1;"
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

function handleModes(e) {
  if (e.target.closest(".mode")) {
    //reset old button
    modeBtn.style.background = "rgb(131, 131, 131)"
    // modeBtn.querySelector(".icon").style = "opacity: 0.6;"
    //get new button and select it
    modeBtn = e.target.closest(".mode")
    // modeBtn.querySelector(".icon").style = "opacity: 1;"
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
    case "picker":
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
    state.mox,
    state.moy,
    state.brushColor,
    state.brushStamp,
    state.tool.brushSize,
    canvas.onScreenCTX,
    state.mode,
    state.ratio / canvas.zoom
  )
}

function drawCursorBox() {
  let brushOffset = (Math.floor(state.tool.brushSize / 2) * state.ratio) / canvas.zoom
  let x0 = state.onX - brushOffset
  let y0 = state.onY - brushOffset
  let x1 = x0 + (state.ratio / canvas.zoom) * state.tool.brushSize
  let y1 = y0 + (state.ratio / canvas.zoom) * state.tool.brushSize
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

  //alternative method, iterate over every pixel, brute force bad symmetry
  // let r = state.tool.brushSize / 2; //float
  // let rr = r * r;
  // for (let i = 0; i < state.tool.brushSize; i++) {
  //     for (let j = 0; j < state.tool.brushSize; j++) {
  //         let xd = j - r;
  //         let yd = i - r;
  //         let dd = xd * xd + yd * yd;
  //         console.log(dd, rr)
  //         if (dd <= rr) { //inside circle
  //             brushRects.push({ x: j, y: i, w: 1, h: 1 });
  //         }
  //     }
  // }

  eightfoldSym(xO, yO, x, y)
  while (x < y) {
    x++
    if (d >= 0) {
      y--
      d += 2 * (x - y) + 1 //outside circle
      // d = d + 5 * (x - y) + 10;
      // d = d + 4 * (x - y) + 10;
    } else {
      d += 2 * x + 1 //inside circle
      // d = d + 3 * x + 6;
      // d = d + 4 * x + 6;
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

  // //circle outline
  // function eightfoldSym(xc, yc, x, y) {
  //     if (state.tool.brushSize % 2 === 0) { xc-- };
  //     brushRects.push({ x: xc + y, y: yc - x , w: 1, h: 1}); //oct 1
  //     brushRects.push({ x: xc + x, y: yc - y , w: 1, h: 1}); //oct 2
  //     if (state.tool.brushSize % 2 === 0) { xc++ };
  //     brushRects.push({ x: xc - x, y: yc - y , w: 1, h: 1}); //oct 3
  //     brushRects.push({ x: xc - y, y: yc - x , w: 1, h: 1}); //oct 4
  //     if (state.tool.brushSize % 2 === 0) { yc-- };
  //     brushRects.push({ x: xc - y, y: yc + x , w: 1, h: 1}); //oct 5
  //     brushRects.push({ x: xc - x, y: yc + y , w: 1, h: 1}); //oct 6
  //     if (state.tool.brushSize % 2 === 0) { xc-- };
  //     brushRects.push({ x: xc + x, y: yc + y , w: 1, h: 1}); //oct 7
  //     brushRects.push({ x: xc + y, y: yc + x , w: 1, h: 1}); //oct 8
  // }

  // brushPoints.forEach(p => {
  //     actionDraw(p.x, p.y, state.brushColor, 1, canvas.currentLayer.ctx, state.mode)
  // })

  // state.tool.brushPoints = brushPoints;
  // actionFill(xO, yO, state.brushColor, canvas.currentLayer.ctx, state.mode);
  // canvas.draw();
}

//====================================//
//===== * * * Action Tools * * * =====//
//====================================//

//"Steps" functions are controllers for the process
function drawSteps() {
  switch (state.event) {
    case "mousedown":
      //set colorlayer, then for each brushpoint, alter colorlayer and add each to timeline
      actionDraw(
        state.mouseX,
        state.mouseY,
        state.brushColor,
        state.brushStamp,
        state.tool.brushSize,
        canvas.currentLayer.ctx,
        state.mode
      )
      state.lastX = state.mouseX
      state.lastY = state.mouseY
      //for perfect pixels
      state.lastDrawnX = state.mouseX
      state.lastDrawnY = state.mouseY
      state.waitingPixelX = state.mouseX
      state.waitingPixelY = state.mouseY
      if (state.tool.name !== "replace") {
        addToTimeline(state.tool.name, state.mouseX, state.mouseY)
      }
      canvas.draw()
      break
    case "mousemove":
      if (state.mode === "perfect") {
        drawCurrentPixel()
      }
      if (state.lastX !== state.mouseX || state.lastY !== state.mouseY) {
        //draw between points when drawing fast
        if (
          Math.abs(state.mouseX - state.lastX) > 1 ||
          Math.abs(state.mouseY - state.lastY) > 1
        ) {
          actionLine(
            state.lastX,
            state.lastY,
            state.mouseX,
            state.mouseY,
            state.brushColor,
            canvas.currentLayer.ctx,
            state.mode,
            state.brushStamp,
            state.tool.brushSize
          )
          if (state.tool.name !== "replace") {
            addToTimeline(
              "line",
              { x1: state.lastX, x2: state.mouseX },
              { y1: state.lastY, y2: state.mouseY }
            )
          }
          canvas.draw()
        } else {
          //FIX: perfect will be option, not mode
          if (state.mode === "perfect") {
            canvas.draw()
            drawCurrentPixel()
            perfectPixels(state.mouseX, state.mouseY)
          } else {
            actionDraw(
              state.mouseX,
              state.mouseY,
              state.brushColor,
              state.brushStamp,
              state.tool.brushSize,
              canvas.currentLayer.ctx,
              state.mode
            )
            if (state.tool.name !== "replace") {
              addToTimeline(state.tool.name, state.mouseX, state.mouseY)
            }
            canvas.draw()
          }
        }
      }
      // save last point
      state.lastX = state.mouseX
      state.lastY = state.mouseY
      break
    case "mouseup":
      //only needed if perfect pixels option is on
      actionDraw(
        state.mouseX,
        state.mouseY,
        state.brushColor,
        state.brushStamp,
        state.tool.brushSize,
        canvas.currentLayer.ctx,
        state.mode
      )
      if (state.tool.name !== "replace") {
        addToTimeline(state.tool.name, state.mouseX, state.mouseY)
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
      state.brushColor,
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
      addToTimeline(state.tool.name, state.lastDrawnX, state.lastDrawnY)
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
  switch (state.event) {
    case "mousedown":
      state.lastX = state.mouseX
      state.lastY = state.mouseY
      break
    case "mousemove":
      //draw line from origin point to current point onscreen
      //only draw when necessary
      if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
        canvas.onScreenCTX.clearRect(
          0,
          0,
          canvas.unsharpenedWidth / canvas.zoom,
          canvas.unsharpenedHeight / canvas.zoom
        )
        canvas.draw()
        actionLine(
          state.lastX + (state.xOffset / state.ratio) * canvas.zoom,
          state.lastY + (state.yOffset / state.ratio) * canvas.zoom,
          state.mox,
          state.moy,
          state.brushColor,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          state.ratio / canvas.zoom
        )
        state.lastOnX = state.onX
        state.lastOnY = state.onY
      }
      break
    case "mouseup":
      actionLine(
        state.lastX,
        state.lastY,
        state.mouseX,
        state.mouseY,
        state.brushColor,
        canvas.currentLayer.ctx,
        state.mode,
        state.brushStamp,
        state.tool.brushSize
      )
      addToTimeline(
        state.tool.name,
        { x1: state.lastX, x2: state.mouseX },
        { y1: state.lastY, y2: state.mouseY }
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
  switch (state.event) {
    case "mousedown":
      //get global colorlayer data to use while mouse is down
      state.localColorLayer = canvas.currentLayer.ctx.getImageData(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      //create clip mask
      canvas.currentLayer.ctx.save()
      state.clipMask = createClipMask(state.localColorLayer)
      // canvas.currentLayer.ctx.strokeStyle = "red";
      // canvas.currentLayer.ctx.stroke(state.clipMask);
      canvas.currentLayer.ctx.clip(state.clipMask)
      drawSteps()
      break
    case "mousemove":
      drawSteps()
      break
    case "mouseup":
      drawSteps()
      finalReplaceStep()
      break
    case "mouseout":
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
  addToTimeline(state.tool.name, image, null)
}

function selectSteps() {
  switch (state.event) {
    case "mousedown":
      //1. set drag origin
      //2. save context
      break
    case "mousemove":
      //1. if state.clicked create strokeable path using drag origin and current x/y as opposite corners of rectangle
      //2. stroke outline path with animated "marching ants".
      break
    case "mouseup":
      //1. create clip mask using drag origin and current x/y as opposite corners of rectangle
      break
    case "mouseout":
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

function createClipMask(colorLayer) {
  let mask = new Path2D()

  // //create outline path, path disconnected so can't be filled
  // let pixels = [];
  // for (let y = 0; y < colorLayer.height; y++) {
  //     pixels.push([]);
  //     for (let x = 0; x < colorLayer.width; x++) {
  //         //sample color and add to path if match
  //         let clickedColor = getColor(x, y, colorLayer);
  //         if (clickedColor.color === state.backColor.color) {
  //             //add pixel to clip path
  //             pixels[y].push(1);
  //         } else {
  //             pixels[y].push(0);
  //         }
  //     }
  // }
  // for (let y = 0; y < colorLayer.height; y++) {
  //     for (let x = 0; x < colorLayer.width; x++) {
  //         //check 4 directions
  //         if (pixels[y][x] === 1) { continue; }
  //         //right
  //         if (pixels[y][x + 1] === 1) {
  //             mask.moveTo(x + 1, y, 1, 1);
  //             mask.lineTo(x + 1, y + 1, 1, 1);
  //         }
  //         //left
  //         if (pixels[y][x - 1] === 1) {
  //             mask.moveTo(x, y, 1, 1);
  //             mask.lineTo(x, y + 1, 1, 1);
  //         }
  //         //down
  //         if (pixels[y + 1]) {
  //             if (pixels[y + 1][x] === 1) {
  //                 mask.moveTo(x, y + 1, 1, 1);
  //                 mask.lineTo(x + 1, y + 1, 1, 1);
  //             }
  //         }
  //         //up
  //         if (pixels[y - 1]) {
  //             if (pixels[y - 1][x] === 1) {
  //                 mask.moveTo(x, y, 1, 1);
  //                 mask.lineTo(x + 1, y, 1, 1);
  //             }
  //         }
  //     }
  // }

  for (let y = 0; y < colorLayer.height; y++) {
    for (let x = 0; x < colorLayer.width; x++) {
      //sample color and add to path if match
      let clickedColor = getColor(x, y, colorLayer)
      if (clickedColor.color === state.backColor.color) {
        //add pixel to clip path
        let p = new Path2D()
        p.rect(x, y, 1, 1)
        mask.addPath(p)
      }
    }
  }
  return mask
}

function fillSteps() {
  switch (state.event) {
    case "mousedown":
      actionFill(
        state.mouseX,
        state.mouseY,
        state.brushColor,
        canvas.currentLayer.ctx,
        state.mode
      )
      //For undo ability, store starting coords and settings and pass them into actionFill
      addToTimeline(state.tool.name, state.mouseX, state.mouseY)
      canvas.draw()
      break
    case "mouseup":
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

  state.clickedColor = getColor(startX, startY, state.localColorLayer)

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
  //FIX: new routine, should be 1. mousedown, 2. drag to p2,
  //3. mouseup solidify p2, 4. mousedown/move to drag p3, 5. mouseup to solidify p3
  //this routine would be better for touchscreens, and no worse with mouse
  switch (state.event) {
    case "mousedown":
      //solidify end points
      state.clickCounter += 1
      if (state.clickCounter > 3) state.clickCounter = 1
      switch (state.clickCounter) {
        case 1:
          state.px1 = state.mouseX
          state.py1 = state.mouseY
          break
        case 2:
          if (!state.touch) {
            state.px2 = state.mouseX
            state.py2 = state.mouseY
          }
          break
        default:
        //do nothing
      }
      break
    case "mousemove":
      //draw line from origin point to current point onscreen
      //normalize mousemove to pixelgrid
      if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
        // canvas.onScreenCTX.clearRect(0, 0, canvas.unsharpenedWidth / canvas.zoom, canvas.unsharpenedHeight / canvas.zoom);
        canvas.draw()
        //onscreen preview
        actionCurve(
          state.px1 + (state.xOffset / state.ratio) * canvas.zoom,
          state.py1 + (state.yOffset / state.ratio) * canvas.zoom,
          state.px2 + (state.xOffset / state.ratio) * canvas.zoom,
          state.py2 + (state.yOffset / state.ratio) * canvas.zoom,
          state.px3 + (state.xOffset / state.ratio) * canvas.zoom,
          state.py3 + (state.yOffset / state.ratio) * canvas.zoom,
          state.clickCounter,
          state.brushColor,
          canvas.onScreenCTX,
          state.mode,
          state.brushStamp,
          state.tool.brushSize,
          state.ratio / canvas.zoom
        )
        state.lastOnX = state.onX
        state.lastOnY = state.onY
      }
      break
    case "mouseup":
      //For touchscreens
      if (state.touch) {
        if (state.clickCounter === 1) {
          state.px2 = state.mouseX
          state.py2 = state.mouseY
        }
        if (state.clickCounter === 2) {
          state.clickCounter += 1
        }
      }
      //Solidify curve
      if (state.clickCounter === 3) {
        //solidify control point
        state.px3 = state.mouseX
        state.py3 = state.mouseY
        actionCurve(
          state.px1,
          state.py1,
          state.px2,
          state.py2,
          state.px3,
          state.py3,
          state.clickCounter + 1,
          state.brushColor,
          canvas.currentLayer.ctx,
          state.mode,
          state.brushStamp,
          state.tool.brushSize
        )
        state.clickCounter = 0
        //store control points for timeline
        addToTimeline(
          state.tool.name,
          { x1: state.px1, x2: state.px2, x3: state.px3 },
          { y1: state.py1, y2: state.py2, y3: state.py3 }
        )
        canvas.draw()
      }
      break
    case "mouseout":
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
      state.mox,
      state.moy,
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
    renderCurve(state.mox, state.moy)
  } else if (stepNum === 4) {
    //curve after defining x3y3
    renderCurve(controlx, controly)
  }
}

function handleClear() {
  addToTimeline("clear", 0, 0)
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
  canvas.onScreenCTX.scale(1 / canvas.zoom, 1 / canvas.zoom)
  canvas.zoom = 1
  state.xOffset = 0
  state.yOffset = 0
  state.lastOffsetX = 0
  state.lastOffsetY = 0
  canvas.draw()
}

function moveSteps() {
  //move contents of selection around canvas
  //default selection is entire canvas contents
}

//Eyedropper
function pickerSteps() {
  switch (state.event) {
    case "mousedown":
      //get imageData
      canvas.consolidateLayers()
      state.colorLayerGlobal = canvas.offScreenCTX.getImageData(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      //set color
      sampleColor(state.mouseX, state.mouseY)
      break
    case "mousemove":
      //normalize mousemove to pixelgrid, get color here too
      if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
        //get color
        sampleColor(state.mouseX, state.mouseY)
        //draw square
        canvas.draw()
        renderCursor()
        state.lastOnX = state.onX
        state.lastOnY = state.onY
      }
      break
    default:
    //do nothing
  }
}

//picker helper function
function sampleColor(x, y) {
  let newColor = getColor(x, y, state.colorLayerGlobal)
  //not simply passing whole color in until random color function is refined
  setColor(newColor.r, newColor.g, newColor.b, "swatch btn")
}

function grabSteps() {
  switch (state.event) {
    case "mousemove":
      state.xOffset = state.onX - state.lastOnX + state.lastOffsetX
      state.yOffset = state.onY - state.lastOnY + state.lastOffsetY
      canvas.draw()
      break
    case "mouseup":
      state.lastOffsetX = state.xOffset
      state.lastOffsetY = state.yOffset
      state.lastOnX = state.onX
      state.lastOnY = state.onY
      break
    case "mouseout":
      state.lastOffsetX = state.xOffset
      state.lastOffsetY = state.yOffset
      break
    default:
    //do nothing
  }
}

//====================================//
//========= * * * Core * * * =========//
//====================================//

//command pattern. (Look into saving app-state instead)
function addToTimeline(tool, x, y, layer = canvas.currentLayer) {
  //use current state for variables
  state.points.push({
    //x/y are sometimes objects with multiple values
    x: x,
    y: y,
    layer: layer,
    brush: state.brushStamp,
    weight: state.tool.brushSize,
    color: { ...state.brushColor },
    tool: tool,
    action: state.tool.fn,
    mode: state.mode,
  })
}

//Main pillar of the code structure
function actionUndoRedo(pushStack, popStack) {
  pushStack.push(popStack.pop())
  //clear all layers in preparation to redraw them.
  //DRY: do all layers and actions need to be rerendered for redo?
  canvas.layers.forEach((l) => {
    if (l.type === "raster") {
      l.ctx.clearRect(0, 0, canvas.offScreenCVS.width, canvas.offScreenCVS.height)
    }
  })
  redrawPoints()
  canvas.draw()
}

function redrawPoints() {
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    action.forEach((p) => {
      switch (p.tool) {
        case "addlayer":
          p.layer.removed = false
          renderLayersToDOM()
          break
        case "clear":
          p.layer.ctx.clearRect(0, 0, canvas.offScreenCVS.width, canvas.offScreenCVS.height)
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
        renderLayersToDOM()
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
  // let img = new Image();
  // img.src = brushCVS.toDataURL();
  // console.log(img)
  // roundBrush.style.backgroundImage = `url(${img.src})`;
  // roundBrush.style.backgroundSize = "contain";
  // let roundBrush = brushPreview.querySelector(".round-brush");
  // if (roundBrush) {
  //     //draw circle
  // }
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
//======== * * * Layers * * * ========//
//====================================//

function layerInteract(e) {
  let layer = e.target.closest(".layer").layerObj
  //toggle visibility
  if (e.target.className.includes("hide")) {
    if (e.target.childNodes[0].className.includes("eyeopen")) {
      e.target.childNodes[0].className = "eyeclosed icon"
      layer.opacity = 0
    } else if (e.target.childNodes[0].className.includes("eyeclosed")) {
      e.target.childNodes[0].className = "eyeopen icon"
      layer.opacity = 1
    }
  } else {
    //select current layer
    if (layer.type === "raster") {
      canvas.currentLayer = layer
      renderLayersToDOM()
    }
  }
  canvas.draw()
}

function dragLayerStart(e) {
  let layer = e.target.closest(".layer").layerObj
  let index = canvas.layers.indexOf(layer)
  //pass index through event
  e.dataTransfer.setData("text", index)
  e.target.style.boxShadow =
    "inset 2px 0px rgb(131, 131, 131), inset -2px 0px rgb(131, 131, 131), inset 0px -2px rgb(131, 131, 131), inset 0px 2px rgb(131, 131, 131)"
}

function dragLayerOver(e) {
  e.preventDefault()
}

function dragLayerEnter(e) {
  if (e.target.className.includes("layer")) {
    e.target.style.boxShadow =
      "inset 2px 0px rgb(255, 255, 255), inset -2px 0px rgb(255, 255, 255), inset 0px -2px rgb(255, 255, 255), inset 0px 2px rgb(255, 255, 255)"
  }
}

function dragLayerLeave(e) {
  if (e.target.className.includes("layer")) {
    e.target.style.boxShadow =
      "inset 2px 0px rgb(131, 131, 131), inset -2px 0px rgb(131, 131, 131), inset 0px -2px rgb(131, 131, 131), inset 0px 2px rgb(131, 131, 131)"
  }
}

function dropLayer(e) {
  let targetLayer = e.target.closest(".layer").layerObj
  let draggedIndex = parseInt(e.dataTransfer.getData("text"))
  let heldLayer = canvas.layers[draggedIndex]
  //TODO: add layer change to timeline
  if (e.target.className.includes("layer") && targetLayer !== heldLayer) {
    for (let i = 0; i < layersCont.children.length; i += 1) {
      if (layersCont.children[i] === e.target) {
        let newIndex = canvas.layers.indexOf(layersCont.children[i].layerObj)
        canvas.layers.splice(draggedIndex, 1)
        canvas.layers.splice(newIndex, 0, heldLayer)
      }
    }
    renderLayersToDOM()
    canvas.draw()
  }
}

function dragLayerEnd(e) {
  renderLayersToDOM()
}

function addRasterLayer() {
  //TODO: add to timeline.
  //once layer is added and drawn on, can no longer be deleted
  let layerCVS = document.createElement("canvas")
  let layerCTX = layerCVS.getContext("2d")
  layerCVS.width = canvas.offScreenCVS.width
  layerCVS.height = canvas.offScreenCVS.height
  let layer = {
    type: "raster",
    title: `Layer ${canvas.layers.length + 1}`,
    cvs: layerCVS,
    ctx: layerCTX,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    removed: false,
  }
  canvas.layers.push(layer)
  addToTimeline("addlayer", 0, 0, layer)
  state.undoStack.push(state.points)
  state.points = []
  state.redoStack = []
  renderLayersToDOM()
}

function addReferenceLayer() {
  //TODO: add to timeline
  let reader
  let img = new Image()

  if (this.files && this.files[0]) {
    reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target.result
      img.onload = () => {
        //constrain background image to canvas with scale
        let scale =
          canvas.unsharpenedWidth / img.width > canvas.unsharpenedHeight / img.height
            ? canvas.unsharpenedHeight / img.height
            : canvas.unsharpenedWidth / img.width
        let layer = {
          type: "reference",
          title: `Reference ${canvas.layers.length + 1}`,
          img: img,
          x: 0,
          y: 0,
          scale: scale,
          opacity: 1,
          removed: false,
        }
        canvas.layers.unshift(layer)
        renderLayersToDOM()
        canvas.draw()
      }
    }

    reader.readAsDataURL(this.files[0])
  }
}

function removeLayer(e) {
  //set "removed" flag to true on selected layer
  //add to timeline
  let layer = e.target.closest(".layer").layerObj
  layer.removed = true
}

function renderLayersToDOM() {
  layersCont.innerHTML = ""
  let id = 0
  canvas.layers.forEach((l) => {
    if (!l.removed) {
      let layerElement = document.createElement("div")
      layerElement.className = `layer ${l.type}`
      layerElement.id = id
      id += 1
      layerElement.textContent = l.title
      layerElement.draggable = true
      if (l === canvas.currentLayer) {
        layerElement.style.background = "rgb(255, 255, 255)"
        layerElement.style.color = "rgb(0, 0, 0)"
      }
      let hide = document.createElement("div")
      hide.className = "hide btn"
      let eye = document.createElement("span")
      if (l.opacity === 0) {
        eye.className = "eyeclosed icon"
      } else {
        eye.className = "eyeopen icon"
      }
      hide.appendChild(eye)
      layerElement.appendChild(hide)
      layersCont.appendChild(layerElement)
      //associate object
      layerElement.layerObj = l
    }
  })
}

//add move tool and scale tool for reference layers

// QUESTION: How to deal with undo/redo when deleting a layer?
//If a layer is removed, actions associated with that layer will be removed
//and can't easily be added back in the correct order.

//vector layers have an option to create a raster copy layer

//vector layers need movable control points, how to organize order of added control points?

//====================================//
//======== * * * Colors * * * ========//
//====================================//

function openColorPicker(e) {
  picker.swatch = e.target.className
  const initialColorReference =
    picker.swatch === "back-swatch btn" ? state.backColor : state.brushColor
  picker.update(initialColorReference)
  //main page can't be interacted with
  fullPage.style.pointerEvents = "none"
  //disable shortcuts
  state.shortcuts = false
  //show colorpicker
  colorPickerContainer.style.display = "flex"
  //allow colorPickerContainer events
  colorPickerContainer.style.pointerEvents = "auto"
}

/**
 * Close the picker window
 */
function closePickerWindow() {
  // hide colorpicker
  colorPickerContainer.style.display = "none"
  //restore pointer events to page
  fullPage.style.pointerEvents = "auto"
  //enable keyboard shortcuts
  state.shortcuts = true
}

/**
 * This function sets the color according to the currently selected parameters and closes the picker window
 * @param {event} e
 */
function handleConfirm(e) {
  //set color to brush
  setColor(picker.red, picker.green, picker.blue, picker.swatch)
  //close window
  closePickerWindow()
}

function handleCancel(e) {
  //close window
  closePickerWindow()
}

function switchColors(e) {
  let temp = { ...state.brushColor }
  state.brushColor = state.backColor
  swatch.style.background = state.brushColor.color
  state.backColor = temp
  backSwatch.style.background = state.backColor.color
}

function setColor(r, g, b, target) {
  if (target === "swatch btn") {
    state.brushColor.color = `rgba(${r},${g},${b},255)`
    state.brushColor.r = r
    state.brushColor.g = g
    state.brushColor.b = b
    swatch.style.background = state.brushColor.color
  } else {
    state.backColor.color = `rgba(${r},${g},${b},255)`
    state.backColor.r = r
    state.backColor.g = g
    state.backColor.b = b
    backSwatch.style.background = state.backColor.color
  }
}

function randomizeColor(e) {
  let r = Math.floor(Math.random() * 256)
  let g = Math.floor(Math.random() * 256)
  let b = Math.floor(Math.random() * 256)
  setColor(r, g, b, e.target.className)
}

function getColor(x, y, colorLayer) {
  let canvasColor = {}

  let startPos = (y * canvas.offScreenCVS.width + x) * 4
  //clicked color
  canvasColor.r = colorLayer.data[startPos]
  canvasColor.g = colorLayer.data[startPos + 1]
  canvasColor.b = colorLayer.data[startPos + 2]
  canvasColor.a = colorLayer.data[startPos + 3]
  canvasColor.color = `rgba(${canvasColor.r},${canvasColor.g},${canvasColor.b},${canvasColor.a})`
  return canvasColor
}

//====================================//
//===== * * * Touchscreens * * * =====//
//====================================//

//Fit canvas and tools so no scrolling necessary

//Maximize drawing space:
//Tools and other dialog boxes should be collapsed and
//accessible upon touching, which reveals list of options/tools
//hub icon, can store all dialog boxes, can drag out and in dialog boxes which user wants for a customized toolset

//zooming with pinch actions, prevent default device zoom

function handleTouchStart(e) {
  //   e.preventDefault()
  state.touch = true
  handleMouseDown(e)
}

function handleTouchMove(e) {
  //   e.preventDefault()
  handleMouseMove(e)
}

function handleTouchEnd(e) {
  //   e.preventDefault()
  handleMouseUp(e)
}

function handleTouchCancel(e) {
  //   e.preventDefault()
  handleMouseOut(e)
}

//Initialize Tools
//Color Picker
//Create an instance passing it the canvas, width and height
let picker = new Picker(
  document.getElementById("color-picker"),
  250,
  250,
  setColor
)

//Draw
picker.build(state.brushColor)
