import React, { useEffect, useRef, useState } from 'react'
import { useAppState, bump } from '../../hooks/useAppState.js'
import { state } from '../../Context/state.js'
import { saveDrawing, computeFileSizePreview } from '../../Save/savefile.js'
import { measureTextWidth } from '../../utils/measureHelpers.js'
import { initializeDragger } from '../../utils/drag.js'

export default function SaveDialog() {
  useAppState()
  const ref = useRef(null)
  const [fileSize, setFileSize] = useState('')
  const settings = state.ui.saveSettings
  const isOpen = state.ui.saveDialogOpen
  const prevOpenRef = useRef(false)

  // Recompute filesize whenever dialog opens or settings change
  useEffect(() => {
    if (isOpen) {
      setFileSize('Calculating...')
      computeFileSizePreview().then(setFileSize)
    }
    prevOpenRef.current = isOpen
  }, [
    isOpen,
    settings.preserveHistory,
    settings.includePalette,
    settings.includeReferenceLayers,
    settings.includeRemovedActions,
  ])

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  function handleClose() {
    state.ui.saveDialogOpen = false
    bump()
  }

  function handleFileNameInput(e) {
    state.ui.saveSettings.saveAsFileName = e.target.value
    const w = measureTextWidth(e.target.value, "16px '04Font'") + 2
    e.target.style.width = w + 'px'
  }

  function handlePreserveHistory(e) {
    state.ui.saveSettings.preserveHistory = e.target.checked
    bump()
  }

  function handleIncludePalette(e) {
    state.ui.saveSettings.includePalette = e.target.checked
    bump()
  }

  function handleIncludeReferenceLayers(e) {
    state.ui.saveSettings.includeReferenceLayers = e.target.checked
    bump()
  }

  function handleIncludeRemovedActions(e) {
    state.ui.saveSettings.includeRemovedActions = e.target.checked
    bump()
  }

  function handleSubmit(e) {
    e.preventDefault()
    saveDrawing()
    state.ui.saveDialogOpen = false
    bump()
  }

  const advancedDisabled = settings.preserveHistory

  return (
    <div
      ref={ref}
      className="save-container dialog-box v-drag h-drag free"
      style={{ display: isOpen ? 'flex' : 'none' }}
    >
      <div id="save-header" className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        <span>Save Options</span>
        <button
          type="button"
          className="close-btn"
          data-tooltip="Close"
          onClick={handleClose}
        ></button>
      </div>
      <div className="collapsible">
        <form id="save-interface" className="save-interface" onSubmit={handleSubmit}>
          <div className="save-setting">
            <label htmlFor="save-file-name" className="save-file-name-label">
              <span className="input-label">Save As:</span>
              <input
                type="text"
                id="save-file-name"
                name="save-file-name"
                placeholder="my drawing"
                maxLength="24"
                defaultValue={settings.saveAsFileName}
                onInput={handleFileNameInput}
              />
              <span>.pxv</span>
            </label>
          </div>

          <div id="filesize-preview" className="save-setting">
            <span>Filesize:&nbsp;</span>
            <span id="savefile-size">{fileSize}</span>
          </div>

          <div className="save-setting">
            <label
              htmlFor="preserve-history-toggle"
              id="preserve-history"
              className="toggle"
              data-tooltip="Preserve all actions in history, palette, and reference images"
            >
              <input
                type="checkbox"
                id="preserve-history-toggle"
                name="preserve-history"
                defaultChecked={settings.preserveHistory}
                onChange={handlePreserveHistory}
              />
              <span className="checkmark"></span>
              <span>Preserve Entire History</span>
            </label>
          </div>

          <div
            className={`advanced-options${advancedDisabled ? ' disabled' : ''}`}
            id="save-advanced-options"
          >
            <div className="save-setting">
              <label
                htmlFor="include-palette-toggle"
                id="include-palette"
                className="toggle"
                data-tooltip="Save colors in palette"
              >
                <input
                  type="checkbox"
                  id="include-palette-toggle"
                  name="include-palette"
                  defaultChecked={settings.includePalette}
                  onChange={handleIncludePalette}
                />
                <span className="checkmark"></span>
                <span>Palette</span>
              </label>
            </div>

            <div className="save-setting">
              <label
                htmlFor="include-reference-layers-toggle"
                id="include-reference-layers"
                className="toggle"
                data-tooltip="Save all reference images, including any transformations applied to them."
              >
                <input
                  type="checkbox"
                  id="include-reference-layers-toggle"
                  name="include-reference-layers"
                  defaultChecked={settings.includeReferenceLayers}
                  onChange={handleIncludeReferenceLayers}
                />
                <span className="checkmark"></span>
                <span>Reference Layers</span>
              </label>
            </div>

            <div className="save-setting">
              <label
                htmlFor="include-removed-actions-toggle"
                id="include-removed-actions"
                className="toggle"
                data-tooltip="If a layer or vector was trashed or layer was cleared, those actions are still recoverable by using undo. If you're certain those actions won't be missed, you can remove them permanently by unchecking this box."
              >
                <input
                  type="checkbox"
                  id="include-removed-actions-toggle"
                  name="include-removed-actions"
                  defaultChecked={settings.includeRemovedActions}
                  onChange={handleIncludeRemovedActions}
                />
                <span className="checkmark"></span>
                <span>Removed Actions</span>
              </label>
            </div>
          </div>

          <div className="save-buttons">
            <button
              type="submit"
              id="save-button"
              className="btn"
              aria-label="Save offline as a .pxv file"
              data-tooltip="Save offline as a .pxv file"
            >
              Save
            </button>
            <button
              type="button"
              id="cancel-save-button"
              className="btn"
              aria-label="Close save dialog box"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
