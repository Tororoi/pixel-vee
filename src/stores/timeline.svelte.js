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
