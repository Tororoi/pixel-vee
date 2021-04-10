//===================================//
//========= * * * DOM * * * =========//
//===================================//

//Main
let fullPage = document.querySelector(".full-page");

//Set onscreen canvas and its context
let onScreenCVS = document.getElementById("onScreen");
let onScreenCTX = onScreenCVS.getContext("2d");
//original canvas width/height
let ocWidth = onScreenCVS.width;
let ocHeight = onScreenCVS.height;
//improve sharpness
//BUG: sharpness (8+) greatly affects performance in browsers other than chrome (can safari and firefox not handle large canvases?)
let sharpness = 4;
let zoom = 1;
//adjust canvas ratio here if needed
onScreenCVS.width = ocWidth * sharpness;
onScreenCVS.height = ocHeight * sharpness;
onScreenCTX.scale(sharpness * zoom, sharpness * zoom);

//Get the undo buttons
let undoBtn = document.getElementById("undo");
let redoBtn = document.getElementById("redo");

//Get swatch
let swatch = document.querySelector(".swatch");
let backSwatch = document.querySelector(".back-swatch");
let colorSwitch = document.querySelector(".color-switch");

let colorPicker = document.querySelector(".color-container");

//Get the reset buttons
let recenterBtn = document.querySelector(".recenter");
let clearBtn = document.querySelector(".clear");

//zoom buttons
let zoomCont = document.querySelector(".zoom");

//Get tool buttons
let toolsCont = document.querySelector(".tools");
let toolBtn = document.querySelector("#pencil");
toolBtn.style.background = "rgb(255, 255, 255)";

let modesCont = document.querySelector(".modes");
let modeBtn = document.querySelector("#draw");
modeBtn.style.background = "rgb(255, 255, 255)";

//Reference upload
let uploadBtn = document.querySelector("#file-upload");

//Layers
let layersCont = document.querySelector(".layers");

//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
let offScreenCVS = document.createElement('canvas');
let offScreenCTX = offScreenCVS.getContext("2d");
//Set the dimensions of the drawing canvas
offScreenCVS.width = 256;
offScreenCVS.height = 256;
//for adjusting canvas size, adjust onscreen canvas dimensions in proportion to offscreen

//========================================//
//=== * * * Important References * * * ===//
//========================================//

//Tools
const tools = {
    pencil: {
        name: "pencil",
        fn: drawSteps,
        brushSize: 1,
        options: ["perfect"]
    },
    replace: {
        name: "replace",
        fn: replaceSteps,
        brushSize: 1,
        options: ["perfect"]
    },
    // shading: {
    // user selects hsl shading color which mixes with colors that the user draws on to create dynamic shading
    // },
    line: {
        name: "line",
        fn: lineSteps,
        brushSize: 1,
        options: []
    },
    fill: {
        name: "fill",
        fn: fillSteps,
        brushSize: 1,
        options: ["contiguous"]
    },
    // gradient: {
    // Create a dithered gradient
    // },
    curve: {
        name: "curve",
        fn: curveSteps,
        brushSize: 1,
        options: []
    },
    // shapes: {
    // square, circle, and custom saved shape?
    // },
    picker: {
        name: "picker",
        fn: pickerSteps,
        brushSize: 1,
        options: []
    },
    grab: {
        name: "grab",
        fn: grabSteps,
        brushSize: 1,
        options: []
    }
    // move: {
    // Move a layer's coordinates independent of other layers
    // }
}

//Layers (types: raster, vector, reference)
const layers = [];

//create first layer
addRasterLayer();

//State (not yet a true state)
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
    shortcuts: true,
    currentLayer: layers[0],
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
    lastOffsetY: 0
}

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

//Shortcuts
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

onScreenCVS.addEventListener('wheel', handleWheel);

//Mouse
onScreenCVS.addEventListener('mousemove', handleMouseMove);
onScreenCVS.addEventListener('mousedown', handleMouseDown);
onScreenCVS.addEventListener('mouseup', handleMouseUp);
onScreenCVS.addEventListener('mouseout', handleMouseOut);

//Toolbox
undoBtn.addEventListener('click', handleUndo);
redoBtn.addEventListener('click', handleRedo);

recenterBtn.addEventListener('click', handleRecenter);
clearBtn.addEventListener('click', handleClear);

zoomCont.addEventListener('click', handleZoom);

swatch.addEventListener('click', openColorPicker);
backSwatch.addEventListener('click', openColorPicker);
colorSwitch.addEventListener('click', switchColors);

toolsCont.addEventListener('click', handleTools);
modesCont.addEventListener('click', handleModes);

uploadBtn.addEventListener("change", addReferenceLayer);

layersCont.addEventListener("click", layerInteract);

function layerInteract(e) {
    let arr = [...layersCont.children];
    let index = arr.indexOf(e.target.closest(".layer"));
    // console.log(e.target.childNodes[0])
    if (e.target.className.includes("hide")) {
        if (e.target.childNodes[0].className.includes("eyeopen")) {
            e.target.childNodes[0].className = "eyeclosed icon";
            layers[index].opacity = 0;
        } else if (e.target.childNodes[0].className.includes("eyeclosed")) {
            e.target.childNodes[0].className = "eyeopen icon";
            layers[index].opacity = 1;
        }
    };
    drawCanvas();
};

//======================================//
//=== * * * Key Event Handlers * * * ===//
//======================================//

