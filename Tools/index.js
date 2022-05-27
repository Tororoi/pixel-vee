//Tools
export const tools = {
  brush: {
    name: "brush",
    fn: drawSteps,
    brushSize: 1,
    disabled: false,
    options: ["perfect"],
  },
  //FIX: allow replace to use different brush sizes
  replace: {
    name: "replace",
    fn: replaceSteps,
    brushSize: 1,
    disabled: false,
    options: ["perfect"],
  },
  select: {
    name: "select",
    fn: selectSteps,
    brushSize: 1,
    disabled: false,
    options: ["magic wand"],
  },
  // shading: {
  // user selects hsl shading color which mixes with colors that the user draws on to create dynamic shading
  // },
  line: {
    name: "line",
    fn: lineSteps,
    brushSize: 1,
    disabled: false,
    options: [],
  },
  fill: {
    name: "fill",
    fn: fillSteps,
    brushSize: 1,
    disabled: true,
    options: ["contiguous"],
  },
  // gradient: {
  // Create a dithered gradient
  // },
  curve: {
    name: "curve",
    fn: curveSteps,
    brushSize: 1,
    disabled: false,
    options: [],
  },
  // shapes: {
  // square, circle, and custom saved shape?
  // },
  picker: {
    name: "picker",
    fn: pickerSteps,
    brushSize: 1,
    disabled: true,
    options: [],
  },
  grab: {
    name: "grab",
    fn: grabSteps,
    brushSize: 1,
    disabled: true,
    options: [],
  },
  // move: {
  // Move a layer's coordinates independent of other layers
  // }
}
