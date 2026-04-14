import { TRANSLATE } from '../utils/constants.js'
import { dom } from './dom.js'
import { tools } from '../Tools/index.js'
import { bump } from '../hooks/appState.svelte.js'

//====================================//
//======== * * * State * * * =========//
//====================================//

//Main state object to keep track of global vars
export const globalState = {
  // CURSOR — position and click state
  cursor: {
    x: null, // was: cursorX
    y: null, // was: cursorY
    prevX: 0, // was: previousX
    prevY: 0, // was: previousY
    withOffsetX: null, // was: cursorWithCanvasOffsetX
    withOffsetY: null, // was: cursorWithCanvasOffsetY
    clicked: false, // was: clicked
    clickDisabled: false, // was: clickDisabled
  },
  // TOOL — active tool and in-progress draw state
  tool: {
    current: null, // was: tool
    selectedName: 'brush', // tracks the explicitly selected tool (not shortcut-overrides)
    clickCounter: 0, // was: clickCounter
    lineStartX: null, // was: lineStartX
    lineStartY: null, // was: lineStartY
    grabStartX: null, // was: grabStartX
    grabStartY: null, // was: grabStartY
    startScale: null, // was: startScale
    touch: false, // was: touch
  },
  // VECTOR — vector/shape storage and editing state
  vector: {
    properties: {
      // tool: null,
      // px1: null,
      // py1: null,
      // px2: null,
      // py2: null,
      // px3: null,
      // py3: null,
      // px4: null,
      // py4: null,
      // radA: null,
      // radB: null,
      // angle: null,
      // unifiedOffset: null,
      // x1Offset: 0,
      // y1Offset: 0,
      // forceCircle: false,
    }, // was: vectorProperties
    all: {}, // was: vectors
    currentIndex: null, // was: currentVectorIndex
    collidedIndex: null, // was: collidedVectorIndex
    selectedIndices: new Set(), // was: selectedVectorIndicesSet — TODO: (Medium Priority) logic for which actions reset selected vectors
    savedProperties: {}, // was: vectorsSavedProperties
    transformMode: TRANSLATE, // was: vectorTransformMode — enum: translate, rotate, scale
    highestKey: 0, // was: highestVectorKey
    redoStackHeld: {}, // was: redoStackHeldVectors
    shapeCenterX: null, // was: shapeCenterX
    shapeCenterY: null, // was: shapeCenterY
    grabStartShapeCenterX: null, // was: grabStartShapeCenterX
    grabStartShapeCenterY: null, // was: grabStartShapeCenterY
    grabStartAngle: null, // was: grabStartAngle
    // Setters
    setCurrentIndex(idx) {
      this.currentIndex = idx
    },
    nextKey() {
      this.highestKey += 1
      return this.highestKey
    },
    addSelected(idx) {
      this.selectedIndices.add(idx)
    },
    removeSelected(idx) {
      this.selectedIndices.delete(idx)
    },
    clearSelected() {
      this.selectedIndices.clear()
    },
    setTransformMode(mode) {
      this.transformMode = mode
    },
  },
  // SELECTION — selection area, boundary box, and masks
  selection: {
    properties: {
      px1: null,
      py1: null,
      px2: null,
      py2: null,
    }, // was: selectProperties
    boundaryBox: {
      xMin: null,
      yMin: null,
      xMax: null,
      yMax: null,
    }, // was: boundaryBox — null boundaryBox means no restriction on drawing
    previousBoundaryBox: null, // was: previousBoundaryBox
    maskSet: null, // was: maskSet
    seenPixelsSet: null, // was: seenPixelsSet
    pointsSet: null, // was: pointsSet
    pixelPoints: null, // was: selectPixelPoints
    cornersSet: null, // was: selectCornersSet
    // Setters / methods (promoted from top-level state)
    resetProperties() {
      this.properties = { px1: null, py1: null, px2: null, py2: null }
      this.maskSet = null
    },
    normalize() {
      const { px1, py1, px2, py2 } = { ...this.properties }
      this.properties.px1 = Math.min(px1, px2)
      this.properties.py1 = Math.min(py1, py2)
      this.properties.px2 = Math.max(px2, px1)
      this.properties.py2 = Math.max(py2, py1)
    },
    resetBoundaryBox() {
      this.boundaryBox = { xMin: null, yMin: null, xMax: null, yMax: null }
    },
    setBoundaryBox(selectProperties) {
      if (
        selectProperties.px1 !== null &&
        selectProperties.py1 !== null &&
        selectProperties.px2 !== null &&
        selectProperties.py2 !== null
      ) {
        this.boundaryBox.xMin = Math.min(
          selectProperties.px1,
          selectProperties.px2,
        )
        this.boundaryBox.yMin = Math.min(
          selectProperties.py1,
          selectProperties.py2,
        )
        this.boundaryBox.xMax = Math.max(
          selectProperties.px2,
          selectProperties.px1,
        )
        this.boundaryBox.yMax = Math.max(
          selectProperties.py2,
          selectProperties.py1,
        )
        if (_enableActionsForSelection) _enableActionsForSelection()
      } else {
        this.resetBoundaryBox()
      }
    },
  },
  // TIMELINE — undo/redo stacks and current action
  timeline: {
    undoStack: [], // was: undoStack
    redoStack: [], // was: redoStack
    currentAction: null, // was: action — object with tool, mode, properties, layer, hidden, removed, points
    sanitizedUndoStack: [], // was: sanitizedUndoStack
    activeIndexes: [], // was: activeIndexes
    savedBetweenActionImages: [], // was: savedBetweenActionImages
    points: [], // was: points
    // Setters
    clearPoints() {
      this.points = []
    },
    addPoint(pt) {
      this.points.push(pt)
    },
    clearActiveIndexes() {
      this.activeIndexes = []
    },
    clearSavedBetweenActionImages() {
      this.savedBetweenActionImages = []
    },
  },
  // UI — drag, tooltip, shortcuts, and save dialog
  ui: {
    tooltipMessage: null, // was: tooltipMessage
    tooltipTarget: null, // was: tooltipTarget
    showTooltips: true, // was: dom.tooltipBtn.checked
    settingsOpen: false, // was: dom.settingsContainer.style.display
    canvasSizeOpen: false, // was: dom.sizeContainer.style.display
    exportOpen: false,
    colorPickerOpen: false,
    vectorTransformOpen: false,
    dragging: false, // was: dragging
    dragX: null, // was: dragX
    dragY: null, // was: dragY
    dragTarget: null, // was: dragTarget
    dragSiblings: [], // was: dragSiblings
    shortcuts: true, // was: shortcuts
    saveDialogOpen: false, // was: saveDialogOpen
    saveSettings: {
      saveAsFileName: 'my drawing',
      preserveHistory: true,
      includePalette: true,
      includeReferenceLayers: true,
      includeRemovedActions: true,
    }, // was: saveSettings
  },
  // CLIPBOARD — copy/paste and pasted image state
  clipboard: {
    select: {
      boundaryBox: {
        xMin: null,
        yMin: null,
        xMax: null,
        yMax: null,
      },
      canvasBoundaryBox: {
        xMin: null,
        yMin: null,
        xMax: null,
        yMax: null,
      },
      selectProperties: {
        px1: null,
        py1: null,
        px2: null,
        py2: null,
      },
      canvas: null,
      imageData: null,
      vectors: {},
    }, // was: selectClipboard
    pastedImages: {
      // index: {
      //   imageData: null,
      // },
    }, // was: pastedImages
    highestPastedImageKey: 0, // was: highestPastedImageKey
    currentPastedImageKey: null, // was: currentPastedImageKey
  },
  // TRANSFORM — flip and rotation flags
  transform: {
    isMirroredHorizontally: false, // was: isMirroredHorizontally
    isMirroredVertically: false, // was: isMirroredVertically
    rotationDegrees: 0, // was: transformationRotationDegrees
  },
  // DRAWING — perfect pixels and color mask state
  drawing: {
    lastDrawnX: null, // was: lastDrawnX
    lastDrawnY: null, // was: lastDrawnY
    waitingPixelX: null, // was: waitingPixelX
    waitingPixelY: null, // was: waitingPixelY
    colorLayerGlobal: null, // was: colorLayerGlobal
    localColorLayer: null, // was: localColorLayer
  },
  // CANVAS — cumulative spatial offset of art within the canvas coordinate space.
  // cropOffsetX/Y accumulate across resizes: when art shifts right by N px,
  // cropOffsetX += N. Timeline replay applies (current - recorded) as a delta
  // so old strokes appear at their correct shifted positions.
  canvas: {
    cropOffsetX: 0,
    cropOffsetY: 0,
    resizeOverlayActive: false,
  },
  // Cross-domain methods
  reset,
  deselect,
  clearRedoStack,
}

