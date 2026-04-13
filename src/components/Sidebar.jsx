import { useEffect, useRef } from 'react'
import { initializeDragger, initializeCollapser } from '../utils/drag.js'
import BrushPanel from './panels/BrushPanel.jsx'
import PalettePanel from './panels/PalettePanel.jsx'
import LayersPanel from './panels/LayersPanel.jsx'
import VectorsPanel from './panels/VectorsPanel.jsx'

export default function Sidebar() {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    initializeCollapser(ref.current)
    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  return (
    <div ref={ref} className="sidebar dialog-box h-drag free locked">
      <div id="sidebar-header" className="header dragger">
        <div className="drag-btn locked">
          <div className="grip"></div>
        </div>
        Tools
        <label
          htmlFor="sidebar-collapse-btn"
          className="collapse-btn"
          data-tooltip="Collapse/ Expand"
        >
          <input
            type="checkbox"
            aria-label="Collapse or Expand"
            className="collapse-checkbox"
            id="sidebar-collapse-btn"
          />
          <span className="arrow"></span>
        </label>
      </div>
      <div className="collapsible">
        <BrushPanel />
        <PalettePanel />
        <LayersPanel />
        <VectorsPanel />
      </div>
    </div>
  )
}
