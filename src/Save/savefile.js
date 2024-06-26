//logic to convert undoStack and layers to json
//logic to read json and construct layers then undoStack with missing data that couldn't be saved as json
import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
//import custom brushStamps when they are implemented
import { vectorGui } from "../GUI/vector.js"
import { renderCanvas } from "../Canvas/render.js"
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
  sanitizeVectors,
} from "../utils/sanitizeObjectsForSave.js"
import { resizeOffScreenCanvas } from "../Canvas/render.js"
import { consolidateLayers } from "../Canvas/layers.js"
import { calcEllipseConicsFromVertices } from "../utils/ellipse.js"

const currentVersion = "1.1"

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
 * TODO: (High Priority) Add error handling for saving the drawing
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
  let sanitizedVectors = sanitizeVectors(
    state.undoStack,
    state.vectors,
    preserveHistory,
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
  // Consolidate the layers onto the offscreen canvas for the backup image
  consolidateLayers()
  // Create a JSON string from the drawing data
  let saveJsonString = JSON.stringify({
    metadata: {
      version: currentVersion,
      application: "Pixel V",
      timestamp: Date.now(),
      backupImage: canvas.offScreenCVS.toDataURL(),
    },
    layers: sanitizedLayers,
    vectors: sanitizedVectors,
    palette: sanitizedPalette,
    history: sanitizedUndoStack,
    canvasProperties: {
      width: canvas.offScreenCVS.width,
      height: canvas.offScreenCVS.height,
    },
    selectProperties: state.selectProperties,
  })

  return new Blob([saveJsonString], { type: "application/json" })
}

/**
 * Set the preview of the file size
 */