function handleKeyDown(e) {
    // console.log(e.key)
    if (state.shortcuts) {
        switch (e.code) {
            case 'KeyZ':
                if (e.metaKey) {
                    if (e.key === 'Ω') {
                        //alt+meta+z
                        handleRedo();
                    } else {
                        handleUndo();
                    }
                }
                break;
            case 'MetaLeft':
            case 'MetaRight':
                //command key
                break;
            case 'Space':
                state.tool = tools["grab"];
                onScreenCVS.style.cursor = "move";
                break;
            case 'AltLeft':
            case 'AltRight':
                //option key
                state.tool = tools["picker"];
                onScreenCVS.style.cursor = "none";
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                if (toolBtn.id === "pencil") {
                    state.tool = tools["line"];
                    onScreenCVS.style.cursor = "none";
                }
                break;
            case 'KeyS':
                let r = Math.floor(Math.random() * 256);
                let g = Math.floor(Math.random() * 256);
                let b = Math.floor(Math.random() * 256);
                setColor(r, g, b, "swatch btn");
                break;
            case 'KeyD':
                //reset old button
                modeBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                modeBtn = document.querySelector("#draw");
                modeBtn.style.background = "rgb(238, 206, 102)";
                state.mode = "draw";
                break;
            case 'KeyE':
                //reset old button
                modeBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                modeBtn = document.querySelector("#erase");
                modeBtn.style.background = "rgb(238, 206, 102)";
                state.mode = "erase";
                break;
            case 'KeyP':
                //reset old button
                modeBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                modeBtn = document.querySelector("#perfect");
                modeBtn.style.background = "rgb(238, 206, 102)";
                state.mode = "perfect";
                break;
            case 'KeyB':
                //reset old button
                toolBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                toolBtn = document.querySelector("#pencil");
                toolBtn.style.background = "rgb(238, 206, 102)";
                state.tool = tools["pencil"];
                onScreenCVS.style.cursor = "crosshair";
                break;
            case 'KeyR':
                //reset old button
                toolBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                toolBtn = document.querySelector("#replace");
                toolBtn.style.background = "rgb(238, 206, 102)";
                state.tool = tools["replace"];
                onScreenCVS.style.cursor = "crosshair";
                break;
            case 'KeyL':
                //reset old button
                toolBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                toolBtn = document.querySelector("#line");
                toolBtn.style.background = "rgb(238, 206, 102)";
                state.tool = tools["line"];
                onScreenCVS.style.cursor = "none";
                break;
            case 'KeyF':
                //reset old button
                toolBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                toolBtn = document.querySelector("#fill");
                toolBtn.style.background = "rgb(238, 206, 102)";
                state.tool = tools["fill"];
                onScreenCVS.style.cursor = "none";
                break;
            case 'KeyC':
                //reset old button
                toolBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                toolBtn = document.querySelector("#curve");
                toolBtn.style.background = "rgb(238, 206, 102)";
                state.tool = tools["curve"];
                onScreenCVS.style.cursor = "none";
                break;
            default:
            //do nothing
        }
    }
}

function handleKeyUp(e) {
    if (e.code === 'Space' || e.code === 'AltLeft' || e.code === 'AltRight' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        state.tool = tools[toolBtn.id];
    }

    if (toolBtn.id === "grab") {
        onScreenCVS.style.cursor = "move";
    } else if (toolBtn.id === "replace" || toolBtn.id === "pencil" || toolBtn.id === "curve") {
        onScreenCVS.style.cursor = "crosshair";
    } else {
        onScreenCVS.style.cursor = "none";
    }
}

//========================================//
//=== * * * Mouse Event Handlers * * * ===//
//========================================//

function handleMouseDown(e) {
    state.event = "mousedown";
    state.clicked = true;
    state.trueRatio = onScreenCVS.offsetWidth / offScreenCVS.width * zoom;
    state.mox = Math.floor(e.offsetX / state.trueRatio);
    state.moy = Math.floor(e.offsetY / state.trueRatio);
    state.mouseX = Math.round(state.mox - (state.xOffset / state.ratio * zoom));
    state.mouseY = Math.round(state.moy - (state.yOffset / state.ratio * zoom));
    //run selected tool step function
    state.tool.fn();
}

function handleMouseMove(e) {
    state.event = "mousemove";
    //currently only square dimensions work
    state.trueRatio = onScreenCVS.offsetWidth / offScreenCVS.width * zoom;
    state.ratio = ocWidth / offScreenCVS.width * zoom;
    //coords
    state.mox = Math.floor(e.offsetX / state.trueRatio);
    state.moy = Math.floor(e.offsetY / state.trueRatio);
    state.mouseX = Math.round(state.mox - (state.xOffset / state.ratio * zoom));
    state.mouseY = Math.round(state.moy - (state.yOffset / state.ratio * zoom));
    //Hover brush
    state.onX = state.mox * state.ratio / zoom;
    state.onY = state.moy * state.ratio / zoom;
    if (state.clicked || (state.tool.name === "curve" && state.clickCounter > 0)) {
        //run selected tool step function
        state.tool.fn();
    } else {
        //normalize cursor render to pixelgrid
        if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
            onScreenCTX.clearRect(0, 0, ocWidth / zoom, ocHeight / zoom);
            drawCanvas();
            renderCursor();
            state.lastOnX = state.onX;
            state.lastOnY = state.onY;
        }
    }
}

function handleMouseUp(e) {
    state.event = "mouseup";
    state.clicked = false;
    state.trueRatio = onScreenCVS.offsetWidth / offScreenCVS.width * zoom;
    state.mox = Math.floor(e.offsetX / state.trueRatio);
    state.moy = Math.floor(e.offsetY / state.trueRatio);
    state.mouseX = Math.round(state.mox - (state.xOffset / state.ratio * zoom));
    state.mouseY = Math.round(state.moy - (state.yOffset / state.ratio * zoom));
    //run selected tool step function
    state.tool.fn();
    //add to undo stack
    if (state.points.length) {
        state.undoStack.push(state.points);
    }
    state.points = [];
    //Reset redostack
    state.redoStack = [];
    state.event = "none";
    // img.onload = () => {
    renderCursor();
    // }
}

function handleMouseOut(e) {
    if (state.clicked) {
        state.event = "mouseout";
        state.clicked = false;
        state.tool.fn();
        //add to undo stack
        if (state.points.length) {
            state.undoStack.push(state.points);
        }
        state.points = [];
        //Reset redostack
        state.redoStack = [];
        onScreenCTX.clearRect(0, 0, ocWidth / zoom, ocHeight / zoom);
        drawCanvas();
    }
    state.event = "none";
}

function handleWheel(e) {
    let delta = Math.sign(e.deltaY);
    //BUG: zoom doesn't stay centered, wobbles slightly (due to forcing the normalization to the pixelgrid?)
    //zoom based on mouse coords
    let z;
    let rw = ocWidth / offScreenCVS.width;
    let nox = Math.round(((state.mox * state.ratio) / 5 / zoom) / rw) * rw;
    let noy = Math.round(((state.moy * state.ratio) / 5 / zoom) / rw) * rw;
    let lox = Math.round(((state.mox * state.ratio) / 4 / zoom) / rw) * rw;
    let loy = Math.round(((state.moy * state.ratio) / 4 / zoom) / rw) * rw;
    if (delta < 0) {
        z = 0.8;
        zoom *= z;
        state.xOffset += lox;
        state.yOffset += loy;
    } else if (delta > 0) {
        z = 1.25;
        state.xOffset -= nox;
        state.yOffset -= noy;
        zoom *= z;
    }
    //re scale canvas
    onScreenCTX.scale(z, z);
    state.lastOffsetX = state.xOffset;
    state.lastOffsetY = state.yOffset;
    drawCanvas();
}

