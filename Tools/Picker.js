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
        //color
        this.hue;
        this.saturation;
        this.lightness;
        //interface
        this.oldcolor = document.getElementById("oldcolor");
        this.newcolor = document.getElementById("newcolor");
    }

    selectSL(e) {
        this.pickerCircle.x = e.offsetX - 3;
        this.pickerCircle.y = e.offsetY - 3;
        this.drawHSLGrad()

        this.saturation = Math.round(e.offsetX/this.width * 100);
        this.lightness = Math.round(e.offsetY/this.height * 100);
        // console.log("hsl(" + this.hue + "," + this.saturation + "%," + this.lightness + "%)")
        //set newcolor
        this.newcolor.style.backgroundColor = "hsl(" + this.hue + "," + this.saturation + "%," + this.lightness + "%)";
    }

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

    RGBToHSL(color) {
        // Make r, g, and b fractions of 1
        let r = color.r / 255;
        let g = color.g / 255;
        let b = color.b / 255;

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

    drawHSLGrad() {
        //draw gradient
        for (let row = 0; row < this.height; row++) {
            let grad = this.context.createLinearGradient(0, 0, this.width, 0);
            grad.addColorStop(0, 'hsl(' + this.hue + ', 0%, ' + ((row / this.height) * 100) + '%)');
            grad.addColorStop(1, 'hsl(' + this.hue + ', 100%, ' + ((row / this.height) * 100) + '%)');
            this.context.fillStyle = grad;
            this.context.fillRect(0, row, this.width, 1);
        }

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
        this.context.fillRect(this.pickerCircle.x-1, this.pickerCircle.y-1, 1, 1);
        this.context.fillRect(this.pickerCircle.x + this.pickerCircle.width, this.pickerCircle.y-1, 1, 1);
        this.context.fillRect(this.pickerCircle.x-1, this.pickerCircle.y + this.pickerCircle.height, 1, 1);
        this.context.fillRect(this.pickerCircle.x + this.pickerCircle.width, this.pickerCircle.y + this.pickerCircle.height, 1, 1);

        this.context.lineWidth = 1;
        this.context.strokeStyle = "white";
        this.context.stroke();
    }

    drawHueGrad() {

    }

    setColors() {

    }

    build() {
        //get current hsl
        this.RGBToHSL(state.brushColor);
        //draw gradient rectangle
        this.drawHSLGrad();

        //set oldcolor
        this.oldcolor.style.backgroundColor = state.brushColor.color;

        //set newcolor
        this.newcolor.style.backgroundColor = state.brushColor.color;

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
    }
}

//Render color picker
//Create an instance passing it the canvas, width and height
let picker = new Picker(document.getElementById("color-picker"), 250, 250);

//Draw 
picker.build();