import { canvas } from '../Context/canvas.js'
import { globalState } from '../Context/state.js'

/**
 * Returns the base X render offset for a vector path (canvas pan + layer offset).
 * Add a stored art-pixel coordinate to get the final canvas draw position.
 * @param {object|null} vector - The vector being rendered, or null for in-progress
 * @returns {number} The computed offset value
 */
export function getRenderXOffset(vector) {
  return (
    canvas.xOffset +
    (vector?.layer?.x ?? 0) +
    (globalState.canvas.cropOffsetX ?? 0)
  )
}

/**
 * Returns the base Y render offset for a vector path (canvas pan + layer offset).
 * @param {object|null} vector - The vector being rendered, or null for in-progress
 * @returns {number} The computed offset value
 */
export function getRenderYOffset(vector) {
  return (
    canvas.yOffset +
    (vector?.layer?.y ?? 0) +
    (globalState.canvas.cropOffsetY ?? 0)
  )
}

/**
 * Returns the layer + crop offset for a control point's normalized X coordinate.
 * Used for both collision detection (compared against globalState.cursor.x) and as the
 * base for computing cx = canvas.xOffset + normalizedX + 0.5.
 * @param {object|null} vector - The vector being rendered, or null for in-progress
 * @returns {number} The computed offset value
 */
export function getControlPointXOffset(vector) {
  return (vector?.layer?.x ?? 0) + (globalState.canvas.cropOffsetX ?? 0)
}

/**
 * Returns the layer + crop offset for a control point's normalized Y coordinate.
 * @param {object|null} vector - The vector being rendered, or null for in-progress
 * @returns {number} Layer + crop Y offset for control point normalization
 */
export function getControlPointYOffset(vector) {
  return (vector?.layer?.y ?? 0) + (globalState.canvas.cropOffsetY ?? 0)
}

/**
 * Returns the normalized X coordinate for the current cursor position.
 * @returns {number} Normalized X coordinate (cursor.x minus crop offset)
 */
export function getCropNormalizedCursorX() {
  return globalState.cursor.x - globalState.canvas.cropOffsetX
}

/**
 * Returns the normalized Y coordinate for the current cursor position.
 * @returns {number} Normalized Y coordinate (cursor.y minus crop offset)
 */
export function getCropNormalizedCursorY() {
  return globalState.cursor.y - globalState.canvas.cropOffsetY
}
