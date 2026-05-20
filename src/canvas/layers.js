import { dom } from '../context/dom.js'
import { canvas } from '../context/canvas.js'

//====================================//
//======== * * * Layers * * * ========//
//====================================//

/**
 * Flattens all visible layers onto the shared offscreen canvas to produce a
 * single composited image for sampling or export. Layers marked hidden,
 * removed, or with zero opacity are skipped entirely. Reference layers are
 * excluded by default because they are non-destructive overlays that should
 * not be baked into pixel data unless the caller explicitly opts in. The
 * preview layer (used for live tool feedback) is also excluded by default
 * because it holds uncommitted work that must not pollute a sample or export.
 * Each layer's opacity is applied via `globalAlpha` inside a save/restore
 * pair so that no layer's setting bleeds into the next.
 * @param {boolean} includeReference - include reference layers in composite
 * @param {boolean} includePreview - include the preview layer in composite
 */
export function consolidateLayers(
  includeReference = false,
  includePreview = false,
) {
  canvas.offScreenCTX.clearRect(
    0,
    0,
    canvas.offScreenCVS.width,
    canvas.offScreenCVS.height,
  )
  // Pixel art must not be blurred when the offscreen canvas is sampled or
  // drawn elsewhere at a different size.
  canvas.offScreenCTX.imageSmoothingEnabled = false
  canvas.layers.forEach((layer) => {
    if (!layer.hidden && !layer.removed && layer.opacity > 0) {
      // isPreview is the dedicated flag for the temp layer; it is separate
      // from hidden so callers can include/exclude it independently.
      if (!layer.isPreview || includePreview) {
        canvas.offScreenCTX.save()
        canvas.offScreenCTX.globalAlpha = layer.opacity
        if (layer.type === 'raster') {
          canvas.offScreenCTX.drawImage(
            layer.cvs,
            0,
            0,
            canvas.offScreenCVS.width,
            canvas.offScreenCVS.height,
          )
        } else if (includeReference && layer.type === 'reference') {
          canvas.offScreenCTX.drawImage(
            layer.img,
            layer.x,
            layer.y,
            layer.img.width * layer.scale,
            layer.img.height * layer.scale,
          )
        }
        canvas.offScreenCTX.restore()
      }
    }
  })
}

/**
 * Allocates and wires up a new raster layer with both an offscreen canvas
 * for pixel data and an onscreen canvas inserted into the DOM for display.
 * The offscreen context is created with `willReadFrequently` because pixel
 * sampling via `getImageData` happens on nearly every pointer move during
 * brush and fill operations. The onscreen context uses `desynchronized` to
 * let the GPU compositor present frames independently of the main thread,
 * reducing visible lag during strokes. The CSS class `onscreen-canvas` is
 * required for the stylesheet to size the element to 100% of its container.
 * The layer id is derived from the current maximum id rather than the array
 * length so that ids remain unique after layers are deleted mid-session.
 * @returns {object} layer
 */
export function createRasterLayer() {
  let offscreenLayerCVS = document.createElement('canvas')
  let offscreenLayerCTX = offscreenLayerCVS.getContext('2d', {
    // Optimises repeated getImageData calls during sampling and brush ops.
    willReadFrequently: true,
  })
  offscreenLayerCVS.width = canvas.offScreenCVS.width
  offscreenLayerCVS.height = canvas.offScreenCVS.height
  let onscreenLayerCVS = document.createElement('canvas')
  let onscreenLayerCTX = onscreenLayerCVS.getContext('2d', {
    // Allows GPU compositing without blocking the main thread during strokes.
    desynchronized: true,
  })
  // CSS targets this class to fill the element to 100% of its container.
  onscreenLayerCVS.className = 'onscreen-canvas'
  // Raster layers append at the end so they sit above reference layers in
  // the DOM composite order.
  dom.canvasLayers.appendChild(onscreenLayerCVS)
  onscreenLayerCVS.width = onscreenLayerCVS.offsetWidth * canvas.sharpness
  onscreenLayerCVS.height = onscreenLayerCVS.offsetHeight * canvas.sharpness
  // New canvases start with an identity transform; apply sharpness×zoom to
  // match every other canvas in the stack.
  onscreenLayerCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  // Max id + 1 keeps ids unique across deletions; layers.length would
  // collide if any layer has been removed.
  let highestId = canvas.layers.reduce(
    (max, layer) => (layer.id > max ? layer.id : max),
    0,
  )
  return {
    id: highestId + 1,
    type: 'raster',
    title: `Layer ${highestId + 1}`,
    cvs: offscreenLayerCVS,
    ctx: offscreenLayerCTX,
    onscreenCvs: onscreenLayerCVS,
    onscreenCtx: onscreenLayerCTX,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    inactiveTools: [],
    hidden: false,
    removed: false,
    mask: null,
  }
}

