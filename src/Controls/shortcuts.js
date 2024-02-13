import { dom } from "../Context/dom.js"
import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { vectorGui } from "../GUI/vector.js"
import { handleUndo, handleRedo } from "../Actions/undoRedo.js"
import { tools } from "../Tools/index.js"
import { adjustEllipseSteps } from "../Tools/ellipse.js"
import { renderCanvas } from "../Canvas/render.js"
import {
  renderPaletteToolsToDOM,
  renderPaletteToDOM,
  renderBrushStampToDOM,
  renderToolOptionsToDOM,
} from "../DOM/render.js"
import { randomizeColor } from "../Swatch/events.js"
import { handleModes } from "../Tools/events.js"
import { renderCursor } from "../GUI/cursor.js"
import { coordArrayFromSet } from "../utils/maskHelpers.js"
import { openSaveDialogBox } from "../Menu/events.js"
import {
  actionDeselect,
  actionInvertSelection,
  actionCutSelection,
  actionPasteSelection,
  actionConfirmPastedPixels,
} from "../Actions/nonPointerActions.js"
import { actionCopySelection } from "../Actions/untrackedActions.js"
import { toggleMode, switchTool } from "../Tools/toolbox.js"

/**
 * Activate Shortcut for any key. Separating this from the keyDown event allows shortcuts to be triggered manually, such as by a tutorial
 * TODO: (High Priority) prevent certain shortcuts when certain actions are active such as pasting, dragging, etc. - tools (done), cut, copy, paste,
 * TODO: (High Priority) prevent certain shortcuts when not available during selection: cut, copy, paste,
 * @param {string} keyCode
 */
export function activateShortcut(keyCode) {
  switch (keyCode) {
    case "Enter":
      //handle confirm paste
      if (!state.clicked && canvas.pastedLayer) {
        actionConfirmPastedPixels()
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
        renderCursor(state, canvas, swatches)
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
        renderCursor(state, canvas, swatches)
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
          adjustEllipseSteps()
          vectorGui.render()
        }
      } else if (dom.toolBtn.id === "cubicCurve") {
        tools.cubicCurve.options.equal.active =
          !tools.cubicCurve.options.equal.active
        renderToolOptionsToDOM()
        vectorGui.render()
      }
      break
    case "Slash":
      if (!state.clicked) {
        switchTool("line")
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
      }
      break
    case "KeyC":
      if (!state.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          actionCopySelection()
        } else {
          switchTool("cubicCurve")
        }
      }
      break
    case "KeyD":
      if (!state.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          //deselect
          if (state.selectProperties.px1 !== null) {
            actionDeselect()
          }
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
        switchTool("fill")
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
        if (keys.MetaLeft || keys.MetaRight) {
          actionInvertSelection()
        } else {
          toggleMode("inject")
        }
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
      }
      break
    case "KeyR":
      if (!state.clicked) {
        randomizeColor(swatches.primary.swatch)
        renderPaletteToDOM()
      }
      break
    case "KeyS":
      if (!state.clicked) {
        if (keys.MetaLeft || keys.MetaRight) {
          openSaveDialogBox()
        } else {
          switchTool("select")
        }
      }
      break
    case "KeyT":
      //
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
 * @param {string} keyCode
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
        renderCursor(state, canvas, swatches)
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
        renderCursor(state, canvas, swatches)
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
          (vectorGui.selectedPoint.xKey || vectorGui.collidedKeys.xKey) &&
          vectorGui.selectedPoint.xKey !== "px1"
        ) {
          //while holding control point, readjust ellipse without having to move cursor.
          //TODO: (Middle Priority) update this functionality to have other radii go back to previous radius value when releasing shift
          adjustEllipseSteps()
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
 * Set tool cursor. TODO: (Middle Priority) move to utils file
 */
function setToolCssCursor() {
  if (state.tool.modes?.eraser) {
    canvas.vectorGuiCVS.style.cursor = "none"
  } else {
    canvas.vectorGuiCVS.style.cursor = state.tool.cursor
  }
}
