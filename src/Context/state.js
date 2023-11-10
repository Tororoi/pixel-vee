import { swatches } from "./swatch.js"

//====================================//
//======== * * * State * * * =========//
//====================================//

//Main state object to keep track of global vars
export const state = {
  captureTesting: false,
  testing: false,
  grid: false,
  //timeline
  pointsSet: null,
  drawnPointsSet: null,
  maskSet: null,
  selectPixelPoints: null,
  selectCornersSet: null,
  points: [],
  action: null, //object with tool, mode, properties, layer, hidden, removed, points. points will have x, y, color, brush info
  undoStack: [],
  redoStack: [],
  //tool settings
  tool: null, //needs to be initialized
  brushStamp: {
    "0,0": [{ x: 0, y: 0 }],
    "1,0": [{ x: 0, y: 0 }],
    "1,1": [{ x: 0, y: 0 }],
    "0,1": [{ x: 0, y: 0 }],
    "-1,1": [{ x: 0, y: 0 }],
    "-1,0": [{ x: 0, y: 0 }],
    "-1,-1": [{ x: 0, y: 0 }],
    "0,-1": [{ x: 0, y: 0 }],
    "1,-1": [{ x: 0, y: 0 }],
  }, //default 1 pixel
  brushStamps: {},
  brushType: "circle",
  brushDirection: "0,0",
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
  //for perfect pixels
  lastDrawnX: null,
  lastDrawnY: null,
  waitingPixelX: null,
  waitingPixelY: null,
  //for colorMask
  colorLayerGlobal: null,
  localColorLayer: null,
  //functions
  addToTimeline,
  reset,
  resetSelectProperties,
}

/**
 * This sets the action which is then pushed to the undoStack for the command pattern
 * @param {Object} actionObject
 */
function addToTimeline(actionObject) {
  const { tool, color, brushStamp, brushSize, layer, properties } = actionObject
  //use current state for variables
  state.action = {
    layer: layer,
    brushStamp: brushStamp || state.brushStamp,
    brushSize: brushSize || state.tool.brushSize,
    color: color || { ...swatches.primary.color },
    tool: tool,
    modes: { ...tool.modes }, //TODO: should be replaced by options to allow multi selection of modes
    properties,
    hidden: false,
    removed: false,
  }
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
