import { dom } from "../../Context/dom.js"
import { state } from "../../Context/state.js"
import { vectorGui } from "../../GUI/vector.js"
import { clearOffscreenCanvas, renderCanvas } from "../../Canvas/render.js"
import { renderVectorsToDOM, renderLayersToDOM } from "../../DOM/render.js"
import { removeTempLayerFromDOM } from "../../DOM/renderLayers.js"
import { SCALE } from "../../utils/constants.js"
import { setVectorShapeBoundaryBox } from "../../GUI/transform.js"

/**
 * @description This function is used to render the canvas to the most recent action in the undoStack. It is used in the undo and redo functions.
 * @param {object} latestAction - The action about to be undone or redone
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
export function renderToLatestAction(latestAction, modType) {
  //clear affected layer and render image from most recent action from the affected layer
  //This avoids having to redraw the timeline for every undo/redo. Close to constant time whereas redrawTimeline is closer to exponential time or worse.
  let mostRecentActionFromSameLayer = null
  for (let i = state.timeline.undoStack.length - 1; i >= 0; i--) {
    if (state.timeline.undoStack[i].layer === latestAction.layer) {
      mostRecentActionFromSameLayer = state.timeline.undoStack[i]
      break
    }
  }
  //Set selection state based on absolute most recent action
  const mostRecentAction = state.timeline.undoStack[state.timeline.undoStack.length - 1]
  //set select properties
  state.selection.properties = {
    ...mostRecentAction.selectProperties,
  }
  //set boundary box
  state.selection.setBoundaryBox(state.selection.properties)
  //set mask set
  state.selection.maskSet = mostRecentAction.maskSet
    ? new Set(mostRecentAction.maskSet)
    : null
  //set selected vectors
  state.vector.selectedIndices = new Set(
    mostRecentAction.selectedVectorIndices
  )
  if (state.vector.selectedIndices.size > 0) {
    dom.vectorTransformUIContainer.style.display = "flex"
    if (state.vector.transformMode === SCALE) {
      setVectorShapeBoundaryBox()
    }
  } else {
    dom.vectorTransformUIContainer.style.display = "none"
  }
  //set current vector index
  if (mostRecentAction.currentVectorIndex !== null) {
    vectorGui.setVectorProperties(
      state.vector.all[mostRecentAction.currentVectorIndex]
    )
  }
  //Confirm a valid snapshot (may need to be updated for some actions)
  const snapshotIsValid = mostRecentActionFromSameLayer?.snapshot
  //Re-render the layer that was associated with the undone/redone action
  if (snapshotIsValid) {
    clearOffscreenCanvas(mostRecentActionFromSameLayer.layer)
    let img = new Image()
    img.src = mostRecentActionFromSameLayer.snapshot
    img.onload = function () {
      mostRecentActionFromSameLayer.layer.ctx.drawImage(img, 0, 0)
      renderCanvas(mostRecentActionFromSameLayer.layer)
      //remove temporary layer if redoing a confirm paste action. Must be done after the action is pushed to the undoStack and rendered on canvas layer for render to look clean
      if (
        latestAction.tool === "paste" &&
        latestAction.confirmed &&
        modType === "to"
      ) {
        //remove temp layer from DOM and restore current layer
        removeTempLayerFromDOM()
      }
      renderLayersToDOM()
      renderVectorsToDOM()
      state.reset()
      vectorGui.render()
    }
  } else {
    //no snapshot
    if (latestAction.layer.type === "reference") {
      renderCanvas(latestAction.layer)
    } else {
      renderCanvas(latestAction.layer, true)
      //create snapshot for latest action. Normally actions will have a snapshot
      //but since snapshots are discarded when saving a file, this code remakes the correct snapshot for an action.
      //On subsequent undo and redo calls, the timeline will not have to be redrawn for the affected action since it will have a snapshot.
      if (mostRecentActionFromSameLayer) {
        let snapshot =
          mostRecentActionFromSameLayer.layer.type === "raster"
            ? mostRecentActionFromSameLayer.layer.cvs.toDataURL()
            : null
        mostRecentActionFromSameLayer.snapshot = snapshot
      }
    }
    //remove temporary layer if redoing a confirm paste action. Must be done after the action is pushed to the undoStack and rendered on canvas layer for render to look clean
    if (
      latestAction.tool === "paste" &&
      latestAction.confirmed &&
      modType === "to"
    ) {
      //remove temp layer from DOM and restore current layer
      removeTempLayerFromDOM()
    }
    renderLayersToDOM()
    renderVectorsToDOM()
    state.reset()
    vectorGui.render()
  }
}
