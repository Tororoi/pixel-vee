import { dom } from "./dom.js"

//====================================//
//======= * * * Swatches * * * =======//
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
  palette: [
    { color: "rgba(0,0,0,1)", r: 0, g: 0, b: 0, a: 255 },
    { color: "rgba(255,255,255,1)", r: 255, g: 255, b: 255, a: 255 },
  ],
  activePaletteIndex: null,
  selectedPaletteIndex: null,
  paletteMode: "select", //select, edit, remove
  //Functions
}
//TODO: Add Mixing palette that consists of a small canvas with basic paint, sample and fill erase tools.
//TODO: Add color mixer that consists of a small canvas that can be painted upon and cleared. At any time the user can click "Mix" and the colors on the canvas will be used to generate a mixed color.

dom.swatch.color = swatches.primary.color
dom.backSwatch.color = swatches.secondary.color
