class Picker {
    constructor(target, width, height) {
        this.target = target;
        this.width = width;
        this.height = height;
        this.target.width = width;
        this.target.height = height;
        //Get context 
        this.context = this.target.getContext("2d");
        //mouse
        this.mouseState = "none";
        //color selector circle
        this.pickerCircle = { x: 10, y: 10, width: 6, height: 6 };
        this.clicked = false;
        //hue slider
        this.hueRange = document.getElementById("hueslider");
        //color
        this.swatch = "swatch btn";
        this.hue;
        this.saturation;
        this.lightness;
        this.red;
        this.green;
        this.blue;
        // this.alpha = 255;
        this.hexcode;
        //*interface*//
        this.rgbahsl = document.getElementById("rgbahsl");
        this.rgba = document.getElementById("rgba");
        this.r = document.getElementById("r");
        this.g = document.getElementById("g");
        this.b = document.getElementById("b");
        // this.a = document.getElementById("a");
        this.hsl = document.getElementById("hsl");
        this.h = document.getElementById("h");
        this.s = document.getElementById("s");
        this.l = document.getElementById("l");
        this.hex = document.getElementById("hexcode");
        //Colors
        this.oldcolor = document.getElementById("oldcolor");
        this.newcolor = document.getElementById("newcolor");
        //OK/Cancel
        this.confirmBtn = document.getElementById("confirm-btn");
        this.cancelBtn = document.getElementById("cancel-btn");
    }

    //* Getters *//
    get reference() {
        return this.swatch === "back-swatch btn" ? state.backColor : state.brushColor;
    }

    //* Interface *//

    closeWindow() {
        // hide colorpicker
        colorPicker.style.display = "none";
        //restore pointer events to page
        fullPage.style.pointerEvents = "auto";
        //enable keyboard shortcuts
        state.shortcuts = true;
    }

    handleConfirm(e) {
        //get rgb values
        this.HSLToRGB();
        //set color to brush
        setColor(this.red, this.green, this.blue, this.swatch);
        //close window
        this.closeWindow();
    }

    handleCancel(e) {
        //close window
        this.closeWindow();
    }

    updateHue(e) {
        this.hue = e.target.value;
        this.drawHSLGrad();
        this.HSLToRGB();
        this.RGBToHex();
        this.updateColor();
    }

    updateColor() {
        this.newcolor.style.backgroundColor = "hsl(" + this.hue + "," + this.saturation + "%," + this.lightness + "%)";
        //update interface values to match new color
        this.r.value = this.red;
        this.g.value = this.green;
        this.b.value = this.blue;
        // this.a.value = this.alpha;
        this.h.value = this.hue;
        this.s.value = this.saturation;
        this.l.value = this.lightness;
        this.hex.value = this.hexcode;
        //update hue slider
        this.hueRange.value = this.hue;
    }

    updateRGB(e) {
        this.red = +this.r.value;
        this.green = +this.g.value;
        this.blue = +this.b.value;
        // this.alpha = this.a.value;
        this.RGBToHSL();
        this.RGBToHex();
        this.drawHSLGrad();
        this.updateColor();
    }

    updateHSL(e) {
        this.hue = +this.h.value;
        this.saturation = +this.s.value;
        this.lightness = +this.l.value;
        this.HSLToRGB();
        this.RGBToHex();
        this.drawHSLGrad();
        this.updateColor();
    }

    updateHex(e) {
        this.hexcode = this.hex.value;
        this.hexToRGB();
        this.RGBToHSL();
        this.drawHSLGrad();
        this.updateColor();
    }

    handleIncrement(e) {
        let channel = e.target.parentNode.previousSibling.previousSibling;
        let maxvalue;
        switch (channel) {
            case this.h:
                maxvalue = 359;
                break;
            case this.s:
                maxvalue = 100;
                break;
            case this.l:
                maxvalue = 100;
                break;
            default:
                //rgba
                maxvalue = 255;
        }
        if (e.target.id === "inc") {
            let newValue = Math.floor(+channel.value);
            if (newValue < maxvalue) {
                channel.value = newValue + 1;
            }
        } else if (e.target.id === "dec") {
            let newValue = Math.floor(+channel.value);
            if (newValue > 0) {
                channel.value = newValue - 1;
            }
        }
    }

