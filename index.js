//Set onscreen canvas and its context
let onScreenCVS = document.getElementById("onScreen");
let onScreenCTX = onScreenCVS.getContext("2d");
//improve sharpness
let ocWidth = onScreenCVS.width;
let ocHeight = onScreenCVS.height;
let sharpness = 4;
let zoom = 1;
onScreenCVS.width = ocWidth * sharpness;
onScreenCVS.height = ocHeight * sharpness;
onScreenCTX.scale(sharpness * zoom, sharpness * zoom);

//Get the undo buttons
let undoBtn = document.getElementById("undo");
let redoBtn = document.getElementById("redo");

//Get swatch
let swatch = document.querySelector(".swatch");
let backSwatch = document.querySelector(".back-swatch");
let colorSwitch = document.querySelector(".switch");

//zoom buttons
let zoomCont = document.querySelector(".zoom");

//Get tool buttons
let toolsCont = document.querySelector(".tools");
let toolBtn = document.querySelector("#pencil");
toolBtn.style.background = "rgb(238, 206, 102)";

let modesCont = document.querySelector(".modes");
let modeBtn = document.querySelector("#draw");
modeBtn.style.background = "rgb(238, 206, 102)";

//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
let offScreenCVS = document.createElement('canvas');
let offScreenCTX = offScreenCVS.getContext("2d");
//Set the dimensions of the drawing canvas
offScreenCVS.width = 64;
offScreenCVS.height = 64;

//tool objects
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
}

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

//Create an Image with a default source of the existing onscreen canvas
let img = new Image;
let source = offScreenCVS.toDataURL();

//Add event listeners for the mouse moving, downclick, and upclick
onScreenCVS.addEventListener('mousemove', handleMouseMove);
onScreenCVS.addEventListener('mousedown', handleMouseDown);
onScreenCVS.addEventListener('mouseup', handleMouseUp);
onScreenCVS.addEventListener('mouseout', handleMouseOut);

//Add event listeners for the toolbox
undoBtn.addEventListener('click', handleUndo);
redoBtn.addEventListener('click', handleRedo);

zoomCont.addEventListener('click', handleZoom);

swatch.addEventListener('click', randomizeColor);
backSwatch.addEventListener('click', randomizeColor);
colorSwitch.addEventListener('click', switchColors);

toolsCont.addEventListener('click', handleTools);
modesCont.addEventListener('click', handleModes);

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
    if (state.clicked) {
        //run selected tool step function
        state.tool.fn();
    } else {
        //only draw preview brush when necessary
        if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
            onScreenCTX.clearRect(0, 0, ocWidth / zoom, ocHeight / zoom);
            drawCanvas();
            renderCursor();
            state.lastOnX = state.onX;
            state.lastOnY = state.onY;
        }
    }
}

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
    img.onload = () => {
        renderCursor();
    }
}

function handleMouseOut(e) {
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
    state.event = "none";
}

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
        onScreenCTX.beginPath();
        onScreenCTX.rect(state.onX, state.onY, state.ratio / zoom, state.ratio / zoom);
        onScreenCTX.lineWidth = 0.5;
        onScreenCTX.strokeStyle = "black";
        onScreenCTX.stroke();
        onScreenCTX.beginPath();
        onScreenCTX.rect(state.onX + 0.5, state.onY + 0.5, state.ratio / zoom - 1, state.ratio / zoom - 1);
        onScreenCTX.lineWidth = 0.5;
        onScreenCTX.strokeStyle = "white";
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


function handleZoom(e) {
    if (e.target.closest(".square")) {
        let zoomBtn = e.target.closest(".square");
        let z;
        if (zoomBtn.id === "minus") {
            z = 0.8;
            zoom *= z;
            state.xOffset += ocWidth / 10 / zoom;
            state.yOffset += ocHeight / 10 / zoom;
        } else if (zoomBtn.id === "plus") {
            z = 1.25;
            state.xOffset -= ocWidth / 10 / zoom;
            state.yOffset -= ocHeight / 10 / zoom;
            zoom *= z;
        }
        //re scale canvas
        onScreenCTX.scale(z, z);
        state.xOffset = Math.floor(state.xOffset - (state.xOffset % (ocWidth / offScreenCVS.width)));
        state.yOffset = Math.floor(state.yOffset - (state.yOffset % (ocHeight / offScreenCVS.height)));
        state.lastOffsetX = state.xOffset;
        state.lastOffsetY = state.yOffset;
        renderImage();
    }
}

