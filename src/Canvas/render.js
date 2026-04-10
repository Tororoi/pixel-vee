import { brushStamps } from '../Context/brushStamps.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { tools } from '../Tools/index.js'
import { vectorGui } from '../GUI/vector.js'
import { calculateBrushDirection } from '../utils/drawHelpers.js'
import {
  actionDitherDraw,
  actionBuildUpDitherDraw,
} from '../Actions/pointer/draw.js'
import { actionFill } from '../Actions/pointer/fill.js'
import { actionEllipse } from '../Actions/pointer/ellipse.js'
import { actionPolygon } from '../Actions/pointer/polygon.js'
import { actionCurve } from '../Actions/pointer/curve.js'
import { createStrokeContext } from '../Actions/pointer/strokeContext.js'
import { ditherPatterns } from '../Context/ditherPatterns.js'
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
    const action = state.timeline.undoStack[i]
    if (
      lastPasteAction === null &&
      action.tool === 'paste' &&
      !action.confirmed
    )
      lastPasteAction = action
    if (lastTransformAction === null && action.tool === 'transform')
      lastTransformAction = action
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
      const cropDX = state.canvas.cropOffsetX
      const cropDY = state.canvas.cropOffsetY
      performAction(
        action,
        betweenCtx,
        lastPasteAction,
        lastTransformAction,
        buildUpDensityMap,
        cropDX,
        cropDY,
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
 * @param {number} cropDX - horizontal crop offset delta (current - recorded), default 0
 * @param {number} cropDY - vertical crop offset delta (current - recorded), default 0
 */
export function performAction(
  action,
  betweenCtx = null,
  lastPasteAction = null,
  lastTransformAction = null,
  buildUpDensityMap = null,
  cropDX = 0,
  cropDY = 0,
) {
  if (!action?.boundaryBox) {
    return
  }
  switch (action.tool) {
    case 'brush': {
      //Correct action coordinates with layer offsets
      const offsetX = action.layer.x + cropDX
      const offsetY = action.layer.y + cropDY
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
        // layer offset and crop delta to get absolute canvas coordinates.
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
      // Pixels are replayed at (p.x + offsetX + cropDX), so the tile lookup must
      // shift by (recordedLayerX - offsetX - cropDX) to keep the pattern fixed to the pixels.
      const recordedLayerX = action.recordedLayerX
      const recordedLayerY = action.recordedLayerY
      const effectiveDitherOffsetX =
        ((((action.ditherOffsetX ?? 0) + recordedLayerX - offsetX) % 8) + 8) % 8
      const effectiveDitherOffsetY =
        ((((action.ditherOffsetY ?? 0) + recordedLayerY - offsetY) % 8) + 8) % 8
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
        const isCustomStamp = action.brushType === 'custom'
        strokeCtx.brushSize = isCustomStamp ? 32 : p.brushSize
        const stamp = isCustomStamp
          ? action.customStampEntry[brushDirection]
          : brushStamps[action.brushType][p.brushSize][brushDirection]
        if (isBuildUp) {
          actionBuildUpDitherDraw(
            p.x + offsetX,
            p.y + offsetY,
            stamp,
            strokeCtx,
          )
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
    case 'curve':
    case 'ellipse':
    case 'polygon':
    case 'vectorPaste':
      renderActionVectors(action, betweenCtx, cropDX, cropDY)
      break
    case 'cut': {
      //Correct action coordinates with layer offsets
      const offsetX = action.layer.x
      const offsetY = action.layer.y
      //correct boundary box for offsets
      const boundaryBox = { ...action.boundaryBox }
      if (boundaryBox.xMax !== null) {
        boundaryBox.xMin += offsetX + cropDX
        boundaryBox.xMax += offsetX + cropDX
        boundaryBox.yMin += offsetY + cropDY
        boundaryBox.yMax += offsetY + cropDY
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
        boundaryBox.xMin += offsetX + cropDX
        boundaryBox.xMax += offsetX + cropDX
        boundaryBox.yMin += offsetY + cropDY
        boundaryBox.yMax += offsetY + cropDY
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
            boundaryBox.xMin += offsetX + cropDX
            boundaryBox.xMax += offsetX + cropDX
            boundaryBox.yMin += offsetY + cropDY
            boundaryBox.yMax += offsetY + cropDY
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
 * @param {number} cropDX - horizontal crop offset delta, default 0
 * @param {number} cropDY - vertical crop offset delta, default 0
 */
function renderActionVectors(action, activeCtx = null, cropDX = 0, cropDY = 0) {
  //Correct action coordinates with layer offsets
  const offsetX = action.layer.x + cropDX
  const offsetY = action.layer.y + cropDY
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
    const vectorProperties = vector.vectorProperties
    const vRecordedLayerX = vector.recordedLayerX
    const vRecordedLayerY = vector.recordedLayerY
    const vEffectiveDitherOffsetX =
      ((((vector.ditherOffsetX ?? 0) + vRecordedLayerX - offsetX) % 8) + 8) % 8
    const vEffectiveDitherOffsetY =
      ((((vector.ditherOffsetY ?? 0) + vRecordedLayerY - offsetY) % 8) + 8) % 8
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
    switch (vectorProperties.tool) {
      case 'fill': {
        // let tempMask = new Set([vectorProperties.px1 + offsetX, vectorProperties.py1 + offsetY])
        actionFill(
          vectorProperties.px1 + offsetX,
          vectorProperties.py1 + offsetY,
          vectorCtx,
        )
        break
      }
      case 'curve': {
        const stepNum = vector.modes.cubicCurve
          ? 3
          : vector.modes.quadCurve
            ? 2
            : 1
        actionCurve(
          vectorProperties.px1 + offsetX,
          vectorProperties.py1 + offsetY,
          vectorProperties.px2 + offsetX,
          vectorProperties.py2 + offsetY,
          vectorProperties.px3 + offsetX,
          vectorProperties.py3 + offsetY,
          vectorProperties.px4 + offsetX,
          vectorProperties.py4 + offsetY,
          stepNum,
          vectorCtx,
        )
        break
      }
      case 'ellipse':
        actionEllipse(
          vectorProperties.weight,
          vectorProperties.leftTangentX + offsetX,
          vectorProperties.leftTangentY + offsetY,
          vectorProperties.topTangentX + offsetX,
          vectorProperties.topTangentY + offsetY,
          vectorProperties.rightTangentX + offsetX,
          vectorProperties.rightTangentY + offsetY,
          vectorProperties.bottomTangentX + offsetX,
          vectorProperties.bottomTangentY + offsetY,
          vectorCtx,
        )
        break
      case 'polygon':
        actionPolygon(
          vectorProperties.px1 + offsetX,
          vectorProperties.py1 + offsetY,
          vectorProperties.px2 + offsetX,
          vectorProperties.py2 + offsetY,
          vectorProperties.px3 + offsetX,
          vectorProperties.py3 + offsetY,
          vectorProperties.px4 + offsetX,
          vectorProperties.py4 + offsetY,
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
  // Skip the clear+redraw when the timeline is empty — this preserves pixel data
  // that was baked directly into layer canvases (e.g. after a content-shift resize).
  if (redrawTimeline && state.timeline.undoStack.length > 0) {
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
 * Apply new canvas dimensions: resize all canvases, recalculate transforms,
 * adjust canvas position to stay stable, and resize raster layer canvases (clearing their pixel data).
 * Called by resizeOffScreenCanvas and the undo/redo resize handler.
 * @param {number} width - (Integer)
 * @param {number} height - (Integer)
 * @param {number} [contentOffsetX] - how far the existing art shifted right in the new canvas (canvas pixels)
 * @param {number} [contentOffsetY] - how far the existing art shifted down in the new canvas (canvas pixels)
 */
export function applyCanvasDimensions(
  width,
  height,
  contentOffsetX = 0,
  contentOffsetY = 0,
) {
  canvas.offScreenCVS.width = width
  canvas.offScreenCVS.height = height
  canvas.previewCVS.width = width
  canvas.previewCVS.height = height
  const t = canvas.sharpness * canvas.zoom
  canvas.vectorGuiCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.selectionGuiCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.resizeOverlayCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.cursorCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.layers.forEach((layer) => {
    layer.onscreenCtx.setTransform(t, 0, 0, t, 0, 0)
  })
  canvas.backgroundCTX.setTransform(t, 0, 0, t, 0, 0)
  canvas.xOffset = Math.round(canvas.xOffset - contentOffsetX)
  canvas.yOffset = Math.round(canvas.yOffset - contentOffsetY)
  canvas.previousXOffset = canvas.xOffset
  canvas.previousYOffset = canvas.yOffset
  canvas.subPixelX = null
  canvas.subPixelY = null
  canvas.zoomPixelX = null
  canvas.zoomPixelY = null
  // Resize raster layer canvases (this clears their pixel data)
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
}

/**
 * Resize the offscreen canvas and all layers.
 * @param {number} width - (Integer)
 * @param {number} height - (Integer)
 * @param {number} [contentOffsetX] - how far the existing art shifted right in the new canvas (canvas pixels)
 * @param {number} [contentOffsetY] - how far the existing art shifted down in the new canvas (canvas pixels)
 */
export const resizeOffScreenCanvas = (
  width,
  height,
  contentOffsetX = 0,
  contentOffsetY = 0,
) => {
  applyCanvasDimensions(width, height, contentOffsetX, contentOffsetY)

  renderCanvas(null, true)
  vectorGui.render()
}
