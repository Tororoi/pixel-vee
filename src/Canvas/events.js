import { dom } from '../Context/dom.js'
import {
  MINIMUM_DIMENSION,
  MAXIMUM_DIMENSION,
  CURVE_TYPES,
} from '../utils/constants.js'
import { keys } from '../Shortcuts/keys.js'
import { globalState } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { renderCanvas, resizeOffScreenCanvas } from '../Canvas/render.js'
import {
  renderLayersToDOM,
  renderVectorsToDOM,
  renderVectorSettingsToDOM,
  initVectorDitherPicker,
  updateVectorDitherPreview,
  updateVectorDitherPickerColors,
  updateVectorDitherControls,
} from '../DOM/render.js'
import {
  removeActionVector,
  changeActionVectorMode,
  changeActionVectorBrushSize,
  changeActionVectorDitherPattern,
  changeActionVectorDitherOffset,
} from '../Actions/modifyTimeline/modifyTimeline.js'
import { vectorGui } from '../GUI/vector.js'
import { initializeColorPicker } from '../Swatch/events.js'
import { constrainElementOffsets } from '../utils/constrainElementOffsets.js'
// import { dragStart, dragMove, dragStop } from "../utils/drag.js"
import {
  actionSelectVector,
  actionDeselectVector,
  actionDeselect,
} from '../Actions/nonPointer/selectionActions.js'
import {
  addReferenceLayer,
  addRasterLayer,
  removeLayer,
} from '../Actions/layer/layerActions.js'
import { createPreviewLayer } from './layers.js'
import {
  applyFromInputs,
  applyResize,
  setAnchor,
  deactivateResizeOverlay,
} from './resizeOverlay.js'
import { switchTool } from '../Tools/toolbox.js'
import { changeActionVectorCurveType } from '../Actions/modifyTimeline/modifyTimeline.js'

//====================================//
//==== * * * Canvas Resize * * * =====//
//====================================//

/**
 * Increment canvas dimensions values
 * @param {PointerEvent} e - The pointer event
 */
const handleIncrement = (e) => {
  let dimension = e.target.parentNode.previousSibling.previousSibling
  if (e.target.id === 'inc') {
    let newValue = Math.floor(+dimension.value)
    if (newValue < MAXIMUM_DIMENSION) {
      dimension.value = newValue + 1
    }
  } else if (e.target.id === 'dec') {
    let newValue = Math.floor(+dimension.value)
    if (newValue > MINIMUM_DIMENSION) {
      dimension.value = newValue - 1
    }
  }
  if (globalState.canvas.resizeOverlayActive) {
    applyFromInputs(+dom.canvasWidth.value, +dom.canvasHeight.value)
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
  if (e.target.value > MAXIMUM_DIMENSION) {
    e.target.value = MAXIMUM_DIMENSION
  } else if (e.target.value < MINIMUM_DIMENSION) {
    e.target.value = MINIMUM_DIMENSION
  }
}

/**
 * Submit new dimensions for the offscreen canvas
 * @param {SubmitEvent} e - The submit event
 */
const handleDimensionsSubmit = (e) => {
  e.preventDefault()
  if (globalState.canvas.resizeOverlayActive) {
    applyResize()
  } else {
    resizeOffScreenCanvas(dom.canvasWidth.value, dom.canvasHeight.value)
  }
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
  canvas.resizeOverlayCVS.width =
    canvas.resizeOverlayCVS.offsetWidth * canvas.sharpness
  canvas.resizeOverlayCVS.height =
    canvas.resizeOverlayCVS.offsetHeight * canvas.sharpness
  canvas.resizeOverlayCTX.setTransform(
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
  if (dom.toolboxContainer) {
    dom.toolboxContainer.style.left = ''
    dom.toolboxContainer.style.top = ''
  }
  if (dom.sidebarContainer) {
    dom.sidebarContainer.style.left = ''
    dom.sidebarContainer.style.top = ''
  }
  if (dom.colorPickerContainer && dom.colorPickerContainer.offsetHeight !== 0) {
    constrainElementOffsets(dom.colorPickerContainer)
  }
}

//====================================//
//======== * * * Layers * * * ========//
//====================================//

/**
 * Clicking on a layer in the layers interface
 * @param {PointerEvent} e - The pointer event
 */
function layerInteract(e) {
  if (canvas.pastedLayer) {
    e.preventDefault()
    //if there is a pasted layer, temporary layer is active and layers configuration should not be messed with
    return
  }
  let layer = e.target.closest('.layer').layerObj
  //toggle visibility
  if (e.target.className.includes('eyeopen')) {
    e.target.classList.remove('eyeopen')
    e.target.classList.add('eyeclosed')
    layer.hidden = true
  } else if (e.target.className.includes('eyeclosed')) {
    e.target.classList.remove('eyeclosed')
    e.target.classList.add('eyeopen')
    layer.hidden = false
  } else if (e.target.className.includes('gear')) {
    //open settings dialog
    //set top offset of layer settings container to match
    if (
      dom.layerSettingsContainer.style.display === 'flex' &&
      // && layer settings layer is the same as the one that was clicked
      dom.layerSettingsContainer.layerObj === layer
    ) {
      dom.layerSettingsContainer.style.display = 'none'
      dom.layerSettingsContainer.layerObj = null
    } else {
      dom.layerSettingsContainer.style.display = 'flex'
      dom.layerSettingsContainer.layerObj = layer
    }
  } else {
    //TODO: (Low Priority) allow selecting multiple layers for moving purposes only
    //select current layer
    if (layer !== canvas.currentLayer) {
      if (canvas.currentLayer.type === 'reference') {
        globalState.deselect()
      }
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = false
      })
      canvas.currentLayer = layer
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
      })
      vectorGui.reset()
      vectorGui.render()
      if (layer.type === 'reference') {
        switchTool('move')
      }
      renderLayersToDOM()
      renderVectorsToDOM()
    }
  }
  renderCanvas(layer)
}

