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
toolBtn.style.background = "rgb(192, 45, 19)";

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

//Other global variables
let lastX;
let lastY;
let lineX;
let lineY;
let points = [];

//We only want the mouse to move if the mouse is down, so we need a variable to disable drawing while the mouse is not clicked.
let clicked = false;
let lastOnX;
let lastOnY;

//Base settings
// let brushColor = "rgba(255, 0, 0, 255)";
let brushColor = {color: "rgba(255, 0, 0, 255)", r: 255, g: 0, b: 0, a: 255};
let backColor = {color: "rgba(255, 255, 255, 255)", r: 255, g: 255, b: 255, a: 255};
let modeType = "draw";
let toolType = "pencil";

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
    let trueRatio = onScreenCVS.offsetWidth/offScreenCVS.width;
    let mouseX = Math.floor(e.offsetX/trueRatio);
    let mouseY = Math.floor(e.offsetY/trueRatio);
    //Hover brush
    let ratio = ocWidth/offScreenCVS.width;
    let onX = mouseX*ratio;
    let onY = mouseY*ratio;
    if (clicked) {
        switch(toolType) {
            case "picker":
                //only draw when necessary, get color here too
                if (onX !== lastOnX || onY !== lastOnY) {
                    //get color
                    sampleColor(mouseX,mouseY);
                    //draw square
                    onScreenCTX.clearRect(0,0,ocWidth,ocHeight);
                    drawCanvas();
                    onScreenCTX.beginPath();
                    onScreenCTX.rect(onX,onY,ratio,ratio);
                    onScreenCTX.lineWidth = 0.5;
                    onScreenCTX.strokeStyle = "black";
                    onScreenCTX.stroke();
                    onScreenCTX.beginPath();
                    onScreenCTX.rect(onX+0.5,onY+0.5,ratio-1,ratio-1);
                    onScreenCTX.lineWidth = 0.5;
                    onScreenCTX.strokeStyle = "white";
                    onScreenCTX.stroke();
                    lastOnX = onX;
                    lastOnY = onY;
                }
                break;
            case "fill":
                //do nothing
                break;
            case "line":
                //reset end point
                //draw line from origin point to current point onscreen
                //only draw when necessary
                if (onX !== lastOnX || onY !== lastOnY) {
                    onScreenCTX.clearRect(0,0,ocWidth,ocHeight);
                    drawCanvas();
                    //set offscreen endpoint
                    lastX = mouseX;
                    lastY = mouseY;
                    actionLine(lineX,lineY,mouseX,mouseY,brushColor,onScreenCTX,modeType,ratio);
                    lastOnX = onX;
                    lastOnY = onY;
                }
                break;
            case "replace":
                //only execute when necessary
                //sample color
                //draw onscreen current pixel if match to backColor
                //replace if match to backColor
                break;
            default:
                //draw onscreen current pixel
                if (modeType === "erase") {
                    onScreenCTX.clearRect(onX,onY,ratio,ratio);
                } else {
                    onScreenCTX.fillStyle = brushColor.color;
                    onScreenCTX.fillRect(onX,onY,ratio,ratio);
                }
                if (lastX !== mouseX || lastY !== mouseY) {
                    //draw between points when drawing fast
                    if (Math.abs(mouseX-lastX) > 1 || Math.abs(mouseY-lastY) > 1) {
                        //add to options, only execute if "continuous line" is on
                        actionLine(lastX,lastY,mouseX,mouseY,brushColor,offScreenCTX,modeType);
                        points.push({
                            startX: lastX,
                            startY: lastY,
                            endX: mouseX,
                            endY: mouseY,
                            // size: brushSize,
                            color: {...brushColor},
                            tool: "line",
                            mode: modeType
                        });
                    } else {
                        //perfect will be option, not mode
                        if (modeType === "perfect") {
                            perfectPixels(mouseX,mouseY);
                        } else {
                            actionDraw(mouseX,mouseY,brushColor,modeType);
                            points.push({
                                x: mouseX,
                                y: mouseY,
                                // size: brushSize,
                                color: {...brushColor},
                                tool: toolType,
                                mode: modeType
                            });
                        }
                    }
                    source = offScreenCVS.toDataURL();
                    renderImage();
                }
                // save last point
                lastX = mouseX;
                lastY = mouseY;
        }
    } else {
        //only draw when necessary
        if (onX !== lastOnX || onY !== lastOnY) {
            onScreenCTX.clearRect(0,0,ocWidth,ocHeight);
            drawCanvas();
            switch (toolType) {
                case "picker":
                    //empty square
                    break;
                default:
                    //colored square
                    onScreenCTX.fillStyle = brushColor.color;
                    onScreenCTX.fillRect(onX,onY,ratio,ratio);
            }
            onScreenCTX.beginPath();
            onScreenCTX.rect(onX,onY,ratio,ratio);
            onScreenCTX.lineWidth = 0.5;
            onScreenCTX.strokeStyle = "black";
            onScreenCTX.stroke();
            onScreenCTX.beginPath();
            onScreenCTX.rect(onX+0.5,onY+0.5,ratio-1,ratio-1);
            onScreenCTX.lineWidth = 0.5;
            onScreenCTX.strokeStyle = "white";
            onScreenCTX.stroke();
            lastOnX = onX;
            lastOnY = onY;
        }
    }
}

