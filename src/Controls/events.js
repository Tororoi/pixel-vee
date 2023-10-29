//Import order is important. 1. DOM initialization, 2. state managers
import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCursor } from "../GUI/raster.js"
import { activateShortcut } from "./shortcuts.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderVectorsToDOM,
  renderPaletteToolsToDOM,
  renderPaletteToDOM,
} from "../DOM/render.js"
import { actionZoom } from "../Actions/untrackedActions.js"
import { adjustEllipseSteps } from "../Tools/ellipse.js"
import { debounce, throttle } from "../utils/eventHelpers.js"

/**
 * Set global coordinates
 * TODO: move to separate file and import
 * @param {UIEvent} e - PointerEvent, WheelEvent
 */
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

//======================================//
//=== * * * Key Event Handlers * * * ===//
//======================================//

/**
 * @param {KeyboardEvent} e
 */
function handleKeyDown(e) {
  //Prevent repeated activations while holding a key down
  if (e.repeat) {
    return
  }
  // e.preventDefault() - May conditionally need this for certain shortcuts, but try to avoid doing so
  if (state.shortcuts) {
    keys[e.code] = true //set active key globally
    activateShortcut(e.code)
  }
}

/**
 * @param {KeyboardEvent} e
 */
function handleKeyUp(e) {
  keys[e.code] = false //unset active key globally
  if (
    e.code === "Space" ||
    e.code === "AltLeft" ||
    e.code === "AltRight" ||
    e.code === "ShiftLeft" ||
    e.code === "ShiftRight"
  ) {
    state.tool = tools[dom.toolBtn.id]
    if (e.code === "Space") {
      //TODO: refactor so grabSteps can be called instead with a manually supplied pointer event pointerup
      state.clicked = false
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
    }
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
    renderPaletteToolsToDOM()
    renderPaletteToDOM()
  }

  //Tools
  if (dom.toolBtn.id === "scale") {
    canvas.vectorGuiCVS.style.cursor = "pointer"
  } else if (dom.toolBtn.id === "grab") {
    canvas.vectorGuiCVS.style.cursor = "grab"
  } else if (dom.toolBtn.id === "move") {
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

/**
 * @param {WheelEvent} e
 */
function handleWheel(e) {
  let delta = Math.sign(e.deltaY)
  //BUG: zoom doesn't stay centered, wobbles slightly (due to forcing the normalization to the pixelgrid?). To reproduce, quickly zoom in and out
  //zoom based on pointer coords
  let z
  setCoordinates(e) //
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

/**
 * @param {PointerEvent} e
 */
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
  renderCanvas(canvas.currentLayer)
  //if drawing on hidden layer, flash hide btn
  if (canvas.currentLayer.hidden) {
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

/**
 * @param {PointerEvent} e
 */
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

/**
 * @param {PointerEvent} e
 */
function handlePointerUp(e) {
  canvas.pointerEvent = "pointerup"
  if (state.clickDisabled || !state.clicked) {
    return
  }
  state.clicked = false
  setCoordinates(e)
  if (canvas.currentLayer.hidden) {
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
      ["fill", "quadCurve", "cubicCurve", "ellipse"].includes(state.tool.name)
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
    vectorGui.render(state, canvas)
    if (["brush", "replace", "eyedropper"].includes(state.tool.name)) {
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

/**
 * @param {PointerEvent} e
 */
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
    renderCanvas(canvas.currentLayer)
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

/**
 * Identify whether program is being used by touchscreen or mouse. Important for multi-step tools such as curve
 * @param {TouchEvent} e
 */
function handleTouchStart(e) {
  state.touch = true
}

/**
 * Identify whether program is being used by touchscreen or mouse. Important for multi-step tools such as curve
 * @param {MouseEvent} e
 */
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
const throttledHandleWheel = throttle(handleWheel, 100)
canvas.vectorGuiCVS.addEventListener("wheel", throttledHandleWheel, {
  passive: true,
})

//Pointer
canvas.vectorGuiCVS.addEventListener("pointermove", handlePointerMove)
canvas.vectorGuiCVS.addEventListener("pointerdown", handlePointerDown)
canvas.vectorGuiCVS.addEventListener("pointerup", handlePointerUp)
canvas.vectorGuiCVS.addEventListener("pointerout", handlePointerOut) //NOTE: Deprecated? May need to rewrite just for multistep tools such as curve that can be in use while pointer is up

canvas.vectorGuiCVS.addEventListener("touchstart", handleTouchStart, {
  passive: true,
})
canvas.vectorGuiCVS.addEventListener("mousedown", handleMouseDown)
