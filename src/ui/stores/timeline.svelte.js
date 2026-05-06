/**
 * Central reactive store for the undo/redo timeline. Holds both the
 * raw undo/redo stacks and a sanitized variant used for lightweight
 * comparisons that strips large binary payloads.
 * `savedBetweenActionImages` caches canvas snapshots taken between
 * discrete actions so they can be replayed without re-executing every
 * stroke. `activeIndexes` tracks which history entries are currently
 * highlighted in the timeline UI.
 */
export const timelineStore = $state({
  undoStack: [],
  redoStack: [],
  currentAction: null,
  sanitizedUndoStack: [],
  activeIndexes: [],
  savedBetweenActionImages: [],
  points: [],
  /**
   * Resets the in-progress stroke point list. Called at the start of a
   * new stroke so accumulated points from the previous gesture do not
   * bleed into the next action.
   */
  clearPoints() {
    this.points = []
  },
  /**
   * Appends a raw input coordinate to the current stroke. Points are
   * batched here during a gesture and consumed when the action commits,
   * keeping the hot path allocation-free between individual samples.
   * @param {object} pt - The coordinate to append.
   */
  addPoint(pt) {
    this.points.push(pt)
  },
  /**
   * Empties the active-index list. Called when transitioning between
   * actions so stale selections from the previous action do not persist
   * into the next one.
   */
  clearActiveIndexes() {
    this.activeIndexes = []
  },
  /**
   * Drops all cached between-action canvas snapshots. Called at the
   * start of a new recording session or after the navigator has consumed
   * the images to prevent unbounded memory growth.
   */
  clearSavedBetweenActionImages() {
    this.savedBetweenActionImages = []
  },
})

/**
 * Captures the current timeline state as a plain object. Svelte $state
 * proxies cannot be reliably serialized or compared by identity, so the
 * navigator calls this before entering playback mode to get a stable
 * restore point. The returned object holds live array references —
 * callers that need isolation must clone it themselves.
 * @returns {object} Shallow snapshot of all timeline store fields.
 */
export function snapshotTimeline() {
  return {
    undoStack: timelineStore.undoStack,
    redoStack: timelineStore.redoStack,
    currentAction: timelineStore.currentAction,
    sanitizedUndoStack: timelineStore.sanitizedUndoStack,
    activeIndexes: timelineStore.activeIndexes,
    savedBetweenActionImages: timelineStore.savedBetweenActionImages,
    points: timelineStore.points,
  }
}

/**
 * Overwrites every field in the timeline store from a snapshot produced
 * by `snapshotTimeline`. Called by the navigator to jump to a saved
 * point in time. Fields are replaced wholesale rather than merged so
 * that any state accumulated during playback is fully cleared on restore.
 * @param {object} snap - A snapshot returned by `snapshotTimeline`.
 */
export function restoreTimeline(snap) {
  timelineStore.undoStack = snap.undoStack
  timelineStore.redoStack = snap.redoStack
  timelineStore.currentAction = snap.currentAction
  timelineStore.sanitizedUndoStack = snap.sanitizedUndoStack
  timelineStore.activeIndexes = snap.activeIndexes
  timelineStore.savedBetweenActionImages = snap.savedBetweenActionImages
  timelineStore.points = snap.points
}