function handleMouseDown(e) {
    clicked = true;
    let trueRatio = onScreenCVS.offsetWidth/offScreenCVS.width;
    let mouseX = Math.floor(e.offsetX/trueRatio);
    let mouseY = Math.floor(e.offsetY/trueRatio);
    switch(toolType) {
        case "picker":
            //set color
            sampleColor(mouseX,mouseY);
            break;
        case "fill":
            actionFill(mouseX,mouseY,brushColor,modeType);
            points.push({
                x: mouseX,
                y: mouseY,
                // size: brushSize,
                color: {...brushColor},
                tool: toolType,
                mode: modeType
            });
            source = offScreenCVS.toDataURL();
            renderImage();
            break;
        case "line":
            //Set origin point
            lineX = mouseX;
            lineY = mouseY;
            break;
        case "replace":
            //get global colorlayer data to use while mouse is down
            //sample color and replace if match to backColor
            break;
        default:
            actionDraw(mouseX,mouseY,brushColor,modeType);
            lastX = mouseX;
            lastY = mouseY;
            lastDrawnX = mouseX;
            lastDrawnY = mouseY;
            waitingPixelX = mouseX;
            waitingPixelY = mouseY;
            points.push({
                x: mouseX,
                y: mouseY,
                // size: brushSize,
                color: {...brushColor},
                tool: toolType,
                mode: modeType
            });
            source = offScreenCVS.toDataURL();
            renderImage();
    }
}

function handleMouseUp(e) {
    clicked = false;
    // randomizeColor();
    let trueRatio = onScreenCVS.offsetWidth/offScreenCVS.width;
    let mouseX = Math.floor(e.offsetX/trueRatio);
    let mouseY = Math.floor(e.offsetY/trueRatio);
    //draw line if line tool
    switch (toolType) {
        case "line":
            actionLine(lineX,lineY,mouseX,mouseY,brushColor,offScreenCTX,modeType);
            points.push({
                startX: lineX,
                startY: lineY,
                endX: mouseX,
                endY: mouseY,
                // size: brushSize,
                color: {...brushColor},
                tool: toolType,
                mode: modeType
            });
            source = offScreenCVS.toDataURL();
            renderImage();
            break;
        case "replace":
            //only needed if perfect pixels option is on
            //sample color and replace if match
            break;
        case "pencil":
            //only needed if perfect pixels option is on
            actionDraw(mouseX,mouseY,brushColor,modeType);
            points.push({
                x: mouseX,
                y: mouseY,
                // size: brushSize,
                color: {...brushColor},
                tool: toolType,
                mode: modeType
            });
            source = offScreenCVS.toDataURL();
            renderImage();
            break;
    }
    //add to undo stack
    if (points.length) {
        undoStack.push(points);
    }
    points = [];
    //Reset redostack
    redoStack = [];
}

function handleMouseOut() {
    clicked = false;
    //add to undo stack
    if (points.length) {
        undoStack.push(points);
    }
    points = [];
    //Reset redostack
    redoStack = [];
    onScreenCTX.clearRect(0,0,ocWidth,ocHeight);
    drawCanvas();
}

function handleUndo() {
    if (undoStack.length>0) {
        actionUndoRedo(redoStack, undoStack);
    }
}

function handleRedo() {
    if (redoStack.length>=1) {
        actionUndoRedo(undoStack, redoStack);
    }
}

function handleTools(e) {
    //reset old button
    toolBtn.style.background = "rgb(105, 76, 212)";
    //get new button and select it
    toolBtn = e.target.closest(".tool");
    toolBtn.style.background = "rgb(192, 45, 19)";
    toolType = toolBtn.id;
}

function handleModes(e) {
    //reset old button
    modeBtn.style.background = "rgb(37, 0, 139)";
    //get new button and select it
    modeBtn = e.target.closest(".mode");
    modeBtn.style.background = "rgb(192, 45, 19)";
    modeType = modeBtn.id;
}

