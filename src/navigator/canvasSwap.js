import { canvas } from '../context/canvas.js'
import { navigatorState } from './navigatorState.js'

// Replaces the active canvas state with the navigator canvas so all drawing
// operations target the overlay instead of the user's real artwork.
export function activateNavigatorCanvas() {
  if (navigatorState.active) return
  if (!navigatorState.layer) return // NavigatorCanvas not yet mounted

  // Save real canvas state for restoration
  navigatorState._saved = {
    layers: canvas.layers,
    currentLayer: canvas.currentLayer,
    offScreenCVS: canvas.offScreenCVS,
    offScreenCTX: canvas.offScreenCTX,
    previewCVS: canvas.previewCVS,
    previewCTX: canvas.previewCTX,
    tempLayer: canvas.tempLayer,
    activeLayerCount: canvas.activeLayerCount,
  }

  // Sync nav canvas dimensions to match real canvas pixel dimensions
  const w = canvas.offScreenCVS.width
  const h = canvas.offScreenCVS.height
  navigatorState.layer.cvs.width = w
  navigatorState.layer.cvs.height = h
  navigatorState.previewLayer.cvs.width = w
  navigatorState.previewLayer.cvs.height = h
  navigatorState.offScreenCVS.width = w
  navigatorState.offScreenCVS.height = h
  navigatorState.previewCVS.width = w
  navigatorState.previewCVS.height = h

  // Clear nav layer so each session starts fresh
  navigatorState.layer.ctx.clearRect(0, 0, w, h)
  navigatorState.layer.onscreenCtx.clearRect(
    0,
    0,
    navigatorState.layer.onscreenCvs.width,
    navigatorState.layer.onscreenCvs.height,
  )

  canvas.layers = [navigatorState.layer]
  canvas.currentLayer = navigatorState.layer
  canvas.offScreenCVS = navigatorState.offScreenCVS
  canvas.offScreenCTX = navigatorState.offScreenCTX
  canvas.previewCVS = navigatorState.previewCVS
  canvas.previewCTX = navigatorState.previewCTX
  canvas.tempLayer = navigatorState.previewLayer
  canvas.activeLayerCount = 1

  navigatorState.active = true
}

// Restores the real canvas state after a navigator session ends.
export function restoreRealCanvas() {
  if (!navigatorState.active || !navigatorState._saved) return
  const s = navigatorState._saved
  canvas.layers = s.layers
  canvas.currentLayer = s.currentLayer
  canvas.offScreenCVS = s.offScreenCVS
  canvas.offScreenCTX = s.offScreenCTX
  canvas.previewCVS = s.previewCVS
  canvas.previewCTX = s.previewCTX
  canvas.tempLayer = s.tempLayer
  canvas.activeLayerCount = s.activeLayerCount
  navigatorState._saved = null
  navigatorState.active = false
}
