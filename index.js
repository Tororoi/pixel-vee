//Set onscreen canvas and its context
let onScreenCVS = document.getElementById("onScreen");
let onScreenCTX = onScreenCVS.getContext("2d");

//Get the undo buttons
let undoBtn = document.getElementById("undo");
let redoBtn = document.getElementById("redo");

//Set initial size of canvas. If using a non-square, make sure to set the ratio the same as the offscreen canvas by multiplying either the height or width by the correct ratio.
let baseDimension;
let rect;
    setSize();
    onScreenCVS.width = baseDimension;
    onScreenCVS.height = baseDimension;

//Create history stacks for the undo functionality
//Image based
// let undoStack = [onScreenCVS.toDataURL()];
//Action based
let undoStack = [];
let redoStack = [];
function getTopImage() {
    return undoStack[undoStack.length-1]
}

//Create an Image with a default source of the existing onscreen canvas
let img = new Image;
let source = getTopImage();

//Create an offscreen canvas. This is where we will actually be drawing, in order to keep the image consistent and free of distortions.
let offScreenCVS = document.createElement('canvas');
let offScreenCTX = offScreenCVS.getContext("2d");
//Set the dimensions of the drawing canvas
  offScreenCVS.width = 32;
  offScreenCVS.height = 32;

//Add event listeners for the mouse moving, downclick, and upclick
onScreenCVS.addEventListener('mousemove', handleMouseMove);
onScreenCVS.addEventListener('mousedown', handleMouseDown);
onScreenCVS.addEventListener('mouseup', handleMouseUp);

//Add event listeners for the toolbox
undoBtn.addEventListener('click', handleUndo)
redoBtn.addEventListener('click', handleRedo)


//We only want the mouse to move if the mouse is down, so we need a variable to disable drawing while the mouse is not clicked.
let clicked = false;

function handleMouseMove(e) {
    if (clicked) {
        //Action-based
        actionDraw(e);
        //Image-based
        // draw(e)
    }
}

function handleMouseDown(e) {
    clicked = true;
    //Action-based
    actionDraw(e);
    //Image-based
    // draw(e);
}

function handleMouseUp() {
    clicked = false;
    //Action-based
    undoStack.push(points);
    points = [];
    //Image-based
    //Push the image to the history
    // undoStack.push(source)

    //Reset redostack
    redoStack = [];
}

function handleUndo() {
    if (undoStack.length>0) {
        actionUndoRedo(redoStack, undoStack);
        // undoRedo(redoStack, undoStack);
    }
}

function handleRedo() {
    if (redoStack.length>=1) {
        actionUndoRedo(undoStack, redoStack);
        // undoRedo(undoStack, redoStack);
    }
}

let lastX;
let lastY;
let points = [];

//Action functions
function actionDraw(e) {
    let ratio = onScreenCVS.width/offScreenCVS.width;
    let mouseX = Math.floor(e.offsetX/ratio);
    let mouseY = Math.floor(e.offsetY/ratio);
    // extend the polyline
    offScreenCTX.fillStyle = "red";
    offScreenCTX.fillRect(mouseX,mouseY,1,1);

    if (lastX !== mouseX || lastY !== mouseY) {
        points.push({
            x: mouseX,
            y: mouseY,
            // size: brushSize,
            // color: brushColor,
            // mode: "draw"
        });
        source = offScreenCVS.toDataURL();
        renderImage();
    }

    //save last point
    lastX = mouseX;
    lastY = mouseY;
}

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
            offScreenCTX.fillStyle = "red";
            offScreenCTX.fillRect(p.x,p.y,1,1);
        })
    })
}
//Helper functions

//Draw a single pixel on the canvas. Get the ratio of the difference in size of the on and offscreen canvases to calculate where to draw on the offscreen canvas based on the coordinates of clicking on the onscreen canvas.
function draw(e) {
    let ratio = onScreenCVS.width/offScreenCVS.width;
    offScreenCTX.fillStyle = "red";
    offScreenCTX.fillRect(Math.floor(e.offsetX/ratio),Math.floor(e.offsetY/ratio),1,1);
    //Set the source of the image to the offscreen canvas
    source = offScreenCVS.toDataURL();
    renderImage();
}

//Once the image is loaded, draw the image onto the onscreen canvas.
function renderImage() {
    img.src = source;
    img.onload = () => {
      //if the image is being drawn due to resizing, reset the width and height. Putting the width and height outside the img.onload function will make scaling smoother, but the image will flicker as you scale. Pick your poison.
      onScreenCVS.width = baseDimension;
      onScreenCVS.height = baseDimension;
      //Prevent blurring
      onScreenCTX.imageSmoothingEnabled = false;
      onScreenCTX.drawImage(img,0,0,onScreenCVS.width,onScreenCVS.height)
    }
}

//Undo or redo an action
function undoRedo(pushStack,popStack) {
    pushStack.push(popStack.pop());
    source = getTopImage();
    img.src = source;
    offScreenCTX.clearRect(0,0,offScreenCVS.width,offScreenCVS.height);
    offScreenCTX.drawImage(img,0,0,offScreenCVS.width,offScreenCVS.height);
    renderImage();
}

//Get the size of the parentNode which is subject to flexbox. Fit the square by making sure the dimensions are based on the smaller of the width and height.
function setSize() {
    rect = onScreenCVS.parentNode.getBoundingClientRect();
    rect.height > rect.width ? baseDimension = rect.width : baseDimension = rect.height;
}

//Resize the canvas if the window is resized
function flexCanvasSize() {
    setSize();
    renderImage();
}

window.onresize = flexCanvasSize;