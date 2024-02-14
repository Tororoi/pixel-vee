import { dom } from "../Context/dom.js"

export function disableActionsForPaste() {
  //disable clear button. TODO: When toolbox has a dom render function like layers and vectors, this should be moved there
  dom.clearBtn.disabled = true
  //disable menu buttons that can't work with a temporary layer active - cut, copy, paste, deselect, invert selection, select all, resize canvas
  dom.canvasSizeBtn.classList.add("disabled")
  dom.selectAllBtn.classList.add("disabled")
  dom.deselectBtn.classList.add("disabled")
  dom.invertSelectionBtn.classList.add("disabled")
  dom.cutBtn.classList.add("disabled")
  dom.copyBtn.classList.add("disabled")
  dom.pasteBtn.classList.add("disabled")
}

export function reEnableActionsFromPaste() {
  //enable clear button. TODO: When toolbox has a dom render function like layers and vectors, this should be moved there
  dom.clearBtn.disabled = false
  //enable menu buttons that can't work with a temporary layer active - cut, copy, paste, deselect, invert selection, select all, resize canvas
  dom.canvasSizeBtn.classList.remove("disabled")
  dom.selectAllBtn.classList.remove("disabled")
  dom.deselectBtn.classList.remove("disabled")
  dom.invertSelectionBtn.classList.remove("disabled")
  dom.cutBtn.classList.remove("disabled")
  dom.copyBtn.classList.remove("disabled")
  dom.pasteBtn.classList.remove("disabled")
}
