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
        action.layer = { id: action.layer.id }
      }
      if (action.properties?.pastedLayer) {
        // sanitize pasted layer
        action.properties.pastedLayer = { id: action.properties.pastedLayer.id }
      }
      if (action.properties?.points) {
        //format each object in the array from {x,y,brushSize} to be 3 entries in a new array with just the values. The values will be reformatted back to objects on load.
        let sanitizedPoints = []
        for (let index = 0; index < action.properties.points.length; index++) {
          const point = action.properties.points[index]
          sanitizedPoints.push(point.x, point.y, point.brushSize)
        }
        action.properties.points = sanitizedPoints
      }
      delete action.snapshot
    }
  }
  return sanitizedUndoStack
}
