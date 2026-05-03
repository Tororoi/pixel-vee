// Plain object (not $state) — mutated directly during canvas swap.
export const navigatorState = {
  active: false,
  // Navigator canvas elements — populated by NavigatorCanvas.svelte on mount
  layer: null,
  previewLayer: null,
  offScreenCVS: null,
  offScreenCTX: null,
  previewCVS: null,
  previewCTX: null,
  backgroundCVS: null,
  backgroundCTX: null,
  // GUI overlay canvases — cursor, selection, and vector GUI
  cursorCVS: null,
  cursorCTX: null,
  selectionGuiCVS: null,
  selectionGuiCTX: null,
  vectorGuiCTX: null,
  // DOM references for playback control
  overlayEl: null,
  simCursorEl: null,
  // Saved real canvas properties for restoration after swap
  _saved: null,
}
