import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { consolidateLayers } from "../Canvas/layers.js"
import { getColor } from "../utils/imageDataHelpers.js"
import { setColor } from "../Swatch/events.js"

/**
 * Eyedropper
 * TODO: (Low Priority) add magnifying glass view that shows zoomed in view of area being sampled
 */
function eyedropperSteps() {
  /**
   * @param {number} x - (Integer)
   * @param {number} y - (Integer)
   */
  function sampleColor(x, y) {
    let newColor = getColor(state.colorLayerGlobal, x, y)
    //not simply passing whole color in until random color function is refined
    setColor(
      newColor.r,
      newColor.g,
      newColor.b,
      newColor.a,
      swatches.primary.swatch
    )
  }
  switch (canvas.pointerEvent) {
    case "pointerdown":
      //get imageData
      consolidateLayers(true, true)
      state.colorLayerGlobal = canvas.offScreenCTX.getImageData(
        0,
        0,
        canvas.offScreenCVS.width,
        canvas.offScreenCVS.height
      )
      //set color
      sampleColor(state.cursorX, state.cursorY)
      break
    case "pointermove":
      //normalize pointermove to pixelgrid, get color here too
      //get color
      sampleColor(state.cursorX, state.cursorY)
      break
    default:
    //do nothing
  }
}

/**
 * Eyedropper Tool
 */
export const eyedropper = {
  name: "eyedropper",
  fn: eyedropperSteps,
  brushSize: 1,
  brushType: "circle",
  brushDisabled: true,
  options: {},
  modes: {},
  type: "utility",
  cursor: "none",
  activeCursor: "none",
}
