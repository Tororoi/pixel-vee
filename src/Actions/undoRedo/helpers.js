import { dom } from '../../Context/dom.js'
import { globalState } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { brush } from '../../Tools/brush.js'
import {
  applyDitherOffset,
  applyDitherOffsetControl,
} from '../../DOM/renderBrush.js'
import { pasteSelectedPixels } from '../../Menu/edit.js'
import { switchTool } from '../../Tools/toolbox.js'
import { transformRasterContent } from '../../utils/transformHelpers.js'
import { applyCanvasDimensions } from '../../Canvas/render.js'

/**
 * Apply a modify action's before or after property snapshot to the affected
 * vectors, used during undo ("from") and redo ("to").
 *
 * A modify action bundles multiple before/after property records into its
 * `processedActions` array so that dragging several vectors at once can be
 * undone as a single step. For each record, the relevant vector's
 * `vectorProperties` object is replaced with the snapshot for the requested
 * direction.
 * @param {object} latestAction - The modify action being undone or redone.
 *   Must have a `processedActions` array of `{moddedVectorIndex, from, to}`.
 * @param {string} modType - `"from"` to restore the before-state (undo);
 *   `"to"` to restore the after-state (redo).
 */
export function handleModifyAction(latestAction, modType) {
  latestAction.processedActions.forEach((mod) => {
    //find the action in the undoStack
    const moddedVector = globalState.vector.all[mod.moddedVectorIndex]
    //set the vectorProperties to the modded action's vectorProperties
    moddedVector.vectorProperties = {
      ...mod[modType],
    }
  })
}

/**
 * Toggle the `removed` flag of all actions on the current layer up to the
 * index recorded in the clear action, used to undo and redo a layer clear.
 *
 * A clear action does not delete data — it only marks previous actions as
 * removed. To undo the clear, every affected action is toggled back to
 * present. To redo it, they are toggled back to removed. Any vector indices
 * embedded in those actions are toggled as well to keep vector state in sync.
 * @param {object} latestAction - The clear action being undone or redone.
 *   Must have an `upToIndex` property indicating the highest undo stack
 *   index that was cleared.
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
 * Handle undoing or redoing an unconfirmed paste action.
 *
 * An unconfirmed paste places a temporary floating layer on top of the
 * target layer so the user can reposition the content before committing.
 *
 * Undo ("from"): removes the temporary layer from the layer stack and the
 *   DOM, re-enables the tools that were disabled during the paste, and
 *   restores the original target layer as the active layer.
 *
 * Redo ("to"): re-creates the paste state by calling `pasteSelectedPixels`
 *   with the action's stored clip data and offset, then switches to the move
 *   tool so the user can reposition again. Does not add a new timeline entry
 *   because the action is already on the stack.
 * @param {object} latestAction - The unconfirmed paste action.
 * @param {string} modType - `"from"` for undo; `"to"` for redo.
 */
export function handlePasteAction(latestAction, modType) {
  // if modType is "from" (undoing paste action), remove the templayer
  if (modType === 'from') {
    canvas.layers.splice(canvas.layers.indexOf(canvas.tempLayer), 1)
    dom.canvasLayers.removeChild(canvas.tempLayer.onscreenCvs)
    canvas.tempLayer.inactiveTools.forEach((tool) => {
      if (dom[`${tool}Btn`]) {
        dom[`${tool}Btn`].disabled = false
        dom[`${tool}Btn`].classList.remove('deactivate-paste')
      }
    })
    //restore the original layer
    canvas.currentLayer = latestAction.pastedLayer
    canvas.pastedLayer = null
    canvas.currentLayer.inactiveTools.forEach((tool) => {
      if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
    })
  } else if (modType === 'to') {
    //if modType is "to" (redoing paste action), basically do the pasteSelectedPixels function except use the action properties instead of the clipboard and don't add to timeline
    const selectProperties = {
      ...latestAction.selectProperties,
    }
    // Re-apply the layer offset to convert from layer-relative coords back
    // to canvas-space before passing to pasteSelectedPixels.
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
    switchTool('move')
  }
}

/**
 * Handle undoing or redoing a confirmed paste action.
 *
 * Confirming a paste merges the floating layer into the permanent layer.
 * Undoing a confirmation restores the floating layer state; redoing it
 * re-applies the merge (handled implicitly by the snapshot in the timeline,
 * so the redo branch currently has no side effects beyond the snapshot).
 *
 * Undo ("from"): calls `pasteSelectedPixels` with the confirmed canvas data
 *   to restore the floating layer appearance, then restores the pre-confirm
 *   layer position. Re-activates the move tool so the user can reposition.
 *
 * Redo ("to"): the snapshot replay in `renderToLatestAction` handles the
 *   pixel content; no additional state changes are needed here.
 * @param {object} latestAction - The confirmed paste action.
 * @param {object} newLatestAction - The action that becomes the most recent
 *   after the undo step (used to restore layer position from a move action).
 * @param {string} modType - `"from"` for undo; `"to"` for redo.
 */
