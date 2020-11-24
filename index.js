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
let brushColor = "red";
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
    if (clicked) {
        switch(toolType) {
            case "fill":
                //do nothing
                break;
            default:
                actionDraw(e);
        }
    } else {
        //Hover brush
        let ratio = onScreenCVS.width/offScreenCVS.width;
        let trueRatio = onScreenCVS.offsetWidth/offScreenCVS.width;
        let mouseX = Math.floor(e.offsetX/trueRatio);
        let mouseY = Math.floor(e.offsetY/trueRatio);
        let trueX = mouseX*ratio;
        let trueY = mouseY*ratio;
        if (trueX !== lastOnX || trueY !== lastOnY) {
            onScreenCTX.clearRect(0,0,onScreenCVS.width,onScreenCVS.height);
            drawCanvas();
            onScreenCTX.fillStyle = brushColor;
            onScreenCTX.fillRect(trueX,trueY,ratio,ratio);
            onScreenCTX.beginPath();
            onScreenCTX.rect(trueX,trueY,ratio,ratio);
            onScreenCTX.lineWidth = 1;
            onScreenCTX.strokeStyle = "black";
            onScreenCTX.stroke();
            lastOnX = trueX;
            lastOnY = trueY;
        }
    }
}

function handleMouseDown(e) {
    clicked = true;
    switch(toolType) {
        case "fill":
            actionFill(e);
            break;
        default:
            actionDraw(e);
    }
}

function handleMouseUp(e) {
    clicked = false;
    //add to undo stack
    undoStack.push(points);
    points = [];
    //Reset redostack
    redoStack = [];
}

function handleMouseOut() {
    clicked = false;
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
function actionDraw(e) {
    // let ratio = baseDimension/offScreenCVS.width;
    // let mouseX = Math.floor(e.offsetX/ratio);
    // let mouseY = Math.floor(e.offsetY/ratio);
    let trueRatio = onScreenCVS.offsetWidth/offScreenCVS.width;
    let mouseX = Math.floor(e.offsetX/trueRatio);
    let mouseY = Math.floor(e.offsetY/trueRatio);
    // extend the polyline
    offScreenCTX.fillStyle = brushColor;
    offScreenCTX.fillRect(mouseX,mouseY,1,1);

    if (lastX !== mouseX || lastY !== mouseY) {
        points.push({
            x: mouseX,
            y: mouseY,
            // size: brushSize,
            color: brushColor,
            mode: toolType
        });
        source = offScreenCVS.toDataURL();
        renderImage();
    }

    //save last point
    lastX = mouseX;
    lastY = mouseY;
}

//Fill vars
let currR = 0;
let currG = 255;
let currB = 0;

function actionFill(e) {
    //get imageData
    let colorLayer = offScreenCTX.getImageData(0, 0, offScreenCVS.width, offScreenCVS.height);
    //get clicked color

    let trueRatio = onScreenCVS.offsetWidth/offScreenCVS.width;
    let mouseX = Math.floor(e.offsetX/trueRatio);
    let mouseY = Math.floor(e.offsetY/trueRatio);

    let startPos = (mouseY*offScreenCVS.width + mouseX) * 4;

    //clicked color
    let startR = colorLayer.data[startPos];	
    let startG = colorLayer.data[startPos+1];	
    let startB = colorLayer.data[startPos+2];
    if (currR === startR && currG === startG && currB === startB) {
        return;
    }
    //Start with click coords
    let pixelStack = [[mouseX,mouseY]];
    while (pixelStack.length) {
        let newPos, x, y, pixelPos, reachLeft, reachRight;
        newPos = pixelStack.pop();
        x = newPos[0];
        y = newPos[1];

        pixelPos = (y*offScreenCVS.width + x) * 4;
        //Travel up until finding a boundary
        while(y > 0 && matchStartColor(pixelPos)) {
            y--;
            pixelPos -= offScreenCVS.width * 4;
        }
        //Don't overextend
        pixelPos += offScreenCVS.width * 4;
        ++y;
        reachLeft = false;
        reachRight = false;
        //color in
        while(y < offScreenCVS.height && matchStartColor(pixelPos)) {
            y++;
            colorPixel(pixelPos);

            if(x > 0) {
                if(matchStartColor(pixelPos - 4)) {
                    if(!reachLeft) {
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
                        pixelStack.push([x + 1, y]);
                        reachRight = true;
                    }
                } else if(reachRight) {
                    reachRight = false;
                }
            }
                    
            pixelPos += offScreenCVS.width * 4;
        }
    }
    offScreenCTX.putImageData(colorLayer, 0, 0);
    source = offScreenCVS.toDataURL();
    renderImage();

    function matchStartColor(pixelPos)
    {
    let r = colorLayer.data[pixelPos];	
    let g = colorLayer.data[pixelPos+1];	
    let b = colorLayer.data[pixelPos+2];

    return (r === startR && g === startG && b === startB);
    }

    function colorPixel(pixelPos)
    {
    colorLayer.data[pixelPos] = currR;
    colorLayer.data[pixelPos+1] = currG;
    colorLayer.data[pixelPos+2] = currB;
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
    undoStack.forEach(s => {
        s.forEach(p => {
            offScreenCTX.fillStyle = p.color;
            offScreenCTX.fillRect(p.x,p.y,1,1);
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
    //if the image is being drawn due to resizing, reset the width and height. Putting the width and height outside the img.onload function will make scaling smoother, but the image will flicker as you scale. Pick your poison.
    // onScreenCVS.width = baseDimension;
    // onScreenCVS.height = baseDimension;
    //Prevent blurring
    onScreenCTX.imageSmoothingEnabled = false;
    onScreenCTX.drawImage(img,0,0,onScreenCVS.width,onScreenCVS.height)
}

//Get the size of the parentNode which is subject to flexbox. Fit the square by making sure the dimensions are based on the smaller of the width and height.
function setSize() {
    rect = onScreenCVS.parentNode.getBoundingClientRect();
    rect.height > rect.width ? baseDimension = rect.width : baseDimension = rect.height;
}

//Resize the canvas if the window is resized
// function flexCanvasSize() {
//     setSize();
//     // tempCanvas.src = onScreenCVS.toDataURL();
//     // onScreenCVS.width = baseDimension;
//     // onScreenCVS.height = baseDimension;
//     renderImage();
// }

// window.onresize = flexCanvasSize;