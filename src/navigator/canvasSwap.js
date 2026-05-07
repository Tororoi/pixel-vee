import { canvas } from '../context/canvas.js'
import { navigatorState } from './navigatorState.js'
import { renderCanvas } from '../canvas/render.js'
import { globalState } from '../context/state.js'
import { vectorGui } from '../gui/vector.js'
import { tools, snapshotToolsState, restoreToolsState } from '../tools/index.js'
import { dom } from '../context/dom.js'
import { stopMarchingAnts, renderSelectionCVS } from '../gui/select.js'
import {
  snapshotTimeline,
  restoreTimeline,
} from '../ui/stores/timeline.svelte.js'
import { snapshotTool, restoreTool } from '../ui/stores/tool.svelte.js'
import {
  snapshotSelection,
  restoreSelection,
} from '../ui/stores/selection.svelte.js'
import { snapshotVector, restoreVector } from '../ui/stores/vector.svelte.js'
import { snapshotSwatches, restoreSwatches } from '../context/swatch.svelte.js'

/**
 * Redirects all drawing operations to the navigator overlay canvas,
 * completely replacing the live canvas context so tools, renders, and
 * DOM layer operations all target the navigator instead of the user's
 * real artwork. Before doing so it snapshots every piece of reactive
 * store state and DOM state, enabling {@link restoreRealCanvas} to
 * perform a lossless teardown when the session ends. Seeds a minimal
 * timeline so redrawTimelineActions has a valid base action to work
 * from. Guards against double-activation and against being called
 * before the overlay DOM node has mounted.
 */
