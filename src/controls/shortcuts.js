import { keys } from '../shortcuts/keys.js'
import { globalState } from '../context/state.js'
import { canvas } from '../context/canvas.js'
import { swatches } from '../context/swatch.js'
import { vectorGui } from '../gui/vector.js'
import { handleUndo, handleRedo } from '../actions/undoRedo/undoRedo.js'
import { tools } from '../tools/index.js'
import { renderCanvas } from '../canvas/render.js'

import { randomizeColor } from '../swatch/events.js'
import { renderCursor } from '../gui/cursor.js'
import {
  actionDeselect,
  actionDeleteSelection,
} from '../actions/nonPointer/selectionActions.js'
import {
  actionCutSelection,
  actionPasteSelection,
  actionConfirmPastedPixels,
  actionCopySelection,
} from '../actions/nonPointer/clipboardActions.js'
import {
  actionFlipPixels,
  actionRotatePixels,
} from '../actions/transform/rasterTransform.js'
import { toggleMode, switchTool, toggleToolOption } from '../tools/toolbox.js'
import { adjustVectorSteps } from '../tools/adjust.js'

// Maps key combo strings to action names. Format: '[meta+][shift+]KeyCode'.
// Specific combos (with shift) take precedence over general ones in the lookup
// inside activateShortcut, so meta+shift+KeyZ resolves to 'redo' before the
// general meta+KeyZ fallback would reach 'undo'.
// The navigator recorder and players import this to avoid duplicating the list.
export const keyBindings = {
  // Clipboard / history
  'meta+KeyZ': 'undo',
  'meta+shift+KeyZ': 'redo',
  'meta+KeyX': 'cut',
  'meta+KeyC': 'copy',
  'meta+KeyV': 'paste',
  'meta+KeyD': 'deselect',
  Enter: 'confirm',
  Backspace: 'deleteSelection',
  // Transforms
  'meta+KeyF': 'flipHorizontal',
  'meta+shift+KeyF': 'flipVertical',
  'meta+KeyR': 'rotate',
  // Tool switches
  KeyB: 'brush',
  KeyF: 'fill',
  KeyO: 'ellipse',
  KeyP: 'polygon',
  KeyS: 'select',
  KeyW: 'magicWand',
  // Mode toggles
  KeyE: 'eraser',
  KeyI: 'inject',
  KeyM: 'colorMask',
  KeyY: 'perfect',
  // Curve variants
  KeyC: 'curveCubic',
  KeyQ: 'curveQuad',
  KeyV: 'curve',
  Slash: 'curveLine',
  // Curve tool options
  Digit7: 'curveChain',
  Equal: 'curveEqual',
  KeyA: 'curveAlign',
  KeyH: 'curveHold',
  KeyL: 'curveLink',
}

// Maps action names to handler functions. The navigator players import this
// to execute recorded shortcuts without a switch statement — adding a new
// recordable action only requires updating this file.
// Handlers receive the full recorded action object as an argument; most ignore
// it, but setPrimaryColor reads action.color to deterministically restore the
// swatch that was randomized during recording.
export const actionHandlers = {
  undo: handleUndo,
  redo: handleRedo,
  cut: actionCutSelection,
  copy: actionCopySelection,
  paste: actionPasteSelection,
  confirm: actionConfirmPastedPixels,
  deselect: actionDeselect,
  deleteSelection: actionDeleteSelection,
  flipHorizontal: () => actionFlipPixels(true),
  flipVertical: () => actionFlipPixels(false),
  rotate: actionRotatePixels,
  brush: () => switchTool('brush'),
  fill: () => switchTool('fill'),
  ellipse: () => switchTool('ellipse'),
  polygon: () => switchTool('polygon'),
  select: () => switchTool('select'),
  magicWand: () => switchTool('magicWand'),
  eraser: () => toggleMode('eraser'),
  inject: () => toggleMode('inject'),
  colorMask: () => toggleMode('colorMask'),
  perfect: () => toggleMode('perfect'),
  curveCubic: () => {
    switchTool('curve')
    toggleMode('cubicCurve')
  },
  curveQuad: () => {
    switchTool('curve')
    toggleMode('quadCurve')
  },
  curve: () => switchTool('curve'),
  curveLine: () => {
    switchTool('curve')
    toggleMode('line')
  },
  curveChain: () => {
    if (globalState.tool.selectedName === 'curve') {
      toggleToolOption('curve', 'chain')
    }
  },
  curveEqual: () => {
    if (globalState.tool.selectedName === 'curve') {
      toggleToolOption('curve', 'equal')
      vectorGui.render()
    }
  },
  curveAlign: () => {
    if (globalState.tool.selectedName === 'curve') {
      toggleToolOption('curve', 'align')
      vectorGui.render()
    }
  },
  curveHold: () => {
    if (globalState.tool.selectedName === 'curve') {
      toggleToolOption('curve', 'hold')
    }
  },
  curveLink: () => {
    if (globalState.tool.selectedName === 'curve') {
      toggleToolOption('curve', 'link')
      vectorGui.render()
    }
  },
  // Recorded with the resulting color baked in so playback is deterministic.
  // action.color is { ...swatches.primary.swatch } captured after randomizeColor ran.
  setPrimaryColor: ({ color }) => {
    Object.assign(swatches.primary.swatch, color)
  },
}