export function handleConfirmPasteAction(
  latestAction,
  newLatestAction,
  modType,
) {
  //if modType is "from" (undoing confirm paste action), basically do the pasteSelectedPixels function except use the action properties instead of the clipboard and don't add to timeline
  if (modType === 'from') {
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
    if (newLatestAction?.tool?.name === 'move') {
      // The temp layer's x/y are reset to 0 during confirm, so restore the
      // position from the preceding move action so the floating layer renders
      // at the position the user had dragged it to.
      canvas.currentLayer.x = newLatestAction.to.x
      canvas.currentLayer.y = newLatestAction.to.y
    }
    //set currentPastedImageKey
    globalState.clipboard.currentPastedImageKey = latestAction.pastedImageKey
    switchTool('move')
  } else if (modType === 'to') {
    //if modType is "to" (redoing confirm paste action), enable actions for no temp pasted layer
  }
}

/**
 * Apply a stored layer position (x, y, scale) from a move action during
 * undo or redo, and shift any live vector GUI coordinates to match.
 *
 * Move actions record the layer's position before ("from") and after ("to")
 * the move. Undo restores "from"; redo restores "to". Any currently active
 * vector control-point coordinates are shifted by the same delta so the GUI
 * handles stay visually aligned with the layer content.
 * @param {object} latestAction - The move action being undone or redone.
 *   Must have `layer`, `from: {x, y, scale}`, and `to: {x, y, scale}`.
 * @param {string} modType - `"from"` for undo; `"to"` for redo.
 */
export function handleMoveAction(latestAction, modType) {
  let deltaX = latestAction[modType].x - latestAction.layer.x
  let deltaY = latestAction[modType].y - latestAction.layer.y
  //set layer x and y to modType
  latestAction.layer.x = latestAction[modType].x
  latestAction.layer.y = latestAction[modType].y
  latestAction.layer.scale = latestAction[modType].scale
  // Keep the dither grid aligned with the moved layer's content.
  if (latestAction.layer.type === 'raster') {
    brush.ditherOffsetX = (((brush.ditherOffsetX - deltaX) % 8) + 8) % 8
    brush.ditherOffsetY = (((brush.ditherOffsetY - deltaY) % 8) + 8) % 8
    const picker = document.querySelector('.dither-picker-container')
    if (picker)
      applyDitherOffset(picker, brush.ditherOffsetX, brush.ditherOffsetY)
    const preview = document.querySelector('.dither-preview')
    if (preview)
      applyDitherOffset(preview, brush.ditherOffsetX, brush.ditherOffsetY)
    const control = document.querySelector('.dither-offset-control')
    if (control)
      applyDitherOffsetControl(
        control.parentElement,
        brush.ditherOffsetX,
        brush.ditherOffsetY,
      )
  }
  // Shift live vector handle coordinates by the same delta so they stay
  // aligned with the layer content after the position change.
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
 * Apply a stored transform state (rotation, mirror, selection box) from a
 * transform action during undo or redo, and re-render the pixel content.
 *
 * Undo ("from"): reads the state from the action BEFORE the transform step
 *   being undone, which is stored in `newLatestAction`. Converts its
 *   selection properties back to canvas space and calls `transformRasterContent`
 *   to redraw the pixels in the prior transform state. If `newLatestAction`
 *   is itself a paste action rather than a transform, rendering is skipped
 *   because the paste snapshot handles the pixel content.
 *
 * Redo ("to"): reads the state from `latestAction` (the action being redone),
 *   converts coordinates to canvas space, and re-renders with the recorded
 *   transform parameters.
 * @param {object} latestAction - The transform action being undone or redone.
 * @param {object} newLatestAction - The action that becomes most recent after
 *   an undo step (used as the source of the prior transform state).
 * @param {string} modType - `"from"` for undo; `"to"` for redo.
 */
export function handleTransformAction(latestAction, newLatestAction, modType) {
  if (modType === 'from') {
    const selectProperties = { ...newLatestAction.selectProperties }
    // Convert layer-relative coords back to canvas space for the selection.
    selectProperties.px1 += newLatestAction.layer.x
    selectProperties.px2 += newLatestAction.layer.x
    selectProperties.py1 += newLatestAction.layer.y
    selectProperties.py2 += newLatestAction.layer.y
    globalState.selection.properties = { ...selectProperties }
    globalState.selection.setBoundaryBox(globalState.selection.properties)
    // Eventually undoing transform actions will result in the newLatestAction being a paste action. In that case, don't render a transformation
    if (newLatestAction.tool === 'transform') {
      transformRasterContent(
        newLatestAction.layer,
        globalState.clipboard.pastedImages[newLatestAction.pastedImageKey]
          .imageData,
        globalState.selection.boundaryBox,
        newLatestAction.transformationRotationDegrees % 360,
        newLatestAction.isMirroredHorizontally,
        newLatestAction.isMirroredVertically,
      )
      globalState.transform.rotationDegrees =
        newLatestAction.transformationRotationDegrees
      globalState.transform.isMirroredHorizontally =
        newLatestAction.isMirroredHorizontally
      globalState.transform.isMirroredVertically =
        newLatestAction.isMirroredVertically
    }
  } else if (modType === 'to') {
    const selectProperties = { ...latestAction.selectProperties }
    // Convert layer-relative coords back to canvas space for the selection.
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
      latestAction.isMirroredVertically,
    )
    globalState.transform.rotationDegrees =
      latestAction.transformationRotationDegrees
    globalState.transform.isMirroredHorizontally =
      latestAction.isMirroredHorizontally
    globalState.transform.isMirroredVertically =
      latestAction.isMirroredVertically
  }
}

