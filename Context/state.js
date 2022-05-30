//State (not yet a true state)
export const state = {
  //timeline
  points: [],
  undoStack: [],
  redoStack: [],
  //settings
  tool: null, //needs to be initialized
  mode: "draw",
  brushColor: { color: "rgba(0,0,0,255)", r: 0, g: 0, b: 0, a: 255 }, //default black
  backColor: { color: "rgba(255,255,255,255)", r: 255, g: 255, b: 255, a: 255 }, //default white
  brushStamp: [{ x: 0, y: 0, w: 1, h: 1 }], //default 1 pixel
  brushType: "circle",
  palette: {},
  options: {
    perfect: false,
    erase: false,
    contiguous: false,
  },
  //touchscreen?
  touch: false,
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
  trueRatio: null,
  onscreenX: null, //coordinates based on viewable canvas area relative to zoom (deprecated? always double cursorWithCanvasOffsetX)
  onscreenY: null,
  previousOnscreenX: null,
  previousOnscreenY: null,
  //x2/y2 for line tool
  lineX: null,
  lineY: null,
  //for curve tool
  clickCounter: 0,
  px1: null,
  py1: null,
  px2: null,
  py2: null,
  px3: null,
  py3: null,
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
}

/**
 * command pattern. TODO: Look into saving app-state instead
 * @param {string} tool - tool to be recorded for history. Not necessarily the same as state.tool.name
 * @param {*} x
 * @param {*} y
 * @param {*} layer - layer that history should be applied to
 */
function addToTimeline(tool, x, y, layer) {
  //use current state for variables
  state.points.push({
    //x/y are sometimes objects with multiple values
    x: x,
    y: y,
    layer: layer,
    brush: state.brushStamp,
    weight: state.tool.brushSize,
    color: { ...state.brushColor },
    tool: tool,
    action: state.tool.fn,
    mode: state.mode,
  })
}
