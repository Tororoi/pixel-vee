import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"

/**
 * paste: disable clear, cut, copy, paste, deselect, invert selection, select all, resize canvas
 * selection:
 */
export function disableActionsForPaste() {
  //disable clear button. TODO: When toolbox has a dom render function like layers and vectors, this should be moved there
  dom.clearBtn.disabled = true
  //disable menu buttons that can't work with a temporary layer active - cut, copy, paste, deselect, invert selection, select all, resize canvas
  //file menu
  dom.importBtn.parentElement.classList.add("disabled")
  dom.importBtn.disabled = true
  //edit menu
  dom.canvasSizeBtn.classList.add("disabled")
  dom.selectAllBtn.classList.add("disabled")
  dom.deselectBtn.classList.add("disabled")
  dom.invertSelectionBtn.classList.add("disabled")
  dom.cutBtn.classList.add("disabled")
  dom.copyBtn.classList.add("disabled")
  dom.pasteBtn.classList.add("disabled")
}

export function enableActionsForNoPaste() {
  //enable clear button. TODO: When toolbox has a dom render function like layers and vectors, this should be moved there
  dom.clearBtn.disabled = false
  //enable menu buttons that can't work with a temporary layer active - cut, copy, paste, deselect, invert selection, select all, resize canvas
  //file menu
  dom.importBtn.parentElement.classList.remove("disabled")
  dom.importBtn.disabled = false
  //edit menu
  dom.canvasSizeBtn.classList.remove("disabled")
  dom.selectAllBtn.classList.remove("disabled")
  dom.deselectBtn.classList.remove("disabled")
  dom.invertSelectionBtn.classList.remove("disabled")
  dom.cutBtn.classList.remove("disabled")
  dom.copyBtn.classList.remove("disabled")
  if (state.selectClipboard.canvas) {
    dom.pasteBtn.classList.remove("disabled")
  }
}

export function disableActionsForNoSelection() {
  //disable menu buttons that can't work without a selection
  dom.cutBtn.classList.add("disabled")
  dom.copyBtn.classList.add("disabled")
  dom.deselectBtn.classList.add("disabled")
  dom.invertSelectionBtn.classList.add("disabled")
}

export function enableActionsForSelection() {
  if (canvas.pastedLayer) {
    //if there is a pasted layer active, do not enable cut, copy, paste, deselect, invert selection
    return
  }
  //enable menu buttons that can't work without a selection
  dom.cutBtn.classList.remove("disabled")
  dom.copyBtn.classList.remove("disabled")
  dom.deselectBtn.classList.remove("disabled")
  dom.invertSelectionBtn.classList.remove("disabled")
}

export function disableActionsForNoClipboard() {
  //disable menu buttons that can't work without a clipboard
  dom.pasteBtn.classList.add("disabled")
}

export function enableActionsForClipboard() {
  if (canvas.pastedLayer) {
    //if there is a pasted layer active, do not enable paste
    return
  }
  //enable menu buttons that can't work without a clipboard
  dom.pasteBtn.classList.remove("disabled")
}
