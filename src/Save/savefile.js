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

/**
 * Save the drawing as a JSON file
 * Unsaveable data:
 * - canvas DOM elements
 *   - reference layer properties: img, onscreenCvs, onscreenCtx
 *     - maybe don't save reference layers at all and remove addlayer actions for reference layer?
 *   - raster layer properties: cvs, ctx, onscreenCvs, onscreenCtx
 * - tool fn - not needed because it is not used
 * - action snapshot - redraw upon load drawing, don't save unnecessary dataurls
 *
 */
export function saveDrawing() {
  // let sanitizedUndoStack = structuredClone(state.undoStack)
  // Create a deep copy of undoStack by stringifying and parsing
  let sanitizedUndoStack = JSON.parse(JSON.stringify(state.undoStack))

  // Modify each action in the stack
  sanitizedUndoStack.forEach((action) => {
    // Preserve only the title property of the layer object
    if (action.layer) {
      action.layer = { title: action.layer.title }
    }
    // Remove data urls
    delete action.snapshot
  })
  let jsonString = JSON.stringify(
    {
      metadata: {
        version: "1.0",
        application: "Pixel V",
        timestamp: Date.now(),
      },
      layers: canvas.layers,
      palette: swatches.palette,
      history: sanitizedUndoStack,
    },
    null,
    2
  )
  // Create a new Blob with the JSON data and the correct MIME type
  const blob = new Blob([jsonString], { type: "application/json" })
  console.log(blob.size)
  // Create a URL for the Blob
  const blobUrl = URL.createObjectURL(blob)
  // Open the URL in a new tab/window
  // window.open(blobUrl)
  // Create a temporary anchor element
  const a = document.createElement("a")
  a.href = blobUrl
  a.download = "drawing.pxv" // Set the file name for the download

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
  swatches.palette = []
  state.undoStack = []
  vectorGui.reset()

  // Array to hold promises for image loading
  let imageLoadPromises = []

  // Recreate layers from the JSON data
  data.layers.forEach((layer) => {
    // Set the contexts
    if (layer.type === "raster") {
      let offscreenLayerCVS = document.createElement("canvas")
      let offscreenLayerCTX = offscreenLayerCVS.getContext("2d")
      offscreenLayerCTX.willReadFrequently = true
      offscreenLayerCVS.width = canvas.offScreenCVS.width
      offscreenLayerCVS.height = canvas.offScreenCVS.height
      layer.cvs = offscreenLayerCVS
      layer.ctx = offscreenLayerCTX
    }
    let onscreenLayerCVS = document.createElement("canvas")
    let onscreenLayerCTX = onscreenLayerCVS.getContext("2d")
    onscreenLayerCTX.willReadFrequently = true
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

  swatches.palette = data.palette

  // Reconstruct the undoStack
  data.history.forEach((action) => {
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
