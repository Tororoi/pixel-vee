import { dom } from '../Context/dom.js'
import { keys } from '../Shortcuts/keys.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { vectorGui } from '../GUI/vector.js'
import { handleUndo, handleRedo } from '../Actions/undoRedo/undoRedo.js'
import { tools } from '../Tools/index.js'
import { renderCanvas } from '../Canvas/render.js'
import {
  renderPaletteToolsToDOM,
  renderPaletteToDOM,
  renderBrushStampToDOM,
  renderToolOptionsToDOM,
  renderVectorsToDOM,
} from '../DOM/render.js'
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
 * Activate Shortcut for any key. Separating this from the keyDown event allows shortcuts to be triggered manually, such as by a tutorial
 * @param {string} keyCode - The key code of the key that was pressed
 */
export function activateShortcut(keyCode) {
  switch (keyCode) {
    case 'Enter':
      //handle confirm paste
      if (!state.cursor.clicked && canvas.pastedLayer) {
        actionConfirmPastedPixels()
      }
      break
    case 'Backspace':
      if (!state.cursor.clicked) {
        actionDeleteSelection()
      }
      break
    case 'MetaLeft':
    case 'MetaRight':
      //command key
      break
    case 'Space':
      if (!state.cursor.clicked) {
        state.tool.current = tools['grab']
        canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
        renderBrushStampToDOM()
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
        renderCursor()
      }
      break
    case 'AltLeft':
    case 'AltRight':
      //option key
      //magicWand uses Alt as a subtract-from-selection modifier, not for eyedropper
      if (!state.cursor.clicked && dom.toolBtn.id !== 'magicWand') {
        state.tool.current = tools['eyedropper']
        canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
        renderBrushStampToDOM()
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
        renderCursor()
      }
      break
    case 'ShiftLeft':
    case 'ShiftRight':
      if (dom.toolBtn.id === 'brush') {
        tools.brush.options.line.active = true
        state.tool.lineStartX = state.cursor.x
        state.tool.lineStartY = state.cursor.y
      } else if (dom.toolBtn.id === 'ellipse') {
        state.vector.properties.forceCircle = true
        if (
          vectorGui.selectedPoint.xKey &&
          state.tool.clickCounter === 0 &&
          vectorGui.selectedPoint.xKey !== 'px1'
        ) {
          //while holding control point, readjust ellipse without having to move cursor.
          adjustVectorSteps()
          vectorGui.render()
        }
      } else if (dom.toolBtn.id === 'polygon') {
        state.vector.properties.forceSquare = true
        if (
          vectorGui.selectedPoint.xKey &&
          state.tool.clickCounter === 0 &&
          vectorGui.selectedPoint.xKey !== 'px0'
        ) {
          //while holding control point, readjust polygon without having to move cursor.
          adjustVectorSteps()
          vectorGui.render()
        }
      }
      break
    case 'Digit7':
      if (dom.toolBtn.id === 'vector') {
        state.tool.current.options.chain.active =
          !state.tool.current.options.chain.active
        renderToolOptionsToDOM()
        vectorGui.render()
      }
      break
    case 'Equal':
      if (dom.toolBtn.id === 'vector' && !state.tool.current.modes?.line) {
        state.tool.current.options.equal.active =
          !state.tool.current.options.equal.active
        renderToolOptionsToDOM()
        vectorGui.render()
      }
      break
    case 'Slash':
      if (!state.cursor.clicked) {
        switchTool('vector')
        toggleMode('line')
        renderVectorsToDOM()
      }
      break
    case 'KeyA':
      if (dom.toolBtn.id === 'vector' && !state.tool.current.modes?.line) {
        state.tool.current.options.align.active =
          !state.tool.current.options.align.active
        renderToolOptionsToDOM()
        vectorGui.render()
      }
      break
    case 'KeyB':
      if (!state.cursor.clicked) {
        switchTool('brush')
        renderVectorsToDOM()
      }
      break
    case 'KeyC':
      if (!state.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          actionCopySelection()
        } else {
          switchTool('vector')
          toggleMode('cubicCurve')
          renderVectorsToDOM()
        }
      }
      break
    case 'KeyD':
      if (!state.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          //deselect
          actionDeselect()
        }
      }
      break
    case 'KeyE':
      if (!state.cursor.clicked) {
        toggleMode('eraser')
      }
      break
    case 'KeyF':
      if (!state.cursor.clicked) {
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
          renderVectorsToDOM()
        }
      }
      break
    case 'KeyG':
      if (!state.cursor.clicked) {
        //Toggle grid
        if (vectorGui.grid) {
          dom.gridBtn.checked = false
          vectorGui.grid = false
        } else {
          dom.gridBtn.checked = true
          vectorGui.grid = true
        }
        vectorGui.render()
      }
      break
    case 'KeyH':
      //Locking shortcut for vector tool
      if (dom.toolBtn.id === 'vector') {
        state.tool.current.options.hold.active =
          !state.tool.current.options.hold.active
        renderToolOptionsToDOM()
      }
      break
    case 'KeyI':
      if (!state.cursor.clicked) {
        toggleMode('inject')
      }
      break
    case 'KeyJ':
      //
      break
    case 'KeyK':
      if (!state.cursor.clicked) {
        swatches.paletteMode = 'edit'
        renderPaletteToolsToDOM()
        renderPaletteToDOM()
      }
      break
    case 'KeyL':
      if (dom.toolBtn.id === 'vector') {
        state.tool.current.options.link.active =
          !state.tool.current.options.link.active
        renderToolOptionsToDOM()
        vectorGui.render()
      }
      break
    case 'KeyM':
      if (!state.cursor.clicked) {
        toggleMode('colorMask')
      }
      break
    case 'KeyN':
      //
      break
    case 'KeyO':
      if (!state.cursor.clicked) {
        switchTool('ellipse')
        renderVectorsToDOM()
      }
      break
    case 'KeyP':
      if (!state.cursor.clicked) {
        switchTool('polygon')
        renderVectorsToDOM()
      }
      break
    case 'KeyQ':
      if (!state.cursor.clicked) {
        switchTool('vector')
        toggleMode('quadCurve')
        renderVectorsToDOM()
      }
      break
    case 'KeyR':
      if (!state.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          //Rotate right
          actionRotatePixels()
        } else {
          randomizeColor(swatches.primary.swatch)
          renderPaletteToDOM()
        }
      }
      break
    case 'KeyS':
      if (!state.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          openSaveDialogBox()
        } else {
          switchTool('select')
          renderVectorsToDOM()
        }
      }
      break
    case 'KeyT':
      if (!state.cursor.clicked && (keys.MetaLeft || keys.MetaRight)) {
        //shortcut for transform - cuts and pastes selection to allow free transform
      } else {
        dom.tooltipBtn.checked = !dom.tooltipBtn.checked
        if (dom.tooltipBtn.checked && state.ui.tooltipMessage) {
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
      if (!state.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          //Will not do anything if already in the midst of a paste action (meaning the canvas.currentLayer is the canvas.tempLayer)
          actionPasteSelection()
        }
      }
      break
    case 'KeyW':
      if (!state.cursor.clicked) {
        switchTool('magicWand')
        renderVectorsToDOM()
      }
      break
    case 'KeyX':
      if (!state.cursor.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          actionCutSelection()
        } else {
          swatches.paletteMode = 'remove'
          renderPaletteToolsToDOM()
          renderPaletteToDOM()
        }
      }
      break
    case 'KeyY':
      if (!state.cursor.clicked) {
        toggleMode('perfect')
      }
      break
    case 'KeyZ':
      if (!state.cursor.clicked) {
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
 * Deactivate Shortcut for any key.
 * Some shortcuts are active while a key is held.
 * This can be called on keyUp or on pointerUp so it is not directly tied to the keyUp event.
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
      if (!state.cursor.clicked) {
        state.tool.current = tools[dom.toolBtn.id]
        renderBrushStampToDOM()
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
      if (!state.cursor.clicked) {
        state.tool.current = tools[dom.toolBtn.id]
        renderBrushStampToDOM()
        vectorGui.render()
        renderCursor()
        setToolCssCursor()
      }
      break
    case 'ShiftLeft':
    case 'ShiftRight':
      state.tool.current = tools[dom.toolBtn.id]
      tools.brush.options.line.active = false
      if (state.tool.current.name === 'brush' && state.cursor.clicked) {
        state.tool.current.fn()
      }
      state.vector.properties.forceCircle = false
      state.vector.properties.forceSquare = false
      if (state.tool.current.name === 'ellipse') {
        if (
          (vectorGui.selectedPoint.xKey || vectorGui.collidedPoint.xKey) &&
          vectorGui.selectedPoint.xKey !== 'px1' &&
          state.cursor.clicked
        ) {
          //while holding control point, readjust ellipse without having to move cursor.
          //TODO: (Medium Priority) update this functionality to have other radii go back to previous radius value when releasing shift
          adjustVectorSteps()
          vectorGui.render()
        }
      } else if (state.tool.current.name === 'polygon') {
        if (
          (vectorGui.selectedPoint.xKey || vectorGui.collidedPoint.xKey) &&
          vectorGui.selectedPoint.xKey !== 'px0' &&
          state.cursor.clicked
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
      if (!state.cursor.clicked) {
        swatches.paletteMode = 'select'
        renderPaletteToolsToDOM()
        renderPaletteToDOM()
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
      if (!state.cursor.clicked) {
        swatches.paletteMode = 'select'
        renderPaletteToolsToDOM()
        renderPaletteToDOM()
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
 * Set tool cursor. TODO: (Low Priority) move to utils file
 */
function setToolCssCursor() {
  if (state.tool.current.modes?.eraser) {
    canvas.vectorGuiCVS.style.cursor = 'none'
  } else {
    canvas.vectorGuiCVS.style.cursor = state.tool.current.cursor
  }
}
