import React, { useEffect, useRef } from 'react'
import { useAppState, bump } from '../../hooks/useAppState.js'
import { state } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { consolidateLayers } from '../../Canvas/layers.js'
import { initializeDragger } from '../../utils/drag.js'

const SCALES = [1, 2, 4, 8]

export default function ExportDialog() {
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
    state.ui.exportOpen = false
    bump()
  }

  function handleExport(scale) {
    consolidateLayers()
    const scaledCanvas = document.createElement('canvas')
    scaledCanvas.width = canvas.offScreenCVS.width * scale
    scaledCanvas.height = canvas.offScreenCVS.height * scale
    const ctx = scaledCanvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(canvas.offScreenCVS, 0, 0, scaledCanvas.width, scaledCanvas.height)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = scaledCanvas.toDataURL()
    a.download = 'pixelvee.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div
      ref={ref}
      className="export-container dialog-box v-drag h-drag free"
      style={{ display: state.ui.exportOpen ? 'flex' : 'none' }}
    >
      <div id="export-header" className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        <span>Export</span>
        <button
          type="button"
          className="close-btn"
          data-tooltip="Close"
          onClick={handleClose}
        ></button>
      </div>
      <div className="collapsible">
        <div id="export-interface" className="export-interface">
          {SCALES.map((scale) => (
            <button
              key={scale}
              type="button"
              className="btn"
              onClick={() => handleExport(scale)}
            >
              {scale}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
