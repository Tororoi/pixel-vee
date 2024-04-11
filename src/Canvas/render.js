import { dom } from "../Context/dom.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { tools } from "../Tools/index.js"
import { vectorGui } from "../GUI/vector.js"
import { renderLayersToDOM, renderVectorsToDOM } from "../DOM/render.js"
import { calculateBrushDirection } from "../utils/drawHelpers.js"
import {
  actionDraw,
  actionLine,
  actionFill,
  actionEllipse,
  actionQuadraticCurve,
  actionCubicCurve,
} from "../Actions/pointerActions.js"
import { setInitialZoom } from "../utils/canvasHelpers.js"
import { transformRasterContent } from "../utils/transformHelpers.js"

/**
 * Redraw all timeline actions
 * Critical function for the timeline to work
 * For handling activeIndexes, the idea is to save images of multiple actions that aren't changing to save time redrawing.
 * The current problem is that later actions "fill" or "draw" with a mask are affected by earlier actions.
 * TODO: (Low Priority) Another efficiency improvement would be to perform incremental rendering with caching so only the affected region of the canvas is rerendered.
 * TODO: (Medium Priority) Use OffscreenCanvas in a web worker to offload rendering to a separate thread.
 * BUG: Can't simply save images and draw them for the betweenCvs because this will ignore actions use erase or inject modes.
 * @param {object} layer - optional parameter to limit render to a specific layer
 * @param {Array} activeIndexes - optional parameter to limit render to specific actions. If not passed in, all actions will be rendered.
 * @param {boolean} setImages - optional parameter to set images for actions. Will be used when history is modified to update action images.
 */
export function redrawTimelineActions(layer, activeIndexes, setImages = false) {
  //follows stored instructions to reassemble drawing. Costly operation. Minimize usage as much as possible.
  let betweenCtx = null //canvas context for saving between actions
  let startIndex = 1
  if (activeIndexes) {
    if (setImages) {
      //set initial sandwiched canvas
      betweenCtx = createAndSaveContext()
    } else {
      //set starting index at first active index
      startIndex = activeIndexes[0]
    }
  }
  //loop through all actions
  for (let i = startIndex; i < state.undoStack.length; i++) {
    let action = state.undoStack[i]
    //if layer is passed in, only redraw for that layer
    if (layer) {
      if (action.layer !== layer) continue
    }
    if (activeIndexes) {
      if (activeIndexes.includes(i)) {
        //render betweenCanvas
        let activeIndex = activeIndexes.indexOf(i)
        //draw accumulated canvas actions from previous betweenCanvas to action.layer.ctx
        action.layer.ctx.drawImage(
          state.savedBetweenActionImages[activeIndex].cvs,
          0,
          0
        )
        if (setImages) {
          //ensure activeCtx uses action.layer.ctx for action at active index
          betweenCtx = null
        }
      }
    }
    const tool = tools[action.tool]
    if (
      !action.hidden &&
      !action.removed &&
      ["raster", "vector"].includes(tool.type)
    ) {
      performAction(action, betweenCtx)
    }
    if (activeIndexes) {
      if (activeIndexes.includes(i)) {
        if (setImages) {
          //if activeIndexes and setImages, loop through all actions and set image from previous active index to current active index to state.savedBetweenActionImages[i].betweenImage
          betweenCtx = createAndSaveContext()
          //actions rendered in loop beyond this point will render onto this cvs until a new one is set
        } else {
          //set i to next activeIndex to skip all actions until next activeIndex
          let nextActiveIndex = activeIndexes[activeIndexes.indexOf(i) + 1]
          if (nextActiveIndex) {
            i = nextActiveIndex - 1
          }
        }
      }
      //render last betweenCanvas
      if (i === activeIndexes[activeIndexes.length - 1] && !setImages) {
        //Finished rendering active indexes, finish by rendering last betweenCanvas to avoid rendering actions unnecessarily.
        //draw accumulated canvas actions from previous betweenCanvas to action.layer.ctx
        action.layer.ctx.drawImage(
          state.savedBetweenActionImages[
            state.savedBetweenActionImages.length - 1
          ].cvs,
          0,
          0
        )
        //exit for loop
        break
      } else if (i === state.undoStack.length - 1 && setImages) {
        //Finished rendering all actions but last set exists only on betweenCanvas at this point, so render it to the layer
        //draw accumulated canvas actions from previous betweenCanvas to action.layer.ctx
        action.layer.ctx.drawImage(
          state.savedBetweenActionImages[
            state.savedBetweenActionImages.length - 1
          ].cvs,
          0,
          0
        )
      }
    }
  }
  updateLayersAfterRedo()
  renderLayersToDOM()
  renderVectorsToDOM()
}

