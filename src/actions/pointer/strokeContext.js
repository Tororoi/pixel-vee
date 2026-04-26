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
    layer: null,          // The layer object being drawn onto.
    customContext: null,  // CanvasRenderingContext2D override for compositing.
    isPreview: false,     // True when rendering to the onscreen preview canvas.

    // Geometry constraints — pixels outside these are skipped.
    boundaryBox: null, // {xMin, xMax, yMin, yMax} — null means unbounded.
    maskSet: null,     // Set<number> of packed (y<<16)|x keys, or null.

    // Brush — shape and size of each stamp.
    brushStamp: null, // Full stamp keyed by direction string — used by
                      // line, curve, and ellipse to orient the stamp.
    brushSize: 1,

    // Color and rendering mode.
    currentColor: null,  // {color, r, g, b, a}
    currentModes: null,  // {eraser, inject, perfect, colorMask, ...}

    // Seen-pixels set — prevents a coordinate from being stamped twice in
    // one stroke. Shared across calls within the same stroke action.
    seenPixelsSet: null,   // Set<number> or null.
    excludeFromSet: false, // If true, pixels are tested but not recorded.

    // Dither settings — null/0/false when dithering is not active.
    ditherPattern: null,    // Pattern descriptor or null.
    twoColorMode: false,    // Fill OFF-pixels with the secondary color.
    secondaryColor: null,   // {color, r, g, b, a} for two-color dither.
    ditherOffsetX: 0,       // Grid offset to decouple pattern from layer pos.
    ditherOffsetY: 0,

    // Build-up dither only — null when not in build-up mode.
    densityMap: null,    // Flat array indexed by y * width + x; counts
                         // how many times each pixel has been painted.
    buildUpSteps: null,  // Ordered array of dither-pattern keys mapping
                         // density counts to progressively denser patterns.

    // Custom stamp full-color mode — null when not in use.
    customStampColorMap: null, // Map<"x,y", rgba_string> per-pixel colors.

    ...fields,
  }
}