/**
 * Opaque colors used to mark mask pixels. The canvas uses
 * transparency for the "un-marked" state so the rendered overlay is
 * naturally clean — drawImage at 25% globalAlpha lets the layer
 * show through everywhere the mask is transparent.
 *
 * Two colors so the visible overlay subtly signals which mode the
 * mask is in: red when the painted set blocks drawing, orange-red
 * when the painted set is inverted and instead allows drawing.
 */
export const MASK_PAINT_COLOR = 'rgba(255,0,0,1)'
export const MASK_PAINT_COLOR_INVERTED = 'rgba(0,0,255,1)'

/**
 * Return the paint color appropriate for the mask's current
 * inverted flag. Callers use this any time they need to fillRect
 * the mask canvas (live brush in mask-edit, renderMaskFromSet,
 * recomputeMaskBlockedSet refresh, etc.) so the visible cue stays
 * consistent.
 * @param {object} mask - The mask object (`layer.mask`).
 * @returns {string} CSS color string for fillStyle.
 */
export function maskPaintColor(mask) {
  return mask?.inverted ? MASK_PAINT_COLOR_INVERTED : MASK_PAINT_COLOR
}

/**
 * Allocate a mask for a layer. The mask is a single canvas: red
 * pixels where the user has marked, transparent everywhere else.
 * `drawImage` at 25% globalAlpha produces the transparent-red
 * overlay without any extra canvas and without
 * `globalCompositeOperation` (which has a notable perf cost in some
 * browsers).
 *
 * `blockedSet` is the lookup the draw gate consults; it is the set
 * of pixels the user has marked. The `inverted` flag flips the
 * gate's interpretation of the set (in-set → allowed instead of
 * blocked) and shifts the overlay color so the visible cue matches
 * the mode. The set itself is never rewritten on invert, so any
 * out-of-bounds members left by a previous off-canvas mask move
 * survive both invert and move round trips.
 *
 * Every raster layer is created with a mask, so this function runs
 * once per layer creation rather than being gated on a UI action.
 * @param {object} layer - The layer to attach a mask to.
 * @returns {object} The newly created mask object (also assigned to
 *   `layer.mask`).
 */
export function createMaskFor(layer) {
  const maskCVS = document.createElement('canvas')
  const maskCTX = maskCVS.getContext('2d', {
    // imageData is read on every mask edit to refresh blockedSet.
    willReadFrequently: true,
  })
  maskCVS.width = canvas.offScreenCVS.width
  maskCVS.height = canvas.offScreenCVS.height
  // Canvas starts fully transparent — no marks, no overlay.
  layer.mask = {
    cvs: maskCVS,
    ctx: maskCTX,
    blockedSet: new Set(),
    enabled: true,
    overlayVisible: true,
    // When inverted, the gate flips its interpretation of blockedSet
    // (in-set = allowed) and the overlay color shifts to signal the
    // mode. The set itself never changes on toggle, which keeps
    // out-of-bounds work lossless.
    inverted: false,
  }
  return layer.mask
}

/**
 * Reset the mask canvas to the "no marks" state — fully transparent
 * and an empty blockedSet.
 * @param {object} layer - The layer whose mask should be reset.
 */
export function resetMaskCanvas(layer) {
  if (!layer.mask) return
  const { cvs, ctx } = layer.mask
  ctx.clearRect(0, 0, cvs.width, cvs.height)
  layer.mask.blockedSet = new Set()
}

/**
 * Rebuild `mask.blockedSet` by scanning `mask.cvs` imageData. The
 * mask uses opaque marks on a transparent background, so the alpha
 * channel alone distinguishes marked from un-marked pixels (the
 * specific color depends on `mask.inverted`).
 *
 * Out-of-bounds members from the prior set — produced by a mask
 * move that pushed pixels off the visible canvas — are carried over
 * intact. They can't be detected from the canvas (which only holds
 * in-bounds pixels) so they must be preserved explicitly to avoid
 * losing the user's work.
 *
 * Coordinates use the same `(y << 16) | x` encoding the draw-pixel
 * gate in `draw.js` consults; in-bounds coords (0 ≤ x,y < 65535)
 * pack identically with or without the sign-friendly mask.
 * @param {object} layer - The layer whose mask should be scanned.
 */
