import { TRANSLATE } from "../utils/constants.js"
import {
  disableActionsForNoSelection,
  enableActionsForSelection,
} from "../DOM/disableDomElements.js"
import { vectorGui } from "../GUI/vector.js"
import { dom } from "./dom.js"
import { tools } from "../Tools/index.js"

//====================================//
//======== * * * State * * * =========//
//====================================//

//Main state object to keep track of global vars
export const state = {
  tooltipMessage: null,
  tooltipTarget: null,
  //timeline
  pointsSet: null,
  seenPixelsSet: null,
  maskSet: null,
  selectPixelPoints: null,
  selectCornersSet: null,
  points: [],
  action: null, //object with tool, mode, properties, layer, hidden, removed, points. points will have x, y, color, brush info
  undoStack: [],
  redoStack: [],
  //save settings
  saveDialogOpen: false,
  saveSettings: {
    saveAsFileName: "my drawing",
    preserveHistory: true,
    includePalette: true,
    includeReferenceLayers: true,
    includeRemovedActions: true,
  },
  //tool settings
  tool: null, //needs to be initialized
  //touchscreen?
  touch: false,
  //dragging target
  dragging: false,
  dragX: null,
  dragY: null,
  dragTarget: null,
  dragSiblings: [],
  //active variables for canvas
  shortcuts: true,
  clickDisabled: false,
  clicked: false,
  cursorX: null, //absolute cursor coordinates relative to drawing area
  cursorY: null,
  previousX: 0,
  previousY: 0,
  cursorWithCanvasOffsetX: null, //absolute cursor coords with offset relative to viewable canvas area
  cursorWithCanvasOffsetY: null,
  //x1/y1 for line tool
  lineStartX: null,
  lineStartY: null,
  //transforms
  grabStartX: null,
  grabStartY: null,
  startScale: null,
  //for vector tools
  clickCounter: 0,
  vectorsSavedProperties: {},
  activeIndexes: [],
  savedBetweenActionImages: [],
  vectorProperties: {
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
    // unifiedOffset: null, //Can be 0 or 1. Used for ellipse when drawing a circle to maintain same x and y offset instead of separating them.
    // x1Offset: 0,
    // y1Offset: 0,
    // forceCircle: false,
  },
  //Vectors
  vectors: {},
  redoStackHeldVectors: {},
  currentVectorIndex: null,
  collidedVectorIndex: null,
  highestVectorKey: 0,
  selectedVectorIndicesSet: new Set(), //TODO: (Medium Priority) logic for which actions reset selected vectors
  shapeCenterX: null,
  shapeCenterY: null,
  grabStartShapeCenterX: null,
  grabStartShapeCenterY: null,
  grabStartAngle: null,
  vectorTransformMode: TRANSLATE, //enum: translate, rotate, scale
  //for select tool
  selectProperties: {
    px1: null,
    py1: null,
    px2: null,
    py2: null,
  },
  //null boundaryBox means no restriction on drawing
  boundaryBox: {
    xMin: null,
    yMin: null,
    xMax: null,
    yMax: null,
  },
  //Transform/ Paste
  pastedImages: {
    // index: {
    //   imageData: null,
    // },
  },
  highestPastedImageKey: 0,
  currentPastedImageKey: null,
  // originalImageDataForTransform: null,
  previousBoundaryBox: null,
  isMirroredHorizontally: false,
  isMirroredVertically: false,
  transformationRotationDegrees: 0,
  selectClipboard: {
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
  },
  //for perfect pixels
  lastDrawnX: null,
  lastDrawnY: null,
  waitingPixelX: null,
  waitingPixelY: null,
  //for colorMask
  colorLayerGlobal: null,
  localColorLayer: null,
  //functions
  reset,
  resetSelectProperties,
  normalizeSelectProperties,
  resetBoundaryBox,
  setBoundaryBox,
  deselect,
  clearRedoStack,
}

/**
 * Reset some state properties
 * TODO: (Low Priority) add other items to reset such as those reset after an action is pushed to undoStack
 */
function reset() {
  state.clickCounter = 0
  if (state.vectorProperties.forceCircle) {
    state.vectorProperties.forceCircle = false
  }
}

/**
 * Reset select properties
 */
function resetSelectProperties() {
  state.selectProperties = {
    px1: null,
    py1: null,
    px2: null,
    py2: null,
  }
  state.maskSet = null
}

/**
 * Normalize select properties
 */
function normalizeSelectProperties() {
  const { px1, py1, px2, py2 } = { ...state.selectProperties }
  //set selectProperties so p1 is min and p2 is max
  state.selectProperties.px1 = Math.min(px1, px2)
  state.selectProperties.py1 = Math.min(py1, py2)
  state.selectProperties.px2 = Math.max(px2, px1)
  state.selectProperties.py2 = Math.max(py2, py1)
}

/**
 * Reset boundaryBox
 */
function resetBoundaryBox() {
  state.boundaryBox = {
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
    state.boundaryBox.xMin = Math.min(
      selectProperties.px1,
      selectProperties.px2
    )
    state.boundaryBox.yMin = Math.min(
      selectProperties.py1,
      selectProperties.py2
    )
    state.boundaryBox.xMax = Math.max(
      selectProperties.px2,
      selectProperties.px1
    )
    state.boundaryBox.yMax = Math.max(
      selectProperties.py2,
      selectProperties.py1
    )
    enableActionsForSelection()
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
  state.vectorProperties = {}
  vectorGui.selectedPoint = {
    xKey: null,
    yKey: null,
  }
  vectorGui.resetCollision()
  state.currentVectorIndex = null
  state.selectedVectorIndicesSet.clear()
  dom.vectorTransformUIContainer.style.display = "none"
  //reset vectorGui mother object
  vectorGui.mother.newRotation = 0
  vectorGui.mother.currentRotation = 0
  vectorGui.mother.rotationOrigin.x = null
  vectorGui.mother.rotationOrigin.y = null
  //should be for all selected vectors
  disableActionsForNoSelection()
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
  state.action = null
  for (const action of state.redoStack) {
    //remove vectors from state.vectors that has creation action as part of redoStack
    if (action.vectorIndices && tools[action.tool].type === "vector") {
      action.vectorIndices.forEach((index) => {
        delete state.vectors[index]
      })
    }
    //remove pastedImages from state.pastedImages that has creation action as part of redoStack (Currently that includes unconfirmed paste action only)
    if (action.pastedImageKey && action.tool === "paste" && !action.confirmed) {
      delete state.pastedImages[action.pastedImageKey]
    }
  }
  state.redoStack = []
}
