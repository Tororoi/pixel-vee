import { dom } from "./Context/dom.js"
import { initializeDialogBox, initializeCollapser } from "./utils/drag.js"
import "./Menu/events.js"
import "./Swatch/events.js"
import "./Canvas/events.js"
import "./Tools/events.js"
import "./Controls/events.js"
import "./GUI/events.js"
import { actionDeselect } from "./Actions/nonPointer/selectionActions.js"
import { vectorGui } from "./GUI/vector.js"
import { registerVectorGui, registerDOMHelpers } from "./Context/state.js"
import {
  disableActionsForNoSelection,
  enableActionsForSelection,
} from "./DOM/disableDomElements.js"
import { initStampEditor, openStampEditor } from "./DOM/stampEditor.js"
import { brush } from "./Tools/brush.js"
import { renderBrushStampToDOM } from "./DOM/renderBrush.js"

// Register dependencies that would otherwise create circular imports in state.js
registerVectorGui(vectorGui)
registerDOMHelpers({ disableActionsForNoSelection, enableActionsForSelection })

//===================================//
//===== * * * Initialize * * * ======//
//===================================//

//===================================//
//==== * * * DOM Interface * * * ====//
//===================================//

// * Sidebar Menu * //
initializeDialogBox(dom.sidebarContainer)

// * Toolbox * //
initializeDialogBox(dom.toolboxContainer)

// * Brush * //
initializeDialogBox(dom.brushContainer)

// * Palette * //
initializeDialogBox(dom.paletteInterfaceContainer)

// * Layers Interface * //
initializeDialogBox(dom.layersInterfaceContainer)

// * Vectors Interface * //
initializeDialogBox(dom.vectorsInterfaceContainer)

// * Canvas Size * //
initializeDialogBox(dom.sizeContainer)

// * Settings * //
initializeDialogBox(dom.settingsContainer)

// * Dither Picker * //
initializeDialogBox(dom.ditherPickerContainer)

// * Color Picker * //
initializeDialogBox(dom.colorPickerContainer)

// * Color Ramps Section * //
initializeCollapser(document.getElementById("color-ramps-section"))

// * Save * //
initializeDialogBox(dom.saveContainer)

// * Export * //
// initializeDialogBox(dom.exportContainer)

// * Vector Transform * //
initializeDialogBox(dom.vectorTransformUIContainer, false, actionDeselect)

// * Stamp Editor * //
initializeDialogBox(dom.stampEditorContainer)
initStampEditor()

// Custom stamp button: activate custom brush type and open the editor
dom.customBrushTypeBtn?.addEventListener("click", () => {
  brush.brushType = "custom"
  dom.customBrushTypeBtn.classList.add("active")
  renderBrushStampToDOM()
  openStampEditor()
})
