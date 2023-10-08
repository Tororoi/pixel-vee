import { dom } from "./dom.js"

//====================================//
//======== * * * State * * * =========//
//====================================//

export const swatches = {
  primary: {
    swatch: dom.swatch,
    color: { color: "rgba(0,0,0,1)", r: 0, g: 0, b: 0, a: 255 }, //default black. While drawing, always the color used
  },
  secondary: {
    swatch: dom.backSwatch,
    color: { color: "rgba(255,255,255,1)", r: 255, g: 255, b: 255, a: 255 }, //default white
  },
  palette: {},
  //Functions
}

dom.swatch.color = swatches.primary.color
dom.backSwatch.color = swatches.secondary.color
