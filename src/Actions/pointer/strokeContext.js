/**
 * Factory for a StrokeContext — a plain object that bundles all rendering
 * parameters that are constant for an entire stroke or vector render.
 *
 * Allocating this once per stroke (not per pixel) keeps the hot path
 * free of per-call GC pressure. Only the truly per-pixel values
 * (coordX, coordY, directionalBrushStamp) are passed as positional args
 * alongside the context.
 *
 * @param {object} fields - Override any defaults
 * @returns {object} strokeContext
 */
export function createStrokeContext(fields) {
  return {
    // Rendering target
    layer: null,
    customContext: null, // CanvasRenderingContext2D override
    isPreview: false,

    // Geometry constraints
    boundaryBox: null, // {xMin, xMax, yMin, yMax}
    maskSet: null, // Set<number> or null

    // Brush
    brushStamp: null, // full stamp object keyed by direction — used by line/curve/ellipse
    brushSize: 1,

    // Color
    currentColor: null, // {color, r, g, b, a}
    currentModes: null, // {eraser, inject, perfect, colorMask, ...}

    // Seen pixels (anti-repeat)
    seenPixelsSet: null, // Set<number> or null
    excludeFromSet: false,

    // Dither (optional — null/0 when not dithering)
    ditherPattern: null,
    twoColorMode: false,
    secondaryColor: null,
    ditherOffsetX: 0,
    ditherOffsetY: 0,

    // Build-up dither only
    densityMap: null, // Map<(y<<16)|x, count> or null
    buildUpSteps: null, // number[] or null

    ...fields,
  }
}