//=========================================//
//=== * * * Button Event Handlers * * * ===//
//=========================================//

function handleZoom(e) {
    //BUG: zoom doesn't stay centered, wobbles slightly (due to forcing the normalization to the pixelgrid?)
    //general zoom based on center
    if (e.target.closest(".zoombtn")) {
        let zoomBtn = e.target.closest(".zoombtn");
        let z;
        let rw = ocWidth / offScreenCVS.width;
        //next origin
        let nox = Math.round((ocWidth / 10 / zoom) / rw) * rw;
        let noy = Math.round((ocHeight / 10 / zoom) / rw) * rw;
        let lox = Math.round((ocWidth / 8 / zoom) / rw) * rw;
        let loy = Math.round((ocHeight / 8 / zoom) / rw) * rw;
        if (zoomBtn.id === "minus") {
            z = 0.8;
            zoom *= z;
            state.xOffset += lox;
            state.yOffset += loy;
        } else if (zoomBtn.id === "plus") {
            z = 1.25;
            zoom *= z;
            state.xOffset -= nox;
            state.yOffset -= noy;
        }
        //re scale canvas
        onScreenCTX.scale(z, z);
        state.lastOffsetX = state.xOffset;
        state.lastOffsetY = state.yOffset;
        drawCanvas();
    }
}

function handleUndo() {
    if (state.undoStack.length > 0) {
        actionUndoRedo(state.redoStack, state.undoStack);
    }
}

function handleRedo() {
    if (state.redoStack.length >= 1) {
        actionUndoRedo(state.undoStack, state.redoStack);
    }
}

function handleTools(e) {
    if (e.target.closest(".tool")) {
        //failsafe for hacking tool ids
        if (tools[e.target.closest(".tool").id]) {
            //reset old button
            toolBtn.style.background = "rgb(131, 131, 131)";
            toolBtn.querySelector(".icon").style = "opacity: 0.6;"
            //get new button and select it
            toolBtn = e.target.closest(".tool");
            toolBtn.style.background = "rgb(255, 255, 255)";
            toolBtn.querySelector(".icon").style = "opacity: 1;"
            state.tool = tools[toolBtn.id];
            if (toolBtn.id === "grab") {
                onScreenCVS.style.cursor = "move";
            } else if (toolBtn.id === "replace" || toolBtn.id === "pencil" || toolBtn.id === "curve") {
                onScreenCVS.style.cursor = "crosshair";
            } else {
                onScreenCVS.style.cursor = "none";
            }
        }
    }
}

function handleModes(e) {
    if (e.target.closest(".mode")) {
        //reset old button
        modeBtn.style.background = "rgb(131, 131, 131)";
        modeBtn.querySelector(".icon").style = "opacity: 0.6;"
        //get new button and select it
        modeBtn = e.target.closest(".mode");
        modeBtn.querySelector(".icon").style = "opacity: 1;"
        modeBtn.style.background = "rgb(255, 255, 255)";
        state.mode = modeBtn.id;
    }
}

//===========================================//
//=== * * * Graphics User Interface * * * ===//
//===========================================//

function renderCursor() {
    switch (state.tool.name) {
        case "grab":
            //show nothing
            break;
        case "picker":
            //empty square
            drawCursorBox();
            break;
        default:
            drawCurrentPixel();
            drawCursorBox();
    }
    function drawCursorBox() {
        //line offset to stroke offcenter;
        let ol = 0;
        onScreenCTX.beginPath();
        onScreenCTX.lineWidth = 0.5;
        onScreenCTX.strokeStyle = "black";
        //top
        onScreenCTX.moveTo(state.onX, state.onY - ol);
        onScreenCTX.lineTo(state.onX + state.ratio / zoom, state.onY - ol);
        //right
        onScreenCTX.moveTo(state.onX + ol + state.ratio / zoom, state.onY);
        onScreenCTX.lineTo(state.onX + ol + state.ratio / zoom, state.onY + state.ratio / zoom);
        //bottom
        onScreenCTX.moveTo(state.onX, state.onY + ol + state.ratio / zoom);
        onScreenCTX.lineTo(state.onX + state.ratio / zoom, state.onY + ol + state.ratio / zoom);
        //left
        onScreenCTX.moveTo(state.onX - ol, state.onY);
        onScreenCTX.lineTo(state.onX - ol, state.onY + state.ratio / zoom);

        onScreenCTX.stroke();
    }
}

function drawCurrentPixel() {
    //draw onscreen current pixel
    if (state.mode === "erase") {
        onScreenCTX.clearRect(state.onX, state.onY, state.ratio / zoom, state.ratio / zoom);
    } else {
        onScreenCTX.fillStyle = state.brushColor.color;
        onScreenCTX.fillRect(state.onX, state.onY, state.ratio / zoom, state.ratio / zoom);
    }
}

//====================================//
//===== * * * Action Tools * * * =====//
//====================================//

//"Steps" functions are controllers for the process
function drawSteps() {
    switch (state.event) {
        case "mousedown":
            actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.currentLayer.ctx, state.mode);
            state.lastX = state.mouseX;
            state.lastY = state.mouseY;
            state.lastDrawnX = state.mouseX;
            state.lastDrawnY = state.mouseY;
            state.waitingPixelX = state.mouseX;
            state.waitingPixelY = state.mouseY;
            addToTimeline(state.tool.name, state.mouseX, state.mouseY);
            break;
        case "mousemove":
            drawCurrentPixel();
            if (state.lastX !== state.mouseX || state.lastY !== state.mouseY) {
                //necessary drawcanvas?
                drawCanvas();
                drawCurrentPixel();
                //draw between points when drawing fast
                if (Math.abs(state.mouseX - state.lastX) > 1 || Math.abs(state.mouseY - state.lastY) > 1) {
                    //add to options, only execute if "continuous line" is on
                    actionLine(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, state.currentLayer.ctx, state.mode);
                    addToTimeline("line", { x1: state.lastX, x2: state.mouseX }, { y1: state.lastY, y2: state.mouseY });
                } else {
                    //perfect will be option, not mode
                    if (state.mode === "perfect") {
                        perfectPixels(state.mouseX, state.mouseY);
                    } else {
                        actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.currentLayer.ctx, state.mode);
                        addToTimeline(state.tool.name, state.mouseX, state.mouseY);
                    }
                }
            }
            // save last point
            state.lastX = state.mouseX;
            state.lastY = state.mouseY;
            break;
        case "mouseup":
            //only needed if perfect pixels option is on
            actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.currentLayer.ctx, state.mode);
            addToTimeline(state.tool.name, state.mouseX, state.mouseY);
            break;
        default:
        //do nothing
    }
}

