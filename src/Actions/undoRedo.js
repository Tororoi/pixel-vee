import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { vectorGui } from "../GUI/vector.js"
import { clearOffscreenCanvas, renderCanvas } from "../Canvas/render.js"
import { renderVectorsToDOM, renderLayersToDOM } from "../DOM/render.js"
import { setSaveFilesizePreview } from "../Save/savefile.js"
import { pasteSelectedPixels } from "../Menu/edit.js"
import { switchTool } from "../Tools/toolbox.js"
import { removeTempLayerFromDOM } from "../DOM/renderLayers.js"
import {
  disableActionsForPaste,
  enableActionsForNoPaste,
} from "../DOM/disableDomElements.js"
import { transformRasterContent } from "../utils/transformHelpers.js"

//====================================//
//========= * * * Core * * * =========//
//====================================//

/**
 * @description This function is used to render the canvas to the most recent action in the undoStack. It is used in the undo and redo functions.
 * @param {object} latestAction - The action about to be undone or redone
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
function renderToLatestAction(latestAction, modType) {
  //clear affected layer and render image from most recent action from the affected layer
  //This avoids having to redraw the timeline for every undo/redo. Close to constant time whereas redrawTimeline is closer to exponential time or worse.
  let mostRecentActionFromSameLayer = null
  for (let i = state.undoStack.length - 1; i >= 0; i--) {
    if (state.undoStack[i].layer === latestAction.layer) {
      mostRecentActionFromSameLayer = state.undoStack[i]
      break
    }
  }
  if (mostRecentActionFromSameLayer?.snapshot) {
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

/**
 * @description This function is used to handle the modify action. It is used in the undo and redo functions.
 * @param {object} latestAction - The action about to be undone or redone
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
function handleModifyAction(latestAction, modType) {
  //for each processed action,
  latestAction.processedActions.forEach((mod) => {
    //find the action in the undoStack
    const moddedVector = state.vectors[mod.moddedVectorIndex] // need to check if this is a vector action and if it is, set the vector properties for the appropriate vector
    //set the vectorProperties to the modded action's vectorProperties
    moddedVector.vectorProperties = {
      ...mod[modType],
    }
  })
  const primaryModdedVector = state.vectors[latestAction.moddedVectorIndex]
  if (
    state.tool.name === primaryModdedVector.vectorProperties.type &&
    state.currentVectorIndex === primaryModdedVector.index
  ) {
    vectorGui.setVectorProperties(primaryModdedVector)
  }
}

/**
 * @description This function is used to handle the clear action. It is used in the undo and redo functions.
 * @param {object} latestAction - The action about to be undone or redone
 */
function handleClearAction(latestAction) {
  let upToIndex = latestAction.upToIndex
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    if (i > upToIndex) {
      return
    }
    i++
    if (action.layer === canvas.currentLayer) {
      action.removed = !action.removed
      if (action.vectorIndices) {
        action.vectorIndices.forEach((vectorIndex) => {
          state.vectors[vectorIndex].removed =
            !state.vectors[vectorIndex].removed
        })
      }
    }
  })
  vectorGui.reset()
}

