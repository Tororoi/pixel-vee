import { dom } from './dom.js'

//====================================//
//======= * * * Swatches * * * =======//
//====================================//

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

if (dom.swatch) dom.swatch.color = swatches.primary.color
if (dom.backSwatch) dom.backSwatch.color = swatches.secondary.color

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

export function restoreSwatches(snap) {
  Object.assign(swatches.primary.color, snap.primaryColor)
  Object.assign(swatches.secondary.color, snap.secondaryColor)
  swatches.activePaletteIndex = snap.activePaletteIndex
  swatches.selectedPaletteIndex = snap.selectedPaletteIndex
  swatches.paletteMode = snap.paletteMode
  swatches.currentPreset = snap.currentPreset
  swatches.palette = snap.palette
  syncSwatchCSSVars()
}

export function syncSwatchCSSVars() {
  const p = swatches.primary.color
  const s = swatches.secondary.color
  document.documentElement.style.setProperty(
    '--primary-swatch-color',
    `${p.r},${p.g},${p.b}`,
  )
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
