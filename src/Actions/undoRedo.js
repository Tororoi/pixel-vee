import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { clearOffscreenCanvas, renderCanvas } from "../Canvas/render.js"
import {
  renderVectorsToDOM,
  renderLayersToDOM,
  renderBrushModesToDOM,
} from "../DOM/render.js"
import { setSaveFilesizePreview } from "../Save/savefile.js"
import {
  copySelectedPixels,
  pasteSelectedPixels,
  confirmPastedPixels,
} from "../Menu/edit.js"
import { switchTool } from "../Tools/toolbox.js"
import { removeTempLayerFromDOM } from "../DOM/renderLayers.js"

//====================================//
//========= * * * Core * * * =========//
//====================================//

/**
 * This sets the action which is then pushed to the undoStack for the command pattern
 * @param {Object} actionObject
 */
export function addToTimeline(actionObject) {
  const { tool, color, layer, properties } = actionObject
  //use current state for variables
  let snapshot = layer.type === "raster" ? layer.cvs.toDataURL() : null
  state.action = {
    tool: { ...tool }, //Needed properties: name, brushType, brushSize, type
    modes: { ...tool.modes },
    color: color || { ...swatches.primary.color },
    layer: layer,
    properties,
    hidden: false,
    removed: false,
    snapshot,
  }
  state.undoStack.push(state.action)
  if (state.saveDialogOpen) {
    setSaveFilesizePreview()
  }
}

/**
 * @param {Object} latestAction
 * @param {String} modType
 */
function handleModifyAction(latestAction, modType) {
  //for each processed action,
  latestAction.properties.processedActions.forEach((mod) => {
    //find the action in the undoStack
    const moddedAction = state.undoStack[mod.moddedActionIndex]
    //set the vectorProperties to the modded action's vectorProperties
    moddedAction.properties.vectorProperties = {
      ...mod[modType],
    }
  })
  const primaryModdedAction =
    state.undoStack[latestAction.properties.moddedActionIndex]
  // moddedAction.properties.vectorProperties = {
  //   ...latestAction.properties[modType],
  // }
  if (state.tool.name === primaryModdedAction.tool.name) {
    vectorGui.reset()
    vectorGui.setVectorProperties(primaryModdedAction)
    vectorGui.render()
  }
}

/**
 * @param {Object} latestAction
 */
function handleClearAction(latestAction) {
  let upToIndex = latestAction.properties.upToIndex
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  state.undoStack.forEach((action) => {
    if (i > upToIndex) {
      return
    }
    i++
    if (action.layer === canvas.currentLayer) {
      action.removed = !action.removed
    }
  })
  vectorGui.reset()
}

/**
 * @param {Object} latestAction
 * @param {Object} newLatestAction
 * @param {String} modType
 */
function handleSelectAction(latestAction, newLatestAction, modType) {
  if (modType === "to") {
    if (latestAction.properties.deselect) {
      state.deselect()
      canvas.rasterGuiCTX.clearRect(
        0,
        0,
        canvas.rasterGuiCVS.width,
        canvas.rasterGuiCVS.height
      )
    } else {
      //set select properties
      state.selectProperties = {
        ...latestAction.properties.selectProperties,
      }
      //set boundary box
      state.setBoundaryBox(state.selectProperties)
      //set inverse selection
      state.selectionInversed = latestAction.properties.invertSelection
      //set maskset
      // state.maskSet = new Set(latestAction.maskArray)
    }
  } else if (modType === "from") {
    if (latestAction.properties.deselect) {
      //set select properties
      state.selectProperties = {
        ...latestAction.properties.selectProperties,
      }
      //set boundary box
      state.setBoundaryBox(state.selectProperties)
      //set inverse selection
      state.selectionInversed = latestAction.properties.invertSelection
      //set maskset
      // state.maskSet = new Set(latestAction.maskArray)
    } else if (
      newLatestAction?.tool?.name === "select" &&
      !newLatestAction?.properties?.deselect
    ) {
      //If the action before the one being undone is a select tool, set context - may need to separate this from latestAction also being the "select" tool
      //set select properties
      state.selectProperties = {
        ...newLatestAction.properties.selectProperties,
      }
      //set boundary box
      state.setBoundaryBox(state.selectProperties)
      //set inverse selection
      state.selectionInversed = newLatestAction.properties.invertSelection
      //set maskset
      // state.maskSet = new Set(newLatestAction.maskArray)
    } else {
      if (newLatestAction.properties?.selectProperties?.px1 !== null) {
        //set select properties
        state.selectProperties = {
          ...newLatestAction.properties.selectProperties,
        }
        //set boundary box
        state.setBoundaryBox(state.selectProperties)
        //set inverse selection
        state.selectionInversed = newLatestAction.properties.invertSelection
      } else {
        state.deselect()
        canvas.rasterGuiCTX.clearRect(
          0,
          0,
          canvas.rasterGuiCVS.width,
          canvas.rasterGuiCVS.height
        )
      }
    }
  }
  vectorGui.render()
}

