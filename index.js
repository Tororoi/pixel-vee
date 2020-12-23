//Set onscreen canvas and its context
let onScreenCVS = document.getElementById("onScreen");
let onScreenCTX = onScreenCVS.getContext("2d");
//improve sharpness
let ocWidth = onScreenCVS.width;
let ocHeight = onScreenCVS.height;
let sharpness = 4;
onScreenCVS.width = ocWidth * sharpness;
onScreenCVS.height = ocHeight * sharpness;
onScreenCTX.scale(sharpness, sharpness);

//Get the undo buttons
let undoBtn = document.getElementById("undo");
let redoBtn = document.getElementById("redo");

//Get swatch
let swatch = document.querySelector(".swatch");
let backSwatch = document.querySelector(".back-swatch");
let colorSwitch = document.querySelector(".switch");

//Get tool buttons
let toolsCont = document.querySelector(".tools");
let toolBtn = document.querySelector("#pencil");
toolBtn.style.background = "rgb(185, 28, 0)";

let modesCont = document.querySelector(".modes");
let modeBtn = document.querySelector("#draw");
modeBtn.style.background = "rgb(192, 45, 19)";

//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
let offScreenCVS = document.createElement('canvas');
let offScreenCTX = offScreenCVS.getContext("2d");
//Set the dimensions of the drawing canvas
offScreenCVS.width = 64;
offScreenCVS.height = 64;

//Create history stacks for the undo functionality
let undoStack = [];
let redoStack = [];

//state
let state = {
    //timeline
    points: [],
    undoStack: [],
    redoStack: [],
    //settings
    tool: {
        name: "pencil",
        fn: actionDraw,
        brushSize: 1,
        options: ["perfect"]
    },
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
    colorLayerGlobal: null
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

swatch.addEventListener('click', randomizeColor);
backSwatch.addEventListener('click', randomizeColor);
colorSwitch.addEventListener('click', switchColors);

toolsCont.addEventListener('click', handleTools);
modesCont.addEventListener('click', handleModes);

function handleMouseMove(e) {
    state.event = "mousemove";
    state.trueRatio = onScreenCVS.offsetWidth / offScreenCVS.width;
    state.mouseX = Math.floor(e.offsetX / state.trueRatio);
    state.mouseY = Math.floor(e.offsetY / state.trueRatio);
    //Hover brush
    state.ratio = ocWidth / offScreenCVS.width;
    state.onX = state.mouseX * state.ratio;
    state.onY = state.mouseY * state.ratio;
    if (state.clicked) {
        switch (state.tool.name) {
            case "picker":
                //only draw when necessary, get color here too
                if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
                    //get color
                    sampleColor(state.mouseX, state.mouseY);
                    //draw square
                    onScreenCTX.clearRect(0, 0, ocWidth, ocHeight);
                    drawCanvas();
                    onScreenCTX.beginPath();
                    onScreenCTX.rect(state.onX, state.onY, state.ratio, state.ratio);
                    onScreenCTX.lineWidth = 0.5;
                    onScreenCTX.strokeStyle = "black";
                    onScreenCTX.stroke();
                    onScreenCTX.beginPath();
                    onScreenCTX.rect(state.onX + 0.5, state.onY + 0.5, state.ratio - 1, state.ratio - 1);
                    onScreenCTX.lineWidth = 0.5;
                    onScreenCTX.strokeStyle = "white";
                    onScreenCTX.stroke();
                    state.lastOnX = state.onX;
                    state.lastOnY = state.onY;
                }
                break;
            case "fill":
                //does nothing
                fillSteps();
                break;
            case "line":
                lineSteps();
                break;
            case "replace":
                replaceSteps();
                break;
            default:
                drawSteps();
        }
    } else {
        //only draw when necessary
        if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
            onScreenCTX.clearRect(0, 0, ocWidth, ocHeight);
            drawCanvas();
            switch (state.tool.name) {
                case "picker":
                    //empty square
                    break;
                default:
                    //colored square
                    onScreenCTX.fillStyle = state.brushColor.color;
                    onScreenCTX.fillRect(state.onX, state.onY, state.ratio, state.ratio);
            }
            onScreenCTX.beginPath();
            onScreenCTX.rect(state.onX, state.onY, state.ratio, state.ratio);
            onScreenCTX.lineWidth = 0.5;
            onScreenCTX.strokeStyle = "black";
            onScreenCTX.stroke();
            onScreenCTX.beginPath();
            onScreenCTX.rect(state.onX + 0.5, state.onY + 0.5, state.ratio - 1, state.ratio - 1);
            onScreenCTX.lineWidth = 0.5;
            onScreenCTX.strokeStyle = "white";
            onScreenCTX.stroke();
            state.lastOnX = state.onX;
            state.lastOnY = state.onY;
        }
    }
}

