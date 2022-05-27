import {
  RGBToHSL,
  HSLToRGB,
  hexToRGB,
  RGBToHex,
  getLuminance,
} from "../utils/colorConversion.js"
//TODO: Add "lock" toggle to luminance field.
//This will trigger the hsl grad to become a 2-dimensional gradient
//where every value has the same luminance. The hue slider can be adjusted
//to see the gradient for different hues at that same luminance.
export class Picker {
  constructor(target, width, height, setColor) {
    this.target = target
    this.width = width
    this.height = height
    this.target.width = width
    this.target.height = height
    this.setColor = setColor
    //Get context
    this.context = this.target.getContext("2d")
    //mouse
    this.mouseState = "none"
    //color selector circle
    this.pickerCircle = { x: 10, y: 10, width: 6, height: 6 }
    this.clicked = false
    //hue slider
    this.hueRange = document.getElementById("hueslider")
    //color
    this.swatch = "swatch btn"
    this.hue
    this.saturation
    this.lightness
    this.red
    this.green
    this.blue
    // this.alpha = 255;
    this.hexcode
    this.luminance
    //*interface*//
    this.rgbahsl = document.getElementById("rgbahsl")
    this.rgba = document.getElementById("rgba")
    this.r = document.getElementById("r")
    this.g = document.getElementById("g")
    this.b = document.getElementById("b")
    // this.a = document.getElementById("a");
    this.hsl = document.getElementById("hsl")
    this.h = document.getElementById("h")
    this.s = document.getElementById("s")
    this.l = document.getElementById("l")
    this.hex = document.getElementById("hexcode")
    this.lumi = document.getElementById("luminance")
    //Colors
    this.oldcolor = document.getElementById("oldcolor")
    this.newcolor = document.getElementById("newcolor")
    //OK/Cancel
    this.confirmBtn = document.getElementById("confirm-btn")
    this.cancelBtn = document.getElementById("cancel-btn")
  }

  /**
   * update DOM to match updated values
   */
  updateColor() {
    this.newcolor.style.backgroundColor =
      "hsl(" + this.hue + "," + this.saturation + "%," + this.lightness + "%)"
    //update interface values to match new color
    this.r.value = this.red
    this.g.value = this.green
    this.b.value = this.blue
    // this.a.value = this.alpha;
    this.h.value = this.hue
    this.s.value = this.saturation
    this.l.value = this.lightness
    this.hex.value = this.hexcode
    this.lumi.value = this.luminance
    //update hue slider
    this.hueRange.value = this.hue
  }

  updateHue(e) {
    this.hue = e.target.value
    //update rgb
    const { r, g, b } = HSLToRGB(this.hue, this.saturation, this.lightness)
    this.red = r
    this.green = g
    this.blue = b
    this.hexcode = RGBToHex(this.red, this.green, this.blue)
    this.luminance = getLuminance(this.red, this.green, this.blue)
    this.drawHSLGrad()
    this.updateColor()
  }

  updateRGB(e) {
    this.red = +this.r.value
    this.green = +this.g.value
    this.blue = +this.b.value
    // this.alpha = this.a.value;
    //update hsl
    const { h, s, l } = RGBToHSL(this.red, this.green, this.blue)
    this.hue = h
    this.saturation = s
    this.lightness = l
    this.hexcode = RGBToHex(this.red, this.green, this.blue)
    this.luminance = getLuminance(this.red, this.green, this.blue)
    this.drawHSLGrad()
    this.updateColor()
  }

  updateHSL(e) {
    this.hue = +this.h.value
    this.saturation = +this.s.value
    this.lightness = +this.l.value
    //update rgb
    const { r, g, b } = HSLToRGB(this.hue, this.saturation, this.lightness)
    this.red = r
    this.green = g
    this.blue = b
    this.hexcode = RGBToHex(this.red, this.green, this.blue)
    this.luminance = getLuminance(this.red, this.green, this.blue)
    this.drawHSLGrad()
    this.updateColor()
  }

  updateHex(e) {
    this.hexcode = this.hex.value
    //update rgb
    const { r, g, b } = hexToRGB(this.hexcode)
    this.red = r
    this.green = g
    this.blue = b
    //update hsl
    const { h, s, l } = RGBToHSL(this.red, this.green, this.blue)
    this.hue = h
    this.saturation = s
    this.lightness = l
    this.luminance = getLuminance(this.red, this.green, this.blue)
    this.drawHSLGrad()
    this.updateColor()
  }

  handleIncrement(e) {
    let channel = e.target.parentNode.previousSibling.previousSibling
    let maxvalue
    switch (channel) {
      case this.h:
        maxvalue = 359
        break
      case this.s:
        maxvalue = 100
        break
      case this.l:
        maxvalue = 100
        break
      default:
        //rgba
        maxvalue = 255
    }
    if (e.target.id === "inc") {
      let newValue = Math.floor(+channel.value)
      if (newValue < maxvalue) {
        channel.value = newValue + 1
      }
    } else if (e.target.id === "dec") {
      let newValue = Math.floor(+channel.value)
      if (newValue > 0) {
        channel.value = newValue - 1
      }
    }
  }