// Internal alias so method bodies can reference the object by its original name
const state = globalState

// ─── Circular dependency injection ────────────────────────────────────────────
// state.js previously imported vectorGui and DOM helpers directly, creating
// circular dependencies. Instead, callers register these at startup via index.js.

let _vectorGui = null
/**
 * Register the vectorGui object. Called once at app startup from index.js.
 * @param {object} vg - the vectorGui singleton
 */
export function registerVectorGui(vg) {
  _vectorGui = vg
}

let _disableActionsForNoSelection = null
let _enableActionsForSelection = null
/**
 * Register DOM helper functions. Called once at app startup from index.js.
 * @param {object} helpers - DOM action helpers to inject
 * @param {Function} helpers.disableActionsForNoSelection - disables cut/copy/etc when no selection
 * @param {Function} helpers.enableActionsForSelection - enables cut/copy/etc when selection is active
 */
export function registerDOMHelpers({
  disableActionsForNoSelection,
  enableActionsForSelection,
}) {
  _disableActionsForNoSelection = disableActionsForNoSelection
  _enableActionsForSelection = enableActionsForSelection
}

// ─── State methods ─────────────────────────────────────────────────────────────

/**
 * Reset some state properties
 * TODO: (Low Priority) add other items to reset such as those reset after an action is pushed to undoStack
 */
