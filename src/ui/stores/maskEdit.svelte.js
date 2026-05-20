/**
 * Reactive store tracking whether the active layer's mask is being edited.
 * When `active` is true, drawing tools redirect strokes to the layer's
 * mask canvas instead of its content canvas, and the user's swatches are
 * visually locked to black/white. `layerId` records which layer is being
 * masked so that switching layers can detect and exit mask-edit mode for
 * the previous layer.
 */
export const maskEditStore = $state({
  active: false,
  layerId: null,
})
