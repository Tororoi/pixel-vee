//Set onscreen canvas and its context
let onScreenCVS = document.getElementById("onScreen");
let onScreenCTX = onScreenCVS.getContext("2d");

//Get the undo buttons
let undoBtn = document.getElementById("undo");
let redoBtn = document.getElementById("redo");

//Get tool buttons
let toolsCont = document.querySelector(".tools");

//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
let offScreenCVS = document.createElement('canvas');
let offScreenCTX = offScreenCVS.getContext("2d");
//Set the dimensions of the drawing canvas
offScreenCVS.width = 32;
offScreenCVS.height = 32;

//Set initial size of canvas. If using a non-square, make sure to set the ratio the same as the offscreen canvas by multiplying either the height or width by the correct ratio.
let baseDimension;
let rect;
    setSize();
    onScreenCVS.width = baseDimension;
    onScreenCVS.height = baseDimension;

//Create history stacks for the undo functionality
let undoStack = [];
let redoStack = [];

//Other global variables
let lastX;
let lastY;
let points = [];

//We only want the mouse to move if the mouse is down, so we need a variable to disable drawing while the mouse is not clicked.
let clicked = false;
let lastOnX;
let lastOnY;

//Base settings
// let brushColor = "rgba(255, 0, 0, 255)";
let brushColor = {color: "rgba(255, 0, 0, 255)", r: 255, g: 0, b: 0, a: 255};
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

toolsCont.addEventListener("click", handleTools);

function handleMouseMove(e) {
    let trueRatio = onScreenCVS.offsetWidth/offScreenCVS.width;
    let mouseX = Math.floor(e.offsetX/trueRatio);
    let mouseY = Math.floor(e.offsetY/trueRatio);
    if (clicked) {
        switch(toolType) {
            case "fill":
                //do nothing
                break;
            default:
                actionDraw(mouseX,mouseY,brushColor);
                if (lastX !== mouseX || lastY !== mouseY) {
                    points.push({
                        x: mouseX,
                        y: mouseY,
                        // size: brushSize,
                        color: {...brushColor},
                        mode: toolType
                    });
                    source = offScreenCVS.toDataURL();
                    renderImage();
                }
                //save last point
                lastX = mouseX;
                lastY = mouseY;
        }
    } else {
        //Hover brush
        let ratio = onScreenCVS.width/offScreenCVS.width;
        let onX = mouseX*ratio;
        let onY = mouseY*ratio;
        if (onX !== lastOnX || onY !== lastOnY) {
            onScreenCTX.clearRect(0,0,onScreenCVS.width,onScreenCVS.height);
            drawCanvas();
            onScreenCTX.fillStyle = brushColor.color;
            onScreenCTX.fillRect(onX,onY,ratio,ratio);
            onScreenCTX.beginPath();
            onScreenCTX.rect(onX,onY,ratio,ratio);
            onScreenCTX.lineWidth = 1;
            onScreenCTX.strokeStyle = "black";
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
        case "fill":
            actionFill(mouseX,mouseY,brushColor);
            points.push({
                x: mouseX,
                y: mouseY,
                // size: brushSize,
                color: {...brushColor},
                mode: toolType
            });
            source = offScreenCVS.toDataURL();
            renderImage();
            break;
        default:
            actionDraw(mouseX,mouseY,brushColor);
            //only push new points
            if (lastX !== mouseX || lastY !== mouseY) {
                points.push({
                    x: mouseX,
                    y: mouseY,
                    // size: brushSize,
                    color: {...brushColor},
                    mode: toolType
                });
                source = offScreenCVS.toDataURL();
                renderImage();
            }
            //save last point
            lastX = mouseX;
            lastY = mouseY;
    }
}

function handleMouseUp(e) {
    clicked = false;
    randomizeColor();
    //add to undo stack
    undoStack.push(points);
    points = [];
    //Reset redostack
    redoStack = [];
}

function handleMouseOut() {
    clicked = false;
    randomizeColor();
    onScreenCTX.clearRect(0,0,onScreenCVS.width,onScreenCVS.height);
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
    let selection = e.target.closest(".tool").id;
    toolType = selection;
}

//Action functions
function actionDraw(coordX,coordY,currentColor) {
    offScreenCTX.fillStyle = currentColor.color;
    offScreenCTX.fillRect(coordX,coordY,1,1);
}

//For undo ability, store starting coords, and pass them into actionFill
function actionFill(startX,startY,currentColor) {
    //get imageData
    let colorLayer = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);

    let startPos = (startY*offScreenCVS.width + startX) * 4;

    //clicked color
    let startR = colorLayer.data[startPos];	
    let startG = colorLayer.data[startPos+1];	
    let startB = colorLayer.data[startPos+2];
    //exit if color is the same
    if (currentColor.r === startR && currentColor.g === startG && currentColor.b === startB) {
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
        
            if(x < offScreenCVS.width) {
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
        
        if (pixelStack.length) {
            floodFill();
        }
    }

    //render floodFill result
    offScreenCTX.putImageData(colorLayer, 0, 0);

    //helpers
    function matchStartColor(pixelPos) {
        let r = colorLayer.data[pixelPos];	
        let g = colorLayer.data[pixelPos+1];	
        let b = colorLayer.data[pixelPos+2];
        return (r === startR && g === startG && b === startB);
    }

    function colorPixel(pixelPos) {
        colorLayer.data[pixelPos] = currentColor.r;
        colorLayer.data[pixelPos+1] = currentColor.g;
        colorLayer.data[pixelPos+2] = currentColor.b;
        colorLayer.data[pixelPos+3] = 255;
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
            switch (p.mode) {
                case "fill":
                    actionFill(p.x,p.y,p.color);
                    break;
                default:
                    actionDraw(p.x,p.y,p.color);
            }

        })
    })
}

//Once the image is loaded, draw the image onto the onscreen canvas.
function renderImage() {
    img.src = source;
    img.onload = () => {
        onScreenCTX.clearRect(0,0,onScreenCVS.width,onScreenCVS.height);
        drawCanvas();
    }
}

function drawCanvas() {
    //Prevent blurring
    onScreenCTX.imageSmoothingEnabled = false;
    onScreenCTX.drawImage(img,0,0,onScreenCVS.width,onScreenCVS.height)
}

//Get the size of the parentNode which is subject to flexbox. Fit the square by making sure the dimensions are based on the smaller of the width and height.
function setSize() {
    rect = onScreenCVS.parentNode.getBoundingClientRect();
    rect.height > rect.width ? baseDimension = rect.width : baseDimension = rect.height;
}

function randomizeColor() {
    let r = Math.floor(Math.random()*256);
    let g = Math.floor(Math.random()*256);
    let b = Math.floor(Math.random()*256);
    brushColor.color = `rgba(${r},${g},${b},255)`;
    brushColor.r = r;
    brushColor.g = g;
    brushColor.b = b;
}