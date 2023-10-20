//Import order is important. 1. DOM initialization, 2. state managers
// import { initializeAllDialogBoxes } from "../DOM/dialogBox.js"
import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCursor, renderRasterGUI } from "../GUI/raster.js"
import { activateShortcut } from "../Tools/shortcuts.js"
import {
  renderCanvas,
  renderVectorsToDOM,
  renderPaletteToDOM,
} from "../Canvas/render.js"
import { actionZoom } from "../Tools/untrackedActions.js"
import { adjustEllipseSteps } from "../Tools/index.js"

//TODO: Add Palette that consists of a small canvas with basic paint, sample and fill erase tools.
//TODO: Add color mixer that consists of a small canvas that can be painted upon and cleared. At any time the user can click "Mix" and the colors on the canvas will be used to generate a mixed color.

//======================================//
//=== * * * Key Event Handlers * * * ===//
//======================================//

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
  state.cursorX = Math.round(
    state.cursorWithCanvasOffsetX - canvas.previousXOffset
  )
  state.cursorY = Math.round(
    state.cursorWithCanvasOffsetY - canvas.previousYOffset
  )
}

function handleKeyDown(e) {
  if (e.repeat) {
    return
  }
  // e.preventDefault()
  if (state.shortcuts) {
    keys[e.code] = true
    activateShortcut(e.code)
  }
}

function handleKeyUp(e) {
  keys[e.code] = false
  if (
    e.code === "Space" ||
    e.code === "AltLeft" ||
    e.code === "AltRight" ||
    e.code === "ShiftLeft" ||
    e.code === "ShiftRight"
  ) {
    state.tool = tools[dom.toolBtn.id]
  }

  if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
    tools.brush.options.line = false
    if (state.tool.name === "brush" && state.clicked) {
      state.tool.fn()
    }
    state.vectorProperties.forceCircle = false
    if (
      (vectorGui.selectedPoint.xKey || vectorGui.collidedKeys.xKey) &&
      vectorGui.selectedPoint.xKey !== "px1"
    ) {
      //while holding control point, readjust ellipse without having to move cursor.
      //TODO: update this functionality to have other radii go back to previous radii when releasing shift
      adjustEllipseSteps()
      vectorGui.render(state, canvas)
    }
  }
  //Palette
  if (e.code === "KeyX" || e.code === "KeyK") {
    swatches.paletteMode = "select"
    renderPaletteToDOM()
  }
  if (e.code === "KeyS") {
    renderPaletteToDOM()
  }

  //
  if (dom.toolBtn.id === "grab") {
    canvas.vectorGuiCVS.style.cursor = "move"
  } else if (
    dom.toolBtn.id === "replace" ||
    dom.toolBtn.id === "brush" ||
    dom.toolBtn.id === "quadCurve" ||
    dom.toolBtn.id === "cubicCurve" ||
    dom.toolBtn.id === "ellipse" ||
    dom.toolBtn.id === "fill" ||
    dom.toolBtn.id === "line" ||
    dom.toolBtn.id === "select"
  ) {
    if (dom.modeBtn.id === "erase") {
      canvas.vectorGuiCVS.style.cursor = "none"
    } else {
      canvas.vectorGuiCVS.style.cursor = "crosshair"
    }
  } else {
    canvas.vectorGuiCVS.style.cursor = "none"
  }
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
      actionZoom(z, nox, noy)
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
      actionZoom(z, nox, noy)
    }
  }
}

//========================================//
//==== * * Pointer Event Handlers * * ====//
//========================================//

