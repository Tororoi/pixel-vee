import { keys } from "../Shortcuts/keys.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { swatches } from "../Context/swatch.js"
import { renderRasterGUI } from "../GUI/raster.js"
import { consolidateLayers } from "../Canvas/layers.js"
import { getColor } from "../utils/canvasHelpers.js"
import { setColor } from "../Swatch/events.js"

//Eyedropper
//TODO: add magnifying glass view that shows zoomed in view of area being sampled
function eyedropperSteps() {
  //eyedropper helper function
  function sampleColor(x, y) {
    let newColor = getColor(x, y, state.colorLayerGlobal)
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
      consolidateLayers()
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
      //draw square
      renderRasterGUI(state, canvas, swatches)
      break
    default:
    //do nothing
  }
}

export const eyedropper = {
  name: "eyedropper",
  fn: eyedropperSteps,
  action: null,
  brushSize: 1,
  disabled: true,
  options: {},
  type: "utility",
}