  /**
   * increment values while rgb button is held down
   * @param {event} e
   */
  handleRGBIncrement(e) {
    if (this.mouseState === "mousedown") {
      this.handleIncrement(e)
      this.updateRGB(e)
      window.setTimeout(() => this.handleRGBIncrement(e), 100)
    }
  }

  /**
   * increment values while hsl button is held down
   * @param {event} e
   */
  handleHSLIncrement(e) {
    if (this.mouseState === "mousedown") {
      this.handleIncrement(e)
      this.updateHSL(e)
      window.setTimeout(() => this.handleHSLIncrement(e), 100)
    }
  }

  //* Canvas Interaction *//

  handleMouseDown(e) {
    this.clicked = true
    let x, y
    if (e.targetTouches) {
      let rect = e.target.getBoundingClientRect()
      x = Math.round(e.targetTouches[0].pageX - rect.left)
      y = Math.round(e.targetTouches[0].pageY - rect.top)
    } else {
      x = e.offsetX
      y = e.offsetY
    }
    this.selectSL(x, y)
  }

  handleMouseMove(e) {
    if (this.clicked) {
      let canvasXOffset =
        this.target.getBoundingClientRect().left -
        document.getElementsByTagName("html")[0].getBoundingClientRect().left
      let canvasYOffset =
        this.target.getBoundingClientRect().top -
        document.getElementsByTagName("html")[0].getBoundingClientRect().top
      let x, y
      if (e.targetTouches) {
        x = Math.round(e.targetTouches[0].pageX - canvasXOffset)
        y = Math.round(e.targetTouches[0].pageY - canvasYOffset)
      } else {
        x = e.pageX - canvasXOffset
        y = e.pageY - canvasYOffset
      }
      //constrain coordinates
      if (x > this.width) {
        x = this.width
      }
      if (x < 0) {
        x = 0
      }
      if (y > this.height) {
        y = this.height
      }
      if (y < 0) {
        y = 0
      }
      this.selectSL(x, y)
    }
  }

  handleMouseUp(e) {
    this.clicked = false
  }

  selectSL(x, y) {
    this.saturation = Math.round((x / this.width) * 100)
    this.lightness = Math.round((y / this.height) * 100)
    this.drawHSLGrad()
    //set newcolor
    //update rgb
    const { r, g, b } = HSLToRGB(this.hue, this.saturation, this.lightness)
    this.red = r
    this.green = g
    this.blue = b
    this.hexcode = RGBToHex(this.red, this.green, this.blue)
    this.luminance = getLuminance(this.red, this.green, this.blue)
    this.updateColor()
  }

  //* Render Gradients Functions *//

  calcSelector() {
    this.pickerCircle.x = Math.round((this.saturation * this.width) / 100) - 3
    this.pickerCircle.y = Math.round((this.lightness * this.height) / 100) - 3
  }

  drawHSLGrad() {
    //draw hsl gradient
    for (let row = 0; row < this.height; row++) {
      let grad = this.context.createLinearGradient(0, 0, this.width, 0)
      grad.addColorStop(
        0,
        "hsl(" + this.hue + ", 0%, " + (row / this.height) * 100 + "%)"
      )
      grad.addColorStop(
        1,
        "hsl(" + this.hue + ", 100%, " + (row / this.height) * 100 + "%)"
      )
      this.context.fillStyle = grad
      this.context.fillRect(0, row, this.width, 1)
    }

    this.calcSelector()

    //draw selector
    this.context.beginPath()

    //top
    this.context.moveTo(this.pickerCircle.x, this.pickerCircle.y - 0.5)
    this.context.lineTo(
      this.pickerCircle.x + this.pickerCircle.width,
      this.pickerCircle.y - 0.5
    )
    //right
    this.context.moveTo(
      this.pickerCircle.x + this.pickerCircle.width + 0.5,
      this.pickerCircle.y
    )
    this.context.lineTo(
      this.pickerCircle.x + this.pickerCircle.width + 0.5,
      this.pickerCircle.y + this.pickerCircle.height
    )
    //bottom
    this.context.moveTo(
      this.pickerCircle.x,
      this.pickerCircle.y + this.pickerCircle.height + 0.5
    )
    this.context.lineTo(
      this.pickerCircle.x + this.pickerCircle.width,
      this.pickerCircle.y + this.pickerCircle.height + 0.5
    )
    //left
    this.context.moveTo(this.pickerCircle.x - 0.5, this.pickerCircle.y)
    this.context.lineTo(
      this.pickerCircle.x - 0.5,
      this.pickerCircle.y + this.pickerCircle.height
    )

    this.context.lineWidth = 1
    this.context.strokeStyle = "black"
    this.context.stroke()
    this.context.closePath()

    this.context.beginPath()

    //top
    this.context.moveTo(this.pickerCircle.x, this.pickerCircle.y - 1.5)
    this.context.lineTo(
      this.pickerCircle.x + this.pickerCircle.width,
      this.pickerCircle.y - 1.5
    )
    //right
    this.context.moveTo(
      this.pickerCircle.x + this.pickerCircle.width + 1.5,
      this.pickerCircle.y
    )
    this.context.lineTo(
      this.pickerCircle.x + this.pickerCircle.width + 1.5,
      this.pickerCircle.y + this.pickerCircle.height
    )
    //bottom
    this.context.moveTo(
      this.pickerCircle.x,
      this.pickerCircle.y + this.pickerCircle.height + 1.5
    )
    this.context.lineTo(
      this.pickerCircle.x + this.pickerCircle.width,
      this.pickerCircle.y + this.pickerCircle.height + 1.5
    )
    //left
    this.context.moveTo(this.pickerCircle.x - 1.5, this.pickerCircle.y)
    this.context.lineTo(
      this.pickerCircle.x - 1.5,
      this.pickerCircle.y + this.pickerCircle.height
    )
    //corners
    this.context.fillStyle = "white"
    this.context.fillRect(
      this.pickerCircle.x - 1,
      this.pickerCircle.y - 1,
      1,
      1
    )
    this.context.fillRect(
      this.pickerCircle.x + this.pickerCircle.width,
      this.pickerCircle.y - 1,
      1,
      1
    )
    this.context.fillRect(
      this.pickerCircle.x - 1,
      this.pickerCircle.y + this.pickerCircle.height,
      1,
      1
    )
    this.context.fillRect(
      this.pickerCircle.x + this.pickerCircle.width,
      this.pickerCircle.y + this.pickerCircle.height,
      1,
      1
    )

    this.context.lineWidth = 1
    this.context.strokeStyle = "white"
    this.context.stroke()
  }