function handleTools(e) {
    if (e.target.closest(".tool")) {
        //failsafe for hacking tool ids
        if (tools[e.target.closest(".tool").id]) {
            //reset old button
            toolBtn.style.background = "rgb(131, 131, 131)";
            //get new button and select it
            toolBtn = e.target.closest(".tool");
            toolBtn.style.background = "rgb(238, 206, 102)";
            state.tool = tools[toolBtn.id];
            if (toolBtn.id === "grab") {
                onScreenCVS.style.cursor = "move";
            } else if (toolBtn.id === "replace" || toolBtn.id === "pencil") {
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
        //get new button and select it
        modeBtn = e.target.closest(".mode");
        modeBtn.style.background = "rgb(238, 206, 102)";
        state.mode = modeBtn.id;
    }
}

function addToTimeline(tool, x, y) {
    //use current state for variables
    //pencil, replace
    state.points.push({
        //for line
        startX: state.lastX,
        startY: state.lastY,
        //for everything
        x: x,
        y: y,
        size: state.tool.brushSize,
        color: { ...state.brushColor },
        tool: tool,
        action: state.tool.fn,
        mode: state.mode
    });
    source = offScreenCVS.toDataURL();
    renderImage();
}

//Action functions
//controller for draw
function drawSteps() {
    switch (state.event) {
        case "mousedown":
            actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.mode);
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
                renderImage();
                drawCurrentPixel();
                //draw between points when drawing fast
                if (Math.abs(state.mouseX - state.lastX) > 1 || Math.abs(state.mouseY - state.lastY) > 1) {
                    //add to options, only execute if "continuous line" is on
                    actionLine(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, offScreenCTX, state.mode);
                    addToTimeline("line", state.mouseX, state.mouseY);
                } else {
                    //perfect will be option, not mode
                    if (state.mode === "perfect") {
                        perfectPixels(state.mouseX, state.mouseY);
                    } else {
                        actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.mode);
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
            actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.mode);
            addToTimeline(state.tool.name, state.mouseX, state.mouseY);
            break;
        default:
        //do nothing
    }
}

function perfectPixels(currentX, currentY) {
    //if currentPixel not neighbor to lastDrawn, draw waitingpixel
    if (Math.abs(currentX - state.lastDrawnX) > 1 || Math.abs(currentY - state.lastDrawnY) > 1) {
        actionDraw(state.waitingPixelX, state.waitingPixelY, state.brushColor, state.tool.brushSize, state.mode);
        //update queue
        state.lastDrawnX = state.waitingPixelX;
        state.lastDrawnY = state.waitingPixelY;
        state.waitingPixelX = currentX;
        state.waitingPixelY = currentY;
        //add to points stack
        //can't be replaced by current timeline function due to wrong x,y values
        state.points.push({
            //for line
            startX: state.lastX,
            startY: state.lastY,
            //for everything
            x: state.lastDrawnX,
            y: state.lastDrawnY,
            size: state.tool.brushSize,
            color: { ...state.brushColor },
            tool: state.tool.name,
            action: state.tool.fn,
            mode: state.mode
        });
        source = offScreenCVS.toDataURL();
        renderImage();
    } else {
        state.waitingPixelX = currentX;
        state.waitingPixelY = currentY;
    }
}

function actionDraw(coordX, coordY, currentColor, size, currentMode) {
    offScreenCTX.fillStyle = currentColor.color;
    switch (currentMode) {
        case "erase":
            offScreenCTX.clearRect(Math.ceil(coordX - size / 2), Math.ceil(coordY - size / 2), size, size);
            break;
        default:
            offScreenCTX.fillRect(Math.ceil(coordX - size / 2), Math.ceil(coordY - size / 2), size, size);
    }
}

//controller function to run action appropriately
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
            actionLine(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, offScreenCTX, state.mode);
            addToTimeline(state.tool.name, state.mouseX, state.mouseY);
            //seriously, why do I need this? img.onload should've fired when I called renderImage from addToTimeline
            window.setTimeout(renderImage, 0);
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
    function getAngle(x, y) { return Math.atan(y / (x == 0 ? 0.01 : x)) + (x < 0 ? Math.PI : 0); }
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

//helper for replace and fill to get color on canvas
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

//controller for replace
function replaceSteps() {
    switch (state.event) {
        case "mousedown":
            //get global colorlayer data to use while mouse is down
            state.colorLayerGlobal = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
            actionReplace();
            state.lastX = state.mouseX;
            state.lastY = state.mouseY;
            // state.lastDrawnX = state.mouseX;
            // state.lastDrawnY = state.mouseY;
            // state.waitingPixelX = state.mouseX;
            // state.waitingPixelY = state.mouseY;
            //get rid of onscreen cursor
            source = offScreenCVS.toDataURL();
            renderImage();
            break;
        case "mousemove":
            //only execute when necessary
            //draw onscreen current pixel if match to backColor
            // can't add smoother lines until line replace method is added
            if (state.lastX !== state.mouseX || state.lastY !== state.mouseY) {
                actionReplace();
                if (Math.abs(state.mouseX - state.lastX) > 1 || Math.abs(state.mouseY - state.lastY) > 1) {
                    //add to options, only execute if "continuous line" is on
                    lineReplace(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, offScreenCTX, state.mode);
                } else {
                    //perfect will be option, not mode
                    // if (state.mode === "perfect") {
                    //     perfectPixels(state.mouseX, state.mouseY);
                    // } else {
                    actionReplace();
                    // }
                }
            }
            // save last point
            state.lastX = state.mouseX;
            state.lastY = state.mouseY;
            break;
        case "mouseup":
            //only needed if perfect pixels option is on
            actionReplace();
            //re-render image to allow onscreen cursor to render
            renderImage();
            break;
        default:
        //do nothing
    }
}

function lineReplace(sx, sy, tx, ty, currentColor, ctx, currentMode) {
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
        let clickedColor = getColor(thispoint.x, thispoint.y, state.colorLayerGlobal);
        if (clickedColor.color === state.backColor.color) {
            actionDraw(thispoint.x, thispoint.y, state.brushColor, state.tool.brushSize, currentMode);
            addToTimeline(state.tool.name, thispoint.x, thispoint.y);
        }
    }
    //fill endpoint
    let clickedColor = getColor(Math.round(tx), Math.round(ty), state.colorLayerGlobal);
    if (clickedColor.color === state.backColor.color) {
        actionDraw(Math.round(tx), Math.round(ty), state.brushColor, state.tool.brushSize, currentMode);
        addToTimeline(state.tool.name, Math.round(tx), Math.round(ty));
    }
}

