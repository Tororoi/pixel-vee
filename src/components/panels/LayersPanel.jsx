import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useAppState, bump } from '../../hooks/useAppState.js'
import { state } from '../../Context/state.js'
import { canvas } from '../../Context/canvas.js'
import { vectorGui } from '../../GUI/vector.js'
import { renderCanvas } from '../../Canvas/render.js'
import { renderLayersToDOM, renderVectorsToDOM } from '../../DOM/render.js'
import { addRasterLayer, addReferenceLayer, removeLayer } from '../../Actions/layer/layerActions.js'
import { switchTool } from '../../Tools/toolbox.js'
import { initializeDragger, initializeCollapser } from '../../utils/drag.js'
import { dom } from '../../Context/dom.js'

function LayerSettingsPopout({ layer, anchorEl, onClose }) {
  const [title, setTitle] = useState(layer.title ?? '')
  const [opacity, setOpacity] = useState(Math.round((layer.opacity ?? 1) * 255))
  const ref = useRef(null)

  // Compute portal position
  const [pos, setPos] = useState({ top: 0, left: 0 })
  useEffect(() => {
    if (!anchorEl) return
    const rect = anchorEl.getBoundingClientRect()
    setPos({ top: rect.top + window.scrollY, left: rect.right + window.scrollX + 4 })
  }, [anchorEl])

  // Close on outside pointerdown
  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target) && !e.target.classList.contains('gear')) {
        onClose()
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  }, [onClose])

  function handleTitleChange(e) {
    const val = e.target.value.slice(0, 12)
    setTitle(val)
    layer.title = val
    renderLayersToDOM()
  }

  function handleOpacityChange(e) {
    const val = parseInt(e.target.value)
    setOpacity(val)
    layer.opacity = val / 255
    renderCanvas(layer)
  }

  return ReactDOM.createPortal(
    <div
      ref={ref}
      className="layer-settings"
      style={{ display: 'flex', position: 'fixed', top: pos.top, left: pos.left, zIndex: 1000 }}
    >
      <div className="header">
        Layer Settings
        <button type="button" className="close-btn" data-tooltip="Close" onClick={onClose} />
      </div>
      <div className="layer-name-label">
        <label htmlFor="layer-name" className="input-label">Name</label>
        <input
          id="layer-name"
          type="text"
          maxLength={12}
          value={title}
          onChange={handleTitleChange}
        />
      </div>
      <div className="layer-opacity-label">
        <span className="input-label">Opacity: {opacity}</span>
        <input
          type="range"
          className="slider"
          min="0"
          max="255"
          value={opacity}
          onChange={handleOpacityChange}
        />
      </div>
    </div>,
    document.body
  )
}

