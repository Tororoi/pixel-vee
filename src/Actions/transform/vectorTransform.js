import { globalState } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { vectorGui } from '../../GUI/vector.js'
import { renderCanvas } from '../../Canvas/render.js'
import { updateVectorProperties } from '../../utils/vectorHelpers.js'
import { findVectorShapeCentroid } from '../../utils/vectorTransformHelpers.js'
import { modifyVectorAction } from '../modifyTimeline/modifyTimeline.js'

//=============================================//
//======== * * * Vector Transform * * * =======//
//=============================================//

/**
 * Flip all selected vectors horizontally or vertically around the midpoint
 * of their combined bounding box.
 *
 * First computes the axis-aligned bounding box of all selected vectors by
 * collecting every defined control point (px1–px4). The center of that box
 * becomes the reflection axis. Each control point is then mirrored across
 * the relevant center coordinate using integer rounding.
 *
 * If a vector has a center-derived `px0/py0` point (used by the polygon tool
 * as a visual handle), it is recomputed as the midpoint of px1 and px3 after
 * the flip so it stays geometrically correct.
 *
 * Before modifying properties, the original values are saved into
 * `globalState.vector.savedProperties` so that `modifyVectorAction` can
 * produce a proper before/after timeline entry for undo/redo.
 * @param {boolean} flipHorizontally - `true` to mirror across the vertical
 *   center axis (left/right flip); `false` to mirror across the horizontal
 *   center axis (top/bottom flip).
 */
export function actionFlipVectors(flipHorizontally) {
  //get bounding box of all vectors
  let [xMin, xMax, yMin, yMax] = [null, null, null, null]
  const vectorIndicesSet = new Set(globalState.vector.selectedIndices)
  // Fall back to the single focused vector when nothing is multi-selected.
  if (vectorIndicesSet.size === 0) {
    vectorIndicesSet.add(globalState.vector.currentIndex)
  }
  for (const vectorIndex of vectorIndicesSet) {
    const vector = globalState.vector.all[vectorIndex]
    const vectorXPoints = []
    const vectorYPoints = []

    for (let i = 1; i <= 4; i++) {
      if (
        vector.vectorProperties[`px${i}`] != null &&
        vector.vectorProperties[`py${i}`] != null
      ) {
        vectorXPoints.push(vector.vectorProperties[`px${i}`])
        vectorYPoints.push(vector.vectorProperties[`py${i}`])
      }
    }

    xMin = Math.min(xMin ?? Infinity, ...vectorXPoints)
    xMax = Math.max(xMax ?? -Infinity, ...vectorXPoints)
    yMin = Math.min(yMin ?? Infinity, ...vectorYPoints)
    yMax = Math.max(yMax ?? -Infinity, ...vectorYPoints)
  }
  //get center point of selected vectors
  const centerX = (xMin + xMax) / 2
  const centerY = (yMin + yMax) / 2
  let referenceVector
  for (const vectorIndex of vectorIndicesSet) {
    const vector = globalState.vector.all[vectorIndex]
    referenceVector = vector //TODO: (Low Priority) Determine a better method for setting a reference vector or remove the need for one.
    // Save the original properties before mutation so modifyVectorAction can
    // build a from/to diff for the timeline.
    globalState.vector.savedProperties[vectorIndex] = {
      ...vector.vectorProperties,
      modes: { ...vector.modes },
    }
    for (let i = 1; i <= 4; i++) {
      if (
        vector.vectorProperties[`px${i}`] != null &&
        vector.vectorProperties[`py${i}`] != null
      ) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        let newX = vector.vectorProperties[xKey]
        let newY = vector.vectorProperties[yKey]
        if (flipHorizontally) {
          // Mirror across the vertical center: newX = 2*centerX - oldX
          newX = Math.round(2 * centerX) - vector.vectorProperties[xKey]
        } else {
          // Mirror across the horizontal center: newY = 2*centerY - oldY
          newY = Math.round(2 * centerY) - vector.vectorProperties[yKey]
        }
        updateVectorProperties(vector, newX, newY, xKey, yKey)
      }
    }
    // Recompute the derived center handle if this vector type uses one.
    if ('px0' in vector.vectorProperties) {
      vector.vectorProperties.px0 = Math.round(
        (vector.vectorProperties.px1 + vector.vectorProperties.px3) / 2,
      )
      vector.vectorProperties.py0 = Math.round(
        (vector.vectorProperties.py1 + vector.vectorProperties.py3) / 2,
      )
    }
    if (vectorIndex === globalState.vector.currentIndex) {
      vectorGui.setVectorProperties(vector)
    }
  }
  renderCanvas(canvas.currentLayer, true)
  //Get any selected vector to use for modifyVectorAction
  modifyVectorAction(referenceVector)
  globalState.clearRedoStack()
  vectorGui.render()
}

