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
let toolBtn = document.querySelector("#brush");
toolBtn.style.background = "rgb(255, 255, 255)";

let modesCont = document.querySelector(".modes");
let modeBtn = document.querySelector("#draw");
modeBtn.style.background = "rgb(255, 255, 255)";

//Options
let lineWeight = document.querySelector("#line-weight");
let brushPreview = document.querySelector("#brush-preview");
let brushSlider = document.querySelector("#brush-size");

//Export
let exportBtn = document.querySelector(".export");

//Layers
//Reference upload
let uploadBtn = document.querySelector("#file-upload");
let newLayerBtn = document.querySelector(".new-raster-layer");

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
    brush: {
        name: "brush",
        fn: drawSteps,
        brushSize: 1,
        disabled: false,
        options: ["perfect"]
    },
    //FIX: allow replace to use different brush sizes
    replace: {
        name: "replace",
        fn: replaceSteps,
        brushSize: 1,
        disabled: false,
        options: ["perfect"]
    },
    // shading: {
    // user selects hsl shading color which mixes with colors that the user draws on to create dynamic shading
    // },
    line: {
        name: "line",
        fn: lineSteps,
        brushSize: 1,
        disabled: false,
        options: []
    },
    fill: {
        name: "fill",
        fn: fillSteps,
        brushSize: 1,
        disabled: true,
        options: ["contiguous"]
    },
    // gradient: {
    // Create a dithered gradient
    // },
    curve: {
        name: "curve",
        fn: curveSteps,
        brushSize: 1,
        disabled: false,
        options: []
    },
    // shapes: {
    // square, circle, and custom saved shape?
    // },
    picker: {
        name: "picker",
        fn: pickerSteps,
        brushSize: 1,
        disabled: true,
        options: []
    },
    grab: {
        name: "grab",
        fn: grabSteps,
        brushSize: 1,
        disabled: true,
        options: []
    }
    // move: {
    // Move a layer's coordinates independent of other layers
    // }
}

