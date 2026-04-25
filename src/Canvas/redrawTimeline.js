import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { tools } from '../Tools/index.js'
import { performAction, renderBuildUpDitherSegment } from './performAction.js'

/**
 * Allocates an offscreen canvas and saves it into the shared
 * `savedBetweenActionImages` array so that timeline replay can accumulate
 * multiple actions before committing them to a layer. Storing the canvas
 * reference rather than image data keeps allocation costs low — the caller
 * draws directly onto the returned context rather than copying pixels.
 * @returns {CanvasRenderingContext2D} betweenCtx
 */
function createAndSaveContext() {
  let cvs = document.createElement('canvas')
  let ctx = cvs.getContext('2d', {
    // This canvas is read back when blitting accumulated layers to the target.
    willReadFrequently: true,
  })
  cvs.width = canvas.offScreenCVS.width
  cvs.height = canvas.offScreenCVS.height
  globalState.timeline.savedBetweenActionImages.push({ cvs, ctx })
  return ctx
}

/**
 * Replays all (or a subset of) timeline actions to reconstruct the current
 * canvas state from scratch. This is the critical hot path for undo, redo,
 * and any operation that invalidates the offscreen canvas. The function is
 * deliberately kept expensive to call — callers should batch or minimise
 * invocations. The `activeIndexes` path supports incremental rendering:
 * pre-saved images between indexes are blitted directly so only the changed
 * region needs full replay. Build-up dither actions on the same layer are
 * batched into contiguous segments and handed to `renderBuildUpDitherSegment`
 * for an O(pixels) single-pass render instead of O(actions × points × stamp).
 * A `buildUpDensityReset` action in the undo stack signals that accumulated
 * density for a layer should be zeroed — used when a density-clearing
 * operation such as an erase has been committed.
 *
 * BUG: Can't simply save images and draw them for the betweenCvs because
 * this will ignore actions use erase or inject modes.
 * TODO: (Low Priority) Incremental rendering with caching so only the
 * affected region is rerendered.
 * TODO: (Medium Priority) Use OffscreenCanvas in a web worker to offload
 * rendering to a separate thread.
 * @param {object} layer - optional parameter to limit render to a specific
 *   layer
 * @param {Array} activeIndexes - optional parameter to limit render to
 *   specific actions; if omitted, all actions are rendered
 * @param {boolean} setImages - set images for actions between indexes; used
 *   when history is modified to update cached between-action images
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
  for (let i = globalState.timeline.undoStack.length - 1; i >= 0; i--) {
    const action = globalState.timeline.undoStack[i]
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
  const cropDX = globalState.canvas.cropOffsetX
  const cropDY = globalState.canvas.cropOffsetY

  // Pending segment of consecutive build-up dither actions on the same layer.
  // When a non-build-up action (or layer boundary) is reached, the segment is
  // flushed via renderBuildUpDitherSegment() — a single O(pixels) pass instead
  // of the O(actions × points × stamp) per-action replay. Only used on the
  // common path (no activeIndexes); the activeIndexes path keeps sequential replay.
  let pendingSegment = []
  let pendingSegmentLayer = null

  /**
   * Renders the accumulated build-up dither segment in one pass and resets
   * the pending buffer. Density deltas are folded into `buildUpLayerMaps`
   * after flushing so that subsequent segments on the same layer see the
   * correct cumulative density and produce consistent step indices.
   */
  function flushBuildUpSegment() {
    if (pendingSegment.length === 0) return
    renderBuildUpDitherSegment(
      pendingSegment,
      pendingSegmentLayer,
      buildUpLayerMaps,
      betweenCtx,
      cropDX,
      cropDY,
    )
    // Accumulate deltas into buildUpLayerMaps so any subsequent build-up actions
    // on the same layer see the correct cross-segment density.
    const cw = canvas.offScreenCVS.width
    const ch = canvas.offScreenCVS.height
    for (const a of pendingSegment) {
      if (!a.buildUpDensityDelta) continue
      if (!buildUpLayerMaps.has(a.layer)) {
        buildUpLayerMaps.set(a.layer, new Int32Array(cw * ch))
      }
      const layerMap = buildUpLayerMaps.get(a.layer)
      const lx = a.layer.x + cropDX
      const ly = a.layer.y + cropDY
      for (const coord of a.buildUpDensityDelta) {
        const ax = ((coord << 16) >> 16) + lx
        const ay = (coord >> 16) + ly
        if (ax >= 0 && ax < cw && ay >= 0 && ay < ch) {
          layerMap[ay * cw + ax] += 1
        }
      }
    }
    pendingSegment = []
    pendingSegmentLayer = null
  }

  //loop through all actions
  for (let i = startIndex; i < globalState.timeline.undoStack.length; i++) {
    let action = globalState.timeline.undoStack[i]
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
          globalState.timeline.savedBetweenActionImages[activeIndex].cvs,
          0,
          0,
        )
        if (setImages) {
          //ensure activeCtx uses action.layer.ctx for action at active index
          betweenCtx = null
        }
      }
    }
    // Density reset: flush segment and clear this layer's accumulated density.
    if (action.tool === 'buildUpDensityReset') {
      flushBuildUpSegment()
      if (buildUpLayerMaps.has(action.layer)) {
        buildUpLayerMaps.get(action.layer).fill(0)
      }
      continue
    }

    // Canvas resize changes the coordinate system for all layers; a layer move
    // changes it for that layer. Flush any pending segment so that actions
    // recorded under the old origin are not batched with post-change actions.
    if (
      action.tool === 'resize' ||
      (action.tool === 'move' && action.layer === pendingSegmentLayer)
    ) {
      flushBuildUpSegment()
    }

    const tool = tools[action.tool]
    if (
      !action.hidden &&
      !action.removed &&
      ['raster', 'vector'].includes(tool.type)
    ) {
      const isBuildUp = action.tool === 'brush' && action.modes?.buildUpDither

      if (!activeIndexMap && isBuildUp) {
        // Flush if layer changed or rendering-relevant modes changed between actions.
        if (pendingSegmentLayer !== null) {
          const layerChanged = pendingSegmentLayer !== action.layer
          const prevAction = pendingSegment[pendingSegment.length - 1]
          // Mode changes require a flush because the segment renderer uses a
          // single mode set for the whole batch; mixing modes would corrupt
          // the output.
          const modesChanged =
            prevAction &&
            (!!action.modes?.eraser !== !!prevAction.modes?.eraser ||
              !!action.modes?.inject !== !!prevAction.modes?.inject ||
              !!action.modes?.twoColor !== !!prevAction.modes?.twoColor)
          // A dither offset change between strokes requires a flush because the
          // segment renderer uses the last action's offset for all density-level
          // checks (turnOnStepIdx). Different offsets per stroke produce wrong
          // compositing counts when batched together.
          const ditherOffsetChanged =
            prevAction &&
            (action.ditherOffsetX !== prevAction.ditherOffsetX ||
              action.ditherOffsetY !== prevAction.ditherOffsetY)
          if (layerChanged || modesChanged || ditherOffsetChanged) {
            flushBuildUpSegment()
          }
        }
        pendingSegment.push(action)
        pendingSegmentLayer = action.layer
      } else {
        // Non-build-up action (or activeIndexes path) — flush any pending segment first.
        flushBuildUpSegment()
        // Resolve the density map for this action (activeIndexes path only for build-up)
        let buildUpDensityMap = null
        if (isBuildUp) {
          if (!buildUpLayerMaps.has(action.layer)) {
            buildUpLayerMaps.set(
              action.layer,
              new Int32Array(
                canvas.offScreenCVS.width * canvas.offScreenCVS.height,
              ),
            )
          }
          buildUpDensityMap = buildUpLayerMaps.get(action.layer)
        }
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
        if (isBuildUp && action.buildUpDensityDelta) {
          const layerMap = buildUpLayerMaps.get(action.layer)
          const lx = action.layer.x + cropDX
          const ly = action.layer.y + cropDY
          const cw2 = canvas.offScreenCVS.width
          const ch2 = canvas.offScreenCVS.height
          for (const coord of action.buildUpDensityDelta) {
            const ax = ((coord << 16) >> 16) + lx
            const ay = (coord >> 16) + ly
            if (ax >= 0 && ax < cw2 && ay >= 0 && ay < ch2) {
              layerMap[ay * cw2 + ax] += 1
            }
          }
        }
      }
    }
    if (activeIndexMap) {
      if (activeIndexMap.has(i)) {
        if (setImages) {
          //if activeIndexes and setImages, loop through all actions and set image from previous active index to current active index to globalState.timeline.savedBetweenActionImages[i].betweenImage
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
          globalState.timeline.savedBetweenActionImages[
            globalState.timeline.savedBetweenActionImages.length - 1
          ].cvs,
          0,
          0,
        )
        //exit for loop
        break
      } else if (i === globalState.timeline.undoStack.length - 1 && setImages) {
        //Finished rendering all actions but last set exists only on betweenCanvas at this point, so render it to the layer
        //draw accumulated canvas actions from previous betweenCanvas to action.layer.ctx
        action.layer.ctx.drawImage(
          globalState.timeline.savedBetweenActionImages[
            globalState.timeline.savedBetweenActionImages.length - 1
          ].cvs,
          0,
          0,
        )
      }
    }
  }
  // Flush any remaining build-up segment after the loop ends
  flushBuildUpSegment()
  // updateActiveLayerState()
}