/**
 * Create canvas for saving between actions
 * @returns {CanvasRenderingContext2D} betweenCtx
 */
function createAndSaveContext() {
  let cvs = document.createElement("canvas")
  let ctx = cvs.getContext("2d", {
    willReadFrequently: true,
  })
  cvs.width = canvas.offScreenCVS.width
  cvs.height = canvas.offScreenCVS.height
  state.savedBetweenActionImages.push({ cvs, ctx })
  return ctx
}

/**
 * Helper for redrawTimelineActions
 * @param {object} action - The action to be performed
 * @param {CanvasRenderingContext2D} betweenCtx - The canvas context for saving between actions
 */
export function performAction(action, betweenCtx = null) {
  if (!action?.boundaryBox) {
    return
  }
  switch (action.tool) {
    case "brush": {
      //Correct action coordinates with layer offsets
      const offsetX = action.layer.x
      const offsetY = action.layer.y
      //correct boundary box for offsets
      const boundaryBox = { ...action.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin += offsetX
        boundaryBox.xMax += offsetX
        boundaryBox.yMin += offsetY
        boundaryBox.yMax += offsetY
      }
      let seen = new Set()
      let mask = null
      //TODO: (Low Priority) implement points and maskArray as an array of integers to reduce space cost. Could be stored as typed arrays but not meaningful for storing the json file.
      //points require 3 entries for every coordinate, x, y, brushSize
      //maskArray requires 2 entries for every coordinate, x, y
      if (action.maskArray) {
        if (offsetX !== 0 || offsetY !== 0) {
          mask = new Set(
            action.maskArray.map(
              (coord) => `${coord.x + offsetX},${coord.y + offsetY}`
            )
          )
        } else {
          mask = new Set(action.maskArray)
        }
      }
      let previousX = action.points[0].x + offsetX
      let previousY = action.points[0].y + offsetY
      let brushDirection = "0,0"
      for (const p of action.points) {
        brushDirection = calculateBrushDirection(
          p.x + offsetX,
          p.y + offsetY,
          previousX,
          previousY
        )
        actionDraw(
          p.x + offsetX,
          p.y + offsetY,
          boundaryBox,
          action.color,
          brushStamps[action.brushType][p.brushSize][brushDirection],
          p.brushSize,
          action.layer,
          action.modes,
          mask,
          seen,
          betweenCtx
        )
        previousX = p.x + offsetX
        previousY = p.y + offsetY
        //If points are saved as individual pixels instead of the cursor points so that the brushStamp does not need to be iterated over, it is much faster. But it sacrifices flexibility with points.
      }
      break
    }
    case "fill":
      renderActionVectors(action, betweenCtx)
      break
    case "line":
      renderActionVectors(action, betweenCtx)
      break
    case "quadCurve":
      renderActionVectors(action, betweenCtx)
      break
    case "cubicCurve":
      renderActionVectors(action, betweenCtx)
      break
    case "ellipse":
      renderActionVectors(action, betweenCtx)
      break
    case "cut": {
      //Correct action coordinates with layer offsets
      const offsetX = action.layer.x
      const offsetY = action.layer.y
      //correct boundary box for offsets
      const boundaryBox = { ...action.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin += offsetX
        boundaryBox.xMax += offsetX
        boundaryBox.yMin += offsetY
        boundaryBox.yMax += offsetY
      }
      let activeCtx = betweenCtx ? betweenCtx : action.layer.ctx
      //Clear boundaryBox area
      activeCtx.clearRect(
        boundaryBox.xMin,
        boundaryBox.yMin,
        boundaryBox.xMax - boundaryBox.xMin,
        boundaryBox.yMax - boundaryBox.yMin
      )
      break
    }
    case "paste": {
      //render paste action
      //Correct action coordinates with layer offsets
      const offsetX = action.layer.x
      const offsetY = action.layer.y
      //correct boundary box for offsets
      const boundaryBox = { ...action.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin += offsetX
        boundaryBox.xMax += offsetX
        boundaryBox.yMin += offsetY
        boundaryBox.yMax += offsetY
      }
      // Determine if the action is the last 'paste' action in the undoStack
      let isLastPasteAction = false // Default to false
      if (!action.confirmed) {
        for (let i = state.undoStack.length - 1; i >= 0; i--) {
          if (state.undoStack[i].tool === "paste") {
            // If the first 'paste' action found from the end is the current action
            isLastPasteAction = state.undoStack[i] === action
            break // Stop searching once the first 'paste' action is found
          }
        }
      }
      //if action is latest paste action and not confirmed, render it (account for actions that may be later but do not have the tool name "paste")
      if (action.confirmed) {
        let activeCtx = betweenCtx ? betweenCtx : action.layer.ctx
        activeCtx.drawImage(
          action.canvas,
          boundaryBox.xMin,
          boundaryBox.yMin,
          boundaryBox.xMax - boundaryBox.xMin,
          boundaryBox.yMax - boundaryBox.yMin
        )
      } else if (
        canvas.tempLayer === canvas.currentLayer && //only render if the current layer is the temp layer (active paste action)
        isLastPasteAction //only render if this action is the last paste action in the stack
      ) {
        action.layer.ctx.drawImage(
          action.canvas,
          boundaryBox.xMin,
          boundaryBox.yMin,
          boundaryBox.xMax - boundaryBox.xMin,
          boundaryBox.yMax - boundaryBox.yMin
        )
      }
      break
    }
    case "vectorPaste": {
      //render vector paste action (only vectors)
      renderActionVectors(action, betweenCtx)
      break
    }
    case "transform": {
      if (
        canvas.tempLayer === canvas.currentLayer &&
        action.pastedImageKey === state.currentPastedImageKey
      ) {
        let isLastTransformAction = false // Default to false
        for (let i = state.undoStack.length - 1; i >= 0; i--) {
          if (state.undoStack[i].tool === "transform") {
            // If the first 'paste' action found from the end is the current action
            isLastTransformAction = state.undoStack[i] === action
            break // Stop searching once the first 'paste' action is found
          }
        }
        if (isLastTransformAction) {
          //Correct action coordinates with layer offsets
          const offsetX = action.layer.x
          const offsetY = action.layer.y
          //correct boundary box for offsets
          const boundaryBox = { ...action.boundaryBox }
          if (boundaryBox.xMax !== null) {
            boundaryBox.xMin += offsetX
            boundaryBox.xMax += offsetX
            boundaryBox.yMin += offsetY
            boundaryBox.yMax += offsetY
          }
          //put transformed image data onto canvas (ok to use put image data because the layer should not have anything else on it at this point)
          transformRasterContent(
            action.layer,
            state.pastedImages[action.pastedImageKey].imageData,
            boundaryBox,
            action.transformationRotationDegrees % 360,
            action.isMirroredHorizontally,
            action.isMirroredVertically
          )
        }
      }
      break
    }
    default:
    //do nothing
  }
}

