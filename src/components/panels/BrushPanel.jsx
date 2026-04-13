import React, { useEffect, useRef } from 'react'
import { useAppState, bump } from '../../hooks/useAppState.js'
import { state } from '../../Context/state.js'
import { brushStamps, customBrushStamp } from '../../Context/brushStamps.js'
import { brush, rebuildBuildUpDensityMap } from '../../Tools/brush.js'
import { toggleMode } from '../../Tools/toolbox.js'
import { initializeDragger, initializeCollapser } from '../../utils/drag.js'
import { createDitherPatternSVG, initDitherPicker } from '../../DOM/renderBrush.js'
import { updateDitherPickerColors } from '../../DOM/render.js'
import { ditherPatterns } from '../../Context/ditherPatterns.js'
import { openStampEditor } from '../../DOM/stampEditor.js'

const DITHER_TOOLS = ['brush', 'curve', 'ellipse', 'polygon']
const STAMP_TOOLS = ['brush']
const BRUSH_TOOLS = ['brush', 'curve', 'ellipse', 'polygon', 'select']

// Maps mode key → CSS class and label for the mode button
const MODE_BTN_INFO = {
  line:        { cls: 'line',        label: 'Line',              tools: ['curve'] },
  quadCurve:   { cls: 'quadCurve',   label: 'Quadratic Curve',   tools: ['curve'] },
  cubicCurve:  { cls: 'cubicCurve',  label: 'Cubic Curve',       tools: ['curve'] },
  eraser:      { cls: 'eraser',      label: 'Eraser (E)',        tools: ['brush', 'curve', 'ellipse', 'polygon'] },
  inject:      { cls: 'inject',      label: 'Inject (I)',        tools: ['brush', 'curve', 'ellipse', 'polygon'] },
  perfect:     { cls: 'perfect',     label: 'Pixel Perfect (Y)', tools: ['brush'] },
  colorMask:   { cls: 'colorMask',   label: 'Color Mask (M)',    tools: ['brush'] },
}

function buildBrushStampSVG(tool) {
  if (!tool) return null
  const brushType = tool.brushType ?? 'circle'
  const brushSize = tool.brushSize ?? 1
  const stamp = brushStamps[brushType]?.[brushSize]
  const pixels = stamp?.['0,0'] ?? (brushType === 'custom' ? customBrushStamp.pixels : null)
  if (!pixels || pixels.length === 0) return null

  // Each pixel renders as a 2×2 block, centered in the 64×64 container
  const cellSize = 2

  // For custom stamps compute actual bounding box; for standard brushes use [0, brushSize)
  let minX, minY, spanW, spanH
  if (brushType === 'custom') {
    minX = Math.min(...pixels.map((p) => p.x))
    minY = Math.min(...pixels.map((p) => p.y))
    const maxX = Math.max(...pixels.map((p) => p.x))
    const maxY = Math.max(...pixels.map((p) => p.y))
    spanW = maxX - minX + 1
    spanH = maxY - minY + 1
  } else {
    minX = 0
    minY = 0
    spanW = brushSize
    spanH = brushSize
  }

  const offsetX = (64 - spanW * cellSize) / 2
  const offsetY = (64 - spanH * cellSize) / 2
  let pathData = ''
  for (const px of pixels) {
    const x = offsetX + (px.x - minX) * cellSize
    const y = offsetY + (px.y - minY) * cellSize
    pathData += `M${x} ${y}h${cellSize}v${cellSize}h${-cellSize}z`
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      shapeRendering="crispEdges"
      style={{ display: 'block', width: '64px', height: '64px' }}
    >
      <path fill="rgba(255,255,255,255)" d={pathData} />
    </svg>
  )
}

function DitherPreviewSVG({ tool, onClick }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    const pattern = ditherPatterns[tool.ditherPatternIndex ?? 63]
    const offsetX = tool.ditherOffsetX ?? 0
    const offsetY = tool.ditherOffsetY ?? 0
    ref.current.appendChild(createDitherPatternSVG(pattern, offsetX, offsetY))
  })
  return <div ref={ref} className="dither-preview btn" data-tooltip="Click to select dither pattern" onClick={onClick} />
}

