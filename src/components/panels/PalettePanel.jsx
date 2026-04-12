import React, { useState, useRef, useEffect } from 'react'
import { useAppState, bump } from '../../hooks/useAppState.js'
import { swatches } from '../../Context/swatch.js'
import { initializeDragger, initializeCollapser } from '../../utils/drag.js'
import { initializeColorPicker } from '../../Swatch/events.js'
import { DEFAULT_PALETTES, PRESETS } from '../../utils/palettes.js'
import { renderPaletteToDOM, renderPalettePresetsToDOM } from '../../DOM/renderPalette.js'

function onPaletteModified() {
  const id = swatches.currentPreset
  if (id in DEFAULT_PALETTES) {
    const base = PRESETS.find((p) => p.id === id)?.label ?? id
    const existingCount = Object.keys(swatches.customPalettes).filter((k) =>
      k.startsWith(`custom_${id}_`)
    ).length
    const n = existingCount + 1
    const customId = `custom_${id}_${n}`
    const label = n === 1 ? `Custom (${base})` : `Custom (${base}) ${n}`
    swatches.customPalettes[customId] = {
      label,
      colors: swatches.palette.map((c) => ({ ...c })),
    }
    swatches.currentPreset = customId
  } else if (id in swatches.customPalettes) {
    swatches.customPalettes[id].colors = swatches.palette.map((c) => ({ ...c }))
  }
  renderPalettePresetsToDOM()
}

