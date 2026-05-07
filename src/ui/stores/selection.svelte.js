/**
 * Reactive store holding the complete selection state for the canvas.
 * Coordinates (px1/py1 to px2/py2) describe the raw drag endpoints and
 * are not guaranteed to be normalised until `normalize()` is called.
 * Set and array fields are always replaced wholesale rather than mutated
 * in place, so snapshot/restore can safely share those references.
 */
export const selectionStore = $state({
  properties: {
    px1: null,
    py1: null,
    px2: null,
    py2: null,
  },
  boundaryBox: {
    xMin: null,
    yMin: null,
    xMax: null,
    yMax: null,
  },
  previousBoundaryBox: null,
  maskSet: null,
  seenPixelsSet: null,
  pointsSet: null,
  pixelPoints: null,
  cornersSet: null,
  /**
   * Clears the four drag-endpoint coordinates and the derived mask. Both
   * are reset together because the mask is always a function of the
   * coordinates — clearing only the coordinates would leave stale mask
   * data behind and could cause phantom pixels to appear on the next
   * selection.
   * @this {typeof selectionStore}
   */
  resetProperties() {
    this.properties = { px1: null, py1: null, px2: null, py2: null }
    this.maskSet = null
  },
  /**
   * Reorders the drag endpoints so (px1, py1) is always the top-left
   * corner and (px2, py2) is always the bottom-right corner regardless
   * of the direction the user dragged. Values are snapshotted via spread
   * before any assignment so that writing px1 does not corrupt the
   * min/max inputs still needed for px2, and likewise for the y-axis.
   * @this {typeof selectionStore}
   */
  normalize() {
    // Snapshot before mutating so min/max reads stay consistent.
    const { px1, py1, px2, py2 } = { ...this.properties }
    this.properties.px1 = Math.min(px1, px2)
    this.properties.py1 = Math.min(py1, py2)
    this.properties.px2 = Math.max(px2, px1)
    this.properties.py2 = Math.max(py2, py1)
  },
  /**
   * Resets the boundary box to an all-null state, signalling that no
   * axis-aligned selection region is currently active.
   * @this {typeof selectionStore}
   */
  resetBoundaryBox() {
    this.boundaryBox = { xMin: null, yMin: null, xMax: null, yMax: null }
  },
  /**
   * Derives and stores the axis-aligned bounding box from raw selection
   * coordinates. Uses min/max per axis rather than assuming a fixed drag
   * direction, so the box is correct whether the user dragged
   * top-to-bottom or bottom-to-top. Guards against any null coordinate
   * because a partial selection cannot produce a valid box — when any
   * value is absent the box is reset rather than written with garbage.
   * @this {typeof selectionStore}
   * @param {{ px1: number|null, py1: number|null,
   *           px2: number|null, py2: number|null }} selectProperties
   *   Raw drag-endpoint coordinates from the current selection.
   */
  setBoundaryBox(selectProperties) {
    if (
      selectProperties.px1 !== null &&
      selectProperties.py1 !== null &&
      selectProperties.px2 !== null &&
      selectProperties.py2 !== null
    ) {
      this.boundaryBox.xMin = Math.min(
        selectProperties.px1,
        selectProperties.px2,
      )
      this.boundaryBox.yMin = Math.min(
        selectProperties.py1,
        selectProperties.py2,
      )
      this.boundaryBox.xMax = Math.max(
        selectProperties.px2,
        selectProperties.px1,
      )
      this.boundaryBox.yMax = Math.max(
        selectProperties.py2,
        selectProperties.py1,
      )
    } else {
      // Partial coordinates leave the bounding box in an undefined state,
      // so reset rather than leaving stale values.
      this.resetBoundaryBox()
    }
  },
})

//==================================================//
//========= * * * Navigator Features * * * =========//
//==================================================//

/**
 * Produces a point-in-time shallow copy of the selection store for use
 * in undo history or navigator snapshots. The nested coordinate objects
 * are spread so the snapshot owns independent copies and live mutations
 * cannot corrupt them. Set and array fields are kept as direct references
 * because they are always replaced wholesale; sharing the reference is
 * safe and avoids the cost of copying large pixel sets.
 * @returns {{ properties: object, boundaryBox: object,
 *             previousBoundaryBox: object|null, maskSet: Set|null,
 *             seenPixelsSet: Set|null, pointsSet: Set|null,
 *             pixelPoints: Array|null, cornersSet: Set|null }}
 *   Frozen snapshot of the full selection state.
 */
export function snapshotSelection() {
  return {
    // Spread plain objects so the snapshot is decoupled from live mutations.
    properties: { ...selectionStore.properties },
    boundaryBox: { ...selectionStore.boundaryBox },
    previousBoundaryBox: selectionStore.previousBoundaryBox,
    maskSet: selectionStore.maskSet,
    seenPixelsSet: selectionStore.seenPixelsSet,
    pointsSet: selectionStore.pointsSet,
    pixelPoints: selectionStore.pixelPoints,
    cornersSet: selectionStore.cornersSet,
  }
}

/**
 * Restores the selection store to the state captured by
 * `snapshotSelection`. Nested plain objects are written back with
 * `Object.assign` rather than by replacing the reference so that
 * Svelte's reactive proxies on `properties` and `boundaryBox` remain
 * intact — swapping the reference would silently break any binding that
 * destructured the sub-object before the restore was called.
 * @param {ReturnType<typeof snapshotSelection>} snap
 *   Snapshot previously produced by `snapshotSelection`.
 */
export function restoreSelection(snap) {
  // Mutate in-place to preserve Svelte's reactive proxy wrappers.
  Object.assign(selectionStore.properties, snap.properties)
  Object.assign(selectionStore.boundaryBox, snap.boundaryBox)
  selectionStore.previousBoundaryBox = snap.previousBoundaryBox
  selectionStore.maskSet = snap.maskSet
  selectionStore.seenPixelsSet = snap.seenPixelsSet
  selectionStore.pointsSet = snap.pointsSet
  selectionStore.pixelPoints = snap.pixelPoints
  selectionStore.cornersSet = snap.cornersSet
}
