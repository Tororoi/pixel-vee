import { dom } from "./Context/dom.js"
import { initializeDialogBox } from "./utils/drag.js"
import "./Menu/events.js"
import "./Swatch/events.js"
import "./Canvas/events.js"
import "./Tools/events.js"
import "./Controls/events.js"

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

// * Color Picker * //
initializeDialogBox(dom.colorPickerContainer)

// * Save * //
initializeDialogBox(dom.saveContainer)

// * Export * //
// initializeDialogBox(dom.exportContainer)
