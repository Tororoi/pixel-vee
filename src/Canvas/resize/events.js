import { dom } from '../../Context/dom.js'
import { canvas } from '../../Context/canvas.js'
import { renderCanvas, resizeOffScreenCanvas } from '../render/index.js'
import { constrainElementOffsets } from '../../utils/constrainElementOffsets.js'

/**
 * Increment canvas dimensions values
 * @param {PointerEvent} e - The pointer event
 */
const handleIncrement = (e) => {
  let dimension = e.target.parentNode.previousSibling.previousSibling
  let max = 1024
  let min = 8
  if (e.target.id === 'inc') {
    let newValue = Math.floor(+dimension.value)
    if (newValue < max) {
      dimension.value = newValue + 1
    }
  } else if (e.target.id === 'dec') {
    let newValue = Math.floor(+dimension.value)
    if (newValue > min) {
      dimension.value = newValue - 1
    }
  }
}

/**
 * Increment values while rgb button is held down
 * @param {PointerEvent} e - The pointer event
 */
const handleSizeIncrement = (e) => {
  if (canvas.sizePointerState === 'pointerdown') {
    handleIncrement(e)
    window.setTimeout(() => handleSizeIncrement(e), 150)
  }
}

/**
 * Limit the min and max size of the canvas
 * @param {FocusEvent} e - The focus event
 */
const restrictSize = (e) => {
  const max = 1024
  const min = 8
  if (e.target.value > max) {
    e.target.value = max
  } else if (e.target.value < min) {
    e.target.value = min
  }
}

/**
 * Submit new dimensions for the offscreen canvas
 * @param {SubmitEvent} e - The submit event
 */
const handleDimensionsSubmit = (e) => {
  e.preventDefault()
  resizeOffScreenCanvas(dom.canvasWidth.value, dom.canvasHeight.value)
}

/**
 * Resize the onscreen canvas when adjusting the window size
 * UIEvent listener
 */
const resizeOnScreenCanvas = () => {
  //Keep canvas dimensions at 100% (requires css style width/ height 100%)
  canvas.vectorGuiCVS.width = canvas.vectorGuiCVS.offsetWidth * canvas.sharpness
  canvas.vectorGuiCVS.height =
    canvas.vectorGuiCVS.offsetHeight * canvas.sharpness
  canvas.vectorGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.selectionGuiCVS.width =
    canvas.selectionGuiCVS.offsetWidth * canvas.sharpness
  canvas.selectionGuiCVS.height =
    canvas.selectionGuiCVS.offsetHeight * canvas.sharpness
  canvas.selectionGuiCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.cursorCVS.width = canvas.cursorCVS.offsetWidth * canvas.sharpness
  canvas.cursorCVS.height = canvas.cursorCVS.offsetHeight * canvas.sharpness
  canvas.cursorCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  canvas.layers.forEach((layer) => {
    layer.onscreenCvs.width = layer.onscreenCvs.offsetWidth * canvas.sharpness
    layer.onscreenCvs.height = layer.onscreenCvs.offsetHeight * canvas.sharpness
    layer.onscreenCtx.setTransform(
      canvas.sharpness * canvas.zoom,
      0,
      0,
      canvas.sharpness * canvas.zoom,
      0,
      0,
    )
  })
  canvas.backgroundCVS.width =
    canvas.backgroundCVS.offsetWidth * canvas.sharpness
  canvas.backgroundCVS.height =
    canvas.backgroundCVS.offsetHeight * canvas.sharpness
  canvas.backgroundCTX.setTransform(
    canvas.sharpness * canvas.zoom,
    0,
    0,
    canvas.sharpness * canvas.zoom,
    0,
    0,
  )
  renderCanvas() // render all layers
  // reset positioning styles for free moving dialog boxes
  dom.toolboxContainer.style.left = ''
  dom.toolboxContainer.style.top = ''
  dom.sidebarContainer.style.left = ''
  dom.sidebarContainer.style.top = ''
  if (dom.colorPickerContainer.offsetHeight !== 0) {
    constrainElementOffsets(dom.colorPickerContainer)
  }
}

//====================================//
//=== * * * Event Listeners * * * ====//
//====================================//

// UI Canvas * //
window.addEventListener('resize', resizeOnScreenCanvas)

// * Canvas Size * //
dom.dimensionsForm.addEventListener('pointerdown', (e) => {
  canvas.sizePointerState = e.type
  handleSizeIncrement(e)
})
dom.dimensionsForm.addEventListener('pointerup', (e) => {
  canvas.sizePointerState = e.type
})
dom.dimensionsForm.addEventListener('pointerout', (e) => {
  canvas.sizePointerState = e.type
})
dom.dimensionsForm.addEventListener('submit', handleDimensionsSubmit)
dom.canvasWidth.addEventListener('blur', restrictSize)
dom.canvasHeight.addEventListener('blur', restrictSize)
dom.canvasSizeCancelBtn.addEventListener('click', () => {
  dom.sizeContainer.style.display = 'none'
})