function handlePointerDown(e) {
  //reset media type, chrome dev tools niche use or computers that have touchscreen capabilities
  e.target.setPointerCapture(e.pointerId)
  canvas.pointerEvent = "pointerdown"
  state.clicked = true
  if (state.clickDisabled) {
    return
  }
  setCoordinates(e)
  if (state.touch) {
    vectorGui.render(state, canvas) // For tablets, vectors must be rendered before running state.tool.fn in order to check control points collision logic
  }
  renderCanvas()
  //if drawing on hidden layer, flash hide btn
  if (canvas.currentLayer.opacity === 0) {
    for (let i = 0; i < dom.layersContainer.children.length; i += 1) {
      if (dom.layersContainer.children[i].layerObj === canvas.currentLayer) {
        dom.layersContainer.children[i]
          .querySelector(".hide")
          .classList.add("warning")
      }
    }
  }
  //run selected tool step function
  state.tool.fn()
  // save last point
  state.previousX = state.cursorX
  state.previousY = state.cursorY
  //Re-render GUI
  renderRasterGUI(state, canvas, swatches)
  vectorGui.render(state, canvas)
  if (state.tool.name === "eyedropper") {
    renderCursor(state, canvas, swatches)
  }
  if (
    (state.tool.name === "brush" || state.tool.name === "replace") &&
    state.mode === "erase"
  ) {
    vectorGui.drawCursorBox(state, canvas, 1)
  }
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
  let cursorMoved =
    state.previousX !== state.cursorX || state.previousY !== state.cursorY
  if (state.tool.options.useSubPixels && !cursorMoved) {
    cursorMoved =
      canvas.previousSubPixelX !== canvas.subPixelX ||
      canvas.previousSubPixelY !== canvas.subPixelY
  }
  if (cursorMoved) {
    //Hover brush
    renderRasterGUI(state, canvas, swatches)
    // vectorGui.render(state, canvas)
    if (
      state.clicked ||
      ((state.tool.name === "quadCurve" ||
        state.tool.name === "cubicCurve" ||
        state.tool.name === "fill") &&
        state.clickCounter > 0)
    ) {
      //run selected tool step function
      state.tool.fn()
      vectorGui.render(state, canvas)
      if (
        (state.tool.name === "brush" || state.tool.name === "replace") &&
        state.mode === "erase"
      ) {
        vectorGui.drawCursorBox(state, canvas, 1)
      }
      if (state.tool.name === "eyedropper") {
        renderCursor(state, canvas, swatches)
      }
    } else {
      //no active tool
      vectorGui.render(state, canvas)
      renderCursor(state, canvas, swatches)
    }
  }
  // if (!state.tool.options.line) {
  // save last point
  state.previousX = state.cursorX
  state.previousY = state.cursorY
  // }
  canvas.previousSubPixelX = canvas.subPixelX
  canvas.previousSubPixelY = canvas.subPixelY
}

function handlePointerUp(e) {
  canvas.pointerEvent = "pointerup"
  if (state.clickDisabled || !state.clicked) {
    return
  }
  state.clicked = false
  setCoordinates(e)
  if (canvas.currentLayer.opacity === 0) {
    for (let i = 0; i < dom.layersContainer.children.length; i += 1) {
      if (dom.layersContainer.children[i].layerObj === canvas.currentLayer) {
        dom.layersContainer.children[i]
          .querySelector(".hide")
          .classList.remove("warning")
      }
    }
  }
  //run selected tool step function
  state.tool.fn()
  //add to undo stack
  if (state.action) {
    state.undoStack.push(state.action)

    if (
      state.tool.name === "fill" ||
      state.tool.name === "quadCurve" ||
      state.tool.name === "cubicCurve" ||
      state.tool.name === "ellipse"
    ) {
      if (state.action.tool.type === "vector") {
        canvas.currentVectorIndex = state.undoStack.indexOf(state.action)
      } else if (state.action.tool.type === "modify") {
        canvas.currentVectorIndex = state.action.properties.moddedActionIndex
      }
      renderVectorsToDOM()
    }
  }
  state.action = null
  state.pointsSet = null
  state.drawnPointsSet = null
  state.points = []
  //Reset redostack
  state.redoStack = []
  canvas.pointerEvent = "none"
  if (!e.targetTouches) {
    renderRasterGUI(state, canvas, swatches)
    vectorGui.render(state, canvas)
    if (state.tool.name === "eyedropper") {
      renderCursor(state, canvas, swatches)
    }
    if (
      (state.tool.name === "brush" || state.tool.name === "replace") &&
      state.mode === "erase"
    ) {
      vectorGui.drawCursorBox(state, canvas, 1)
    }
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
  //   if (state.action) {
  //     state.undoStack.push(state.action)
  //   }
  //   state.action = null
  //   state.points = []
  //   //Reset redostack
  //   state.redoStack = []
  // }
  if (!state.touch) {
    renderCanvas()
    renderRasterGUI(state, canvas, swatches)
    vectorGui.render(state, canvas)
    canvas.pointerEvent = "none"
  }
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

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

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
