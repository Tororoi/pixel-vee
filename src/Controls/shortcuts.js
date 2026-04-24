import { dom } from '../Context/dom.js'
import { keys } from '../Shortcuts/keys.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { vectorGui } from '../GUI/vector.js'
import { handleUndo, handleRedo } from '../Actions/undoRedo/undoRedo.js'
import { tools } from '../Tools/index.js'
import { renderCanvas } from '../Canvas/render.js'

import { randomizeColor } from '../Swatch/events.js'
import { renderCursor } from '../GUI/cursor.js'
import { openSaveDialogBox } from '../Menu/events.js'
import {
  actionDeselect,
  actionDeleteSelection,
} from '../Actions/nonPointer/selectionActions.js'
import {
  actionCutSelection,
  actionPasteSelection,
  actionConfirmPastedPixels,
  actionCopySelection,
} from '../Actions/nonPointer/clipboardActions.js'
import {
  actionFlipPixels,
  actionRotatePixels,
} from '../Actions/transform/rasterTransform.js'
import { toggleMode, switchTool } from '../Tools/toolbox.js'
import { adjustVectorSteps } from '../Tools/adjust.js'

/**
 * Dispatches a key code to the appropriate shortcut action. Kept
 * separate from the keydown handler so shortcuts can be triggered
 * programmatically — e.g., from a tutorial sequence — without
 * synthesizing a KeyboardEvent. Most cases guard on
 * !globalState.cursor.clicked to prevent tool switches from
 * interrupting an in-progress stroke. Hold-to-activate tools
 * (Space→grab, Alt→eyedropper) override globalState.tool.current
 * without changing globalState.tool.selectedName so deactivation
 * can restore the prior tool. Cmd-key combinations are detected
 * via the keys map rather than e.metaKey so the same logic works
 * for both native events and programmatic calls.
 * @param {string} keyCode - The key code of the key that was pressed
 */
