//logic to convert undoStack and layers to json
//logic to read json and construct layers then undoStack with missing data that couldn't be saved as json
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"

/**
 * Save the drawing as a JSON file
 * Unsaveable data:
 * - canvas DOM elements
 *   - reference layer properties: img, onscreenCvs, onscreenCtx
 *   - raster layer properties: cvs, ctx, onscreenCvs, onscreenCtx
 * - tool fn - not needed because it is not used
 *
 */
export function saveDrawing() {
  let jsonString = JSON.stringify(
    { layers: canvas.layers, undoStack: state.undoStack },
    null,
    2
  )
  //TODO: instead of opening in a new window, save to special testing object
  // Create a new Blob with the JSON data and the correct MIME type
  const blob = new Blob([jsonString], { type: "application/json" })
  // Create a URL for the Blob
  const blobUrl = URL.createObjectURL(blob)
  // Open the URL in a new tab/window
  window.open(blobUrl)
}
