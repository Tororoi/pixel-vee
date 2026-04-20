<script>
  import { onMount } from 'svelte'
  import { appState } from '../../hooks/appState.svelte.js'
  import { portal } from '../../utils/portal.js'
  import { globalState } from '../../Context/state.js'
  import { dom } from '../../Context/dom.js'
  import { renderCanvas } from '../../Canvas/render.js'
  import {
    changeActionVectorMode,
    changeActionVectorBrushSize,
    changeActionVectorCurveType,
  } from '../../Actions/modifyTimeline/modifyTimeline.js'
  import { initializeColorPicker } from '../../Swatch/events.js'
  import { ditherPatterns } from '../../Context/ditherPatterns.js'
  import { createVectorDitherPatternSVG } from '../../DOM/renderVectors.js'
  import {
    applyDitherOffset,
    applyDitherOffsetControl,
  } from '../../DOM/renderBrush.js'
  import { vectorGui } from '../../GUI/vector.js'

  const { vector, pos, onclose } = $props()

  let ref = $state(null)

  onMount(() => {
    function handleOutside(e) {
      if (
        ref &&
        !ref.contains(e.target) &&
        !e.target.classList.contains('gear') &&
        !e.target.closest('.dither-picker-container') &&
        !e.target.closest('.picker-container')
      ) {
        onclose()
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  })

  const ditherPreviewSVG = $derived.by(() => {
    const pattern = ditherPatterns[vector.ditherPatternIndex ?? 63]
    if (!pattern) return ''
    const twoColor = vector.modes?.twoColor ?? false
    const svgEl = createVectorDitherPatternSVG(pattern, vector)
    if (twoColor) {
      const bg = svgEl.querySelector('.dither-bg-rect')
      if (bg)
        bg.setAttribute('fill', vector.secondaryColor?.color ?? 'rgba(0,0,0,0)')
    }
    return new XMLSerializer().serializeToString(svgEl)
  })

  function handleModeToggle(modeKey) {
    const isCurveType = ['line', 'quadCurve', 'cubicCurve'].includes(modeKey)
    if (isCurveType && vector.modes[modeKey]) return
    if (isCurveType) {
      changeActionVectorCurveType(vector, modeKey)

      return
    }
    const oldModes = { ...vector.modes }
    vector.modes[modeKey] = !vector.modes[modeKey]
    if (vector.modes[modeKey]) {
      if (modeKey === 'eraser' && vector.modes.inject)
        vector.modes.inject = false
      else if (modeKey === 'inject' && vector.modes.eraser)
        vector.modes.eraser = false
    }
    const newModes = { ...vector.modes }
    renderCanvas(vector.layer, true)
    changeActionVectorMode(vector, oldModes, newModes)
    globalState.clearRedoStack()
    vectorGui.render()
  }

  function handlePrimaryColorClick(e) {
    e.stopPropagation()
    initializeColorPicker({
      color: vector.color,
      vector,
      isSecondaryColor: false,
    })
  }

  function handleSecondaryColorClick(e) {
    e.stopPropagation()
    if (!vector.secondaryColor) {
      vector.secondaryColor = { r: 0, g: 0, b: 0, a: 0, color: 'rgba(0,0,0,0)' }
    }
    initializeColorPicker({
      color: vector.secondaryColor,
      vector,
      isSecondaryColor: true,
    })
  }

  let brushSizeFromValue = 1

  function handleBrushSizePointerDown() {
    brushSizeFromValue = vector.brushSize ?? 1
  }

  function handleBrushSizeInput(e) {
    vector.brushSize = parseInt(e.target.value)
    renderCanvas(vector.layer, true)
  }

  function handleBrushSizeChange(e) {
    const newSize = parseInt(e.target.value)
    if (brushSizeFromValue !== newSize) {
      changeActionVectorBrushSize(vector, brushSizeFromValue, newSize)
      globalState.clearRedoStack()
    }
  }

  function handleDitherClick() {
    if (globalState.ui.ditherPickerOpen && appState.ditherVectorTarget === vector) {
      appState.ditherVectorTarget = null
      globalState.ui.ditherPickerOpen = false
    } else {
      appState.ditherVectorTarget = vector
      const ox = vector.ditherOffsetX ?? 0
      const oy = vector.ditherOffsetY ?? 0
      if (dom.ditherPickerContainer) {
        applyDitherOffset(dom.ditherPickerContainer, ox, oy)
        const wrap = dom.ditherPickerContainer.querySelector('.dither-offset-control-wrap')
        if (wrap) applyDitherOffsetControl(wrap, ox, oy)
      }
      globalState.ui.ditherPickerOpen = true
    }
  }

  const modes = $derived({ ...(vector.modes ?? {}) })
  const primaryColor = $derived(vector.color?.color)
  const secondaryColor = $derived(
    vector.secondaryColor?.color ?? 'rgba(0,0,0,0)',
  )
  const tool = $derived(vector.vectorProperties?.tool)
  const isCurveTool = $derived(tool === 'curve')
  const curveTypes = ['line', 'quadCurve', 'cubicCurve']
  const generalModes = ['eraser', 'inject', 'twoColor']
  const allModes = $derived(
    isCurveTool ? [...curveTypes, ...generalModes] : generalModes,
  )
  const brushSize = $derived(vector.brushSize ?? 1)
</script>

<div
  use:portal={document.body}
  bind:this={ref}
  class="vector-settings dialog-box"
  style="display:flex; position:fixed; top:{pos.top}px; left:{pos.left}px; transform:translateY(-50%); z-index:1000"
>
  <div class="header">
    <div class="drag-btn locked"><div class="grip"></div></div>
    Vector Settings
    <button
      type="button"
      class="close-btn"
      aria-label="Close"
      data-tooltip="Close"
      onclick={onclose}
    ></button>
  </div>
  <div class="vector-settings-modes">
    {#each allModes as modeKey (modeKey)}
      <button
        type="button"
        class="mode {modeKey}{modes[modeKey] ? ' selected' : ''}"
        aria-label={modeKey}
        data-tooltip={modeKey}
        onclick={() => handleModeToggle(modeKey)}
      ></button>
    {/each}
  </div>
  <div class="vector-settings-color-row">
    <span>Primary</span>
    <button
      type="button"
      class="actionColor primary-color"
      aria-label="Primary Color"
      data-tooltip="Primary Color"
      onclick={handlePrimaryColorClick}
    >
      <div class="swatch" style="background-color: {primaryColor}"></div>
    </button>
  </div>
  <div class="vector-settings-color-row">
    <span>Secondary</span>
    <button
      type="button"
      class="actionColor secondary-color"
      aria-label="Secondary Color"
      data-tooltip="Secondary Color"
      onclick={handleSecondaryColorClick}
    >
      <div class="swatch" style="background-color: {secondaryColor}"></div>
    </button>
  </div>
  <div class="vector-settings-dither-row">
    <span>Dither</span>
    <button
      type="button"
      class="vector-dither-preview"
      aria-label="Select dither pattern"
      data-tooltip="Select dither pattern"
      onclick={handleDitherClick}
    >
      <!-- eslint-disable-next-line svelte/no-at-html-tags -->
      {@html ditherPreviewSVG}
    </button>
  </div>
  <div class="vector-settings-brush-row">
    <span>Size: {brushSize}px</span>
    <input
      type="range"
      class="slider"
      min="1"
      max="32"
      value={brushSize}
      onpointerdown={handleBrushSizePointerDown}
      oninput={handleBrushSizeInput}
      onchange={handleBrushSizeChange}
    />
  </div>
</div>
