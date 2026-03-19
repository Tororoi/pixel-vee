import { brushStamps } from '../Context/brushStamps.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { tools } from '../Tools/index.js'
import { vectorGui } from '../GUI/vector.js'
import { calculateBrushDirection } from '../utils/drawHelpers.js'
import { actionDitherDraw, actionBuildUpDitherDraw } from '../Actions/pointer/draw.js'
import { actionLine } from '../Actions/pointer/line.js'
import { actionFill } from '../Actions/pointer/fill.js'
import { actionEllipse } from '../Actions/pointer/ellipse.js'
import { actionQuadraticCurve, actionCubicCurve } from '../Actions/pointer/curve.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'
import { setInitialZoom } from '../utils/canvasHelpers.js'
import { transformRasterContent } from '../utils/transformHelpers.js'

// rAF batching for brush stroke renders
let _scheduledLayer = null
let _rafId = null

/**
 * Schedule a renderCanvas call for the next animation frame.
 * Multiple calls before the frame fires collapse into one render,
 * eliminating wasted redraws on high-frequency pointermove events.
 * Only use this when the offscreen canvas is already up-to-date and
 * you just need to blit it to the onscreen canvas (no preview draw follows).
 * @param {object} layer - the layer to render (passed through to renderCanvas)
 */
