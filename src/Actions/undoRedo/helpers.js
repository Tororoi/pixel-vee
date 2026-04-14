import { dom } from "../../Context/dom.js"
import { globalState } from "../../Context/state.js"
import { canvas } from "../../Context/canvas.js"
import { brush } from "../../Tools/brush.js"
import { applyDitherOffset, applyDitherOffsetControl } from "../../DOM/renderBrush.js"
import { pasteSelectedPixels } from "../../Menu/edit.js"
import { switchTool } from "../../Tools/toolbox.js"
import {
  disableActionsForPaste,
  enableActionsForNoPaste,
} from "../../DOM/disableDomElements.js"
import { transformRasterContent } from "../../utils/transformHelpers.js"
import { applyCanvasDimensions } from "../../Canvas/render.js"

/**
 * @description This function is used to handle the modify action. It is used in the undo and redo functions.
 * @param {object} latestAction - The action about to be undone or redone
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
export function handleModifyAction(latestAction, modType) {
  //for each processed action,
  latestAction.processedActions.forEach((mod) => {
    //find the action in the undoStack
    const moddedVector = globalState.vector.all[mod.moddedVectorIndex] // need to check if this is a vector action and if it is, set the vector properties for the appropriate vector
    //set the vectorProperties to the modded action's vectorProperties
    moddedVector.vectorProperties = {
      ...mod[modType],
    }
  })
}

/**
 * @description This function is used to handle the clear action. It is used in the undo and redo functions.
 * @param {object} latestAction - The action about to be undone or redone
 */
export function handleClearAction(latestAction) {
  let upToIndex = latestAction.upToIndex
  let i = 0
  //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
  globalState.timeline.undoStack.forEach((action) => {
    if (i > upToIndex) {
      return
    }
    i++
    if (action.layer === canvas.currentLayer) {
      action.removed = !action.removed
      if (action.vectorIndices) {
        action.vectorIndices.forEach((vectorIndex) => {
          globalState.vector.all[vectorIndex].removed =
            !globalState.vector.all[vectorIndex].removed
        })
      }
    }
  })
  // vectorGui.reset()
}

/**
 * @param {object} latestAction - The action about to be undone or redone
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
export function handlePasteAction(latestAction, modType) {
  // if modType is "from" (undoing paste action), remove the templayer
  if (modType === "from") {
    canvas.layers.splice(canvas.layers.indexOf(canvas.tempLayer), 1)
    dom.canvasLayers.removeChild(canvas.tempLayer.onscreenCvs)
    canvas.tempLayer.inactiveTools.forEach((tool) => {
      if (dom[`${tool}Btn`]) {
        dom[`${tool}Btn`].disabled = false
        dom[`${tool}Btn`].classList.remove("deactivate-paste")
      }
    })
    //restore the original layer
    canvas.currentLayer = latestAction.pastedLayer
    canvas.pastedLayer = null
    canvas.currentLayer.inactiveTools.forEach((tool) => {
      if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
    })
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
    // globalState.vector.clearSelected()
    //set currentPastedImageKey
    globalState.clipboard.currentPastedImageKey = latestAction.pastedImageKey
    switchTool("move")
    disableActionsForPaste()
  }
}

/**
 * @param {object} latestAction - The action about to be undone or redone
 * @param {object} newLatestAction - The action that's about to be the most recent action, if the function is "Undo" ("from")
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
export function handleConfirmPasteAction(latestAction, newLatestAction, modType) {
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
    globalState.clipboard.currentPastedImageKey = latestAction.pastedImageKey
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
export function handleMoveAction(latestAction, modType) {
  let deltaX = latestAction[modType].x - latestAction.layer.x
  let deltaY = latestAction[modType].y - latestAction.layer.y
  //set layer x and y to modType
  latestAction.layer.x = latestAction[modType].x
  latestAction.layer.y = latestAction[modType].y
  latestAction.layer.scale = latestAction[modType].scale
  //Keep properties relative to layer offset
  if (globalState.vector.properties.px1) {
    globalState.vector.properties.px1 += deltaX
    globalState.vector.properties.py1 += deltaY
  }
  if (globalState.vector.properties.px2) {
    globalState.vector.properties.px2 += deltaX
    globalState.vector.properties.py2 += deltaY
  }
  if (globalState.vector.properties.px3) {
    globalState.vector.properties.px3 += deltaX
    globalState.vector.properties.py3 += deltaY
  }
  if (globalState.vector.properties.px4) {
    globalState.vector.properties.px4 += deltaX
    globalState.vector.properties.py4 += deltaY
  }
}

/**
 *
 * @param {object} latestAction - The action about to be undone or redone
 * @param {object} newLatestAction - The action that's about to be the most recent action, if the function is "Undo" ("from")
 * @param {string} modType - "from" or "to", used to identify undo or redo
 */
