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
        this.pickerCircle = { x: 10, y: 10, width: 8, height: 8 };
    }

    get hue() { return this.RGBToHSL(state.brushColor).hue; }
    get saturation() { return this.RGBToHSL(state.brushColor).saturation; }
    get lightness() { return this.RGBToHSL(state.brushColor).lightness; }

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

        return {hue: h, saturation: s, lightness: l};
    }

    draw() {
        //draw gradient
        for (let row = 0; row < this.height; row++) {
            let grad = this.context.createLinearGradient(0, 0, this.width, 0);
            grad.addColorStop(0, 'hsl(' + this.hue + ', 0%, ' + (100 - (row / this.height) * 100) + '%)');
            grad.addColorStop(1, 'hsl(' + this.hue + ', 100%, ' + (100 - (row / this.height) * 100) + '%)');
            this.context.fillStyle = grad;
            this.context.fillRect(0, row, this.width, 1);
        }

        //draw selector
        this.context.beginPath();
        this.context.lineWidth = 1;
        this.context.strokeStyle = "black";
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

        this.context.stroke();
    }
}

//Render color picker
//Create an instance passing it the canvas, width and height
let picker = new Picker(document.getElementById("color-picker"), 250, 250);

//Draw 
picker.draw();