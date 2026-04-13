import { useEffect, useRef, useState } from 'react'
import { useAppState } from '../hooks/useAppState.js'
import { state } from '../Context/state.js'
import { canvas } from '../Context/canvas.js'
import { toolGroups } from '../Tools/index.js'
import { switchTool } from '../Tools/toolbox.js'
import { handleUndo, handleRedo } from '../Actions/undoRedo/undoRedo.js'
import { brush, rebuildBuildUpDensityMap } from '../Tools/brush.js'
import { actionClear } from '../Actions/modifyTimeline/modifyTimeline.js'
import { actionZoom, actionRecenter } from '../Actions/untracked/viewActions.js'
import { vectorGui } from '../GUI/vector.js'
import { renderCanvas } from '../Canvas/render.js'
import { renderVectorsToDOM } from '../DOM/renderVectors.js'
import { ZOOM_LEVELS } from '../utils/constants.js'
import { initializeDragger, initializeCollapser } from '../utils/drag.js'

const COLUMN1_TOOLS = ['brush', 'fill', 'curve', 'shapeTools', 'selectionTools']
const COLUMN2_TOOLS = ['eyedropper', 'grab', 'move']


export default function Toolbox() {
  useAppState()
  const ref = useRef(null)
  const [openGroup, setOpenGroup] = useState(null)

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    initializeCollapser(ref.current)
    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  const selectedName = state.tool.selectedName

  function handleUndo_() {
    handleUndo()
    if (brush.modes.buildUpDither) rebuildBuildUpDensityMap()
  }

  function handleRedo_() {
    handleRedo()
    if (brush.modes.buildUpDither) rebuildBuildUpDensityMap()
  }

  function handleRecenter() {
    actionRecenter()
  }

  function handleClear() {
    if (canvas.pastedLayer) return
    canvas.currentLayer.ctx.clearRect(0, 0, canvas.offScreenCVS.width, canvas.offScreenCVS.height)
    state.selection.pointsSet = null
    state.selection.seenPixelsSet = null
    state.timeline.clearPoints()
    vectorGui.reset()
    state.reset()
    actionClear(canvas.currentLayer)
    state.clearRedoStack()
    renderCanvas(canvas.currentLayer)
    renderVectorsToDOM()
  }

  function handleZoom(e) {
    const zoomBtn = e.target.closest('.zoombtn')
    if (!zoomBtn) return
    let idx = ZOOM_LEVELS.findIndex((l) => l >= canvas.zoom)
    if (idx === -1) idx = ZOOM_LEVELS.length - 1
    const nextIdx = zoomBtn.id === 'minus' ? idx - 1 : idx + 1
    if (nextIdx < 0 || nextIdx >= ZOOM_LEVELS.length) return
    const targetZoom = ZOOM_LEVELS[nextIdx]
    const zoomRatio = targetZoom / canvas.zoom
    const zoomedX = (canvas.xOffset + canvas.offScreenCVS.width / 2) / zoomRatio
    const zoomedY = (canvas.yOffset + canvas.offScreenCVS.height / 2) / zoomRatio
    const nox = zoomedX - canvas.offScreenCVS.width / 2
    const noy = zoomedY - canvas.offScreenCVS.height / 2
    actionZoom(targetZoom, nox, noy)
  }

  function handleToolClick(toolName) {
    // Update the group's activeTool so the button remembers the last-used tool
    for (const [groupKey, group] of Object.entries(toolGroups)) {
      if (group.tools.includes(toolName)) {
        group.activeTool = toolName
        break
      }
    }
    switchTool(toolName)
    setOpenGroup(null)
  }

  function handleGroupBtnClick(groupKey) {
    const group = toolGroups[groupKey]
    switchTool(group.activeTool)
    setOpenGroup(openGroup === groupKey ? null : groupKey)
  }

  function renderToolBtn(toolName) {
    const isSelected = selectedName === toolName
    const LABELS = {
      brush: 'Brush (B)', fill: 'Fill (F)', curve: 'Curve (V)',
      eyedropper: 'Eyedropper (Hold Alt)', grab: 'Grab (Hold Space)', move: 'Move',
    }
    const TOOLTIPS = {
      brush: 'Brush (B)', fill: 'Fill (F)', curve: 'Curve (V)',
      eyedropper: 'Eyedropper (Hold Alt)', grab: 'Grab (Hold Space)', move: 'Move',
    }
    return (
      <button
        key={toolName}
        type="button"
        className={`tool ${toolName}${isSelected ? ' selected' : ''}`}
        id={toolName}
        aria-label={LABELS[toolName] ?? toolName}
        data-tooltip={TOOLTIPS[toolName] ?? toolName}
        onClick={() => handleToolClick(toolName)}
      />
    )
  }

  function renderGroup(groupKey) {
    const group = toolGroups[groupKey]
    const activeToolName = group.activeTool
    const isGroupSelected = group.tools.includes(selectedName)
    const groupBtnClass = isGroupSelected ? selectedName : activeToolName
    const isOpen = openGroup === groupKey

    const GROUP_LABELS = {
      shapeTools: 'Shapes',
      selectionTools: 'Select (S)',
    }

    const TOOL_INFO = {
      ellipse: { label: 'Ellipse (O) Hold Shift to maintain circle', tooltip: 'Ellipse (O)\n\nHold Shift to maintain circle' },
      polygon: { label: 'Polygon (P) Hold Shift to maintain square', tooltip: 'Polygon (P)\n\nHold Shift to maintain square' },
      select: { label: 'Select (S)', tooltip: 'Select (S)' },
      magicWand: { label: 'Magic Wand (W)', tooltip: 'Magic Wand (W)' },
    }

    return (
      <div key={groupKey} className={`tool-group${isOpen ? ' open' : ''}`} data-group={groupKey}>
        <button
          type="button"
          className={`tool-group-btn ${groupBtnClass}${isGroupSelected ? ' selected' : ''}`}
          data-group={groupKey}
          aria-label={GROUP_LABELS[groupKey] ?? groupKey}
          data-tooltip={GROUP_LABELS[groupKey] ?? groupKey}
          onClick={() => handleGroupBtnClick(groupKey)}
        />
        {isOpen && (
          <div className="tool-group-popout">
            {group.tools.map((toolName) => {
              const info = TOOL_INFO[toolName] ?? { label: toolName, tooltip: toolName }
              return (
                <button
                  key={toolName}
                  type="button"
                  className={`tool ${toolName}${selectedName === toolName ? ' selected' : ''}`}
                  id={toolName}
                  aria-label={info.label}
                  data-tooltip={info.tooltip}
                  onClick={() => handleToolClick(toolName)}
                />
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="toolbox dialog-box h-drag free locked">
      <div id="toolbox-header" className="header dragger">
        <div className="drag-btn locked">
          <div className="grip"></div>
        </div>
        Toolbox
        <label
          htmlFor="toolbox-collapse-btn"
          id="toolbox-collapser"
          className="collapse-btn"
          data-tooltip="Collapse/ Expand"
        >
          <input
            type="checkbox"
            aria-label="Collapse or Expand"
            className="collapse-checkbox"
            id="toolbox-collapse-btn"
          />
          <span className="arrow"></span>
        </label>
      </div>
      <div className="collapsible">
        <div className="btn-pair">
          <button
            type="button"
            className="tool undo custom-shape"
            id="undo"
            aria-label="Undo (Cmd + Z)"
            data-tooltip="Undo (Cmd + Z)"
            onClick={handleUndo_}
          />
          <button
            type="button"
            className="tool redo custom-shape"
            id="redo"
            aria-label="Redo (Cmd + Shift + Z)"
            data-tooltip="Redo (Cmd + Shift + Z)"
            onClick={handleRedo_}
          />
        </div>
        <div className="btn-pair">
          <button
            type="button"
            className="tool recenter custom-shape"
            aria-label="Recenter Canvas"
            data-tooltip="Recenter Canvas"
            onClick={handleRecenter}
          />
          <button
            type="button"
            className={`tool clear custom-shape${canvas.pastedLayer ? ' disabled' : ''}`}
            aria-label="Clear Canvas"
            data-tooltip="Clear Canvas"
            onClick={handleClear}
          />
        </div>
        <div className="zoom btn-pair" onClick={handleZoom}>
          <button
            type="button"
            id="minus"
            className="zoombtn minus"
            aria-label="Zoom Out (Mouse Wheel)"
            data-tooltip="Zoom Out (Mouse Wheel)"
          />
          <button
            type="button"
            id="plus"
            className="zoombtn plus"
            aria-label="Zoom In (Mouse Wheel)"
            data-tooltip="Zoom In (Mouse Wheel)"
          />
        </div>
        <div className="tools">
          <h4>Tools</h4>
          <div className="columns">
            <div className="column">
              {COLUMN1_TOOLS.map((item) =>
                toolGroups[item] ? renderGroup(item) : renderToolBtn(item)
              )}
            </div>
            <div className="column">
              {COLUMN2_TOOLS.map((name) => renderToolBtn(name))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