function perfectPixels(currentX, currentY) {
    //if currentPixel not neighbor to lastDrawn, draw waitingpixel
    if (Math.abs(currentX - state.lastDrawnX) > 1 || Math.abs(currentY - state.lastDrawnY) > 1) {
        actionDraw(state.waitingPixelX, state.waitingPixelY, state.brushColor, state.tool.brushSize, state.currentLayer.ctx, state.mode);
        //update queue
        state.lastDrawnX = state.waitingPixelX;
        state.lastDrawnY = state.waitingPixelY;
        state.waitingPixelX = currentX;
        state.waitingPixelY = currentY;
        addToTimeline(state.tool.name, state.lastDrawnX, state.lastDrawnY);
    } else {
        state.waitingPixelX = currentX;
        state.waitingPixelY = currentY;
    }
}

function actionDraw(coordX, coordY, currentColor, size, ctx, currentMode) {
    ctx.fillStyle = currentColor.color;
    switch (currentMode) {
        case "erase":
            ctx.clearRect(Math.ceil(coordX - size / 2), Math.ceil(coordY - size / 2), size, size);
            break;
        default:
            ctx.fillRect(Math.ceil(coordX - size / 2), Math.ceil(coordY - size / 2), size, size);
    }
}

function lineSteps() {
    switch (state.event) {
        case "mousedown":
            state.lastX = state.mouseX;
            state.lastY = state.mouseY;
            break;
        case "mousemove":
            //draw line from origin point to current point onscreen
            //only draw when necessary
            if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
                onScreenCTX.clearRect(0, 0, ocWidth / zoom, ocHeight / zoom);
                drawCanvas();
                actionLine(state.lastX + (state.xOffset / state.ratio * zoom), state.lastY + (state.yOffset / state.ratio * zoom), state.mox, state.moy, state.brushColor, onScreenCTX, state.mode, state.ratio / zoom);
                state.lastOnX = state.onX;
                state.lastOnY = state.onY;
            }
            break;
        case "mouseup":
            actionLine(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, state.currentLayer.ctx, state.mode);
            addToTimeline(state.tool.name, { x1: state.lastX, x2: state.mouseX }, { y1: state.lastY, y2: state.mouseY });
            break;
        default:
        //do nothing
    }
}

function actionLine(sx, sy, tx, ty, currentColor, ctx, currentMode, scale = 1) {
    ctx.fillStyle = currentColor.color;
    let drawPixel = (x, y, w, h) => { return currentMode === "erase" ? ctx.clearRect(x, y, w, h) : ctx.fillRect(x, y, w, h) };
    //create triangle object
    let tri = {}
    function getTriangle(x1, y1, x2, y2, ang) {
        if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
            tri.x = Math.sign(Math.cos(ang));
            tri.y = Math.tan(ang) * Math.sign(Math.cos(ang));
            tri.long = Math.abs(x1 - x2);
        } else {
            tri.x = Math.tan((Math.PI / 2) - ang) * Math.sign(Math.cos((Math.PI / 2) - ang));
            tri.y = Math.sign(Math.cos((Math.PI / 2) - ang));
            tri.long = Math.abs(y1 - y2);
        }
    }
    // finds the angle of (x,y) on a plane from the origin
    function getAngle(x, y) {
        return Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0);
    }
    let angle = getAngle(tx - sx, ty - sy); // angle of line
    getTriangle(sx, sy, tx, ty, angle);

    for (let i = 0; i < tri.long; i++) {
        let thispoint = { x: Math.round(sx + tri.x * i), y: Math.round(sy + tri.y * i) };
        // for each point along the line
        drawPixel(thispoint.x * scale, // round for perfect pixels
            thispoint.y * scale, // thus no aliasing
            scale, scale); // fill in one pixel, 1x1

    }
    //fill endpoint
    drawPixel(Math.round(tx) * scale, // round for perfect pixels
        Math.round(ty) * scale, // thus no aliasing
        scale, scale); // fill in one pixel, 1x1
}

function replaceSteps() {
    switch (state.event) {
        case "mousedown":
            //get global colorlayer data to use while mouse is down
            state.localColorLayer = state.currentLayer.ctx.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
            actionReplace(state.localColorLayer);
            state.lastX = state.mouseX;
            state.lastY = state.mouseY;
            //for perfect pixels
            // state.lastDrawnX = state.mouseX;
            // state.lastDrawnY = state.mouseY;
            // state.waitingPixelX = state.mouseX;
            // state.waitingPixelY = state.mouseY;
            //get rid of onscreen cursor
            drawCanvas();
            break;
        case "mousemove":
            //draw onscreen current pixel if match to backColor
            //normalize mousemove to pixelgrid
            if (state.lastX !== state.mouseX || state.lastY !== state.mouseY) {
                actionReplace(state.localColorLayer);
                if (Math.abs(state.mouseX - state.lastX) > 1 || Math.abs(state.mouseY - state.lastY) > 1) {
                    //add to options, only execute if "continuous line" is on
                    lineReplace(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, state.currentLayer.ctx, state.mode, state.localColorLayer);
                } else {
                    //perfect will be option, not mode
                    // if (state.mode === "perfect") {
                    //     perfectPixels(state.mouseX, state.mouseY);
                    // } else {
                    actionReplace(state.localColorLayer);
                    // }
                }
            }
            // save last point
            state.lastX = state.mouseX;
            state.lastY = state.mouseY;
            break;
        case "mouseup":
            //only needed if perfect pixels option is on
            actionReplace(state.localColorLayer);
            //re-render image to allow onscreen cursor to render
            drawCanvas();
            break;
        default:
        //do nothing
    }
}