// Maps key codes to hold-to-activate handlers. These keys change tool.current
// without changing tool.selectedName so deactivation can restore the prior tool.
// Each handler contains its own guards (cursor.clicked, tool name) since hold
// behaviors don't all share the same preconditions.
export const holdHandlers = {
  Space: () => {
    // Switching tool mid-stroke would orphan the in-progress action and
    // corrupt undo history, so grab only activates between strokes.
    if (!globalState.cursor.clicked) {
      globalState.tool.current = tools['grab']
      canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
      renderCanvas(canvas.currentLayer)
      vectorGui.render()
      renderCursor()
    }
  },
  AltLeft: () => {
    // magicWand uses Alt as subtract-from-selection modifier, not eyedropper
    if (
      !globalState.cursor.clicked &&
      globalState.tool.selectedName !== 'magicWand'
    ) {
      globalState.tool.current = tools['eyedropper']
      canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
      renderCanvas(canvas.currentLayer)
      vectorGui.render()
      renderCursor()
    }
  },
  // Shift fires even mid-stroke so line constraints take effect immediately.
  ShiftLeft: () => {
    if (globalState.tool.selectedName === 'brush') {
      tools.brush.options.line.active = true
      // Pin the constraint origin to where Shift was pressed; recapturing
      // it on each event would let the locked axis drift mid-stroke.
      globalState.tool.lineStartX = globalState.cursor.x
      globalState.tool.lineStartY = globalState.cursor.y
    } else if (globalState.tool.selectedName === 'ellipse') {
      globalState.vector.properties.forceCircle = true
      // Only re-solve geometry when a handle is selected and the shape is
      // in adjust mode (clickCounter 0 means no multi-click in progress).
      // px1 is the center anchor — constraining it without a radius point
      // already placed is a no-op, so skip it to avoid a wasted redraw.
      if (
        vectorGui.selectedPoint.xKey &&
        globalState.tool.clickCounter === 0 &&
        vectorGui.selectedPoint.xKey !== 'px1'
      ) {
        adjustVectorSteps()
        vectorGui.render()
      }
    } else if (globalState.tool.selectedName === 'polygon') {
      globalState.vector.properties.forceSquare = true
      // Same rationale as ellipse: px0 is the origin corner, which has
      // no peer edge to snap to a square aspect at hold time.
      if (
        vectorGui.selectedPoint.xKey &&
        globalState.tool.clickCounter === 0 &&
        vectorGui.selectedPoint.xKey !== 'px0'
      ) {
        adjustVectorSteps()
        vectorGui.render()
      }
    }
  },
  KeyK: () => {
    if (!globalState.cursor.clicked) swatches.paletteMode = 'edit'
  },
  KeyX: () => {
    if (!globalState.cursor.clicked) swatches.paletteMode = 'remove'
  },
}
holdHandlers.AltRight = holdHandlers.AltLeft
holdHandlers.ShiftRight = holdHandlers.ShiftLeft

// Maps key codes to release handlers. Called by deactivateShortcut (on keyUp
// and pointerUp) and by navigator players to restore transient tool state.
// setToolCssCursor is a function declaration below, so it is hoisted and
// accessible here even though it appears later in the file.
export const releaseHandlers = {
  Space: () => {
    // Mirror the hold-side guard: if the pointer is still down the user
    // is mid-pan and releasing Space must not abort that action.
    if (!globalState.cursor.clicked) {
      globalState.tool.current = tools[globalState.tool.selectedName]
      // Commit the pan so the next stroke's coordinate math uses the
      // updated origin rather than the pre-grab origin.
      canvas.previousXOffset = canvas.xOffset
      canvas.previousYOffset = canvas.yOffset
      vectorGui.render()
      renderCursor()
      setToolCssCursor()
    }
  },
  AltLeft: () => {
    // Mirror the hold-side guard: restoring mid-stroke would abort a
    // pick in progress and leave tool.current in an inconsistent state.
    if (!globalState.cursor.clicked) {
      globalState.tool.current = tools[globalState.tool.selectedName]
      vectorGui.render()
      renderCursor()
      setToolCssCursor()
    }
  },
  ShiftLeft: () => {
    // No cursor.clicked guard at the top: Shift can be released mid-stroke
    // and must restore the tool immediately so free drawing resumes.
    globalState.tool.current = tools[globalState.tool.selectedName]
    tools.brush.options.line.active = false
    if (
      globalState.tool.current.name === 'brush' &&
      globalState.cursor.clicked
    ) {
      // Finalize the constrained line segment so the stroke does
      // not hang open when free drawing resumes.
      globalState.tool.current.fn()
    }
    globalState.vector.properties.forceCircle = false
    globalState.vector.properties.forceSquare = false
    if (globalState.tool.current.name === 'ellipse') {
      // collidedPoint covers drags where the handle was hovered but
      // never formally selected (selectedPoint.xKey would be empty).
      if (
        (vectorGui.selectedPoint.xKey || vectorGui.collidedPoint.xKey) &&
        vectorGui.selectedPoint.xKey !== 'px1' &&
        globalState.cursor.clicked
      ) {
        adjustVectorSteps()
        vectorGui.render()
      }
    } else if (globalState.tool.current.name === 'polygon') {
      if (
        (vectorGui.selectedPoint.xKey || vectorGui.collidedPoint.xKey) &&
        vectorGui.selectedPoint.xKey !== 'px0' &&
        globalState.cursor.clicked
      ) {
        adjustVectorSteps()
        vectorGui.render()
      }
    }
  },
  KeyK: () => {
    if (!globalState.cursor.clicked) swatches.paletteMode = 'select'
  },
  KeyX: () => {
    if (!globalState.cursor.clicked) swatches.paletteMode = 'select'
  },
}
releaseHandlers.AltRight = releaseHandlers.AltLeft
releaseHandlers.ShiftRight = releaseHandlers.ShiftLeft

