import { dom } from '../../Context/dom.js'
import { keys } from '../../Shortcuts/keys.js'
import { state } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { renderCanvas } from '../render/index.js'
import {
  renderLayersToDOM,
  renderVectorsToDOM,
  renderVectorSettingsToDOM,
  initVectorDitherPicker,
  updateVectorDitherPreview,
  updateVectorDitherPickerColors,
  updateVectorDitherControls,
} from '../../DOM/render.js'
import {
  removeActionVector,
  changeActionVectorMode,
} from '../../Actions/modifyTimeline/modifyTimeline.js'
import { vectorGui } from '../../GUI/vector.js'
import { initializeColorPicker } from '../../Swatch/events.js'
import {
  actionSelectVector,
  actionDeselectVector,
  actionDeselect,
} from '../../Actions/nonPointer/selectionActions.js'
import { switchTool } from '../../Tools/toolbox.js'
import { enableActionsForSelection } from '../../DOM/disableDomElements.js'

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
      if (!state.vector.selectedIndices.has(vector.index)) {
        //select if shift key held down
        actionSelectVector(vector.index)
        // enableActionsForSelection()
      } else {
        actionDeselectVector(vector.index)
      }
    } else if (state.vector.selectedIndices.size > 0) {
      actionDeselect()
    }
    if (vector.index !== state.vector.currentIndex) {
      //switch tool
      switchTool(vector.vectorProperties.type)
      // vectorGui.reset()
      vectorGui.setVectorProperties(vector)
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        dom[`${tool}Btn`].disabled = false
      })
      canvas.currentLayer = vector.layer
      canvas.currentLayer.inactiveTools.forEach((tool) => {
        dom[`${tool}Btn`].disabled = true
      })
    }
    enableActionsForSelection() //If code reaches this case, either vector is selected or is current vector
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
  if (state.vector.currentIndex === vector.index) {
    vectorGui.reset()
  }
  renderCanvas(vector.layer, true)
  removeActionVector(vector)

  state.clearRedoStack()
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

  state.clearRedoStack()
  renderVectorsToDOM()
}

//====================================//
//=== * * * Event Listeners * * * ====//
//====================================//

// * Vectors * //
dom.vectorsThumbnails.addEventListener('click', vectorInteract)

// * Layer Settings Dialog (close button) * //
dom.layerSettingsContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('close-btn')) {
    dom.layerSettingsContainer.style.display = 'none'
    dom.layerSettingsContainer.layerObj = null
  }
})

// * Vector Settings Dialog * //
dom.vectorSettingsContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('close-btn')) {
    dom.vectorSettingsContainer.style.display = 'none'
    dom.vectorSettingsContainer.vectorObj = null
    if (dom.ditherPickerContainer) dom.ditherPickerContainer.editingVector = false
    return
  }

  const vector = dom.vectorSettingsContainer.vectorObj
  if (!vector) return

  const modeBtn = e.target.closest('.mode')
  if (modeBtn) {
    const modeKey = ['eraser', 'inject', 'twoColor'].find((k) =>
      modeBtn.classList.contains(k)
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
      vector.secondaryColor = { r: 0, g: 0, b: 0, a: 0, color: 'rgba(0,0,0,0)' }
    }
    secondaryBtn.color = vector.secondaryColor
    secondaryBtn.vector = vector
    secondaryBtn.isSecondaryColor = true
    initializeColorPicker(secondaryBtn)
    return
  }

  const ditherPreviewBtn = e.target.closest('.vector-dither-preview')
  if (ditherPreviewBtn && dom.vectorDitherPickerContainer) {
    const isOpen =
      dom.vectorDitherPickerContainer.style.display === 'flex'
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

dom.vectorSettingsContainer.addEventListener('input', (e) => {
  const vector = dom.vectorSettingsContainer.vectorObj
  if (!vector) return
  if (e.target.classList.contains('vector-brush-size-slider')) {
    const newSize = parseInt(e.target.value)
    vector.brushSize = newSize
    const display = dom.vectorSettingsContainer.querySelector(
      '.vector-brush-size-display'
    )
    if (display) display.textContent = `Size: ${newSize}`
    renderCanvas(vector.layer, true)
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
      const settingsModeBtn = dom.vectorSettingsContainer?.querySelector('.mode.twoColor')
      if (settingsModeBtn) settingsModeBtn.classList.toggle('selected', vector.modes.twoColor)
    }
    renderCanvas(vector.layer, true)
    return
  }

  const btn = e.target.closest('.dither-grid-btn')
  if (!btn) return
  const patternIndex = parseInt(btn.dataset.patternIndex)
  vector.ditherPatternIndex = patternIndex
  updateVectorDitherPreview(vector)
  dom.vectorDitherPickerContainer.style.display = 'none'
  renderCanvas(vector.layer, true)
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
  const startEffectiveX = (((vector.ditherOffsetX ?? 0) + recordedLayerX - currentLayerX) % 8 + 8) % 8
  const startEffectiveY = (((vector.ditherOffsetY ?? 0) + recordedLayerY - currentLayerY) % 8 + 8) % 8
  const onMove = (ev) => {
    const newEffectiveX = ((startEffectiveX - Math.round((ev.clientX - startX) / 4)) % 8 + 8) % 8
    const newEffectiveY = ((startEffectiveY - Math.round((ev.clientY - startY) / 4)) % 8 + 8) % 8
    // Invert effective-offset formula: storedOffset = ((effective - recordedLayer + currentLayer) % 8 + 8) % 8
    vector.ditherOffsetX = ((newEffectiveX - recordedLayerX + currentLayerX) % 8 + 8) % 8
    vector.ditherOffsetY = ((newEffectiveY - recordedLayerY + currentLayerY) % 8 + 8) % 8
    updateVectorDitherControls(vector)
    renderCanvas(vector.layer, true)
  }
  control.addEventListener('pointermove', onMove)
  control.addEventListener('pointerup', () => control.removeEventListener('pointermove', onMove), { once: true })
})

document.addEventListener('pointerdown', (e) => {
  if (
    dom.vectorSettingsContainer.vectorObj &&
    !e.target.classList.contains('gear') &&
    !dom.vectorSettingsContainer.contains(e.target) &&
    !dom.colorPickerContainer?.contains(e.target) &&
    !dom.vectorDitherPickerContainer?.contains(e.target)
  ) {
    dom.vectorSettingsContainer.style.display = 'none'
    dom.vectorSettingsContainer.vectorObj = null
    dom.vectorDitherPickerContainer.style.display = 'none'
  }
})