/**
 * Undo or redo a canvas resize action.
 *
 * Restores the canvas dimensions and crop offset from the state snapshot
 * stored in the resize action (`from` or `to`). Because every layer and GUI
 * canvas must be resized together, and because vector coordinates, the
 * selection mask, and the dither offset all depend on the canvas origin,
 * this function updates all of them before delegating to
 * `applyCanvasDimensions` which handles the actual DOM resize.
 *
 * The dither offset is adjusted by the content shift (cropOffset delta) so
 * the repeating dither grid stays visually stable across resize operations.
 * The selection mask is rebuilt with translated coordinates, discarding any
 * pixels that fall outside the new canvas bounds.
 * @param {object} latestAction - The resize action being undone or redone.
 *   Must have `from` and `to` snapshots with `width`, `height`,
 *   `cropOffsetX`, and `cropOffsetY`.
 * @param {string} modType - `"from"` for undo; `"to"` for redo.
 */
export function handleResizeAction(latestAction, modType) {
  const targetState = latestAction[modType]
  // Compute how much the canvas content shifted so dependent state can be
  // translated by the same amount.
  const contentOffsetX =
    targetState.cropOffsetX - globalState.canvas.cropOffsetX
  const contentOffsetY =
    targetState.cropOffsetY - globalState.canvas.cropOffsetY
  globalState.canvas.cropOffsetX = targetState.cropOffsetX
  globalState.canvas.cropOffsetY = targetState.cropOffsetY
  // Keep the dither grid aligned with the canvas content after the resize.
  brush.ditherOffsetX = (((brush.ditherOffsetX - contentOffsetX) % 8) + 8) % 8
  brush.ditherOffsetY = (((brush.ditherOffsetY - contentOffsetY) % 8) + 8) % 8
  // Sync all dither offset UI elements to the updated values.
  const picker = document.querySelector('.dither-picker-container')
  if (picker)
    applyDitherOffset(picker, brush.ditherOffsetX, brush.ditherOffsetY)
  const preview = document.querySelector('.dither-preview')
  if (preview)
    applyDitherOffset(preview, brush.ditherOffsetX, brush.ditherOffsetY)
  const control = document.querySelector('.dither-offset-control')
  if (control)
    applyDitherOffsetControl(
      control.parentElement,
      brush.ditherOffsetX,
      brush.ditherOffsetY,
    )
  // Translate the selection properties by the content offset.
  if (globalState.selection.properties.px1 !== null) {
    globalState.selection.properties.px1 += contentOffsetX
    globalState.selection.properties.py1 += contentOffsetY
    globalState.selection.properties.px2 += contentOffsetX
    globalState.selection.properties.py2 += contentOffsetY
    globalState.selection.setBoundaryBox(globalState.selection.properties)
  }
  // Rebuild the selection mask with translated pixel keys, dropping any
  // pixels that now fall outside the new canvas dimensions.
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
  applyCanvasDimensions(
    targetState.width,
    targetState.height,
    contentOffsetX,
    contentOffsetY,
  )
}
