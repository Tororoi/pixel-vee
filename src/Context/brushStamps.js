import { generateBrushStamps } from '../utils/brushHelpers.js'

export const brushStamps = {
  circle: generateBrushStamps('circle'),
  square: generateBrushStamps('square'),
}

export const customBrushStamp = {
  pixels: [], // [{x, y}, ...] — non-transparent pixels (offsets 0..31)
  pixelSet: new Set(), // Set<(y<<16)|x> for O(1) lookup
  colorMap: new Map(), // Map<"x,y", rgba_string> for full-color mode
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
export function buildCustomStampEntry() {
  const pts = customBrushStamp.pixels
  const entry = {}
  for (const k of STAMP_DIRECTION_KEYS) {
    entry[k] = pts
  }
  entry.pixelSet = customBrushStamp.pixelSet
  return entry
}
