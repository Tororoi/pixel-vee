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
  let sanitizedUndoStack = [...state.undoStack]
  //remove unsaveable data
  sanitizedUndoStack.forEach((action) => {
    delete action.snapshot
  })
  let jsonString = JSON.stringify(
    {
      metadata: { version: "1.0", application: "Pixel Vee", date: Date.now() },
      layers: canvas.layers,
      undoStack: sanitizedUndoStack,
    },
    null,
    2
  )
  //TODO: instead of opening in a new window, save to special testing object
  // Create a new Blob with the JSON data and the correct MIME type
  const blob = new Blob([jsonString], { type: "application/json" })
  console.log(blob.size)
  // Create a URL for the Blob
  const blobUrl = URL.createObjectURL(blob)
  // Open the URL in a new tab/window
  window.open(blobUrl)
}
