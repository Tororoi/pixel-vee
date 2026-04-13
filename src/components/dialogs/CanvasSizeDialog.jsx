import React, { useEffect, useRef, useState } from 'react'
import { useAppState, bump } from '../../hooks/useAppState.js'
import { state } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import {
  resizeOverlay,
  applyFromInputs,
  applyResize,
  setAnchor,
  deactivateResizeOverlay,
} from '../../Canvas/resizeOverlay.js'
import { resizeOffScreenCanvas } from '../../Canvas/render.js'
import { initializeDragger } from '../../utils/drag.js'

const MINIMUM_DIMENSION = 8
const MAXIMUM_DIMENSION = 1024

const ANCHORS = [
  'top-left', 'top', 'top-right',
  'left',     'center', 'right',
  'bottom-left', 'bottom', 'bottom-right',
]

export default function CanvasSizeDialog() {
  useAppState()
  const ref = useRef(null)
  const [activeAnchor, setActiveAnchor] = useState('top-left')
  const [width, setWidth] = useState(canvas.offScreenCVS.width)
  const [height, setHeight] = useState(canvas.offScreenCVS.height)
  const widthFocusedRef = useRef(false)
  const heightFocusedRef = useRef(false)

  // Reset dimensions and anchor when dialog opens
  const isOpen = state.ui.canvasSizeOpen
  const prevOpenRef = useRef(false)
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setWidth(canvas.offScreenCVS.width)
      setHeight(canvas.offScreenCVS.height)
      setActiveAnchor('top-left')
    }
    prevOpenRef.current = isOpen
  }, [isOpen])

  // Sync dimensions from resizeOverlay when bump() fires (e.g. from drag handles)
  useEffect(() => {
    if (!state.canvas.resizeOverlayActive) return
    if (!widthFocusedRef.current) setWidth(resizeOverlay.newWidth)
    if (!heightFocusedRef.current) setHeight(resizeOverlay.newHeight)
  })

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  function handleWidthChange(e) {
    const val = e.target.value
    setWidth(val)
    if (state.canvas.resizeOverlayActive) {
      applyFromInputs(+val, +height)
    }
  }

  function handleHeightChange(e) {
    const val = e.target.value
    setHeight(val)
    if (state.canvas.resizeOverlayActive) {
      applyFromInputs(+width, +val)
    }
  }

  function handleWidthBlur(e) {
    let val = +e.target.value
    if (val > MAXIMUM_DIMENSION) val = MAXIMUM_DIMENSION
    else if (val < MINIMUM_DIMENSION) val = MINIMUM_DIMENSION
    setWidth(val)
  }

  function handleHeightBlur(e) {
    let val = +e.target.value
    if (val > MAXIMUM_DIMENSION) val = MAXIMUM_DIMENSION
    else if (val < MINIMUM_DIMENSION) val = MINIMUM_DIMENSION
    setHeight(val)
  }

  function handleWidthSpin(e) {
    const id = e.target.id || e.target.closest('[id]')?.id
    let val = Math.floor(+width)
    if (id === 'inc' && val < MAXIMUM_DIMENSION) val++
    else if (id === 'dec' && val > MINIMUM_DIMENSION) val--
    setWidth(val)
    if (state.canvas.resizeOverlayActive) applyFromInputs(val, +height)
  }

  function handleHeightSpin(e) {
    const id = e.target.id || e.target.closest('[id]')?.id
    let val = Math.floor(+height)
    if (id === 'inc' && val < MAXIMUM_DIMENSION) val++
    else if (id === 'dec' && val > MINIMUM_DIMENSION) val--
    setHeight(val)
    if (state.canvas.resizeOverlayActive) applyFromInputs(+width, val)
  }

  function handleAnchorClick(anchor) {
    setActiveAnchor(anchor)
    setAnchor(anchor)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (state.canvas.resizeOverlayActive) {
      applyResize()
    } else {
      resizeOffScreenCanvas(+width, +height)
    }
    state.ui.canvasSizeOpen = false
    bump()
  }

  function handleCancel() {
    deactivateResizeOverlay()
    state.ui.canvasSizeOpen = false
    bump()
  }

  function handleClose() {
    deactivateResizeOverlay()
    state.ui.canvasSizeOpen = false
    bump()
  }

  return (
    <div
      ref={ref}
      className="size-container dialog-box v-drag h-drag free"
      style={{ display: isOpen ? 'flex' : 'none' }}
    >
      <div id="size-header" className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        Canvas Size
        <button
          type="button"
          className="close-btn"
          data-tooltip="Close"
          onClick={handleClose}
        ></button>
      </div>
      <div className="collapsible">
        <form className="dimensions-form" onSubmit={handleSubmit}>
          <div className="inputs">
            <label htmlFor="canvas-width">
              Width:
              <span className="input">
                <input
                  type="number"
                  id="canvas-width"
                  min="8"
                  max="1024"
                  value={width}
                  onChange={handleWidthChange}
                  onFocus={() => { widthFocusedRef.current = true }}
                  onBlur={(e) => { widthFocusedRef.current = false; handleWidthBlur(e) }}
                />
                <span className="spin-btn" onPointerDown={handleWidthSpin}>
                  <span id="inc" className="channel-btn">
                    <span className="spin-content">+</span>
                  </span>
                  <span id="dec" className="channel-btn">
                    <span className="spin-content">-</span>
                  </span>
                </span>
              </span>
            </label>
            <label htmlFor="canvas-height">
              Height:
              <span className="input">
                <input
                  type="number"
                  id="canvas-height"
                  min="8"
                  max="1024"
                  value={height}
                  onChange={handleHeightChange}
                  onFocus={() => { heightFocusedRef.current = true }}
                  onBlur={(e) => { heightFocusedRef.current = false; handleHeightBlur(e) }}
                />
                <span className="spin-btn" onPointerDown={handleHeightSpin}>
                  <span id="inc" className="channel-btn">
                    <span className="spin-content">+</span>
                  </span>
                  <span id="dec" className="channel-btn">
                    <span className="spin-content">-</span>
                  </span>
                </span>
              </span>
            </label>
          </div>
          <div className="anchor-section">
            <span className="anchor-label">Anchor:</span>
            <div className="anchor-grid" id="anchor-grid">
              {ANCHORS.map((anchor) => (
                <button
                  key={anchor}
                  type="button"
                  className={`anchor-btn${activeAnchor === anchor ? ' active' : ''}`}
                  data-anchor={anchor}
                  aria-label={`Anchor ${anchor}`}
                  onClick={() => handleAnchorClick(anchor)}
                ></button>
              ))}
            </div>
          </div>
          <div className="buttons-container">
            <button
              type="submit"
              id="update-size"
              className="update-size"
              aria-label="Update Canvas Size"
            >
              Submit
            </button>
            <button
              type="button"
              id="cancel-resize-button"
              className="update-size"
              aria-label="Close canvas resize dialog box"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
