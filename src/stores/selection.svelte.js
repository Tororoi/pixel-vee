export const selectionStore = $state({
  properties: {
    px1: null,
    py1: null,
    px2: null,
    py2: null,
  },
  boundaryBox: {
    xMin: null,
    yMin: null,
    xMax: null,
    yMax: null,
  },
  previousBoundaryBox: null,
  maskSet: null,
  seenPixelsSet: null,
  pointsSet: null,
  pixelPoints: null,
  cornersSet: null,
  resetProperties() {
    this.properties = { px1: null, py1: null, px2: null, py2: null }
    this.maskSet = null
  },
  normalize() {
    const { px1, py1, px2, py2 } = { ...this.properties }
    this.properties.px1 = Math.min(px1, px2)
    this.properties.py1 = Math.min(py1, py2)
    this.properties.px2 = Math.max(px2, px1)
    this.properties.py2 = Math.max(py2, py1)
  },
  resetBoundaryBox() {
    this.boundaryBox = { xMin: null, yMin: null, xMax: null, yMax: null }
  },
  setBoundaryBox(selectProperties) {
    if (
      selectProperties.px1 !== null &&
      selectProperties.py1 !== null &&
      selectProperties.px2 !== null &&
      selectProperties.py2 !== null
    ) {
      this.boundaryBox.xMin = Math.min(
        selectProperties.px1,
        selectProperties.px2,
      )
      this.boundaryBox.yMin = Math.min(
        selectProperties.py1,
        selectProperties.py2,
      )
      this.boundaryBox.xMax = Math.max(
        selectProperties.px2,
        selectProperties.px1,
      )
      this.boundaryBox.yMax = Math.max(
        selectProperties.py2,
        selectProperties.py1,
      )
    } else {
      this.resetBoundaryBox()
    }
  },
})
