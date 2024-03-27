//Import order is important. 1. DOM initialization, 2. state managers
import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { renderCursor } from "../GUI/cursor.js"
import { activateShortcut, deactivateShortcut } from "./shortcuts.js"
import { renderCanvas } from "../Canvas/render.js"
import { renderVectorsToDOM } from "../DOM/render.js"
import { actionZoom } from "../Actions/untrackedActions.js"
import { throttle } from "../utils/eventHelpers.js"

/**
 * Set global coordinates
 * TODO: (Low Priority) move to separate file and import
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
 * @param {KeyboardEvent} e - The keydown event
 */
function handleKeyDown(e) {
  // e.preventDefault() - May conditionally need this for certain shortcuts, but try to avoid doing so
  //Prevent default bookmark behavior (KeyD)
  //Prevent default find behavior (KeyF)
  //Prevent default reload behavior (KeyR)
  //Prevent default save behavior (KeyS)
  if (
    ["KeyD", "KeyF", "KeyR", "KeyS"].includes(e.code) &&
    (keys.MetaLeft || keys.MetaRight)
  ) {
    e.preventDefault()
  }
  //Prevent repeated activations while holding a key down
  if (e.repeat) {
    return
  }
  //if entering info on text input, don't activate shortcuts
  if (
    document.activeElement.tagName === "INPUT" &&
    document.activeElement.type === "text"
  ) {
    return
  }
  if (state.shortcuts) {
    keys[e.code] = true //set active key globally
    activateShortcut(e.code)
  }
}

/**
 * @param {KeyboardEvent} e - The keyup event
 */
function handleKeyUp(e) {
  keys[e.code] = false //unset active key globally
  deactivateShortcut(e.code)
}

/**
 * @param {WheelEvent} e - The scroll wheel event
 */
function handleWheel(e) {
  let delta = Math.sign(e.deltaY)
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

/**
 * @param {PointerEvent} e - The pointerdown event
 */
function handlePointerDown(e) {
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
    renderCursor()
  }
}

/**
 * @param {PointerEvent} e - The pointermove event
 */
function handlePointerMove(e) {
  if (state.clickDisabled && state.clicked) {
    return
  }
  canvas.pointerEvent = "pointermove"
  state.clickDisabled = false
  //currently only square dimensions work
  canvas.zoomAtLastDraw = canvas.zoom //* */
  //use requestAnimationFrame for smoother rendering. Must be called before setting coordinates or else line may be broken unintentionally
  window.requestAnimationFrame(() => {
    //coords
    setCoordinates(e)
    let cursorMoved =
      state.previousX !== state.cursorX || state.previousY !== state.cursorY
    if (state.tool.options.useSubpixels?.active && !cursorMoved) {
      cursorMoved =
        canvas.previousSubPixelX !== canvas.subPixelX ||
        canvas.previousSubPixelY !== canvas.subPixelY
    }
    if (cursorMoved) {
      if (
        state.clicked
        // ||
        // ((state.tool.name === "quadCurve" ||
        //   state.tool.name === "cubicCurve" ||
        //   state.tool.name === "fill") &&
        //   state.clickCounter > 0)
      ) {
        //run selected tool step function
        state.tool.fn()
        vectorGui.render()
        if (
          (state.tool.name === "brush" && state.tool.modes?.eraser) ||
          state.tool.name === "eyedropper"
        ) {
          renderCursor()
        }
      } else {
        //no active tool, just render cursor
        vectorGui.render()
        if (
          !(
            ["quadCurve", "cubicCurve"].includes(state.tool.name) &&
            state.clickCounter > 0
          )
        ) {
          renderCursor()
        }
      }
    }
    // save last point
    state.previousX = state.cursorX
    state.previousY = state.cursorY
    canvas.previousSubPixelX = canvas.subPixelX
    canvas.previousSubPixelY = canvas.subPixelY
  })
}

/**
 * @param {PointerEvent} e - The pointerup event
 */
function handlePointerUp(e) {
  canvas.pointerEvent = "pointerup"
  if (state.clickDisabled || !state.clicked) {
    return
  }
  state.clicked = false
  canvas.vectorGuiCVS.style.cursor = state.tool.cursor
  setCoordinates(e)
  //if drawing on hidden layer, stop flashing hide btn
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
  //reset action and render vectors
  if (state.action) {
    if (
      ["fill", "line", "quadCurve", "cubicCurve", "ellipse"].includes(
        state.tool.name
      )
    ) {
      renderVectorsToDOM()
    }

    state.pointsSet = null
    state.seenPixelsSet = null
    state.points = []
    //Reset redostack
    state.clearRedoStack()
  }
  //Deactivate pending shortcuts
  if (state.tool.name !== dom.toolBtn.id) {
    if (!keys.AltLeft && !keys.AltRight && state.tool.name === "eyedropper") {
      deactivateShortcut("AltLeft")
    }
    if (!keys.Space && state.tool.name === "grab") {
      deactivateShortcut("Space")
    }
  }
  canvas.pointerEvent = "none"
  if (!e.targetTouches) {
    vectorGui.render()
    if (["brush", "colorMask", "eyedropper"].includes(state.tool.name)) {
      renderCursor()
    }
  }
}

/**
 * @param {PointerEvent} e - The pointerout event
 */
function handlePointerOut(e) {
  //TODO: (Low Priority) if touchscreen, need to handle differently. Currently cannot reach next code since clicked will be false.
  //Only purpose is to rerender with multi step tools such as curve when moving out or in the case of touch, lifting finger
  if (!state.touch && state.clickCounter === 0) {
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
 * @param {TouchEvent} e - The touchstart event
 */
function handleTouchStart(e) {
  state.touch = true
}

/**
 * Identify whether program is being used by touchscreen or mouse. Important for multi-step tools such as curve
 * @param {MouseEvent} e - The mousedown event
 */
function handleMouseDown(e) {
  if (e.type === "mousedown") {
    // state.touch = false // NOTE: this also triggers when in tablet mode in chrome. Comment this out while testing
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
