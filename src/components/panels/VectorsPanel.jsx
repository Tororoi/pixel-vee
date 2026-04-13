import { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useAppState, bump } from '../../hooks/useAppState.js'
import { state } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { vectorGui } from '../../GUI/vector.js'
import { renderCanvas } from '../../Canvas/render.js'
import { renderLayersToDOM, renderVectorsToDOM } from '../../DOM/render.js'
import { isValidVector } from '../../DOM/renderVectors.js'
import { getAngle } from '../../utils/trig.js'
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
import { initializeColorPicker } from '../../Swatch/events.js'
import { ditherPatterns } from '../../Context/ditherPatterns.js'
import { createVectorDitherPatternSVG } from '../../DOM/renderVectors.js'
import { initDitherPicker } from '../../DOM/renderBrush.js'

function VectorThumbnail({ vector }) {
  const ref = useRef(null)
  useEffect(() => {
    const cvs = ref.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    const isSelected =
      vector.index === state.vector.currentIndex ||
      state.vector.selectedIndices.has(vector.index)

    // calculateDrawingDimensions (ported from legacy renderVectors.js)
    const border = 32
    const wd = canvas.thumbnailCVS.width / canvas.sharpness / (canvas.offScreenCVS.width + border)
    const hd = canvas.thumbnailCVS.height / canvas.sharpness / (canvas.offScreenCVS.height + border)
    const minD = Math.min(wd, hd)
    const xOffset =
      (canvas.thumbnailCVS.width / 2 - (minD * canvas.offScreenCVS.width * canvas.sharpness) / 2) /
      canvas.sharpness
    const yOffset =
      (canvas.thumbnailCVS.height / 2 - (minD * canvas.offScreenCVS.height * canvas.sharpness) / 2) /
      canvas.sharpness

    // drawOnThumbnailContext (ported from legacy renderVectors.js)
    ctx.setTransform(canvas.sharpness, 0, 0, canvas.sharpness, 0, 0)
    ctx.clearRect(0, 0, canvas.thumbnailCVS.width, canvas.thumbnailCVS.height)
    ctx.lineWidth = 3
    ctx.fillStyle = isSelected ? 'rgb(0, 0, 0)' : 'rgb(51, 51, 51)'
    ctx.fillRect(0, 0, canvas.thumbnailCVS.width, canvas.thumbnailCVS.height)
    ctx.clearRect(xOffset, yOffset, minD * canvas.offScreenCVS.width, minD * canvas.offScreenCVS.height)

    ctx.strokeStyle = 'black'
    ctx.beginPath()

    const vp = vector.vectorProperties
    const ox = (vector.layer?.x ?? 0) + state.canvas.cropOffsetX
    const oy = (vector.layer?.y ?? 0) + state.canvas.cropOffsetY
    const px1 = minD * (vp.px1 + ox)
    const py1 = minD * (vp.py1 + oy)
    const px2 = minD * (vp.px2 + ox)
    const py2 = minD * (vp.py2 + oy)
    const px3 = minD * (vp.px3 + ox)
    const py3 = minD * (vp.py3 + oy)
    const px4 = minD * (vp.px4 + ox)
    const py4 = minD * (vp.py4 + oy)

    switch (vp.tool) {
      case 'fill':
        ctx.arc(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset, 1, 0, 2 * Math.PI, true)
        break
      case 'curve': {
        const modes = vector.modes ?? {}
        ctx.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
        if (modes.cubicCurve) {
          ctx.bezierCurveTo(
            px3 + 0.5 + xOffset, py3 + 0.5 + yOffset,
            px4 + 0.5 + xOffset, py4 + 0.5 + yOffset,
            px2 + 0.5 + xOffset, py2 + 0.5 + yOffset
          )
        } else if (modes.quadCurve) {
          ctx.quadraticCurveTo(px3 + 0.5 + xOffset, py3 + 0.5 + yOffset, px2 + 0.5 + xOffset, py2 + 0.5 + yOffset)
        } else {
          ctx.lineTo(px2 + 0.5 + xOffset, py2 + 0.5 + yOffset)
        }
        break
      }
      case 'ellipse': {
        const ltx = minD * (vp.leftTangentX + ox) + xOffset
        const lty = minD * (vp.leftTangentY + oy) + yOffset
        const rtx = minD * (vp.rightTangentX + ox) + xOffset
        const rty = minD * (vp.rightTangentY + oy) + yOffset
        const ttx = minD * (vp.topTangentX + ox) + xOffset
        const tty = minD * (vp.topTangentY + oy) + yOffset
        const btx = minD * (vp.bottomTangentX + ox) + xOffset
        const bty = minD * (vp.bottomTangentY + oy) + yOffset
        const cx = (ltx + rtx) / 2
        const cy = (tty + bty) / 2
        const radA = Math.sqrt((rtx - ltx) ** 2 + (rty - lty) ** 2) / 2
        const radB = Math.sqrt((btx - ttx) ** 2 + (bty - tty) ** 2) / 2
        const angle = getAngle(rtx - ltx, rty - lty)
        ctx.ellipse(cx, cy, radA, radB, angle, 0, 2 * Math.PI)
        break
      }
      case 'polygon':
        ctx.moveTo(px1 + 0.5 + xOffset, py1 + 0.5 + yOffset)
        ctx.lineTo(px2 + 0.5 + xOffset, py2 + 0.5 + yOffset)
        ctx.lineTo(px3 + 0.5 + xOffset, py3 + 0.5 + yOffset)
        ctx.lineTo(px4 + 0.5 + xOffset, py4 + 0.5 + yOffset)
        ctx.closePath()
        break
    }

    ctx.globalCompositeOperation = 'xor'
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  })
  return <canvas ref={ref} width={canvas.thumbnailCVS.width} height={canvas.thumbnailCVS.height} />
}

