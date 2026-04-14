import { TRANSLATE, ROTATE, SCALE } from '../utils/constants.js'
import { dom } from '../Context/dom.js'
import { globalState } from '../Context/state.js'
import { vectorGui } from './vector.js'
import { setVectorShapeBoundaryBox } from './transform.js'
import { bump } from '../hooks/appState.svelte.js'

/**
 * Switches the vector transform mode
 * @param {string} mode - translate, rotate, or scale
 */
export function switchVectorTransformMode(mode) {
  globalState.vector.transformMode = mode
  vectorGui.render()
  bump()
}

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

// Only wire up the legacy DOM listener if the element exists (pre-React fallback).
if (dom.vectorTransformModeContainer) {
  dom.vectorTransformModeContainer.addEventListener('click', (e) => {
    switch (e.target.id) {
      case TRANSLATE:
        globalState.selection.resetProperties()
        globalState.selection.resetBoundaryBox()
        switchVectorTransformMode(TRANSLATE)
        break
      case ROTATE:
        globalState.selection.resetProperties()
        globalState.selection.resetBoundaryBox()
        switchVectorTransformMode(ROTATE)
        break
      case SCALE:
        setVectorShapeBoundaryBox()
        switchVectorTransformMode(SCALE)
        break
      default:
      //do nothing
    }
  })
}
