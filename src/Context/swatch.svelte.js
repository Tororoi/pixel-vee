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