export function activateNavigatorCanvas() {
  if (navigatorState.active) return
  if (!navigatorState.layer) return // NavigatorCanvas not yet mounted

  // Save real canvas state for restoration. Store snapshots are owned by their
  // respective store modules so adding a new store property automatically
  // includes it here without touching canvasSwap.
  navigatorState._saved = {
    toolsState: snapshotToolsState(),
    canvasLayers: dom.canvasLayers,
    layers: canvas.layers,
    currentLayer: canvas.currentLayer,
    pastedLayer: canvas.pastedLayer,
    offScreenCVS: canvas.offScreenCVS,
    offScreenCTX: canvas.offScreenCTX,
    previewCVS: canvas.previewCVS,
    previewCTX: canvas.previewCTX,
    tempLayer: canvas.tempLayer,
    activeLayerCount: canvas.activeLayerCount,
    backgroundCVS: canvas.backgroundCVS,
    backgroundCTX: canvas.backgroundCTX,
    cursorCVS: canvas.cursorCVS,
    cursorCTX: canvas.cursorCTX,
    selectionGuiCVS: canvas.selectionGuiCVS,
    selectionGuiCTX: canvas.selectionGuiCTX,
    vectorGuiCTX: canvas.vectorGuiCTX,
    stores: {
      timeline: snapshotTimeline(),
      tool: snapshotTool(),
      selection: snapshotSelection(),
      vector: snapshotVector(),
      swatches: snapshotSwatches(),
    },
  }

  // Match nav canvas pixel dimensions to the real artwork so tool
  // coordinates stay correct when the pipeline targets the navigator.
  const w = canvas.offScreenCVS.width
  const h = canvas.offScreenCVS.height
  // Reset nav layer position so each session starts from a clean default state.
  // The layer object persists across sessions, so x/y/scale from a previous
  // recording or playback would otherwise carry over and cause the move tool
  // to appear to do nothing (it moves from an already-offset position).
  navigatorState.layer.x = 0
  navigatorState.layer.y = 0
  navigatorState.layer.scale = 1
  navigatorState.previewLayer.x = 0
  navigatorState.previewLayer.y = 0
  navigatorState.previewLayer.scale = 1
  navigatorState.layer.cvs.width = w
  navigatorState.layer.cvs.height = h
  navigatorState.previewLayer.cvs.width = w
  navigatorState.previewLayer.cvs.height = h
  navigatorState.offScreenCVS.width = w
  navigatorState.offScreenCVS.height = h
  navigatorState.previewCVS.width = w
  navigatorState.previewCVS.height = h

  // The nav layer and GUI canvases persist between sessions; clear them
  // so stale pixel data from a previous recording does not appear.
  navigatorState.layer.ctx.clearRect(0, 0, w, h)
  navigatorState.layer.onscreenCtx.clearRect(
    0,
    0,
    navigatorState.layer.onscreenCvs.width,
    navigatorState.layer.onscreenCvs.height,
  )
  const pw = navigatorState.cursorCVS?.width ?? 0
  const ph = navigatorState.cursorCVS?.height ?? 0
  navigatorState.cursorCTX?.clearRect(0, 0, pw, ph)
  navigatorState.selectionGuiCTX?.clearRect(0, 0, pw, ph)

  canvas.layers = [navigatorState.layer]
  // Use canvas.layers[0] so currentLayer holds the same $state proxy as
  // layers[0] — assigning the raw object twice would create two separate
  // proxies and trigger state_proxy_equality_mismatch warnings.
  canvas.currentLayer = canvas.layers[0]
  // Clear any stale pastedLayer from a previous session so hasPaste is false
  // and the NavBar's cut/paste onclick handlers are not disabled at
  // session start.
  canvas.pastedLayer = null
  canvas.offScreenCVS = navigatorState.offScreenCVS
  canvas.offScreenCTX = navigatorState.offScreenCTX
  canvas.previewCVS = navigatorState.previewCVS
  canvas.previewCTX = navigatorState.previewCTX
  canvas.tempLayer = navigatorState.previewLayer
  canvas.activeLayerCount = 1
  canvas.backgroundCVS = navigatorState.backgroundCVS
  canvas.backgroundCTX = navigatorState.backgroundCTX
  canvas.cursorCVS = navigatorState.cursorCVS
  canvas.cursorCTX = navigatorState.cursorCTX
  canvas.selectionGuiCVS = navigatorState.selectionGuiCVS
  canvas.selectionGuiCTX = navigatorState.selectionGuiCTX
  canvas.vectorGuiCTX = navigatorState.vectorGuiCTX

  // Swap dom.canvasLayers so all layer DOM operations (append/remove layer
  // onscreen canvases) target the navigator overlay rather than the real canvas
  // area. Ensure the nav layer's onscreen canvas is inside navCanvasLayers —
  // it may have been removed when navCanvasLayers was drained at the end of
  // a previous session.
  dom.canvasLayers = navigatorState.navCanvasLayers
  if (
    navigatorState.layer?.onscreenCvs &&
    !navigatorState.navCanvasLayers.contains(navigatorState.layer.onscreenCvs)
  ) {
    navigatorState.navCanvasLayers.appendChild(navigatorState.layer.onscreenCvs)
  }

  navigatorState.active = true

  // The marching-ants RAF reads selectionGuiCTX on every frame; stopping
  // it before mutating the selection store prevents a mid-frame clear on
  // the wrong context.
  stopMarchingAnts()

  // Reset reactive stores to fresh nav state (store references stay the same
  // so Svelte's reactive bindings continue to work and tool buttons update).

  // Timeline: clear to empty, then seed with an addLayer entry at index 0.
  // redrawTimelineActions always starts at startIndex=1 (assuming index 0 is
  // an addLayer placeholder), so seeding here ensures real drawing actions
  // placed at index 1+ are correctly replayed when the move tool fires.
  globalState.timeline.undoStack = []
  globalState.timeline.redoStack = []
  globalState.timeline.currentAction = null
  globalState.timeline.sanitizedUndoStack = []
  globalState.timeline.clearActiveIndexes()
  globalState.timeline.clearSavedBetweenActionImages()
  globalState.timeline.clearPoints()
  const seedAction = {
    index: 0,
    tool: tools.addLayer.name,
    layer: canvas.currentLayer,
    selectProperties: { px1: null, py1: null, px2: null, py2: null },
    maskSet: null,
    selectedVectorIndices: [],
    currentVectorIndex: null,
    hidden: false,
    removed: false,
    snapshot: null,
  }
  globalState.timeline.undoStack.push(seedAction)
  globalState.timeline.currentAction = seedAction

  // Tool: reset functional state, preserve the current tool so nav starts
  // with the same tool active (maintaining the visual selection).
  globalState.tool.clickCounter = 0
  globalState.tool.lineStartX = null
  globalState.tool.lineStartY = null
  globalState.tool.grabStartX = null
  globalState.tool.grabStartY = null
  globalState.tool.startScale = null

  // Selection: reset to blank state — nav sessions start with no selection.
  globalState.selection.resetProperties()
  globalState.selection.resetBoundaryBox()
  globalState.selection.previousBoundaryBox = null
  globalState.selection.seenPixelsSet = null
  globalState.selection.pointsSet = null
  globalState.selection.pixelPoints = null
  globalState.selection.cornersSet = null

  // Vector: reset to blank state — nav sessions start with no vectors.
  globalState.vector.properties = {}
  globalState.vector.all = {}
  globalState.vector.setCurrentIndex(null)
  globalState.vector.collidedIndex = null
  globalState.vector.clearSelected()
  globalState.vector.savedProperties = {}
  globalState.vector.highestKey = 0
  globalState.vector.redoStackHeld = {}
  globalState.vector.shapeCenterX = null
  globalState.vector.shapeCenterY = null
  globalState.vector.grabStartShapeCenterX = null
  globalState.vector.grabStartShapeCenterY = null
  globalState.vector.grabStartAngle = null

  // vectorGui collision state is module-level and not captured in the
  // vector store snapshot, so it must be explicitly cleared to prevent
  // stale cursor-collision hints from a previous session.
  vectorGui.resetCollision()

  // Apply the navigator's own persistent UI state if it exists, so each
  // session picks up the tool/color settings from the previous nav session
  // rather than inheriting the real mode's current settings.
  if (navigatorState.ownUI) {
    restoreToolsState(navigatorState.ownUI.toolsState)
    globalState.tool.selectedName = navigatorState.ownUI.tool.selectedName
    globalState.tool.current = navigatorState.ownUI.tool.current
    restoreSwatches(navigatorState.ownUI.swatches)
  }

  // Render the background immediately so the overlay is opaque as soon as
  // the session starts — the gray surround + transparent hole fill in here,
  // and the CSS diagonal-stripe pattern on the bg-canvas element shows
  // through the transparent hole to complete the checkered look.
  renderCanvas(canvas.currentLayer)
}