function actionReplace() {
    //sample color and replace if match
    state.clickedColor = getColor(state.mouseX, state.mouseY, state.colorLayerGlobal);
    if (state.clickedColor.color === state.backColor.color) {
        actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.mode);
        addToTimeline(state.tool.name, state.mouseX, state.mouseY);
    }
}

//controller for fill
function fillSteps() {
    switch (state.event) {
        case "mousedown":
            actionFill(state.mouseX, state.mouseY, state.brushColor, state.mode);
            addToTimeline(state.tool.name, state.mouseX, state.mouseY);
            break;
        case "mouseup":
            //re-render image to allow onscreen cursor to render
            renderImage();
        default:
        //do nothing
    }
}

//For undo ability, store starting coords and settings and pass them into actionFill
function actionFill(startX, startY, currentColor, currentMode) { //BUG: fill works when clicking outside border of canvas
    //exit if outside borders
    if (startX < 0 || startX >= offScreenCVS.width || startY < 0 || startY >= offScreenCVS.height) {
        return;
    }
    //get imageData
    state.colorLayerGlobal = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);

    state.clickedColor = getColor(startX, startY, state.colorLayerGlobal);

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
    offScreenCTX.putImageData(state.colorLayerGlobal, 0, 0);

    //helpers
    function matchStartColor(pixelPos) {
        let r = state.colorLayerGlobal.data[pixelPos];
        let g = state.colorLayerGlobal.data[pixelPos + 1];
        let b = state.colorLayerGlobal.data[pixelPos + 2];
        let a = state.colorLayerGlobal.data[pixelPos + 3];
        return (r === state.clickedColor.r && g === state.clickedColor.g && b === state.clickedColor.b && a === state.clickedColor.a);
    }

    function colorPixel(pixelPos) {
        state.colorLayerGlobal.data[pixelPos] = currentColor.r;
        state.colorLayerGlobal.data[pixelPos + 1] = currentColor.g;
        state.colorLayerGlobal.data[pixelPos + 2] = currentColor.b;
        //not ideal
        state.colorLayerGlobal.data[pixelPos + 3] = currentColor.a;
    }
}

