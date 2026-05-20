import { globalState } from '../../context/state.js'

/**
 * Opaque mask colors. Two variants so the visible overlay subtly
 * signals which mode the mask is in. The brush in mask-edit mode
 * picks the matching color so newly-painted pixels match the rest
 * of the overlay until the user toggles invert again.
 */
const MASK_RED = { color: 'rgba(255,0,0,1)', r: 255, g: 0, b: 0, a: 255 }
const MASK_RED_INVERTED = {
  color: 'rgba(0,0,255,1)',
  r: 0,
  g: 0,
  b: 255,
  a: 255,
}

/**
 * Compute mask-routing overrides for the active stroke. When the
 * user is editing a layer mask the stroke targets the mask canvas
 * instead of the layer canvas, writes the mode's mask color where
 * painted (clearRect where erased), and bypasses the mask gate so
 * the user can repaint their own mask. `inject` is suppressed
 * because there's no concept of color-injection on the binary mask.
 *
 * When NOT editing the mask, the gate is wired to the layer's mask
 * when enabled, with the inverted flag propagated so the per-pixel
 * check can flip its interpretation of the set.
 *
 * Spread the return value AFTER the tool's own field set so these
 * routing fields override `currentColor`, `currentModes`, and `layer`
 * correctly.
 * @param {object|null} layer - The active layer (or null for safety).
 * @returns {object} Partial StrokeContext fields to spread.
 */
export function getMaskRoutingFields(layer) {
  // Disabling the mask treats edit and overlay as off without
  // clearing the user's toggle values — the gate just skips the
  // mask-edit routing path entirely so the brush hits the layer
  // canvas the same way it would on an un-masked layer.
  const inMaskEdit =
    globalState.maskEdit.active && layer?.mask && layer.mask.enabled
  if (inMaskEdit) {
    const color = layer.mask.inverted ? MASK_RED_INVERTED : MASK_RED
    return {
      customContext: layer.mask.ctx,
      currentColor: color,
      secondaryColor: color,
      currentModes: {
        ...(globalState.tool.current.modes ?? {}),
        inject: false,
      },
      targetMask: true,
      layerMaskBlockedSet: null,
      layerMaskInverted: false,
    }
  }
  return {
    targetMask: false,
    layerMaskBlockedSet: layer?.mask?.enabled ? layer.mask.blockedSet : null,
    layerMaskInverted: !!(layer?.mask?.enabled && layer?.mask?.inverted),
  }
}

/**
 * Create a StrokeContext — a plain object bundling all rendering parameters
 * that remain constant for the duration of a single stroke or vector render.
 *
 * All drawing primitives (actionDraw, actionLine, actionCurve, etc.) accept
 * a StrokeContext instead of individual parameters for the settings that do
 * not change per pixel. Allocating this once per stroke rather than once per
 * pixel keeps the hot path free of per-call GC pressure. Only the truly
 * per-pixel values — coordX, coordY, and directionalBrushStamp — are passed
 * as separate positional arguments alongside the context.
 *
 * Callers spread their specific values into `fields` to override defaults.
 * Any field not provided falls back to the null/false/0 default listed here.
 * @param {object} fields - Field overrides. Any property listed in the
 *   return object can be overridden here.
 * @returns {object} A fully initialized StrokeContext ready for use.
 */
export function createStrokeContext(fields) {
  return {
    // Rendering target — exactly one of these should be set per stroke.
    layer: null, // The layer object being drawn onto.
    customContext: null, // CanvasRenderingContext2D override for compositing.
    isPreview: false, // True when rendering to the onscreen preview canvas.

    // Geometry constraints — pixels outside these are skipped.
    boundaryBox: null, // {xMin, xMax, yMin, yMax} — null means unbounded.
    maskSet: null, // Set<number> of packed (y<<16)|x keys, or null.
    // Per-layer mask gate. Composes with `maskSet` (selection): when both
    // are present a pixel must satisfy both. Bypassed when `targetMask`
    // is true so the user can paint over their own mask. When
    // `layerMaskInverted` is true the gate flips: drawing is allowed
    // ONLY where the mask is painted, rather than everywhere except.
    layerMaskBlockedSet: null, // Set<number> or null.
    layerMaskInverted: false, // Flips the blockedSet check.
    targetMask: false, // True when the stroke is editing a layer mask.

    // Brush — shape and size of each stamp.
    brushStamp: null, // Full stamp keyed by direction string — used by
    // line, curve, and ellipse to orient the stamp.
    brushSize: 1,

    // Color and rendering mode.
    currentColor: null, // {color, r, g, b, a}
    currentModes: null, // {eraser, inject, perfect, colorMask, ...}

    // Seen-pixels set — prevents a coordinate from being stamped twice in
    // one stroke. Shared across calls within the same stroke action.
    seenPixelsSet: null, // Set<number> or null.
    excludeFromSet: false, // If true, pixels are tested but not recorded.

    // Dither settings — null/0/false when dithering is not active.
    ditherPattern: null, // Pattern descriptor or null.
    twoColorMode: false, // Fill OFF-pixels with the secondary color.
    secondaryColor: null, // {color, r, g, b, a} for two-color dither.
    ditherOffsetX: 0, // Grid offset to decouple pattern from layer pos.
    ditherOffsetY: 0,

    // Build-up dither only — null when not in build-up mode.
    densityMap: null, // Flat array indexed by y * width + x; counts
    // how many times each pixel has been painted.
    buildUpSteps: null, // Ordered array of dither-pattern keys mapping
    // density counts to progressively denser patterns.

    // Custom stamp full-color mode — null when not in use.
    customStampColorMap: null, // Map<"x,y", rgba_string> per-pixel colors.

    ...fields,
  }
}
