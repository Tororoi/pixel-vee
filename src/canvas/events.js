import { dom } from '../context/dom.js'
import { canvas } from '../context/canvas.js'
import { renderCanvas } from '../canvas/render.js'
import { constrainElementOffsets } from '../utils/constrainElementOffsets.js'

/**
 * Synchronises every onscreen canvas with the current window after a resize
 * event. Setting `.width` or `.height` on a canvas element fully resets its
 * 2D context transform, so the sharpness×zoom matrix must be reapplied to
 * every context immediately after each dimension assignment. All GUI overlay
 * canvases (vector, selection, resize, cursor) and every layer canvas go
 * through the same sequence so the composited display stays pixel-crisp
 * across the whole stack. Saved free-position styles are cleared from
 * floating panels because pixel offsets stored before the resize are
 * meaningless in the new viewport; the color picker is constrained rather
 * than reset because it retains a valid screen position and only needs
 * nudging back inside the viewport if it was clipped.
 */
export const resizeOnScreenCanvas = () => {
  // offsetWidth × sharpness gives the physical pixel count for crisp
  // rendering on HiDPI displays. Each .width/.height assignment also resets
  // the context transform, so sharpness×zoom must be reapplied right after.
  canvas.vectorGuiCVS.width = canvas.vectorGuiCVS.offsetWidth * canvas.sharpness
  canvas.vectorGuiCVS.height =
    canvas.vectorGuiCVS.offsetHeight * canvas.sharpness
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.selectionGuiCVS.width =
    canvas.selectionGuiCVS.offsetWidth * canvas.sharpness
  canvas.selectionGuiCVS.height =
    canvas.selectionGuiCVS.offsetHeight * canvas.sharpness
  canvas.selectionGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.resizeOverlayCVS.width =
    canvas.resizeOverlayCVS.offsetWidth * canvas.sharpness
  canvas.resizeOverlayCVS.height =
    canvas.resizeOverlayCVS.offsetHeight * canvas.sharpness
  canvas.resizeOverlayCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.cursorCVS.width = canvas.cursorCVS.offsetWidth * canvas.sharpness
  canvas.cursorCVS.height = canvas.cursorCVS.offsetHeight * canvas.sharpness
  canvas.cursorCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.layers.forEach((layer) => {
    layer.onscreenCvs.width = layer.onscreenCvs.offsetWidth * canvas.sharpness
    layer.onscreenCvs.height = layer.onscreenCvs.offsetHeight * canvas.sharpness
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0,
    )
  })
  canvas.backgroundCVS.width =
    canvas.backgroundCVS.offsetWidth * canvas.sharpness
  canvas.backgroundCVS.height =
    canvas.backgroundCVS.offsetHeight * canvas.sharpness
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  // Recompose all layers; the dimension assignments above cleared every canvas.
  renderCanvas()
  // Saved left/top values become invalid when the viewport changes shape;
  // clearing them lets CSS recompute the natural resting position.
  if (dom.toolboxContainer) {
    dom.toolboxContainer.style.left = ''
    dom.toolboxContainer.style.top = ''
  }
  if (dom.sidebarContainer) {
    dom.sidebarContainer.style.left = ''
    dom.sidebarContainer.style.top = ''
  }
  // offsetHeight is 0 when the picker is hidden; constraining a hidden
  // element would force it to 0,0, so only act when it is visible.
  if (dom.colorPickerContainer && dom.colorPickerContainer.offsetHeight !== 0) {
    constrainElementOffsets(dom.colorPickerContainer)
  }
}