/**
 * Helper for performAction to render vectors
 * @param {object} action - The vector action to be rendered
 * @param {CanvasRenderingContext2D} activeCtx - The canvas context for saving between actions
 */
function renderActionVectors(action, activeCtx = null) {
  //Correct action coordinates with layer offsets
  const offsetX = action.layer.x
  const offsetY = action.layer.y
  //correct boundary box for offsets
  const boundaryBox = { ...action.boundaryBox }
  if (boundaryBox.xMax !== null) {
    boundaryBox.xMin += offsetX
    boundaryBox.xMax += offsetX
    boundaryBox.yMin += offsetY
    boundaryBox.yMax += offsetY
  }
  //render vectors
  for (let i = 0; i < action.vectorIndices.length; i++) {
    const vector = state.vectors[action.vectorIndices[i]]
    if (vector.hidden || vector.removed) continue
    switch (vector.vectorProperties.type) {
      case "fill":
        actionFill(
          vector.vectorProperties.px1 + offsetX,
          vector.vectorProperties.py1 + offsetY,
          boundaryBox,
          vector.color,
          vector.layer,
          vector.modes,
          null, //maskSet made from action.maskArray
          activeCtx
        )
        break
      case "line":
        actionLine(
          vector.vectorProperties.px1 + offsetX,
          vector.vectorProperties.py1 + offsetY,
          vector.vectorProperties.px2 + offsetX,
          vector.vectorProperties.py2 + offsetY,
          boundaryBox,
          vector.color,
          vector.layer,
          vector.modes,
          brushStamps[vector.brushType][vector.brushSize],
          vector.brushSize,
          null, //maskSet made from action.maskArray
          null,
          activeCtx
        )
        break
      case "quadCurve":
        actionQuadraticCurve(
          vector.vectorProperties.px1 + offsetX,
          vector.vectorProperties.py1 + offsetY,
          vector.vectorProperties.px2 + offsetX,
          vector.vectorProperties.py2 + offsetY,
          vector.vectorProperties.px3 + offsetX,
          vector.vectorProperties.py3 + offsetY,
          boundaryBox,
          2,
          vector.color,
          vector.layer,
          vector.modes,
          brushStamps[vector.brushType][vector.brushSize],
          vector.brushSize,
          null, //maskSet made from action.maskArray
          activeCtx
        )
        break
      case "cubicCurve":
        actionCubicCurve(
          vector.vectorProperties.px1 + offsetX,
          vector.vectorProperties.py1 + offsetY,
          vector.vectorProperties.px2 + offsetX,
          vector.vectorProperties.py2 + offsetY,
          vector.vectorProperties.px3 + offsetX,
          vector.vectorProperties.py3 + offsetY,
          vector.vectorProperties.px4 + offsetX,
          vector.vectorProperties.py4 + offsetY,
          boundaryBox,
          3,
          vector.color,
          vector.layer,
          vector.modes,
          brushStamps[vector.brushType][vector.brushSize],
          vector.brushSize,
          null, //maskSet made from action.maskArray
          activeCtx
        )
        break
      case "ellipse":
        actionEllipse(
          vector.vectorProperties.px1 + offsetX,
          vector.vectorProperties.py1 + offsetY,
          vector.vectorProperties.px2 + offsetX,
          vector.vectorProperties.py2 + offsetY,
          vector.vectorProperties.px3 + offsetX,
          vector.vectorProperties.py3 + offsetY,
          vector.vectorProperties.radA,
          vector.vectorProperties.radB,
          vector.vectorProperties.forceCircle,
          boundaryBox,
          vector.color,
          vector.layer,
          vector.modes,
          brushStamps[vector.brushType][vector.brushSize],
          vector.brushSize,
          vector.vectorProperties.angle,
          vector.vectorProperties.unifiedOffset,
          vector.vectorProperties.x1Offset,
          vector.vectorProperties.y1Offset,
          null, //maskSet made from action.maskArray
          activeCtx
        )
        break
      default:
      //do nothing
    }
  }
}