export function handleTransformAction(latestAction, newLatestAction, modType) {
  if (modType === "from") {
    const selectProperties = { ...newLatestAction.selectProperties }
    selectProperties.px1 += newLatestAction.layer.x
    selectProperties.px2 += newLatestAction.layer.x
    selectProperties.py1 += newLatestAction.layer.y
    selectProperties.py2 += newLatestAction.layer.y
    globalState.selection.properties = { ...selectProperties }
    globalState.selection.setBoundaryBox(globalState.selection.properties)
    //Eventually undoing transform actions will result in the newLatestAction being a paste action. In that case, don't render a transformation
    if (newLatestAction.tool === "transform") {
      transformRasterContent(
        newLatestAction.layer,
        globalState.clipboard.pastedImages[newLatestAction.pastedImageKey].imageData,
        globalState.selection.boundaryBox,
        newLatestAction.transformationRotationDegrees % 360,
        newLatestAction.isMirroredHorizontally,
        newLatestAction.isMirroredVertically
      )
      globalState.transform.rotationDegrees =
        newLatestAction.transformationRotationDegrees
      globalState.transform.isMirroredHorizontally = newLatestAction.isMirroredHorizontally
      globalState.transform.isMirroredVertically = newLatestAction.isMirroredVertically
    }
  } else if (modType === "to") {
    //offset selectProperties by layer x and y
    const selectProperties = { ...latestAction.selectProperties }
    selectProperties.px1 += latestAction.layer.x
    selectProperties.px2 += latestAction.layer.x
    selectProperties.py1 += latestAction.layer.y
    selectProperties.py2 += latestAction.layer.y
    globalState.selection.properties = {
      ...selectProperties,
    }
    globalState.selection.setBoundaryBox(globalState.selection.properties)
    transformRasterContent(
      latestAction.layer,
      globalState.clipboard.pastedImages[latestAction.pastedImageKey].imageData,
      globalState.selection.boundaryBox,
      latestAction.transformationRotationDegrees % 360,
      latestAction.isMirroredHorizontally,
      latestAction.isMirroredVertically
    )
    globalState.transform.rotationDegrees =
      latestAction.transformationRotationDegrees
    globalState.transform.isMirroredHorizontally = latestAction.isMirroredHorizontally
    globalState.transform.isMirroredVertically = latestAction.isMirroredVertically
  }
}

/**
 * Undo or redo a canvas resize action.
 * Restores the canvas dimensions and cropOffset from the appropriate snapshot,
 * then lets renderToLatestAction replay the timeline with the restored settings.
 * @param {object} latestAction - The resize action being undone or redone
 * @param {string} modType - "from" (undo) or "to" (redo)
 */
export function handleResizeAction(latestAction, modType) {
  const targetState = latestAction[modType]
  const contentOffsetX = targetState.cropOffsetX - globalState.canvas.cropOffsetX
  const contentOffsetY = targetState.cropOffsetY - globalState.canvas.cropOffsetY
  globalState.canvas.cropOffsetX = targetState.cropOffsetX
  globalState.canvas.cropOffsetY = targetState.cropOffsetY
  brush.ditherOffsetX = ((brush.ditherOffsetX - contentOffsetX) % 8 + 8) % 8
  brush.ditherOffsetY = ((brush.ditherOffsetY - contentOffsetY) % 8 + 8) % 8
  const picker = document.querySelector('.dither-picker-container')
  if (picker) applyDitherOffset(picker, brush.ditherOffsetX, brush.ditherOffsetY)
  const preview = document.querySelector('.dither-preview')
  if (preview) applyDitherOffset(preview, brush.ditherOffsetX, brush.ditherOffsetY)
  const control = document.querySelector('.dither-offset-control')
  if (control) applyDitherOffsetControl(control.parentElement, brush.ditherOffsetX, brush.ditherOffsetY)
  if (globalState.selection.properties.px1 !== null) {
    globalState.selection.properties.px1 += contentOffsetX
    globalState.selection.properties.py1 += contentOffsetY
    globalState.selection.properties.px2 += contentOffsetX
    globalState.selection.properties.py2 += contentOffsetY
    globalState.selection.setBoundaryBox(globalState.selection.properties)
  }
  if (globalState.selection.maskSet) {
    const newMaskSet = new Set()
    const w = targetState.width
    const h = targetState.height
    for (const key of globalState.selection.maskSet) {
      const nx = (key & 0xffff) + contentOffsetX
      const ny = ((key >> 16) & 0xffff) + contentOffsetY
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        newMaskSet.add((ny << 16) | nx)
      }
    }
    globalState.selection.maskSet = newMaskSet
  }
  applyCanvasDimensions(targetState.width, targetState.height, contentOffsetX, contentOffsetY)
}