//temp
let clickCounter = 0;
let x1, y1, x2, y2, x3, y3;
let curvePoints = [];

function curveSteps() {
    switch (state.event) {
        case "mousedown":
            clickCounter += 1;
            if (clickCounter > 3) clickCounter = 1;
            switch (clickCounter) {
                case 1:
                    x1 = state.mouseX;
                    y1 = state.mouseY;
                    break;
                case 2:
                    x2 = state.mouseX;
                    y2 = state.mouseY;
                    break;
                case 3:
                    x3 = state.mouseX;
                    y3 = state.mouseY;
                    break;
                default:
                //do nothing
            }
            //definitive step occurs on offscreen canvas
            actionCurve();
            break;
        case "mousemove":
            //draw line from origin point to current point onscreen
            //only draw when necessary
            if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
                onScreenCTX.clearRect(0, 0, ocWidth / zoom, ocHeight / zoom);
                drawCanvas();
                //onscreen preview
                actionCurve();
                state.lastOnX = state.onX;
                state.lastOnY = state.onY;
            }
            break;
        case "mouseup" || "mouseout":
            if (clickCounter === 3) {
                addToTimeline(state.tool.name, curvePoints);
                //seriously, why do I need this? img.onload should've fired when I called renderImage from addToTimeline
                window.setTimeout(renderImage, 0);
            }
            break;
        default:
        //do nothing
    }
}

//Curved Lines
function actionCurve(x1, y1, x2, y2, x3, y3) {
    //point after defining x1y1

    //linetool after defining x2y2

    //curve after defining x3y3
    // bezier curve

    //f(x) = a0 + a1x + a2x^2 + a3x^3 polynomial
    // d1 = (y3 - y1) / (x3 - x1);
    // d2 = (y3 - y2) / (x3 - x2);

    // let denom = Math.pow((x1 - x2), 3);

    // let a0 = -1 * (
    //     (d2 * Math.pow(x1, 3) * x2) +
    //     (d1 * Math.pow(x1, 2) * Math.pow(x2, 2)) -
    //     (d2 * Math.pow(x1, 2) * Math.pow(x2, 2)) -
    //     (d1 * x1 * Math.pow(x2, 3)) -
    //     (3 * x1 * Math.pow(x2, 2) * y1) +
    //     (Math.pow(x2, 3) * y1) -
    //     (Math.pow(x1, 3) * y2) +
    //     (3 * Math.pow(x1, 2) * x2 * y2)
    // ) / denom;
    // let a1 = -1 * (
    //     (-1*d2 * Math.pow(x1, 3)) -
    //     (2*d1 * Math.pow(x1, 2) * x2) -
    //     (d2 * Math.pow(x1, 2) * x2) +
    //     (d1 * x1 * Math.pow(x2, 2)) +
    //     (2 * d2 * x1 * Math.pow(x2, 2)) +
    //     (d1 * Math.pow(x2, 3)) +
    //     (6 * x1 * x2 * y1) -
    //     (6 * x1 * x2 * y2)
    // ) / denom;
    // let a2 = -1 * (
    //     (d1 * Math.pow(x1, 2)) +
    //     (2*d2 * Math.pow(x1, 2)) +
    //     (d1 * x1 * x2) -
    //     (d2 * x1 * x2) -
    //     (2 * d1 * Math.pow(x2, 2)) -
    //     (d2 * Math.pow(x2, 2)) -
    //     (3 * x1 * y1) -
    //     (3 * x2 * y1) +
    //     (3*x1*y2) +
    //     (3*x2*y2)
    // ) / denom;
    // let a3 = -1 * (
    //     (-1 * d1 * x1) -
    //     (d2 * x1) +
    //     (d1 * x2) +
    //     (d2 * x2) +
    //     (2 * y1) -
    //     (2 * y2)
    // ) / denom;

    // function polynomial(x) {
    //     return a0 + a1*x + a2*Math.pow(x,2) + a3*Math.pow(x,3);
    // }
}

