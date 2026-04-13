import { useEffect, useRef } from 'react'
import { useAppState, bump } from '../../hooks/useAppState.js'
import { initializeDragger, initializeCollapser } from '../../utils/drag.js'
import { state } from '../../Context/state.js'
import { brush, rebuildBuildUpDensityMap, BAYER_STEPS } from '../../Tools/brush.js'
import { renderCanvas } from '../../Canvas/render.js'
import {
  highlightSelectedDitherPattern,
  renderDitherControlsToDOM,
  renderDitherOptionsToDOM,
  renderBuildUpStepsToDOM,
  updateDitherPickerColors,
  applyDitherOffset,
  applyDitherOffsetControl,
} from '../../DOM/renderBrush.js'

const DITHER_TOOLS = ['brush', 'curve', 'ellipse']

export default function DitherPickerDialog() {
  useAppState()
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    initializeCollapser(ref.current)

    const el = ref.current

    // Close button
    el.querySelector('.close-btn')?.addEventListener('click', () => {
      el._vectorTarget = null
      const buildUpBtn = el.querySelector('#dither-ctrl-build-up')
      if (buildUpBtn) buildUpBtn.style.display = ''
      el.style.display = 'none'
    })

    // Dither grid — pattern selection
    el.querySelector('.dither-grid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.dither-grid-btn')
      if (!btn) return
      const patternIndex = parseInt(btn.dataset.patternIndex)
      // Vector mode: apply to vector target, keep picker open
      if (el._vectorTarget) {
        const v = el._vectorTarget
        v.ditherPatternIndex = patternIndex
        renderCanvas(v.layer, true)
        bump()
        return
      }
      if (!DITHER_TOOLS.includes(state.tool.current?.name)) return
      if (brush.buildUpActiveStepSlot !== null) {
        brush.buildUpSteps[brush.buildUpActiveStepSlot] = patternIndex
        brush.buildUpActiveStepSlot = null
        renderBuildUpStepsToDOM()
      } else {
        state.tool.current.ditherPatternIndex = patternIndex
        highlightSelectedDitherPattern()
        renderDitherOptionsToDOM()
      }
    })

    // Two-color toggle
    el.querySelector('#dither-ctrl-two-color')?.addEventListener('click', () => {
      if (!DITHER_TOOLS.includes(state.tool.current?.name)) return
      state.tool.current.modes.twoColor = !state.tool.current.modes.twoColor
      renderDitherControlsToDOM()
      updateDitherPickerColors()
      renderDitherOptionsToDOM()
    })

    // Build-up dither toggle
    el.querySelector('#dither-ctrl-build-up')?.addEventListener('click', () => {
      if (state.tool.current?.name !== 'brush') return
      brush.modes.buildUpDither = !brush.modes.buildUpDither
      if (brush.modes.buildUpDither) {
        rebuildBuildUpDensityMap()
      } else {
        brush._buildUpDensityMap = new Map()
        brush.buildUpActiveStepSlot = null
      }
      renderDitherControlsToDOM()
      renderDitherOptionsToDOM()
    })

    // Build-up reset
    el.querySelector('#dither-ctrl-build-up-reset')?.addEventListener('click', () => {
      if (state.tool.current?.name !== 'brush') return
      brush._buildUpResetAtIndex = state.timeline.undoStack.length
      brush._buildUpDensityMap = new Map()
    })

    // Build-up mode selector
    el.querySelector('.build-up-mode-selector')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.build-up-mode-btn')
      if (!btn || state.tool.current?.name !== 'brush') return
      const mode = btn.dataset.mode
      if (brush.buildUpMode === 'custom' && mode !== 'custom') {
        brush._customBuildUpSteps = [...brush.buildUpSteps]
      }
      brush.buildUpMode = mode
      if (mode === 'custom') {
        brush.buildUpSteps = [...brush._customBuildUpSteps]
      } else {
        brush.buildUpSteps = BAYER_STEPS[mode] ? [...BAYER_STEPS[mode]] : brush.buildUpSteps
      }
      renderBuildUpStepsToDOM()
    })

    // Dither offset drag
    el.addEventListener('pointerdown', (e) => {
      const control = e.target.closest('.dither-offset-control')
      if (!control) return
      const vectorTarget = el._vectorTarget
      if (!vectorTarget && !DITHER_TOOLS.includes(state.tool.current?.name)) return
      control.setPointerCapture(e.pointerId)
      const startX = e.clientX
      const startY = e.clientY
      const target = vectorTarget ?? state.tool.current
      const startOffsetX = target.ditherOffsetX ?? 0
      const startOffsetY = target.ditherOffsetY ?? 0
      const onMove = (ev) => {
        const ox = (((startOffsetX - Math.round((ev.clientX - startX) / 4)) % 8) + 8) % 8
        const oy = (((startOffsetY - Math.round((ev.clientY - startY) / 4)) % 8) + 8) % 8
        target.ditherOffsetX = ox
        target.ditherOffsetY = oy
        if (vectorTarget) {
          renderCanvas(vectorTarget.layer, true)
        }
        applyDitherOffset(el, ox, oy)
        if (!vectorTarget) {
          const preview = document.querySelector('.dither-preview')
          if (preview) applyDitherOffset(preview, ox, oy)
        }
        applyDitherOffsetControl(control.parentElement, ox, oy)
      }
      control.addEventListener('pointermove', onMove)
      control.addEventListener('pointerup', () => control.removeEventListener('pointermove', onMove), { once: true })
    })

    return () => {
      delete el.dataset.dragInitialized
    }
  }, [])

  return (
    <div
      ref={ref}
      className="dither-picker-container dialog-box draggable v-drag h-drag free"
      style={{ display: 'none' }}
    >
      <div className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        Dither Pattern
        <button type="button" className="close-btn" data-tooltip="Close" />
      </div>
      <div className="collapsible">
        <div className="dither-controls">
          <button
            type="button"
            className="dither-toggle twoColor"
            id="dither-ctrl-two-color"
            aria-label="Two-Color"
            data-tooltip="Two-Color"
          />
          <button
            type="button"
            className="dither-toggle buildUpDither"
            id="dither-ctrl-build-up"
            aria-label="Build-Up Dither"
            data-tooltip="Build-Up Dither&#10;&#10;Automatically increase dither density on overlapping strokes"
          />
          <div className="dither-offset-control-wrap"></div>
        </div>
        <div className="build-up-steps" style={{ display: 'none' }}>
          <span className="build-up-steps-label">Build-Up Steps</span>
          <div className="build-up-mode-selector">
            <button type="button" className="build-up-mode-btn selected" data-mode="custom" data-tooltip="Custom build-up steps">Custom</button>
            <button type="button" className="build-up-mode-btn" data-mode="2x2" data-tooltip="4 steps from a 2x2 Bayer Matrix">2×2</button>
            <button type="button" className="build-up-mode-btn" data-mode="4x4" data-tooltip="16 steps from a 4x4 Bayer Matrix">4×4</button>
            <button type="button" className="build-up-mode-btn" data-mode="8x8" data-tooltip="64 steps from an 8x8 Bayer Matrix">8×8</button>
          </div>
          <div className="build-up-step-slots"></div>
          <button type="button" id="dither-ctrl-build-up-reset" className="btn build-up-reset-btn" data-tooltip="Reset build-up density">
            Reset Density Map
          </button>
        </div>
        <div className="dither-grid"></div>
      </div>
    </div>
  )
}