export default function PalettePanel() {
  useAppState()
  const ref = useRef(null)
  const primarySwatchRef = useRef(null)
  const secondarySwatchRef = useRef(null)
  const [presetsOpen, setPresetsOpen] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    initializeDragger(ref.current)
    initializeCollapser(ref.current)
    return () => {
      delete ref.current?.dataset.dragInitialized
    }
  }, [])

  // Register React-rendered swatch DOM elements with swatches context
  useEffect(() => {
    if (primarySwatchRef.current) {
      primarySwatchRef.current.color = swatches.primary.color
      swatches.primary.swatch = primarySwatchRef.current
    }
    if (secondarySwatchRef.current) {
      secondarySwatchRef.current.color = swatches.secondary.color
      swatches.secondary.swatch = secondarySwatchRef.current
    }
  }, [])

  // Close presets dropdown on outside click
  useEffect(() => {
    if (!presetsOpen) return
    function handleOutsideClick() { setPresetsOpen(false) }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [presetsOpen])

  function handlePrimarySwatchClick(e) {
    e.stopPropagation()
    initializeColorPicker(swatches.primary.swatch)
  }

  function handleSecondarySwatchClick(e) {
    e.stopPropagation()
    initializeColorPicker(swatches.secondary.swatch)
  }

  function handleColorSwitch(e) {
    e.stopPropagation()
    const temp = { ...swatches.primary.color }
    swatches.primary.color = swatches.secondary.color
    if (swatches.primary.swatch) swatches.primary.swatch.color = swatches.secondary.color
    document.documentElement.style.setProperty(
      '--primary-swatch-color',
      `${swatches.primary.color.r},${swatches.primary.color.g},${swatches.primary.color.b}`
    )
    document.documentElement.style.setProperty(
      '--primary-swatch-alpha',
      `${swatches.primary.color.a / 255}`
    )
    swatches.secondary.color = temp
    if (swatches.secondary.swatch) swatches.secondary.swatch.color = temp
    document.documentElement.style.setProperty(
      '--secondary-swatch-color',
      `${temp.r},${temp.g},${temp.b}`
    )
    document.documentElement.style.setProperty(
      '--secondary-swatch-alpha',
      `${temp.a / 255}`
    )
    bump()
  }

  function handlePaletteEditClick() {
    swatches.paletteMode = swatches.paletteMode === 'edit' ? 'select' : 'edit'
    bump()
  }

  function handlePaletteRemoveClick() {
    swatches.paletteMode = swatches.paletteMode === 'remove' ? 'select' : 'remove'
    bump()
  }

  function handlePresetsToggle(e) {
    e.stopPropagation()
    setPresetsOpen((prev) => !prev)
  }

  function handlePresetSelect(id) {
    if (id in DEFAULT_PALETTES) {
      swatches.palette = DEFAULT_PALETTES[id].map((c) => ({ ...c }))
    } else if (id in swatches.customPalettes) {
      swatches.palette = swatches.customPalettes[id].colors.map((c) => ({ ...c }))
    } else {
      return
    }
    swatches.currentPreset = id
    setPresetsOpen(false)
    renderPaletteToDOM()
    renderPalettePresetsToDOM()
  }

  function handlePaletteColorClick(color, index) {
    if (swatches.paletteMode === 'edit') {
      swatches.activePaletteIndex = index
      // Create a synthetic swatch element with .color for the legacy picker
      const fakeSwatch = { color }
      initializeColorPicker(fakeSwatch)
    } else if (swatches.paletteMode === 'remove') {
      swatches.palette.splice(index, 1)
      onPaletteModified()
      swatches.paletteMode = 'select'
      renderPaletteToDOM()
    } else {
      // select mode
      if (index === swatches.selectedPaletteIndex) {
        swatches.activePaletteIndex = index
        const fakeSwatch = { color }
        initializeColorPicker(fakeSwatch)
      } else {
        const { r, g, b, a } = color
        document.documentElement.style.setProperty('--primary-swatch-color', `${r},${g},${b}`)
        document.documentElement.style.setProperty('--primary-swatch-alpha', `${a / 255}`)
        swatches.primary.color = color
        if (swatches.primary.swatch) swatches.primary.swatch.color = color
        swatches.selectedPaletteIndex = index
        bump()
      }
    }
  }

  function handleAddColor(e) {
    e.stopPropagation()
    swatches.activePaletteIndex = swatches.palette.length
    const fakeSwatch = { color: swatches.primary.color }
    initializeColorPicker(fakeSwatch)
  }

  const { palette, paletteMode, currentPreset, customPalettes } = swatches

  const presetLabel =
    currentPreset in DEFAULT_PALETTES
      ? PRESETS.find((p) => p.id === currentPreset)?.label ?? currentPreset
      : customPalettes[currentPreset]?.label ?? currentPreset

  return (
    <div ref={ref} className="palette-interface dialog-box draggable v-drag settings-box smooth-shift">
      <div className="header dragger">
        <div className="drag-btn">
          <div className="grip"></div>
        </div>
        Palette
        <label htmlFor="palette-collapse-btn" className="collapse-btn" data-tooltip="Collapse/ Expand">
          <input
            type="checkbox"
            aria-label="Collapse or Expand"
            className="collapse-checkbox"
            id="palette-collapse-btn"
          />
          <span className="arrow"></span>
        </label>
      </div>
      <div className="collapsible">
        <div className="colors">
          <button
            ref={primarySwatchRef}
            type="button"
            className="swatch"
            aria-label="Primary Color"
            data-tooltip="Primary Color"
            onClick={handlePrimarySwatchClick}
          >
            <div className="swatch-color" />
          </button>
          <button
            ref={secondarySwatchRef}
            type="button"
            className="back-swatch"
            aria-label="Secondary Color"
            data-tooltip="Secondary Color"
            onClick={handleSecondarySwatchClick}
          >
            <div className="swatch-color" />
          </button>
          <button
            type="button"
            className="color-switch"
            aria-label="Switch Colors (X)"
            data-tooltip="Switch Colors (X)"
            onClick={handleColorSwitch}
          />
        </div>
        <div className="palette-container">
          <div className="palette-tools">
            <button
              type="button"
              className={`palette-edit${paletteMode === 'edit' ? ' selected' : ''}`}
              aria-label="Edit Palette Color (Hold K)"
              data-tooltip="Edit Palette Color (Hold K)"
              onClick={handlePaletteEditClick}
            />
            <button
              type="button"
              className={`palette-remove${paletteMode === 'remove' ? ' selected' : ''}`}
              aria-label="Remove Palette Color (Hold X)"
              data-tooltip="Remove Palette Color (Hold X)"
              onClick={handlePaletteRemoveClick}
            />
          </div>
          <div className={`palette-presets${presetsOpen ? ' open' : ''}`}>
            <button
              type="button"
              className="palette-presets-btn"
              aria-label="Palette Presets"
              data-tooltip="Palette Presets"
              onClick={handlePresetsToggle}
            >
              {presetLabel}
            </button>
            <ul className="palette-presets-list" role="listbox">
              {PRESETS.map((preset) => (
                <li
                  key={preset.id}
                  role="option"
                  data-id={preset.id}
                  className={currentPreset === preset.id ? 'selected' : ''}
                  onClick={(e) => { e.stopPropagation(); handlePresetSelect(preset.id) }}
                >
                  {preset.label}
                </li>
              ))}
              {Object.entries(customPalettes).map(([id, p]) => (
                <li
                  key={id}
                  role="option"
                  data-id={id}
                  className={currentPreset === id ? 'selected' : ''}
                  onClick={(e) => { e.stopPropagation(); handlePresetSelect(id) }}
                >
                  {p.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="palette-colors">
            {palette.map((color, index) => (
              <button
                key={index}
                type="button"
                className={`palette-color${index === swatches.selectedPaletteIndex ? ' selected' : ''}`}
                aria-label={`Color ${index + 1}`}
                data-tooltip={color.color}
                onClick={() => handlePaletteColorClick(color, index)}
              >
                <div
                  className="swatch"
                  style={{ backgroundColor: color.color, width: '100%', height: '100%' }}
                />
              </button>
            ))}
            <button
              type="button"
              className="add-color"
              aria-label="Add Color"
              data-tooltip="Add current primary color to palette"
              onClick={handleAddColor}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
