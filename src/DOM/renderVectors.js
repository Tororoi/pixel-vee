import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { getAngle } from "../utils/trig.js"
import {
  createModeElement,
  createToolElement,
  createColorElement,
  createHideElement,
  createTrashElement,
} from "../utils/actionInterfaceHelpers.js"

/**
 * Render vectors interface in DOM
 */
export const renderVectorsToDOM = () => {
  dom.vectorsThumbnails.innerHTML = ""
  for (let vector of Object.values(state.vector.all)) {
    if (isValidVector(vector)) {
      renderVectorElement(vector)
    }
  }

  //active paste happening, disable vector interface
  if (canvas.pastedLayer) {
    dom.vectorsInterfaceContainer.classList.add("disabled")
  } else {
    dom.vectorsInterfaceContainer.classList.remove("disabled")
  }
}

/**
 * Check if action should be rendered in the vectors interface
 * @param {object} vector - The vector to be checked
 * @returns {boolean} - True if the vector should be rendered
 */
const isValidVector = (vector) =>
  !vector.removed &&
  !vector.layer?.removed &&
  state.timeline.undoStack.includes(vector.action) &&
  (vector.layer === canvas.currentLayer ||
    (vector.layer === canvas.pastedLayer && canvas.currentLayer.isPreview))

/**
 * Render a vector element
 * @param {object} vector - The vector to be rendered
 */
const renderVectorElement = (vector) => {
  // const isSelected = vector.index === state.vector.currentIndex
  const isSelected = state.vector.selectedIndices.has(vector.index) //TODO: (Low Priority) Need better way to mark selected vs current vector in vector interface
  const isCurrentVector = vector.index === state.vector.currentIndex
  const vectorElement = createVectorElement(vector)

  const thumb = createThumbnailImage(vector, isSelected)
  vectorElement.appendChild(thumb)

  //left side icons
  const left = document.createElement("div")
  left.className = "left"
  Object.keys(vector.modes).forEach((modeKey) => {
    const mode = createModeElement(modeKey, vector.modes[modeKey])
    left.appendChild(mode)
  })
  vectorElement.appendChild(left)

  //right side icons
  const tool = createToolElement(vector.vectorProperties.type, isCurrentVector)
  vectorElement.appendChild(tool)

  const color = createColorElement(vector.color)
  vectorElement.appendChild(color)

  const hide = createHideElement(vector.hidden, "Hide/Show Vector")
  vectorElement.appendChild(hide)

  const trash = createTrashElement("Remove Vector")
  vectorElement.appendChild(trash)

  if (isSelected) {
    // tool.style.background = "rgb(255, 255, 255)"
    vectorElement.style.background = "rgb(0, 0, 0)"
  } else {
    vectorElement.style.background = "rgb(51, 51, 51)"
  }

  dom.vectorsThumbnails.appendChild(vectorElement)
  //associate object
  vectorElement.vectorObj = vector
}

/**
 * @param {object} vector - The vector to be rendered
 * @returns {Element} - The created vector element
 */
const createVectorElement = (vector) => {
  let vectorElement = document.createElement("div")
  vectorElement.className = `vector ${vector.index}`
  vectorElement.id = vector.index
  return vectorElement
}

// * Thumbnail * //

/**
 * Calculate the multiplier and offsets for transposing the main canvas onto the thumbnail canvas
 * @returns {object} - The calculated dimensions
 */
const calculateDrawingDimensions = () => {
  let border = 32
  let wd =
    canvas.thumbnailCVS.width /
    canvas.sharpness /
    (canvas.offScreenCVS.width + border)
  let hd =
    canvas.thumbnailCVS.height /
    canvas.sharpness /
    (canvas.offScreenCVS.height + border)
  let minD = Math.min(wd, hd)
  let xOffset =
    (canvas.thumbnailCVS.width / 2 -
      (minD * canvas.offScreenCVS.width * canvas.sharpness) / 2) /
    canvas.sharpness
  let yOffset =
    (canvas.thumbnailCVS.height / 2 -
      (minD * canvas.offScreenCVS.height * canvas.sharpness) / 2) /
    canvas.sharpness

  return { minD, xOffset, yOffset }
}