//replace actions are odd as they add to timeline inside but are never called by redrawPoints.
function lineReplace(sx, sy, tx, ty, currentColor, ctx, currentMode, colorLayer) {
    ctx.fillStyle = currentColor.color;
    //create triangle object
    let tri = {}
    function getTriangle(x1, y1, x2, y2, ang) {
        if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
            tri.x = Math.sign(Math.cos(ang));
            tri.y = Math.tan(ang) * Math.sign(Math.cos(ang));
            tri.long = Math.abs(x1 - x2);
        } else {
            tri.x = Math.tan((Math.PI / 2) - ang) * Math.sign(Math.cos((Math.PI / 2) - ang));
            tri.y = Math.sign(Math.cos((Math.PI / 2) - ang));
            tri.long = Math.abs(y1 - y2);
        }
    }
    // finds the angle of (x,y) on a plane from the origin
    function getAngle(x, y) { return Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0); }
    let angle = getAngle(tx - sx, ty - sy); // angle of line
    getTriangle(sx, sy, tx, ty, angle);

    for (let i = 0; i < tri.long; i++) {
        let thispoint = { x: Math.round(sx + tri.x * i), y: Math.round(sy + tri.y * i) };
        // for each point along the line
        let clickedColor = getColor(thispoint.x, thispoint.y, colorLayer);
        if (clickedColor.color === state.backColor.color) {
            actionDraw(thispoint.x, thispoint.y, state.brushColor, state.tool.brushSize, state.currentLayer.ctx, currentMode);
            addToTimeline(state.tool.name, thispoint.x, thispoint.y);
        }
    }
    //fill endpoint
    let clickedColor = getColor(Math.round(tx), Math.round(ty), colorLayer);
    if (clickedColor.color === state.backColor.color) {
        actionDraw(Math.round(tx), Math.round(ty), state.brushColor, state.tool.brushSize, state.currentLayer.ctx, currentMode);
        addToTimeline(state.tool.name, Math.round(tx), Math.round(ty));
    }
}

function actionReplace(colorLayer) {
    //sample color and replace if match
    state.clickedColor = getColor(state.mouseX, state.mouseY, colorLayer);
    if (state.clickedColor.color === state.backColor.color) {
        actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.currentLayer.ctx, state.mode);
        addToTimeline(state.tool.name, state.mouseX, state.mouseY);
    }
}

function fillSteps() {
    switch (state.event) {
        case "mousedown":
            actionFill(state.mouseX, state.mouseY, state.brushColor, state.currentLayer.ctx, state.mode);
            //For undo ability, store starting coords and settings and pass them into actionFill
            addToTimeline(state.tool.name, state.mouseX, state.mouseY);
            break;
        case "mouseup":
            //redraw canvas to allow onscreen cursor to render
            drawCanvas();
        default:
        //do nothing
    }
}

function actionFill(startX, startY, currentColor, ctx, currentMode) {
    //exit if outside borders
    if (startX < 0 || startX >= offScreenCVS.width || startY < 0 || startY >= offScreenCVS.height) {
        return;
    }
    //get imageData
    state.localColorLayer = ctx.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);

    state.clickedColor = getColor(startX, startY, state.localColorLayer);

    if (currentMode === "erase") currentColor = { color: "rgba(0,0,0,0)", r: 0, g: 0, b: 0, a: 0 };

    //exit if color is the same
    if (currentColor.color === state.clickedColor.color) {
        return;
    }
    //Start with click coords
    let pixelStack = [[startX, startY]];
    let newPos, x, y, pixelPos, reachLeft, reachRight;
    floodFill();
    function floodFill() {
        newPos = pixelStack.pop();
        x = newPos[0];
        y = newPos[1];

        //get current pixel position
        pixelPos = (y * offScreenCVS.width + x) * 4;
        // Go up as long as the color matches and are inside the canvas
        while (y >= 0 && matchStartColor(pixelPos)) {
            y--;
            pixelPos -= offScreenCVS.width * 4;
        }
        //Don't overextend
        pixelPos += offScreenCVS.width * 4;
        y++;
        reachLeft = false;
        reachRight = false;
        // Go down as long as the color matches and in inside the canvas
        while (y < offScreenCVS.height && matchStartColor(pixelPos)) {

            colorPixel(pixelPos);

            if (x > 0) {
                if (matchStartColor(pixelPos - 4)) {
                    if (!reachLeft) {
                        //Add pixel to stack
                        pixelStack.push([x - 1, y]);
                        reachLeft = true;
                    }
                } else if (reachLeft) {
                    reachLeft = false;
                }
            }

            if (x < offScreenCVS.width - 1) {
                if (matchStartColor(pixelPos + 4)) {
                    if (!reachRight) {
                        //Add pixel to stack
                        pixelStack.push([x + 1, y]);
                        reachRight = true;
                    }
                } else if (reachRight) {
                    reachRight = false;
                }
            }
            y++;
            pixelPos += offScreenCVS.width * 4;
        }

        if (pixelStack.length) {
            floodFill();
        }
    }

    //render floodFill result
    ctx.putImageData(state.localColorLayer, 0, 0);

    //helpers
    function matchStartColor(pixelPos) {
        let r = state.localColorLayer.data[pixelPos];
        let g = state.localColorLayer.data[pixelPos + 1];
        let b = state.localColorLayer.data[pixelPos + 2];
        let a = state.localColorLayer.data[pixelPos + 3];
        return (r === state.clickedColor.r && g === state.clickedColor.g && b === state.clickedColor.b && a === state.clickedColor.a);
    }

    function colorPixel(pixelPos) {
        state.localColorLayer.data[pixelPos] = currentColor.r;
        state.localColorLayer.data[pixelPos + 1] = currentColor.g;
        state.localColorLayer.data[pixelPos + 2] = currentColor.b;
        //not ideal
        state.localColorLayer.data[pixelPos + 3] = currentColor.a;
    }
}

