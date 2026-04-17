//logic to convert undoStack and layers to json
//logic to read json and construct layers then undoStack with missing data that couldn't be saved as json
import { dom } from '../Context/dom.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { swatches } from '../Context/swatch.js'
import { vectorGui } from '../GUI/vector.js'
import { renderCanvas } from '../Canvas/render.js'
import { renderLayersToDOM, renderVectorsToDOM } from '../DOM/render.js'
import { validatePixelVeeFile } from '../utils/validationHelpers.js'
import {
  sanitizeLayers,
  sanitizePalette,
  sanitizeHistory,
  sanitizeVectors,
} from '../utils/sanitizeObjectsForSave.js'
import { resizeOffScreenCanvas } from '../Canvas/render.js'
import { consolidateLayers } from '../Canvas/layers.js'
import { calcEllipseConicsFromVertices } from '../utils/ellipse.js'
import { customBrushStamp, updateCustomStamp } from '../Context/brushStamps.js'

const currentVersion = '1.2'

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
  } = globalState.ui.saveSettings

  let sanitizedLayers = sanitizeLayers(
    canvas.layers,
    preserveHistory,
    includeReferenceLayers,
    includeRemovedActions,
  )
  let sanitizedVectors = sanitizeVectors(
    globalState.timeline.undoStack,
    globalState.vector.all,
    preserveHistory,
    includeRemovedActions,
  )
  let sanitizedPalette = sanitizePalette(
    swatches.palette,
    preserveHistory,
    includePalette,
  )
  let sanitizedUndoStack = sanitizeHistory(
    globalState.timeline.undoStack,
    preserveHistory,
    includeReferenceLayers,
    includeRemovedActions,
  )
  // Consolidate the layers onto the offscreen canvas for the backup image
  consolidateLayers()
  // Create a JSON string from the drawing data
  let saveJsonString = JSON.stringify({
    metadata: {
      version: currentVersion,
      application: 'Pixel V',
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
      cropOffsetX: globalState.canvas.cropOffsetX,
      cropOffsetY: globalState.canvas.cropOffsetY,
    },
    customBrushStamp:
      customBrushStamp.pixels.length > 0 ? customBrushStamp.pixels : null,
    selectProperties: globalState.selection.properties,
  })

  return new Blob([saveJsonString], { type: 'application/json' })
}

/**
 * Compute formatted filesize string asynchronously.
 * @returns {Promise<string>} formatted size like "42 KB" or "1.3 MB"
 */
export function computeFileSizePreview() {
  return new Promise((resolve) => {
    setTimeout(() => {
      let saveBlob = prepareDrawingForSave()
      const sizeInMB = saveBlob.size / 1000000
      const sizeInKB = saveBlob.size / 1000
      const formattedSize =
        sizeInMB > 1 ? `${sizeInMB.toFixed(1)} MB` : `${sizeInKB.toFixed(0)} KB`
      resolve(formattedSize)
    }, 0)
  })
}

/**
 * Set the preview of the file size (writes to DOM element if present)
 * @returns {Promise<void>}
 */
