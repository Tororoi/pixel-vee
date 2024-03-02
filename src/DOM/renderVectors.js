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
  state.undoStack.forEach((action, index) => {
    if (isValidVectorAction(action)) {
      //TODO: (High Priority) For each vector in the group action, render the vector as long as it is not removed
      //For each action.vectors (object), render the vector as long as it is not removed
      for (let vectorIndex in action.vectors) {
        if (!action.vectors[vectorIndex].removed) {
          renderVectorElement(action, action.vectors[vectorIndex])
        }
      }
    }
  })

  //active paste happening, disable vector interface
  if (canvas.pastedLayer) {
    dom.vectorsInterfaceContainer.classList.add("disabled")
  } else {
    dom.vectorsInterfaceContainer.classList.remove("disabled")
  }
}

/**
 * Check if action should be rendered in the vectors interface
 * @param {object} action - The action to be checked
 * @returns {boolean} - True if the action should be rendered
 */
const isValidVectorAction = (action) =>
  !action.removed &&
  !action.layer?.removed &&
  action.tool.type === "vector" &&
  (action.layer === canvas.currentLayer ||
    (action.layer === canvas.pastedLayer && canvas.currentLayer.isPreview))

/**
 * Render a vector element
 * @param {object} action - The action to be rendered
 * @param {object} vector - The vector to be rendered
 */
const renderVectorElement = (action, vector) => {
  // const isSelected = vector.index === state.currentVectorIndex
  const isSelected =
    !!state.selectedVectors[vector.index] ||
    vector.index === state.currentVectorIndex //TODO: (High Priority) Need way to mark selected vs current vector
  const vectorElement = createVectorElement(vector)

  const thumb = createThumbnailImage(action, vector, isSelected)
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
  const tool = createToolElement(vector.vectorProperties.type, isSelected)
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
 * Draw a vector vector onto the thumbnail canvas
 * @param {object} action - The action to be drawn
 * @param {object} vector - The vector to be drawn
 * @param {boolean} isSelected - True if the vector is selected
 */
const drawOnThumbnailContext = (action, vector, isSelected) => {
  let { minD, xOffset, yOffset } = calculateDrawingDimensions()

  canvas.thumbnailCTX.clearRect(
    0,
    0,
    canvas.thumbnailCVS.width,
    canvas.thumbnailCVS.height
  )
  canvas.thumbnailCTX.lineWidth = 3
  canvas.thumbnailCTX.fillStyle = isSelected
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

  let px1 = minD * (vector.vectorProperties.px1 + action.layer.x)
  let py1 = minD * (vector.vectorProperties.py1 + action.layer.y)
  let px2 = minD * (vector.vectorProperties.px2 + action.layer.x)
  let py2 = minD * (vector.vectorProperties.py2 + action.layer.y)
  let px3 = minD * (vector.vectorProperties.px3 + action.layer.x)
  let py3 = minD * (vector.vectorProperties.py3 + action.layer.y)
  let px4 = minD * (vector.vectorProperties.px4 + action.layer.x)
  let py4 = minD * (vector.vectorProperties.py4 + action.layer.y)
  switch (vector.vectorProperties.type) {
    case "fill":
      canvas.thumbnailCTX.arc(
        px1 + 0.5 + xOffset,
        py1 + 0.5 + yOffset,
        1,
        0,
        2 * Math.PI,
        true
      )
      break
    case "quadCurve":
      canvas.thumbnailCTX.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
      canvas.thumbnailCTX.quadraticCurveTo(
        px3 + 0.5 + xOffset,
        py3 + 0.5 + yOffset,
        px2 + 0.5 + xOffset,
        py2 + 0.5 + yOffset
      )
      break
    case "cubicCurve":
      canvas.thumbnailCTX.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
      canvas.thumbnailCTX.bezierCurveTo(
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
      canvas.thumbnailCTX.ellipse(
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

  canvas.thumbnailCTX.globalCompositeOperation = "xor"
  canvas.thumbnailCTX.stroke()
}

/**
 * Create the thumbnail and save as an image
 * @param {object} action - The action to be rendered
 * @param {object} vector - The vector to be rendered
 * @param {boolean} isSelected - True if the vector is selected
 * @returns {Image} - The created thumbnail image
 */
const createThumbnailImage = (action, vector, isSelected) => {
  drawOnThumbnailContext(action, vector, isSelected)
  let thumb = new Image()
  thumb.src = canvas.thumbnailCVS.toDataURL()
  thumb.alt = `thumb ${vector.index}`
  thumb.width = 202 * window.devicePixelRatio
  thumb.height = 86 * window.devicePixelRatio
  return thumb
}
