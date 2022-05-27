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
  event: "none",
  clickDisabled: false,
  clicked: false,
  clickedColor: null,
  mouseX: null,
  mouseY: null,
  mox: null, //mouse coords with offset
  moy: null,
  ratio: null,
  trueRatio: null,
  onX: null,
  onY: null,
  lastOnX: null,
  lastOnY: null,
  lastX: null,
  lastY: null,
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
  //for moving canvas/ grab
  xOffset: 0,
  yOffset: 0,
  lastOffsetX: 0,
  lastOffsetY: 0,
}
