import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"

/**
 * disable actions when paste is active
 */
export function disableActionsForPaste() {
  //disable clear button. TODO: When toolbox has a dom render function like layers and vectors, this should be moved there
  dom.clearBtn.disabled = true
  //disable menu buttons that can't work with a temporary layer active - cut, copy, paste, deselect, select all, resize canvas
  //file menu
  dom.importBtn.parentElement.classList.add("disabled")
  dom.importBtn.disabled = true
  //edit menu
  dom.canvasSizeBtn.classList.add("disabled")
  dom.selectAllBtn.classList.add("disabled")
  dom.deselectBtn.classList.add("disabled")
  dom.cutBtn.classList.add("disabled")
  dom.copyBtn.classList.add("disabled")
  dom.pasteBtn.classList.add("disabled")
  dom.deleteBtn.classList.add("disabled")
  //enable transform menu
  dom.flipHorizontalBtn.classList.remove("disabled")
  dom.flipVerticalBtn.classList.remove("disabled")
  dom.rotateBtn.classList.remove("disabled")
}

/**
 * Enable actions when no paste is active
 */
export function enableActionsForNoPaste() {
  //enable clear button. TODO: When toolbox has a dom render function like layers and vectors, this should be moved there
  dom.clearBtn.disabled = false
  //enable menu buttons that can't work with a temporary layer active - cut, copy, paste, deselect, select all, resize canvas
  //file menu
  dom.importBtn.parentElement.classList.remove("disabled")
  dom.importBtn.disabled = false
  //edit menu
  dom.canvasSizeBtn.classList.remove("disabled")
  dom.selectAllBtn.classList.remove("disabled")
  dom.deselectBtn.classList.remove("disabled")
  dom.cutBtn.classList.remove("disabled")
  dom.copyBtn.classList.remove("disabled")
  if (
    state.selectClipboard.canvas ||
    Object.keys(state.selectClipboard.vectors).length > 0
  ) {
    dom.pasteBtn.classList.remove("disabled")
  }
  dom.deleteBtn.classList.remove("disabled")
  //disable transform menu
  dom.flipHorizontalBtn.classList.add("disabled")
  dom.flipVerticalBtn.classList.add("disabled")
  dom.rotateBtn.classList.add("disabled")
}

/**
 * Disable actions when no selection is active
 * TODO: (High Priority) Consider a selected vectors as a selection being present
 */
export function disableActionsForNoSelection() {
  //disable menu buttons that can't work without a selection
  dom.cutBtn.classList.add("disabled")
  dom.copyBtn.classList.add("disabled")
  dom.deselectBtn.classList.add("disabled")
}

/**
 * Enable actions when a selection is active
 */
export function enableActionsForSelection() {
  if (canvas.pastedLayer) {
    //if there is a pasted layer active, do not enable cut, copy, paste, deselect
    return
  }
  //enable menu buttons that can't work without a selection
  dom.cutBtn.classList.remove("disabled")
  dom.copyBtn.classList.remove("disabled")
  dom.deselectBtn.classList.remove("disabled")
}

/**
 * Disable actions when no clipboard is active
 */
export function disableActionsForNoClipboard() {
  //disable menu buttons that can't work without a clipboard
  dom.pasteBtn.classList.add("disabled")
}

/**
 * Enable actions when a clipboard is active
 */
export function enableActionsForClipboard() {
  if (canvas.pastedLayer) {
    //if there is a pasted layer active, do not enable paste
    return
  }
  //enable menu buttons that can't work without a clipboard
  dom.pasteBtn.classList.remove("disabled")
}