/**
 * Start dragging a layer in the layers interface
 * @param {DragEvent} e - The drag event
 */
function dragLayerStart(e) {
  if (canvas.pastedLayer) {
    e.preventDefault()
    //if there is a pasted layer, temporary layer is active and layers configuration should not be messed with
    return
  }
  let layer = e.target.closest('.layer').layerObj
  let index = canvas.layers.indexOf(layer)
  //pass index through event
  e.dataTransfer.setData('text', index)
  e.target.style.boxShadow =
    'inset 2px 0 rgb(131, 131, 131), inset -2px 0 rgb(131, 131, 131), inset 0 -2px rgb(131, 131, 131), inset 0 2px rgb(131, 131, 131)'
}

/**
 * Prevent default behavior for drag over
 * @param {DragEvent} e - The drag event
 */
function dragLayerOver(e) {
  e.preventDefault()
}

/**
 * Dragging a layer into another layer's space
 * @param {DragEvent} e - The drag event
 */
function dragLayerEnter(e) {
  if (e.target.className.includes('layer')) {
    e.target.style.boxShadow =
      'inset 2px 0 rgb(255, 255, 255), inset -2px 0 rgb(255, 255, 255), inset 0 -2px rgb(255, 255, 255), inset 0 2px rgb(255, 255, 255)'
  }
}

/**
 * Dragging a layer out of another layer's space
 * @param {DragEvent} e - The drag event
 */
function dragLayerLeave(e) {
  if (e.target.className.includes('layer')) {
    e.target.style.boxShadow =
      'inset 2px 0 rgb(131, 131, 131), inset -2px 0 rgb(131, 131, 131), inset 0 -2px rgb(131, 131, 131), inset 0 2px rgb(131, 131, 131)'
  }
}

/**
 * Drop a layer into another layer's space and reorder layers to match
 * @param {DragEvent} e - The drag event
 */