export function recomputeMaskBlockedSet(layer) {
  if (!layer.mask) return
  const { cvs, ctx, blockedSet: previous } = layer.mask
  const { width, height } = cvs
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const set = new Set()
  // Carry over any out-of-bounds members from the previous set.
  for (const key of previous) {
    const px = (key << 16) >> 16
    const py = key >> 16
    if (px < 0 || px >= width || py < 0 || py >= height) {
      set.add(key)
    }
  }
  // Add in-bounds opaque pixels from the canvas.
  let x = 0
  let y = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] !== 0) {
      set.add((y << 16) | x)
    }
    if (++x === width) {
      x = 0
      y++
    }
  }
  layer.mask.blockedSet = set
}

/**
 * Re-render the mask canvas from `blockedSet`. The set is the source
 * of truth; this paints the canvas to match. Operations that mutate
 * the set directly (mask-move, invert toggle) call this to refresh
 * the canvas without going through the brush path.
 *
 * The fill color tracks the inverted flag so toggling alone is
 * enough to update the on-screen cue. Coords outside the canvas
 * area (left by a previous off-canvas mask move) are skipped — they
 * stay in the set but have nowhere to render until the canvas grows
 * or the mask is moved back.
 *
 * Coords are unpacked with arithmetic right-shifts so negative
 * components survive a round-trip through the packed-int encoding.
 * @param {object} layer - The layer whose mask should be re-rendered.
 */
export function renderMaskFromSet(layer) {
  if (!layer.mask) return
  const { cvs, ctx, blockedSet } = layer.mask
  ctx.clearRect(0, 0, cvs.width, cvs.height)
  ctx.fillStyle = maskPaintColor(layer.mask)
  const { width, height } = cvs
  for (const key of blockedSet) {
    const x = (key << 16) >> 16
    const y = key >> 16
    if (x < 0 || x >= width || y < 0 || y >= height) continue
    ctx.fillRect(x, y, 1, 1)
  }
}

/**
 * Allocates a new reference layer for an imported image and inserts its
 * onscreen canvas at the bottom of the layer stack so it sits behind all
 * raster content. No offscreen canvas is created because reference layers
 * render directly from the img element — per-pixel editing is not supported.
 * The initial scale uses "contain" logic: whichever dimension ratio is
 * smaller is chosen so the image fits inside the canvas without overflow
 * while preserving its aspect ratio. Drawing tools are listed in
 * `inactiveTools` so the tool system refuses to dispatch strokes onto a
 * read-only overlay; mutations must target a raster layer instead.
 * @param {object} img - image object
 * @returns {object} layer
 */
export function createReferenceLayer(img) {
  let onscreenLayerCVS = document.createElement('canvas')
  let onscreenLayerCTX = onscreenLayerCVS.getContext('2d', {
    desynchronized: true,
  })
  onscreenLayerCVS.className = 'onscreen-canvas'
  // DOM composite order is bottom-to-top; inserting at children[0] puts
  // this canvas behind all existing raster layers.
  dom.canvasLayers.insertBefore(onscreenLayerCVS, dom.canvasLayers.children[0])
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
  // "Contain" scaling: take the smaller axis ratio so neither dimension
  // overflows the canvas boundary.
  let scale =
    canvas.offScreenCVS.width / img.width >
    canvas.offScreenCVS.height / img.height
      ? canvas.offScreenCVS.height / img.height
      : canvas.offScreenCVS.width / img.width //TODO: (Low Priority) should be method, not var so width and height can be adjusted without having to set scale again
  let highestId = canvas.layers.reduce(
    (max, layer) => (layer.id > max ? layer.id : max),
    0,
  )
  return {
    id: highestId + 1,
    type: 'reference',
    title: `Reference ${highestId + 1}`,
    img: img,
    dataUrl: img.src,
    onscreenCvs: onscreenLayerCVS,
    onscreenCtx: onscreenLayerCTX,
    x: 0,
    y: 0,
    scale: scale,
    opacity: 1,
    inactiveTools: ['brush', 'fill', 'curve', 'ellipse', 'select'],
    hidden: false,
    removed: false,
  }
}

