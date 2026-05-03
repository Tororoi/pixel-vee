import { canvas } from '../context/canvas.js'
import { navigatorState } from './navigatorState.js'
import { renderCanvas } from '../canvas/render.js'
import { globalState } from '../context/state.js'
import { vectorGui } from '../gui/vector.js'
import { swatches } from '../context/swatch.js'
import { tools } from '../tools/index.js'
import {
  stopMarchingAnts,
  renderSelectionCVS,
} from '../gui/select.js'

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
    backgroundCVS: canvas.backgroundCVS,
    backgroundCTX: canvas.backgroundCTX,
    cursorCVS: canvas.cursorCVS,
    cursorCTX: canvas.cursorCTX,
    selectionGuiCVS: canvas.selectionGuiCVS,
    selectionGuiCTX: canvas.selectionGuiCTX,
    vectorGuiCTX: canvas.vectorGuiCTX,
    // Save values (not references) from the reactive stores so they can be
    // mutated to nav-fresh state and restored exactly on exit.
    stores: {
      timeline: {
        undoStack: globalState.timeline.undoStack,
        redoStack: globalState.timeline.redoStack,
        currentAction: globalState.timeline.currentAction,
        sanitizedUndoStack: globalState.timeline.sanitizedUndoStack,
        activeIndexes: globalState.timeline.activeIndexes,
        savedBetweenActionImages: globalState.timeline.savedBetweenActionImages,
        points: globalState.timeline.points,
      },
      tool: {
        current: globalState.tool.current,
        selectedName: globalState.tool.selectedName,
        clickCounter: globalState.tool.clickCounter,
        lineStartX: globalState.tool.lineStartX,
        lineStartY: globalState.tool.lineStartY,
        grabStartX: globalState.tool.grabStartX,
        grabStartY: globalState.tool.grabStartY,
        startScale: globalState.tool.startScale,
      },
      selection: {
        properties: { ...globalState.selection.properties },
        boundaryBox: { ...globalState.selection.boundaryBox },
        previousBoundaryBox: globalState.selection.previousBoundaryBox,
        maskSet: globalState.selection.maskSet,
        seenPixelsSet: globalState.selection.seenPixelsSet,
        pointsSet: globalState.selection.pointsSet,
        pixelPoints: globalState.selection.pixelPoints,
        cornersSet: globalState.selection.cornersSet,
      },
      vector: {
        properties: { ...globalState.vector.properties },
        all: { ...globalState.vector.all },
        currentIndex: globalState.vector.currentIndex,
        collidedIndex: globalState.vector.collidedIndex,
        selectedIndices: new Set(globalState.vector.selectedIndices),
        savedProperties: { ...globalState.vector.savedProperties },
        transformMode: globalState.vector.transformMode,
        highestKey: globalState.vector.highestKey,
        redoStackHeld: { ...globalState.vector.redoStackHeld },
        shapeCenterX: globalState.vector.shapeCenterX,
        shapeCenterY: globalState.vector.shapeCenterY,
        grabStartShapeCenterX: globalState.vector.grabStartShapeCenterX,
        grabStartShapeCenterY: globalState.vector.grabStartShapeCenterY,
        grabStartAngle: globalState.vector.grabStartAngle,
      },
      swatches: {
        primaryColor: { ...swatches.primary.color },
        secondaryColor: { ...swatches.secondary.color },
      },
    },
  }

  // Sync nav canvas dimensions to match real canvas pixel dimensions
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

  // Clear nav layer and GUI canvases so each session starts fresh
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

  navigatorState.active = true

  // Stop the marching-ants RAF loop before mutating selection state.
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

  // Reset vector GUI collision flags for the new nav session.
  vectorGui.resetCollision()

  // Render the background immediately so the overlay is opaque as soon as
  // the session starts — the gray surround + transparent hole fill in here,
  // and the CSS diagonal-stripe pattern on the bg-canvas element shows
  // through the transparent hole to complete the checkered look.
  renderCanvas(canvas.currentLayer)
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
  canvas.backgroundCVS = s.backgroundCVS
  canvas.backgroundCTX = s.backgroundCTX
  canvas.cursorCVS = s.cursorCVS
  canvas.cursorCTX = s.cursorCTX
  canvas.selectionGuiCVS = s.selectionGuiCVS
  canvas.selectionGuiCTX = s.selectionGuiCTX
  canvas.vectorGuiCTX = s.vectorGuiCTX

  // Restore reactive store values saved before the nav session.
  const st = s.stores

  globalState.timeline.undoStack = st.timeline.undoStack
  globalState.timeline.redoStack = st.timeline.redoStack
  globalState.timeline.currentAction = st.timeline.currentAction
  globalState.timeline.sanitizedUndoStack = st.timeline.sanitizedUndoStack
  globalState.timeline.activeIndexes = st.timeline.activeIndexes
  globalState.timeline.savedBetweenActionImages = st.timeline.savedBetweenActionImages
  globalState.timeline.points = st.timeline.points

  Object.assign(globalState.tool, st.tool)

  Object.assign(globalState.selection.properties, st.selection.properties)
  Object.assign(globalState.selection.boundaryBox, st.selection.boundaryBox)
  globalState.selection.previousBoundaryBox = st.selection.previousBoundaryBox
  globalState.selection.maskSet = st.selection.maskSet
  globalState.selection.seenPixelsSet = st.selection.seenPixelsSet
  globalState.selection.pointsSet = st.selection.pointsSet
  globalState.selection.pixelPoints = st.selection.pixelPoints
  globalState.selection.cornersSet = st.selection.cornersSet

  globalState.vector.properties = st.vector.properties
  globalState.vector.all = st.vector.all
  globalState.vector.setCurrentIndex(st.vector.currentIndex)
  globalState.vector.collidedIndex = st.vector.collidedIndex
  globalState.vector.clearSelected()
  st.vector.selectedIndices.forEach((idx) => globalState.vector.addSelected(idx))
  globalState.vector.savedProperties = st.vector.savedProperties
  globalState.vector.transformMode = st.vector.transformMode
  globalState.vector.highestKey = st.vector.highestKey
  globalState.vector.redoStackHeld = st.vector.redoStackHeld
  globalState.vector.shapeCenterX = st.vector.shapeCenterX
  globalState.vector.shapeCenterY = st.vector.shapeCenterY
  globalState.vector.grabStartShapeCenterX = st.vector.grabStartShapeCenterX
  globalState.vector.grabStartShapeCenterY = st.vector.grabStartShapeCenterY
  globalState.vector.grabStartAngle = st.vector.grabStartAngle

  Object.assign(swatches.primary.color, st.swatches.primaryColor)
  Object.assign(swatches.secondary.color, st.swatches.secondaryColor)

  vectorGui.resetCollision()
  // Re-render the selection canvas now that selectionGuiCTX is the real one
  renderSelectionCVS()

  navigatorState._saved = null
  navigatorState.active = false
}