function dropLayer(e) {
  let targetLayer = e.target.closest('.layer').layerObj
  let draggedIndex = parseInt(e.dataTransfer.getData('text'))
  let heldLayer = canvas.layers[draggedIndex]
  //TODO: (Low Priority) should layer order change be added to timeline?
  if (e.target.className.includes('layer') && targetLayer !== heldLayer) {
    for (let i = 0; i < dom.layersContainer.children.length; i += 1) {
      if (dom.layersContainer.children[i] === e.target) {
        let newIndex = canvas.layers.indexOf(
          dom.layersContainer.children[i].layerObj,
        )
        canvas.layers.splice(draggedIndex, 1)
        canvas.layers.splice(newIndex, 0, heldLayer)

        // reorder layer canvases in DOM
        dom.canvasLayers.removeChild(heldLayer.onscreenCvs) // remove the dragged canvas
        if (newIndex >= dom.canvasLayers.children.length) {
          // if newIndex is at or beyond the end, append
          dom.canvasLayers.appendChild(heldLayer.onscreenCvs)
        } else {
          // otherwise, insert before the canvas at the new index
          dom.canvasLayers.insertBefore(
            heldLayer.onscreenCvs,
            dom.canvasLayers.children[newIndex],
          )
        }
      }
    }
    renderLayersToDOM()
  }
}

/**
 * Stop dragging a layer
 * @param {DragEvent} _e - The drag event (unused)
 */
function dragLayerEnd(_e) {
  renderLayersToDOM()
}

//====================================//
//======= * * * Vectors * * * ========//
//====================================//

/**
 * Clicking on a vector in the vectors interface
 * @param {PointerEvent} e - The pointer event
 */
function vectorInteract(e) {
  if (canvas.pastedLayer) {
    e.preventDefault()
    //if there is a pasted layer, temporary layer is active and vectors configuration should not be messed with
    return
  }
  let vector = e.target.closest('.vector').vectorObj
  if (e.target.className.includes('eraser')) {
    //change mode
    toggleVectorMode(vector, 'eraser')
  } else if (e.target.className.includes('inject')) {
    //change mode
    toggleVectorMode(vector, 'inject')
  } else if (e.target.className.includes('twoColor')) {
    //change mode
    toggleVectorMode(vector, 'twoColor')
  } else if (e.target.className.includes('actionColor')) {
    //change color
    e.target.color = vector.color
    e.target.vector = vector
    initializeColorPicker(e.target)
  } else if (e.target.className.includes('eyeopen')) {
    //toggle visibility
    e.target.classList.remove('eyeopen')
    e.target.classList.add('eyeclosed')
    vector.hidden = true
    renderCanvas(vector.layer, true)
  } else if (e.target.className.includes('eyeclosed')) {
    //toggle visibility
    e.target.classList.remove('eyeclosed')
    e.target.classList.add('eyeopen')
    vector.hidden = false
    renderCanvas(vector.layer, true)
  } else if (e.target.className.includes('trash')) {
    //remove vector
    removeVector(vector)
  } else if (e.target.className.includes('gear')) {
    //open/close vector settings dialog
    const domVector = e.target.closest('.vector')
    if (
      dom.vectorSettingsContainer.style.display === 'flex' &&
      dom.vectorSettingsContainer.vectorObj === vector
    ) {
      dom.vectorSettingsContainer.style.display = 'none'
      dom.vectorSettingsContainer.vectorObj = null
    } else {
      dom.vectorSettingsContainer.style.display = 'flex'
      dom.vectorSettingsContainer.vectorObj = vector
      renderVectorSettingsToDOM(domVector)
    }
  } else {
    //select current vector
    //Only manipulate timeline if selection is happening
    if (keys.ShiftLeft || keys.ShiftRight) {
      if (!globalState.vector.selectedIndices.has(vector.index)) {
        //select if shift key held down
        actionSelectVector(vector.index)
        // enableActionsForSelection()
      } else {
        actionDeselectVector(vector.index)
      }
    } else if (globalState.vector.selectedIndices.size > 0) {
      actionDeselect()
    }
    if (vector.index !== globalState.vector.currentIndex) {
      //switch tool
      switchTool(vector.vectorProperties.tool)
      // vectorGui.reset()
      vectorGui.setVectorProperties(vector)
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = false
      })
      canvas.currentLayer = vector.layer
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
      })
    }
 //If code reaches this case, either vector is selected or is current vector
    vectorGui.render()
    renderLayersToDOM()
    renderVectorsToDOM()
  }
}

