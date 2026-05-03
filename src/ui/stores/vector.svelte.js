import { SvelteSet } from 'svelte/reactivity'
import { TRANSLATE } from '../../utils/constants.js'

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
  setCurrentIndex(idx) {
    this.currentIndex = idx
  },
  nextKey() {
    this.highestKey += 1
    return this.highestKey
  },
  addSelected(idx) {
    this.selectedIndices.add(idx)
  },
  removeSelected(idx) {
    this.selectedIndices.delete(idx)
  },
  clearSelected() {
    this.selectedIndices.clear()
  },
  setTransformMode(mode) {
    this.transformMode = mode
  },
})

export function snapshotVector() {
  return {
    properties: { ...vectorStore.properties },
    all: { ...vectorStore.all },
    currentIndex: vectorStore.currentIndex,
    collidedIndex: vectorStore.collidedIndex,
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

export function restoreVector(snap) {
  vectorStore.properties = snap.properties
  vectorStore.all = snap.all
  vectorStore.setCurrentIndex(snap.currentIndex)
  vectorStore.collidedIndex = snap.collidedIndex
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