/**
 * Allocates a minimal preview layer used for live tool feedback during an
 * active stroke. Unlike raster layers, the onscreen canvas is not inserted
 * into the DOM here; the tool system appends and removes it at the correct
 * Z-order position when entering and leaving preview mode. The id is fixed
 * at 0 because the preview layer is sometimes included in `canvas.layers`
 * and sometimes not, making length-based id assignment unreliable — all
 * real layers always have an id ≥ 1. Drawing tools are listed in
 * `inactiveTools` so the dispatcher does not accidentally target this layer
 * for a permanent stroke.
 * @returns {object} layer
 */
export function createPreviewLayer() {
  let offscreenLayerCVS = document.createElement('canvas')
  let offscreenLayerCTX = offscreenLayerCVS.getContext('2d', {
    // getImageData is called during live brush preview on every pointer move.
    willReadFrequently: true,
  })
  offscreenLayerCVS.width = canvas.offScreenCVS.width
  offscreenLayerCVS.height = canvas.offScreenCVS.height
  let onscreenLayerCVS = document.createElement('canvas')
  let onscreenLayerCTX = onscreenLayerCVS.getContext('2d', {
    desynchronized: true,
  })
  onscreenLayerCVS.className = 'onscreen-canvas'
  return {
    // Fixed at 0; not always in canvas.layers so length-based ids break.
    id: 0,
    type: 'raster',
    title: 'Preview Layer',
    cvs: offscreenLayerCVS,
    ctx: offscreenLayerCTX,
    onscreenCvs: onscreenLayerCVS,
    onscreenCtx: onscreenLayerCTX,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    inactiveTools: ['brush', 'fill', 'curve', 'ellipse', 'select'],
    hidden: false,
    removed: false,
    isPreview: true,
  }
}

/**
 * Repair the active-layer reference and recount active raster layers.
 * If the current layer has been soft-deleted it is replaced with the
 * first surviving raster layer found in order, keeping tool state
 * consistent without forcing a full UI reset. The active-layer count
 * excludes preview layers so that UI elements that gate on "real" layer
 * count behave correctly.
 * @returns {void}
 */
export const updateActiveLayerState = () => {
  // Layers are soft-deleted (marked removed) rather than immediately
  // spliced, so the current-layer reference can point to dead state.
  if (canvas.currentLayer?.removed) {
    const validLayer = canvas.layers.find(
      (l) => l.type === 'raster' && !l.removed,
    )
    // Only replace if a valid target exists; don't nullify currentLayer
    // when every layer has been removed simultaneously.
    if (validLayer) canvas.currentLayer = validLayer
  }
  // Preview layers are transient tool composites and must not count
  // toward the "real" layer total used by the UI.
  canvas.activeLayerCount = canvas.layers.filter(
    (l) => !l.removed && !l.isPreview && l.type === 'raster',
  ).length
}

/**
 * Tear down the temporary paste layer and restore the canvas to the
 * state it was in before the paste began. The includes-guard prevents
 * double-removal because both the commit and cancel code paths call
 * this function, making idempotency a hard requirement. Tool buttons
 * locked while the temp layer was active are re-enabled here, and any
 * tools that the restored layer marks inactive are immediately
 * re-disabled so the toolbar always reflects the active layer's
 * capabilities without a separate render pass.
 * @returns {void}
 */
export function removeTempLayer() {
  // Both paste-commit and paste-cancel reach here, so guard against
  // running teardown twice on an already-removed temp layer.
  if (!canvas.layers.includes(canvas.tempLayer)) {
    return
  }
  canvas.layers.splice(canvas.layers.indexOf(canvas.tempLayer), 1)
  // Remove from wherever it was inserted — normally dom.canvasLayers, but during
  // navigator mode it is inside the nav overlay instead.
  canvas.tempLayer.onscreenCvs.parentElement?.removeChild(
    canvas.tempLayer.onscreenCvs,
  )
  // Re-enable tools that the paste operation locked at temp-layer
  // insertion time.
  canvas.tempLayer.inactiveTools.forEach((tool) => {
    if (dom[`${tool}Btn`]) {
      dom[`${tool}Btn`].disabled = false
      dom[`${tool}Btn`].classList.remove('deactivate-paste')
    }
  })
  // Restore the layer that owned the pasted content before the temp
  // layer was inserted on top of it.
  canvas.currentLayer = canvas.pastedLayer
  canvas.pastedLayer = null
  // The restored layer may carry its own tool restrictions; apply them
  // now rather than waiting for the next full toolbar refresh.
  canvas.currentLayer.inactiveTools.forEach((tool) => {
    if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
  })
}