    handleRGBIncrement(e) {
        if (this.mouseState === "mousedown") {
            this.handleIncrement(e);
            this.updateRGB(e);
            window.setTimeout(() => this.handleRGBIncrement(e), 100);
        } else {
            //stop recursion
        }
    }

    handleHSLIncrement(e) {
        if (this.mouseState === "mousedown") {
            this.handleIncrement(e);
            this.updateHSL(e);
            window.setTimeout(() => this.handleHSLIncrement(e), 100);
        } else {
            //stop recursion
        }
    }

    //* Canvas Interaction *//

    handleMouseDown(e) {
        this.clicked = true;
        let x, y;
        if (e.targetTouches) {
            let rect = e.target.getBoundingClientRect();
            x = Math.round(e.targetTouches[0].pageX - rect.left);
            y = Math.round(e.targetTouches[0].pageY - rect.top);
        } else {
            x = e.offsetX;
            y = e.offsetY;
        }
        this.selectSL(x, y);
    }

    handleMouseMove(e) {
        if (this.clicked) {
            let canvasXOffset = this.target.getBoundingClientRect().left - document.getElementsByTagName("html")[0].getBoundingClientRect().left;
            let canvasYOffset = this.target.getBoundingClientRect().top - document.getElementsByTagName("html")[0].getBoundingClientRect().top;
            let x, y;
            if (e.targetTouches) {
                x = Math.round(e.targetTouches[0].pageX - canvasXOffset);
                y = Math.round(e.targetTouches[0].pageY - canvasYOffset);
            } else {
                x = e.pageX - canvasXOffset;
                y = e.pageY - canvasYOffset;
            }
            //constrain coordinates
            if (x > this.width) { x = this.width }
            if (x < 0) { x = 0 }
            if (y > this.height) { y = this.height }
            if (y < 0) { y = 0 }
            this.selectSL(x, y);
        }
    }

    handleMouseUp(e) {
        this.clicked = false;
    }

    selectSL(x, y) {
        this.saturation = Math.round(x / this.width * 100);
        this.lightness = Math.round(y / this.height * 100);
        this.drawHSLGrad();
        //set newcolor
        this.HSLToRGB();
        this.RGBToHex();
        this.updateColor();
    }

    //* Color Space Conversion *//

    RGBToHSL() {
        // Make r, g, and b fractions of 1
        let r = this.red / 255;
        let g = this.green / 255;
        let b = this.blue / 255;

        // Find greatest and smallest channel values
        let cmin = Math.min(r, g, b),
            cmax = Math.max(r, g, b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0;

        //* Hue *//
        // No difference
        if (delta == 0)
            h = 0;
        // Red is max
        else if (cmax == r)
            h = ((g - b) / delta) % 6;
        // Green is max
        else if (cmax == g)
            h = (b - r) / delta + 2;
        // Blue is max
        else
            h = (r - g) / delta + 4;

        h = Math.round(h * 60);

        // Make negative hues positive behind 360°
        if (h < 0) h += 360;

        //* Lightness *//
        l = (cmax + cmin) / 2;

        //* Saturation *//
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        // Multiply l and s by 100
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);

        this.hue = h;
        this.saturation = s;
        this.lightness = l;
    }

