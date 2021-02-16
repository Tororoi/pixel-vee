class Picker {
    constructor(target, width, height) {
        this.target = target;
        this.width = width;
        this.height = height;
        this.target.width = width;
        this.target.height = height;
        //Get context 
        this.context = this.target.getContext("2d");
        //Circle (Color Selector Circle)
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
        //*interface*//

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

    //* Calculations *//

    calcSelector() {
        this.pickerCircle.x = Math.round(this.saturation * this.width / 100) - 3;
        this.pickerCircle.y = Math.round(this.lightness * this.height / 100) - 3;
    }

    selectSL(e) {
        this.pickerCircle.x = e.offsetX - 3;
        this.pickerCircle.y = e.offsetY - 3;
        this.drawHSLGrad()

        this.saturation = Math.round(e.offsetX / this.width * 100);
        this.lightness = Math.round(e.offsetY / this.height * 100);
        // console.log("hsl(" + this.hue + "," + this.saturation + "%," + this.lightness + "%)")
        //set newcolor
        this.updateColor();
    }

    updateHue(e) {
        this.hue = e.target.value;
        this.drawHSLGrad();
        this.updateColor();
    }

    setHueSlider() {
        this.hueRange.value = this.hue;
    }

    updateColor() {
        this.newcolor.style.backgroundColor = "hsl(" + this.hue + "," + this.saturation + "%," + this.lightness + "%)";
    }

    //* Mouse Events on Canvas *//

    handleMouseDown(e) {
        this.clicked = true;
        this.selectSL(e)
    }

    handleMouseMove(e) {
        if (this.clicked) {
            this.selectSL(e);
        }
    }

    handleMouseUp(e) {
        this.clicked = false;
    }

    handleMouseOut(e) {
        this.clicked = false;
    }

    //* Interface *//
    closeWindow() {
        colorPicker.style.visibility = "hidden";
        colorPicker.style.pointerEvents = "none";
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

    //* Color Space Conversion *//

    RGBToHSL() {
        // Make r, g, and b fractions of 1
        let r = this.reference.r / 255;
        let g = this.reference.g / 255;
        let b = this.reference.b / 255;

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

    //* Render Gradients Functions *//

    drawHSLGrad() {
        //draw gradient
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
        this.hueRange.style.background = "linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
    }

    //* Update Picker *//
    update() {
        //get current hsl
        this.RGBToHSL();
        //draw gradient rectangle
        this.drawHSLGrad();
        //set hue slider
        this.setHueSlider();
        //set oldcolor
        this.oldcolor.style.backgroundColor = this.reference.color;

        //set newcolor
        this.newcolor.style.backgroundColor = this.reference.color;
    }

    //* Initial Build *//

    build() {
        //get current hsl
        this.RGBToHSL();
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
        this.target.addEventListener("mousemove", (e) => {
            this.handleMouseMove(e);
        });
        window.addEventListener("mouseup", (e) => {
            this.handleMouseUp(e);
        });
        // this.target.addEventListener("mouseout", (e) => {
        //     this.handleMouseOut(e);
        // });

        //Interface listeners
        this.confirmBtn.addEventListener("click", (e) => {
            this.handleConfirm(e);
        });
        this.cancelBtn.addEventListener("click", (e) => {
            this.handleCancel(e);
        });
    }
}

//Render color picker
//Create an instance passing it the canvas, width and height
let picker = new Picker(document.getElementById("color-picker"), 250, 250);

//Draw 
picker.build();