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
    const channel = e.target.parentNode.previousSibling.previousSibling
    let maxvalue
    switch (channel) {
      case this.h:
        maxvalue = 359
        break
      case this.s:
      case this.l:
        maxvalue = 100
        break
      default:
        //rgba
        maxvalue = 255
    }

    const newValue = Math.floor(+channel.value)

    if (e.target.id === "inc" && newValue < maxvalue) {
      channel.value = newValue + 1
    } else if (e.target.id === "dec" && newValue > 0) {
      channel.value = newValue - 1
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

  handlePointerDown(e) {
    this.clickedCanvas = true
    const { offsetX, offsetY } = e
    this.selectSL(offsetX, offsetY)
  }

  handlePointerMove(e) {
    if (!this.clickedCanvas) {
      return
    }

    const rect = this.target.getBoundingClientRect()
    const canvasXOffset =
      rect.left - document.documentElement.getBoundingClientRect().left
    const canvasYOffset =
      rect.top - document.documentElement.getBoundingClientRect().top
    const { pageX, pageY } = e

    const x = pageX - canvasXOffset
    const y = pageY - canvasYOffset

    this.selectSL(
      Math.min(Math.max(x, 0), this.width),
      Math.min(Math.max(y, 0), this.height)
    )
  }

  handlePointerUp(e) {
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

  drawSelectorSides(context, pickerCircle, color, offset = 0) {
    const { x, y, width, height } = pickerCircle
    const lineCenterOffset = offset + 0.5
    // draw selector
    context.beginPath()
    //top
    context.moveTo(x, y - lineCenterOffset)
    context.lineTo(x + width, y - lineCenterOffset)
    //right
    context.moveTo(x + width + lineCenterOffset, y)
    context.lineTo(x + width + lineCenterOffset, y + height)
    //bottom
    context.moveTo(x, y + height + lineCenterOffset)
    context.lineTo(x + width, y + height + lineCenterOffset)
    //left
    context.moveTo(x - lineCenterOffset, y)
    context.lineTo(x - lineCenterOffset, y + height)
    //stroke path
    context.lineWidth = 1
    context.strokeStyle = color
    context.stroke()
    context.closePath()
  }

  drawSelector(context, pickerCircle) {
    const { x, y, width, height } = pickerCircle
    // draw selector
    this.drawSelectorSides(context, pickerCircle, "black")
    //draw contrasting outline
    this.drawSelectorSides(context, pickerCircle, "white", 1)
    //corners
    context.fillStyle = "white"
    context.fillRect(x - 1, y - 1, 1, 1)
    context.fillRect(x + width, y - 1, 1, 1)
    context.fillRect(x - 1, y + height, 1, 1)
    context.fillRect(x + width, y + height, 1, 1)
  }

  drawHSLGrad(hue) {
    const { context, height, width, pickerCircle } = this

    // draw HSL gradient
    for (let row = 0; row < height; row++) {
      const saturation = (row / height) * 100
      const grad = context.createLinearGradient(0, 0, width, 0)
      grad.addColorStop(0, `hsl(${hue}, 0%, ${saturation}%)`)
      grad.addColorStop(1, `hsl(${hue}, 100%, ${saturation}%)`)
      context.fillStyle = grad
      context.fillRect(0, row, width, 1)
    }

    this.calcSelector()
    this.drawSelector(context, pickerCircle)
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
      this.handlePointerDown(e)
    })
    this.target.addEventListener("pointermove", (e) => {
      this.handlePointerMove(e)
    })
    this.target.addEventListener("pointerup", (e) => {
      this.handlePointerUp(e)
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