let lastDrawnX,lastDrawnY;
let waitingPixelX, waitingPixelY;
function perfectPixels(currentX,currentY) {
    //if currentPixel not neighbor to lastDrawn, draw waitingpixel
    if (Math.abs(currentX-lastDrawnX) > 1 || Math.abs(currentY-lastDrawnY) > 1) {
        actionDraw(waitingPixelX,waitingPixelY,brushColor,modeType);
        //update queue
        lastDrawnX = waitingPixelX;
        lastDrawnY = waitingPixelY;
        waitingPixelX = currentX;
        waitingPixelY = currentY;
        //add to points stack
        points.push({
            x: lastDrawnX,
            y: lastDrawnY,
            // size: brushSize,
            color: {...brushColor},
            tool: toolType,
            mode: modeType
        });
        source = offScreenCVS.toDataURL();
        renderImage();
    } else {
        waitingPixelX = currentX;
        waitingPixelY = currentY;
    }
}

//Action functions
function actionDraw(coordX,coordY,currentColor,currentMode) {
    offScreenCTX.fillStyle = currentColor.color;
    switch (currentMode) {
        case "erase":
            offScreenCTX.clearRect(coordX,coordY,1,1);
            break;
        default:
            offScreenCTX.fillRect(coordX,coordY,1,1);
    }
}

function actionLine(sx,sy,tx,ty,currentColor,ctx,currentMode,scale = 1) {
    ctx.fillStyle = currentColor.color;
    let drawPixel = (x,y,w,h) => {return currentMode === "erase" ? ctx.clearRect(x,y,w,h) : ctx.fillRect(x,y,w,h)};
    //create triangle object
    let tri = {}
    function getTriangle(x1,y1,x2,y2,ang) {
        if(Math.abs(x1-x2) > Math.abs(y1-y2)) {
            tri.x = Math.sign(Math.cos(ang));
            tri.y = Math.tan(ang)*Math.sign(Math.cos(ang));
            tri.long = Math.abs(x1-x2);
        } else { 
            tri.x = Math.tan((Math.PI/2)-ang)*Math.sign(Math.cos((Math.PI/2)-ang));
            tri.y = Math.sign(Math.cos((Math.PI/2)-ang));
            tri.long = Math.abs(y1-y2);
        }
    }
    // finds the angle of (x,y) on a plane from the origin
    function getAngle(x,y) { return Math.atan(y/(x==0?0.01:x))+(x<0?Math.PI:0); }
    let angle = getAngle(tx-sx,ty-sy); // angle of line
    getTriangle(sx,sy,tx,ty, angle);

    for(let i=0;i<tri.long;i++) {
        let thispoint = {x: Math.round(sx + tri.x*i), y: Math.round(sy + tri.y*i)};
        // for each point along the line
        drawPixel(thispoint.x*scale, // round for perfect pixels
                    thispoint.y*scale, // thus no aliasing
                    scale,scale); // fill in one pixel, 1x1
        
    }
    //fill endpoint
    drawPixel(Math.round(tx)*scale, // round for perfect pixels
                    Math.round(ty)*scale, // thus no aliasing
                    scale,scale); // fill in one pixel, 1x1
}

//helper for replace and fill to get color on canvas **NOT IN USE**
function getColor(startX,startY,colorLayer) {
    let canvasColor = {};

    let startPos = (startY*offScreenCVS.width + startX) * 4;
    //clicked color
    canvasColor.r = colorLayer.data[startPos];	
    canvasColor.g = colorLayer.data[startPos+1];	
    canvasColor.b = colorLayer.data[startPos+2];
    canvasColor.a = colorLayer.data[startPos+3];
    canvasColor.color = `rgba(${canvasColor.r},${canvasColor.g},${canvasColor.b},${canvasColor.a})`
    return canvasColor;
}

