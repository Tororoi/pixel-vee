import { dom } from '../Context/dom.js'
import { canvas } from '../Context/canvas.js'

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
