// class Surface {
//     constructor(canvas) {
//         //Onscreen
//         this.onScreenCVS = canvas;
//         this.onScreenCTX = onScreenCVS.getContext("2d");
//         this.ocWidth = this.onScreenCVS.width;
//         this.ocHeight = this.onScreenCVS.height;
//         //Offscreen
//         this.offScreenCVS = document.createElement('canvas');
//         this.offScreenCTX = offScreenCVS.getContext("2d");
//         //Standard variables
//         this.event = "none";
//         this.clicked = false;
//         this.clickedColor = null;
//         this.ratio = null;
//         this.trueRatio = null;
//         //Offscreen variables
//         this.colorLayer = null;
//         this.xOffset = 0;
//         this.yOffset = 0;
//         this.lastOffsetX = 0;
//         this.lastOffsetY = 0;
//         //mousex,y
//         this.x = null;
//         this.y = null;
//         this.mox = null;
//         this.moy = null;
//         this.lastX = null;
//         this.lastY = null;
//         //x2/y2 for line tool
//         this.lineX = null;
//         this.lineY = null;
//         //for perfect pixels
//         this.lastDrawnX = null;
//         this.lastDrawnY = null;
//         this.waitingPixelX = null;
//         this.waitingPixelY = null;
//         //Onscreen variables
//         this.sharpness = 4;
//         this.zoom = 1;
//         this.onX = null;
//         this.onY = null;
//         this.lastOnX = null;
//         this.lastOnY = null;
//     }

//     this.init = () => {
//     this.onScreenCVS.width = this.ocWidth * this.sharpness;
//     this.onScreenCVS.height = this.ocHeight * this.sharpness;
//     this.onScreenCTX.scale(this.sharpness * this.zoom, this.sharpness * this.zoom);
//     //Set the dimensions of the drawing canvas
//     this.offScreenCVS.width = 64;
//     this.offScreenCVS.height = 64;
// }

// this.init();
// }