function moveSteps() {
  // move contents of selection around canvas
  // default selection is entire canvas contents
  //move raster layer or reference layer
}

export const move = {
  name: "move",
  fn: moveSteps,
  action: null, //actionMove
  brushSize: 1,
  disabled: false,
  options: { magicWand: false },
  type: "raster",
}