/**
 * Tears down the navigator session and restores every canvas, DOM, and
 * reactive store pointer that {@link activateNavigatorCanvas} replaced.
 * Captures the navigator's current UI state first so the next session
 * can resume from the tool and color settings the user left it in.
 * Returns immediately if the navigator is not currently active, making
 * the function safe to call defensively on cleanup paths.
 */
export function restoreRealCanvas() {
  if (!navigatorState.active || !navigatorState._saved) return
  const s = navigatorState._saved
  canvas.layers = s.layers
  canvas.currentLayer = s.currentLayer
  canvas.pastedLayer = s.pastedLayer
  canvas.offScreenCVS = s.offScreenCVS
  canvas.offScreenCTX = s.offScreenCTX
  canvas.previewCVS = s.previewCVS
  canvas.previewCTX = s.previewCTX
  canvas.tempLayer = s.tempLayer
  canvas.activeLayerCount = s.activeLayerCount
  canvas.backgroundCVS = s.backgroundCVS
  canvas.backgroundCTX = s.backgroundCTX
  canvas.cursorCVS = s.cursorCVS
  canvas.cursorCTX = s.cursorCTX
  canvas.selectionGuiCVS = s.selectionGuiCVS
  canvas.selectionGuiCTX = s.selectionGuiCTX
  canvas.vectorGuiCTX = s.vectorGuiCTX

  // Restore dom.canvasLayers and drain navCanvasLayers so the next session
  // starts with a clean container (the base nav layer canvas is re-added in
  // activateNavigatorCanvas when the next session starts).
  dom.canvasLayers = s.canvasLayers
  while (navigatorState.navCanvasLayers?.firstChild) {
    navigatorState.navCanvasLayers.removeChild(
      navigatorState.navCanvasLayers.firstChild,
    )
  }

  // Persist the navigator's current UI state so the next session restores it.
  navigatorState.ownUI = {
    toolsState: snapshotToolsState(),
    tool: snapshotTool(),
    swatches: snapshotSwatches(),
  }

  // Restore tool object state (modes, brushSize, etc.) before restoring stores,
  // since restoreTool sets current to the same tool object reference.
  restoreToolsState(s.toolsState)

  // Restore reactive store values via each store's own restore function.
  // Adding a new property to any store's snapshot() automatically includes
  // it here without touching canvasSwap.
  const st = s.stores
  restoreTimeline(st.timeline)
  restoreTool(st.tool)
  restoreSelection(st.selection)
  restoreVector(st.vector)
  restoreSwatches(st.swatches)

  // vectorGui collision state is module-level and excluded from the vector
  // snapshot; clear it so stale nav-session hints do not bleed into real mode.
  vectorGui.resetCollision()
  // Re-render the selection canvas now that selectionGuiCTX is the real one
  renderSelectionCVS()

  navigatorState._saved = null
  navigatorState.active = false
}