/**
 * Rotate all selected vectors by the given number of degrees around the
 * current shape center (or the centroid of their bounding box if no center
 * has been set yet).
 *
 * Each control point (px1–px4) is rotated using the standard 2D rotation
 * matrix around `(rotationOriginX, rotationOriginY)`, with the result floored
 * to integer pixel coordinates. The rotation origin defaults to the centroid
 * computed by `findVectorShapeCentroid` if `shapeCenterX/Y` is not already
 * set from a prior selection or rotation.
 *
 * If a vector has a `px0/py0` derived center handle it is recomputed as the
 * midpoint of px1 and px3 after rotation to stay geometrically correct.
 *
 * Original properties are saved into `globalState.vector.savedProperties`
 * before mutation so `modifyVectorAction` can produce a timeline entry.
 * @param {number} degrees - Clockwise rotation angle in degrees.
 */
export function actionRotateVectors(degrees) {
  const vectorIndicesSet = new Set(globalState.vector.selectedIndices)
  // Fall back to the single focused vector when nothing is multi-selected.
  if (vectorIndicesSet.size === 0) {
    vectorIndicesSet.add(globalState.vector.currentIndex)
  }
  // Initialise the rotation origin from the geometric centroid if it has
  // not been set by a prior selection interaction.
  if (globalState.vector.shapeCenterX === null) {
    const [centerX, centerY] = findVectorShapeCentroid(
      vectorIndicesSet,
      globalState.vector.all,
    )
    globalState.vector.shapeCenterX = centerX + canvas.currentLayer.x
    globalState.vector.shapeCenterY = centerY + canvas.currentLayer.y
  }
  const rotationOriginX = globalState.vector.shapeCenterX
  const rotationOriginY = globalState.vector.shapeCenterY
  let referenceVector
  for (const vectorIndex of vectorIndicesSet) {
    const vector = globalState.vector.all[vectorIndex]
    referenceVector = vector //TODO: (Low Priority) Determine a better method for setting a reference vector or remove the need for one.
    // Save the original properties before mutation so modifyVectorAction can
    // build a from/to diff for the timeline.
    globalState.vector.savedProperties[vectorIndex] = {
      ...vector.vectorProperties,
      modes: { ...vector.modes },
    }
    for (let i = 1; i <= 4; i++) {
      if (
        vector.vectorProperties[`px${i}`] != null &&
        vector.vectorProperties[`py${i}`] != null
      ) {
        const xKey = `px${i}`
        const yKey = `py${i}`
        let newX = vector.vectorProperties[xKey]
        let newY = vector.vectorProperties[yKey]
        const radians = (degrees * Math.PI) / 180
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)
        // Standard 2D rotation matrix applied relative to the origin point.
        newX = Math.floor(
          cos * (vector.vectorProperties[xKey] - rotationOriginX) -
            sin * (vector.vectorProperties[yKey] - rotationOriginY) +
            rotationOriginX,
        )
        newY = Math.floor(
          sin * (vector.vectorProperties[xKey] - rotationOriginX) +
            cos * (vector.vectorProperties[yKey] - rotationOriginY) +
            rotationOriginY,
        )
        updateVectorProperties(vector, newX, newY, xKey, yKey)
      }
    }
    // Recompute the derived center handle if this vector type uses one.
    if ('px0' in vector.vectorProperties) {
      vector.vectorProperties.px0 = Math.round(
        (vector.vectorProperties.px1 + vector.vectorProperties.px3) / 2,
      )
      vector.vectorProperties.py0 = Math.round(
        (vector.vectorProperties.py1 + vector.vectorProperties.py3) / 2,
      )
    }
    if (vectorIndex === globalState.vector.currentIndex) {
      vectorGui.setVectorProperties(vector)
    }
  }
  renderCanvas(canvas.currentLayer, true)
  //Get any selected vector to use for modifyVectorAction
  modifyVectorAction(referenceVector)
  globalState.clearRedoStack()
  vectorGui.render()
}

/**
 * Scale selected vectors by a factor derived from the given bounding box.
 * @todo IN PROGRESS — not yet implemented.
 */
export function actionScaleVectors() {
  //IN PROGRESS
}