function VectorSettingsPopout({ vector, pos, onClose }) {
  const ref = useRef(null)
  const ditherPreviewRef = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        !e.target.classList.contains('gear') &&
        !e.target.closest('.dither-picker-container')
      ) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [onClose])

  // Render dither preview SVG imperatively
  useEffect(() => {
    const el = ditherPreviewRef.current
    if (!el) return
    el.innerHTML = ''
    const pattern = ditherPatterns[vector.ditherPatternIndex ?? 63]
    if (pattern) el.appendChild(createVectorDitherPatternSVG(pattern, vector))
  })

  function handleModeToggle(modeKey) {
    const oldModes = { ...vector.modes }
    const isCurveType = ['line', 'quadCurve', 'cubicCurve'].includes(modeKey)
    if (isCurveType && vector.modes[modeKey]) return
    vector.modes[modeKey] = !vector.modes[modeKey]
    if (vector.modes[modeKey]) {
      if (modeKey === 'eraser' && vector.modes.inject)
        vector.modes.inject = false
      else if (modeKey === 'inject' && vector.modes.eraser)
        vector.modes.eraser = false
      if (isCurveType) {
        ;['line', 'quadCurve', 'cubicCurve'].forEach((t) => {
          if (t !== modeKey) vector.modes[t] = false
        })
      }
    }
    const newModes = { ...vector.modes }
    renderCanvas(vector.layer, true)
    changeActionVectorMode(vector, oldModes, newModes)
    state.clearRedoStack()
    renderVectorsToDOM()
  }

  function handlePrimaryColorClick(e) {
    e.stopPropagation()
    const fakeSwatch = { color: vector.color, vector, isSecondaryColor: false }
    initializeColorPicker(fakeSwatch)
  }

  function handleSecondaryColorClick(e) {
    e.stopPropagation()
    if (!vector.secondaryColor) {
      vector.secondaryColor = { r: 0, g: 0, b: 0, a: 0, color: 'rgba(0,0,0,0)' }
    }
    const fakeSwatch = {
      color: vector.secondaryColor,
      vector,
      isSecondaryColor: true,
    }
    initializeColorPicker(fakeSwatch)
  }

  function handleBrushSizeChange(e) {
    vector.brushSize = parseInt(e.target.value)
    renderCanvas(vector.layer, true)
    bump()
  }

  const modes = vector.modes ?? {}
  const tool = vector.vectorProperties?.tool
  const isCurveTool = tool === 'curve'
  const curveTypes = ['line', 'quadCurve', 'cubicCurve']
  const generalModes = ['eraser', 'inject', 'twoColor']
  const allModes = isCurveTool ? [...curveTypes, ...generalModes] : generalModes

  return ReactDOM.createPortal(
    <div
      ref={ref}
      className="vector-settings dialog-box"
      style={{
        display: 'flex',
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        transform: 'translateY(-50%)',
        zIndex: 1000,
      }}
    >
      <div className="header">
        <div className="drag-btn locked">
          <div className="grip"></div>
        </div>
        Vector Settings
        <button
          type="button"
          className="close-btn"
          data-tooltip="Close"
          onClick={onClose}
        />
      </div>
      <div className="vector-settings-modes">
        {allModes.map((modeKey) => (
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
      <div className="vector-settings-color-row">
        <span>Primary</span>
        <button
          type="button"
          className="actionColor primary-color"
          aria-label="Primary Color"
          data-tooltip="Primary Color"
          onClick={handlePrimaryColorClick}
        >
          <div
            className="swatch"
            style={{ backgroundColor: vector.color?.color }}
          />
        </button>
      </div>
      <div className="vector-settings-color-row">
        <span>Secondary</span>
        <button
          type="button"
          className="actionColor secondary-color"
          aria-label="Secondary Color"
          data-tooltip="Secondary Color"
          onClick={handleSecondaryColorClick}
        >
          <div
            className="swatch"
            style={{
              backgroundColor: vector.secondaryColor?.color ?? 'rgba(0,0,0,0)',
            }}
          />
        </button>
      </div>
      <div className="vector-settings-dither-row">
        <span>Dither</span>
        <div
          ref={ditherPreviewRef}
          className="vector-dither-preview"
          data-tooltip="Select dither pattern"
          onClick={() => {
            const picker = document.querySelector('.dither-picker-container')
            if (!picker) return
            if (
              picker.style.display === 'flex' &&
              picker._vectorTarget === vector
            ) {
              picker._vectorTarget = null
              picker.style.display = 'none'
              const buildUpBtn = picker.querySelector('#dither-ctrl-build-up')
              if (buildUpBtn) buildUpBtn.style.display = ''
            } else {
              picker._vectorTarget = vector
              initDitherPicker()
              const buildUpBtn = picker.querySelector('#dither-ctrl-build-up')
              if (buildUpBtn) buildUpBtn.style.display = 'none'
              const buildUpSteps = picker.querySelector('.build-up-steps')
              if (buildUpSteps) buildUpSteps.style.display = 'none'
              picker.style.display = 'flex'
            }
          }}
        />
      </div>
      <div className="vector-settings-brush-row">
        <span>Size: {vector.brushSize ?? 1}px</span>
        <input
          type="range"
          className="slider"
          min="1"
          max="32"
          value={vector.brushSize ?? 1}
          onChange={handleBrushSizeChange}
        />
      </div>
    </div>,
    document.body,
  )
}

export default function VectorsPanel() {
  useAppState()
  const ref = useRef(null)
  const [settingsVector, setSettingsVector] = useState(null)
  const [settingsPos, setSettingsPos] = useState({ top: 0, left: 0 })

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
    isValidVector(v, undoStackSet),
  )

  function handleVectorClick(e, vector) {
    if (isPasted) {
      e.preventDefault()
      return
    }
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
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      setSettingsPos({ top: rect.top + rect.height / 2, left: rect.right + 16 })
      setSettingsVector(vector)
    }
  }

  return (
    <div
      ref={ref}
      className={`vectors-interface dialog-box draggable v-drag settings-box smooth-shift${isPasted ? ' disabled' : ''}`}
    >
      <div className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        Vectors
        <label
          htmlFor="vectors-collapse-btn"
          className="collapse-btn"
          data-tooltip="Collapse/ Expand"
        >
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
                      className={`tool ${toolName}`}
                      aria-label={toolName}
                      data-tooltip={toolName}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      type="button"
                      className="actionColor primary-color"
                      aria-label="Action Color"
                      data-tooltip="Action Color"
                      onClick={(e) => {
                        e.stopPropagation()
                        const fakeSwatch = {
                          color: vector.color,
                          vector,
                          isSecondaryColor: false,
                        }
                        initializeColorPicker(fakeSwatch)
                      }}
                    >
                      <div
                        className="swatch"
                        style={{ backgroundColor: vector.color?.color }}
                      />
                    </button>
                    <button
                      type="button"
                      className={`hide ${vector.hidden ? 'eyeclosed' : 'eyeopen'}`}
                      aria-label={vector.hidden ? 'Show Vector' : 'Hide Vector'}
                      data-tooltip={
                        vector.hidden ? 'Show Vector' : 'Hide Vector'
                      }
                      onClick={(e) => handleHideToggle(e, vector)}
                    />
                    <button
                      type="button"
                      className="trash"
                      aria-label="Remove Vector"
                      data-tooltip="Remove Vector"
                      onClick={(e) => handleRemove(e, vector)}
                    />
                  </div>
                  <button
                    type="button"
                    className={`gear${isSettingsOpen ? ' active' : ''}`}
                    aria-label="Vector Settings"
                    data-tooltip="Vector Settings"
                    onClick={(e) => handleGearClick(e, vector)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {settingsVector && (
        <VectorSettingsPopout
          vector={settingsVector}
          pos={settingsPos}
          onClose={() => setSettingsVector(null)}
        />
      )}
    </div>
  )
}
