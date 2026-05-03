export const timelineStore = $state({
  undoStack: [],
  redoStack: [],
  currentAction: null,
  sanitizedUndoStack: [],
  activeIndexes: [],
  savedBetweenActionImages: [],
  points: [],
  clearPoints() {
    this.points = []
  },
  addPoint(pt) {
    this.points.push(pt)
  },
  clearActiveIndexes() {
    this.activeIndexes = []
  },
  clearSavedBetweenActionImages() {
    this.savedBetweenActionImages = []
  },
})

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

export function restoreTimeline(snap) {
  timelineStore.undoStack = snap.undoStack
  timelineStore.redoStack = snap.redoStack
  timelineStore.currentAction = snap.currentAction
  timelineStore.sanitizedUndoStack = snap.sanitizedUndoStack
  timelineStore.activeIndexes = snap.activeIndexes
  timelineStore.savedBetweenActionImages = snap.savedBetweenActionImages
  timelineStore.points = snap.points
}
