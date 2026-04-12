import React, { useEffect, useRef } from 'react'
import { useAppState } from '../../hooks/useAppState.js'
import { bump } from '../../hooks/useAppState.js'
import { state } from '../../Context/state.js'
import { vectorGui } from '../../GUI/vector.js'
import { initializeDragger } from '../../utils/drag.js'

export default function SettingsDialog() {
  useAppState()
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  function handleClose() {
    state.ui.settingsOpen = false
    bump()
  }

  function handleTooltips(e) {
    state.ui.showTooltips = e.target.checked
    bump()
  }

  function handleGrid(e) {
    vectorGui.grid = e.target.checked
    vectorGui.render()
    bump()
  }

  function handleGridSpacingInput(e) {
    let val = parseInt(e.target.value)
    if (val < 1) val = 1
    else if (val > 64) val = 64
    e.target.value = val
    vectorGui.gridSpacing = val
    vectorGui.render()
  }

  function handleGridSpacingSpin(e) {
    const id = e.target.id || e.target.closest('[id]')?.id
    if (id === 'inc') {
      vectorGui.gridSpacing = Math.min(64, vectorGui.gridSpacing + 1)
    } else if (id === 'dec') {
      vectorGui.gridSpacing = Math.max(1, vectorGui.gridSpacing - 1)
    }
    vectorGui.render()
    bump()
  }

  function handleCursorPreview(e) {
    vectorGui.showCursorPreview = e.target.checked
  }

  return (
    <div
      ref={ref}
      className="settings-container dialog-box v-drag h-drag free"
      style={{ display: state.ui.settingsOpen ? 'flex' : 'none' }}
    >
      <div id="settings-header" className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        Settings
        <button
          type="button"
          className="close-btn"
          data-tooltip="Close"
          onClick={handleClose}
        ></button>
      </div>
      <div className="collapsible">
        <div className="settings-interface">
          <div className="settings-group">
            <div className="settings-section-header">Display</div>
            <div className="settings-options">
              <label
                htmlFor="tooltips-toggle"
                id="tooltips"
                className="toggle"
                data-tooltip="Toggle tooltips (T)"
              >
                <input
                  type="checkbox"
                  id="tooltips-toggle"
                  defaultChecked={true}
                  onChange={handleTooltips}
                />
                <span className="checkmark"></span>
                <span>Tooltips</span>
              </label>
              <label
                htmlFor="grid-toggle"
                id="grid"
                className="toggle"
                data-tooltip={'Toggle grid (G)\n\nDisplays at higher zoom levels only.'}
              >
                <input
                  type="checkbox"
                  id="grid-toggle"
                  checked={vectorGui.grid}
                  onChange={handleGrid}
                />
                <span className="checkmark"></span>
                <span>Grid</span>
              </label>
              <div className="grid-spacing-container">
                <label htmlFor="grid-spacing">
                  <span>Subgrid Spacing:&nbsp;</span>
                  <input
                    type="number"
                    id="grid-spacing"
                    min="1"
                    max="64"
                    defaultValue={vectorGui.gridSpacing}
                    onInput={handleGridSpacingInput}
                  />
                  <span className="grid-spacing-spin spin-btn" onPointerDown={handleGridSpacingSpin}>
                    <span id="inc" className="channel-btn">
                      <span className="spin-content">+</span>
                    </span>
                    <span id="dec" className="channel-btn">
                      <span className="spin-content">-</span>
                    </span>
                  </span>
                </label>
              </div>
              <label
                htmlFor="vector-outline-toggle"
                id="vector-outline"
                className="toggle"
                data-tooltip="Toggle vector selection outline"
              >
                <input type="checkbox" id="vector-outline-toggle" />
                <span className="checkmark"></span>
                <span>Vector Selection Outline</span>
              </label>
              <label
                htmlFor="cursor-preview-toggle"
                id="cursor-preview"
                className="toggle"
                data-tooltip="Show brush color preview under cursor instead of an outline"
              >
                <input
                  type="checkbox"
                  id="cursor-preview-toggle"
                  defaultChecked={true}
                  onChange={handleCursorPreview}
                />
                <span className="checkmark"></span>
                <span>Cursor Preview</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