/**
 * Mark a vector action as removed
 * @param {object} vector - The vector to be removed
 */
function removeVector(vector) {
  vector.removed = true
  if (globalState.vector.currentIndex === vector.index) {
    vectorGui.reset()
  }
  renderCanvas(vector.layer, true)
  removeActionVector(vector)

  globalState.clearRedoStack()
  renderVectorsToDOM()
}

/**
 * Change a vector action's modes
 * @param {object} vector - The vector to be modified
 * @param {string} modeKey - The mode to be modified
 */
function toggleVectorMode(vector, modeKey) {
  let oldModes = { ...vector.modes }
  vector.modes[modeKey] = !vector.modes[modeKey]
  //resolve conflicting modes
  if (vector.modes[modeKey]) {
    if (modeKey === 'eraser' && vector.modes.inject) {
      vector.modes.inject = false
    } else if (modeKey === 'inject' && vector.modes.eraser) {
      vector.modes.eraser = false
    }
  }
  let newModes = { ...vector.modes }
  renderCanvas(vector.layer, true)
  changeActionVectorMode(vector, oldModes, newModes)

  globalState.clearRedoStack()
  renderVectorsToDOM()
}

//===================================//
//=== * * * Initialization * * * ====//
//===================================//

//Initialize first layer
addRasterLayer()
canvas.currentLayer = canvas.layers[0]
//Initialize offset, must be integer
canvas.xOffset = Math.round(
  (canvas.currentLayer.onscreenCvs.width / canvas.sharpness / canvas.zoom -
    canvas.offScreenCVS.width) /
    2,
)
canvas.yOffset = Math.round(
  (canvas.currentLayer.onscreenCvs.height / canvas.sharpness / canvas.zoom -
    canvas.offScreenCVS.height) /
    2,
)
canvas.previousXOffset = canvas.xOffset
canvas.previousYOffset = canvas.yOffset
renderCanvas(canvas.currentLayer)
// React components read canvas.layers / swatches directly via useAppState()

//Initialize temp layer, not added to layers array
canvas.tempLayer = createPreviewLayer()

//===================================//
//=== * * * Event Listeners * * * ===//
//===================================//

// UI Canvas * //
window.addEventListener('resize', resizeOnScreenCanvas)

// * Canvas Size * — handled by CanvasSizeDialog React component; guard until migrated
dom.dimensionsForm?.addEventListener('pointerdown', (e) => {
  canvas.sizePointerState = e.type
  handleSizeIncrement(e)
})
dom.dimensionsForm?.addEventListener('pointerup', (e) => {
  canvas.sizePointerState = e.type
})
dom.dimensionsForm?.addEventListener('pointerout', (e) => {
  canvas.sizePointerState = e.type
})
dom.dimensionsForm?.addEventListener('submit', handleDimensionsSubmit)
dom.canvasWidth?.addEventListener('blur', restrictSize)
dom.canvasHeight?.addEventListener('blur', restrictSize)
dom.canvasSizeCancelBtn?.addEventListener('click', () => {
  deactivateResizeOverlay()
  if (dom.sizeContainer) dom.sizeContainer.style.display = 'none'
})
dom.canvasWidth?.addEventListener('input', (e) => {
  if (globalState.canvas.resizeOverlayActive)
    applyFromInputs(+e.target.value, +(dom.canvasHeight?.value ?? 0))
})
dom.canvasHeight?.addEventListener('input', (e) => {
  if (globalState.canvas.resizeOverlayActive)
    applyFromInputs(+(dom.canvasWidth?.value ?? 0), +e.target.value)
})
dom.anchorGrid?.addEventListener('click', (e) => {
  const btn = e.target.closest('.anchor-btn')
  if (!btn) return
  dom.anchorGrid
    .querySelectorAll('.anchor-btn')
    .forEach((b) => b.classList.remove('active'))
  btn.classList.add('active')
  setAnchor(btn.dataset.anchor)
})
// * Layers * — handled by LayersPanel React component; guard until migrated
dom.uploadBtn?.addEventListener('click', (e) => {
  //reset value so that the same file can be uploaded multiple times
  e.target.value = null
})
dom.uploadBtn?.addEventListener('change', addReferenceLayer)
dom.newLayerBtn?.addEventListener('click', addRasterLayer)
dom.deleteLayerBtn?.addEventListener('click', () => {
  let layer = canvas.currentLayer
  removeLayer(layer)
  renderCanvas(layer)
})

