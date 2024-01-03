/**
 *
 * @param {Object} layers
 * @param {Boolean} preserveHistory
 * @param {Boolean} includeReferenceLayers
 * @param {Boolean} includeRemovedActions
 * @returns {Object} - A sanitized copy of the layers object.
 */
export function sanitizeLayers(
  layers,
  preserveHistory,
  includeReferenceLayers,
  includeRemovedActions
) {
  let sanitizedLayers = JSON.parse(JSON.stringify(layers))
  for (let i = sanitizedLayers.length - 1; i >= 0; i--) {
    const layer = sanitizedLayers[i]
    if (layer.removed && !preserveHistory && !includeRemovedActions) {
      sanitizedLayers.splice(i, 1)
    } else if (
      layer.type === "reference" &&
      !preserveHistory &&
      !includeReferenceLayers
    ) {
      sanitizedLayers.splice(i, 1)
    } else {
      if (layer.type === "reference") {
        delete layer.img
      }
      if (layer.type === "raster") {
        delete layer.cvs
        delete layer.ctx
      }
      delete layer.onscreenCvs
      delete layer.onscreenCtx
    }
  }
  return sanitizedLayers
}

/**
 * @param {Object} palette
 * @param {Boolean} preserveHistory
 * @param {Boolean} includePalette
 * @returns {Object} - A sanitized copy of the palette object.
 */
export function sanitizePalette(palette, preserveHistory, includePalette) {
  if (!preserveHistory && !includePalette) {
    return null
  }
  return JSON.parse(JSON.stringify(palette))
}

/**
 * @param {Object} undoStack
 * @param {Boolean} preserveHistory
 * @param {Boolean} includeReferenceLayers
 * @param {Boolean} includeRemovedActions
 * @returns {Object} - A sanitized copy of the undoStack object.
 */
export function sanitizeHistory(
  undoStack,
  preserveHistory,
  includeReferenceLayers,
  includeRemovedActions
) {
  let sanitizedUndoStack = JSON.parse(JSON.stringify(undoStack))
  for (let i = sanitizedUndoStack.length - 1; i >= 0; i--) {
    const action = sanitizedUndoStack[i]
    if (
      (action.layer.removed || action.removed) &&
      !preserveHistory &&
      !includeRemovedActions
    ) {
      sanitizedUndoStack.splice(i, 1)
    } else if (
      action.layer.type === "reference" &&
      !preserveHistory &&
      !includeReferenceLayers
    ) {
      sanitizedUndoStack.splice(i, 1)
    } else {
      if (action.layer) {
        action.layer = { title: action.layer.title }
      }
      delete action.snapshot
    }
  }
  return sanitizedUndoStack
}
