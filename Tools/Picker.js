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
  constructor(target, width, height, setColor, initialColor) {
    this.target = target
    this.width = width
    this.height = height
    this.target.width = width
    this.target.height = height
    this.setColor = setColor
    //Get context
    this.context = this.target.getContext("2d")
    //pointer
    this.pointerState = "none"
    //color selector circle
    this.pickerCircle = { x: 10, y: 10, width: 6, height: 6 }
    this.clickedCanvas = false
    //hue slider
    this.hueRange = document.getElementById("hueslider")
    //*interface*//
    this.rgbaContainer = document.getElementById("rgba-container")
    this.r = document.getElementById("r")
    this.g = document.getElementById("g")
    this.b = document.getElementById("b")
    // this.a = document.getElementById("a");
    this.hslContainer = document.getElementById("hsl-container")
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
    //color
    this.swatch = "swatch btn"
    this.rgb = {
      red: initialColor.r,
      green: initialColor.g,
      blue: initialColor.b,
    }
    this.hsl = RGBToHSL(this.rgb)
    // this.alpha = 255;
    this.hexcode = RGBToHex(this.rgb)
    this.luminance = getLuminance(this.rgb)
  }

  //===================================//
  //===== * * * Color Space * * * =====//
  //===================================//

  /**
   * propogate rgb values to other color spaces
   */
  propogateRGBColorSpace() {
    this.hsl = RGBToHSL(this.rgb)
    this.hexcode = RGBToHex(this.rgb)
    this.luminance = getLuminance(this.rgb)
    this.updateColor()
  }

  /**
   * propogate hsl values to other color spaces
   */
  propogateHSLColorSpace() {
    this.rgb = HSLToRGB(this.hsl)
    this.hexcode = RGBToHex(this.rgb)
    this.luminance = getLuminance(this.rgb)
    this.updateColor()
  }

  /**
   * propogate hexcode value to other color spaces
   */
  propogateHexColorSpace() {
    this.rgb = hexToRGB(this.hexcode)
    this.hsl = RGBToHSL(this.rgb)
    this.luminance = getLuminance(this.rgb)
    this.updateColor()
  }

  updateHue(e) {
    this.hsl.hue = e.target.value
    this.propogateHSLColorSpace()
  }

  updateRGB(e) {
    const red = +this.r.value
    const green = +this.g.value
    const blue = +this.b.value
    this.rgb = { red, green, blue }
    // this.alpha = this.a.value;
    this.propogateRGBColorSpace()
  }

  updateHSL(e) {
    const hue = +this.h.value
    const saturation = +this.s.value
    const lightness = +this.l.value
    this.hsl = { hue, saturation, lightness }
    this.propogateHSLColorSpace()
  }

  updateHex(e) {
    this.hexcode = this.hex.value
    this.propogateHexColorSpace()
  }

  //===================================//
  //==== * * * DOM Interface * * * ====//
  //===================================//

  /**
   * update DOM to match updated values
   */
  updateColor() {
    this.drawHSLGrad(this.hsl.hue)
    //update interface values to match new color
    const { hue, saturation, lightness } = this.hsl
    this.newcolor.style.backgroundColor =
      "hsl(" + hue + "," + saturation + "%," + lightness + "%)"
    //hsl
    this.h.value = hue
    this.s.value = saturation
    this.l.value = lightness
    //rgb
    const { red, green, blue } = this.rgb
    this.r.value = red
    this.g.value = green
    this.b.value = blue
    // this.a.value = this.alpha;
    this.hex.value = this.hexcode
    this.lumi.value = this.luminance
    //update hue slider
    this.hueRange.value = this.hsl.hue
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
    if (this.pointerState === "pointerdown") {
      this.handleIncrement(e)
      this.updateRGB(e)
      window.setTimeout(() => this.handleRGBIncrement(e), 150)
    }
  }

  /**
   * increment values while hsl button is held down
   * @param {event} e
   */
  handleHSLIncrement(e) {
    if (this.pointerState === "pointerdown") {
      this.handleIncrement(e)
      this.updateHSL(e)
      window.setTimeout(() => this.handleHSLIncrement(e), 150)
    }
  }

  //* Canvas Interaction *//

  handleMouseDown(e) {
    this.clickedCanvas = true
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
    if (this.clickedCanvas) {
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
    this.clickedCanvas = false
  }

  selectSL(x, y) {
    this.hsl.saturation = Math.round((x / this.width) * 100)
    this.hsl.lightness = Math.round((y / this.height) * 100)
    this.propogateHSLColorSpace()
  }

  //===================================//
  //======= * * * Render * * * ========//
  //===================================//

  calcSelector() {
    this.pickerCircle.x =
      Math.round((this.hsl.saturation * this.width) / 100) - 3
    this.pickerCircle.y =
      Math.round((this.hsl.lightness * this.height) / 100) - 3
  }

  drawHSLGrad(hue) {
    //draw hsl gradient
    for (let row = 0; row < this.height; row++) {
      let grad = this.context.createLinearGradient(0, 0, this.width, 0)
      grad.addColorStop(
        0,
        "hsl(" + hue + ", 0%, " + (row / this.height) * 100 + "%)"
      )
      grad.addColorStop(
        1,
        "hsl(" + hue + ", 100%, " + (row / this.height) * 100 + "%)"
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
  //Called every time color picker is opened
  update(reference) {
    this.rgb = { red: reference.r, green: reference.g, blue: reference.b }
    this.propogateRGBColorSpace()
    //set oldcolor
    this.oldcolor.style.backgroundColor = reference.color
  }

  //* Initial Build *//

  build() {
    //draw hue slider
    this.drawHueGrad()
    this.hueRange.addEventListener("input", (e) => {
      this.updateHue(e)
    })

    //canvas listeners
    this.target.addEventListener("pointerdown", (e) => {
      e.target.setPointerCapture(e.pointerId)
      this.handleMouseDown(e)
    })
    this.target.addEventListener("pointermove", (e) => {
      this.handleMouseMove(e)
    })
    this.target.addEventListener("pointerup", (e) => {
      this.handleMouseUp(e)
    })

    //channel listeners
    this.rgbaContainer.addEventListener("pointerdown", (e) => {
      this.pointerState = e.type
      this.handleRGBIncrement(e)
    })
    this.rgbaContainer.addEventListener("pointerup", (e) => {
      this.pointerState = e.type
    })
    this.rgbaContainer.addEventListener("pointerout", (e) => {
      this.pointerState = e.type
    })
    this.rgbaContainer.addEventListener("change", (e) => {
      this.updateRGB(e)
    })
    this.hslContainer.addEventListener("pointerdown", (e) => {
      this.pointerState = e.type
      this.handleHSLIncrement(e)
    })
    this.hslContainer.addEventListener("pointerup", (e) => {
      this.pointerState = e.type
    })
    this.hslContainer.addEventListener("pointerout", (e) => {
      this.pointerState = e.type
    })
    this.hslContainer.addEventListener("change", (e) => {
      this.updateHSL(e)
    })
    this.hex.addEventListener("change", (e) => {
      this.updateHex(e)
    })
  }
}