/**
 * @param {Object} latestAction
 * @param {String} modType
 */
function handlePasteAction(latestAction, modType) {
  // if modType is "from" (undoing paste action), remove the templayer
  if (modType === "from") {
    canvas.layers.splice(canvas.layers.indexOf(canvas.tempLayer), 1)
    dom.canvasLayers.removeChild(canvas.tempLayer.onscreenCvs)
    canvas.tempLayer.inactiveTools.forEach((tool) => {
      dom[`${tool}Btn`].disabled = false
    })
    //restore the original layer
    canvas.currentLayer = latestAction.properties.pastedLayer
    canvas.pastedLayer = null
    canvas.currentLayer.inactiveTools.forEach((tool) => {
      dom[`${tool}Btn`].disabled = true
    })
    //Handle case of selection being active before paste. Determine whether to update selection or deselect.
    if (latestAction.properties.prePasteSelectProperties.px1 !== null) {
      state.selectProperties = {
        ...latestAction.properties.prePasteSelectProperties,
      }
      state.setBoundaryBox(state.selectProperties)
      //set inverse selection
      state.selectionInversed = latestAction.properties.prePasteInvertSelection
    } else {
      //reset state properties
      state.deselect()
      canvas.rasterGuiCTX.clearRect(
        0,
        0,
        canvas.rasterGuiCVS.width,
        canvas.rasterGuiCVS.height
      )
    }
    vectorGui.render()
  } else if (modType === "to") {
    //if modType is "to" (redoing paste action), basically do the pasteSelectedPixels function except use the action properties instead of the clipboard and don't add to timeline
    pasteSelectedPixels(
      latestAction.properties,
      latestAction.properties.pastedLayer
    )
    switchTool("move")
  }
}

/**
 * @param {Object} latestAction
 * @param {Object} newLatestAction
 * @param {String} modType
 */
function handleConfirmPasteAction(latestAction, newLatestAction, modType) {
  //if modType is "from" (undoing confirm paste action), basically do the pasteSelectedPixels function except use the action properties instead of the clipboard and don't add to timeline
  if (modType === "from") {
    pasteSelectedPixels(latestAction.properties, latestAction.layer, true)
    if (newLatestAction?.tool?.name === "move") {
      //templayer's x and y coords are often reset to 0, so set them to last move action's x and y
      canvas.currentLayer.x = newLatestAction.properties.to.x
      canvas.currentLayer.y = newLatestAction.properties.to.y
    }
    switchTool("move")
  } else if (modType === "to") {
    //if modType is "to" (redoing confirm paste action), basically do the confirmPastedPixels function except use the action properties instead of the clipboard and don't add to timeline. Also don't need to adjust for layer offset
    // confirmPastedPixels(
    //   latestAction.properties.canvas,
    //   latestAction.properties.boundaryBox,
    //   latestAction.layer,
    //   latestAction.properties.xOffset,
    //   latestAction.properties.yOffset
    // )
    removeTempLayerFromDOM()
    //reset state properties
    // state.deselect()
    // canvas.rasterGuiCTX.clearRect(
    //   0,
    //   0,
    //   canvas.rasterGuiCVS.width,
    //   canvas.rasterGuiCVS.height
    // )
    //render
    vectorGui.render()
  }
}

/**
 *
 * @param {Object} latestAction
 * @param {String} modType
 */
function handleMoveAction(latestAction, modType) {
  let deltaX = latestAction.properties[modType].x - latestAction.layer.x
  let deltaY = latestAction.properties[modType].y - latestAction.layer.y
  //set layer x and y to modType
  latestAction.layer.x = latestAction.properties[modType].x
  latestAction.layer.y = latestAction.properties[modType].y
  latestAction.layer.scale = latestAction.properties[modType].scale
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
  vectorGui.render()
}

/**
 * Main pillar of the code structure - command pattern
 * @param {Array} pushStack
 * @param {Array} popStack
 * @param {String} modType - "from" or "to", used for modify actions
 */
