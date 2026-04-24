import { dom } from '../../Context/dom.js'
import { globalState } from '../../Context/state.js'
import { vectorGui } from '../../GUI/vector.js'
import { clearOffscreenCanvas, renderCanvas } from '../../Canvas/render.js'
import { updateActiveLayerState, removeTempLayer } from '../../DOM/render.js'
import { SCALE } from '../../utils/constants.js'
import { setVectorShapeBoundaryBox } from '../../GUI/transform.js'

/**
 * Re-render the canvas and restore all UI state after an undo or redo step.
 *
 * After the undo/redo state machine mutates the relevant data (vectors,
 * layers, selection, etc.), this function is responsible for making the
 * canvas visually reflect the new state and restoring all selection and
 * vector GUI properties to match the action now at the top of the undo stack.
 *
 * Performance strategy: instead of replaying the entire timeline from scratch
 * (which grows more expensive as history lengthens), this function finds the
 * most recent action from the SAME layer and restores its pixel snapshot
 * directly. This is close to constant-time. Full timeline replay is only used
 * as a fallback when no valid snapshot exists (e.g. after loading a saved file
 * that does not store snapshots).
 *
 * Special cases:
 *  - Resize actions always trigger a full timeline replay because every layer
 *    must be redrawn against the new canvas dimensions.
 *  - When redoing a confirmed paste, the temporary floating layer is removed
 *    after the snapshot is applied so the DOM is left in a clean state.
 *  - When no snapshot is found, a new one is generated from the resulting
 *    canvas state so subsequent undo/redo operations can use the fast path.
 * @param {object} latestAction - The action that was just undone or redone.
 * @param {string} modType - `"from"` for undo; `"to"` for redo.
 */
export function renderToLatestAction(latestAction, modType) {
  // Resize actions: handleResizeAction already applied the correct canvas dimensions
  // and cropOffset. Replay the full timeline so all layers reflect the new settings.
  if (latestAction.tool === 'resize') {
    renderCanvas(null, true)
    updateActiveLayerState()
    globalState.reset()
    vectorGui.render()
    return
  }

  // Find the most recent action targeting the same layer so its snapshot can
  // be used to restore pixels without replaying the full timeline.
  let mostRecentActionFromSameLayer = null
  for (let i = globalState.timeline.undoStack.length - 1; i >= 0; i--) {
    if (globalState.timeline.undoStack[i].layer === latestAction.layer) {
      mostRecentActionFromSameLayer = globalState.timeline.undoStack[i]
      break
    }
  }
  // Restore selection, mask, and vector state from the action now at the
  // very top of the undo stack (the new "current" state).
  const mostRecentAction =
    globalState.timeline.undoStack[globalState.timeline.undoStack.length - 1]
  //set select properties
  globalState.selection.properties = {
    ...mostRecentAction.selectProperties,
  }
  //set boundary box
  globalState.selection.setBoundaryBox(globalState.selection.properties)
  //set mask set
  globalState.selection.maskSet = mostRecentAction.maskSet
    ? new Set(mostRecentAction.maskSet)
    : null
  //set selected vectors
  globalState.vector.selectedIndices = new Set(
    mostRecentAction.selectedVectorIndices,
  )
  // Show or hide the vector transform panel depending on whether any
  // vectors are selected in the restored state.
  if (globalState.vector.selectedIndices.size > 0) {
    globalState.ui.vectorTransformOpen = true
    if (dom.vectorTransformUIContainer)
      dom.vectorTransformUIContainer.style.display = 'flex'
    if (globalState.vector.transformMode === SCALE) {
      setVectorShapeBoundaryBox()
    }
  } else {
    globalState.ui.vectorTransformOpen = false
    if (dom.vectorTransformUIContainer)
      dom.vectorTransformUIContainer.style.display = 'none'
  }
  //set current vector index
  if (mostRecentAction.currentVectorIndex !== null) {
    vectorGui.setVectorProperties(
      globalState.vector.all[mostRecentAction.currentVectorIndex],
    )
  }
  //Confirm a valid snapshot (may need to be updated for some actions)
  const snapshotIsValid = mostRecentActionFromSameLayer?.snapshot
  //Re-render the layer that was associated with the undone/redone action
  if (snapshotIsValid) {
    // Fast path: restore pixels directly from the stored snapshot image.
    clearOffscreenCanvas(mostRecentActionFromSameLayer.layer)
    let img = new Image()
    img.src = mostRecentActionFromSameLayer.snapshot
    img.onload = function () {
      mostRecentActionFromSameLayer.layer.ctx.drawImage(img, 0, 0)
      renderCanvas(mostRecentActionFromSameLayer.layer)
      // Remove the temp layer only after rendering to keep the transition
      // visually clean when redoing a confirmed paste.
      if (
        latestAction.tool === 'paste' &&
        latestAction.confirmed &&
        modType === 'to'
      ) {
        //remove temp layer from DOM and restore current layer
        removeTempLayer()
      }
      updateActiveLayerState()
      globalState.reset()
      vectorGui.render()
    }
  } else {
    // Slow path: replay the full timeline for this layer to reconstruct the
    // pixel content, then cache the result as a new snapshot.
    if (latestAction.layer.type === 'reference') {
      renderCanvas(latestAction.layer)
    } else {
      renderCanvas(latestAction.layer, true)
      // Cache the result so future undo/redo steps can use the fast path
      // instead of replaying the timeline again.
      if (mostRecentActionFromSameLayer) {
        let snapshot =
          mostRecentActionFromSameLayer.layer.type === 'raster'
            ? mostRecentActionFromSameLayer.layer.cvs.toDataURL()
            : null
        mostRecentActionFromSameLayer.snapshot = snapshot
      }
    }
    //remove temporary layer if redoing a confirm paste action. Must be done after the action is pushed to the undoStack and rendered on canvas layer for render to look clean
    if (
      latestAction.tool === 'paste' &&
      latestAction.confirmed &&
      modType === 'to'
    ) {
      //remove temp layer from DOM and restore current layer
      removeTempLayer()
    }
    updateActiveLayerState()
    globalState.reset()
    vectorGui.render()
  }
}
