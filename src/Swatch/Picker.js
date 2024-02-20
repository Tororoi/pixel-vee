import {
  RGBToHSL,
  HSLToRGB,
  hexToRGB,
  RGBToHex,
  getLuminance,
} from "../utils/colorConversion.js"
import {
  calcHSLSelectorCoordinates,
  drawSelector,
  drawHSLGradient,
} from "../utils/pickerHelpers.js"
//TODO: (Middle Priority) Add "lock" toggle to luminance field.
//This will trigger the hsl grad to become a 2-dimensional gradient
//where every value has the same luminance. The hue slider can be adjusted
//to see the gradient for different hues at that same luminance.
export class Picker {
  constructor(target, width, height, initialColor) {
    this.initialColor = initialColor
    this.target = target
    this.width = width
    this.height = height
    this.target.width = width
    this.target.height = height
    //Get context
    this.context = this.target.getContext("2d", { willReadFrequently: true })
    //pointer
    this.pointerState = "none"
    //color selector circle
    this.pickerCircle = { x: 10, y: 10, width: 6, height: 6 }
    this.clickedCanvas = false
    //hue slider
    this.hueRange = document.getElementById("hueslider")
    //alpha slider
    this.alphaRange = document.getElementById("alphaslider")
    //*interface*//
    this.rgbaContainer = document.getElementById("rgba-container")
    this.r = document.getElementById("r")
    this.g = document.getElementById("g")
    this.b = document.getElementById("b")
    this.a = document.getElementById("a")
    this.hslContainer = document.getElementById("hsl-container")
    this.h = document.getElementById("h")
    this.s = document.getElementById("s")
    this.l = document.getElementById("l")
    this.hex = document.getElementById("hexcode")
    this.lumi = document.getElementById("luminance")
    //Colors
    this.oldcolor = document.getElementById("oldcolor-btn")
    this.newcolor = document.getElementById("newcolor-btn")
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
    this.alpha = initialColor.a
    this.hexcode = RGBToHex(this.rgb)
    this.luminance = getLuminance(this.rgb)
  }

  //===================================//
  //===== * * * Color Space * * * =====//
  //===================================//

  //* Keep color spaces in sync * //

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

  updateAlpha(e) {
    this.alpha = e.target.value
    this.a.value = e.target.value
    this.hexcode = this.hex.value = this.hexcode
    this.updateColor()
  }

  updateRGBA() {
    const red = +this.r.value
    const green = +this.g.value
    const blue = +this.b.value
    this.rgb = { red, green, blue }
    this.alpha = +this.a.value
    this.propogateRGBColorSpace()
  }

  updateHSL() {
    const hue = +this.h.value
    const saturation = +this.s.value
    const lightness = +this.l.value
    this.hsl = { hue, saturation, lightness }
    this.propogateHSLColorSpace()
  }

  updateHex() {
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
    drawHSLGradient(this.context, this.width, this.height, this.hsl.hue)
    this.pickerCircle = calcHSLSelectorCoordinates(
      this.pickerCircle,
      this.hsl,
      this.width,
      this.height
    )
    drawSelector(this.context, this.pickerCircle)
    //update interface values to match new color
    const { hue, saturation, lightness } = this.hsl
    const { red, green, blue } = this.rgb
    document.documentElement.style.setProperty(
      "--new-swatch-color",
      `${red},${green},${blue}`
    )
    document.documentElement.style.setProperty(
      "--new-swatch-alpha",
      `${this.alpha / 255}`
    )
    //hsl
    this.h.value = hue
    this.s.value = saturation
    this.l.value = lightness
    //rgb
    this.r.value = red
    this.g.value = green
    this.b.value = blue
    this.a.value = this.alpha
    this.hex.value = this.hexcode
    this.lumi.value = this.luminance
    //update hue slider
    this.hueRange.value = this.hsl.hue
    this.alphaRange.value = this.alpha
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
   * @param {PointerEvent} e - pointer down event
   */
  handleRGBIncrement(e) {
    if (this.pointerState === "pointerdown") {
      this.handleIncrement(e)
      this.updateRGBA(e)
      window.setTimeout(() => this.handleRGBIncrement(e), 150)
    }
  }

  /**
   * increment values while hsl button is held down
   * @param {PointerEvent} e - pointer down event
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

  handlePointerUp() {
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

  drawHueGrad() {
    //hue slider gradient
    this.hueRange.style.background =
      "linear-gradient(90deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)"
  }

  //* Update Picker *//
  //Called every time color picker is opened
  update(reference) {
    this.initialColor = reference
    this.rgb = { red: reference.r, green: reference.g, blue: reference.b }
    this.alpha = reference.a
    this.propogateRGBColorSpace()
    //set oldcolor
    // this.oldcolor.style.backgroundColor = reference.color
    document.documentElement.style.setProperty(
      "--old-swatch-color",
      `${reference.r},${reference.g},${reference.b}`
    )
    document.documentElement.style.setProperty(
      "--old-swatch-alpha",
      `${reference.a / 255}`
    )
  }

  //* Initial Build *//
  build() {
    //draw hue slider
    this.drawHueGrad()
    this.hueRange.addEventListener("input", (e) => {
      this.updateHue(e)
    })
    this.alphaRange.addEventListener("input", (e) => {
      this.updateAlpha(e)
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
      this.updateRGBA(e)
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
    this.oldcolor.addEventListener("pointerdown", () => {
      this.rgb = {
        red: this.initialColor.r,
        green: this.initialColor.g,
        blue: this.initialColor.b,
      }
      this.alpha = this.initialColor.a
      this.propogateRGBColorSpace()
    })
  }
}
