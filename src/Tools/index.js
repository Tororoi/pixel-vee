import { brush } from "./brush.js"
import { line } from "./line.js"
import { select } from "./select.js"
import { move } from "./move.js"
import { fill } from "./fill.js"
import { quadCurve, cubicCurve } from "./curve.js"
import { ellipse } from "./ellipse.js"
import { eyedropper } from "./eyedropper.js"
import { grab } from "./grab.js"

//====================================//
//===== * * * Tools Object * * * =====//
//====================================//

//Tools
export const tools = {
  //Modify history Tool
  modify: {
    name: "modify",
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: "modify",
  },
  changeMode: {
    name: "changeMode",
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: "modify",
  },
  changeColor: {
    name: "changeColor",
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: "modify",
  },
  remove: {
    name: "remove",
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: "modify",
  },
  clear: {
    name: "clear",
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: "modify",
  },
  //Raster Tools
  brush,
  line,
  // shading: {
  // user selects hsl shading color which mixes with colors that the user draws on to create dynamic shading
  // },
  select,
  move,
  // gradient: {
  // Create a dithered gradient
  // },
  //Vector Tools
  fill,
  quadCurve,
  cubicCurve,
  ellipse,
  //Non-cursor tools
  addLayer: {
    name: "addLayer",
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: "settings",
  },
  removeLayer: {
    name: "removeLayer",
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: false,
    options: {},
    modes: {},
    type: "settings",
  },
  cut: {
    name: "cut",
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: true,
    options: {
      //copy vectors/ actions?
    },
    modes: {},
    type: "raster",
  },
  paste: {
    name: "paste",
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: true,
    options: {},
    modes: {},
    type: "raster",
  },
  vectorPaste: {
    name: "vectorPaste",
    fn: null,
    brushSize: null,
    brushType: null,
    brushDisabled: true,
    options: {},
    modes: {},
    type: "vector",
  },
  transform: {
    name: "transform",
    fn: null, //used for stretch and flip functionality
    brushSize: null,
    brushType: null,
    brushDisabled: true,
    options: {},
    modes: {},
    type: "raster",
  },
  //Utility Tools (does not affect timeline)
  eyedropper,
  grab,
  /**
   * perspective: {
   * set vanishing points.
   * Click to create a vanishing point with visible radius r.
   * Points are always visible even outside canvas area.
   * Clicking outside r will generate a new vanishing point.
   * Clicking inside r will select that vanishing point.
   * Hold shift to draw line from currently selected vanishing point to pointer location.
   * Hold control to view automatic perspective lines and click to make lines permanent.
   * NOTE: First iteration will not support curvilinear perspective. Can be approximated by combining multipoint perspective with drawing bezier curves from point to point
   * TODO: (Low Priority) Add toggle option to snap line/ curve endpoints to vanishing point if made inside vanishing points radius.
  }
   */
}
