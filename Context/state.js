import { swatches } from "../Context/swatch.js"
import { toolbox } from "../Context/toolbox.js" //Must be imported for event listeners

//State (TODO: not yet a true state)
export const state = {
  //debugger *HOW TO USE: set the debugObject and debugFn in the place you want to debug, and comment the addToTimeline for the corresponding tool
  debugger: false,
  debugObject: {},
  debugFn: null,
  grid: false,
  vectorMode: true,
  //timeline
  points: [],
  undoStack: [],
  redoStack: [],
  //tool settings
  tool: null, //needs to be initialized
  mode: "draw", //TODO: modes should allow multiple modes at once {erase: false, perfect: false}
  brushStamp: [{ x: 0, y: 0, w: 1, h: 1 }], //default 1 pixel
  brushType: "circle",
  options: {
    perfect: false,
    erase: false,
    contiguous: false,
  },
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
  clickedColor: null,
  cursorX: null, //absolute cursor coordinates relative to drawing area
  cursorY: null,
  previousX: null,
  previousY: null,
  cursorWithCanvasOffsetX: null, //absolute cursor coords with offset relative to viewable canvas area
  cursorWithCanvasOffsetY: null,
  onscreenX: null, //coordinates based on viewable canvas area relative to zoom (deprecated? always double cursorWithCanvasOffsetX)
  onscreenY: null,
  previousOnscreenX: null,
  previousOnscreenY: null,
  //x2/y2 for line tool
  lineX: null,
  lineY: null,
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
  //for perfect pixels
  lastDrawnX: null,
  lastDrawnY: null,
  waitingPixelX: null,
  waitingPixelY: null,
  //for replace
  colorLayerGlobal: null,
  localColorLayer: null,
  //functions
  addToTimeline,
  reset,
}

/**
 * command pattern. TODO: Look into saving app-state instead
 * This sets to state.points and at the end of an action, state.points is pushed to the undo stack
 * @param {string} tool - tool to be recorded for history. Not necessarily the same as state.tool.name
 * @param {*} x
 * @param {*} y
 * @param {*} layer - layer that history should be applied to
 * @param {*} properties - custom properties for specific tool
 * @param {*} modifications - used for vector actions that can be changed after the fact, eg, line, curve, fill
 */
function addToTimeline(actionObject) {
  const { tool, x, y, color, brushStamp, brushSize, layer, properties } =
    actionObject
  //use current state for variables
  state.points.push({
    //x/y are sometimes objects with multiple values
    x: x,
    y: y,
    layer: layer,
    brush: brushStamp || state.brushStamp,
    weight: brushSize || state.tool.brushSize,
    color: color || { ...swatches.primary.color },
    tool: tool,
    // action: state.tool.fn, //should be passed as props, may not match state.tool.fn
    mode: state.mode,
    properties,
  })
}

function reset() {
  state.clickCounter = 0
  state.vectorProperties.forceCircle = false
}