export default function LayersPanel() {
  useAppState()
  const ref = useRef(null)
  const uploadRef = useRef(null)
  const [settingsLayer, setSettingsLayer] = useState(null)
  const [settingsAnchor, setSettingsAnchor] = useState(null)
  const dragIndexRef = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    initializeCollapser(ref.current)
    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  const isPasted = !!canvas.pastedLayer
  const visibleLayers = canvas.layers.filter((l) => !l.removed && !l.isPreview)

  function handleAddLayer() {
    if (isPasted) return
    addRasterLayer()
  }

  function handleUploadRef(e) {
    if (e.target.files?.[0]) {
      // addReferenceLayer uses `this.files` — bind to the input element
      addReferenceLayer.call(uploadRef.current)
      e.target.value = null
    }
  }

  function handleDeleteLayer() {
    if (isPasted) return
    const layer = canvas.currentLayer
    removeLayer(layer)
    renderCanvas(layer)
  }

  function handleLayerClick(layer) {
    if (isPasted) return
    if (layer === canvas.currentLayer) return
    if (canvas.currentLayer.type === 'reference') {
      state.deselect()
    }
    canvas.currentLayer.inactiveTools?.forEach((tool) => {
      if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = false
    })
    canvas.currentLayer = layer
    canvas.currentLayer.inactiveTools?.forEach((tool) => {
      if (dom[`${tool}Btn`]) dom[`${tool}Btn`].disabled = true
    })
    vectorGui.reset()
    vectorGui.render()
    if (layer.type === 'reference') {
      switchTool('move')
    }
    renderLayersToDOM()
    renderVectorsToDOM()
    renderCanvas(layer)
  }

  function handleHideToggle(e, layer) {
    e.stopPropagation()
    layer.hidden = !layer.hidden
    renderCanvas(layer)
    bump()
  }

  function handleGearClick(e, layer) {
    e.stopPropagation()
    if (settingsLayer === layer) {
      setSettingsLayer(null)
      setSettingsAnchor(null)
    } else {
      setSettingsLayer(layer)
      setSettingsAnchor(e.currentTarget)
    }
  }

  // Drag-and-drop layer reordering
  function handleDragStart(e, layer) {
    if (isPasted) { e.preventDefault(); return }
    dragIndexRef.current = canvas.layers.indexOf(layer)
    e.dataTransfer.setData('text', String(dragIndexRef.current))
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  function handleDrop(e, targetLayer) {
    e.preventDefault()
    const draggedIndex = parseInt(e.dataTransfer.getData('text'))
    const heldLayer = canvas.layers[draggedIndex]
    const newIndex = canvas.layers.indexOf(targetLayer)
    if (heldLayer === targetLayer) return

    canvas.layers.splice(draggedIndex, 1)
    canvas.layers.splice(newIndex, 0, heldLayer)

    // Reorder onscreen canvases in DOM
    dom.canvasLayers?.removeChild(heldLayer.onscreenCvs)
    if (newIndex >= dom.canvasLayers?.children.length) {
      dom.canvasLayers?.appendChild(heldLayer.onscreenCvs)
    } else {
      dom.canvasLayers?.insertBefore(heldLayer.onscreenCvs, dom.canvasLayers.children[newIndex])
    }
    renderLayersToDOM()
  }

  const canDelete =
    !isPasted &&
    (canvas.activeLayerCount > 1 || canvas.currentLayer?.type !== 'raster')

  return (
    <div ref={ref} className={`layers-interface dialog-box draggable v-drag settings-box smooth-shift${isPasted ? ' disabled' : ''}`}>
      <div className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        Layers
        <label htmlFor="layers-collapse-btn" className="collapse-btn" data-tooltip="Collapse/ Expand">
          <input
            type="checkbox"
            aria-label="Collapse or Expand"
            className="collapse-checkbox"
            id="layers-collapse-btn"
          />
          <span className="arrow"></span>
        </label>
      </div>
      <div className="collapsible">
        <div className="layers-control">
          <button
            type="button"
            className="add-layer"
            aria-label="New Layer"
            data-tooltip="New Layer"
            disabled={isPasted}
            onClick={handleAddLayer}
          />
          <label
            htmlFor="file-upload"
            className={`reference${isPasted ? ' disabled' : ''}`}
            aria-label="Add Reference Layer"
            data-tooltip="Add Reference Layer"
          />
          <input
            type="file"
            id="file-upload"
            ref={uploadRef}
            accept="image/*"
            disabled={isPasted}
            onChange={handleUploadRef}
            onClick={(e) => { e.target.value = null }}
          />
          <button
            type="button"
            id="delete-layer"
            className="trash"
            aria-label="Delete Layer"
            data-tooltip="Delete Layer"
            disabled={!canDelete}
            onClick={handleDeleteLayer}
          />
        </div>
        <div className="layers-container">
          <div className="layers">
            {visibleLayers.map((layer) => {
              const isSelected = layer === canvas.currentLayer
              const isSettingsOpen = settingsLayer === layer
              return (
                <div
                  key={layer.id ?? layer.title}
                  className={`layer ${layer.type}${isSelected ? ' selected' : ''}`}
                  draggable={!isPasted}
                  onDragStart={(e) => handleDragStart(e, layer)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, layer)}
                  onClick={() => handleLayerClick(layer)}
                >
                  <button
                    type="button"
                    className={`hide ${layer.hidden ? 'eyeclosed' : 'eyeopen'}`}
                    aria-label={layer.hidden ? 'Show Layer' : 'Hide Layer'}
                    data-tooltip={layer.hidden ? 'Show Layer' : 'Hide Layer'}
                    onClick={(e) => handleHideToggle(e, layer)}
                  />
                  <span className="layer-title">{layer.title}</span>
                  <button
                    type="button"
                    className={`gear${isSettingsOpen ? ' active' : ''}`}
                    aria-label="Layer Settings"
                    data-tooltip="Layer Settings"
                    onClick={(e) => handleGearClick(e, layer)}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {settingsLayer && (
        <LayerSettingsPopout
          layer={settingsLayer}
          anchorEl={settingsAnchor}
          onClose={() => { setSettingsLayer(null); setSettingsAnchor(null) }}
        />
      )}
    </div>
  )
}