function handleMouseDown(e) {
    state.event = "mousedown";
    state.clicked = true;
    state.trueRatio = onScreenCVS.offsetWidth / offScreenCVS.width;
    state.mouseX = Math.floor(e.offsetX / state.trueRatio);
    state.mouseY = Math.floor(e.offsetY / state.trueRatio);
    switch (state.tool.name) {
        case "picker":
            //set color
            sampleColor(state.mouseX, state.mouseY);
            break;
        case "fill":
            fillSteps();
            break;
        case "line":
            //Set origin point
            lineSteps();
            // state.lastX = state.mouseX;
            // state.lastY = state.mouseY;
            break;
        case "replace":
            replaceSteps();
            break;
        default:
            drawSteps();
    }
}

function handleMouseUp(e) {
    state.event = "mouseup";
    state.clicked = false;
    // randomizeColor();
    state.trueRatio = onScreenCVS.offsetWidth / offScreenCVS.width;
    state.mouseX = Math.floor(e.offsetX / state.trueRatio);
    state.mouseY = Math.floor(e.offsetY / state.trueRatio);
    //draw line if line tool
    switch (state.tool.name) {
        case "line":
            lineSteps();
            break;
        case "replace":
            replaceSteps();
            break;
        case "pencil":
            drawSteps();
            break;
    }
    //add to undo stack
    if (state.points.length) {
        state.undoStack.push(state.points);
    }
    state.points = [];
    //Reset redostack
    state.redoStack = [];
    state.event = "none";
}

function handleMouseOut(e) {
    state.event = "mouseout";
    state.clicked = false;
    //add to undo stack
    if (state.points.length) {
        state.undoStack.push(state.points);
    }
    state.points = [];
    //Reset redostack
    state.redoStack = [];
    onScreenCTX.clearRect(0, 0, ocWidth, ocHeight);
    drawCanvas();
    state.event = "none";
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
        //reset old button
        toolBtn.style.background = "rgb(131, 131, 131)";
        //get new button and select it
        toolBtn = e.target.closest(".tool");
        toolBtn.style.background = "rgb(185, 28, 0)";
        state.tool.name = toolBtn.id;
    }
}

function handleModes(e) {
    if (e.target.closest(".mode")) {
        //reset old button
        modeBtn.style.background = "rgb(37, 0, 139)";
        //get new button and select it
        modeBtn = e.target.closest(".mode");
        modeBtn.style.background = "rgb(192, 45, 19)";
        state.mode = modeBtn.id;
    }
}

function addToTimeline(tool) {
    //use current state for variables
    //pencil, replace
    state.points.push({
        //for line
        startX: state.lastX,
        startY: state.lastY,
        //for everything
        x: state.mouseX,
        y: state.mouseY,
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
            addToTimeline(state.tool.name);
            break;
        case "mousemove":
            //draw onscreen current pixel
            if (state.mode === "erase") {
                onScreenCTX.clearRect(state.onX, state.onY, state.ratio, state.ratio);
            } else {
                onScreenCTX.fillStyle = state.brushColor.color;
                onScreenCTX.fillRect(state.onX, state.onY, state.ratio, state.ratio);
            }
            if (state.lastX !== state.mouseX || state.lastY !== state.mouseY) {
                //draw between points when drawing fast
                if (state.mode === "noncont") { //temp
                    actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.mode);
                    addToTimeline(state.tool.name);
                } else { //temp
                    if (Math.abs(state.mouseX - state.lastX) > 1 || Math.abs(state.mouseY - state.lastY) > 1) {
                        //add to options, only execute if "continuous line" is on
                        actionLine(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, offScreenCTX, state.mode);
                        addToTimeline("line");
                    } else {
                        //perfect will be option, not mode
                        if (state.mode === "perfect") {
                            perfectPixels(state.mouseX, state.mouseY);
                        } else {
                            actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.mode);
                            addToTimeline(state.tool.name);
                        }
                    }
                } //temp
                // source = offScreenCVS.toDataURL();
                // renderImage();
            }
            // save last point
            state.lastX = state.mouseX;
            state.lastY = state.mouseY;
            break;
        case "mouseup":
            //only needed if perfect pixels option is on
            actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.mode);
            addToTimeline(state.tool.name);
            break;
        case "mouseout":
            //do nothing
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
                onScreenCTX.clearRect(0, 0, ocWidth, ocHeight);
                drawCanvas();
                //set offscreen endpoint
                // state.lastX = state.mouseX;
                // state.lastY = state.mouseY;
                actionLine(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, onScreenCTX, state.mode, state.ratio);
                state.lastOnX = state.onX;
                state.lastOnY = state.onY;
            }
            break;
        case "mouseup":
            actionLine(state.lastX, state.lastY, state.mouseX, state.mouseY, state.brushColor, offScreenCTX, state.mode);
            addToTimeline(state.tool.name);
            break;
        case "mouseout":
            //do nothing
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
function getColor(startX, startY, colorLayer) {
    let canvasColor = {};

    let startPos = (startY * offScreenCVS.width + startX) * 4;
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
            //sample color and replace if match to backColor
            state.clickedColor = getColor(state.mouseX, state.mouseY, state.colorLayerGlobal);
            if (state.clickedColor.color === state.backColor.color) {
                actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.mode);
                addToTimeline(state.tool.name);
            }
            //get rid of onscreen cursor
            source = offScreenCVS.toDataURL();
            renderImage();
            break;
        case "mousemove":
            //only execute when necessary
            //sample color
            //draw onscreen current pixel if match to backColor
            if (state.onX !== state.lastOnX || state.onY !== state.lastOnY) {
                state.clickedColor = getColor(state.mouseX, state.mouseY, state.colorLayerGlobal);
                if (state.clickedColor.color === state.backColor.color) {
                    actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.mode);
                    addToTimeline(state.tool.name);
                }
            }
            break;
        case "mouseup":
            //only needed if perfect pixels option is on
            //sample color and replace if match
            state.clickedColor = getColor(state.mouseX, state.mouseY, state.colorLayerGlobal);
            if (state.clickedColor.color === state.backColor.color) {
                actionDraw(state.mouseX, state.mouseY, state.brushColor, state.tool.brushSize, state.mode);
                addToTimeline(state.tool.name);
            }
            break;
        case "mouseout":
            //do nothing
            break;
        default:
        //do nothing
    }
}

