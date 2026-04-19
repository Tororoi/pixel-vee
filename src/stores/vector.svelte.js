import { SvelteSet } from 'svelte/reactivity'
import { TRANSLATE } from '../utils/constants.js'

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
