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

import { actionZoom } from '../Actions/untracked/viewActions.js'
import { debounce } from '../utils/eventHelpers.js'
import { ZOOM_LEVELS, WHEEL_THRESHOLD } from '../utils/constants.js'

/**
 * Translates raw DOM event coordinates into canvas-space cursor
 * coordinates and writes them to globalState and canvas. Divides
 * by zoom so all tool logic operates in canvas pixels rather than
 * screen pixels. Uses previousXOffset (the committed pan position)
 * rather than the live xOffset so coordinates stay stable while a
 * grab/pan is in progress. Sub-pixel precision is computed only
 * when the active tool opts in; the fidelity factor maps the
 * fractional pixel remainder into a 16-step grid that stays
 * resolution-independent across zoom levels.
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
    // zoom / 16 gives 16 addressable sub-steps per canvas pixel,
    // scaled so the step size stays proportional to the zoom level.
    const fidelity = zoom / 16
    canvas.subPixelX = Math.floor((x - xOverZoom * zoom) / fidelity)
    canvas.subPixelY = Math.floor((y - yOverZoom * zoom) / fidelity)
  }
}

//======================================//
//=== * * * Key Event Handlers * * * ===//
//======================================//

/**
 * Handles keydown by recording key state and activating its
 * shortcut. Guards against key-repeat so a held key does not fire
 * the shortcut multiple times. Skips shortcut activation when a
 * text input has focus so users can type without triggering tool
 * hotkeys. Intercepts Cmd+D/F/R/S to suppress the browser's
 * native bookmark, find, reload, and save dialogs before the
 * shortcut system processes the code.
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
 * Handles keyup by clearing the key from the global key map and
 * deactivating any shortcut that is active only while the key is
 * held, such as Space for grab or Alt for eyedropper.
 * @param {KeyboardEvent} e - The keyup event
 */
function handleKeyUp(e) {
  keys[e.code] = false //unset active key globally
  deactivateShortcut(e.code)
}

let wheelAccumulator = 0
let wheelGestureActive = false
let wheelLastDirection = 0
/**
 * Resets wheel gesture state after 300 ms of scroll inactivity.
 * Called after every wheel event so the accumulator, gesture flag,
 * and direction are cleared once the user stops scrolling,
 * allowing the next gesture to start fresh without residual delta
 * from the previous one.
 */
const resetWheelGesture = debounce(() => {
  wheelAccumulator = 0
  wheelGestureActive = false
  wheelLastDirection = 0
}, 300)

/**
 * Handles scroll-wheel input to step the canvas zoom through
 * discrete levels. Normalizes deltaY across the three deltaMode
 * values (pixel, line, page) so trackpad and scroll-wheel devices
 * behave consistently. An accumulator absorbs small deltas so
 * noisy hardware cannot skip multiple zoom levels per gesture.
 * Direction reversals reset the accumulator so the first step in
 * the new direction is not delayed by draining residual delta from
 * the previous direction. Zoom is anchored to the pointer by
 * computing new canvas offsets from cursor coordinates before and
 * after applying the zoom ratio.
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
  // Threshold of 1 on the first step makes the initial zoom feel
  // immediate; WHEEL_THRESHOLD prevents skipping levels afterward.
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
 * Handles pointerdown to begin a tool stroke or resize operation.
 * Delegates immediately to resizeOverlay when a canvas resize is
 * active. Captures the pointer so move and up events continue
 * arriving even if the cursor leaves the canvas element. Marks
 * the cursor as clicked before calling the tool function so tool
 * logic can distinguish initial press from continuation. For
 * tablet input, vectors are pre-rendered before the tool runs so
 * control-point collision detection has up-to-date positions to
 * test against. Flashes a warning indicator on the layer
 * visibility button when the active layer is hidden, giving the
 * user immediate feedback that their stroke is invisible.
 * @param {PointerEvent} e - The pointerdown event
 */
function handlePointerDown(e) {
  if (globalState.canvas.resizeOverlayActive) {
    resizeOverlayPointerDown(e)
    return
  }
  //reset media type, chrome dev tools niche use or computers that have touchscreen capabilities
  // Locks pointer events to this element through pointerup so
  // move/up fire even when the cursor exits the canvas mid-stroke.
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
 * Handles pointermove to advance an active tool stroke and update
 * cursor display. Processes all coalesced events per frame so
 * fast mouse movements are captured at full hardware resolution
 * rather than only at the render-frame rate. The tool function
 * runs only when canvas coordinates actually changed to avoid
 * redundant pixel writes. During a stroke, eraser and eyedropper
 * get a custom cursor overlay; other tools render their own
 * feedback. When no stroke is in progress the cursor is suppressed
 * for a mid-gesture quadratic or cubic curve (non-line mode with
 * clickCounter > 0) to avoid obscuring the in-progress path
 * preview.
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
 * Handles pointerup to finalize a tool stroke or resize gesture.
 * Delegates to resizeOverlay if a canvas resize is active. After
 * the tool function runs, clears the selection scratch sets
 * (pointsSet, seenPixelsSet) to release the memory they held
 * during the stroke, resets the redo stack to keep history
 * consistent with the new state, and clears the action point
 * buffer. Deactivates hold-to-activate shortcuts (Space→grab,
 * Alt→eyedropper) here rather than in keyUp alone because the
 * pointer can be released while the key is still physically held,
 * which would otherwise leave the transient tool active. Skips
 * the final vector and cursor render for touch events because
 * subsequent touch events manage their own display updates.
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
    // if (
    //   ['fill', 'curve', 'ellipse', 'polygon'].includes(
    //     globalState.tool.current.name,
    //   )
    // ) {
    // }

    // Null the scratch sets immediately rather than waiting for GC;
    // they can be large for flood-fill and selection operations.
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
 * Handles pointerout to clean up transient preview state when the
 * cursor leaves the canvas. Primarily serves multi-step tools such
 * as curve that display a live preview between clicks;
 * re-rendering the canvas removes the in-progress preview drawn on
 * the last frame. Runs only for non-touch input and only when no
 * multi-step click sequence is in progress, so a pointerout that
 * occurs mid-gesture does not discard partially-committed state.
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
 * Detects the start of a touch session and switches the GUI into
 * touch-friendly sizing. Doubling renderRadius and collisionRadius
 * compensates for the larger, imprecise contact area of a
 * fingertip; without this scaling, control-point hit detection is
 * too strict for reliable touch interaction. Also signals to
 * multi-step tools that click-to-place semantics apply rather than
 * click-drag semantics.
 * TODO: (Medium Priority) Prevent default pinch zoom behavior
 * and replace it with a custom pinch zoom on the canvas only
 * @param {TouchEvent} e - The touchstart event
 */
function handleTouchStart(e) {
  globalState.tool.touch = true
  canvas.gui.renderRadius *= 2
  canvas.gui.collisionRadius *= 2
}

/**
 * Placeholder for resetting touch mode when a mouse is detected.
 * The reversal logic is commented out because Chrome also fires
 * mousedown during DevTools tablet emulation, which would
 * incorrectly clear globalState.tool.touch while testing tablet
 * behavior. Kept in place so detection can be restored once a
 * reliable device-type signal is available.
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
