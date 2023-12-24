//logic to convert undoStack and layers to json
//logic to read json and construct layers then undoStack with missing data that couldn't be saved as json
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"

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
      metadata: { version: "1.0", application: "Pixel Vee", timestamp: Date.now() },
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
  window.open(blobUrl)
}