export function activateShortcut(keyCode) {
  switch (keyCode) {
    case 'Enter':
      //handle confirm paste
      if (!globalState.cursor.clicked && canvas.pastedLayer) {
        actionConfirmPastedPixels()
      }
      break
    case 'Backspace':
      if (!globalState.cursor.clicked) {
        actionDeleteSelection()
      }
      break
    case 'MetaLeft':
    case 'MetaRight':
      //command key
      break
    case 'Space':
      if (!globalState.cursor.clicked) {
        globalState.tool.current = tools['grab']
        canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
        renderCursor()
      }
      break
    case 'AltLeft':
    case 'AltRight':
      //option key
      //magicWand uses Alt as a subtract-from-selection modifier, not for eyedropper
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
      break
    case 'ShiftLeft':
    case 'ShiftRight':
      if (globalState.tool.selectedName === 'brush') {
        tools.brush.options.line.active = true
        globalState.tool.lineStartX = globalState.cursor.x
        globalState.tool.lineStartY = globalState.cursor.y
      } else if (globalState.tool.selectedName === 'ellipse') {
        globalState.vector.properties.forceCircle = true
        if (
          vectorGui.selectedPoint.xKey &&
          globalState.tool.clickCounter === 0 &&
          vectorGui.selectedPoint.xKey !== 'px1'
        ) {
          //while holding control point, readjust ellipse without having to move cursor.
          adjustVectorSteps()
          vectorGui.render()
        }
      } else if (globalState.tool.selectedName === 'polygon') {
        globalState.vector.properties.forceSquare = true
        if (
          vectorGui.selectedPoint.xKey &&
          globalState.tool.clickCounter === 0 &&
          vectorGui.selectedPoint.xKey !== 'px0'
        ) {
          //while holding control point, readjust polygon without having to move cursor.
          adjustVectorSteps()
          vectorGui.render()
        }
      }
      break
    case 'Digit7':
      if (globalState.tool.selectedName === 'curve') {
        globalState.tool.current.options.chain.active =
          !globalState.tool.current.options.chain.active
        // Mirror to tools.curve so the canonical store stays in sync
        // in case current gets reassigned to a transient tool later.
        tools.curve.options.chain.active =
          globalState.tool.current.options.chain.active

        vectorGui.render()
      }
      break
    case 'Equal':
      if (globalState.tool.selectedName === 'curve') {
        globalState.tool.current.options.equal.active =
          !globalState.tool.current.options.equal.active
        tools.curve.options.equal.active =
          globalState.tool.current.options.equal.active

        vectorGui.render()
      }
      break
    case 'Slash':
      if (!globalState.cursor.clicked) {
        switchTool('curve')
        toggleMode('line')
      }
      break
    case 'KeyA':
      if (globalState.tool.selectedName === 'curve') {
        globalState.tool.current.options.align.active =
          !globalState.tool.current.options.align.active
        tools.curve.options.align.active =
          globalState.tool.current.options.align.active

        vectorGui.render()
      }
      break
    case 'KeyB':
      if (!globalState.cursor.clicked) {
        switchTool('brush')
      }
      break
    case 'KeyC':
      if (!globalState.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          actionCopySelection()
        } else {
          switchTool('curve')
          toggleMode('cubicCurve')
        }
      }
      break
    case 'KeyD':
      if (!globalState.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          //deselect
          actionDeselect()
        }
      }
      break
    case 'KeyE':
      if (!globalState.cursor.clicked) {
        toggleMode('eraser')
      }
      break
    case 'KeyF':
      if (!globalState.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          if (keys.ShiftLeft || keys.ShiftRight) {
            //meta+shift+f
            //Flip vertical
            actionFlipPixels(false)
          } else {
            //meta+f
            //Flip horizontal
            actionFlipPixels(true)
          }
        } else {
          switchTool('fill')
        }
      }
      break
    case 'KeyG':
      if (!globalState.cursor.clicked) {
        //Toggle grid
        vectorGui.grid = !vectorGui.grid
        vectorGui.render()
      }
      break
    case 'KeyH':
      //Locking shortcut for curve tool
      if (globalState.tool.selectedName === 'curve') {
        globalState.tool.current.options.hold.active =
          !globalState.tool.current.options.hold.active
        tools.curve.options.hold.active =
          globalState.tool.current.options.hold.active
      }
      break
    case 'KeyI':
      if (!globalState.cursor.clicked) {
        toggleMode('inject')
      }
      break
    case 'KeyJ':
      //
      break
    case 'KeyK':
      if (!globalState.cursor.clicked) {
        swatches.paletteMode = 'edit'
      }
      break
    case 'KeyL':
      if (globalState.tool.selectedName === 'curve') {
        globalState.tool.current.options.link.active =
          !globalState.tool.current.options.link.active
        tools.curve.options.link.active =
          globalState.tool.current.options.link.active

        vectorGui.render()
      }
      break
    case 'KeyM':
      if (!globalState.cursor.clicked) {
        toggleMode('colorMask')
      }
      break
    case 'KeyN':
      //
      break
    case 'KeyO':
      if (!globalState.cursor.clicked) {
        switchTool('ellipse')
      }
      break
    case 'KeyP':
      if (!globalState.cursor.clicked) {
        switchTool('polygon')
      }
      break
    case 'KeyQ':
      if (!globalState.cursor.clicked) {
        switchTool('curve')
        toggleMode('quadCurve')
      }
      break
    case 'KeyR':
      if (!globalState.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          //Rotate right
          actionRotatePixels()
        } else {
          randomizeColor(swatches.primary.swatch)
        }
      }
      break
    case 'KeyS':
      if (!globalState.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          openSaveDialogBox()
        } else {
          switchTool('select')
        }
      }
      break
    case 'KeyT':
      if (!globalState.cursor.clicked && (keys.MetaLeft || keys.MetaRight)) {
        //shortcut for transform - cuts and pastes selection to allow free transform
      } else {
        globalState.ui.showTooltips = !globalState.ui.showTooltips
        if (globalState.ui.showTooltips && globalState.ui.tooltipMessage) {
          dom.tooltip.classList.add('visible')
        } else {
          dom.tooltip.classList.remove('visible')
        }
      }
      break
    case 'KeyU':
      //
      break
    case 'KeyV':
      if (!globalState.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          //Will not do anything if already in the midst of a paste action (meaning the canvas.currentLayer is the canvas.tempLayer)
          actionPasteSelection()
        } else {
          switchTool('curve')
        }
      }
      break
    case 'KeyW':
      if (!globalState.cursor.clicked) {
        switchTool('magicWand')
      }
      break
    case 'KeyX':
      if (!globalState.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          actionCutSelection()
        } else {
          swatches.paletteMode = 'remove'
        }
      }
      break
    case 'KeyY':
      if (!globalState.cursor.clicked) {
        toggleMode('perfect')
      }
      break
    case 'KeyZ':
      if (!globalState.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          if (keys.ShiftLeft || keys.ShiftRight) {
            //shift+meta+z
            handleRedo()
          } else {
            handleUndo()
          }
        }
      }
      break
    default:
    //do nothing
  }
}

