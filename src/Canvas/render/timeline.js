import { brushStamps } from '../../Context/brushStamps.js'
import { state } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { tools } from '../../Tools/index.js'
import { calculateBrushDirection } from '../../utils/drawHelpers.js'
import { actionDitherDraw, actionBuildUpDitherDraw } from '../../Actions/pointer/draw.js'
import { actionLine } from '../../Actions/pointer/line.js'
import { actionFill } from '../../Actions/pointer/fill.js'
import { actionEllipse } from '../../Actions/pointer/ellipse.js'
import { actionQuadraticCurve, actionCubicCurve } from '../../Actions/pointer/curve.js'
import { createStrokeContext } from '../../Actions/pointer/strokeContext.js'
import { ditherPatterns } from '../../Context/ditherPatterns.js'
import { transformRasterContent } from '../../utils/transformHelpers.js'

/**
 * Correct action coordinates with layer offsets and return both.
 * @param {object} action - The action containing layer and boundaryBox
 * @returns {{ offsetX: number, offsetY: number, boundaryBox: object }}
 */
function calcOffsetBoundaryBox(action) {
  const offsetX = action.layer.x
  const offsetY = action.layer.y
  const boundaryBox = { ...action.boundaryBox }
  if (boundaryBox.xMax !== null) {
    boundaryBox.xMin += offsetX
    boundaryBox.xMax += offsetX
    boundaryBox.yMin += offsetY
    boundaryBox.yMax += offsetY
  }
  return { offsetX, offsetY, boundaryBox }
}

/**
 * Compute the effective dither offset accounting for layer movement since recording.
 * @param {number|undefined} storedOffset - The stored ditherOffsetX or ditherOffsetY
 * @param {number} recordedLayerPos - The layer x or y at the time of recording
 * @param {number} currentLayerPos - The current layer x or y
 * @returns {number} - Effective offset in range [0, 7]
 */
function calcEffectiveDitherOffset(storedOffset, recordedLayerPos, currentLayerPos) {
  return (((storedOffset ?? 0) + recordedLayerPos - currentLayerPos) % 8 + 8) % 8
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
      const { offsetX, offsetY, boundaryBox } = calcOffsetBoundaryBox(action)
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
      const effectiveDitherOffsetX = calcEffectiveDitherOffset(action.ditherOffsetX, recordedLayerX, offsetX)
      const effectiveDitherOffsetY = calcEffectiveDitherOffset(action.ditherOffsetY, recordedLayerY, offsetY)
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
      const { offsetX, offsetY, boundaryBox } = calcOffsetBoundaryBox(action)
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
      const { boundaryBox } = calcOffsetBoundaryBox(action)
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
          const { boundaryBox } = calcOffsetBoundaryBox(action)
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
    const vEffectiveDitherOffsetX = calcEffectiveDitherOffset(vector.ditherOffsetX, vRecordedLayerX, vOffsetX)
    const vEffectiveDitherOffsetY = calcEffectiveDitherOffset(vector.ditherOffsetY, vRecordedLayerY, vOffsetY)
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
