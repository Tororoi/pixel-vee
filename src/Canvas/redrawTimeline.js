import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { tools } from '../Tools/index.js'
import { performAction, renderBuildUpDitherSegment } from './performAction.js'

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
  globalState.timeline.savedBetweenActionImages.push({ cvs, ctx })
  return ctx
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

  /** Render and clear the pending build-up dither segment. */
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
    for (const a of pendingSegment) {
      if (!a.buildUpDensityDelta) continue
      if (!buildUpLayerMaps.has(a.layer)) buildUpLayerMaps.set(a.layer, new Map())
      const layerMap = buildUpLayerMaps.get(a.layer)
      const lx = a.layer.x + cropDX
      const ly = a.layer.y + cropDY
      for (const coord of a.buildUpDensityDelta) {
        const key = (((coord >>> 16) & 0xffff) + ly) << 16 | ((coord & 0xffff) + lx)
        layerMap.set(key, (layerMap.get(key) ?? 0) + 1)
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
    const tool = tools[action.tool]
    if (
      !action.hidden &&
      !action.removed &&
      ['raster', 'vector'].includes(tool.type)
    ) {
      const isBuildUp = action.tool === 'brush' && action.modes?.buildUpDither

      if (!activeIndexMap && isBuildUp) {
        // Buffer for batch rendering. Flush first if this action is on a different layer.
        if (pendingSegmentLayer !== null && pendingSegmentLayer !== action.layer) {
          flushBuildUpSegment()
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
          cropDX,
          cropDY,
        )
        // After rendering, accumulate this action's delta into the layer map
        if (isBuildUp && action.buildUpDensityDelta) {
          const layerMap = buildUpLayerMaps.get(action.layer)
          const lx = action.layer.x + cropDX
          const ly = action.layer.y + cropDY
          for (const coord of action.buildUpDensityDelta) {
            const key = (((coord >>> 16) & 0xffff) + ly) << 16 | ((coord & 0xffff) + lx)
            layerMap.set(key, (layerMap.get(key) ?? 0) + 1)
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