function curveSteps() {
    switch (state.event) {
        case "mousedown":
            //solidify end points
            state.clickCounter += 1;
            if (state.clickCounter > 3) state.clickCounter = 1;
            switch (state.clickCounter) {
                case 1:
                    state.px1 = state.mouseX;
                    state.py1 = state.mouseY;
                    break;
                case 2:
                    state.px2 = state.mouseX;
                    state.py2 = state.mouseY;
                    break;
                default:
                //do nothing
            }
            break;
        case "mousemove":
            //draw line from origin point to current point onscreen
            //normalize mousemove to pixelgrid
            if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
                // onScreenCTX.clearRect(0, 0, ocWidth / zoom, ocHeight / zoom);
                drawCanvas();
                //onscreen preview
                actionCurve(
                    state.px1 + (state.xOffset / state.ratio * zoom),
                    state.py1 + (state.yOffset / state.ratio * zoom),
                    state.px2 + (state.xOffset / state.ratio * zoom),
                    state.py2 + (state.yOffset / state.ratio * zoom),
                    state.px3 + (state.xOffset / state.ratio * zoom),
                    state.py3 + (state.yOffset / state.ratio * zoom),
                    state.clickCounter,
                    state.brushColor,
                    onScreenCTX,
                    state.mode,
                    state.ratio / zoom
                );
                state.lastOnX = state.onX;
                state.lastOnY = state.onY;
            }
            break;
        case "mouseup" || "mouseout":
            if (state.clickCounter === 3) {
                //solidify control point
                state.px3 = state.mouseX;
                state.py3 = state.mouseY;
                actionCurve(
                    state.px1,
                    state.py1,
                    state.px2,
                    state.py2,
                    state.px3,
                    state.py3,
                    state.clickCounter + 1,
                    state.brushColor,
                    state.currentLayer.ctx,
                    state.mode
                );
                state.clickCounter = 0;
                //store control points for timeline
                addToTimeline(state.tool.name, { x1: state.px1, x2: state.px2, x3: state.px3 }, { y1: state.py1, y2: state.py2, y3: state.py3 });
            }
            break;
        default:
        //do nothing
    }
}

function actionCurve(startx, starty, endx, endy, controlx, controly, stepNum, currentColor, ctx, currentMode, scale = 1) {

    //force coords to int
    startx = Math.round(startx);
    starty = Math.round(starty);
    endx = Math.round(endx);
    endy = Math.round(endy);
    controlx = Math.round(controlx);
    controly = Math.round(controly);

    ctx.fillStyle = currentColor.color;

    function renderCurve(controlX, controlY) {
        function plot(x, y) {
            //rounded values
            let xt = Math.floor(x);
            let yt = Math.floor(y);

            //plot starting coordinates
            if (stepNum === 2 || stepNum === 3) {
                if (currentMode === "erase") {
                    onScreenCTX.clearRect(xt * state.ratio / zoom, yt * state.ratio / zoom, scale, scale);
                } else {
                    onScreenCTX.fillRect(xt * state.ratio / zoom, yt * state.ratio / zoom, scale, scale);
                }
            } else if (stepNum === 4) {
                if (currentMode === "erase") {
                    ctx.clearRect(xt, yt, scale, scale)
                } else {
                    ctx.fillRect(xt, yt, scale, scale)
                }
            }
        }

        function assert(condition, message) {
            if (!condition) {
                throw new Error(message || "Assertion failed");
            }
        }

        //p1, p2 are global endpoints
        plotQuadBezier(startx, starty, controlX, controlY, endx, endy);

        function plotQuadBezier(x0, y0, x1, y1, x2, y2) { /* plot any quadratic Bezier curve */
            let x = x0 - x1, y = y0 - y1;
            let t = x0 - 2 * x1 + x2, r;
            if (x * (x2 - x1) > 0) { /* horizontal cut at P4? */
                if (y * (y2 - y1) > 0) /* vertical cut at P6 too? */
                    if (Math.abs((y0 - 2 * y1 + y2) * x / t) > Math.abs(y)) { /* which first? */
                        x0 = x2; x2 = x + x1; y0 = y2; y2 = y + y1; /* swap points */
                    } /* now horizontal cut at P4 comes first */
                t = (x0 - x1) / t;
                r = (1 - t) * ((1 - t) * y0 + 2.0 * t * y1) + t * t * y2; /* By(t=P4) */
                t = (x0 * x2 - x1 * x1) * t / (x0 - x1); /* gradient dP4/dx=0 */
                x = Math.floor(t + 0.5); y = Math.floor(r + 0.5);
                r = (y1 - y0) * (t - x0) / (x1 - x0) + y0; /* intersect P3 | P0 P1 */
                plotQuadBezierSeg(x0, y0, x, Math.floor(r + 0.5), x, y);
                r = (y1 - y2) * (t - x2) / (x1 - x2) + y2; /* intersect P4 | P1 P2 */
                x0 = x1 = x; y0 = y; y1 = Math.floor(r + 0.5); /* P0 = P4, P1 = P8 */
            }
            if ((y0 - y1) * (y2 - y1) > 0) { /* vertical cut at P6? */
                t = y0 - 2 * y1 + y2; t = (y0 - y1) / t;
                r = (1 - t) * ((1 - t) * x0 + 2.0 * t * x1) + t * t * x2; /* Bx(t=P6) */
                t = (y0 * y2 - y1 * y1) * t / (y0 - y1); /* gradient dP6/dy=0 */
                x = Math.floor(r + 0.5); y = Math.floor(t + 0.5);
                r = (x1 - x0) * (t - y0) / (y1 - y0) + x0; /* intersect P6 | P0 P1 */
                plotQuadBezierSeg(x0, y0, Math.floor(r + 0.5), y, x, y);
                r = (x1 - x2) * (t - y2) / (y1 - y2) + x2; /* intersect P7 | P1 P2 */
                x0 = x; x1 = Math.floor(r + 0.5); y0 = y1 = y; /* P0 = P6, P1 = P7 */
            }
            plotQuadBezierSeg(x0, y0, x1, y1, x2, y2); /* remaining part */
        }

        //Bresenham's algorithm for bezier limited to gradients without sign change.
        function plotQuadBezierSeg(x0, y0, x1, y1, x2, y2) {
            let sx = x2 - x1, sy = y2 - y1;
            let xx = x0 - x1, yy = y0 - y1, xy;         /* relative values for checks */
            let dx, dy, err, cur = xx * sy - yy * sx;                    /* curvature */

            assert(xx * sx <= 0 && yy * sy <= 0, "sign of gradient must not change");  /* sign of gradient must not change */

            if (sx * sx + sy * sy > xx * xx + yy * yy) { /* begin with longer part */
                x2 = x0; x0 = sx + x1; y2 = y0; y0 = sy + y1; cur = -cur;  /* swap P0 P2 */
            }
            if (cur != 0) {                                    /* no straight line */
                xx += sx; xx *= sx = x0 < x2 ? 1 : -1;           /* x step direction */
                yy += sy; yy *= sy = y0 < y2 ? 1 : -1;           /* y step direction */
                xy = 2 * xx * yy; xx *= xx; yy *= yy;          /* differences 2nd degree */
                if (cur * sx * sy < 0) {                           /* negated curvature? */
                    xx = -xx; yy = -yy; xy = -xy; cur = -cur;
                }
                dx = 4.0 * sy * cur * (x1 - x0) + xx - xy;             /* differences 1st degree */
                dy = 4.0 * sx * cur * (y0 - y1) + yy - xy;
                xx += xx; yy += yy; err = dx + dy + xy;                /* error 1st step */
                while (dy < dx) { /* gradient negates -> algorithm fails */
                    plot(x0, y0);                                     /* plot curve */
                    if (x0 == x2 && y0 == y2) return;  /* last pixel -> curve finished */
                    y1 = 2 * err < dx;                  /* save value for test of y step */
                    if (2 * err > dy) { x0 += sx; dx -= xy; err += dy += yy; } /* x step */
                    if (y1) { y0 += sy; dy -= xy; err += dx += xx; } /* y step */
                }
            }
            /* plot remaining part to end */
            if (stepNum === 2 || stepNum === 3) {
                //REFACTOR, dry it up
                //create triangle object
                let tri = {}
                function getTriangle(x1, y1, x2, y2, ang) {
                    if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
                        tri.x = Math.sign(Math.cos(ang));
                        tri.y = Math.tan(ang) * Math.sign(Math.cos(ang));
                        tri.long = Math.abs(x1 - x2);
                    } else {
                        tri.x = Math.tan((Math.PI / 2) - ang) * Math.sign(Math.cos((Math.PI / 2) - ang));
                        tri.y = Math.sign(Math.cos((Math.PI / 2) - ang));
                        tri.long = Math.abs(y1 - y2);
                    }
                }
                // finds the angle of (x,y) on a plane from the origin
                function getAngle(x, y) {
                    return Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0);
                }
                let angle = getAngle(x2 - x0, y2 - y0); // angle of line
                getTriangle(x0, y0, x2, y2, angle);

                for (let i = 0; i < tri.long; i++) {
                    let thispoint = { x: Math.round(x0 + tri.x * i), y: Math.round(y0 + tri.y * i) };
                    // for each point along the line
                    plot(thispoint.x, thispoint.y)
                }
                //fill endpoint
                plot(x2, y2);
            } else if (stepNum === 4) {
                actionLine(x0, y0, x2, y2, currentColor, ctx, currentMode);
            }
        }
    }

    if (stepNum === 1) {
        //after defining x0y0
        actionLine(startx, starty, state.mox, state.moy, currentColor, onScreenCTX, currentMode, scale);
    } else if (stepNum === 2 || stepNum === 3) {
        // after defining x2y2
        //onscreen preview curve
        //somehow use rendercurve2 for flatter curves
        renderCurve(state.mox, state.moy);
    } else if (stepNum === 4) {
        //curve after defining x3y3
        renderCurve(controlx, controly);
    }
}

