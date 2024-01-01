//logic to convert undoStack and layers to json
//logic to read json and construct layers then undoStack with missing data that couldn't be saved as json
import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { performAction, renderCanvas } from "../Canvas/render.js"
import {
  renderLayersToDOM,
  renderVectorsToDOM,
  renderPaletteToDOM,
} from "../DOM/render.js"

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
        application: "Pixel Vee",
        timestamp: Date.now(),
      },
      layers: canvas.layers,
      undoStack: sanitizedUndoStack,
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
  a.download = "drawing.json" // Set the file name for the download

  // Append the anchor to the body, click it, and then remove it
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Revoke the blob URL to free up resources
  URL.revokeObjectURL(blobUrl)
}

/**
 * Load the drawing from a JSON file.
 * @param {File} jsonFile - The JSON file containing the drawing data.
 */
export async function loadDrawing(jsonFile) {
  // Parse the text as JSON
  const data = JSON.parse(jsonFile)

  // Clear existing layers and undoStack
  dom.canvasLayers.innerHTML = ""
  canvas.layers = []
  state.undoStack = []

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
      img.onload = () => {
        layer.img = img
      }
    }

    // Add the layer to canvas
    canvas.layers.push(layer)
  })

  console.log(canvas.layers)

  // Reconstruct the undoStack
  data.undoStack.forEach((action) => {
    // Match the action's layer title with an existing layer
    let correspondingLayer = canvas.layers.find(
      (layer) => layer.title === action.layer.title
    )
    if (correspondingLayer) {
      action.layer = correspondingLayer

      performAction(action)
      // Save a snapshot to the action if needed
      action.snapshot =
        correspondingLayer.type === "raster"
          ? correspondingLayer.cvs.toDataURL()
          : null
    }

    // Add the action to the undo stack
    state.undoStack.push(action)
  })

  console.log(state.undoStack)

  // Additional logic to update the UI, refresh the canvas, etc.
  renderCanvas()
  renderLayersToDOM()
  renderVectorsToDOM()
}
