import { generateBrushStamps } from '../utils/brushHelpers.js'
import { customBrushStamp } from './brushStamps.svelte.js'
export { customBrushStamp }

export const customBrushData = {
  pixelSet: new Set(),
  colorMap: new Map(),
}

export const brushStamps = {
  circle: generateBrushStamps('circle'),
  square: generateBrushStamps('square'),
  custom: /** @type {object} */ (null), // set by updateCustomStamp() after customBrushStamp is defined
}

const STAMP_DIRECTION_KEYS = [
  '0,0',
  '1,0',
  '1,1',
  '0,1',
  '-1,1',
  '-1,0',
  '-1,-1',
  '0,-1',
  '1,-1',
]

/**
 * Returns a brushStamp-compatible entry for the custom stamp.
 * All directional keys share the same pixel array (no edge optimization needed
 * at this stamp size). Shape is compatible with brushStamps[type][size].
 * @returns {object} A brushStamps entry keyed by direction, each holding the custom pixel array
 */
function buildCustomStampEntry() {
  const pts = customBrushStamp.pixels
  const entry = {}
  for (const k of STAMP_DIRECTION_KEYS) {
    entry[k] = pts
  }
  entry.pixelSet = customBrushData.pixelSet
  return entry
}

/**
 * Rebuild brushStamps.custom from the current customBrushStamp.
 * Call this whenever the custom stamp pixels change (e.g. after applyStamp).
 */
export function updateCustomStamp() {
  brushStamps.custom = buildCustomStampEntry()
}

// Initialize custom entry with the (empty) default stamp
updateCustomStamp()
