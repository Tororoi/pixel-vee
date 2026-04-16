import { dom } from './Context/dom.js'
import { initializeDialogBox, initializeCollapser } from './utils/drag.js'
import { deactivateResizeOverlay } from './Canvas/resizeOverlay.js'
import './Menu/events.js'
import './Swatch/events.js'
import './Canvas/events.js'
import './Tools/events.js'
import './Controls/events.js'
import './GUI/events.js'
import { actionDeselect } from './Actions/nonPointer/selectionActions.js'
import { vectorGui } from './GUI/vector.js'
import { registerVectorGui, registerDOMHelpers } from './Context/state.js'
import { bump } from './hooks/appState.svelte.js'

// Register dependencies that would otherwise create circular imports in globalState.js
registerVectorGui(vectorGui)
registerDOMHelpers({
  disableActionsForNoSelection: bump,
  enableActionsForSelection: bump,
})

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
initializeDialogBox(dom.sizeContainer, false, deactivateResizeOverlay)

// * Settings * //
initializeDialogBox(dom.settingsContainer)

// * Color Picker * //
initializeDialogBox(dom.colorPickerContainer)

// * Color Ramps Section * //
initializeCollapser(document.getElementById('color-ramps-section'))

// * Save * //
initializeDialogBox(dom.saveContainer)

// * Export * //
// initializeDialogBox(dom.exportContainer)

// * Vector Transform * //
initializeDialogBox(dom.vectorTransformUIContainer, false, actionDeselect)

// * Stamp Editor * //
// initializeDialogBox and initStampEditor are called by StampEditorDialog after mount

// * Dither Picker * //
initializeDialogBox(dom.ditherPickerContainer)