export function scheduleRender(layer) {
  _scheduledLayer = layer
  if (_rafId === null) {
    _rafId = requestAnimationFrame(() => {
      _rafId = null
      renderCanvas(_scheduledLayer)
      _scheduledLayer = null
    })
  }
}

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
  // Build a Map for O(1) position lookups instead of repeated O(n) includes/indexOf calls
  const activeIndexMap = activeIndexes
    ? new Map(activeIndexes.map((idx, pos) => [idx, pos]))
    : null
  if (activeIndexes) {
    if (setImages) {
      //set initial sandwiched canvas
      betweenCtx = createAndSaveContext()
    } else {
      //set starting index at first active index
      startIndex = activeIndexes[0]
    }
  }
  // Pre-compute the last unconfirmed paste and transform actions so performAction
  // can do an O(1) reference check instead of an O(n) reverse scan per action.
  let lastPasteAction = null
  let lastTransformAction = null
  for (let i = state.timeline.undoStack.length - 1; i >= 0; i--) {
    const a = state.timeline.undoStack[i]
    if (lastPasteAction === null && a.tool === 'paste' && !a.confirmed)
      lastPasteAction = a
    if (lastTransformAction === null && a.tool === 'transform')
      lastTransformAction = a
    if (lastPasteAction !== null && lastTransformAction !== null) break
  }
  // Per-layer density maps for build-up dither replay.
  // Keys are layer objects; values are Map<(y<<16)|x, count>.
  const buildUpLayerMaps = new Map()
  //loop through all actions
  for (let i = startIndex; i < state.timeline.undoStack.length; i++) {
    let action = state.timeline.undoStack[i]
    //if layer is passed in, only redraw for that layer
    if (layer) {
      if (action.layer !== layer) continue
    }
    if (activeIndexMap) {
      if (activeIndexMap.has(i)) {
        //render betweenCanvas
        let activeIndex = activeIndexMap.get(i)
        //draw accumulated canvas actions from previous betweenCanvas to action.layer.ctx
        action.layer.ctx.drawImage(
          state.timeline.savedBetweenActionImages[activeIndex].cvs,
          0,
          0,
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
      ['raster', 'vector'].includes(tool.type)
    ) {
      // Resolve the density map for this action (only relevant for buildUpDither brush actions)
      let buildUpDensityMap = null
      if (action.tool === 'brush' && action.modes?.buildUpDither) {
        if (!buildUpLayerMaps.has(action.layer)) {
          buildUpLayerMaps.set(action.layer, new Map())
        }
        buildUpDensityMap = buildUpLayerMaps.get(action.layer)
      }
      performAction(
        action,
        betweenCtx,
        lastPasteAction,
        lastTransformAction,
        buildUpDensityMap,
      )
      // After rendering, accumulate this action's delta into the layer map
      if (
        action.tool === 'brush' &&
        action.modes?.buildUpDither &&
        action.buildUpDensityDelta
      ) {
        const layerMap = buildUpLayerMaps.get(action.layer)
        for (const coord of action.buildUpDensityDelta) {
          layerMap.set(coord, (layerMap.get(coord) ?? 0) + 1)
        }
      }
    }
    if (activeIndexMap) {
      if (activeIndexMap.has(i)) {
        if (setImages) {
          //if activeIndexes and setImages, loop through all actions and set image from previous active index to current active index to state.timeline.savedBetweenActionImages[i].betweenImage
          betweenCtx = createAndSaveContext()
          //actions rendered in loop beyond this point will render onto this cvs until a new one is set
        } else {
          //set i to next activeIndex to skip all actions until next activeIndex
          let nextActiveIndex = activeIndexes[activeIndexMap.get(i) + 1]
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
          state.timeline.savedBetweenActionImages[
            state.timeline.savedBetweenActionImages.length - 1
          ].cvs,
          0,
          0,
        )
        //exit for loop
        break
      } else if (i === state.timeline.undoStack.length - 1 && setImages) {
        //Finished rendering all actions but last set exists only on betweenCanvas at this point, so render it to the layer
        //draw accumulated canvas actions from previous betweenCanvas to action.layer.ctx
        action.layer.ctx.drawImage(
          state.timeline.savedBetweenActionImages[
            state.timeline.savedBetweenActionImages.length - 1
          ].cvs,
          0,
          0,
        )
      }
    }
  }
  // renderLayersToDOM()
  // renderVectorsToDOM()
}

/**
 * Create canvas for saving between actions
 * @returns {CanvasRenderingContext2D} betweenCtx
 */
function createAndSaveContext() {
  let cvs = document.createElement('canvas')
  let ctx = cvs.getContext('2d', {
    willReadFrequently: true,
  })
  cvs.width = canvas.offScreenCVS.width
  cvs.height = canvas.offScreenCVS.height
  state.timeline.savedBetweenActionImages.push({ cvs, ctx })
  return ctx
}

/**
 * Helper for redrawTimelineActions
 * @param {object} action - The action to be performed
 * @param {CanvasRenderingContext2D} betweenCtx - The canvas context for saving between actions
 * @param {object|null} lastPasteAction - Most recent paste action for this layer
 * @param {object|null} lastTransformAction - Most recent transform action for this layer
 * @param {Map<number, number>|null} buildUpDensityMap - Accumulated density counts for build-up dither
 */
export function performAction(
  action,
  betweenCtx = null,
  lastPasteAction = null,
  lastTransformAction = null,
  buildUpDensityMap = null,
) {
  if (!action?.boundaryBox) {
    return
  }
  switch (action.tool) {
    case 'brush': {
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
        // Rebuild as packed integers (y<<16)|x — the format draw.js expects.
        // maskArray stores layer-relative {x,y} objects; re-apply the current
        // layer offset to get absolute canvas coordinates.
        mask = new Set(
          action.maskArray.map(
            (coord) => ((coord.y + offsetY) << 16) | (coord.x + offsetX),
          ),
        )
      }
      let previousX = action.points[0].x + offsetX
      let previousY = action.points[0].y + offsetY
      let brushDirection = '0,0'
      const isBuildUp = action.modes?.buildUpDither ?? false
      const buildUpSteps = action.buildUpSteps ?? [16, 32, 48, 64]
      const pattern = isBuildUp
        ? null
        : ditherPatterns[action.ditherPatternIndex ?? 64]
      // Build context once per stroke; brushSize is updated per-point below
      // since points may have individual brushSizes stored in the timeline.
      // Effective dither offset accounts for layer movement since stroke was recorded.
      // Pixels are replayed at (p.x + offsetX), so the tile lookup must shift by
      // (recordedLayerX - offsetX) to keep the pattern fixed to the pixels.
      const recordedLayerX = action.recordedLayerX ?? offsetX
      const recordedLayerY = action.recordedLayerY ?? offsetY
      const effectiveDitherOffsetX = (((action.ditherOffsetX ?? 0) + recordedLayerX - offsetX) % 8 + 8) % 8
      const effectiveDitherOffsetY = (((action.ditherOffsetY ?? 0) + recordedLayerY - offsetY) % 8 + 8) % 8
      const strokeCtx = createStrokeContext({
        layer: action.layer,
        customContext: betweenCtx,
        boundaryBox,
        currentColor: action.color,
        currentModes: action.modes,
        maskSet: mask,
        seenPixelsSet: seen,
        twoColorMode: action.modes?.twoColor ?? false,
        secondaryColor: action.secondaryColor,
        ditherOffsetX: effectiveDitherOffsetX,
        ditherOffsetY: effectiveDitherOffsetY,
        ditherPattern: pattern,
        densityMap: buildUpDensityMap,
        buildUpSteps,
      })
      for (const p of action.points) {
        brushDirection = calculateBrushDirection(
          p.x + offsetX,
          p.y + offsetY,
          previousX,
          previousY,
        )
        // Update per-point brushSize (timeline supports variable sizes per point)
        strokeCtx.brushSize = p.brushSize
        const stamp = brushStamps[action.brushType][p.brushSize][brushDirection]
        if (isBuildUp) {
          actionBuildUpDitherDraw(p.x + offsetX, p.y + offsetY, stamp, strokeCtx)
        } else {
          actionDitherDraw(p.x + offsetX, p.y + offsetY, stamp, strokeCtx)
        }
        previousX = p.x + offsetX
        previousY = p.y + offsetY
        //If points are saved as individual pixels instead of the cursor points so that the brushStamp does not need to be iterated over, it is much faster. But it sacrifices flexibility with points.
      }
      break
    }
    case 'fill':
      renderActionVectors(action, betweenCtx)
      break
    case 'line':
      renderActionVectors(action, betweenCtx)
      break
    case 'quadCurve':
      renderActionVectors(action, betweenCtx)
      break
    case 'cubicCurve':
      renderActionVectors(action, betweenCtx)
      break
    case 'ellipse':
      renderActionVectors(action, betweenCtx)
      break
    case 'cut': {
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
      if (action.maskSet && action.maskSet.length > 0) {
        // maskSet pixels are stored as offscreen canvas coords at the time of the cut.
        // Recover the original bounding box origin in offscreen canvas coords so that
        // each maskSet pixel's relative position is preserved even after layer moves.
        const origXMin = action.boundaryBox.xMin + (action.originalLayerX ?? 0)
        const origYMin = action.boundaryBox.yMin + (action.originalLayerY ?? 0)
        const w = boundaryBox.xMax - boundaryBox.xMin
        const h = boundaryBox.yMax - boundaryBox.yMin
        const imageData = activeCtx.getImageData(
          boundaryBox.xMin,
          boundaryBox.yMin,
          w,
          h,
        )
        const { data } = imageData
        for (const key of action.maskSet) {
          const bx = (key & 0xffff) - origXMin
          const by = ((key >> 16) & 0xffff) - origYMin
          if (bx >= 0 && bx < w && by >= 0 && by < h) {
            const idx = (by * w + bx) * 4
            data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = 0
          }
        }
        activeCtx.putImageData(imageData, boundaryBox.xMin, boundaryBox.yMin)
      } else {
        //Clear boundaryBox area
        activeCtx.clearRect(
          boundaryBox.xMin,
          boundaryBox.yMin,
          boundaryBox.xMax - boundaryBox.xMin,
          boundaryBox.yMax - boundaryBox.yMin,
        )
      }
      break
    }
    case 'paste': {
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
      // Determine if the action is the last unconfirmed 'paste' action in the undoStack
      const isLastPasteAction = action === lastPasteAction
      //if action is latest paste action and not confirmed, render it (account for actions that may be later but do not have the tool name "paste")
      if (action.confirmed) {
        let activeCtx = betweenCtx ? betweenCtx : action.layer.ctx
        activeCtx.drawImage(
          action.canvas,
          boundaryBox.xMin,
          boundaryBox.yMin,
          boundaryBox.xMax - boundaryBox.xMin,
          boundaryBox.yMax - boundaryBox.yMin,
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
          boundaryBox.yMax - boundaryBox.yMin,
        )
      }
      break
    }
    case 'vectorPaste': {
      //render vector paste action (only vectors)
      renderActionVectors(action, betweenCtx)
      break
    }
    case 'transform': {
      if (
        canvas.tempLayer === canvas.currentLayer &&
        action.pastedImageKey === state.clipboard.currentPastedImageKey
      ) {
        if (action === lastTransformAction) {
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
            state.clipboard.pastedImages[action.pastedImageKey].imageData,
            boundaryBox,
            action.transformationRotationDegrees % 360,
            action.isMirroredHorizontally,
            action.isMirroredVertically,
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
    const vector = state.vector.all[action.vectorIndices[i]]
    if (vector.hidden || vector.removed) continue
    const vp = vector.vectorProperties
    const vOffsetX = vector.layer.x
    const vOffsetY = vector.layer.y
    const vRecordedLayerX = vector.recordedLayerX ?? vOffsetX
    const vRecordedLayerY = vector.recordedLayerY ?? vOffsetY
    const vEffectiveDitherOffsetX = (((vector.ditherOffsetX ?? 0) + vRecordedLayerX - vOffsetX) % 8 + 8) % 8
    const vEffectiveDitherOffsetY = (((vector.ditherOffsetY ?? 0) + vRecordedLayerY - vOffsetY) % 8 + 8) % 8
    const vectorCtx = createStrokeContext({
      layer: vector.layer,
      customContext: activeCtx,
      boundaryBox,
      currentColor: vector.color,
      currentModes: vector.modes,
      brushStamp: brushStamps[vector.brushType][vector.brushSize],
      brushSize: vector.brushSize,
      ditherPattern: ditherPatterns[vector.ditherPatternIndex ?? 64],
      twoColorMode: vector.modes?.twoColor ?? false,
      secondaryColor: vector.secondaryColor ?? null,
      ditherOffsetX: vEffectiveDitherOffsetX,
      ditherOffsetY: vEffectiveDitherOffsetY,
    })
    switch (vp.type) {
      case 'fill': {
        // let tempMask = new Set([vp.px1 + offsetX, vp.py1 + offsetY])
        actionFill(vp.px1 + offsetX, vp.py1 + offsetY, vectorCtx)
        break
      }
      case 'line':
        actionLine(
          vp.px1 + offsetX,
          vp.py1 + offsetY,
          vp.px2 + offsetX,
          vp.py2 + offsetY,
          vectorCtx,
        )
        break
      case 'quadCurve':
        actionQuadraticCurve(
          vp.px1 + offsetX,
          vp.py1 + offsetY,
          vp.px2 + offsetX,
          vp.py2 + offsetY,
          vp.px3 + offsetX,
          vp.py3 + offsetY,
          2,
          vectorCtx,
        )
        break
      case 'cubicCurve':
        actionCubicCurve(
          vp.px1 + offsetX,
          vp.py1 + offsetY,
          vp.px2 + offsetX,
          vp.py2 + offsetY,
          vp.px3 + offsetX,
          vp.py3 + offsetY,
          vp.px4 + offsetX,
          vp.py4 + offsetY,
          3,
          vectorCtx,
        )
        break
      case 'ellipse':
        actionEllipse(
          vp.weight,
          vp.leftTangentX + offsetX,
          vp.leftTangentY + offsetY,
          vp.topTangentX + offsetX,
          vp.topTangentY + offsetY,
          vp.rightTangentX + offsetX,
          vp.rightTangentY + offsetY,
          vp.bottomTangentX + offsetX,
          vp.bottomTangentY + offsetY,
          vectorCtx,
        )
        break
      default:
      //do nothing
    }
  }
}

/**
 * Draw the canvas layers
 * @param {object} layer - The layer to be drawn
 */
function drawLayer(layer) {
  layer.onscreenCtx.save()

  if (!layer.removed && !layer.hidden) {
    if (layer.type === 'reference') {
      layer.onscreenCtx.globalAlpha = layer.opacity
      //layer.x, layer.y need to be normalized to the pixel grid
      layer.onscreenCtx.drawImage(
        layer.img,
        canvas.xOffset +
          (layer.x * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
        canvas.yOffset +
          (layer.y * canvas.offScreenCVS.width) / canvas.offScreenCVS.width,
        layer.img.width * layer.scale,
        layer.img.height * layer.scale,
      )
    } else {
      layer.onscreenCtx.beginPath()
      layer.onscreenCtx.rect(
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height,
      )
      layer.onscreenCtx.clip()
      layer.onscreenCtx.globalAlpha = layer.opacity
      layer.onscreenCtx.drawImage(
        layer.cvs,
        canvas.xOffset,
        canvas.yOffset,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height,
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
    layer.onscreenCvs.height / canvas.zoom,
  )
  drawLayer(layer)
  //draw border
  layer.onscreenCtx.beginPath()
  layer.onscreenCtx.rect(
    canvas.xOffset - 1,
    canvas.yOffset - 1,
    canvas.offScreenCVS.width + 2,
    canvas.offScreenCVS.height + 2,
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
    canvas.backgroundCVS.height / canvas.zoom,
  )
  //fill background with neutral gray
  canvas.backgroundCTX.fillStyle = canvas.bgColor
  canvas.backgroundCTX.fillRect(
    0,
    0,
    canvas.backgroundCVS.width / canvas.zoom,
    canvas.backgroundCVS.height / canvas.zoom,
  )
  //clear drawing space
  canvas.backgroundCTX.clearRect(
    canvas.xOffset,
    canvas.yOffset,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height,
  )
}

/**
 * Clear offscreen canvas layers as needed
 * @param {object} activeLayer - The layer to be cleared. If not passed in, all layers will be cleared.
 */
export function clearOffscreenCanvas(activeLayer = null) {
  if (activeLayer) {
    //clear one offscreen layer
    if (activeLayer.type === 'raster') {
      activeLayer.ctx.clearRect(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height,
      )
    }
  } else {
    //clear all offscreen layers
    canvas.layers.forEach((layer) => {
      if (layer.type === 'raster') {
        layer.ctx.clearRect(
          0,
          0,
          canvas.offScreenCVS.width,
          canvas.offScreenCVS.height,
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
  setImages = false,
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
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height,
    canvas.vectorGuiCVS.offsetWidth,
    canvas.vectorGuiCVS.offsetHeight,
  )
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.selectionGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.cursorCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.layers.forEach((layer) => {
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0,
    )
  })
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.xOffset = Math.round(
    (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.width) /
      2,
  )
  canvas.yOffset = Math.round(
    (canvas.currentLayer.onscreenCvs.height / canvas.sharpness / canvas.zoom -
      canvas.offScreenCVS.height) /
      2,
  )
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  canvas.subPixelX = null
  canvas.subPixelY = null
  canvas.zoomPixelX = null
  canvas.zoomPixelY = null
  //resize layers. Per function, it's cheaper to run this inside the existing iterator in drawLayers, but since drawLayers runs so often, it's preferable to only run this here where it's needed.
  canvas.layers.forEach((layer) => {
    if (layer.type === 'raster') {
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
