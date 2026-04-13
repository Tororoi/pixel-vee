import React, { useRef } from 'react'
import { useAppState, bump } from '../hooks/useAppState.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { vectorGui } from '../GUI/vector.js'
import { activateResizeOverlay } from '../Canvas/resizeOverlay.js'
import {
  actionSelectAll,
  actionDeselect,
  actionDeleteSelection,
} from '../Actions/nonPointer/selectionActions.js'
import {
  actionCutSelection,
  actionPasteSelection,
  actionCopySelection,
} from '../Actions/nonPointer/clipboardActions.js'
import {
  actionFlipPixels,
  actionRotatePixels,
} from '../Actions/transform/rasterTransform.js'
import { openSaveDialogBox } from '../Menu/events.js'

function camelCaseToWords(str) {
  let result = str.replace(/([A-Z])/g, ' $1')
  return (result.charAt(0).toUpperCase() + result.slice(1)).trim()
}

export default function NavBar() {
  useAppState()
  const importRef = useRef(null)
  const openRef = useRef(null)

  // Derive disabled states
  const hasPaste = !!canvas.pastedLayer
  const hasSelection =
    !hasPaste &&
    (state.vector.currentIndex !== null ||
      state.vector.selectedIndices.size > 0)
  const hasClipboard =
    !hasPaste &&
    (state.clipboard.select.canvas !== null ||
      Object.keys(state.clipboard.select.vectors).length > 0)
  const canFlipRotate =
    hasPaste ||
    state.vector.currentIndex !== null ||
    state.vector.selectedIndices.size > 0

  // Tool options (only show for curve, ellipse, polygon, select)
  const toolName = state.tool.current?.name
  const toolOptions = state.tool.current?.options ?? {}
  const showOptions = ['curve', 'ellipse', 'polygon', 'select'].includes(toolName)

  function handleOptionChange(optionName, checked) {
    if (state.tool.current.options[optionName]) {
      state.tool.current.options[optionName].active = checked
    }
    vectorGui.render()
    bump()
  }

  function handleOpenFile(e) {
    // handled by input change
  }

  function handleLoadDrawing(e) {
    if (!e.target.files?.[0]) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      import('../Save/savefile.js').then(({ loadDrawing }) => loadDrawing(ev.target.result))
    }
    reader.readAsText(e.target.files[0])
    e.target.value = null
  }

  function handleImport(e) {
    if (!e.target.files?.[0]) return
    const reader = new FileReader()
    const img = new Image()
    reader.onload = (ev) => {
      img.src = ev.target.result
      img.onload = () => {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = img.width
        tempCanvas.height = img.height
        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        const prev = { ...state.clipboard.select }
        prev.selectProperties = { ...state.clipboard.select.selectProperties }
        state.clipboard.select.selectProperties = { px1: 0, py1: 0, px2: img.width, py2: img.height }
        state.clipboard.select.boundaryBox = { xMin: 0, yMin: 0, xMax: img.width, yMax: img.height }
        state.clipboard.select.canvas = tempCanvas
        state.clipboard.select.imageData = ctx.getImageData(0, 0, img.width, img.height)
        actionPasteSelection()
        state.clipboard.select = prev
      }
    }
    reader.readAsDataURL(e.target.files[0])
    e.target.value = null
  }

  function handleExport() {
    import('../Canvas/layers.js').then(({ consolidateLayers }) => {
      consolidateLayers()
      state.ui.exportOpen = true
      bump()
    })
  }

  function handleCanvasSize() {
    if (hasPaste) return
    state.ui.canvasSizeOpen = true
    activateResizeOverlay()
  }

  function handleSettings() {
    state.ui.settingsOpen = !state.ui.settingsOpen
    bump()
  }

  function handleTopMenuClick() {
    const activeEl = document.activeElement
    if (activeEl?.classList.contains('menu-folder')) {
      if (activeEl.classList.contains('active')) {
        activeEl.classList.remove('active')
      } else {
        activeEl.classList.add('active')
      }
    }
  }

  function handleMenuFolderBlur(e) {
    e.currentTarget.classList.remove('active')
  }

  return (
    <div id="options" className="nav">
      <div className="nav-menu" style={{ alignSelf: 'stretch' }}>
        <div className="title">
          <a
            href="https://github.com/Tororoi/pixel-vee"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit the Github Repo in a new tab"
          >
            <img src="./public/pixel-vee.png" alt="Github Repo" />
          </a>
        </div>
        <ul role="menu" aria-label="functions" id="top-menu" onClick={handleTopMenuClick}>
          {/* File menu */}
          <li role="menuitem" aria-haspopup="true" className="menu-folder" tabIndex={0} onBlur={handleMenuFolderBlur}>
            <span className="menu-folder-title">File</span>
            <ul role="menu" id="file-submenu">
              <li role="menuitem" className="open-save">
                <label htmlFor="drawing-upload" data-tooltip="Open saved drawing">Open</label>
                <input
                  type="file"
                  accept=".pxv"
                  id="drawing-upload"
                  ref={openRef}
                  onChange={handleLoadDrawing}
                  onClick={(e) => { e.target.value = null }}
                />
              </li>
              <li
                role="menuitem"
                id="save"
                data-tooltip="Open dialog box to download file with current progress"
                onClick={openSaveDialogBox}
              >
                Save As... (Cmd + S)
              </li>
              <li role="menuitem" className={`import-image${hasPaste ? ' disabled' : ''}`}>
                <label htmlFor="import" data-tooltip="Import image">Import</label>
                <input
                  type="file"
                  accept="image/*"
                  id="import"
                  ref={importRef}
                  onChange={handleImport}
                  disabled={hasPaste}
                />
              </li>
              <li
                role="menuitem"
                id="export"
                data-tooltip="Download as .png"
                onClick={handleExport}
              >
                Export
              </li>
            </ul>
          </li>
          {/* Edit menu */}
          <li role="menuitem" aria-haspopup="true" className="menu-folder" tabIndex={1} onBlur={handleMenuFolderBlur}>
            <span className="menu-folder-title">Edit</span>
            <ul role="menu" id="edit-submenu">
              <li
                role="menuitem"
                id="canvas-size"
                className={hasPaste ? 'disabled' : ''}
                data-tooltip="Open dialog box to resize canvas area"
                onClick={handleCanvasSize}
              >
                Resize Canvas...
              </li>
              <li
                role="menuitem"
                id="select-all"
                className={hasPaste ? 'disabled' : ''}
                data-tooltip="Select entire canvas (Cmd + A)"
                onClick={hasPaste ? undefined : actionSelectAll}
              >
                Select All (Cmd + A)
              </li>
              <li
                role="menuitem"
                id="deselect"
                className={!hasSelection ? 'disabled' : ''}
                data-tooltip="Deselect selection area (Cmd + D)"
                onClick={hasSelection ? actionDeselect : undefined}
              >
                Deselect (Cmd + D)
              </li>
              <li
                role="menuitem"
                id="cut-selection"
                className={!hasSelection ? 'disabled' : ''}
                data-tooltip="Cut selection (Cmd + X)"
                onClick={hasSelection ? actionCutSelection : undefined}
              >
                Cut (Cmd + X)
              </li>
              <li
                role="menuitem"
                id="copy-selection"
                className={!hasSelection ? 'disabled' : ''}
                data-tooltip="Copy selection (Cmd + C)"
                onClick={hasSelection ? actionCopySelection : undefined}
              >
                Copy (Cmd + C)
              </li>
              <li
                role="menuitem"
                id="paste-selection"
                className={!hasClipboard ? 'disabled' : ''}
                data-tooltip="Paste copied selection (Cmd + V)"
                onClick={hasClipboard ? actionPasteSelection : undefined}
              >
                Paste (Cmd + V)
              </li>
              <li
                role="menuitem"
                id="delete-selection"
                className={!hasSelection ? 'disabled' : ''}
                data-tooltip="Delete selection (Backspace)"
                onClick={hasSelection ? actionDeleteSelection : undefined}
              >
                Clear (Backspace)
              </li>
              <li
                role="menuitem"
                id="flip-horizontal"
                className={!canFlipRotate ? 'disabled' : ''}
                data-tooltip="Flip selection horizontally (Cmd + F)"
                onClick={canFlipRotate ? () => actionFlipPixels(true) : undefined}
              >
                Flip Horizontal (Cmd + F)
              </li>
              <li
                role="menuitem"
                id="flip-vertical"
                className={!canFlipRotate ? 'disabled' : ''}
                data-tooltip="Flip selection vertically (Cmd + Shift + F)"
                onClick={canFlipRotate ? () => actionFlipPixels(false) : undefined}
              >
                Flip Vertical (Cmd + Shift + F)
              </li>
              <li
                role="menuitem"
                id="rotate-right"
                className={!canFlipRotate ? 'disabled' : ''}
                data-tooltip="Rotate selection 90 degrees clockwise (Cmd + R)"
                onClick={canFlipRotate ? actionRotatePixels : undefined}
              >
                Rotate Right (Cmd + R)
              </li>
            </ul>
          </li>
        </ul>
      </div>
      <div className="nav-items">
        {/* Tool Options Bar */}
        {showOptions && (
          <div className="tool-options">
            {Object.entries(toolOptions).map(([optionName, option]) => (
              <label
                key={optionName}
                htmlFor={`${optionName}-toggle`}
                id={optionName}
                className="toggle"
                data-tooltip={option.tooltip}
              >
                <input
                  type="checkbox"
                  id={`${optionName}-toggle`}
                  checked={!!option.active}
                  onChange={(e) => handleOptionChange(optionName, e.target.checked)}
                />
                <span className="checkmark"></span>
                {camelCaseToWords(optionName)}
              </label>
            ))}
          </div>
        )}
        {!showOptions && <div className="tool-options"></div>}
        <div className="settings">
          <button
            type="button"
            className="gear"
            id="settings-btn"
            aria-label="Open settings menu"
            data-tooltip="Open settings menu"
            onClick={handleSettings}
          />
        </div>
      </div>
    </div>
  )
}