//TODO: (Medium Priority) Make similar to functionality of dragging dialog boxes. To make fancier dragging work, must be made compatible with a scrolling container
dom.layersContainer?.addEventListener('click', layerInteract)
dom.layersContainer?.addEventListener('dragstart', dragLayerStart)
dom.layersContainer?.addEventListener('dragover', dragLayerOver)
dom.layersContainer?.addEventListener('dragenter', dragLayerEnter)
dom.layersContainer?.addEventListener('dragleave', dragLayerLeave)
dom.layersContainer?.addEventListener('drop', dropLayer)
dom.layersContainer?.addEventListener('dragend', dragLayerEnd)
// dom.layersContainer?.addEventListener("pointerdown", () =>
//   dragStart(e, e.target.closest(".layer"))
// )
// dom.layersContainer?.addEventListener("pointerup", dragStop)
// dom.layersContainer?.addEventListener("pointerout", dragStop)
// dom.layersContainer?.addEventListener("pointermove", dragMove)
dom.layerSettingsContainer?.addEventListener('input', (e) => {
  const layer = dom.layerSettingsContainer.layerObj
  if (layer) {
    if (e.target.matches('.slider')) {
      layer.opacity = e.target.value / 255
      dom.layerSettingsContainer.querySelector(
        '.layer-opacity-label > .input-label',
      ).textContent = `Opacity: ${Math.round(layer.opacity * 255)}`
      renderCanvas(layer)
    } else if (e.target.matches('#layer-name')) {
      layer.title = e.target.value
      renderLayersToDOM()
    }
  }
})
//TODO: (Low Priority) maybe dynamically generate layer settings container when needed and only bind this event listener when it is open
document.addEventListener('pointerdown', (e) => {
  if (
    dom.layerSettingsContainer?.layerObj &&
    !e.target.classList.contains('gear') &&
    !dom.layerSettingsContainer.contains(e.target)
  ) {
    dom.layerSettingsContainer.style.display = 'none'
    dom.layerSettingsContainer.layerObj = null
  }
})

// * Vectors * //
dom.vectorsThumbnails?.addEventListener('click', vectorInteract)

// * Vector Settings Dialog * //
dom.layerSettingsContainer?.addEventListener('click', (e) => {
  if (e.target.classList.contains('close-btn')) {
    dom.layerSettingsContainer.style.display = 'none'
    dom.layerSettingsContainer.layerObj = null
  }
})