/**
 * Draw a vector onto a canvas context (shared thumbnailCTX by default, or a
 * per-vector ctx when creating individual thumbnail elements).
 * @param {object} vector - The vector to be drawn
 * @param {boolean} isSelected - True if the vector is selected
 * @param {CanvasRenderingContext2D} ctx - Target context (defaults to shared thumbnailCTX)
 */
const drawOnThumbnailContext = (vector, isSelected, ctx = canvas.thumbnailCTX) => {
  let { minD, xOffset, yOffset } = calculateDrawingDimensions()

  ctx.clearRect(
    0,
    0,
    canvas.thumbnailCVS.width,
    canvas.thumbnailCVS.height
  )
  ctx.lineWidth = 3
  ctx.fillStyle = isSelected
    ? "rgb(0, 0, 0)"
    : "rgb(51, 51, 51)"
  ctx.fillRect(
    0,
    0,
    canvas.thumbnailCVS.width,
    canvas.thumbnailCVS.height
  )
  ctx.clearRect(
    xOffset,
    yOffset,
    minD * canvas.offScreenCVS.width,
    minD * canvas.offScreenCVS.height
  )

  ctx.strokeStyle = "black"
  ctx.beginPath()

  let px1 = minD * (vector.vectorProperties.px1 + vector.layer.x)
  let py1 = minD * (vector.vectorProperties.py1 + vector.layer.y)
  let px2 = minD * (vector.vectorProperties.px2 + vector.layer.x)
  let py2 = minD * (vector.vectorProperties.py2 + vector.layer.y)
  let px3 = minD * (vector.vectorProperties.px3 + vector.layer.x)
  let py3 = minD * (vector.vectorProperties.py3 + vector.layer.y)
  let px4 = minD * (vector.vectorProperties.px4 + vector.layer.x)
  let py4 = minD * (vector.vectorProperties.py4 + vector.layer.y)
  switch (vector.vectorProperties.type) {
    case "fill":
      ctx.arc(
        px1 + 0.5 + xOffset,
        py1 + 0.5 + yOffset,
        1,
        0,
        2 * Math.PI,
        true
      )
      break
    case "line":
      ctx.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
      ctx.lineTo(px2 + 0.5 + xOffset, py2 + 0.5 + yOffset)
      break
    case "quadCurve":
      ctx.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
      ctx.quadraticCurveTo(
        px3 + 0.5 + xOffset,
        py3 + 0.5 + yOffset,
        px2 + 0.5 + xOffset,
        py2 + 0.5 + yOffset
      )
      break
    case "cubicCurve":
      ctx.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
      ctx.bezierCurveTo(
        px3 + 0.5 + xOffset,
        py3 + 0.5 + yOffset,
        px4 + 0.5 + xOffset,
        py4 + 0.5 + yOffset,
        px2 + 0.5 + xOffset,
        py2 + 0.5 + yOffset
      )
      break
    case "ellipse": {
      let angle = getAngle(
        vector.vectorProperties.px2 - vector.vectorProperties.px1,
        vector.vectorProperties.py2 - vector.vectorProperties.py1
      )
      ctx.ellipse(
        px1 + xOffset,
        py1 + yOffset,
        minD * vector.vectorProperties.radA,
        minD * vector.vectorProperties.radB,
        angle,
        0,
        2 * Math.PI
      )
      break
    }
    // Add more cases if there are other drawing tools.
  }

  ctx.globalCompositeOperation = "xor"
  ctx.stroke()
}

/**
 * Create a thumbnail canvas element for the given vector.
 * Draws directly into a per-vector <canvas> instead of encoding the shared
 * thumbnailCVS to a base64 data URL, eliminating the expensive toDataURL() call.
 * @param {object} vector - The vector to be rendered
 * @param {boolean} isSelected - True if the vector is selected
 * @returns {HTMLCanvasElement} - The created thumbnail canvas
 */
const createThumbnailImage = (vector, isSelected) => {
  const cvs = document.createElement("canvas")
  cvs.width = canvas.thumbnailCVS.width
  cvs.height = canvas.thumbnailCVS.height
  const ctx = cvs.getContext("2d")
  ctx.scale(canvas.sharpness, canvas.sharpness)
  drawOnThumbnailContext(vector, isSelected, ctx)
  return cvs
}
