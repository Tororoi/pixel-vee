import { dom } from "../Context/dom.js"
import { state } from "../Context/state.js"
import { canvas } from "../Context/canvas.js"
import { getAngle } from "../utils/trig.js"
import {
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
  state.undoStack.forEach((action, index) => {
    if (isValidAction(action)) {
      action.index = index
      renderVector(action)
    }
  })
}

/**
 * Check if action should be rendered in the vectors interface
 * @param {Object} action
 * @returns {Boolean}
 */
const isValidAction = (action) =>
  !action.removed && !action.layer?.removed && action.tool.type === "vector"

/**
 * Render a vector element
 * @param {Object} action
 */
const renderVector = (action) => {
  const vectorElement = createVectorElement(action)

  const thumb = createThumbnailImage(action)
  vectorElement.appendChild(thumb)

  const tool = createToolElement(action)
  vectorElement.appendChild(tool)

  const color = createColorElement(action)
  vectorElement.appendChild(color)

  const hide = createHideElement(action.hidden)
  vectorElement.appendChild(hide)

  const trash = createTrashElement()
  vectorElement.appendChild(trash)

  if (action.index === canvas.currentVectorIndex) {
    tool.style.background = "rgb(255, 255, 255)"
    vectorElement.style.background = "rgb(0, 0, 0)"
  } else {
    vectorElement.style.background = "rgb(51, 51, 51)"
  }

  dom.vectorsThumbnails.appendChild(vectorElement)
  //associate object
  vectorElement.vectorObj = action
}

/**
 * @param {Object} action
 * @returns {Element}
 */
const createVectorElement = (action) => {
  let vectorElement = document.createElement("div")
  vectorElement.className = `vector ${action.index}`
  vectorElement.id = action.index
  return vectorElement
}

// * Thumbnail * //

/**
 * Calculate the multiplier and offsets for transposing the main canvas onto the thumbnail canvas
 * @returns {Object}
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
 * Draw a vector action onto the thumbnail canvas
 * @param {Object} action
 */
const drawOnThumbnailContext = (action) => {
  let { minD, xOffset, yOffset } = calculateDrawingDimensions()

  canvas.thumbnailCTX.clearRect(
    0,
    0,
    canvas.thumbnailCVS.width,
    canvas.thumbnailCVS.height
  )
  canvas.thumbnailCTX.lineWidth = 2
  canvas.thumbnailCTX.fillStyle =
    action.index === canvas.currentVectorIndex
      ? "rgb(0, 0, 0)"
      : "rgb(51, 51, 51)"
  canvas.thumbnailCTX.fillRect(
    0,
    0,
    canvas.thumbnailCVS.width,
    canvas.thumbnailCVS.height
  )
  canvas.thumbnailCTX.clearRect(
    xOffset,
    yOffset,
    minD * canvas.offScreenCVS.width,
    minD * canvas.offScreenCVS.height
  )

  canvas.thumbnailCTX.strokeStyle = "black" // This can be adjusted based on your requirements.
  canvas.thumbnailCTX.beginPath()

  switch (action.tool.name) {
    case "fill":
      canvas.thumbnailCTX.arc(
        minD * action.properties.vectorProperties.px1 + 0.5 + xOffset,
        minD * action.properties.vectorProperties.py1 + 0.5 + yOffset,
        1,
        0,
        2 * Math.PI,
        true
      )
      break
    case "quadCurve":
      canvas.thumbnailCTX.moveTo(
        minD * action.properties.vectorProperties.px1 + 0.5 + xOffset,
        minD * action.properties.vectorProperties.py1 + 0.5 + yOffset
      )
      canvas.thumbnailCTX.quadraticCurveTo(
        minD * action.properties.vectorProperties.px3 + 0.5 + xOffset,
        minD * action.properties.vectorProperties.py3 + 0.5 + yOffset,
        minD * action.properties.vectorProperties.px2 + 0.5 + xOffset,
        minD * action.properties.vectorProperties.py2 + 0.5 + yOffset
      )
      break
    case "cubicCurve":
      canvas.thumbnailCTX.moveTo(
        minD * action.properties.vectorProperties.px1 + 0.5 + xOffset,
        minD * action.properties.vectorProperties.py1 + 0.5 + yOffset
      )
      canvas.thumbnailCTX.bezierCurveTo(
        minD * action.properties.vectorProperties.px3 + 0.5 + xOffset,
        minD * action.properties.vectorProperties.py3 + 0.5 + yOffset,
        minD * action.properties.vectorProperties.px4 + 0.5 + xOffset,
        minD * action.properties.vectorProperties.py4 + 0.5 + yOffset,
        minD * action.properties.vectorProperties.px2 + 0.5 + xOffset,
        minD * action.properties.vectorProperties.py2 + 0.5 + yOffset
      )
      break
    case "ellipse":
      let angle = getAngle(
        action.properties.vectorProperties.px2 -
          action.properties.vectorProperties.px1,
        action.properties.vectorProperties.py2 -
          action.properties.vectorProperties.py1
      )
      canvas.thumbnailCTX.ellipse(
        minD * action.properties.vectorProperties.px1 + xOffset,
        minD * action.properties.vectorProperties.py1 + yOffset,
        minD * action.properties.vectorProperties.radA,
        minD * action.properties.vectorProperties.radB,
        angle,
        0,
        2 * Math.PI
      )
      break
    // Add more cases if there are other drawing tools.
  }

  canvas.thumbnailCTX.globalCompositeOperation = "xor"
  canvas.thumbnailCTX.stroke()
}

/**
 * Create the thumbnail and save as an image
 * @param {Object} action
 * @returns {Image}
 */
const createThumbnailImage = (action) => {
  drawOnThumbnailContext(action)
  let thumb = new Image()
  thumb.src = canvas.thumbnailCVS.toDataURL()
  thumb.alt = `thumb ${action.index}`
  return thumb
}
