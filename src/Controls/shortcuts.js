import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { vectorGui } from "../GUI/vector.js"
import { handleUndo, handleRedo } from "../Actions/undoRedo.js"
import { tools } from "../Tools/index.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderPaletteToolsToDOM,
  renderPaletteToDOM,
  renderBrushStampToDOM,
  renderToolOptionsToDOM,
  renderVectorsToDOM,
} from "../DOM/render.js"
import { randomizeColor } from "../Swatch/events.js"
import { renderCursor } from "../GUI/cursor.js"
import { openSaveDialogBox } from "../Menu/events.js"
import {
  actionDeselect,
  actionCutSelection,
  actionPasteSelection,
  actionConfirmPastedPixels,
  actionDeleteSelection,
  actionFlipPixels,
  actionRotatePixels,
} from "../Actions/nonPointerActions.js"
import { actionCopySelection } from "../Actions/untrackedActions.js"
import { toggleMode, switchTool } from "../Tools/toolbox.js"
import { adjustVectorSteps } from "../Tools/transform.js"

/**
 * Activate Shortcut for any key. Separating this from the keyDown event allows shortcuts to be triggered manually, such as by a tutorial
 * @param {string} keyCode - The key code of the key that was pressed
 */
export function activateShortcut(keyCode) {
  switch (keyCode) {
    case "Enter":
      //handle confirm paste
      if (!state.clicked && canvas.pastedLayer) {
        actionConfirmPastedPixels()
      }
      break
    case "Backspace":
      if (!state.clicked) {
        actionDeleteSelection()
      }
      break
    case "MetaLeft":
    case "MetaRight":
      //command key
      break
    case "Space":
      if (!state.clicked) {
        state.tool = tools["grab"]
        canvas.vectorGuiCVS.style.cursor = state.tool.cursor
        renderBrushStampToDOM()
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
        renderCursor()
      }
      break
    case "AltLeft":
    case "AltRight":
      //option key
      if (!state.clicked) {
        state.tool = tools["eyedropper"]
        canvas.vectorGuiCVS.style.cursor = state.tool.cursor
        renderBrushStampToDOM()
        renderCanvas(canvas.currentLayer)
        vectorGui.render()
        renderCursor()
      }
      break
    case "ShiftLeft":
    case "ShiftRight":
      if (dom.toolBtn.id === "brush") {
        tools.brush.options.line.active = true
        state.lineStartX = state.cursorX
        state.lineStartY = state.cursorY
      } else if (dom.toolBtn.id === "ellipse") {
        state.vectorProperties.forceCircle = true
        if (
          vectorGui.selectedPoint.xKey &&
          state.clickCounter === 0 &&
          vectorGui.selectedPoint.xKey !== "px1"
        ) {
          //while holding control point, readjust ellipse without having to move cursor.
          adjustVectorSteps()
          vectorGui.render()
        }
      }
      break
    case "Equal":
      if (dom.toolBtn.id === "cubicCurve") {
        tools.cubicCurve.options.equal.active =
          !tools.cubicCurve.options.equal.active
        renderToolOptionsToDOM()
        vectorGui.render()
      }
      break
    case "Slash":
      if (!state.clicked) {
        switchTool("line")
        renderVectorsToDOM()
      }
      break
    case "KeyA":
      if (dom.toolBtn.id === "cubicCurve") {
        tools.cubicCurve.options.align.active =
          !tools.cubicCurve.options.align.active
        renderToolOptionsToDOM()
        vectorGui.render()
      }
      break
    case "KeyB":
      if (!state.clicked) {
        switchTool("brush")
        renderVectorsToDOM()
      }
      break
    case "KeyC":
      if (!state.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          actionCopySelection()
        } else {
          switchTool("cubicCurve")
          renderVectorsToDOM()
        }
      }
      break
    case "KeyD":
      if (!state.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          //deselect
          actionDeselect()
        }
      }
      break
    case "KeyE":
      if (!state.clicked) {
        toggleMode("eraser")
      }
      break
    case "KeyF":
      if (!state.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          if (keys.ShiftLeft || keys.ShiftRight) {
            //option+meta+z
            //Flip vertical
            actionFlipPixels(false)
          } else {
            //Flip horizontal
            actionFlipPixels(true)
          }
        } else {
          switchTool("fill")
          renderVectorsToDOM()
        }
      }
      break
    case "KeyG":
      if (!state.clicked) {
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
    case "KeyH":
      //Locking shortcut for curve tool
      if (dom.toolBtn.id === "cubicCurve") {
        tools.cubicCurve.options.hold.active =
          !tools.cubicCurve.options.hold.active
        renderToolOptionsToDOM()
      }
      break
    case "KeyI":
      if (!state.clicked) {
        toggleMode("inject")
      }
      break
    case "KeyJ":
      //
      break
    case "KeyK":
      if (!state.clicked) {
        swatches.paletteMode = "edit"
        renderPaletteToolsToDOM()
        renderPaletteToDOM()
      }
      break
    case "KeyL":
      if (dom.toolBtn.id === "cubicCurve") {
        tools.cubicCurve.options.link.active =
          !tools.cubicCurve.options.link.active
        renderToolOptionsToDOM()
        vectorGui.render()
      }
      break
    case "KeyM":
      if (!state.clicked) {
        toggleMode("colorMask")
      }
      break
    case "KeyN":
      //
      break
    case "KeyO":
      if (!state.clicked) {
        switchTool("ellipse")
        renderVectorsToDOM()
      }
      break
    case "KeyP":
      if (!state.clicked) {
        toggleMode("perfect")
      }
      break
    case "KeyQ":
      if (!state.clicked) {
        switchTool("quadCurve")
        renderVectorsToDOM()
      }
      break
    case "KeyR":
      if (!state.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          //Rotate right
          actionRotatePixels()
        } else {
          randomizeColor(swatches.primary.swatch)
          renderPaletteToDOM()
        }
      }
      break
    case "KeyS":
      if (!state.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          openSaveDialogBox()
        } else {
          switchTool("select")
          renderVectorsToDOM()
        }
      }
      break
    case "KeyT":
      if (!state.clicked && (keys.MetaLeft || keys.MetaRight)) {
        //shortcut for transform - cuts and pastes selection to allow free transform
      } else {
        dom.tooltipBtn.checked = !dom.tooltipBtn.checked
        if (dom.tooltipBtn.checked && state.tooltipMessage) {
          dom.tooltip.classList.add("visible")
        } else {
          dom.tooltip.classList.remove("visible")
        }
      }
      break
    case "KeyU":
      //
      break
    case "KeyV":
      if (!state.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          //Will not do anything if already in the midst of a paste action (meaning the canvas.currentLayer is the canvas.tempLayer)
          actionPasteSelection()
        }
      }
      break
    case "KeyW":
      //
      break
    case "KeyX":
      if (!state.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          actionCutSelection()
        } else {
          swatches.paletteMode = "remove"
          renderPaletteToolsToDOM()
          renderPaletteToDOM()
        }
      }
      break
    case "KeyY":
      //
      break
    case "KeyZ":
      if (!state.clicked) {
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
    case "MetaLeft":
    case "MetaRight":
      //command key
      break
    case "Space":
      //only deactivate while not clicked
      if (!state.clicked) {
        state.tool = tools[dom.toolBtn.id]
        renderBrushStampToDOM()
        canvas.previousXOffset = canvas.xOffset
        canvas.previousYOffset = canvas.yOffset
        vectorGui.render()
        renderCursor()
        setToolCssCursor()
        //TODO: (Low Priority) refactor so grabSteps can be called instead with a manually supplied pointer event pointerup
      }
      break
    case "AltLeft":
    case "AltRight":
      //option key
      //only deactivate while not clicked
      if (!state.clicked) {
        state.tool = tools[dom.toolBtn.id]
        renderBrushStampToDOM()
        vectorGui.render()
        renderCursor()
        setToolCssCursor()
      }
      break
    case "ShiftLeft":
    case "ShiftRight":
      state.tool = tools[dom.toolBtn.id]
      tools.brush.options.line.active = false
      if (state.tool.name === "brush" && state.clicked) {
        state.tool.fn()
      }
      state.vectorProperties.forceCircle = false
      if (state.tool.name === "ellipse") {
        if (
          (vectorGui.selectedPoint.xKey || vectorGui.collidedPoint.xKey) &&
          vectorGui.selectedPoint.xKey !== "px1" &&
          state.clicked
        ) {
          //while holding control point, readjust ellipse without having to move cursor.
          //TODO: (Medium Priority) update this functionality to have other radii go back to previous radius value when releasing shift
          adjustVectorSteps()
          vectorGui.render()
        }
      }
      break
    case "KeyA":
      //
      break
    case "KeyB":
      //
      break
    case "KeyC":
      //
      break
    case "KeyD":
      //
      break
    case "KeyE":
      //
      break
    case "KeyF":
      //
      break
    case "KeyG":
      //
      break
    case "KeyH":
      //
      break
    case "KeyI":
      //
      break
    case "KeyJ":
      //
      break
    case "KeyK":
      if (!state.clicked) {
        swatches.paletteMode = "select"
        renderPaletteToolsToDOM()
        renderPaletteToDOM()
      }
      break
    case "KeyL":
      //
      break
    case "KeyM":
      //
      break
    case "KeyN":
      //
      break
    case "KeyO":
      //
      break
    case "KeyP":
      //
      break
    case "KeyQ":
      //
      break
    case "KeyR":
      //
      break
    case "KeyS":
      //
      break
    case "KeyT":
      //
      break
    case "KeyU":
      //
      break
    case "KeyV":
      //
      break
    case "KeyW":
      //
      break
    case "KeyX":
      if (!state.clicked) {
        swatches.paletteMode = "select"
        renderPaletteToolsToDOM()
        renderPaletteToDOM()
      }
      break
    case "KeyY":
      //
      break
    case "KeyZ":
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
  if (state.tool.modes?.eraser) {
    canvas.vectorGuiCVS.style.cursor = "none"
  } else {
    canvas.vectorGuiCVS.style.cursor = state.tool.cursor
  }
}