function handleClear() {
    addToTimeline("clear", 0, 0);
    state.undoStack.push(state.points);
    state.points = [];
    state.redoStack = [];
    state.currentLayer.ctx.clearRect(0, 0, offScreenCVS.width, offScreenCVS.height);
    drawCanvas();
}

//====================================//
//=== * * * Non-Action Tools * * * ===//
//====================================//

function handleRecenter(e) {
    onScreenCTX.scale(1 / zoom, 1 / zoom);
    zoom = 1;
    state.xOffset = 0;
    state.yOffset = 0;
    state.lastOffsetX = 0;
    state.lastOffsetY = 0;
    drawCanvas();
}

//Eyedropper
function pickerSteps() {
    switch (state.event) {
        case "mousedown":
            //get imageData
            consolidateLayers();
            state.colorLayerGlobal = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
            //set color
            sampleColor(state.mouseX, state.mouseY);
            break;
        case "mousemove":
            //normalize mousemove to pixelgrid, get color here too
            if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
                //get color
                sampleColor(state.mouseX, state.mouseY);
                //draw square
                drawCanvas();
                renderCursor();
                state.lastOnX = state.onX;
                state.lastOnY = state.onY;
            }
            break;
        default:
        //do nothing
    }
}

//picker helper function
function sampleColor(x, y) {
    let newColor = getColor(x, y, state.colorLayerGlobal);
    //not simply passing whole color in until random color function is refined
    setColor(newColor.r, newColor.g, newColor.b, "swatch btn");
}

function grabSteps() {
    switch (state.event) {
        case "mousemove":
            state.xOffset = state.onX - state.lastOnX + state.lastOffsetX;
            state.yOffset = state.onY - state.lastOnY + state.lastOffsetY;
            drawCanvas();
            break;
        case "mouseup":
            state.lastOffsetX = state.xOffset;
            state.lastOffsetY = state.yOffset;
            state.lastOnX = state.onX;
            state.lastOnY = state.onY;
            break;
        case "mouseout":
            state.lastOffsetX = state.xOffset;
            state.lastOffsetY = state.yOffset;
            break;
        default:
        //do nothing
    }
}

//====================================//
//========= * * * Core * * * =========//
//====================================//

//command pattern. (Look into saving app-state instead)
function addToTimeline(tool, x, y) {
    //use current state for variables
    //pencil, replace
    state.points.push({
        //x/y are sometimes objects with multiple values
        x: x,
        y: y,
        layer: state.currentLayer,
        size: state.tool.brushSize,
        color: { ...state.brushColor },
        tool: tool,
        action: state.tool.fn,
        mode: state.mode
    });
    //render action
    drawCanvas();
}

//Main pillar of the code structure
function actionUndoRedo(pushStack, popStack) {
    pushStack.push(popStack.pop());
    //clear all layers in preparation to redraw them.
    //DRY: do all layers and actions need to be rerendered for redo?
    layers.forEach(l => {
        if (l.type === "raster") {
            l.ctx.clearRect(0, 0, offScreenCVS.width, offScreenCVS.height);
        }
    });
    redrawPoints();
    drawCanvas();
}

function redrawPoints() {
    //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
    state.undoStack.forEach(action => {
        action.forEach(p => {
            switch (p.tool) {
                case "clear":
                    p.layer.ctx.clearRect(0, 0, offScreenCVS.width, offScreenCVS.height);
                    break;
                case "fill":
                    actionFill(p.x, p.y, p.color, p.layer.ctx, p.mode);
                    break;
                case "line":
                    actionLine(p.x.x1, p.y.y1, p.x.x2, p.y.y2, p.color, p.layer.ctx, p.mode)
                    break;
                case "curve":
                    actionCurve(p.x.x1, p.y.y1, p.x.x2, p.y.y2, p.x.x3, p.y.y3, 4, p.color, p.layer.ctx, p.mode)
                    break;
                default:
                    actionDraw(p.x, p.y, p.color, p.size, p.layer.ctx, p.mode);
            }
        })
    })
}