//Non-actions
//Color picker
function pickerSteps() {
    switch (state.event) {
        case "mousedown":
            //set color
            sampleColor(state.mouseX, state.mouseY);
            break;
        case "mousemove":
            //only draw when necessary, get color here too
            if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
                //get color
                sampleColor(state.mouseX, state.mouseY);
                //draw square
                onScreenCTX.clearRect(0, 0, ocWidth / zoom, ocHeight / zoom);
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

//picker function, tool but not an action
function sampleColor(x, y) {
    //get imageData
    state.colorLayerGlobal = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);

    let newColor = getColor(x, y, state.colorLayerGlobal);
    //not simply passing whole color in until random color function is refined
    setColor(newColor.r, newColor.g, newColor.b, "swatch");
}

function setColor(r, g, b, target) {
    if (target === "swatch") {
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

function grabSteps() {
    switch (state.event) {
        case "mousemove":
            //only draw when necessary, get color here too
            state.xOffset = state.onX - state.lastOnX + state.lastOffsetX;
            state.yOffset = state.onY - state.lastOnY + state.lastOffsetY;
            renderImage();
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

//Main pillar of the code structure
function actionUndoRedo(pushStack, popStack) {
    pushStack.push(popStack.pop());
    offScreenCTX.clearRect(0, 0, offScreenCVS.width, offScreenCVS.height);
    redrawPoints();
    source = offScreenCVS.toDataURL();
    renderImage();
}

function redrawPoints() {
    //follows stored instructions to reassemble drawing. Costly, but only called upon undo/redo
    state.undoStack.forEach(action => {
        action.forEach(p => {
            switch (p.tool) {
                case "fill":
                    actionFill(p.x, p.y, p.color, p.mode);
                    break;
                case "line":
                    actionLine(p.startX, p.startY, p.x, p.y, p.color, offScreenCTX, p.mode)
                    break;
                default:
                    actionDraw(p.x, p.y, p.color, p.size, p.mode);
            }
        })
    })
}

//Once the image is loaded, draw the image onto the onscreen canvas.
function renderImage() {
    img.onload = () => {
        onScreenCTX.clearRect(0, 0, ocWidth / zoom, ocHeight / zoom);
        drawCanvas();
    }
    img.src = source;
}

function drawCanvas() {
    //Prevent blurring
    onScreenCTX.imageSmoothingEnabled = false;
    onScreenCTX.fillStyle = "gray";
    onScreenCTX.fillRect(0, 0, ocWidth / zoom, ocHeight / zoom);
    onScreenCTX.clearRect(state.xOffset, state.yOffset, ocWidth, ocHeight);
    onScreenCTX.drawImage(img, state.xOffset, state.yOffset, ocWidth, ocHeight);
    onScreenCTX.beginPath();
    onScreenCTX.rect(state.xOffset - 1, state.yOffset - 1, ocWidth + 2, ocHeight + 2);
    onScreenCTX.lineWidth = 2;
    onScreenCTX.strokeStyle = "black";
    onScreenCTX.stroke();
}

function randomizeColor(e) {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    setColor(r, g, b, e.target.className);
}

function switchColors(e) {
    let temp = { ...state.brushColor };
    state.brushColor = state.backColor;
    swatch.style.background = state.brushColor.color;
    state.backColor = temp;
    backSwatch.style.background = state.backColor.color;
}