export default function BrushPanel() {
  useAppState()
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    initializeCollapser(ref.current)
    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  const tool = state.tool.current
  const toolName = tool?.name ?? ''
  const brushSize = tool?.brushSize ?? 1
  const brushType = tool?.brushType ?? 'circle'
  const showBrushControls = BRUSH_TOOLS.includes(toolName)
  const showStamp = STAMP_TOOLS.includes(toolName)
  const showDither = DITHER_TOOLS.includes(toolName)
  const isBrushDisabled = tool?.brushDisabled ?? false
  const isCustomBrush = brushType === 'custom'

  function handleBrushTypeClick() {
    const current = tool.brushType
    if (current === 'circle') {
      tool.brushType = 'square'
    } else if (current === 'square') {
      if (customBrushStamp.pixels.length === 0) {
        tool.brushType = 'circle'
      } else {
        tool.brushType = 'custom'
      }
    } else {
      tool.brushType = 'circle'
    }
    bump()
  }

  function handleSizeChange(e) {
    tool.brushSize = parseInt(e.target.value)
    bump()
  }

  function handleModeClick(modeKey) {
    toggleMode(modeKey)
    if (modeKey === 'buildUpDither' && !brush.modes.buildUpDither) {
      rebuildBuildUpDensityMap()
    }
    bump()
  }

  function handleStampBtnClick() {
    tool.brushType = 'custom'
    bump()
    const stampEditorContainer = document.getElementById('stamp-editor')
    if (!stampEditorContainer) return
    if (!stampEditorContainer.style.display || stampEditorContainer.style.display === 'none') {
      openStampEditor()
    } else {
      stampEditorContainer.style.display = 'none'
    }
  }

  function handleDitherPreviewClick() {
    const picker = document.querySelector('.dither-picker-container')
    if (!picker) return
    if (picker.style.display === 'flex') {
      picker.style.display = 'none'
    } else {
      updateDitherPickerColors()
      initDitherPicker()
      picker.style.display = 'flex'
    }
  }

  return (
    <div ref={ref} className="brush-container dialog-box draggable v-drag settings-box smooth-shift">
      <div className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        Brush
        <label htmlFor="brush-collapse-btn" className="collapse-btn" data-tooltip="Collapse/ Expand">
          <input
            type="checkbox"
            aria-label="Collapse or Expand"
            className="collapse-checkbox"
            id="brush-collapse-btn"
          />
          <span className="arrow"></span>
        </label>
      </div>
      <div className="collapsible">
        {showBrushControls && (
          <>
            <div
              className="brush-preview btn"
              data-tooltip="Click to switch brush"
              onClick={handleBrushTypeClick}
            >
              {buildBrushStampSVG(tool)}
            </div>
            <div className="brush-size">
              <span id="line-weight">{isCustomBrush ? 32 : brushSize}px</span>
            </div>
            <input
              type="range"
              className="slider"
              id="brush-size"
              min="1"
              max="32"
              value={isCustomBrush ? 32 : brushSize}
              disabled={isBrushDisabled || isCustomBrush}
              onChange={handleSizeChange}
            />
          </>
        )}
        <span className="modes-title">Modes</span>
        <div className="modes-container">
          {Object.entries(MODE_BTN_INFO).map(([key, info]) => {
            if (!info.tools.includes(toolName)) return null
            const isActive = tool?.modes?.[key] ?? false
            return (
              <button
                key={key}
                id={key}
                type="button"
                className={`mode ${info.cls}${isActive ? ' selected' : ''}`}
                aria-label={info.label}
                data-tooltip={info.label}
                onClick={() => handleModeClick(key)}
              />
            )
          })}
        </div>
        <div className="stamp-dither-row">
          {showStamp && (
            <div className="stamp-options">
              <span className="modes-title">Stamp</span>
              <div className="stamp-type-row">
                <button
                  type="button"
                  id="custom-brush-type-btn"
                  className={`mode stamp${isCustomBrush ? ' active' : ''}`}
                  aria-label="Custom Stamp"
                  data-tooltip="Custom Stamp"
                  onClick={handleStampBtnClick}
                />
              </div>
            </div>
          )}
          {showDither && (
            <div className="dither-options">
              <span className="modes-title">Dither</span>
              <DitherPreviewSVG tool={tool} onClick={handleDitherPreviewClick} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
