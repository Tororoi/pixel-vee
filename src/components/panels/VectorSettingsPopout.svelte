<script>
  import { onMount } from 'svelte'
  import {
    getVersion,
    bump,
    getDitherVectorTarget,
    setDitherVectorTarget,
  } from '../../hooks/appState.svelte.js'
  import { portal } from '../../utils/portal.js'
  import { globalState } from '../../Context/state.js'
  import { renderCanvas } from '../../Canvas/render.js'
  import { renderVectorsToDOM } from '../../DOM/render.js'
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
  let ditherPreviewRef = $state(null)

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

  // Re-render dither preview on every bump()
  $effect(() => {
    getVersion()
    const el = ditherPreviewRef
    if (!el) return
    el.innerHTML = ''
    const pattern = ditherPatterns[vector.ditherPatternIndex ?? 63]
    if (pattern) el.appendChild(createVectorDitherPatternSVG(pattern, vector))
  })

  function handleModeToggle(modeKey) {
    const isCurveType = ['line', 'quadCurve', 'cubicCurve'].includes(modeKey)
    if (isCurveType && vector.modes[modeKey]) return
    if (isCurveType) {
      // Delegates to changeActionVectorCurveType which handles control point
      // initialization (averaging px1/px2), timeline recording, and vectorGui.render()
      changeActionVectorCurveType(vector, modeKey)
      renderVectorsToDOM()
      bump()
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
    renderVectorsToDOM()
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
    bump()
  }

  function handleBrushSizeChange(e) {
    const newSize = parseInt(e.target.value)
    if (brushSizeFromValue !== newSize) {
      changeActionVectorBrushSize(vector, brushSizeFromValue, newSize)
      globalState.clearRedoStack()
    }
  }

  function handleDitherClick() {
    const picker = document.querySelector('.dither-picker-container')
    if (!picker) return
    if (picker.style.display === 'flex' && getDitherVectorTarget() === vector) {
      setDitherVectorTarget(null)
      picker.style.display = 'none'
    } else {
      setDitherVectorTarget(vector)
      const ox = vector.ditherOffsetX ?? 0
      const oy = vector.ditherOffsetY ?? 0
      applyDitherOffset(picker, ox, oy)
      const wrap = picker.querySelector('.dither-offset-control-wrap')
      if (wrap) applyDitherOffsetControl(wrap, ox, oy)
      picker.style.display = 'flex'
    }
  }

  const modes = $derived.by(() => {
    getVersion()
    return { ...(vector.modes ?? {}) }
  })
  const primaryColor = $derived.by(() => {
    getVersion()
    return vector.color?.color
  })
  const secondaryColor = $derived.by(() => {
    getVersion()
    return vector.secondaryColor?.color ?? 'rgba(0,0,0,0)'
  })
  const tool = $derived(vector.vectorProperties?.tool)
  const isCurveTool = $derived(tool === 'curve')
  const curveTypes = ['line', 'quadCurve', 'cubicCurve']
  const generalModes = ['eraser', 'inject', 'twoColor']
  const allModes = $derived(
    isCurveTool ? [...curveTypes, ...generalModes] : generalModes,
  )
  const brushSize = $derived(getVersion() >= 0 ? (vector.brushSize ?? 1) : 1)
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
      bind:this={ditherPreviewRef}
      class="vector-dither-preview"
      aria-label="Select dither pattern"
      data-tooltip="Select dither pattern"
      onclick={handleDitherClick}
    ></button>
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