//For undo ability, store starting coords, and pass them into actionFill
function actionFill(startX,startY,currentColor,currentMode) {
    //get imageData
    let colorLayer = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);

    let startPos = (startY*offScreenCVS.width + startX) * 4;

    //clicked color
    let startR = colorLayer.data[startPos];	
    let startG = colorLayer.data[startPos+1];	
    let startB = colorLayer.data[startPos+2];
    let startA = colorLayer.data[startPos+3];

    if (currentMode === "erase") currentColor = {color: "rgba(0, 0, 0, 0)", r: 0, g: 0, b: 0, a: 0};
    
    //exit if color is the same
    if (currentColor.r === startR && currentColor.g === startG && currentColor.b === startB && currentColor.a === startA) {
        return;
    }
    //Start with click coords
    let pixelStack = [[startX,startY]];
    let newPos, x, y, pixelPos, reachLeft, reachRight;
    floodFill();
    function floodFill() {
        newPos = pixelStack.pop();
        x = newPos[0];
        y = newPos[1];

        //get current pixel position
        pixelPos = (y*offScreenCVS.width + x) * 4;
        // Go up as long as the color matches and are inside the canvas
        while(y >= 0 && matchStartColor(pixelPos)) {
            y--;
            pixelPos -= offScreenCVS.width * 4;
        }
        //Don't overextend
        pixelPos += offScreenCVS.width * 4;
        y++;
        reachLeft = false;
        reachRight = false;
        // Go down as long as the color matches and in inside the canvas
        while(y < offScreenCVS.height && matchStartColor(pixelPos)) {
            
            colorPixel(pixelPos);

            if(x > 0) {
                if(matchStartColor(pixelPos - 4)) {
                    if(!reachLeft) {
                        //Add pixel to stack
                        pixelStack.push([x - 1, y]);
                        reachLeft = true;
                    }
                } else if(reachLeft) {
                    reachLeft = false;
                }
            }
        
            if(x < offScreenCVS.width-1) {
                if(matchStartColor(pixelPos + 4)) {
                    if(!reachRight) {
                        //Add pixel to stack
                        pixelStack.push([x + 1, y]);
                        reachRight = true;
                    }
                } else if(reachRight) {
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
        let g = colorLayer.data[pixelPos+1];	
        let b = colorLayer.data[pixelPos+2];
        let a = colorLayer.data[pixelPos+3];
        return (r === startR && g === startG && b === startB && a === startA);
    }

    function colorPixel(pixelPos) {
        colorLayer.data[pixelPos] = currentColor.r;
        colorLayer.data[pixelPos+1] = currentColor.g;
        colorLayer.data[pixelPos+2] = currentColor.b;
        //not ideal
        colorLayer.data[pixelPos+3] = currentColor.a;
    }
}

//Helper functions

function actionUndoRedo(pushStack,popStack) {
    pushStack.push(popStack.pop());
    offScreenCTX.clearRect(0,0,offScreenCVS.width,offScreenCVS.height);
    redrawPoints();
    source = offScreenCVS.toDataURL();
    renderImage();
}

function redrawPoints() {
    undoStack.forEach(action => {
        action.forEach(p => {
            switch (p.tool) {
                case "fill":
                    actionFill(p.x,p.y,p.color,p.mode);
                    break;
                case "line":
                    actionLine(p.startX,p.startY,p.endX,p.endY,p.color,offScreenCTX,p.mode)
                default:
                    actionDraw(p.x,p.y,p.color,p.mode);
            }

        })
    })
}

//Once the image is loaded, draw the image onto the onscreen canvas.
function renderImage() {
    img.src = source;
    img.onload = () => {
        onScreenCTX.clearRect(0,0,ocWidth,ocHeight);
        drawCanvas();
    }
}

function drawCanvas() {
    //Prevent blurring
    onScreenCTX.imageSmoothingEnabled = false;
    onScreenCTX.drawImage(img,0,0,ocWidth,ocHeight)
}

//Get the size of the parentNode which is subject to flexbox. Fit the square by making sure the dimensions are based on the smaller of the width and height.
// function setSize() {
//     rect = onScreenCVS.parentNode.getBoundingClientRect();
//     rect.height > rect.width ? baseDimension = rect.width : baseDimension = rect.height;
// }

function setColor(r,g,b,target) {
    if (target === "swatch") {
        brushColor.color = `rgba(${r},${g},${b},255)`;
        brushColor.r = r;
        brushColor.g = g;
        brushColor.b = b;
        swatch.style.background = brushColor.color;
    } else {
        backColor.color = `rgba(${r},${g},${b},255)`;
        backColor.r = r;
        backColor.g = g;
        backColor.b = b;
        backSwatch.style.background = backColor.color;
    }

}

function randomizeColor(e) {
    let r = Math.floor(Math.random()*256);
    let g = Math.floor(Math.random()*256);
    let b = Math.floor(Math.random()*256);
    setColor(r,g,b,e.target.className);
}

function switchColors(e) {
    let temp = brushColor;
    brushColor = backColor;
    swatch.style.background = brushColor.color;
    backColor = temp;
    backSwatch.style.background = backColor.color;
}

function sampleColor(x,y) {
        //get imageData
        let colorLayer = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);

        let colorPos = (y*offScreenCVS.width + x) * 4;
    
        //clicked color
        let r = colorLayer.data[colorPos];	
        let g = colorLayer.data[colorPos+1];	
        let b = colorLayer.data[colorPos+2];
        setColor(r,g,b,"swatch");
}