export function setSaveFilesizePreview() {
  dom.fileSizePreview.innerText = "Calculating..."

  return new Promise((resolve) => {
    setTimeout(() => {
      let saveBlob = prepareDrawingForSave()
      const sizeInMB = saveBlob.size / 1000000
      const sizeInKB = saveBlob.size / 1000
      const formattedSize =
        sizeInMB > 1 ? `${sizeInMB.toFixed(1)} MB` : `${sizeInKB.toFixed(0)} KB`

      dom.fileSizePreview.innerText = formattedSize
      resolve()
    }, 0)
  })
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
 * TODO: (High Priority) Add more elegant error popup when loading the drawing
 */
export async function loadDrawing(jsonFile) {
  let data
  // Validate the JSON file as JSON
  try {
    // Parse the JSON file
    data = JSON.parse(jsonFile)
  } catch (e) {
    console.error(e)
    alert(e)
    return
  }
  // Validate the JSON file as a Pixel V save file and log which properties are missing
  let validation = validatePixelVeeFile(data)
  if (!validation.valid) {
    console.error(validation.message)
    alert(validation.message)
    return
  }

  // Clear existing layers and undoStack
  dom.canvasLayers.innerHTML = ""
  canvas.layers = []
  state.undoStack = []
  state.clearRedoStack()
  //Not likely to be an issue, but reset just in case
  state.points = []
  //pasted images
  state.pastedImages = {}
  //vectors
  state.vectors = {}
  state.highestVectorKey = 0
  state.vectorsSavedProperties = {}
  state.activeIndexes = []
  state.savedBetweenActionImages = []
  //reset selection state
  state.deselect()
  vectorGui.reset()

  //Handle old files that don't have the vectors object
  if (data.metadata.version === "1.0") {
    data.vectors = {}
  }

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
  data.history.forEach((action, index) => {
    if (!action.index) {
      //populate index for old files that don't have it
      action.index = index
    }
    //Handle actions with a pastedLayer
    if (action?.pastedLayer) {
      let correspondingLayer = canvas.layers.find(
        (layer) => layer.id === action.pastedLayer.id
      )
      if (correspondingLayer) {
        action.pastedLayer = correspondingLayer
      }
    }
    // Match the action's layer id with an existing layer
    if (action.layer.id === 0) {
      action.layer = canvas.tempLayer
    } else {
      let correspondingLayer = canvas.layers.find(
        (layer) => layer.id === action.layer.id
      )

      if (correspondingLayer) {
        action.layer = correspondingLayer

        /**
         * Snapshots are not added back to actions here since modified actions will not
         * have the correct snapshot by simply iterating through the undoStack in order.
         * Instead, snapshots are generated by redrawing the timeline per action as needed on undo/redo
         * to increase the efficiency of subsequent undo/redo calls.
         */
      }
    }
    //For old files that don't use the vectors object
    if (data.metadata.version !== currentVersion) {
      convertActionToNewFormat(data, action)
    }

    //Handle brush tool
    if (action?.points) {
      // Convert the points array into an array of objects
      let points = []
      for (let index = 0; index < action.points.length; index += 3) {
        points.push({
          x: action.points[index],
          y: action.points[index + 1],
          brushSize: action.points[index + 2],
        })
      }
      action.points = points
    }

    //TODO: (Low Priority) If quadCurve and cubicCurve are unified into "curve", will need to add logic here to convert those to the correct type
    //Handle actions with canvas data (paste, confirm paste)
    if (action?.canvas) {
      // Convert the stored canvas dataUrl to a canvas
      let tempCanvas = document.createElement("canvas")
      tempCanvas.width = action.canvasProperties.width
      tempCanvas.height = action.canvasProperties.height
      let tempCtx = tempCanvas.getContext("2d", {
        willReadFrequently: true,
      })
      let img = new Image()
      img.src = action.canvasProperties.dataUrl

      // Wrap the image loading and drawing in a promise
      let drawImagePromise = new Promise((resolve, reject) => {
        img.onload = () => {
          tempCtx.drawImage(img, 0, 0)
          //IN PROGRESS: Construct the state.pastedImages by using the canvas from each paste action, set at action.pastedImageKey. If no key, set it to the highestPastedImageKey
          state.pastedImages[action.pastedImageKey] = {
            imageData: tempCtx.getImageData(
              0,
              0,
              action.canvasProperties.width,
              action.canvasProperties.height
            ),
          }
          resolve() // Resolve the promise after the image has been drawn
        }
        img.onerror = reject
      })

      // Add the promise to the array to ensure it completes before continuing
      imageLoadPromises.push(drawImagePromise)

      action.canvas = tempCanvas
    }

    // Add the action to the undo stack
    state.undoStack.push(action)
  })

  //Reconstruct vectors (object, not array) by iterating through it and assigning the proper layer to each vector
  for (let vectorKey in data.vectors) {
    let vector = data.vectors[vectorKey]
    let correspondingLayer = canvas.layers.find(
      (layer) => layer.id === vector.layer.id
    )
    if (correspondingLayer) {
      //associate vector's layer
      vector.layer = correspondingLayer
      if (state.undoStack[vector.action.index]) {
        //associate vector's action
        vector.action = state.undoStack[vector.action.index]
        //add vector to state.vectors if valid layer and action present
        state.vectors[vectorKey] = vector
        //find the highest vector key
        if (Number(vectorKey) > state.highestVectorKey) {
          state.highestVectorKey = Number(vectorKey)
        }
      }
    }
  }

  // Wait for all images to load
  await Promise.all(imageLoadPromises)

  // Additional logic to update the UI, refresh the canvas, etc.
  if (data.selectProperties && data.selectProperties.px1 !== null) {
    state.selectProperties = { ...data.selectProperties }
    state.setBoundaryBox(state.selectProperties)
  }
  if (data.canvasProperties) {
    //resize the offscreen canvas to match the saved canvas dimensions (includes redraw timeline and vectorGui.render)
    resizeOffScreenCanvas(
      data.canvasProperties.width,
      data.canvasProperties.height
    )
  } else {
    renderCanvas(null, true) //redraw timeline
    vectorGui.render()
  }
  renderLayersToDOM()
  renderPaletteToDOM()
  renderVectorsToDOM()
}

/**
 * Modifies the original data to convert it to the new format
 * @param {object} data - The data object, containing history, vectors, and metadata, etc.
 * @param {object} action - The action object to be converted
 */
function convertActionToNewFormat(data, action) {
  if (data.metadata.version === "1.0") {
    if (action.properties) {
      //Handle vector actions
      if (action.properties?.vectorProperties) {
        //restructure vectorProperties to include type
        action.properties.vectorProperties.type = action.tool.name
        if (action.properties.vectorProperties.type === "ellipse") {
          action.properties.vectorProperties.unifiedOffset =
            action.properties.vectorProperties.offset
          delete action.properties.vectorProperties.offset
          let conicControlPoints = calcEllipseConicsFromVertices(
            action.properties.vectorProperties.px1,
            action.properties.vectorProperties.py1,
            action.properties.vectorProperties.radA,
            action.properties.vectorProperties.radB,
            action.properties.vectorProperties.angle,
            action.properties.vectorProperties.x1Offset,
            action.properties.vectorProperties.y1Offset
          )
          action.properties.vectorProperties.weight = conicControlPoints.weight
          action.properties.vectorProperties.leftTangentX =
            conicControlPoints.leftTangentX
          action.properties.vectorProperties.leftTangentY =
            conicControlPoints.leftTangentY
          action.properties.vectorProperties.topTangentX =
            conicControlPoints.topTangentX
          action.properties.vectorProperties.topTangentY =
            conicControlPoints.topTangentY
          action.properties.vectorProperties.rightTangentX =
            conicControlPoints.rightTangentX
          action.properties.vectorProperties.rightTangentY =
            conicControlPoints.rightTangentY
          action.properties.vectorProperties.bottomTangentX =
            conicControlPoints.bottomTangentX
          action.properties.vectorProperties.bottomTangentY =
            conicControlPoints.bottomTangentY
        }
        //restructure how vectorProperties are stored
        state.highestVectorKey += 1
        let uniqueVectorKey = state.highestVectorKey
        data.vectors[uniqueVectorKey] = {
          index: uniqueVectorKey,
          action: { index: action.index }, //formatted with index for saving, mapped to action later
          layer: action.layer,
          modes: { ...action.modes },
          color: { ...action.color },
          brushSize: action.tool.brushSize,
          brushType: action.tool.brushType,
          vectorProperties: { ...action.properties.vectorProperties },
          hidden: action.hidden,
          removed: action.removed,
        }
        action.vectorIndices = [uniqueVectorKey]
        //remove old properties
        delete action.modes
        delete action.color
      }
      //Handle actions with points
      if (action.properties?.points) {
        action.points = action.properties.points
      }
      //Handle line actions
      if (action.tool.name === "line") {
        //convert to a vector tool
        state.highestVectorKey += 1
        let uniqueVectorKey = state.highestVectorKey
        data.vectors[uniqueVectorKey] = {
          index: uniqueVectorKey,
          action: { index: action.index },
          layer: action.layer,
          modes: { ...action.modes },
          color: { ...action.color },
          brushSize: action.tool.brushSize,
          brushType: action.tool.brushType,
          vectorProperties: {
            type: "line",
            px1: action.properties.px1,
            py1: action.properties.py1,
            px2: action.properties.px2,
            py2: action.properties.py2,
          },
          hidden: action.hidden,
          removed: action.removed,
        }
        action.vectorIndices = [uniqueVectorKey]
      }
      //Handle actions with maskArray
      if (action.properties?.maskArray) {
        action.maskArray = action.properties.maskArray
      }
      //Handle actions with boundaryBox
      if (action.properties?.boundaryBox) {
        action.boundaryBox = action.properties.boundaryBox
      }
      //Handle select actions
      if (action.tool.name === "select") {
        action.selectedVectorIndices = []
      }
      //Handle modify actions
      if (action.properties?.moddedActionIndex) {
        action.moddedActionIndex = action.properties.moddedActionIndex
      }
      if (action.properties?.processedActions) {
        //As of 1.0, only vector modifications use processedActions
        action.moddedVectorIndex =
          data.history[action.moddedActionIndex].vectorIndices[0]
        action.processedActions = action.properties.processedActions
        //modify processedAction to include moddedVectorIndex
        for (let processedAction of action.processedActions) {
          processedAction.moddedVectorIndex =
            data.history[processedAction.moddedActionIndex].vectorIndices[0]
        }
      }
      if (action.properties.from) {
        action.from = action.properties.from
      }
      if (action.properties.to) {
        action.to = action.properties.to
      }
      //remove old properties
      delete action.properties
    }
    //Handle actions with brush information
    if (action.tool.brushSize) {
      action.brushSize = action.tool.brushSize
      action.brushType = action.tool.brushType
    }
    //Convert tool to just be the name of the tool
    action.tool = action.tool.name
    //--- End of version 1.0 conversion ---//
  }
}
