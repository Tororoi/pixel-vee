//Import order is important. 1. DOM initialization, 2. state managers
import { dom } from '../Context/dom.js'
import { keys } from '../Shortcuts/keys.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import {
  resizeOverlayPointerDown,
  resizeOverlayPointerMove,
  resizeOverlayPointerUp,
} from '../Canvas/resizeOverlay.js'
import { vectorGui } from '../GUI/vector.js'
import { renderCursor } from '../GUI/cursor.js'
import { activateShortcut, deactivateShortcut } from './shortcuts.js'
import { renderCanvas } from '../Canvas/render.js'
import { renderVectorsToDOM } from '../DOM/render.js'
import { actionZoom } from '../Actions/untracked/viewActions.js'
import { debounce } from '../utils/eventHelpers.js'
import { ZOOM_LEVELS, WHEEL_THRESHOLD } from '../utils/constants.js'

/**
 * Set global coordinates
 * TODO: (Low Priority) move to separate file and import
 * @param {UIEvent} e - PointerEvent, WheelEvent
 */
const setCoordinates = (e) => {
  const x = Math.floor(e.offsetX)
  const y = Math.floor(e.offsetY)
  const zoom = canvas.zoom
  const xOverZoom = Math.floor(x / zoom)
  const yOverZoom = Math.floor(y / zoom)
  globalState.cursor.withOffsetX = xOverZoom
  globalState.cursor.withOffsetY = yOverZoom
  globalState.cursor.x = Math.round(xOverZoom - canvas.previousXOffset)
  globalState.cursor.y = Math.round(yOverZoom - canvas.previousYOffset)
  if (globalState.tool.current.options.useSubpixels?.active) {
    const fidelity = zoom / 16
    canvas.subPixelX = Math.floor((x - xOverZoom * zoom) / fidelity)
    canvas.subPixelY = Math.floor((y - yOverZoom * zoom) / fidelity)
  }
}

//======================================//
//=== * * * Key Event Handlers * * * ===//
//======================================//

/**
 * @param {KeyboardEvent} e - The keydown event
 */
