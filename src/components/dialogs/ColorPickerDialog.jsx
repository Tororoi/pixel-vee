import { useEffect, useRef } from 'react'
import { useAppState } from '../../hooks/useAppState.js'
import { state } from '../../Context/state.js'
import { swatches } from '../../Context/swatch.js'
import { Picker } from '../../Swatch/Picker.js'
import { registerPicker, confirmColor, closePickerWindow, addToPalette } from '../../Swatch/events.js'
import { initializeDragger } from '../../utils/drag.js'

function SpinBtn() {
  return (
    <div className="spin-btn">
      <button type="button" className="channel-btn" id="inc">
        <span className="spin-content">+</span>
      </button>
      <button type="button" className="channel-btn" id="dec">
        <span className="spin-content">-</span>
      </button>
    </div>
  )
}


export default function ColorPickerDialog() {
  useAppState()
  const ref = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const p = new Picker(canvasRef.current, 250, 250, swatches.primary.color)
    p.build()
    registerPicker(p)
    return () => {
      // picker is a singleton — no cleanup needed
    }
  }, [])

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)

    // Wire up the color ramps collapse separately (initializeCollapser only handles the first)
    const ramsCheckbox = ref.current.querySelector('#ramps-collapse-btn')
    const ramsCollapsible = ref.current.querySelector('#color-ramps-collapsible')
    if (ramsCheckbox && ramsCollapsible) {
      ramsCheckbox.addEventListener('click', () => {
        ramsCollapsible.style.display = ramsCheckbox.checked ? 'none' : 'flex'
      })
    }

    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  function handleConfirm() { confirmColor() }
  function handleCancel() { closePickerWindow() }
  function handleAddToPalette() { addToPalette() }

  return (
    <div
      ref={ref}
      className="picker-container dialog-box v-drag h-drag free"
      style={{ display: state.ui.colorPickerOpen ? 'flex' : 'none' }}
    >
      <div className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        Color Picker
        <button type="button" className="close-btn" data-tooltip="Close" onClick={handleCancel} />
      </div>
      <div className="collapsible">
        <div id="color-ramps-section">
          <div className="ramps-header">
            Color Ramps
            <label htmlFor="ramps-collapse-btn" className="collapse-btn">
              <input
                type="checkbox"
                className="collapse-checkbox"
                id="ramps-collapse-btn"
              />
              <span className="arrow"></span>
            </label>
          </div>
          <div id="color-ramps-collapsible">
            <div className="color-group" data-group="shadow">
              <div className="ramp-label">Shadow / Highlight</div>
              <div className="ramp-row">
                <div className="ramp-swatches"></div>
              </div>
            </div>
            <div className="color-group" data-group="custom">
              <div className="ramp-label">Custom Ramp</div>
              <div className="ramp-row">
                <div className="ramp-swatches"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="picker-interface">
          <div id="left">
            <div id="picker">
              <canvas id="color-picker" ref={canvasRef} width="250" height="250" />
              <div className="slider-container">
                <input
                  type="range"
                  id="hueslider"
                  className="picker-slider"
                  min="0"
                  max="359"
                  defaultValue="0"
                />
                <input
                  type="range"
                  id="alphaslider"
                  className="picker-slider"
                  min="0"
                  max="255"
                  defaultValue="255"
                />
              </div>
            </div>
            <div id="buttons">
              <button type="button" className="btn" id="confirm-btn" onClick={handleConfirm}>
                OK
              </button>
              <button type="button" className="btn" id="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
          <div id="right">
            <div id="colors">
              <div className="color">
                <h5>New</h5>
                <button type="button" className="swatch" id="newcolor-btn" onClick={handleAddToPalette}>
                  <div className="swatch-color" id="newcolor" />
                  <div id="newcolor-plus" />
                </button>
              </div>
              <div className="color">
                <h5>Old</h5>
                <button type="button" className="swatch" id="oldcolor-btn">
                  <div className="swatch-color" id="oldcolor" />
                </button>
              </div>
            </div>
            <div id="rgbahsl">
              <div className="channel-container" id="rgba-container">
                <label>R <input type="number" id="r" min="0" max="255" defaultValue="0" /><SpinBtn /></label>
                <label>G <input type="number" id="g" min="0" max="255" defaultValue="0" /><SpinBtn /></label>
                <label>B <input type="number" id="b" min="0" max="255" defaultValue="0" /><SpinBtn /></label>
                <label>A <input type="number" id="a" min="0" max="255" defaultValue="255" /><SpinBtn /></label>
              </div>
              <div className="channel-container" id="hsl-container">
                <label>H <input type="number" id="h" min="0" max="359" defaultValue="0" /><SpinBtn /></label>
                <label>S <input type="number" id="s" min="0" max="100" defaultValue="0" /><SpinBtn /></label>
                <label>L <input type="number" id="l" min="0" max="100" defaultValue="0" /><SpinBtn /></label>
              </div>
            </div>
            <div id="hex">
              <label>Hex <input type="text" id="hexcode" defaultValue="000000" /></label>
            </div>
            <div id="lumi">
              <label>Lumi <input type="text" id="luminance" readOnly defaultValue="0" /></label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