//State (not yet a true state)
const state = {
    //timeline
    points: [],
    undoStack: [],
    redoStack: [],
    //settings
    tool: tools.brush,
    mode: "draw",
    brushColor: { color: "rgba(0,0,0,255)", r: 0, g: 0, b: 0, a: 255 },
    backColor: { color: "rgba(255,255,255,255)", r: 255, g: 255, b: 255, a: 255 },
    palette: {},
    options: {
        perfect: false,
        erase: false,
        contiguous: false
    },
    //touchscreen?
    touch: false,
    //active variables for canvas
    shortcuts: true,
    currentLayer: null,
    clipMask: null,
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

//Layers (types: raster, vector, reference)
const layers = [];

//Initialize first layer
addRasterLayer();
state.currentLayer = layers[0];
renderLayersToDOM();

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

//Touch
onScreenCVS.addEventListener('touchstart', handleTouchStart);
onScreenCVS.addEventListener('touchmove', handleTouchMove);
onScreenCVS.addEventListener('touchend', handleTouchEnd);
onScreenCVS.addEventListener('touchcancel', handleTouchCancel);

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

brushSlider.addEventListener("input", updateBrush);

exportBtn.addEventListener('click', exportImage);

uploadBtn.addEventListener("change", addReferenceLayer);
newLayerBtn.addEventListener("click", addRasterLayer)

layersCont.addEventListener("click", layerInteract);

layersCont.addEventListener("dragstart", dragLayerStart);
layersCont.addEventListener("dragover", dragLayerOver);
layersCont.addEventListener("dragenter", dragLayerEnter);
layersCont.addEventListener("dragleave", dragLayerLeave);
layersCont.addEventListener("drop", dropLayer);
layersCont.addEventListener("dragend", dragLayerEnd);

//======================================//
//=== * * * Key Event Handlers * * * ===//
//======================================//

function handleKeyDown(e) {
    // console.log(e.key)
    if (state.shortcuts) {
        switch (e.code) {
            case 'KeyZ':
                if (e.metaKey) {
                    if (e.shiftKey) {
                        //shift+meta+z
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
                if (toolBtn.id === "brush") {
                    state.tool = tools["line"];
                    state.tool.brushSize = tools["brush"].brushSize;
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
                modeBtn.style.background = "rgb(255, 255, 255)";
                state.mode = "draw";
                break;
            case 'KeyE':
                //reset old button
                modeBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                modeBtn = document.querySelector("#erase");
                modeBtn.style.background = "rgb(255, 255, 255)";
                state.mode = "erase";
                break;
            case 'KeyP':
                //reset old button
                modeBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                modeBtn = document.querySelector("#perfect");
                modeBtn.style.background = "rgb(255, 255, 255)";
                state.mode = "perfect";
                break;
            case 'KeyB':
                //reset old button
                toolBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                toolBtn = document.querySelector("#brush");
                toolBtn.style.background = "rgb(255, 255, 255)";
                state.tool = tools["brush"];
                onScreenCVS.style.cursor = "crosshair";
                break;
            case 'KeyR':
                //reset old button
                toolBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                toolBtn = document.querySelector("#replace");
                toolBtn.style.background = "rgb(255, 255, 255)";
                state.tool = tools["replace"];
                onScreenCVS.style.cursor = "crosshair";
                break;
            case 'KeyL':
                //reset old button
                toolBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                toolBtn = document.querySelector("#line");
                toolBtn.style.background = "rgb(255, 255, 255)";
                state.tool = tools["line"];
                onScreenCVS.style.cursor = "none";
                break;
            case 'KeyF':
                //reset old button
                toolBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                toolBtn = document.querySelector("#fill");
                toolBtn.style.background = "rgb(255, 255, 255)";
                state.tool = tools["fill"];
                onScreenCVS.style.cursor = "none";
                break;
            case 'KeyC':
                //reset old button
                toolBtn.style.background = "rgb(131, 131, 131)";
                //set new button
                toolBtn = document.querySelector("#curve");
                toolBtn.style.background = "rgb(255, 255, 255)";
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
    } else if (toolBtn.id === "replace" || toolBtn.id === "brush" || toolBtn.id === "curve" || toolBtn.id === "fill" || toolBtn.id === "line") {
        onScreenCVS.style.cursor = "crosshair";
    } else {
        onScreenCVS.style.cursor = "none";
    }
}

//========================================//
//=== * * * Mouse Event Handlers * * * ===//
//========================================//

function handleMouseDown(e) {
    //reset media type, chrome dev tools niche use or computers that have touchscreen capabilities
    if (e.type === "mousedown") {
        state.touch = false;
    }
    state.event = "mousedown";
    state.clicked = true;
    state.trueRatio = onScreenCVS.offsetWidth / offScreenCVS.width * zoom;
    let x, y;
    if (e.targetTouches) {
        let rect = e.target.getBoundingClientRect();
        x = Math.round(e.targetTouches[0].pageX - rect.left);
        y = Math.round(e.targetTouches[0].pageY - rect.top);
    } else {
        x = e.offsetX;
        y = e.offsetY;
    }
    state.mox = Math.floor(x / state.trueRatio);
    state.moy = Math.floor(y / state.trueRatio);
    state.mouseX = Math.round(state.mox - (state.xOffset / state.ratio * zoom));
    state.mouseY = Math.round(state.moy - (state.yOffset / state.ratio * zoom));
    //Reset Cursor for mobile
    state.onX = state.mox * state.ratio / zoom;
    state.onY = state.moy * state.ratio / zoom;
    state.lastOnX = state.onX;
    state.lastOnY = state.onY;
    //if drawing on hidden layer, flash hide btn
    if (state.currentLayer.opacity === 0) {
        for (let i = 0; i < layersCont.children.length; i += 1) {
            if (layersCont.children[i].layerObj === state.currentLayer) {
                layersCont.children[i].querySelector(".hide").classList.add("warning");
            }
        }
    }
    //run selected tool step function
    state.tool.fn();
}

function handleMouseMove(e) {
    state.event = "mousemove";
    //currently only square dimensions work
    state.trueRatio = onScreenCVS.offsetWidth / offScreenCVS.width * zoom;
    state.ratio = ocWidth / offScreenCVS.width * zoom;
    //coords
    let x, y;
    if (e.targetTouches) {
        let rect = e.target.getBoundingClientRect();
        x = Math.round(e.targetTouches[0].pageX - rect.left);
        y = Math.round(e.targetTouches[0].pageY - rect.top);
    } else {
        x = e.offsetX;
        y = e.offsetY;
    }
    state.mox = Math.floor(x / state.trueRatio);
    state.moy = Math.floor(y / state.trueRatio);
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
    let x, y;
    if (e.targetTouches) {
        let rect = e.target.getBoundingClientRect();
        x = Math.round(e.changedTouches[0].pageX - rect.left);
        y = Math.round(e.changedTouches[0].pageY - rect.top);
    } else {
        x = e.offsetX;
        y = e.offsetY;
    }
    state.mox = Math.floor(x / state.trueRatio);
    state.moy = Math.floor(y / state.trueRatio);
    state.mouseX = Math.round(state.mox - (state.xOffset / state.ratio * zoom));
    state.mouseY = Math.round(state.moy - (state.yOffset / state.ratio * zoom));
    if (state.currentLayer.opacity === 0) {
        for (let i = 0; i < layersCont.children.length; i += 1) {
            if (layersCont.children[i].layerObj === state.currentLayer) {
                layersCont.children[i].querySelector(".hide").classList.remove("warning");
            }
        }
    }
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
    if (!e.targetTouches) {
        renderCursor();
    }
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
    }
    drawCanvas();
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
    //BUG: on mobile zoom causes cursor coords to desync with pixelgrid
    //TRY: restrict zoom to fixed multiples, 125%, 150% etc
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
    if (state.undoStack.length > 1) { //length 1 prevents initial layer from being undone
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
            // toolBtn.querySelector(".icon").style = "opacity: 0.6;"
            //get new button and select it
            toolBtn = e.target.closest(".tool");
            toolBtn.style.background = "rgb(255, 255, 255)";
            // toolBtn.querySelector(".icon").style = "opacity: 1;"
            state.tool = tools[toolBtn.id];
            //update options
            lineWeight.textContent = state.tool.brushSize;
            brushPreview.style.width = state.tool.brushSize * 2 + "px";
            brushPreview.style.height = state.tool.brushSize * 2 + "px";
            brushSlider.value = state.tool.brushSize;
            brushSlider.disabled = state.tool.disabled;
            //update cursor
            if (toolBtn.id === "grab") {
                onScreenCVS.style.cursor = "move";
            } else if (toolBtn.id === "replace" || toolBtn.id === "brush" || toolBtn.id === "curve" || toolBtn.id === "fill" || toolBtn.id === "line") {
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
        // modeBtn.querySelector(".icon").style = "opacity: 0.6;"
        //get new button and select it
        modeBtn = e.target.closest(".mode");
        // modeBtn.querySelector(".icon").style = "opacity: 1;"
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
        // drawCursorBox();
    }
}

function drawCurrentPixel() {
    //draw onscreen current pixel
    if (state.mode === "erase") {
        // drawCursorBox();
        let brushOffset = Math.floor(state.tool.brushSize / 2) * state.ratio / zoom;
        onScreenCTX.clearRect(state.onX - brushOffset, state.onY - brushOffset, state.ratio / zoom * state.tool.brushSize, state.ratio / zoom * state.tool.brushSize);
    } else {
        onScreenCTX.fillStyle = state.brushColor.color;
        let brushOffset = Math.floor(state.tool.brushSize / 2) * state.ratio / zoom;
        onScreenCTX.fillRect(state.onX - brushOffset, state.onY - brushOffset, state.ratio / zoom * state.tool.brushSize, state.ratio / zoom * state.tool.brushSize);
    }
}

function drawCursorBox() {
    let brushOffset = Math.floor(state.tool.brushSize / 2) * state.ratio / zoom;
    let x0 = state.onX - brushOffset;
    let y0 = state.onY - brushOffset;
    let x1 = x0 + state.ratio / zoom * state.tool.brushSize;
    let y1 = y0 + state.ratio / zoom * state.tool.brushSize;
    //line offset to stroke offcenter;
    let ol = 0.25;
    onScreenCTX.beginPath();
    onScreenCTX.lineWidth = 0.5;
    onScreenCTX.strokeStyle = "black";
    //top
    onScreenCTX.moveTo(x0, y0 - ol);
    onScreenCTX.lineTo(x1, y0 - ol);
    //right
    onScreenCTX.moveTo(x1 + ol, y0);
    onScreenCTX.lineTo(x1 + ol, y1);
    //bottom
    onScreenCTX.moveTo(x0, y1 + ol);
    onScreenCTX.lineTo(x1, y1 + ol);
    //left
    onScreenCTX.moveTo(x0 - ol, y0);
    onScreenCTX.lineTo(x0 - ol, y1);

    onScreenCTX.stroke();
}

function DrawCircle() {
    let brushPoints = [];
    let xO = 0, yO = 0;
    let r = Math.floor(state.tool.brushSize / 2);
    let d = 3 - state.tool.brushSize;
    let x = 0, y = r;
    eightfoldSym(xO, yO, x, y);
    while (x < y) {
        x++;
        if (d > 0) {
            y--;
            d = d + 4 * (x - y) + 10;
        } else {
            d = d + 3 * x + 6;
        }
        eightfoldSym(xO, yO, x, y);
    }
    function eightfoldSym(xc, yc, x, y) {
        if (state.tool.brushSize % 2 === 0) { xc-- };
        brushPoints.push({ x: xc + y, y: yc - x }); //oct 1
        brushPoints.push({ x: xc + x, y: yc - y }); //oct 2
        if (state.tool.brushSize % 2 === 0) { xc++ };
        brushPoints.push({ x: xc - x, y: yc - y }); //oct 3
        brushPoints.push({ x: xc - y, y: yc - x }); //oct 4
        if (state.tool.brushSize % 2 === 0) { yc-- };
        brushPoints.push({ x: xc - y, y: yc + x }); //oct 5
        brushPoints.push({ x: xc - x, y: yc + y }); //oct 6
        if (state.tool.brushSize % 2 === 0) { xc-- };
        brushPoints.push({ x: xc + x, y: yc + y }); //oct 7
        brushPoints.push({ x: xc + y, y: yc + x }); //oct 8
    }

    brushPoints.forEach(p => {
        actionDraw(p.x, p.y, state.brushColor, 1, state.currentLayer.ctx, state.mode)
    })

    // state.tool.brushPoints = brushPoints;
    // actionFill(xO, yO, state.brushColor, state.currentLayer.ctx, state.mode);
    // drawCanvas();
}

//====================================//
//===== * * * Action Tools * * * =====//
//====================================//

//"Steps" functions are controllers for the process
function drawSteps() {
    switch (state.event) {
        case "mousedown":
            //set colorlayer, then for each brushpoint, alter colorlayer and add each to timeline
            actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.currentLayer.ctx, state.mode);
            state.lastX = state.mouseX;
            state.lastY = state.mouseY;
            //for perfect pixels
            state.lastDrawnX = state.mouseX;
            state.lastDrawnY = state.mouseY;
            state.waitingPixelX = state.mouseX;
            state.waitingPixelY = state.mouseY;
            if (state.tool.name !== "replace") {
                addToTimeline(state.tool.name, state.mouseX, state.mouseY);
            }
            drawCanvas();
            break;
        case "mousemove":
            if (state.mode === "perfect") {
                drawCurrentPixel();
            }
            if (state.lastX !== state.mouseX || state.lastY !== state.mouseY) {
                //draw between points when drawing fast
                if (Math.abs(state.mouseX - state.lastX) > 1 || Math.abs(state.mouseY - state.lastY) > 1) {
                    actionLine(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, state.currentLayer.ctx, state.mode, state.tool.brushSize);
                    if (state.tool.name !== "replace") {
                        addToTimeline("line", { x1: state.lastX, x2: state.mouseX }, { y1: state.lastY, y2: state.mouseY });
                    }
                    drawCanvas();
                } else {
                    //FIX: perfect will be option, not mode
                    if (state.mode === "perfect") {
                        drawCanvas();
                        drawCurrentPixel();
                        perfectPixels(state.mouseX, state.mouseY);
                    } else {
                        actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.currentLayer.ctx, state.mode);
                        if (state.tool.name !== "replace") {
                            addToTimeline(state.tool.name, state.mouseX, state.mouseY);
                        }
                        drawCanvas();
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
            if (state.tool.name !== "replace") {
                addToTimeline(state.tool.name, state.mouseX, state.mouseY);
            }
            drawCanvas();
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
        if (state.tool.name !== "replace") {
            addToTimeline(state.tool.name, state.lastDrawnX, state.lastDrawnY);
        }
        drawCanvas();
    } else {
        state.waitingPixelX = currentX;
        state.waitingPixelY = currentY;
    }
}

function actionDraw(coordX, coordY, currentColor, weight, ctx, currentMode) {
    ctx.fillStyle = currentColor.color;
    switch (currentMode) {
        case "erase":
            ctx.clearRect(Math.ceil(coordX - weight / 2), Math.ceil(coordY - weight / 2), weight, weight);
            break;
        default:
            ctx.fillRect(Math.ceil(coordX - weight / 2), Math.ceil(coordY - weight / 2), weight, weight);
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
                actionLine(state.lastX + (state.xOffset / state.ratio * zoom), state.lastY + (state.yOffset / state.ratio * zoom), state.mox, state.moy, state.brushColor, onScreenCTX, state.mode, state.tool.brushSize, state.ratio / zoom);
                state.lastOnX = state.onX;
                state.lastOnY = state.onY;
            }
            break;
        case "mouseup":
            actionLine(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, state.currentLayer.ctx, state.mode, state.tool.brushSize);
            addToTimeline(state.tool.name, { x1: state.lastX, x2: state.mouseX }, { y1: state.lastY, y2: state.mouseY });
            drawCanvas();
            break;
        default:
        //do nothing
    }
}

function actionLine(sx, sy, tx, ty, currentColor, ctx, currentMode, weight, scale = 1) {
    ctx.fillStyle = currentColor.color;
    let drawPixel = (x, y, w, h) => {
        let brushOffset = Math.floor(weight / 2) * scale;
        if (currentMode === "erase") {
            ctx.clearRect(x - brushOffset, y - brushOffset, w * weight, h * weight);
        } else {
            ctx.fillRect(x - brushOffset, y - brushOffset, w * weight, h * weight);
        }
    };
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
            //create clip mask
            state.currentLayer.ctx.save();
            state.clipMask = createClipMask(state.localColorLayer);
            // state.currentLayer.ctx.strokeStyle = "red";
            // state.currentLayer.ctx.stroke(state.clipMask);
            state.currentLayer.ctx.clip(state.clipMask);
            drawSteps();
            break;
        case "mousemove":
            drawSteps();
            break;
        case "mouseup":
            drawSteps();
            state.currentLayer.ctx.restore();
            let upImage = new Image();
            upImage.src = state.currentLayer.cvs.toDataURL();
            addToTimeline(state.tool.name, upImage, null)
            break;
        case "mouseout":
            state.currentLayer.ctx.restore();
            let outImage = new Image();
            outImage.src = state.currentLayer.cvs.toDataURL();
            addToTimeline(state.tool.name, outImage, null)
            break;
        default:
        //do nothing
    }
}

function createClipMask(colorLayer) {
    let mask = new Path2D();

    // //create outline path, path disconnected so can't be filled
    // let pixels = [];
    // for (let y = 0; y < colorLayer.height; y++) {
    //     pixels.push([]);
    //     for (let x = 0; x < colorLayer.width; x++) {
    //         //sample color and add to path if match
    //         let clickedColor = getColor(x, y, colorLayer);
    //         if (clickedColor.color === state.backColor.color) {
    //             //add pixel to clip path
    //             pixels[y].push(1);
    //         } else {
    //             pixels[y].push(0);
    //         }
    //     }
    // }
    // for (let y = 0; y < colorLayer.height; y++) {
    //     for (let x = 0; x < colorLayer.width; x++) {
    //         //check 4 directions
    //         if (pixels[y][x] === 1) { continue; }
    //         //right
    //         if (pixels[y][x + 1] === 1) {
    //             mask.moveTo(x + 1, y, 1, 1);
    //             mask.lineTo(x + 1, y + 1, 1, 1);
    //         }
    //         //left
    //         if (pixels[y][x - 1] === 1) {
    //             mask.moveTo(x, y, 1, 1);
    //             mask.lineTo(x, y + 1, 1, 1);
    //         }
    //         //down
    //         if (pixels[y + 1]) {
    //             if (pixels[y + 1][x] === 1) {
    //                 mask.moveTo(x, y + 1, 1, 1);
    //                 mask.lineTo(x + 1, y + 1, 1, 1);
    //             }
    //         }
    //         //up
    //         if (pixels[y - 1]) {
    //             if (pixels[y - 1][x] === 1) {
    //                 mask.moveTo(x, y, 1, 1);
    //                 mask.lineTo(x + 1, y, 1, 1);
    //             }
    //         }
    //     }
    // }

    for (let y = 0; y < colorLayer.height; y++) {
        for (let x = 0; x < colorLayer.width; x++) {
            //sample color and add to path if match
            let clickedColor = getColor(x, y, colorLayer);
            if (clickedColor.color === state.backColor.color) {
                //add pixel to clip path
                let p = new Path2D();
                p.rect(x, y, 1, 1);
                mask.addPath(p)
            }
        }
    }
    return mask;
}

// //replace actions are odd as they add to timeline inside but are never called by redrawPoints.
// function lineReplace(sx, sy, tx, ty, currentColor, ctx, currentMode, colorLayer) {
//     ctx.fillStyle = currentColor.color;
//     //create triangle object
//     let tri = {}
//     function getTriangle(x1, y1, x2, y2, ang) {
//         if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
//             tri.x = Math.sign(Math.cos(ang));
//             tri.y = Math.tan(ang) * Math.sign(Math.cos(ang));
//             tri.long = Math.abs(x1 - x2);
//         } else {
//             tri.x = Math.tan((Math.PI / 2) - ang) * Math.sign(Math.cos((Math.PI / 2) - ang));
//             tri.y = Math.sign(Math.cos((Math.PI / 2) - ang));
//             tri.long = Math.abs(y1 - y2);
//         }
//     }
//     // finds the angle of (x,y) on a plane from the origin
//     function getAngle(x, y) { return Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0); }
//     let angle = getAngle(tx - sx, ty - sy); // angle of line
//     getTriangle(sx, sy, tx, ty, angle);

//     for (let i = 0; i < tri.long; i++) {
//         let thispoint = { x: Math.round(sx + tri.x * i), y: Math.round(sy + tri.y * i) };
//         // for each point along the line
//         actionReplace(colorLayer, thispoint.x, thispoint.y);
//     }
//     //fill endpoint
//     actionReplace(colorLayer, Math.round(tx), Math.round(ty));
// }

// function actionReplace(colorLayer, xO, yO) {
//     //brush mask
//     // FIX: somehow iterate over only new area of brush where not overlapping with last location. Still slow on Safari.
//     let xMin = Math.ceil(xO - state.tool.brushSize / 2);
//     let xMax = xMin + state.tool.brushSize;
//     let yMin = Math.ceil(yO - state.tool.brushSize / 2);
//     let yMax = yMin + state.tool.brushSize;

//     //constrain brush to canvas area to prevent rollover to other side of canvas
//     if (xMin < 0) { xMin = 0 };
//     if (yMin < 0) { yMin = 0 };
//     if (xMax > colorLayer.width) { xMax = colorLayer.width };
//     if (yMax > colorLayer.height) { yMax = colorLayer.height };

//     for (let y = yMin; y < yMax; y++) {
//         for (let x = xMin; x < xMax; x++) {
//             //sample color and replace if match
//             let clickedColor = getColor(x, y, colorLayer);
//             if (clickedColor.color === state.backColor.color) {
//                 //update colorlayer data
//                 let pixelPos = (y * offScreenCVS.width + x) * 4;
//                 if (state.mode === "erase") {
//                     colorLayer.data[pixelPos] = 0;
//                     colorLayer.data[pixelPos + 1] = 0;
//                     colorLayer.data[pixelPos + 2] = 0;
//                     colorLayer.data[pixelPos + 3] = 0;
//                 } else {
//                     colorLayer.data[pixelPos] = state.brushColor.r;
//                     colorLayer.data[pixelPos + 1] = state.brushColor.g;
//                     colorLayer.data[pixelPos + 2] = state.brushColor.b;
//                     colorLayer.data[pixelPos + 3] = state.brushColor.a;
//                 }
//                 // actionDraw(x, y, state.brushColor, 1, state.currentLayer.ctx, state.mode);
//                 addToTimeline(state.tool.name, x, y);
//             }
//         }
//     }
//     state.currentLayer.ctx.putImageData(state.localColorLayer, 0, 0, xMin, yMin, xMax, yMax); //fastest method, noticeable difference on Safari
//     // state.currentLayer.ctx.putImageData(state.localColorLayer, 0, 0)
//     drawCanvas();
// }

function fillSteps() {
    switch (state.event) {
        case "mousedown":
            actionFill(state.mouseX, state.mouseY, state.brushColor, state.currentLayer.ctx, state.mode);
            //For undo ability, store starting coords and settings and pass them into actionFill
            addToTimeline(state.tool.name, state.mouseX, state.mouseY);
            drawCanvas();
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
    //FIX: new routine, should be 1. mousedown, 2. drag to p2, 
    //3. mouseup solidify p2, 4. mousedown/move to drag p3, 5. mouseup to solidify p3
    //this routine would be better for touchscreens, and no worse with mouse
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
                    if (!state.touch) {
                        state.px2 = state.mouseX;
                        state.py2 = state.mouseY;
                    }
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
                    state.tool.brushSize,
                    state.ratio / zoom
                );
                state.lastOnX = state.onX;
                state.lastOnY = state.onY;
            }
            break;
        case "mouseup":
            //For touchscreens
            if (state.touch) {
                if (state.clickCounter === 1) {
                    state.px2 = state.mouseX;
                    state.py2 = state.mouseY;
                }
                if (state.clickCounter === 2) {
                    state.clickCounter += 1;
                }
            }
            //Solidify curve
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
                    state.mode,
                    state.tool.brushSize
                );
                state.clickCounter = 0;
                //store control points for timeline
                addToTimeline(state.tool.name, { x1: state.px1, x2: state.px2, x3: state.px3 }, { y1: state.py1, y2: state.py2, y3: state.py3 });
                drawCanvas();
            }
            break;
        case "mouseout":
            //cancel curve
            state.clickCounter = 0;
            break;
        default:
        //do nothing
    }
}

