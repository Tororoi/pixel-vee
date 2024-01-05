//logic to convert undoStack and layers to json
//logic to read json and construct layers then undoStack with missing data that couldn't be saved as json
import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
//import custom brushStamps when they are implemented
import { vectorGui } from "../GUI/vector.js"
import { performAction, renderCanvas } from "../Canvas/render.js"
import {
  renderLayersToDOM,
  renderVectorsToDOM,
  renderPaletteToDOM,
} from "../DOM/render.js"
import { validatePixelVeeFile } from "../utils/validationHelpers.js"
import {
  sanitizeLayers,
  sanitizePalette,
  sanitizeHistory,
} from "../utils/sanitizeObjectsForSave.js"

/**
 * Save the drawing as a JSON file
 * Unsaveable data:
 * - canvas DOM elements
 *   - reference layer properties: img, onscreenCvs, onscreenCtx
 *     - maybe don't save reference layers at all and remove addlayer actions for reference layer?
 *   - raster layer properties: cvs, ctx, onscreenCvs, onscreenCtx
 * - tool fn - not needed because it is not used
 * - action snapshot - don't save unnecessary dataurls
 * @returns {Blob} - A blob containing the drawing data.
 */
export function prepareDrawingForSave() {
  const {
    preserveHistory,
    includePalette,
    includeReferenceLayers,
    includeRemovedActions,
  } = state.saveSettings

  let sanitizedLayers = sanitizeLayers(
    canvas.layers,
    preserveHistory,
    includeReferenceLayers,
    includeRemovedActions
  )
  let sanitizedPalette = sanitizePalette(
    swatches.palette,
    preserveHistory,
    includePalette
  )
  let sanitizedUndoStack = sanitizeHistory(
    state.undoStack,
    preserveHistory,
    includeReferenceLayers,
    includeRemovedActions
  )

  let saveJsonString = JSON.stringify({
    metadata: {
      version: "1.0",
      application: "Pixel V",
      timestamp: Date.now(),
    },
    layers: sanitizedLayers,
    palette: sanitizedPalette,
    history: sanitizedUndoStack,
  })

  return new Blob([saveJsonString], { type: "application/json" })
}

/**
 * Set the preview of the file size
 */
export function setSaveFilesizePreview() {
  const saveBlob = prepareDrawingForSave()
  if (saveBlob.size > 1000000) {
    dom.fileSizePreview.innerText = (saveBlob.size / 1000000).toFixed(1) + "MB"
  } else {
    dom.fileSizePreview.innerText = (saveBlob.size / 1000).toFixed(0) + "KB"
  }
}

/**
 * Download the drawing as a JSON file
 */
export function saveDrawing() {
  // Create a new Blob with the JSON data and the correct MIME type
  const saveBlob = prepareDrawingForSave()
  // Create a URL for the Blob
  const blobUrl = URL.createObjectURL(saveBlob)
  // Open the URL in a new tab/window
  // window.open(blobUrl)
  // Create a temporary anchor element
  const a = document.createElement("a")
  a.href = blobUrl
  a.download = state.saveSettings.saveAsFileName + ".pxv" // Set the file name for the download

  // Append the anchor to the body, click it, and then remove it
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Revoke the blob URL to free up resources
  URL.revokeObjectURL(blobUrl)
}

/**
 * Load the drawing from a JSON file.
 * @param {JSON} jsonFile - The JSON file containing the drawing data.
 */
export async function loadDrawing(jsonFile) {
  let data
  // Validate the JSON file as JSON
  try {
    // Parse the JSON file
    data = JSON.parse(jsonFile)
  } catch (e) {
    console.error(e)
    return
  }
  // Validate the JSON file as a Pixel V save file and log which properties are missing
  let validation = validatePixelVeeFile(data)
  if (!validation.valid) {
    console.error(validation.message)
    return
  }

  // Clear existing layers and undoStack
  dom.canvasLayers.innerHTML = ""
  canvas.layers = []
  state.undoStack = []
  vectorGui.reset()

  // Array to hold promises for image loading
  let imageLoadPromises = []

  // Recreate layers from the JSON data
  data.layers.forEach((layer) => {
    // Set the contexts
    if (layer.type === "raster") {
      let offscreenLayerCVS = document.createElement("canvas")
      let offscreenLayerCTX = offscreenLayerCVS.getContext("2d", {
        willReadFrequently: true,
      })
      offscreenLayerCVS.width = canvas.offScreenCVS.width
      offscreenLayerCVS.height = canvas.offScreenCVS.height
      layer.cvs = offscreenLayerCVS
      layer.ctx = offscreenLayerCTX
    }
    let onscreenLayerCVS = document.createElement("canvas")
    let onscreenLayerCTX = onscreenLayerCVS.getContext("2d", {
      willReadFrequently: true,
    })
    onscreenLayerCVS.className = "onscreen-canvas"
    dom.canvasLayers.appendChild(onscreenLayerCVS)
    onscreenLayerCVS.width = onscreenLayerCVS.offsetWidth * canvas.sharpness
    onscreenLayerCVS.height = onscreenLayerCVS.offsetHeight * canvas.sharpness
    onscreenLayerCTX.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0
    )
    layer.onscreenCvs = onscreenLayerCVS
    layer.onscreenCtx = onscreenLayerCTX

    // For reference layers, load the image
    if (layer.type === "reference" && layer.dataUrl) {
      let img = new Image()
      img.src = layer.dataUrl

      // Create a promise for the image load
      let imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = () => {
          layer.img = img
          resolve()
        }
        img.onerror = reject
      })

      // Add the promise to the array
      imageLoadPromises.push(imageLoadPromise)
    }

    // Add the layer to canvas
    canvas.layers.push(layer)
  })

  canvas.currentLayer = canvas.layers[canvas.layers.length - 1]

  if (data.palette) {
    //reset other swatch properties
    swatches.activePaletteIndex = null
    swatches.selectedPaletteIndex = null
    //set palette
    swatches.palette = data.palette
  }

  // Reconstruct the undoStack
  data.history.forEach((action) => {
    if (action.properties?.points) {
      // Convert the points array into an array of objects
      let points = []
      for (let index = 0; index < action.properties.points.length; index += 3) {
        points.push({
          x: action.properties.points[index],
          y: action.properties.points[index + 1],
          brushSize: action.properties.points[index + 2],
        })
      }
      action.properties.points = points
    }
    // Match the action's layer title with an existing layer
    let correspondingLayer = canvas.layers.find(
      (layer) => layer.title === action.layer.title
    )
    if (correspondingLayer) {
      action.layer = correspondingLayer

      performAction(action)
      /**
       * Snapshots are not added back to actions here since modified actions will not
       * have the correct snapshot by simply iterating through the undoStack in order.
       * Instead, snapshots are generated by redrawing the timeline per action as needed on undo/redo
       * to increase the efficiency of subsequent undo/redo calls.
       */
    }

    // Add the action to the undo stack
    state.undoStack.push(action)
  })

  // Wait for all images to load
  await Promise.all(imageLoadPromises)

  // Additional logic to update the UI, refresh the canvas, etc.
  renderCanvas()
  renderLayersToDOM()
  renderPaletteToDOM()
  renderVectorsToDOM()
}