/**
 * @description This function is used to handle the select action. It is used in the undo and redo functions.
 * @param {object} latestAction - The action about to be undone or redone
 * @param {object} newLatestAction - The action that's about to be the most recent action, if the function is "Undo" ("from")
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
function handleSelectAction(latestAction, newLatestAction, modType) {
  if (modType === "to") {
    if (latestAction.deselect) {
      state.deselect()
    } else {
      //set select properties
      state.selectProperties = {
        ...latestAction.selectProperties,
      }
      //set boundary box
      state.setBoundaryBox(state.selectProperties)
      //set maskset
      // state.maskSet = new Set(latestAction.maskArray)
      state.selectedVectorIndicesSet = new Set(
        latestAction.selectedVectorIndices
      )
    }
  } else if (modType === "from") {
    if (latestAction.deselect) {
      //set select properties
      state.selectProperties = {
        ...latestAction.selectProperties,
      }
      //set boundary box
      state.setBoundaryBox(state.selectProperties)
      //set maskset
      // state.maskSet = new Set(latestAction.maskArray)
      state.selectedVectorIndicesSet = new Set(
        latestAction.selectedVectorIndices
      )
    } else {
      if (
        ((newLatestAction?.selectProperties &&
          newLatestAction.selectProperties.px1 !== null) ||
          newLatestAction?.selectedVectorIndices?.length > 0 ||
          latestAction.preActionSelectedVectorIndices?.length > 0) &&
        !newLatestAction?.deselect
      ) {
        //set select properties
        state.selectProperties = {
          ...newLatestAction.selectProperties,
        }
        //set boundary box
        state.setBoundaryBox(state.selectProperties)
        if (latestAction.preActionSelectedVectorIndices?.length > 0) {
          state.selectedVectorIndicesSet = new Set(
            latestAction.preActionSelectedVectorIndices
          )
        } else {
          state.selectedVectorIndicesSet = new Set(
            newLatestAction.selectedVectorIndices
          )
        }
      } else {
        state.deselect()
      }
    }
  }
}

/**
 * @param {object} latestAction - The action about to be undone or redone
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
function handlePasteAction(latestAction, modType) {
  // if modType is "from" (undoing paste action), remove the templayer
  if (modType === "from") {
    canvas.layers.splice(canvas.layers.indexOf(canvas.tempLayer), 1)
    dom.canvasLayers.removeChild(canvas.tempLayer.onscreenCvs)
    canvas.tempLayer.inactiveTools.forEach((tool) => {
      dom[`${tool}Btn`].disabled = false
      dom[`${tool}Btn`].classList.remove("deactivate-paste")
    })
    //restore the original layer
    canvas.currentLayer = latestAction.pastedLayer
    canvas.pastedLayer = null
    canvas.currentLayer.inactiveTools.forEach((tool) => {
      dom[`${tool}Btn`].disabled = true
    })
    //Handle case of selection being active before paste. Determine whether to update selection or deselect.
    if (latestAction.prePasteSelectProperties.px1 !== null) {
      state.selectProperties = {
        ...latestAction.prePasteSelectProperties,
      }
      state.setBoundaryBox(state.selectProperties)
    } else if (latestAction.prePasteSelectedVectorIndices.length > 0) {
      state.selectedVectorIndicesSet = new Set(
        latestAction.prePasteSelectedVectorIndices
      )
    } else {
      //reset state properties
      state.deselect()
    }
    enableActionsForNoPaste()
  } else if (modType === "to") {
    //if modType is "to" (redoing paste action), basically do the pasteSelectedPixels function except use the action properties instead of the clipboard and don't add to timeline
    const selectProperties = {
      ...latestAction.selectProperties,
    }
    selectProperties.px1 += latestAction.pastedLayer.x
    selectProperties.px2 += latestAction.pastedLayer.x
    selectProperties.py1 += latestAction.pastedLayer.y
    selectProperties.py2 += latestAction.pastedLayer.y
    const boundaryBox = {
      ...latestAction.boundaryBox,
    }
    boundaryBox.xMin += latestAction.pastedLayer.x
    boundaryBox.xMax += latestAction.pastedLayer.x
    boundaryBox.yMin += latestAction.pastedLayer.y
    boundaryBox.yMax += latestAction.pastedLayer.y
    const clipboard = {
      selectProperties,
      boundaryBox,
      canvas: latestAction.canvas,
    }
    let offsetX = 0
    let offsetY = 0
    //BUG: raster gui not rendering properly from here
    pasteSelectedPixels(clipboard, latestAction.pastedLayer, offsetX, offsetY)
    state.selectedVectorIndicesSet.clear()
    //set currentPastedImageKey
    state.currentPastedImageKey = latestAction.pastedImageKey
    switchTool("move")
    disableActionsForPaste()
  }
}

/**
 * @param {object} latestAction - The action about to be undone or redone
 * @param {object} newLatestAction - The action that's about to be the most recent action, if the function is "Undo" ("from")
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
function handleConfirmPasteAction(latestAction, newLatestAction, modType) {
  //if modType is "from" (undoing confirm paste action), basically do the pasteSelectedPixels function except use the action properties instead of the clipboard and don't add to timeline
  if (modType === "from") {
    const clipboard = {
      selectProperties: latestAction.selectProperties,
      boundaryBox: latestAction.boundaryBox,
      canvas: latestAction.canvas,
    }
    //raster offset
    let offsetX = latestAction.layer.x
    let offsetY = latestAction.layer.y
    //vector offset
    pasteSelectedPixels(clipboard, latestAction.layer, offsetX, offsetY)
    if (newLatestAction?.tool?.name === "move") {
      //templayer's x and y coords are often reset to 0, so set them to last move action's x and y
      canvas.currentLayer.x = newLatestAction.to.x
      canvas.currentLayer.y = newLatestAction.to.y
    }
    //set currentPastedImageKey
    state.currentPastedImageKey = latestAction.pastedImageKey
    switchTool("move")
    disableActionsForPaste()
  } else if (modType === "to") {
    //if modType is "to" (redoing confirm paste action), enable actions for no temp pasted layer
    enableActionsForNoPaste()
  }
}

/**
 *
 * @param {object} latestAction - The action about to be undone or redone
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
function handleMoveAction(latestAction, modType) {
  let deltaX = latestAction[modType].x - latestAction.layer.x
  let deltaY = latestAction[modType].y - latestAction.layer.y
  //set layer x and y to modType
  latestAction.layer.x = latestAction[modType].x
  latestAction.layer.y = latestAction[modType].y
  latestAction.layer.scale = latestAction[modType].scale
  //Keep properties relative to layer offset
  if (state.vectorProperties.px1) {
    state.vectorProperties.px1 += deltaX
    state.vectorProperties.py1 += deltaY
  }
  if (state.vectorProperties.px2) {
    state.vectorProperties.px2 += deltaX
    state.vectorProperties.py2 += deltaY
  }
  if (state.vectorProperties.px3) {
    state.vectorProperties.px3 += deltaX
    state.vectorProperties.py3 += deltaY
  }
  if (state.vectorProperties.px4) {
    state.vectorProperties.px4 += deltaX
    state.vectorProperties.py4 += deltaY
  }
  //handle selection
  if (state.selectProperties.px2 !== null) {
    state.selectProperties.px1 += deltaX
    state.selectProperties.px2 += deltaX
    state.selectProperties.py1 += deltaY
    state.selectProperties.py2 += deltaY
    state.setBoundaryBox(state.selectProperties)
  }
}

/**
 *
 * @param {object} latestAction - The action about to be undone or redone
 * @param {object} newLatestAction - The action that's about to be the most recent action, if the function is "Undo" ("from")
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
function handleTransformAction(latestAction, newLatestAction, modType) {
  if (modType === "from") {
    const selectProperties = { ...newLatestAction.selectProperties }
    selectProperties.px1 += newLatestAction.layer.x
    selectProperties.px2 += newLatestAction.layer.x
    selectProperties.py1 += newLatestAction.layer.y
    selectProperties.py2 += newLatestAction.layer.y
    state.selectProperties = { ...selectProperties }
    state.setBoundaryBox(state.selectProperties)
    //Eventually undoing transform actions will result in the newLatestAction being a paste action. In that case, don't render a transformation
    if (newLatestAction.tool === "transform") {
      transformRasterContent(
        newLatestAction.layer,
        state.pastedImages[newLatestAction.pastedImageKey].imageData,
        state.boundaryBox,
        newLatestAction.transformationRotationDegrees % 360,
        newLatestAction.isMirroredHorizontally,
        newLatestAction.isMirroredVertically
      )
      state.transformationRotationDegrees =
        newLatestAction.transformationRotationDegrees
      state.isMirroredHorizontally = newLatestAction.isMirroredHorizontally
      state.isMirroredVertically = newLatestAction.isMirroredVertically
    }
  } else if (modType === "to") {
    //offset selectProperties by layer x and y
    const selectProperties = { ...latestAction.selectProperties }
    selectProperties.px1 += latestAction.layer.x
    selectProperties.px2 += latestAction.layer.x
    selectProperties.py1 += latestAction.layer.y
    selectProperties.py2 += latestAction.layer.y
    state.selectProperties = {
      ...selectProperties,
    }
    state.setBoundaryBox(state.selectProperties)
    transformRasterContent(
      latestAction.layer,
      state.pastedImages[latestAction.pastedImageKey].imageData,
      state.boundaryBox,
      latestAction.transformationRotationDegrees % 360,
      latestAction.isMirroredHorizontally,
      latestAction.isMirroredVertically
    )
    state.transformationRotationDegrees =
      latestAction.transformationRotationDegrees
    state.isMirroredHorizontally = latestAction.isMirroredHorizontally
    state.isMirroredVertically = latestAction.isMirroredVertically
  }
}

/**
 * Main pillar of the code structure - command pattern
 * @param {Array} pushStack - The stack to push the action to
 * @param {Array} popStack - The stack to pop the action from
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
export function actionUndoRedo(pushStack, popStack, modType) {
  //latest action is the action about to be undone or redone
  let latestAction = popStack[popStack.length - 1]
  if (
    state.vectors[state.currentVectorIndex]?.actionIndex === latestAction.index
  ) {
    //reset vectorGui if the latest action has the current vector
    vectorGui.reset()
  }
  //newLatestAction is the action that's about to be the most recent action, if the function is "Undo" ("from")
  let newLatestAction =
    modType === "from" && popStack.length > 1
      ? popStack[popStack.length - 2]
      : null
  if (modType === "from" && popStack.length > 1) {
    if (newLatestAction.tool === "modify") {
      //If action is modif, new latest action will be considered the modded action
      newLatestAction = popStack[newLatestAction.moddedActionIndex]
    }
  }
  if (latestAction.tool === "modify") {
    handleModifyAction(latestAction, modType)
  } else if (latestAction.tool === "changeMode") {
    state.undoStack[latestAction.moddedActionIndex].modes = {
      ...latestAction[modType],
    }
  } else if (latestAction.tool === "changeColor") {
    state.undoStack[latestAction.moddedActionIndex].color = {
      ...latestAction[modType],
    }
  } else if (latestAction.tool === "remove") {
    if (latestAction.moddedVectorIndex !== undefined) {
      //If the remove action has a vector index, set the vector's removed property
      state.undoStack[latestAction.moddedActionIndex].vectors[
        latestAction.moddedVectorIndex
      ].removed = latestAction[modType]
    } else {
      //If the remove action only has a modded action index, set the removed property of the action
      state.undoStack[latestAction.moddedActionIndex].removed =
        latestAction[modType]
    }
  } else if (latestAction.tool === "clear") {
    handleClearAction(latestAction)
  } else if (latestAction.tool === "addLayer") {
    if (modType === "from") {
      //If undoing addLayer, remove layer from canvas
      latestAction.layer.removed = true
    } else if (modType === "to") {
      //If redoing addLayer, add layer to canvas
      latestAction.layer.removed = false
    }
  } else if (latestAction.tool === "removeLayer") {
    if (modType === "from") {
      //If undoing removeLayer, add layer to canvas
      latestAction.layer.removed = false
    } else if (modType === "to") {
      //If redoing removeLayer, remove layer from canvas
      latestAction.layer.removed = true
    }
  } else if (latestAction.tool === "select") {
    handleSelectAction(latestAction, newLatestAction, modType)
  } else if (latestAction.tool === "paste") {
    if (!latestAction.confirmed) {
      handlePasteAction(latestAction, modType)
    } else {
      handleConfirmPasteAction(latestAction, newLatestAction, modType)
    }
  } else if (latestAction.tool === "vectorPaste") {
    if (modType === "from") {
      //Handle case of selection being active before paste. Determine whether to update selection or deselect.
      if (latestAction.prePasteSelectProperties.px1 !== null) {
        state.selectProperties = {
          ...latestAction.prePasteSelectProperties,
        }
        state.setBoundaryBox(state.selectProperties)
      } else if (latestAction.prePasteSelectedVectorIndices.length > 0) {
        state.selectedVectorIndicesSet = new Set(
          latestAction.prePasteSelectedVectorIndices
        )
      } else {
        //reset state properties
        state.deselect()
      }
    } else if (modType === "to") {
      state.selectedVectorIndicesSet.clear()
      latestAction.vectorIndices.forEach((vectorIndex) => {
        state.selectedVectorIndicesSet.add(vectorIndex)
      })
    }
  } else if (latestAction.tool === "move") {
    handleMoveAction(latestAction, modType)
  } else if (latestAction.tool === "transform") {
    handleTransformAction(latestAction, newLatestAction, modType)
  } else if (
    latestAction.tool === state.tool.name &&
    state.tool.type === "vector"
  ) {
    //When redoing a vector's initial action while the matching tool is selected, set vectorProperties
    if (modType === "to") {
      //TODO: (Low Priority) Which vector should be selected if there are multiple vectors in the action? First or last?
      //Get first vector in the action
      let latestVector = state.vectors[latestAction.vectorIndices[0]]
      vectorGui.setVectorProperties(latestVector)
    }
  }
  pushStack.push(popStack.pop())
  //For undo, if new latest action or new latest modded action will be a vector and its tool is currently selected, set vector properties to match
  if (newLatestAction) {
    if (
      newLatestAction.tool === state.tool.name &&
      state.tool.type === "vector" &&
      state.currentVectorIndex === null
    ) {
      //When redoing a vector's initial action while the matching tool is selected, set vectorProperties
      let newLatestVector = state.vectors[newLatestAction.vectorIndices[0]]
      vectorGui.setVectorProperties(newLatestVector)
    }
  }
  //Render the canvas with the new latest action
  renderToLatestAction(latestAction, modType)
  //Recalculate size of file if save dialog is open
  if (state.saveDialogOpen) {
    setSaveFilesizePreview()
  }
}

/**
 * Undo an action
 */
export function handleUndo() {
  //length 1 prevents initial layer from being undone
  if (state.undoStack.length > 1) {
    actionUndoRedo(state.redoStack, state.undoStack, "from")
  }
}

/**
 * Redo an action
 */
export function handleRedo() {
  if (state.redoStack.length >= 1) {
    actionUndoRedo(state.undoStack, state.redoStack, "to")
  }
}

/**
 * This sets the action which is then pushed to the undoStack for the command pattern
 * action and redoStack are not reset here in order to allow some functionality based around checking if an action was just added to the timeline. TODO: (Low Priority) refactor to use a different method for this
 * @param {object} actionObject - The action object to be added to the timeline
 */
export function addToTimeline(actionObject) {
  const { tool, layer, properties } = actionObject
  //use current state for variables
  let snapshot = layer.type === "raster" ? layer.cvs.toDataURL() : null
  state.action = {
    index: state.undoStack.length,
    tool,
    layer,
    ...properties,
    hidden: false,
    removed: false,
    snapshot,
  }
  state.undoStack.push(state.action)
  if (state.saveDialogOpen) {
    setSaveFilesizePreview()
  }
}