/**
 * Dispatches a key code through a three-tier priority chain: (1) the
 * keyBindings registry for recordable discrete actions, gated by
 * cursor.clicked so actions never fire mid-stroke; (2) holdHandlers
 * for transient tool overrides that each manage their own guards;
 * (3) a switch for UI-only shortcuts that bypass the action log.
 * Kept separate from the keydown listener so the navigator and any
 * future programmatic caller can trigger shortcuts without synthesizing
 * a KeyboardEvent. Meta/Shift state is read from the keys map rather
 * than a live KeyboardEvent so both paths share the same detection.
 * @param {string} keyCode - The key code of the key that was pressed
 */
export function activateShortcut(keyCode) {
  // 1. Registry: discrete actions that produce a recorded action entry.
  // Specific combo (with shift) takes precedence; falls back to general
  // combo (without shift) so e.g. accidental Shift+B still triggers 'brush'.
  const meta = keys.MetaLeft || keys.MetaRight
  const shift = keys.ShiftLeft || keys.ShiftRight
  const specific = `${meta ? 'meta+' : ''}${shift ? 'shift+' : ''}${keyCode}`
  const general = `${meta ? 'meta+' : ''}${keyCode}`
  const action = keyBindings[specific] ?? keyBindings[general]
  if (action && !globalState.cursor.clicked) {
    actionHandlers[action]()
    return
  }

  // 2. Hold/release behaviours: transient tool overrides and palette modes.
  // Each holdHandler guards its own cursor.clicked check as needed.
  if (holdHandlers[keyCode]) {
    holdHandlers[keyCode]()
    return
  }

  // 3. Remaining UI-only shortcuts that don't need recording.
  switch (keyCode) {
    case 'MetaLeft':
    case 'MetaRight':
      break
    case 'KeyG':
      if (!globalState.cursor.clicked) {
        vectorGui.grid = !vectorGui.grid
        vectorGui.render()
      }
      break
    case 'KeyJ':
    case 'KeyN':
    case 'KeyU':
      break
    case 'KeyR':
      // meta+KeyR (rotate) handled by registry; only plain R reaches here.
      if (!globalState.cursor.clicked && !meta) {
        randomizeColor(swatches.primary.swatch)
      }
      break
    case 'KeyS':
      // plain S (select) handled by registry; only meta+S reaches here.
      if (!globalState.cursor.clicked && meta) {
        globalState.ui.saveDialogOpen = true
      }
      break
    case 'KeyT':
      if (!globalState.cursor.clicked && meta) {
        // Transform stub — will cut and paste the selection into a
        // free-transform layer when implemented.
      } else {
        globalState.ui.showTooltips = !globalState.ui.showTooltips
      }
      break
    default:
      break
  }
}

/**
 * Deactivates the shortcut associated with a key code. Called on both
 * keyUp and pointerUp because the pointer button can be released while
 * a modifier key is still physically held — without the pointerUp call,
 * releasing the mouse before the key would leave transient tool state
 * (e.g. grab, eyedropper) active indefinitely. Optional chaining means
 * keys without a release handler are silently ignored.
 * @param {string} keyCode - The key code of the key that was released
 */
export function deactivateShortcut(keyCode) {
  releaseHandlers[keyCode]?.()
}

/**
 * Applies the CSS cursor for the active tool to the vector GUI canvas.
 * Reads tool.current rather than tool.selectedName so hold-to-activate
 * tools (grab, eyedropper) get the right cursor while held. Eraser mode
 * forces 'none' because the eraser renders its own circular cursor on
 * the canvas rather than relying on a system cursor image.
 */
function setToolCssCursor() {
  if (globalState.tool.current.modes?.eraser) {
    canvas.vectorGuiCVS.style.cursor = 'none'
  } else {
    canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
  }
}
