import { bump } from '../hooks/useAppState.js'

/**
 * Render palette tools — React reads swatches.paletteMode via useAppState().
 */
export const renderPaletteToolsToDOM = () => {
  bump()
}

/**
 * Render palette colors — React reads swatches.palette via useAppState().
 */
export const renderPaletteToDOM = () => {
  bump()
}

/**
 * Render palette presets — React reads swatches.customPalettes via useAppState().
 */
export const renderPalettePresetsToDOM = () => {
  bump()
}