  drawHueGrad() {
    //hue slider gradient
    this.hueRange.style.background =
      "linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
  }

  //* Update Picker *//

  update(reference) {
    this.red = reference.r
    this.green = reference.g
    this.blue = reference.b
    //get current hsl
    const { h, s, l } = RGBToHSL(this.red, this.green, this.blue)
    this.hue = h
    this.saturation = s
    this.lightness = l
    this.luminance = getLuminance(this.red, this.green, this.blue)
    //draw gradient rectangle
    this.drawHSLGrad()
    //set oldcolor
    this.oldcolor.style.backgroundColor = reference.color
    //set newcolor and interface
    this.updateColor()
  }

  //* Initial Build *//

  build(reference) {
    this.red = reference.r
    this.green = reference.g
    this.blue = reference.b
    //get current hsl
    const { h, s, l } = RGBToHSL(this.red, this.green, this.blue)
    this.hue = h
    this.saturation = s
    this.lightness = l
    //get hex
    this.hexcode = RGBToHex(this.red, this.green, this.blue)
    this.luminance = getLuminance(this.red, this.green, this.blue)
    //draw gradient rectangle
    this.drawHSLGrad()
    //draw hue slider
    this.drawHueGrad()
    this.hueRange.addEventListener("input", (e) => {
      this.updateHue(e)
    })

    //set oldcolor
    this.oldcolor.style.backgroundColor = reference.color

    //set newcolor
    this.newcolor.style.backgroundColor = reference.color

    //canvas listeners
    this.target.addEventListener("mousedown", (e) => {
      this.handleMouseDown(e)
    })
    window.addEventListener("mousemove", (e) => {
      this.handleMouseMove(e)
    })
    window.addEventListener("mouseup", (e) => {
      this.handleMouseUp(e)
    })
    this.target.addEventListener(
      "touchstart",
      (e) => {
        this.handleMouseDown(e)
      },
      { passive: true }
    )
    window.addEventListener(
      "touchmove",
      (e) => {
        window.scrollTo(0, 0)
        this.handleMouseMove(e)
      },
      { passive: true }
    )
    window.addEventListener(
      "touchend",
      (e) => {
        this.handleMouseUp(e)
      },
      { passive: true }
    )
    window.addEventListener(
      "touchcancel",
      (e) => {
        this.handleMouseUp(e)
      },
      { passive: true }
    )

    //channel listeners
    this.rgba.addEventListener("mousedown", (e) => {
      this.mouseState = e.type
      this.handleRGBIncrement(e)
    })
    this.rgba.addEventListener("mouseup", (e) => {
      this.mouseState = e.type
      // this.handleRGBIncrement(e);
    })
    this.rgba.addEventListener("mouseout", (e) => {
      this.mouseState = e.type
      // this.handleRGBIncrement(e);
    })
    this.rgba.addEventListener("change", (e) => {
      this.updateRGB(e)
    })
    this.hsl.addEventListener("mousedown", (e) => {
      this.mouseState = e.type
      this.handleHSLIncrement(e)
    })
    this.hsl.addEventListener("mouseup", (e) => {
      this.mouseState = e.type
      // this.handleHSLIncrement(e);
    })
    this.hsl.addEventListener("mouseout", (e) => {
      this.mouseState = e.type
      // this.handleHSLIncrement(e);
    })
    this.hsl.addEventListener("change", (e) => {
      this.updateHSL(e)
    })
    this.hex.addEventListener("change", (e) => {
      this.updateHex(e)
    })
  }
}

//Render color picker
//Should there be multiple separate color pickers, for bg and fg?
//Refactor to include html built into class, instead of being called by class?