function actionCurve(startx, starty, endx, endy, controlx, controly, stepNum, currentColor, ctx, currentMode, weight, scale = 1) {

    //force coords to int
    startx = Math.round(startx);
    starty = Math.round(starty);
    endx = Math.round(endx);
    endy = Math.round(endy);
    controlx = Math.round(controlx);
    controly = Math.round(controly);

    ctx.fillStyle = currentColor.color;

    //BUG: On touchscreen, hits gradient sign error if first tool used
    function renderCurve(controlX, controlY) {
        function plot(x, y) {
            //rounded values
            let xt = Math.floor(x);
            let yt = Math.floor(y);
            let brushOffset = Math.floor(weight / 2) * scale;
            if (currentMode === "erase") {
                ctx.clearRect(xt * scale - brushOffset, yt * scale - brushOffset, scale * weight, scale * weight);
            } else {
                ctx.fillRect(xt * scale - brushOffset, yt * scale - brushOffset, scale * weight, scale * weight);
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
                actionLine(x0, y0, x2, y2, currentColor, ctx, currentMode, weight);
            }
        }
    }

    if (stepNum === 1) {
        //after defining x0y0
        actionLine(startx, starty, state.mox, state.moy, currentColor, onScreenCTX, currentMode, weight, scale);
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
    //FIX: restructure stacked items. Currently each is an array, but each should be an object with more info plus an array
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
function addToTimeline(tool, x, y, layer = state.currentLayer) {
    //use current state for variables
    state.points.push({
        //x/y are sometimes objects with multiple values
        x: x,
        y: y,
        layer: layer,
        weight: state.tool.brushSize,
        color: { ...state.brushColor },
        tool: tool,
        action: state.tool.fn,
        mode: state.mode
    });
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
                case "addlayer":
                    p.layer.removed = false;
                    renderLayersToDOM();
                    break;
                case "clear":
                    p.layer.ctx.clearRect(0, 0, offScreenCVS.width, offScreenCVS.height);
                    break;
                case "fill":
                    actionFill(p.x, p.y, p.color, p.layer.ctx, p.mode);
                    break;
                case "line":
                    actionLine(p.x.x1, p.y.y1, p.x.x2, p.y.y2, p.color, p.layer.ctx, p.mode, p.weight);
                    break;
                case "curve":
                    actionCurve(p.x.x1, p.y.y1, p.x.x2, p.y.y2, p.x.x3, p.y.y3, 4, p.color, p.layer.ctx, p.mode, p.weight);
                    break;
                case "replace":
                    p.layer.ctx.drawImage(p.x, 0, 0, offScreenCVS.width, offScreenCVS.height);
                    break;
                default:
                    actionDraw(p.x, p.y, p.color, p.weight, p.layer.ctx, p.mode);
            }
        })
    })
    state.redoStack.forEach(action => {
        action.forEach(p => {
            if (p.tool === "addlayer") {
                p.layer.removed = true;
                if (p.layer === state.currentLayer) {
                    state.currentLayer = layersCont.children[0].layerObj;
                }
                renderLayersToDOM();
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

//=====================================//
//======== * * * Options * * * ========//
//=====================================//

function updateBrush(e) {
    switch (state.tool.name) {
        case "brush":
            state.tool.brushSize = parseInt(e.target.value);
            break;
        case "replace":
            state.tool.brushSize = parseInt(e.target.value);
            break;
        case "line":
            state.tool.brushSize = parseInt(e.target.value);
            break;
        case "curve":
            state.tool.brushSize = parseInt(e.target.value);
            break;
        default:
        //do nothing for other tools
    }
    lineWeight.textContent = state.tool.brushSize;
    brushPreview.style.width = state.tool.brushSize * 2 + "px";
    brushPreview.style.height = state.tool.brushSize * 2 + "px";
    // let roundBrush = brushPreview.querySelector(".round-brush");
    // if (roundBrush) {
    //     //draw circle
    // }
}

//====================================//
//======== * * * Export * * * ========//
//====================================//

function exportImage() {
    consolidateLayers();
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = offScreenCVS.toDataURL();
    a.download = "pixelvee.png";
    document.body.appendChild(a);
    a.click();
}

//====================================//
//======== * * * Layers * * * ========//
//====================================//

function drawLayers() {
    layers.forEach(l => {
        if (!l.removed) {
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
        }
    });
}

function consolidateLayers() {
    layers.forEach(l => {
        if (l.type === "raster") {
            offScreenCTX.save();
            offScreenCTX.globalAlpha = l.opacity;
            offScreenCTX.drawImage(l.cvs, l.x, l.y, offScreenCVS.width, offScreenCVS.height);
            offScreenCTX.restore();
        }
    });
}

function layerInteract(e) {
    let layer = e.target.closest(".layer").layerObj;
    //toggle visibility
    if (e.target.className.includes("hide")) {
        if (e.target.childNodes[0].className.includes("eyeopen")) {
            e.target.childNodes[0].className = "eyeclosed icon";
            layer.opacity = 0;
        } else if (e.target.childNodes[0].className.includes("eyeclosed")) {
            e.target.childNodes[0].className = "eyeopen icon";
            layer.opacity = 1;
        }
    } else {
        //select current layer
        if (layer.type === "raster") {
            state.currentLayer = layer;
            renderLayersToDOM();
        }
    }
    drawCanvas();
};

function dragLayerStart(e) {
    let layer = e.target.closest(".layer").layerObj;
    let index = layers.indexOf(layer);
    //pass index through event
    e.dataTransfer.setData("text", index);
    e.target.style.boxShadow = "inset 2px 0px rgb(131, 131, 131), inset -2px 0px rgb(131, 131, 131), inset 0px -2px rgb(131, 131, 131), inset 0px 2px rgb(131, 131, 131)";
}

function dragLayerOver(e) {
    e.preventDefault();
}

function dragLayerEnter(e) {
    if (e.target.className.includes("layer")) {
        e.target.style.boxShadow = "inset 2px 0px rgb(255, 255, 255), inset -2px 0px rgb(255, 255, 255), inset 0px -2px rgb(255, 255, 255), inset 0px 2px rgb(255, 255, 255)";
    }
}

function dragLayerLeave(e) {
    if (e.target.className.includes("layer")) {
        e.target.style.boxShadow = "inset 2px 0px rgb(131, 131, 131), inset -2px 0px rgb(131, 131, 131), inset 0px -2px rgb(131, 131, 131), inset 0px 2px rgb(131, 131, 131)";
    }
}

function dropLayer(e) {
    let targetLayer = e.target.closest(".layer").layerObj;
    let draggedIndex = parseInt(e.dataTransfer.getData("text"));
    let heldLayer = layers[draggedIndex];
    //TODO: add layer change to timeline
    if (e.target.className.includes("layer") && targetLayer !== heldLayer) {
        for (let i = 0; i < layersCont.children.length; i += 1) {
            if (layersCont.children[i] === e.target) {
                let newIndex = layers.indexOf(layersCont.children[i].layerObj)
                layers.splice(draggedIndex, 1);
                layers.splice(newIndex, 0, heldLayer);
            }
        }
        renderLayersToDOM();
        drawCanvas();
    }
}

function dragLayerEnd(e) {
    renderLayersToDOM();
}

function addRasterLayer() {
    //TODO: add to timeline.
    //once layer is added and drawn on, can no longer be deleted
    let layerCVS = document.createElement('canvas');
    let layerCTX = layerCVS.getContext("2d");
    layerCVS.width = offScreenCVS.width;
    layerCVS.height = offScreenCVS.height;
    let layer = { type: "raster", title: `Layer ${layers.length + 1}`, cvs: layerCVS, ctx: layerCTX, x: 0, y: 0, scale: 1, opacity: 1, removed: false }
    layers.push(layer);
    addToTimeline("addlayer", 0, 0, layer);
    state.undoStack.push(state.points);
    state.points = [];
    state.redoStack = [];
    renderLayersToDOM();
}

function addReferenceLayer() {
    //TODO: add to timeline
    let reader;
    let img = new Image;

    if (this.files && this.files[0]) {
        reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
            img.onload = () => {
                //constrain background image to canvas with scale
                let scale = ocWidth / img.width > ocHeight / img.height ? ocHeight / img.height : ocWidth / img.width;
                let layer = { type: "reference", title: `Reference ${layers.length + 1}`, img: img, x: 0, y: 0, scale: scale, opacity: 1, removed: false }
                layers.unshift(layer)
                renderLayersToDOM();
                drawCanvas();
            }
        }

        reader.readAsDataURL(this.files[0]);
    }
}

function removeLayer(e) {
    //set "removed" flag to true on selected layer
    //add to timeline
    let layer = e.target.closest(".layer").layerObj;
    layer.removed = true;
}

function renderLayersToDOM() {
    layersCont.innerHTML = "";
    let id = 0;
    layers.forEach(l => {
        if (!l.removed) {
            let layerElement = document.createElement("div");
            layerElement.className = `layer ${l.type}`;
            layerElement.id = id;
            id += 1;
            layerElement.textContent = l.title;
            layerElement.draggable = true;
            if (l === state.currentLayer) {
                layerElement.style.background = "rgb(255, 255, 255)";
                layerElement.style.color = "rgb(0, 0, 0)";
            }
            let hide = document.createElement("div");
            hide.className = "hide btn";
            let eye = document.createElement("span");
            if (l.opacity === 0) {
                eye.className = "eyeclosed icon";
            } else {
                eye.className = "eyeopen icon";
            };
            hide.appendChild(eye);
            layerElement.appendChild(hide);
            layersCont.appendChild(layerElement);
            //associate object
            layerElement.layerObj = l;
        }
    })
}

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

//====================================//
//===== * * * Touchscreens * * * =====//
//====================================//

//Fit canvas and tools so no scrolling necessary

//Maximize drawing space:
//Tools and other dialog boxes should be collapsed and 
//accessible upon touching, which reveals list of options/tools
//hub icon, can store all dialog boxes, can drag out and in dialog boxes which user wants for a customized toolset

//zooming with pinch actions, prevent default device zoom

function handleTouchStart(e) {
    e.preventDefault();
    state.touch = true;
    handleMouseDown(e);
}

function handleTouchMove(e) {
    e.preventDefault();
    handleMouseMove(e);
}

function handleTouchEnd(e) {
    e.preventDefault();
    handleMouseUp(e);
}

function handleTouchCancel(e) {
    e.preventDefault();
    handleMouseOut(e);
}