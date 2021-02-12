//state
const state = {
    //timeline
    points: [],
    undoStack: [],
    redoStack: [],
    //settings
    tool: { ...tools.pencil },
    mode: "draw",
    brushColor: { color: "rgba(255,0,0,255)", r: 255, g: 0, b: 0, a: 255 },
    backColor: { color: "rgba(255,255,255,255)", r: 255, g: 255, b: 255, a: 255 },
    palette: {},
    options: {
        perfect: false,
        erase: false,
        contiguous: false
    },
    //active variables for canvas
    event: "none",
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
    //for perfect pixels
    lastDrawnX: null,
    lastDrawnY: null,
    waitingPixelX: null,
    waitingPixelY: null,
    //for replace
    colorLayerGlobal: null,
    //for moving canvas/ grab
    xOffset: 0,
    yOffset: 0,
    lastOffsetX: 0,
    lastOffsetY: 0
}