//Import order is important. 1. DOM initialization, 2. state managers
import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCursor } from "../GUI/cursor.js"
import { activateShortcut, deactivateShortcut } from "./shortcuts.js"
import { renderCanvas } from "../Canvas/render.js"
import { renderVectorsToDOM } from "../DOM/render.js"
import { actionZoom } from "../Actions/untrackedActions.js"
import { throttle } from "../utils/eventHelpers.js"
import { testBrushAction } from "../Testing/brushTest.js"

/**
 * Set global coordinates
 * TODO: move to separate file and import
 * @param {UIEvent} e - PointerEvent, WheelEvent
 */
const setCoordinates = (e) => {
  const x = Math.floor(e.layerX)
  const y = Math.floor(e.layerY)
  const fidelity = canvas.zoom / 16
  canvas.subPixelX = Math.floor(
    (x - Math.floor(x / canvas.zoom) * canvas.zoom) / fidelity
  )
  canvas.subPixelY = Math.floor(
    (y - Math.floor(y / canvas.zoom) * canvas.zoom) / fidelity
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
  deactivateShortcut(e.code)
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
  if (state.testing) {
    return
  }
  //reset media type, chrome dev tools niche use or computers that have touchscreen capabilities
  e.target.setPointerCapture(e.pointerId)
  canvas.pointerEvent = "pointerdown"
  state.clicked = true
  if (state.clickDisabled) {
    return
  }
  canvas.vectorGuiCVS.style.cursor = state.tool.activeCursor
  setCoordinates(e)
  if (state.touch) {
    vectorGui.render() // For tablets, vectors must be rendered before running state.tool.fn in order to check control points collision logic
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
  vectorGui.render()
  if (
    (state.tool.name === "brush" && state.tool.modes?.eraser) ||
    state.tool.name === "eyedropper"
  ) {
    renderCursor(state, canvas, swatches)
  }
}

/**
 * @param {PointerEvent} e
 */
function handlePointerMove(e) {
  if (state.testing) {
    return
  }
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
    // vectorGui.render()
    if (
      state.clicked ||
      ((state.tool.name === "quadCurve" ||
        state.tool.name === "cubicCurve" ||
        state.tool.name === "fill") &&
        state.clickCounter > 0)
    ) {
      //run selected tool step function
      state.tool.fn()
      vectorGui.render()
      if (
        (state.tool.name === "brush" && state.tool.modes?.eraser) ||
        state.tool.name === "eyedropper"
      ) {
        renderCursor(state, canvas, swatches)
      }
    } else {
      //no active tool
      vectorGui.render()
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
  if (state.testing) {
    testBrushAction(state.testBrushSize)
    return
  }
  canvas.pointerEvent = "pointerup"
  if (state.clickDisabled || !state.clicked) {
    return
  }
  state.clicked = false
  canvas.vectorGuiCVS.style.cursor = state.tool.cursor
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
  //Deactivate pending shortcuts TODO: set active shortcut with key code to allow cleaner logic like if (state.shortcut.active) {deactivateShortcut(state.shortcut.keyCode)}
  if (state.tool.name !== dom.toolBtn.id) {
    if (!keys.AltLeft && !keys.AltRight && state.tool.name === "eyedropper") {
      deactivateShortcut("AltLeft")
    }
    if (!keys.Space && state.tool.name === "grab") {
      deactivateShortcut("Space")
    }
  }
  state.action = null
  state.pointsSet = null
  state.seenPixelsSet = null
  state.points = []
  //Reset redostack
  state.redoStack = []
  canvas.pointerEvent = "none"
  if (!e.targetTouches) {
    vectorGui.render()
    if (["brush", "colorMask", "eyedropper"].includes(state.tool.name)) {
      renderCursor(state, canvas, swatches)
    }
  }
}

/**
 * @param {PointerEvent} e
 */
function handlePointerOut(e) {
  if (state.testing) {
    return
  }
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
    vectorGui.render()
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