function actionReplace(coordX, coordY, currentColor, replacedColor, colorLayer, size, currentMode) {

    //while clicked, get color at coords
    //if color matches replacedcolor, draw currentcolor
    //instead of draw, replace color data
    //treated like a mask?
}

//controller for fill
function fillSteps() {
    switch (state.event) {
        case "mousedown":
            actionFill(state.mouseX, state.mouseY, state.brushColor, state.mode);
            addToTimeline(state.tool.name);
            break;
        case "mousemove":
            //do nothing
            break;
        case "mouseup":
            //do nothing
            break;
        case "mouseout":
            //do nothing
            break;
        default:
        //do nothing
    }
}
//For undo ability, store starting coords, and pass them into actionFill
function actionFill(startX, startY, currentColor, currentMode) {
    //get imageData
    let colorLayer = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);

    let startPos = (startY * offScreenCVS.width + startX) * 4;

    //clicked color
    let startR = colorLayer.data[startPos];
    let startG = colorLayer.data[startPos + 1];
    let startB = colorLayer.data[startPos + 2];
    let startA = colorLayer.data[startPos + 3];

    if (currentMode === "erase") currentColor = { color: "rgba(0, 0, 0, 0)", r: 0, g: 0, b: 0, a: 0 };

    //exit if color is the same
    if (currentColor.r === startR && currentColor.g === startG && currentColor.b === startB && currentColor.a === startA) {
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

        // offScreenCTX.putImageData(colorLayer, 0, 0);
        // source = offScreenCVS.toDataURL();
        // renderImage();

        if (pixelStack.length) {
            floodFill();
            // window.setTimeout(floodFill, 100);
        }
    }

    //render floodFill result
    offScreenCTX.putImageData(colorLayer, 0, 0);

    //helpers
    function matchStartColor(pixelPos) {
        let r = colorLayer.data[pixelPos];
        let g = colorLayer.data[pixelPos + 1];
        let b = colorLayer.data[pixelPos + 2];
        let a = colorLayer.data[pixelPos + 3];
        return (r === startR && g === startG && b === startB && a === startA);
    }

    function colorPixel(pixelPos) {
        colorLayer.data[pixelPos] = currentColor.r;
        colorLayer.data[pixelPos + 1] = currentColor.g;
        colorLayer.data[pixelPos + 2] = currentColor.b;
        //not ideal
        colorLayer.data[pixelPos + 3] = currentColor.a;
    }
}

//Helper functions

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
    img.src = source;
    img.onload = () => {
        onScreenCTX.clearRect(0, 0, ocWidth, ocHeight);
        drawCanvas();
    }
}

function drawCanvas() {
    //Prevent blurring
    onScreenCTX.imageSmoothingEnabled = false;
    onScreenCTX.drawImage(img, 0, 0, ocWidth, ocHeight)
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

function randomizeColor(e) {
    let r = Math.floor(Math.random() * 256);
    let g = Math.floor(Math.random() * 256);
    let b = Math.floor(Math.random() * 256);
    setColor(r, g, b, e.target.className);
}

function switchColors(e) {
    let temp = state.brushColor;
    state.brushColor = state.backColor;
    swatch.style.background = state.brushColor.color;
    state.backColor = temp;
    backSwatch.style.background = state.backColor.color;
}

//picker function, tool but not an action
function sampleColor(x, y) {
    //get imageData
    let colorLayer = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);

    let colorPos = (y * offScreenCVS.width + x) * 4;

    //clicked color
    let r = colorLayer.data[colorPos];
    let g = colorLayer.data[colorPos + 1];
    let b = colorLayer.data[colorPos + 2];
    setColor(r, g, b, "swatch");
}