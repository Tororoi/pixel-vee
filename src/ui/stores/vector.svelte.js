import { SvelteSet } from 'svelte/reactivity'
import { TRANSLATE } from '../../utils/constants.js'

/**
 * Central reactive store for the vector tool. Tracks all vector
 * definitions, the active selection, transform mode, and the
 * grab-gesture anchors used for delta-based rotation and scaling.
 * `selectedIndices` is a `SvelteSet` so Svelte detects individual
 * membership changes without re-diffing the whole collection.
 * `highestKey` is monotonically increasing and never rolled back on
 * undo, guaranteeing a session-unique identity for every vector even
 * after restore operations.
 */
export const vectorStore = $state({
  properties: {},
  all: {},
  currentIndex: null,
  collidedIndex: null,
  selectedIndices: new SvelteSet(),
  savedProperties: {},
  transformMode: TRANSLATE,
  highestKey: 0,
  redoStackHeld: {},
  shapeCenterX: null,
  shapeCenterY: null,
  grabStartShapeCenterX: null,
  grabStartShapeCenterY: null,
  grabStartAngle: null,
  /**
   * Sets the index of the currently active vector. Exposed as a
   * method rather than a bare property write so all mutations to
   * `currentIndex` can be found with a single search.
   * @param {number|null} idx - The index to activate, or null.
   */
  setCurrentIndex(idx) {
    this.currentIndex = idx
  },
  /**
   * Increments `highestKey` and returns the new value. Pre-increment
   * ensures key 0 is never handed out — 0 is falsy and is used
   * elsewhere as a sentinel meaning "no key assigned".
   * @returns {number} A session-unique key for a new vector.
   */
  nextKey() {
    this.highestKey += 1
    return this.highestKey
  },
  /**
   * Marks a vector index as part of the active selection. Delegates
   * to the underlying `SvelteSet` so Svelte's fine-grained reactivity
   * tracks the membership change without re-processing the full set.
   * @param {number} idx - The vector index to select.
   */
  addSelected(idx) {
    this.selectedIndices.add(idx)
  },
  /**
   * Removes a single index from the active selection. Safe to call
   * when the index is not currently selected; the underlying `Set`
   * silently ignores no-op deletes.
   * @param {number} idx - The vector index to deselect.
   */
  removeSelected(idx) {
    this.selectedIndices.delete(idx)
  },
  /**
   * Clears all selected indices at once. Preferred over iterating and
   * calling `removeSelected` individually because a single `clear`
   * emits one reactive notification instead of one per member.
   */
  clearSelected() {
    this.selectedIndices.clear()
  },
  /**
   * Switches the active transform mode (translate, rotate, scale).
   * Wrapped as a setter for the same auditability reason as
   * `setCurrentIndex` — writes are easy to locate via search.
   * @param {string} mode - A transform-mode constant from constants.js.
   */
  setTransformMode(mode) {
    this.transformMode = mode
  },
})

//==================================================//
//========= * * * Navigator Features * * * =========//
//==================================================//

/**
 * Captures a shallow copy of `vectorStore` as a plain object safe for
 * storage in undo/redo history. Object fields are spread so later
 * mutations to the live store don't corrupt the snapshot. `selectedIndices`
 * is converted to a plain `Set` because a `SvelteSet` carries reactive
 * subscriptions that are wasteful and inappropriate in a frozen record.
 * @returns {object} A non-reactive snapshot of the full vector store.
 */
export function snapshotVector() {
  return {
    properties: { ...vectorStore.properties },
    all: { ...vectorStore.all },
    currentIndex: vectorStore.currentIndex,
    collidedIndex: vectorStore.collidedIndex,
    // Plain Set, not SvelteSet — snapshots live outside the reactive
    // graph and must not hold dangling reactive subscriptions.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    selectedIndices: new Set(vectorStore.selectedIndices),
    savedProperties: { ...vectorStore.savedProperties },
    transformMode: vectorStore.transformMode,
    highestKey: vectorStore.highestKey,
    redoStackHeld: { ...vectorStore.redoStackHeld },
    shapeCenterX: vectorStore.shapeCenterX,
    shapeCenterY: vectorStore.shapeCenterY,
    grabStartShapeCenterX: vectorStore.grabStartShapeCenterX,
    grabStartShapeCenterY: vectorStore.grabStartShapeCenterY,
    grabStartAngle: vectorStore.grabStartAngle,
  }
}

/**
 * Writes a previously captured snapshot back into `vectorStore`,
 * replacing every field. `selectedIndices` is restored via
 * `clearSelected` followed by per-item `addSelected` calls rather
 * than a direct assignment because replacing the live `SvelteSet`
 * with a plain `Set` would silently break Svelte's reactive tracking
 * on that field. `setCurrentIndex` is used instead of a direct write
 * for consistency with the other guarded mutations.
 * @param {object} snap - A snapshot produced by `snapshotVector`.
 */
export function restoreVector(snap) {
  vectorStore.properties = snap.properties
  vectorStore.all = snap.all
  vectorStore.setCurrentIndex(snap.currentIndex)
  vectorStore.collidedIndex = snap.collidedIndex
  // Rebuild through the store API to keep the SvelteSet instance
  // alive — assigning a plain Set here would lose reactivity.
  vectorStore.clearSelected()
  snap.selectedIndices.forEach((idx) => vectorStore.addSelected(idx))
  vectorStore.savedProperties = snap.savedProperties
  vectorStore.transformMode = snap.transformMode
  vectorStore.highestKey = snap.highestKey
  vectorStore.redoStackHeld = snap.redoStackHeld
  vectorStore.shapeCenterX = snap.shapeCenterX
  vectorStore.shapeCenterY = snap.shapeCenterY
  vectorStore.grabStartShapeCenterX = snap.grabStartShapeCenterX
  vectorStore.grabStartShapeCenterY = snap.grabStartShapeCenterY
  vectorStore.grabStartAngle = snap.grabStartAngle
}
