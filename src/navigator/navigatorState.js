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
  // Saved real canvas properties for restoration after swap
  _saved: null,
}