function handleKeyDown(e) {
  // e.preventDefault() - May conditionally need this for certain shortcuts, but try to avoid doing so
  //Prevent repeated activations while holding a key down
  if (e.repeat) {
    return
  }
  //if entering info on text input, don't activate shortcuts
  if (
    document.activeElement.tagName === 'INPUT' &&
    document.activeElement.type === 'text'
  ) {
    return
  }
  //Prevent default bookmark behavior (KeyD)
  //Prevent default find behavior (KeyF)
  //Prevent default reload behavior (KeyR)
  //Prevent default save behavior (KeyS)
  if (
    ['KeyD', 'KeyF', 'KeyR', 'KeyS'].includes(e.code) &&
    (keys.MetaLeft || keys.MetaRight)
  ) {
    e.preventDefault()
  }
  if (globalState.ui.shortcuts) {
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

let wheelAccumulator = 0
let wheelGestureActive = false
let wheelLastDirection = 0
const resetWheelGesture = debounce(() => {
  wheelAccumulator = 0
  wheelGestureActive = false
  wheelLastDirection = 0
}, 300)

/**
 * @param {WheelEvent} e - The scroll wheel event
 */
function handleWheel(e) {
  //normalize delta: lines → ~40px, pages → ~800px
  let rawDelta = e.deltaY
  if (e.deltaMode === 1) rawDelta *= 40
  else if (e.deltaMode === 2) rawDelta *= 800
  const rawDirection = Math.sign(rawDelta)
  //reset gesture on direction change so the first step in the new direction fires immediately
  if (
    rawDirection !== 0 &&
    wheelLastDirection !== 0 &&
    rawDirection !== wheelLastDirection
  ) {
    wheelAccumulator = 0
    wheelGestureActive = false
  }
  wheelLastDirection = rawDirection
  wheelAccumulator += rawDelta
  resetWheelGesture()
  const threshold = wheelGestureActive ? WHEEL_THRESHOLD : 1
  if (Math.abs(wheelAccumulator) < threshold) return
  const direction = Math.sign(wheelAccumulator)
  wheelAccumulator = 0
  wheelGestureActive = true
  setCoordinates(e)
  //find nearest zoom level index
  let idx = ZOOM_LEVELS.findIndex((l) => l >= canvas.zoom)
  if (idx === -1) idx = ZOOM_LEVELS.length - 1
  //step one level at a time: direction < 0 zooms out, direction > 0 zooms in
  const nextIdx = idx + (direction < 0 ? -1 : 1)
  if (nextIdx < 0 || nextIdx >= ZOOM_LEVELS.length) return
  const targetZoom = ZOOM_LEVELS[nextIdx]
  // Calculate the zoom ratio between the new zoom level and the current zoom level
  const zoomRatio = targetZoom / canvas.zoom
  //zoom based on pointer coords
  const zoomedX = globalState.cursor.withOffsetX / zoomRatio
  const zoomedY = globalState.cursor.withOffsetY / zoomRatio
  //offset by cursor coords
  const nox = zoomedX - globalState.cursor.x
  const noy = zoomedY - globalState.cursor.y
  actionZoom(targetZoom, nox, noy)
}

//========================================//
//==== * * Pointer Event Handlers * * ====//
//========================================//

/**
 * @param {PointerEvent} e - The pointerdown event
 */
function handlePointerDown(e) {
  if (globalState.canvas.resizeOverlayActive) {
    resizeOverlayPointerDown(e)
    return
  }
  //reset media type, chrome dev tools niche use or computers that have touchscreen capabilities
  e.target.setPointerCapture(e.pointerId)
  canvas.pointerEvent = 'pointerdown'
  globalState.cursor.clicked = true
  if (globalState.cursor.clickDisabled) {
    return
  }
  canvas.vectorGuiCVS.style.cursor = globalState.tool.current.activeCursor
  setCoordinates(e)
  if (globalState.tool.touch) {
    vectorGui.render() // For tablets, vectors must be rendered before running globalState.tool.current.fn in order to check control points collision logic
  }
  renderCanvas(canvas.currentLayer)
  //if drawing on hidden layer, flash hide btn
  if (canvas.currentLayer.hidden && dom.layersContainer) {
    for (let i = 0; i < dom.layersContainer.children.length; i += 1) {
      if (dom.layersContainer.children[i].layerObj === canvas.currentLayer) {
        dom.layersContainer.children[i]
          .querySelector('.hide')
          ?.classList.add('warning')
      }
    }
  }
  //run selected tool step function
  globalState.tool.current.fn()
  // save last point
  globalState.cursor.prevX = globalState.cursor.x
  globalState.cursor.prevY = globalState.cursor.y
  //Re-render GUI
  vectorGui.render()
  if (
    (globalState.tool.current.name === 'brush' &&
      globalState.tool.current.modes?.eraser) ||
    globalState.tool.current.name === 'eyedropper'
  ) {
    renderCursor()
  }
}

/**
 * @param {PointerEvent} e - The pointermove event
 */
function handlePointerMove(e) {
  if (globalState.canvas.resizeOverlayActive) {
    resizeOverlayPointerMove(e)
    return
  }
  if (globalState.cursor.clickDisabled && globalState.cursor.clicked) {
    return
  }
  canvas.pointerEvent = 'pointermove'
  globalState.cursor.clickDisabled = false
  //currently only square dimensions work
  canvas.zoomAtLastDraw = canvas.zoom //* */

  // Process all coalesced events for smoother strokes at high mouse speed.
  // Drawing (pixel writes to offscreen canvas) is synchronous — no RAF deferral
  // needed here because scheduleRender() inside each tool fn() already batches
  // the offscreen→onscreen blit via its own RAF.
  const events = e.getCoalescedEvents?.() ?? [e]
  // Uncomment to use predicted events
  // const coalesced = e.getCoalescedEvents?.() ?? [e]
  // const predicted = globalState.cursor.clicked ? (e.getPredictedEvents?.() ?? []) : []
  // const events = [...coalesced, ...predicted]
  let cursorMoved = false

  for (const evt of events) {
    setCoordinates(evt)
    const moved =
      globalState.cursor.prevX !== globalState.cursor.x ||
      globalState.cursor.prevY !== globalState.cursor.y
    const subpixelMoved =
      globalState.tool.current.options.useSubpixels?.active &&
      (canvas.previousSubPixelX !== canvas.subPixelX ||
        canvas.previousSubPixelY !== canvas.subPixelY)

    if (moved || subpixelMoved) {
      cursorMoved = true
      if (
        globalState.cursor.clicked
        // ||
        // ((globalState.tool.current.name === "curve" ||
        //   globalState.tool.current.name === "fill") &&
        //   globalState.tool.clickCounter > 0)
      ) {
        //run selected tool step function
        globalState.tool.current.fn()
      }
      // save last point
      globalState.cursor.prevX = globalState.cursor.x
      globalState.cursor.prevY = globalState.cursor.y
      canvas.previousSubPixelX = canvas.subPixelX
      canvas.previousSubPixelY = canvas.subPixelY
    }
  }

  if (cursorMoved) {
    vectorGui.render()
    if (globalState.cursor.clicked) {
      if (
        (globalState.tool.current.name === 'brush' &&
          globalState.tool.current.modes?.eraser) ||
        globalState.tool.current.name === 'eyedropper'
      ) {
        renderCursor()
      }
    } else {
      //no active tool, just render cursor
      if (
        !(
          globalState.tool.current.name === 'curve' &&
          !globalState.tool.current.modes?.line &&
          globalState.tool.clickCounter > 0
        )
      ) {
        renderCursor()
      }
    }
  }
}

/**
 * @param {PointerEvent} e - The pointerup event
 */
function handlePointerUp(e) {
  if (globalState.canvas.resizeOverlayActive) {
    resizeOverlayPointerUp(e)
    return
  }
  canvas.pointerEvent = 'pointerup'
  if (globalState.cursor.clickDisabled || !globalState.cursor.clicked) {
    return
  }
  globalState.cursor.clicked = false
  canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
  setCoordinates(e)
  //if drawing on hidden layer, stop flashing hide btn
  if (canvas.currentLayer.hidden && dom.layersContainer) {
    for (let i = 0; i < dom.layersContainer.children.length; i += 1) {
      if (dom.layersContainer.children[i].layerObj === canvas.currentLayer) {
        dom.layersContainer.children[i]
          .querySelector('.hide')
          ?.classList.remove('warning')
      }
    }
  }

  //run selected tool step function
  globalState.tool.current.fn()
  //reset action and render vectors
  if (globalState.timeline.currentAction) {
    if (
      ['fill', 'curve', 'ellipse', 'polygon'].includes(
        globalState.tool.current.name,
      )
    ) {
      renderVectorsToDOM()
    }

    globalState.selection.pointsSet = null
    globalState.selection.seenPixelsSet = null
    globalState.timeline.clearPoints()
    //Reset redostack
    globalState.clearRedoStack()
  }
  //Deactivate pending shortcuts
  if (globalState.tool.current.name !== globalState.tool.selectedName) {
    if (
      !keys.AltLeft &&
      !keys.AltRight &&
      globalState.tool.current.name === 'eyedropper'
    ) {
      deactivateShortcut('AltLeft')
    }
    if (!keys.Space && globalState.tool.current.name === 'grab') {
      deactivateShortcut('Space')
    }
  }
  canvas.pointerEvent = 'none'
  if (!e.targetTouches) {
    vectorGui.render()
    if (
      ['brush', 'colorMask', 'eyedropper'].includes(
        globalState.tool.current.name,
      )
    ) {
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
  if (!globalState.tool.touch && globalState.tool.clickCounter === 0) {
    renderCanvas(canvas.currentLayer)
    vectorGui.render()
    canvas.pointerEvent = 'none'
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
 * //TODO: (Medium Priority) Prevent default pinch zoom behavior and replace it with a custom pinch zoom on the canvas only
 */
function handleTouchStart(e) {
  globalState.tool.touch = true
  canvas.gui.renderRadius *= 2
  canvas.gui.collisionRadius *= 2
}

/**
 * Identify whether program is being used by touchscreen or mouse. Important for multi-step tools such as curve
 * @param {MouseEvent} e - The mousedown event
 */
function handleMouseDown(e) {
  if (e.type === 'mousedown') {
    // globalState.tool.touch = false // NOTE: this also triggers when in tablet mode in chrome. Comment this out while testing
  }
}

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

//Shortcuts
document.addEventListener('keydown', handleKeyDown)
document.addEventListener('keyup', handleKeyUp)
canvas.vectorGuiCVS.addEventListener('wheel', handleWheel, {
  passive: true,
})

//Pointer
canvas.vectorGuiCVS.addEventListener('pointermove', handlePointerMove)
canvas.vectorGuiCVS.addEventListener('pointerdown', handlePointerDown)
canvas.vectorGuiCVS.addEventListener('pointerup', handlePointerUp)
canvas.vectorGuiCVS.addEventListener('pointerout', handlePointerOut) //NOTE: Deprecated? May need to rewrite just for multistep tools such as curve that can be in use while pointer is up

canvas.vectorGuiCVS.addEventListener('touchstart', handleTouchStart, {
  passive: true,
})
canvas.vectorGuiCVS.addEventListener('mousedown', handleMouseDown)