//FIX: Improve performance by keeping track of "redraw regions" instead of redrawing the whole thing.
function drawCanvas() {
    //clear canvas
    onScreenCTX.clearRect(0, 0, ocWidth / zoom, ocHeight / zoom);
    //Prevent blurring
    onScreenCTX.imageSmoothingEnabled = false;
    //fill background
    onScreenCTX.fillStyle = "gray";
    onScreenCTX.fillRect(0, 0, ocWidth / zoom, ocHeight / zoom);
    //BUG: How to mask outside drawing space?
    onScreenCTX.clearRect(state.xOffset, state.yOffset, ocWidth, ocHeight);
    drawLayers();
    //draw border
    onScreenCTX.beginPath();
    onScreenCTX.rect(state.xOffset - 1, state.yOffset - 1, ocWidth + 2, ocHeight + 2);
    onScreenCTX.lineWidth = 2;
    onScreenCTX.strokeStyle = "black";
    onScreenCTX.stroke();
}

//====================================//
//======== * * * Layers * * * ========//
//====================================//

function drawLayers() {
    layers.forEach(l => {
        if (l.type === "reference") {
            onScreenCTX.save();
            onScreenCTX.globalAlpha = l.opacity;
            //l.x, l.y need to be normalized to the pixel grid
            onScreenCTX.drawImage(l.img, state.xOffset + l.x * ocWidth / offScreenCVS.width, state.yOffset + l.y * ocWidth / offScreenCVS.width, l.img.width * l.scale, l.img.height * l.scale);
            onScreenCTX.restore();
        } else {
            onScreenCTX.save();
            onScreenCTX.globalAlpha = l.opacity;
            //l.x, l.y need to be normalized to the pixel grid
            onScreenCTX.drawImage(l.cvs, state.xOffset + l.x * ocWidth / offScreenCVS.width, state.yOffset + l.y * ocWidth / offScreenCVS.width, ocWidth, ocHeight);
            onScreenCTX.restore();
        }
    });
}

function consolidateLayers() {
    layers.forEach(l => {
        offScreenCTX.save();
        offScreenCTX.globalAlpha = l.opacity;
        offScreenCTX.drawImage(l.cvs, l.x, l.y, offScreenCVS.width, offScreenCVS.height);
        offScreenCTX.restore();
    });
}

function addRasterLayer() {
    let layerCVS = document.createElement('canvas');
    let layerCTX = layerCVS.getContext("2d");
    layerCVS.width = offScreenCVS.width;
    layerCVS.height = offScreenCVS.height;
    let layer = { type: "raster", title: `Layer ${layers.length + 1}`, cvs: layerCVS, ctx: layerCTX, x: 0, y: 0, scale: 1, opacity: 1 }
    layers.push(layer);
    renderLayersToDOM();
}

function addReferenceLayer() {
    let reader;
    let img = new Image;

    if (this.files && this.files[0]) {
        reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
            img.onload = () => {
                //constrain background image to canvas with scale
                let scale = ocWidth / img.width > ocHeight / img.height ? ocHeight / img.height : ocWidth / img.width;
                let layer = { type: "reference", title: `Layer ${layers.length + 1}`, img: img, x: 0, y: 0, scale: scale, opacity: 1 }
                layers.unshift(layer)
                renderLayersToDOM();
                drawCanvas();
            }
        }

        reader.readAsDataURL(this.files[0]);
    }
}

function renderLayersToDOM() {
    layersCont.innerHTML="";
    layers.forEach(l => {
        let layerElement = document.createElement("div");
        layerElement.className = `layer ${l.type}`;
        layerElement.textContent = l.title;
        let hide = document.createElement("div");
        hide.className = "hide btn";
        let eye = document.createElement("span");
        eye.className = "eyeopen icon"
        hide.appendChild(eye);
        //add tooltip for toggle visibility
        layerElement.appendChild(hide);
        layersCont.appendChild(layerElement);
    })
}

//Psuedocode:

//manipulate draggable layers with .splice
//layer = layers.splice(n,1) to remove and store layer in variable
//layers.splice(n,0,layer) to insert at new position

//render layers interface
//for each layer, render a template display to the dom with image, title, type
//dragging a layer up or down should reflect in the order of the layers array
//template should have an eye icon to toggle visibility and a slider for opacity

//add move tool and scale tool for reference layers

// QUESTION: How to deal with undo/redo when deleting a layer? 
//If a layer is removed, actions associated with that layer will be removed 
//and can't easily be added back in the correct order.

//vector layers have an option to create a raster copy layer

//vector layers need movable control points, how to organize order of added control points?

//====================================//
//======== * * * Colors * * * ========//
//====================================//

function openColorPicker(e) {
    picker.swatch = e.target.className;
    picker.update();
    //main page can't be interacted with
    fullPage.style.pointerEvents = "none";
    //disable shortcuts
    state.shortcuts = false;
    //show colorpicker
    colorPicker.style.display = "flex";
    //allow colorPicker events
    colorPicker.style.pointerEvents = "auto";
}

function switchColors(e) {
    let temp = { ...state.brushColor };
    state.brushColor = state.backColor;
    swatch.style.background = state.brushColor.color;
    state.backColor = temp;
    backSwatch.style.background = state.backColor.color;
}

function setColor(r, g, b, target) {
    if (target === "swatch btn") {
        state.brushColor.color = `rgba(${r},${g},${b},255)`;
        state.brushColor.r = r;
        state.brushColor.g = g;
        state.brushColor.b = b;
        swatch.style.background = state.brushColor.color;
    } else {
        state.backColor.color = `rgba(${r},${g},${b},255)`;
        state.backColor.r = r;
        state.backColor.g = g;
        state.backColor.b = b;
        backSwatch.style.background = state.backColor.color;
    }
}

function randomizeColor(e) {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    setColor(r, g, b, e.target.className);
}

function getColor(x, y, colorLayer) {
    let canvasColor = {};

    let startPos = (y * offScreenCVS.width + x) * 4;
    //clicked color
    canvasColor.r = colorLayer.data[startPos];
    canvasColor.g = colorLayer.data[startPos + 1];
    canvasColor.b = colorLayer.data[startPos + 2];
    canvasColor.a = colorLayer.data[startPos + 3];
    canvasColor.color = `rgba(${canvasColor.r},${canvasColor.g},${canvasColor.b},${canvasColor.a})`
    return canvasColor;
}