    HSLToRGB() {
        let h = this.hue;
        // Must be fractions of 1
        let s = this.saturation / 100;
        let l = this.lightness / 100;

        //Find Chroma (color intensity)
        let c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs((h / 60) % 2 - 1)),
            m = l - c / 2,
            r = 0,
            g = 0,
            b = 0;

        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);

        this.red = r;
        this.green = g;
        this.blue = b;
    }

    hexToRGB() {
        let H = this.hexcode;
        // Convert hex to RGB
        let r = 0, g = 0, b = 0;
        if (H.length == 4) {
            r = "0x" + H[1] + H[1];
            g = "0x" + H[2] + H[2];
            b = "0x" + H[3] + H[3];
        } else if (H.length == 7) {
            r = "0x" + H[1] + H[2];
            g = "0x" + H[3] + H[4];
            b = "0x" + H[5] + H[6];
        }
        this.red = +r;
        this.green = +g;
        this.blue = +b;
    }

    RGBToHex() {
        let r = this.red.toString(16);
        let g = this.green.toString(16);
        let b = this.blue.toString(16);

        if (r.length == 1)
            r = "0" + r;
        if (g.length == 1)
            g = "0" + g;
        if (b.length == 1)
            b = "0" + b;

        this.hexcode = "#" + r + g + b;
    }

    //* Render Gradients Functions *//

    calcSelector() {
        this.pickerCircle.x = Math.round(this.saturation * this.width / 100) - 3;
        this.pickerCircle.y = Math.round(this.lightness * this.height / 100) - 3;
    }

    drawHSLGrad() {
        //draw hsl gradient
        for (let row = 0; row < this.height; row++) {
            let grad = this.context.createLinearGradient(0, 0, this.width, 0);
            grad.addColorStop(0, 'hsl(' + this.hue + ', 0%, ' + ((row / this.height) * 100) + '%)');
            grad.addColorStop(1, 'hsl(' + this.hue + ', 100%, ' + ((row / this.height) * 100) + '%)');
            this.context.fillStyle = grad;
            this.context.fillRect(0, row, this.width, 1);
        }

        this.calcSelector();

        //draw selector
        this.context.beginPath();

        //top
        this.context.moveTo(this.pickerCircle.x, this.pickerCircle.y - 0.5);
        this.context.lineTo(this.pickerCircle.x + this.pickerCircle.width, this.pickerCircle.y - 0.5);
        //right
        this.context.moveTo(this.pickerCircle.x + this.pickerCircle.width + 0.5, this.pickerCircle.y);
        this.context.lineTo(this.pickerCircle.x + this.pickerCircle.width + 0.5, this.pickerCircle.y + this.pickerCircle.height);
        //bottom
        this.context.moveTo(this.pickerCircle.x, this.pickerCircle.y + this.pickerCircle.height + 0.5);
        this.context.lineTo(this.pickerCircle.x + this.pickerCircle.width, this.pickerCircle.y + this.pickerCircle.height + 0.5);
        //left
        this.context.moveTo(this.pickerCircle.x - 0.5, this.pickerCircle.y);
        this.context.lineTo(this.pickerCircle.x - 0.5, this.pickerCircle.y + this.pickerCircle.height);

        this.context.lineWidth = 1;
        this.context.strokeStyle = "black";
        this.context.stroke();
        this.context.closePath();

        this.context.beginPath();

        //top
        this.context.moveTo(this.pickerCircle.x, this.pickerCircle.y - 1.5);
        this.context.lineTo(this.pickerCircle.x + this.pickerCircle.width, this.pickerCircle.y - 1.5);
        //right
        this.context.moveTo(this.pickerCircle.x + this.pickerCircle.width + 1.5, this.pickerCircle.y);
        this.context.lineTo(this.pickerCircle.x + this.pickerCircle.width + 1.5, this.pickerCircle.y + this.pickerCircle.height);
        //bottom
        this.context.moveTo(this.pickerCircle.x, this.pickerCircle.y + this.pickerCircle.height + 1.5);
        this.context.lineTo(this.pickerCircle.x + this.pickerCircle.width, this.pickerCircle.y + this.pickerCircle.height + 1.5);
        //left
        this.context.moveTo(this.pickerCircle.x - 1.5, this.pickerCircle.y);
        this.context.lineTo(this.pickerCircle.x - 1.5, this.pickerCircle.y + this.pickerCircle.height);
        //corners
        this.context.fillStyle = "white";
        this.context.fillRect(this.pickerCircle.x - 1, this.pickerCircle.y - 1, 1, 1);
        this.context.fillRect(this.pickerCircle.x + this.pickerCircle.width, this.pickerCircle.y - 1, 1, 1);
        this.context.fillRect(this.pickerCircle.x - 1, this.pickerCircle.y + this.pickerCircle.height, 1, 1);
        this.context.fillRect(this.pickerCircle.x + this.pickerCircle.width, this.pickerCircle.y + this.pickerCircle.height, 1, 1);

        this.context.lineWidth = 1;
        this.context.strokeStyle = "white";
        this.context.stroke();
    }

    drawHueGrad() {
        //hue slider gradient
        this.hueRange.style.background = "linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
    }

    //* Update Picker *//

    update() {
        this.red = this.reference.r;
        this.green = this.reference.g;
        this.blue = this.reference.b;
        //get current hsl
        this.RGBToHSL();
        //draw gradient rectangle
        this.drawHSLGrad();
        //set oldcolor
        this.oldcolor.style.backgroundColor = this.reference.color;

        //set newcolor and interface
        this.updateColor();
    }

    //* Initial Build *//

    build() {
        this.red = this.reference.r;
        this.green = this.reference.g;
        this.blue = this.reference.b;
        //get current hsl
        this.RGBToHSL();
        //get hex
        this.RGBToHex();
        //draw gradient rectangle
        this.drawHSLGrad();
        //draw hue slider
        this.drawHueGrad();
        this.hueRange.addEventListener("input", (e) => {
            this.updateHue(e);
        });

        //set oldcolor
        this.oldcolor.style.backgroundColor = this.reference.color;

        //set newcolor
        this.newcolor.style.backgroundColor = this.reference.color;

        //canvas listeners
        this.target.addEventListener("mousedown", (e) => {
            this.handleMouseDown(e);
        });
        window.addEventListener("mousemove", (e) => {
            this.handleMouseMove(e);
        });
        window.addEventListener("mouseup", (e) => {
            this.handleMouseUp(e);
        });
        this.target.addEventListener('touchstart', (e) => {
            this.handleMouseDown(e);
        });
        window.addEventListener('touchmove', (e) => {
            window.scrollTo(0, 0);
            this.handleMouseMove(e);
        });
        window.addEventListener('touchend', (e) => {
            this.handleMouseUp(e);
        });
        window.addEventListener('touchcancel', (e) => {
            this.handleMouseUp(e);
        });

        //Interface listeners
        this.confirmBtn.addEventListener("click", (e) => {
            this.handleConfirm(e);
        });
        this.cancelBtn.addEventListener("click", (e) => {
            this.handleCancel(e);
        });
        //channel listeners
        this.rgba.addEventListener("mousedown", (e) => {
            this.mouseState = e.type;
            this.handleRGBIncrement(e);
        });
        this.rgba.addEventListener("mouseup", (e) => {
            this.mouseState = e.type;
            // this.handleRGBIncrement(e);
        });
        this.rgba.addEventListener("mouseout", (e) => {
            this.mouseState = e.type;
            // this.handleRGBIncrement(e);
        });
        this.rgba.addEventListener("change", (e) => {
            this.updateRGB(e);
        });
        this.hsl.addEventListener("mousedown", (e) => {
            this.mouseState = e.type;
            this.handleHSLIncrement(e);
        });
        this.hsl.addEventListener("mouseup", (e) => {
            this.mouseState = e.type;
            // this.handleHSLIncrement(e);
        });
        this.hsl.addEventListener("mouseout", (e) => {
            this.mouseState = e.type;
            // this.handleHSLIncrement(e);
        });
        this.hsl.addEventListener("change", (e) => {
            this.updateHSL(e);
        });
        this.hex.addEventListener("change", (e) => {
            this.updateHex(e);
        });
    }
}

//Render color picker
//Should there be multiple separate color pickers, for bg and fg?
//Refactor to include html built into class, instead of being called by class?
//Create an instance passing it the canvas, width and height
let picker = new Picker(document.getElementById("color-picker"), 250, 250);

//Draw 
picker.build();