dom.vectorSettingsContainer?.addEventListener('click', (e) => {
  if (e.target.classList.contains('close-btn')) {
    dom.vectorSettingsContainer.style.display = 'none'
    dom.vectorSettingsContainer.vectorObj = null
    if (dom.ditherPickerContainer)
      dom.ditherPickerContainer.editingVector = false
    return
  }

  const vector = dom.vectorSettingsContainer.vectorObj
  if (!vector) return

  const modeBtn = e.target.closest('.mode')
  if (modeBtn) {
    const curveTypeKey = CURVE_TYPES.find((k) => modeBtn.classList.contains(k))
    if (curveTypeKey) {
      if (!vector.modes[curveTypeKey]) {
        changeActionVectorCurveType(vector, curveTypeKey)
        const modesRow = dom.vectorSettingsContainer.querySelector(
          '.vector-settings-modes',
        )
        CURVE_TYPES.forEach((t) => {
          modesRow
            ?.querySelector(`.mode.${t}`)
            ?.classList.toggle('selected', vector.modes[t])
        })
      }
      return
    }
    const modeKey = ['eraser', 'inject', 'twoColor'].find((k) =>
      modeBtn.classList.contains(k),
    )
    if (modeKey) {
      toggleVectorMode(vector, modeKey)
      // toggleVectorMode already updated vector.modes[modeKey]; sync the button
      modeBtn.classList.toggle('selected', vector.modes[modeKey])
      if (modeKey === 'twoColor') {
        updateVectorDitherPreview(vector)
        updateVectorDitherPickerColors(vector)
      }
    }
    return
  }

  const primaryBtn = e.target.closest('.primary-color')
  if (primaryBtn) {
    primaryBtn.color = vector.color
    primaryBtn.vector = vector
    primaryBtn.isSecondaryColor = false
    initializeColorPicker(primaryBtn)
    return
  }

  const secondaryBtn = e.target.closest('.secondary-color')
  if (secondaryBtn) {
    if (!vector.secondaryColor) {
      vector.secondaryColor = {
        r: 0,
        g: 0,
        b: 0,
        a: 0,
        color: 'rgba(0,0,0,0)',
      }
    }
    secondaryBtn.color = vector.secondaryColor
    secondaryBtn.vector = vector
    secondaryBtn.isSecondaryColor = true
    initializeColorPicker(secondaryBtn)
    return
  }

  const ditherPreviewBtn = e.target.closest('.vector-dither-preview')
  if (ditherPreviewBtn && dom.vectorDitherPickerContainer) {
    const isOpen = dom.vectorDitherPickerContainer.style.display === 'flex'
    if (isOpen) {
      dom.vectorDitherPickerContainer.style.display = 'none'
    } else {
      initVectorDitherPicker(vector)
      const settingsRect = dom.vectorSettingsContainer.getBoundingClientRect()
      dom.vectorDitherPickerContainer.style.display = 'flex'
      dom.vectorDitherPickerContainer.style.top = `${
        settingsRect.top -
        dom.vectorDitherPickerContainer.offsetHeight / 2 +
        ditherPreviewBtn.getBoundingClientRect().top -
        settingsRect.top +
        ditherPreviewBtn.offsetHeight / 2
      }px`
      dom.vectorDitherPickerContainer.style.left = `${settingsRect.right + 12}px`
    }
  }
})

dom.vectorSettingsContainer?.addEventListener('pointerdown', (e) => {
  if (e.target.classList.contains('vector-brush-size-slider')) {
    e.target.dataset.fromValue = e.target.value
  }
})

dom.vectorSettingsContainer?.addEventListener('input', (e) => {
  const vector = dom.vectorSettingsContainer.vectorObj
  if (!vector) return
  if (e.target.classList.contains('vector-brush-size-slider')) {
    const newSize = parseInt(e.target.value)
    vector.brushSize = newSize
    const display = dom.vectorSettingsContainer.querySelector(
      '.vector-brush-size-display',
    )
    if (display) display.textContent = `Size: ${newSize}`
    renderCanvas(vector.layer, true)
  }
})

dom.vectorSettingsContainer?.addEventListener('change', (e) => {
  const vector = dom.vectorSettingsContainer.vectorObj
  if (!vector) return
  if (e.target.classList.contains('vector-brush-size-slider')) {
    const oldSize = parseInt(e.target.dataset.fromValue ?? e.target.value)
    const newSize = parseInt(e.target.value)
    if (oldSize !== newSize) {
      changeActionVectorBrushSize(vector, oldSize, newSize)
      globalState.clearRedoStack()
    }
  }
})