export function setSaveFilesizePreview() {
  if (dom.fileSizePreview) dom.fileSizePreview.innerText = 'Calculating...'
  return computeFileSizePreview().then((formattedSize) => {
    if (dom.fileSizePreview) dom.fileSizePreview.innerText = formattedSize
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
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = globalState.ui.saveSettings.saveAsFileName + '.pxv' // Set the file name for the download

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
  dom.canvasLayers.innerHTML = ''
  canvas.layers = []
  globalState.timeline.undoStack = []
  globalState.clearRedoStack()
  //Not likely to be an issue, but reset just in case
  globalState.timeline.clearPoints()
  //pasted images
  globalState.clipboard.pastedImages = {}
  //vectors
  globalState.vector.all = {}
  globalState.vector.highestKey = 0
  globalState.vector.savedProperties = {}
  globalState.timeline.clearActiveIndexes()
  globalState.timeline.clearSavedBetweenActionImages()
  //reset selection state
  globalState.deselect()
  vectorGui.reset()

  //Handle old files that don't have the vectors object
  if (data.metadata.version === '1.0') {
    data.vectors = {}
  }
  //Handle v1.1 files that don't have cropOffsetX/Y
  if (data.metadata.version === '1.1') {
    if (data.canvasProperties) {
      data.canvasProperties.cropOffsetX = 0
      data.canvasProperties.cropOffsetY = 0
    }
  }

  // Array to hold promises for image loading
  let imageLoadPromises = []

  // Recreate layers from the JSON data
  data.layers.forEach((layer) => {
    // Set the contexts
    if (layer.type === 'raster') {
      let offscreenLayerCVS = document.createElement('canvas')
      let offscreenLayerCTX = offscreenLayerCVS.getContext('2d', {
        willReadFrequently: true,
      })
      offscreenLayerCVS.width = canvas.offScreenCVS.width
      offscreenLayerCVS.height = canvas.offScreenCVS.height
      layer.cvs = offscreenLayerCVS
      layer.ctx = offscreenLayerCTX
    }
    let onscreenLayerCVS = document.createElement('canvas')
    let onscreenLayerCTX = onscreenLayerCVS.getContext('2d', {
      willReadFrequently: true,
    })
    onscreenLayerCVS.className = 'onscreen-canvas'
    dom.canvasLayers.appendChild(onscreenLayerCVS)
    onscreenLayerCVS.width = onscreenLayerCVS.offsetWidth * canvas.sharpness
    onscreenLayerCVS.height = onscreenLayerCVS.offsetHeight * canvas.sharpness
    onscreenLayerCTX.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0,
    )
    layer.onscreenCvs = onscreenLayerCVS
    layer.onscreenCtx = onscreenLayerCTX

    // For reference layers, load the image
    if (layer.type === 'reference' && layer.dataUrl) {
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
        (layer) => layer.id === action.pastedLayer.id,
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
        (layer) => layer.id === action.layer.id,
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
      let tempCanvas = document.createElement('canvas')
      tempCanvas.width = action.canvasProperties.width
      tempCanvas.height = action.canvasProperties.height
      let tempCtx = tempCanvas.getContext('2d', {
        willReadFrequently: true,
      })
      let img = new Image()
      img.src = action.canvasProperties.dataUrl

      // Wrap the image loading and drawing in a promise
      let drawImagePromise = new Promise((resolve, reject) => {
        img.onload = () => {
          tempCtx.drawImage(img, 0, 0)
          //IN PROGRESS: Construct the globalState.clipboard.pastedImages by using the canvas from each paste action, set at action.pastedImageKey. If no key, set it to the highestPastedImageKey
          globalState.clipboard.pastedImages[action.pastedImageKey] = {
            imageData: tempCtx.getImageData(
              0,
              0,
              action.canvasProperties.width,
              action.canvasProperties.height,
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
    globalState.timeline.undoStack.push(action)
  })

  //Reconstruct vectors (object, not array) by iterating through it and assigning the proper layer to each vector
  for (let vectorKey in data.vectors) {
    let vector = data.vectors[vectorKey]
    let correspondingLayer = canvas.layers.find(
      (layer) => layer.id === vector.layer.id,
    )
    if (correspondingLayer) {
      //associate vector's layer
      vector.layer = correspondingLayer
      if (globalState.timeline.undoStack[vector.action.index]) {
        //associate vector's action
        vector.action = globalState.timeline.undoStack[vector.action.index]
        //add vector to globalState.vector.all if valid layer and action present
        globalState.vector.all[vectorKey] = vector
        // v1.1 stored vectorProperties.type; v1.2+ uses vectorProperties.tool
        if (!vector.vectorProperties.tool) {
          const type = vector.vectorProperties.type
          if (type) {
            if (OLD_CURVE_TOOL_NAMES.includes(type)) {
              vector.vectorProperties.tool = 'curve'
              // v1.1 line/quadCurve/cubicCurve were separate tools whose mode
              // objects didn't carry the flags used in v1.2 to pick the stepNum
              if (!('line' in vector.modes)) {
                vector.modes.line = type === 'line'
                vector.modes.quadCurve = type === 'quadCurve'
                vector.modes.cubicCurve = type === 'cubicCurve'
              }
            } else {
              vector.vectorProperties.tool = type
            }
          }
        } else if (
          OLD_CURVE_TOOL_NAMES.includes(vector.vectorProperties.tool)
        ) {
          // Remap old curve names that appear in partially-migrated data
          vector.vectorProperties.tool = 'curve'
        }
        //set safe defaults for fields added in v1.2 that older vectors won't have
        if (vector.recordedLayerX === undefined) {
          vector.recordedLayerX = vector.layer.x ?? 0
        }
        if (vector.recordedLayerY === undefined) {
          vector.recordedLayerY = vector.layer.y ?? 0
        }
        //find the highest vector key
        if (Number(vectorKey) > globalState.vector.highestKey) {
          globalState.vector.highestKey = Number(vectorKey)
        }
      }
    }
  }

  // Wait for all images to load
  await Promise.all(imageLoadPromises)

  // Additional logic to update the UI, refresh the canvas, etc.
  if (data.selectProperties && data.selectProperties.px1 !== null) {
    globalState.selection.properties = { ...data.selectProperties }
    globalState.selection.setBoundaryBox(globalState.selection.properties)
  }
  if (data.canvasProperties) {
    //restore cropOffsetX/Y before timeline replay so strokes replay at correct positions
    globalState.canvas.cropOffsetX = data.canvasProperties.cropOffsetX ?? 0
    globalState.canvas.cropOffsetY = data.canvasProperties.cropOffsetY ?? 0
  }
  //restore custom brush stamp before timeline replay so custom brush strokes render correctly
  if (data.customBrushStamp && Array.isArray(data.customBrushStamp)) {
    customBrushStamp.pixels = data.customBrushStamp
    customBrushStamp.pixelSet = new Set(
      data.customBrushStamp.map(({ x, y }) => (y << 16) | x),
    )
    updateCustomStamp()
  }
  if (data.canvasProperties) {
    //resize the offscreen canvas to match the saved canvas dimensions (includes redraw timeline and vectorGui.render)
    resizeOffScreenCanvas(
      data.canvasProperties.width,
      data.canvasProperties.height,
    )
  } else {
    renderCanvas(null, true) //redraw timeline
    vectorGui.render()
  }
  renderLayersToDOM()
  renderVectorsToDOM()
}

/**
 * Modifies the original data to convert it to the new format
 * @param {object} data - The data object, containing history, vectors, and metadata, etc.
 * @param {object} action - The action object to be converted
 */
/** Tool names that were consolidated into "curve" between v1.1 and v1.2 */
const OLD_CURVE_TOOL_NAMES = ['line', 'quadCurve', 'cubicCurve']

/**
 * Converts a saved action to the current format for backward compatibility.
 * @param {object} data - The full save file data object
 * @param {object} action - The individual action to convert
 */
function convertActionToNewFormat(data, action) {
  if (data.metadata.version === '1.1') {
    // Remap action.tool names that were consolidated into "curve"
    if (OLD_CURVE_TOOL_NAMES.includes(action.tool)) {
      action.tool = 'curve'
    }
    // Fix modify processedActions: v1.1 stored 'type' in from/to snapshots, not 'tool'
    if (action.tool === 'modify' && action.processedActions) {
      for (const mod of action.processedActions) {
        for (const key of ['from', 'to']) {
          const snapshot = mod[key]
          if (snapshot && !snapshot.tool && snapshot.type) {
            snapshot.tool = OLD_CURVE_TOOL_NAMES.includes(snapshot.type)
              ? 'curve'
              : snapshot.type
          }
        }
      }
    }
  }
  if (data.metadata.version === '1.0') {
    if (action.properties) {
      //Handle vector actions
      if (action.properties?.vectorProperties) {
        //restructure vectorProperties to include type
        action.properties.vectorProperties.type = action.tool.name
        if (action.properties.vectorProperties.type === 'ellipse') {
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
            action.properties.vectorProperties.y1Offset,
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
        globalState.vector.highestKey += 1
        let uniqueVectorKey = globalState.vector.highestKey
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
      if (action.tool.name === 'line') {
        //convert to a vector tool
        globalState.vector.highestKey += 1
        let uniqueVectorKey = globalState.vector.highestKey
        data.vectors[uniqueVectorKey] = {
          index: uniqueVectorKey,
          action: { index: action.index },
          layer: action.layer,
          modes: { ...action.modes },
          color: { ...action.color },
          brushSize: action.tool.brushSize,
          brushType: action.tool.brushType,
          vectorProperties: {
            type: 'line',
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
      if (action.tool.name === 'select') {
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
