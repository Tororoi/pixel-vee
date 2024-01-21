import { dom } from "./dom.js"
import { swatches } from "./swatch.js"
import { setSaveFilesizePreview } from "../Save/savefile.js"

//====================================//
//======== * * * State * * * =========//
//====================================//

//Main state object to keep track of global vars
export const state = {
  captureTesting: false,
  testNumPoints: 1000,
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
  clipMask: null,
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
    px1: null,
    py1: null,
    px2: null,
    py2: null,
    px3: null,
    py3: null,
    px4: null,
    py4: null,
    radA: null,
    radB: null,
    angle: null,
    offset: null, //rename to something more specific
    x1Offset: 0,
    y1Offset: 0,
    forceCircle: false,
  },
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
  selectionInversed: false,
  selectClipboard: {
    boundaryBox: null,
    dataURL: null,
    canvas: null,
    //TODO: for copying vectors, need more properties
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
  invertSelection,
}

/**
 * Reset some state properties
 * TODO: add other items to reset such as those reset after an action is pushed to undoStack
 */
function reset() {
  state.clickCounter = 0
  state.vectorProperties.forceCircle = false
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
 * @param {Object} selectProperties
 */
function setBoundaryBox(selectProperties) {
  state.boundaryBox.xMin = Math.min(selectProperties.px1, selectProperties.px2)
  state.boundaryBox.yMin = Math.min(selectProperties.py1, selectProperties.py2)
  state.boundaryBox.xMax = Math.max(selectProperties.px2, selectProperties.px1)
  state.boundaryBox.yMax = Math.max(selectProperties.py2, selectProperties.py1)
}

/**
 * Deselect
 */
function deselect() {
  resetSelectProperties()
  resetBoundaryBox()
  state.selectionInversed = false
}

/**
 * Invert selection
 */
function invertSelection() {
  state.selectionInversed = !state.selectionInversed
}