/**
 * Deactivates the shortcut associated with a key code. Called on
 * both keyUp and pointerUp, because the mouse button can be
 * released while a modifier key is still physically held — the
 * pointerUp handler must retire transient tools independently of
 * any key event. Hold-to-activate tools (Space→grab,
 * Alt→eyedropper) restore globalState.tool.current to the
 * selected tool and apply side effects: Space commits the new pan
 * offset into previousXOffset so the next stroke uses the updated
 * origin; Shift clears line mode and constrained geometry, and
 * fires the brush fn() mid-stroke to finalize the constrained
 * line segment before free drawing resumes. KeyK and KeyX use a
 * momentary hold pattern for palette modes — each restores
 * paletteMode to 'select' on release.
 * @param {string} keyCode - The key code of the key that was released
 */
export function deactivateShortcut(keyCode) {
  switch (keyCode) {
    case 'MetaLeft':
    case 'MetaRight':
      //command key
      break
    case 'Space':
      //only deactivate while not clicked
      if (!globalState.cursor.clicked) {
        globalState.tool.current = tools[globalState.tool.selectedName]
        // Commit the pan so the next stroke's coordinate math
        // uses the updated origin rather than the pre-grab origin.
        canvas.previousXOffset = canvas.xOffset
        canvas.previousYOffset = canvas.yOffset
        vectorGui.render()
        renderCursor()
        setToolCssCursor()
        //TODO: (Low Priority) refactor so grabSteps can be called instead with a manually supplied pointer event pointerup
      }
      break
    case 'AltLeft':
    case 'AltRight':
      //option key
      //only deactivate while not clicked
      if (!globalState.cursor.clicked) {
        globalState.tool.current = tools[globalState.tool.selectedName]
        vectorGui.render()
        renderCursor()
        setToolCssCursor()
      }
      break
    case 'ShiftLeft':
    case 'ShiftRight':
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
        if (
          (vectorGui.selectedPoint.xKey || vectorGui.collidedPoint.xKey) &&
          vectorGui.selectedPoint.xKey !== 'px1' &&
          globalState.cursor.clicked
        ) {
          //while holding control point, readjust ellipse without having to move cursor.
          //TODO: (Medium Priority) update this functionality to have other radii go back to previous radius value when releasing shift
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
      break
    case 'KeyA':
      //
      break
    case 'KeyB':
      //
      break
    case 'KeyC':
      //
      break
    case 'KeyD':
      //
      break
    case 'KeyE':
      //
      break
    case 'KeyF':
      //
      break
    case 'KeyG':
      //
      break
    case 'KeyH':
      //
      break
    case 'KeyI':
      //
      break
    case 'KeyJ':
      //
      break
    case 'KeyK':
      if (!globalState.cursor.clicked) {
        swatches.paletteMode = 'select'
      }
      break
    case 'KeyL':
      //
      break
    case 'KeyM':
      //
      break
    case 'KeyN':
      //
      break
    case 'KeyO':
      //
      break
    case 'KeyP':
      //
      break
    case 'KeyQ':
      //
      break
    case 'KeyR':
      //
      break
    case 'KeyS':
      //
      break
    case 'KeyT':
      //
      break
    case 'KeyU':
      //
      break
    case 'KeyV':
      //
      break
    case 'KeyW':
      //
      break
    case 'KeyX':
      if (!globalState.cursor.clicked) {
        swatches.paletteMode = 'select'
      }
      break
    case 'KeyY':
      //
      break
    case 'KeyZ':
      //
      break
    default:
    //do nothing
  }
}

/**
 * Applies the correct CSS cursor for the current tool to the
 * vector GUI canvas. Eraser mode sets the cursor to 'none' because
 * the eraser renders its own circular overlay on the canvas;
 * leaving the OS cursor visible would create a confusing double-
 * cursor. All other tools use the CSS cursor string defined on
 * the tool object.
 * TODO: (Low Priority) move to utils file
 */
function setToolCssCursor() {
  if (globalState.tool.current.modes?.eraser) {
    canvas.vectorGuiCVS.style.cursor = 'none'
  } else {
    canvas.vectorGuiCVS.style.cursor = globalState.tool.current.cursor
  }
}
