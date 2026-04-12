import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useAppState, bump } from '../../hooks/useAppState.js'
import { state } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { vectorGui } from '../../GUI/vector.js'
import { renderCanvas } from '../../Canvas/render.js'
import { renderLayersToDOM, renderVectorsToDOM } from '../../DOM/render.js'
import { isValidVector } from '../../DOM/renderVectors.js'
import { initializeDragger, initializeCollapser } from '../../utils/drag.js'
import { dom } from '../../Context/dom.js'
import { switchTool } from '../../Tools/toolbox.js'
import {
  actionSelectVector,
  actionDeselectVector,
  actionDeselect,
} from '../../Actions/nonPointer/selectionActions.js'
import {
  removeActionVector,
  changeActionVectorMode,
} from '../../Actions/modifyTimeline/modifyTimeline.js'
import { keys } from '../../Shortcuts/keys.js'

function VectorThumbnail({ vector }) {
  const ref = useRef(null)
  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d', { willReadFrequently: true })
    ctx.clearRect(0, 0, cvs.width, cvs.height)
    const src = vector.layer?.onscreenCvs
    if (src) {
      ctx.drawImage(src, 0, 0, cvs.width, cvs.height)
    }
  })
  return <canvas ref={ref} />
}

function VectorSettingsPopout({ vector, anchorEl, onClose }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!anchorEl) return
    const rect = anchorEl.getBoundingClientRect()
    setPos({ top: rect.top + window.scrollY, left: rect.right + window.scrollX + 4 })
  }, [anchorEl])

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target) && !e.target.classList.contains('gear')) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [onClose])

  function handleModeToggle(modeKey) {
    const oldModes = { ...vector.modes }
    vector.modes[modeKey] = !vector.modes[modeKey]
    if (vector.modes[modeKey]) {
      if (modeKey === 'eraser' && vector.modes.inject) vector.modes.inject = false
      else if (modeKey === 'inject' && vector.modes.eraser) vector.modes.eraser = false
    }
    const newModes = { ...vector.modes }
    renderCanvas(vector.layer, true)
    changeActionVectorMode(vector, oldModes, newModes)
    state.clearRedoStack()
    renderVectorsToDOM()
  }

  function handleBrushSizeChange(e) {
    vector.brushSize = parseInt(e.target.value)
    renderCanvas(vector.layer, true)
    bump()
  }

  const modes = vector.modes ?? {}
  const tool = vector.vectorProperties?.tool
  const showCurveTypes = ['curve'].includes(tool)

  return ReactDOM.createPortal(
    <div
      ref={ref}
      className="vector-settings"
      style={{ display: 'flex', position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000 }}
    >
      <div className="header">
        Vector Settings
        <button type="button" className="close-btn" data-tooltip="Close" onClick={onClose} />
      </div>
      <div className="vector-settings-modes">
        {['eraser', 'inject', 'twoColor'].map((modeKey) => (
          <button
            key={modeKey}
            type="button"
            className={`mode ${modeKey}${modes[modeKey] ? ' selected' : ''}`}
            aria-label={modeKey}
            data-tooltip={modeKey}
            onClick={() => handleModeToggle(modeKey)}
          />
        ))}
      </div>
      <div className="brush-size-label">
        <label htmlFor="vector-brush-size" className="input-label">Size: {vector.brushSize ?? 1}px</label>
        <input
          id="vector-brush-size"
          type="range"
          className="slider"
          min="1"
          max="32"
          value={vector.brushSize ?? 1}
          onChange={handleBrushSizeChange}
        />
      </div>
    </div>,
    document.body
  )
}

