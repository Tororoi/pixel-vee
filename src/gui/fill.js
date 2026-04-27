import { vectorGui } from './vector.js'

/**
 * Render the GUI overlay for a fill vector, drawing its single origin
 * control point. Fill only needs one anchor (px1/py1), so pointsKeys
 * is intentionally a one-element array. When no saved vector is present
 * (i.e. the tool is being actively placed rather than revisiting an
 * existing vector), control points are drawn twice: once without the
 * vector reference to render the "unselected" base layer, then again
 * with the active flag so the top layer reflects the in-progress state.
 * When a saved vector is supplied the first pass is skipped because the
 * base-layer appearance is already encoded in the vector itself.
 * @param {object} vectorProperties - Live placement coordinates and
 *   style properties for the control point.
 * @param {object} vector - The persisted vector being revisited, or
 *   falsy when the tool is actively being placed for the first time.
 */
export function renderFillVector(vectorProperties, vector) {
  let pointsKeys = [{ x: 'px1', y: 'py1' }]
  // First pass: draw the base (unselected) layer only when no saved
  // vector exists, so the in-progress placement still shows both layers.
  if (!vector) {
    vectorGui.drawControlPoints(vectorProperties, pointsKeys, false)
  }
  // Second pass: always draw the active/top layer, passing the vector
  // so saved vectors can style their control points differently.
  vectorGui.drawControlPoints(vectorProperties, pointsKeys, true, vector)
}