export function actionUndoRedo(pushStack, popStack, modType) {
  vectorGui.reset()
  //latest action is the action about to be undone or redone
  let latestAction = popStack[popStack.length - 1]
  //newLatestAction is the action that's about to be the most recent action, if the function is "Undo" ("from")
  let newLatestAction =
    modType === "from" && popStack.length > 1
      ? popStack[popStack.length - 2]
      : null
  if (modType === "from" && popStack.length > 1) {
    if (newLatestAction.tool.name === "modify") {
      //If action is modif, new latest action will be considered the modded action
      newLatestAction = popStack[newLatestAction.properties.moddedActionIndex]
    }
  }
  if (latestAction.tool.name === "modify") {
    handleModifyAction(latestAction, modType)
  } else if (latestAction.tool.name === "changeMode") {
    state.undoStack[latestAction.properties.moddedActionIndex].modes = {
      ...latestAction.properties[modType],
    }
  } else if (latestAction.tool.name === "changeColor") {
    state.undoStack[latestAction.properties.moddedActionIndex].color = {
      ...latestAction.properties[modType],
    }
  } else if (latestAction.tool.name === "remove") {
    state.undoStack[latestAction.properties.moddedActionIndex].removed =
      latestAction.properties[modType]
  } else if (latestAction.tool.name === "clear") {
    handleClearAction(latestAction)
  } else if (latestAction.tool.name === "addLayer") {
    if (modType === "from") {
      //If undoing addLayer, remove layer from canvas
      latestAction.layer.removed = true
    } else if (modType === "to") {
      //If redoing addLayer, add layer to canvas
      latestAction.layer.removed = false
    }
  } else if (latestAction.tool.name === "removeLayer") {
    if (modType === "from") {
      //If undoing removeLayer, add layer to canvas
      latestAction.layer.removed = false
    } else if (modType === "to") {
      //If redoing removeLayer, remove layer from canvas
      latestAction.layer.removed = true
    }
  } else if (latestAction.tool.name === "select") {
    handleSelectAction(latestAction, newLatestAction, modType)
  } else if (latestAction.tool.name === "paste") {
    if (!latestAction.properties.confirmed) {
      handlePasteAction(latestAction, modType)
    } else {
      handleConfirmPasteAction(latestAction, newLatestAction, modType)
    }
  } else if (latestAction.tool.name === "move") {
    handleMoveAction(latestAction, modType)
  } else if (
    latestAction.tool.name === state.tool.name &&
    latestAction.tool.type === "vector"
  ) {
    //When redoing a vector's initial action while the matching tool is selected, set vectorProperties
    if (modType === "to") {
      vectorGui.setVectorProperties(latestAction)
      vectorGui.render()
    }
  }
  pushStack.push(popStack.pop())
  //For undo, if new latest action or new latest modded action will be a vector and its tool is currently selected, set vector properties to match
  if (newLatestAction) {
    if (
      newLatestAction.tool.name === state.tool.name &&
      newLatestAction.tool.type === "vector"
    ) {
      //When redoing a vector's initial action while the matching tool is selected, set vectorProperties
      vectorGui.reset()
      vectorGui.setVectorProperties(newLatestAction)
      vectorGui.render() //render vectors after removing previous action from undoStack
    }
    //if new latest action is confirm paste, render select properties (deselect) TODO: maybe it should not be deselected on confirm
    if (
      newLatestAction.tool.name === "paste" &&
      newLatestAction.properties.confirmed
    ) {
      //reset state properties
      // state.deselect()
      // canvas.rasterGuiCTX.clearRect(
      //   0,
      //   0,
      //   canvas.rasterGuiCVS.width,
      //   canvas.rasterGuiCVS.height
      // )
      //render
      vectorGui.render()
    }
  }
  //clear affected layer and render image from most recent action from the affected layer
  //This avoids having to redraw the timeline for every undo/redo. Close to constant time whereas redrawTimeline is closer to exponential time or worse.
  //TODO: factor out into separate function
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
      renderLayersToDOM()
      renderVectorsToDOM()
      state.reset()
      //remove temporary layer if redoing a confirm paste action. Must be done after the action is pushed to the undoStack and rendered on canvas layer for render to look clean
      if (
        latestAction.tool.name === "paste" &&
        latestAction.properties.confirmed &&
        modType === "to"
      ) {
        //remove temp layer from DOM and restore current layer
        removeTempLayerFromDOM()
      }
    }
  } else {
    //no snapshot
    if (latestAction.layer.type === "reference") {
      renderCanvas(latestAction.layer)
    } else {
      renderCanvas(latestAction.layer, true)
      //set snapshot for latest action. Normally actions will have a snapshot
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
    renderLayersToDOM()
    renderVectorsToDOM()
    state.reset()
    //remove temporary layer if redoing a confirm paste action. Must be done after the action is pushed to the undoStack and rendered on canvas layer for render to look clean
    if (
      latestAction.tool.name === "paste" &&
      latestAction.properties.confirmed &&
      modType === "to"
    ) {
      //remove temp layer from DOM and restore current layer
      removeTempLayerFromDOM()
    }
  }
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