function reset() {
  state.tool.clickCounter = 0
  if (state.vector.properties.forceCircle) {
    state.vector.properties.forceCircle = false
  }
}

/**
 * Deselect
 */
function deselect() {
  state.selection.resetProperties()
  state.selection.resetBoundaryBox()
  state.vector.properties = {}
  if (_vectorGui) {
    _vectorGui.selectedPoint = {
      xKey: null,
      yKey: null,
    }
    _vectorGui.resetCollision()
  }
  state.vector.setCurrentIndex(null)
  state.vector.clearSelected()
  state.ui.vectorTransformOpen = false
  bump()
  if (dom.vectorTransformUIContainer)
    dom.vectorTransformUIContainer.style.display = 'none'
  if (_vectorGui) {
    //reset vectorGui mother object
    _vectorGui.mother.newRotation = 0
    _vectorGui.mother.currentRotation = 0
    _vectorGui.mother.rotationOrigin.x = null
    _vectorGui.mother.rotationOrigin.y = null
  }
  //should be for all selected vectors
  if (_disableActionsForNoSelection) _disableActionsForNoSelection()
}

/**
 * Invert selection
 * TODO: (Low Priority) implement invertSelection. Can only be done by redefining the masked area, should NOT use a marker which changes the logic elsewhere in the code
 */
// function invertSelection() {

// }

/**
 */
function clearRedoStack() {
  state.timeline.currentAction = null
  for (const action of state.timeline.redoStack) {
    //remove vectors from state.vector.all that has creation action as part of redoStack
    if (action.vectorIndices && tools[action.tool].type === 'vector') {
      action.vectorIndices.forEach((index) => {
        delete state.vector.all[index]
      })
    }
    //remove pastedImages from state.clipboard.pastedImages that has creation action as part of redoStack
    if (action.pastedImageKey && action.tool === 'paste' && !action.confirmed) {
      delete state.clipboard.pastedImages[action.pastedImageKey]
    }
  }
  state.timeline.redoStack = []
}
