/**
 * @param {object} layers - The layers object to be sanitized
 * @param {boolean} preserveHistory - Whether to preserve the history
 * @param {boolean} includeReferenceLayers - Whether to include reference layers
 * @param {boolean} includeRemovedActions - Whether to include removed actions
 * @returns {object} - A sanitized copy of the layers object.
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
    if (layer.isPreview) {
      sanitizedLayers.splice(i, 1)
    } else if (layer.removed && !preserveHistory && !includeRemovedActions) {
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
 * @param {object} palette - The palette object to be sanitized
 * @param {boolean} preserveHistory - Whether to preserve the history
 * @param {boolean} includePalette - Whether to include the palette
 * @returns {object} - A sanitized copy of the palette object.
 */
export function sanitizePalette(palette, preserveHistory, includePalette) {
  if (!preserveHistory && !includePalette) {
    return null
  }
  return JSON.parse(JSON.stringify(palette))
}

/**
 * @param {object} undoStack - The undoStack object to be sanitized
 * @param {boolean} preserveHistory - Whether to preserve the history
 * @param {boolean} includeReferenceLayers - Whether to include reference layers
 * @param {boolean} includeRemovedActions - Whether to include removed actions
 * @returns {object} - A sanitized copy of the undoStack object.
 */
export function sanitizeHistory(
  undoStack,
  preserveHistory,
  includeReferenceLayers,
  includeRemovedActions
) {
  let sanitizedUndoStack = JSON.parse(JSON.stringify(undoStack))
  let lastPasteActionIndex
  for (let i = sanitizedUndoStack.length - 1; i >= 0; i--) {
    const action = sanitizedUndoStack[i]
    //if active paste action, find the latest unconfirmed paste action and remove it and all actions after it
    if (action.tool.name === "paste" && !lastPasteActionIndex) {
      lastPasteActionIndex = i
      if (!action.confirmed) {
        //remove the unconfirmed paste action and all actions after it
        sanitizedUndoStack.splice(i, sanitizedUndoStack.length - i)
      }
    } else if (
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
        action.layer = { id: action.layer.id }
      }
      if (action?.pastedLayer) {
        // sanitize pasted layer
        action.pastedLayer = { id: action.pastedLayer.id }
      }
      if (action?.points) {
        //format each object in the array from {x,y,brushSize} to be 3 entries in a new array with just the values. The values will be reformatted back to objects on load.
        let sanitizedPoints = []
        for (let index = 0; index < action.points.length; index++) {
          const point = action.points[index]
          sanitizedPoints.push(point.x, point.y, point.brushSize)
        }
        action.points = sanitizedPoints
      }
      delete action.snapshot
    }
  }
  return sanitizedUndoStack
}