/**
 * Update layers after redo
 * Helper for redrawTimelineActions
 */
function updateLayersAfterRedo() {
  state.redoStack.forEach((action) => {
    if (action.tool === "addLayer") {
      action.layer.removed = true
      if (action.layer === canvas.currentLayer) {
        canvas.currentLayer.inactiveTools.forEach((tool) => {
          dom[`${tool}Btn`].disabled = false
        })
        canvas.currentLayer = canvas.layers.find(
          (layer) => layer.type === "raster" && layer.removed === false
        )
        canvas.currentLayer.inactiveTools.forEach((tool) => {
          dom[`${tool}Btn`].disabled = true
        })
      }
    }
  })
}

/**
 * Draw the canvas layers
 * @param {object} layer - The layer to be drawn
 */
function drawLayer(layer) {
  layer.onscreenCtx.save()

  if (!layer.removed && !layer.hidden) {
    if (layer.type === "reference") {
      layer.onscreenCtx.globalAlpha = layer.opacity
      //layer.x, layer.y need to be normalized to the pixel grid
      layer.onscreenCtx.drawImage(
        layer.img,
        canvas.xOffset +
          (layer.x * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
        canvas.yOffset +
          (layer.y * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
        layer.img.width * layer.scale,
        layer.img.height * layer.scale
      )
    } else {
      layer.onscreenCtx.beginPath()
      layer.onscreenCtx.rect(
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      layer.onscreenCtx.clip()
      layer.onscreenCtx.globalAlpha = layer.opacity
      layer.onscreenCtx.drawImage(
        layer.cvs,
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
    }
  }
  layer.onscreenCtx.restore()
}

/**
 * Draw canvas layer onto its onscreen canvas
 * @param {object} layer - The layer to be drawn
 */
export function drawCanvasLayer(layer) {
  //Prevent blurring
  layer.onscreenCtx.imageSmoothingEnabled = false
  //clear onscreen canvas
  layer.onscreenCtx.clearRect(
    0,
    0,
    layer.onscreenCvs.width / canvas.zoom,
    layer.onscreenCvs.height / canvas.zoom
  )
  drawLayer(layer)
  //draw border
  layer.onscreenCtx.beginPath()
  layer.onscreenCtx.rect(
    canvas.xOffset - 1,
    canvas.yOffset - 1,
    canvas.offScreenCVS.width + 2,
    canvas.offScreenCVS.height + 2
  )
  layer.onscreenCtx.lineWidth = 2
  layer.onscreenCtx.strokeStyle = canvas.borderColor
  layer.onscreenCtx.stroke()
}

/**
 * Render background canvas
 */
function renderBackgroundCanvas() {
  //clear canvas
  canvas.backgroundCTX.clearRect(
    0,
    0,
    canvas.backgroundCVS.width / canvas.zoom,
    canvas.backgroundCVS.height / canvas.zoom
  )
  //fill background with neutral gray
  canvas.backgroundCTX.fillStyle = canvas.bgColor
  canvas.backgroundCTX.fillRect(
    0,
    0,
    canvas.backgroundCVS.width / canvas.zoom,
    canvas.backgroundCVS.height / canvas.zoom
  )
  //clear drawing space
  canvas.backgroundCTX.clearRect(
    canvas.xOffset,
    canvas.yOffset,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height
  )
}

/**
 * Clear offscreen canvas layers as needed
 * @param {object} activeLayer - The layer to be cleared. If not passed in, all layers will be cleared.
 */
export function clearOffscreenCanvas(activeLayer = null) {
  if (activeLayer) {
    //clear one offscreen layer
    if (activeLayer.type === "raster") {
      activeLayer.ctx.clearRect(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
    }
  } else {
    //clear all offscreen layers
    canvas.layers.forEach((layer) => {
      if (layer.type === "raster") {
        layer.ctx.clearRect(
          0,
          0,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height
        )
      }
    })
  }
}

/**
 * Main render function for the canvas
 * @param {object} activeLayer - pass in a layer to render only that layer
 * @param {boolean} redrawTimeline - pass true to redraw all previous actions
 * @param {Array} activeIndexes - pass in an array of indexes to render only those actions
 * @param {boolean} setImages - pass true to set images for actions between indexes
 */
export function renderCanvas(
  activeLayer = null,
  redrawTimeline = false,
  activeIndexes = null,
  setImages = false
) {
  //Handle offscreen canvases
  if (redrawTimeline) {
    //clear offscreen layers
    clearOffscreenCanvas(activeLayer)
    //render all previous actions
    redrawTimelineActions(activeLayer, activeIndexes, setImages)
  }
  //Handle onscreen canvases
  //render background canvas
  renderBackgroundCanvas()
  //draw offscreen canvases onto onscreen canvases
  if (activeLayer) {
    drawCanvasLayer(activeLayer)
  } else {
    canvas.layers.forEach((layer) => {
      drawCanvasLayer(layer, null)
    })
  }
}

/**
 * Resize the offscreen canvas and all layers
 * @param {number} width - (Integer)
 * @param {number} height - (Integer)
 */
export const resizeOffScreenCanvas = (width, height) => {
  canvas.offScreenCVS.width = width
  canvas.offScreenCVS.height = height
  canvas.previewCVS.width = width
  canvas.previewCVS.height = height
  // canvas.thumbnailCVS.width = canvas.offScreenCVS.width
  // canvas.thumbnailCVS.height = canvas.offScreenCVS.height
  //reset canvas state
  canvas.zoom = setInitialZoom(
    Math.max(canvas.offScreenCVS.width, canvas.offScreenCVS.height)
  )
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.selectionGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.layers.forEach((layer) => {
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0
    )
  })
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0
  )
  canvas.xOffset = Math.round(
    (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.width) /
      2
  )
  canvas.yOffset = Math.round(
    (canvas.currentLayer.onscreenCvs.height / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.height) /
      2
  )
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  canvas.subPixelX = null
  canvas.subPixelY = null
  canvas.zoomPixelX = null
  canvas.zoomPixelY = null
  //resize layers. Per function, it's cheaper to run this inside the existing iterator in drawLayers, but since drawLayers runs so often, it's preferable to only run this here where it's needed.
  canvas.layers.forEach((layer) => {
    if (layer.type === "raster") {
      if (
        layer.cvs.width !== canvas.offScreenCVS.width ||
        layer.cvs.height !== canvas.offScreenCVS.height
      ) {
        layer.cvs.width = canvas.offScreenCVS.width
        layer.cvs.height = canvas.offScreenCVS.height
      }
    }
  })
  renderCanvas(null, true) //render all layers and redraw timeline
  vectorGui.render()
}