// * Vector Dither Picker Dialog * //
dom.vectorDitherPickerContainer?.addEventListener('click', (e) => {
  if (e.target.classList.contains('close-btn')) {
    dom.vectorDitherPickerContainer.style.display = 'none'
    return
  }
  const vector = dom.vectorSettingsContainer?.vectorObj
  if (!vector) return

  const toggleBtn = e.target.closest('.dither-toggle')
  if (toggleBtn) {
    if (toggleBtn.classList.contains('twoColor')) {
      toggleVectorMode(vector, 'twoColor')
      updateVectorDitherControls(vector)
      updateVectorDitherPickerColors(vector)
      updateVectorDitherPreview(vector)
      // sync twoColor button in settings dialog if open
      const settingsModeBtn =
        dom.vectorSettingsContainer?.querySelector('.mode.twoColor')
      if (settingsModeBtn)
        settingsModeBtn.classList.toggle('selected', vector.modes.twoColor)
    }
    renderCanvas(vector.layer, true)
    return
  }

  const btn = e.target.closest('.dither-grid-btn')
  if (!btn) return
  const patternIndex = parseInt(btn.dataset.patternIndex)
  const oldPatternIndex = vector.ditherPatternIndex
  vector.ditherPatternIndex = patternIndex
  updateVectorDitherPreview(vector)
  dom.vectorDitherPickerContainer.style.display = 'none'
  renderCanvas(vector.layer, true)
  if (oldPatternIndex !== patternIndex) {
    changeActionVectorDitherPattern(vector, oldPatternIndex, patternIndex)
    globalState.clearRedoStack()
  }
})

// Offset control drag in vector dither picker — update stored offset so effective offset matches
dom.vectorDitherPickerContainer?.addEventListener('pointerdown', (e) => {
  const control = e.target.closest('.dither-offset-control')
  if (!control) return
  const vector = dom.vectorSettingsContainer?.vectorObj
  if (!vector) return
  control.setPointerCapture(e.pointerId)
  const startX = e.clientX
  const startY = e.clientY
  const currentLayerX = vector.layer?.x ?? 0
  const currentLayerY = vector.layer?.y ?? 0
  const recordedLayerX = vector.recordedLayerX ?? currentLayerX
  const recordedLayerY = vector.recordedLayerY ?? currentLayerY
  // Compute effective offset at drag start
  const startEffectiveX =
    ((((vector.ditherOffsetX ?? 0) + recordedLayerX - currentLayerX) % 8) + 8) %
    8
  const startEffectiveY =
    ((((vector.ditherOffsetY ?? 0) + recordedLayerY - currentLayerY) % 8) + 8) %
    8
  const fromOffset = {
    x: vector.ditherOffsetX ?? 0,
    y: vector.ditherOffsetY ?? 0,
  }
  const onMove = (ev) => {
    const newEffectiveX =
      (((startEffectiveX - Math.round((ev.clientX - startX) / 4)) % 8) + 8) % 8
    const newEffectiveY =
      (((startEffectiveY - Math.round((ev.clientY - startY) / 4)) % 8) + 8) % 8
    // Invert effective-offset formula: storedOffset = ((effective - recordedLayer + currentLayer) % 8 + 8) % 8
    vector.ditherOffsetX =
      (((newEffectiveX - recordedLayerX + currentLayerX) % 8) + 8) % 8
    vector.ditherOffsetY =
      (((newEffectiveY - recordedLayerY + currentLayerY) % 8) + 8) % 8
    updateVectorDitherControls(vector)
    renderCanvas(vector.layer, true)
  }
  control.addEventListener('pointermove', onMove)
  control.addEventListener(
    'pointerup',
    () => {
      control.removeEventListener('pointermove', onMove)
      const toOffset = {
        x: vector.ditherOffsetX ?? 0,
        y: vector.ditherOffsetY ?? 0,
      }
      if (fromOffset.x !== toOffset.x || fromOffset.y !== toOffset.y) {
        changeActionVectorDitherOffset(vector, fromOffset, toOffset)
        globalState.clearRedoStack()
      }
    },
    { once: true },
  )
})

document.addEventListener('pointerdown', (e) => {
  if (
    dom.vectorSettingsContainer?.vectorObj &&
    !e.target.classList.contains('gear') &&
    !dom.vectorSettingsContainer.contains(e.target) &&
    !dom.colorPickerContainer?.contains(e.target) &&
    !dom.vectorDitherPickerContainer?.contains(e.target)
  ) {
    dom.vectorSettingsContainer.style.display = 'none'
    dom.vectorSettingsContainer.vectorObj = null
    if (dom.vectorDitherPickerContainer)
      dom.vectorDitherPickerContainer.style.display = 'none'
  }
})
