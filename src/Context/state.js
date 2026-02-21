import { TRANSLATE } from "../utils/constants.js"
import { dom } from "./dom.js"
import { tools } from "../Tools/index.js"

//====================================//
//======== * * * State * * * =========//
//====================================//

//Main state object to keep track of global vars
export const state = {
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
      // type: null,
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
  },
  // UI — drag, tooltip, shortcuts, and save dialog
  ui: {
    tooltipMessage: null, // was: tooltipMessage
    tooltipTarget: null, // was: tooltipTarget
    dragging: false, // was: dragging
    dragX: null, // was: dragX
    dragY: null, // was: dragY
    dragTarget: null, // was: dragTarget
    dragSiblings: [], // was: dragSiblings
    shortcuts: true, // was: shortcuts
    saveDialogOpen: false, // was: saveDialogOpen
    saveSettings: {
      saveAsFileName: "my drawing",
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
  //functions
  reset,
  resetSelectProperties,
  normalizeSelectProperties,
  resetBoundaryBox,
  setBoundaryBox,
  deselect,
  clearRedoStack,
}

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
 * Reset select properties
 */
function resetSelectProperties() {
  state.selection.properties = {
    px1: null,
    py1: null,
    px2: null,
    py2: null,
  }
  state.selection.maskSet = null
}

/**
 * Normalize select properties
 */
function normalizeSelectProperties() {
  const { px1, py1, px2, py2 } = { ...state.selection.properties }
  //set selectProperties so p1 is min and p2 is max
  state.selection.properties.px1 = Math.min(px1, px2)
  state.selection.properties.py1 = Math.min(py1, py2)
  state.selection.properties.px2 = Math.max(px2, px1)
  state.selection.properties.py2 = Math.max(py2, py1)
}

/**
 * Reset boundaryBox
 */
function resetBoundaryBox() {
  state.selection.boundaryBox = {
    xMin: null,
    yMin: null,
    xMax: null,
    yMax: null,
  }
}

/**
 * Set boundaryBox
 * @param {object} selectProperties - The properties of the selection
 */
function setBoundaryBox(selectProperties) {
  if (
    selectProperties.px1 !== null &&
    selectProperties.py1 !== null &&
    selectProperties.px2 !== null &&
    selectProperties.py2 !== null
  ) {
    state.selection.boundaryBox.xMin = Math.min(
      selectProperties.px1,
      selectProperties.px2
    )
    state.selection.boundaryBox.yMin = Math.min(
      selectProperties.py1,
      selectProperties.py2
    )
    state.selection.boundaryBox.xMax = Math.max(
      selectProperties.px2,
      selectProperties.px1
    )
    state.selection.boundaryBox.yMax = Math.max(
      selectProperties.py2,
      selectProperties.py1
    )
    if (_enableActionsForSelection) _enableActionsForSelection()
  } else {
    resetBoundaryBox()
  }
}

/**
 * Deselect
 */
function deselect() {
  resetSelectProperties()
  resetBoundaryBox()
  state.vector.properties = {}
  if (_vectorGui) {
    _vectorGui.selectedPoint = {
      xKey: null,
      yKey: null,
    }
    _vectorGui.resetCollision()
  }
  state.vector.currentIndex = null
  state.vector.selectedIndices.clear()
  dom.vectorTransformUIContainer.style.display = "none"
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
    if (action.vectorIndices && tools[action.tool].type === "vector") {
      action.vectorIndices.forEach((index) => {
        delete state.vector.all[index]
      })
    }
    //remove pastedImages from state.clipboard.pastedImages that has creation action as part of redoStack
    if (action.pastedImageKey && action.tool === "paste" && !action.confirmed) {
      delete state.clipboard.pastedImages[action.pastedImageKey]
    }
  }
  state.timeline.redoStack = []
}