export default function VectorsPanel() {
  useAppState()
  const ref = useRef(null)
  const [settingsVector, setSettingsVector] = useState(null)
  const [settingsAnchor, setSettingsAnchor] = useState(null)

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    initializeCollapser(ref.current)
    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  const isPasted = !!canvas.pastedLayer
  const undoStackSet = new Set(state.timeline.undoStack)
  const visibleVectors = Object.values(state.vector.all).filter((v) =>
    isValidVector(v, undoStackSet)
  )

  function handleVectorClick(e, vector) {
    if (isPasted) { e.preventDefault(); return }
    if (keys.ShiftLeft || keys.ShiftRight) {
      if (!state.vector.selectedIndices.has(vector.index)) {
        actionSelectVector(vector.index)
      } else {
        actionDeselectVector(vector.index)
      }
    } else if (state.vector.selectedIndices.size > 0) {
      actionDeselect()
    }
    if (vector.index !== state.vector.currentIndex) {
      switchTool(vector.vectorProperties.tool)
      vectorGui.setVectorProperties(vector)
      canvas.currentLayer.inactiveTools?.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = false
      })
      canvas.currentLayer = vector.layer
      canvas.currentLayer.inactiveTools?.forEach((tool) => {
        if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
      })
    }
    vectorGui.render()
    renderLayersToDOM()
    renderVectorsToDOM()
  }

  function handleHideToggle(e, vector) {
    e.stopPropagation()
    vector.hidden = !vector.hidden
    renderCanvas(vector.layer, true)
    bump()
  }

  function handleRemove(e, vector) {
    e.stopPropagation()
    vector.removed = true
    if (state.vector.currentIndex === vector.index) vectorGui.reset()
    renderCanvas(vector.layer, true)
    removeActionVector(vector)
    state.clearRedoStack()
    renderVectorsToDOM()
  }

  function handleGearClick(e, vector) {
    e.stopPropagation()
    if (settingsVector === vector) {
      setSettingsVector(null)
      setSettingsAnchor(null)
    } else {
      setSettingsVector(vector)
      setSettingsAnchor(e.currentTarget)
    }
  }

  return (
    <div ref={ref} className={`vectors-interface dialog-box draggable v-drag settings-box smooth-shift${isPasted ? ' disabled' : ''}`}>
      <div className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        Vectors
        <label htmlFor="vectors-collapse-btn" className="collapse-btn" data-tooltip="Collapse/ Expand">
          <input
            type="checkbox"
            aria-label="Collapse or Expand"
            className="collapse-checkbox"
            id="vectors-collapse-btn"
          />
          <span className="arrow"></span>
        </label>
      </div>
      <div className="collapsible">
        <div className="vectors-container">
          <div className="vectors">
            {visibleVectors.map((vector) => {
              const isSelected =
                vector.index === state.vector.currentIndex ||
                state.vector.selectedIndices.has(vector.index)
              const toolName = vector.vectorProperties?.tool ?? ''
              const isSettingsOpen = settingsVector === vector

              return (
                <div
                  key={vector.index}
                  className={`vector${isSelected ? ' selected' : ''}`}
                  onClick={(e) => handleVectorClick(e, vector)}
                >
                  <VectorThumbnail vector={vector} />
                  <div className="left">
                    <button
                      type="button"
                      className={toolName}
                      aria-label={toolName}
                      data-tooltip={toolName}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      className={`hide ${vector.hidden ? 'eyeclosed' : 'eyeopen'}`}
                      aria-label={vector.hidden ? 'Show Vector' : 'Hide Vector'}
                      data-tooltip={vector.hidden ? 'Show Vector' : 'Hide Vector'}
                      onClick={(e) => handleHideToggle(e, vector)}
                    />
                  </div>
                  <div className="right">
                    <button
                      type="button"
                      className="trash"
                      aria-label="Remove Vector"
                      data-tooltip="Remove Vector"
                      onClick={(e) => handleRemove(e, vector)}
                    />
                    <button
                      type="button"
                      className={`gear${isSettingsOpen ? ' active' : ''}`}
                      aria-label="Vector Settings"
                      data-tooltip="Vector Settings"
                      onClick={(e) => handleGearClick(e, vector)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {settingsVector && (
        <VectorSettingsPopout
          vector={settingsVector}
          anchorEl={settingsAnchor}
          onClose={() => { setSettingsVector(null); setSettingsAnchor(null) }}
        />
      )}
    </div>
  )
}
