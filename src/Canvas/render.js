import { dom } from "../Context/dom.js"
import { brushStamps } from "../Context/brushStamps.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
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

/**
 * Redraw all timeline actions
 * Critical function for the timeline to work
 * For handling activeIndexes, the idea is to save images of multiple actions that aren't changing to save time redrawing.
 * The current problem is that later actions "fill" or "draw" with a mask are affected by earlier actions.
 * TODO: (Low Priority) Another efficiency improvement would be to perform incremental rendering with caching so only the affected region of the canvas is rerendered.
 * TODO: (Middle Priority) Use OffscreenCanvas in a web worker to offload rendering to a separate thread.
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
    if (
      !action.hidden &&
      !action.removed &&
      ["raster", "vector"].includes(action.tool.type)
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
  let ctx = cvs.getContext("2d", { willReadFrequently: true })
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
  if (!action.properties?.boundaryBox) {
    return
  }
  //Correct action coordinates with layer offsets
  const offsetX = action.layer.x
  const offsetY = action.layer.y
  //correct boundary box for offsets
  const boundaryBox = { ...action.properties.boundaryBox }
  if (boundaryBox.xMax !== null) {
    boundaryBox.xMin += offsetX
    boundaryBox.xMax += offsetX
    boundaryBox.yMin += offsetY
    boundaryBox.yMax += offsetY
  }
  switch (action.tool.name) {
    case "brush": {
      let seen = new Set()
      let mask = null
      //TODO: (Low Priority) implement points and maskArray as an array of integers to reduce space cost. Could be stored as typed arrays but not meaningful for storing the json file.
      //points require 3 entries for every coordinate, x, y, brushSize
      //maskArray requires 2 entries for every coordinate, x, y
      if (action.properties.maskArray) {
        if (offsetX !== 0 || offsetY !== 0) {
          mask = new Set(
            action.properties.maskArray.map(
              (coord) => `${coord.x + offsetX},${coord.y + offsetY}`
            )
          )
        } else {
          mask = new Set(action.properties.maskArray)
        }
      }
      let previousX = action.properties.points[0].x + offsetX
      let previousY = action.properties.points[0].y + offsetY
      let brushDirection = "0,0"
      for (const p of action.properties.points) {
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
          action.properties.selectionInversed,
          action.color,
          brushStamps[action.tool.brushType][p.brushSize][brushDirection],
          p.brushSize,
          action.layer,
          action.modes,
          mask,
          seen,
          betweenCtx
        )
        previousX = p.x + offsetX
        previousY = p.y + offsetY
        //If points are saved as individual pixels instead of the cursor points so that the brushStamp does not need to be iterated over, it is much faster:
        // action.layer.ctx.fillStyle = action.color
        // let x = p.x
        // let y = p.y
        // const key = `${x},${y}`
        // if (!seen.has(key)) {
        //   seen.add(key)
        //   switch (action.mode) {
        //     case "erase":
        //       action.layer.ctx.clearRect(x, y, 1, 1)
        //       break
        //     case "inject":
        //       action.layer.ctx.clearRect(x, y, 1, 1)
        //       action.layer.ctx.fillRect(x, y, 1, 1)
        //       break
        //     default:
        //       action.layer.ctx.fillRect(x, y, 1, 1)
        //   }
        // }
      }
      break
    }
    case "fill":
      actionFill(
        action.properties.vectorProperties.px1 + offsetX,
        action.properties.vectorProperties.py1 + offsetY,
        boundaryBox,
        action.properties.selectionInversed,
        action.color,
        action.layer,
        action.modes,
        null, //maskSet made from action.properties.maskArray
        betweenCtx
      )
      break
    case "line":
      actionLine(
        action.properties.px1 + offsetX,
        action.properties.py1 + offsetY,
        action.properties.px2 + offsetX,
        action.properties.py2 + offsetY,
        boundaryBox,
        action.properties.selectionInversed,
        action.color,
        action.layer,
        action.modes,
        brushStamps[action.tool.brushType][action.tool.brushSize],
        action.tool.brushSize,
        null, //maskSet made from action.properties.maskArray
        null,
        betweenCtx
      )
      break
    case "quadCurve":
      actionQuadraticCurve(
        action.properties.vectorProperties.px1 + offsetX,
        action.properties.vectorProperties.py1 + offsetY,
        action.properties.vectorProperties.px2 + offsetX,
        action.properties.vectorProperties.py2 + offsetY,
        action.properties.vectorProperties.px3 + offsetX,
        action.properties.vectorProperties.py3 + offsetY,
        boundaryBox,
        action.properties.selectionInversed,
        3,
        action.color,
        action.layer,
        action.modes,
        brushStamps[action.tool.brushType][action.tool.brushSize],
        action.tool.brushSize,
        null, //maskSet made from action.properties.maskArray
        betweenCtx
      )
      break
    case "cubicCurve":
      actionCubicCurve(
        action.properties.vectorProperties.px1 + offsetX,
        action.properties.vectorProperties.py1 + offsetY,
        action.properties.vectorProperties.px2 + offsetX,
        action.properties.vectorProperties.py2 + offsetY,
        action.properties.vectorProperties.px3 + offsetX,
        action.properties.vectorProperties.py3 + offsetY,
        action.properties.vectorProperties.px4 + offsetX,
        action.properties.vectorProperties.py4 + offsetY,
        boundaryBox,
        action.properties.selectionInversed,
        4,
        action.color,
        action.layer,
        action.modes,
        brushStamps[action.tool.brushType][action.tool.brushSize],
        action.tool.brushSize,
        null, //maskSet made from action.properties.maskArray
        betweenCtx
      )
      break
    case "ellipse":
      actionEllipse(
        action.properties.vectorProperties.px1 + offsetX,
        action.properties.vectorProperties.py1 + offsetY,
        action.properties.vectorProperties.px2 + offsetX,
        action.properties.vectorProperties.py2 + offsetY,
        action.properties.vectorProperties.px3 + offsetX,
        action.properties.vectorProperties.py3 + offsetY,
        action.properties.vectorProperties.radA,
        action.properties.vectorProperties.radB,
        action.properties.vectorProperties.forceCircle,
        boundaryBox,
        action.properties.selectionInversed,
        action.color,
        action.layer,
        action.modes,
        brushStamps[action.tool.brushType][action.tool.brushSize],
        action.tool.brushSize,
        action.properties.vectorProperties.angle,
        action.properties.vectorProperties.unifiedOffset,
        action.properties.vectorProperties.x1Offset,
        action.properties.vectorProperties.y1Offset,
        null, //maskSet made from action.properties.maskArray
        betweenCtx
      )
      break
    case "cut":
      //TODO:(Low Priority) handle betweenCtx, clean up actions so logic does not need to be repeated here. Not currently affected by betweenCtx so not needed for current functionality.
      if (action.properties.selectionInversed) {
        //inverted selection: clear entire canvas area minus boundaryBox
        //create a clip mask for the boundaryBox to prevent clearing the inner area
        action.layer.ctx.save()
        action.layer.ctx.beginPath()
        //define rectangle for canvas area
        action.layer.ctx.rect(
          0,
          0,
          action.layer.cvs.width,
          action.layer.cvs.height
        )
        action.layer.ctx.rect(
          boundaryBox.xMin,
          boundaryBox.yMin,
          boundaryBox.xMax - boundaryBox.xMin,
          boundaryBox.yMax - boundaryBox.yMin
        )
        action.layer.ctx.clip("evenodd")
        action.layer.ctx.clearRect(
          0,
          0,
          action.layer.cvs.width,
          action.layer.cvs.height
        )
        action.layer.ctx.restore()
      } else {
        //non-inverted selection: clear boundaryBox area
        action.layer.ctx.clearRect(
          boundaryBox.xMin,
          boundaryBox.yMin,
          boundaryBox.xMax - boundaryBox.xMin,
          boundaryBox.yMax - boundaryBox.yMin
        )
      }
      break
    case "paste": {
      //render paste action
      // Determine if the action is the last 'paste' action in the undoStack
      let isLastPasteAction = false // Default to false
      if (!action.properties.confirmed) {
        for (let i = state.undoStack.length - 1; i >= 0; i--) {
          if (state.undoStack[i].tool.name === "paste") {
            // If the first 'paste' action found from the end is the current action
            isLastPasteAction = state.undoStack[i] === action
            break // Stop searching once the first 'paste' action is found
          }
        }
      }
      //if action is latest paste action and not confirmed, render it (account for actions that may be later but do not have the tool name "paste")
      if (action.properties.confirmed) {
        let activeCtx = betweenCtx ? betweenCtx : action.layer.ctx
        activeCtx.drawImage(
          action.properties.canvas,
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
          action.properties.canvas,
          boundaryBox.xMin,
          boundaryBox.yMin,
          boundaryBox.xMax - boundaryBox.xMin,
          boundaryBox.yMax - boundaryBox.yMin
        )
      }
      break
    }
    default:
    //do nothing
  }
}

/**
 * Update layers after redo
 * Helper for redrawTimelineActions
 */
function updateLayersAfterRedo() {
  state.redoStack.forEach((action) => {
    if (action.tool.name === "addLayer") {
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
  canvas.rasterGuiCTX.setTransform(
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
