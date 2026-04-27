export const clipboardStore = $state({
  select: {
    boundaryBox: {
      xMin: null,
      yMin: null,
      xMax: null,
      yMax: null,
    },
    canvasBoundaryBox: {
      xMin: null,
      yMin: null,
      xMax: null,
      yMax: null,
    },
    selectProperties: {
      px1: null,
      py1: null,
      px2: null,
      py2: null,
    },
    canvas: null,
    imageData: null,
    vectors: {},
  },
  pastedImages: {},
  highestPastedImageKey: 0,
  currentPastedImageKey: null,
})
