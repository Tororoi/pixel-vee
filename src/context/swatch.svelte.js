import { dom } from './dom.js'

//====================================//
//======= * * * Swatches * * * =======//
//====================================//

/**
 * Central reactive state for all swatch and palette data. Holds the active
 * primary/secondary colors, the current palette array, selection and
 * interaction mode for the palette UI, and user-defined custom palettes.
 * DOM color-picker references are stored alongside colors so pickers can
 * be kept in sync without additional lookups elsewhere.
 */
export const swatches = $state({
  primary: {
    swatch: dom.swatch,
    color: { color: 'rgba(0,0,0,1)', r: 0, g: 0, b: 0, a: 255 },
  },
  secondary: {
    swatch: dom.backSwatch,
    color: { color: 'rgba(255,255,255,1)', r: 255, g: 255, b: 255, a: 255 },
  },
  palette: [
    { color: 'rgba(0,0,0,1)', r: 0, g: 0, b: 0, a: 255 },
    { color: 'rgba(255,255,255,1)', r: 255, g: 255, b: 255, a: 255 },
  ],
  activePaletteIndex: null,
  selectedPaletteIndex: null,
  paletteMode: 'select',
  currentPreset: '1bit',
  customPalettes: {},
})

// Push default colors onto DOM pickers at module init. Guards handle
// environments where the element hasn't mounted yet (SSR, tests).
if (dom.swatch) dom.swatch.color = swatches.primary.color
if (dom.backSwatch) dom.backSwatch.color = swatches.secondary.color

//==================================================//
//========= * * * Navigator Features * * * =========//
//==================================================//

/**
 * Produces a plain-object snapshot of all mutable swatch state. Color
 * objects are shallow-copied so that subsequent mutations to the live state
 * do not retroactively corrupt the snapshot — critical for reliable
 * undo/redo round-trips where the snapshot must remain stable after capture.
 * @returns {object} Snapshot suitable for passing to restoreSwatches.
 */
export function snapshotSwatches() {
  return {
    primaryColor: { ...swatches.primary.color },
    secondaryColor: { ...swatches.secondary.color },
    activePaletteIndex: swatches.activePaletteIndex,
    selectedPaletteIndex: swatches.selectedPaletteIndex,
    paletteMode: swatches.paletteMode,
    currentPreset: swatches.currentPreset,
    palette: swatches.palette.map((c) => ({ ...c })),
  }
}

/**
 * Restores swatch state from a snapshot produced by snapshotSwatches.
 * Color objects are mutated in-place via Object.assign rather than replaced
 * outright, preserving any reactive references other components hold to
 * those objects. CSS variables are re-synced explicitly at the end because
 * this restore path bypasses the reactive setters that would normally
 * trigger syncSwatchCSSVars automatically.
 * @param {object} snap Snapshot returned by snapshotSwatches.
 */
export function restoreSwatches(snap) {
  // Mutate in-place so other components' reactive references stay valid.
  Object.assign(swatches.primary.color, snap.primaryColor)
  Object.assign(swatches.secondary.color, snap.secondaryColor)
  swatches.activePaletteIndex = snap.activePaletteIndex
  swatches.selectedPaletteIndex = snap.selectedPaletteIndex
  swatches.paletteMode = snap.paletteMode
  swatches.currentPreset = snap.currentPreset
  swatches.palette = snap.palette
  // Restore bypasses reactive setters, so CSS vars need an explicit push.
  syncSwatchCSSVars()
}

/**
 * Writes CSS custom properties for both swatches onto the document root so
 * CSS can reference live colors without coupling to the JS state shape. RGB
 * is published as a comma-separated triple so call sites can compose it
 * into rgb()/rgba() at the CSS layer. Alpha is stored as 0-255 internally
 * but CSS expects 0-1, so it is normalized on the way out.
 */
export function syncSwatchCSSVars() {
  const p = swatches.primary.color
  const s = swatches.secondary.color
  // Separate properties for RGB and alpha so CSS can compose them freely.
  document.documentElement.style.setProperty(
    '--primary-swatch-color',
    `${p.r},${p.g},${p.b}`,
  )
  // Normalize 0-255 → 0-1 for CSS opacity/alpha values.
  document.documentElement.style.setProperty(
    '--primary-swatch-alpha',
    `${p.a / 255}`,
  )
  document.documentElement.style.setProperty(
    '--secondary-swatch-color',
    `${s.r},${s.g},${s.b}`,
  )
  document.documentElement.style.setProperty(
    '--secondary-swatch-alpha',
    `${s.a / 255}`,
  )
}
