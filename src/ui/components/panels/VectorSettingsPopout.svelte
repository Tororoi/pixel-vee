<script>
  /**
   * @component
   * Popout settings panel for a specific vector action. Edits modes
   * (eraser, inject, twoColor; line/quadCurve/cubicCurve for curve
   * vectors), primary and secondary colors, brush size, and dither
   * pattern. All mutations record undo-history entries via changeAction*
   * helpers. Does not own open/close logic — the parent mounts and
   * unmounts this component directly.
   */
  import { appState } from '../../hooks/appState.svelte.js'
  import { globalState } from '../../../context/state.js'
  import { dom } from '../../../context/dom.js'
  import { renderCanvas } from '../../../canvas/render.js'
  import {
    changeActionVectorMode,
    changeActionVectorBrushSize,
    changeActionVectorCurveType,
  } from '../../../actions/modifyTimeline/modifyTimeline.js'
  import { initializeColorPicker } from '../../../swatch/events.js'
  import { ditherPatterns } from '../../../context/ditherPatterns.js'
  import {
    createVectorDitherPatternSVG,
    applyDitherOffset,
    applyDitherOffsetControl,
  } from '../../../utils/ditherPreview.js'
  import { vectorGui } from '../../../gui/vector.js'
  import SettingsPopout from '../shared/SettingsPopout.svelte'

  let { vector = $bindable(), pos, onclose } = $props()

  // A fresh SVG element is constructed on each derive so color and
  // offset attributes reflect the vector's current state. Serializing
  // a cached element would produce stale colors after a swatch or
  // offset change without re-generating the markup.
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

  /**
   * Toggles a vector mode or switches curve type, recording an undo
   * entry. Curve types (line/quadCurve/cubicCurve) are mutually
   * exclusive — clicking the active type is a no-op to avoid creating
   * a spurious history entry for a no-change action. Eraser and inject
   * are mutually exclusive general modes; enabling one clears the other
   * before the new modes object is snapshotted for the undo entry.
   * @param {string} modeKey - The mode or curve-type key to toggle.
   */
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

  /**
   * Opens the color picker bound to this vector's primary color slot.
   * Propagation is stopped so parent click handlers (e.g. the vector
   * row click) do not fire alongside the picker open.
   * @param {MouseEvent} e - The click event from the primary color swatch.
   */
  function handlePrimaryColorClick(e) {
    e.stopPropagation()
    initializeColorPicker({
      color: vector.color,
      vector,
      isSecondaryColor: false,
    })
  }

  /**
   * Opens the color picker bound to this vector's secondary color slot.
   * Lazily initialises `secondaryColor` to transparent black on first
   * access so vectors don't allocate a secondary color object until the
   * user explicitly opens the picker for it.
   * @param {MouseEvent} e - The click event from the secondary color swatch.
   */
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

  /**
   * Captures the brush size at the start of a drag so `handleBrushSizeChange`
   * can create a from→to undo entry rather than a from→same no-op.
   */
  function handleBrushSizePointerDown() {
    brushSizeFromValue = vector.brushSize ?? 1
  }

  /**
   * Applies the new brush size and re-renders on every input event so
   * the canvas updates continuously while the user drags the slider,
   * rather than only on release.
   * @param {Event} e - The input event from the brush size slider.
   */
  function handleBrushSizeInput(e) {
    vector.brushSize = parseInt(e.target.value)
    renderCanvas(vector.layer, true)
  }

  /**
   * Records an undo entry for the brush size change on slider release.
   * Only records if the value actually changed; a click with no drag
   * would otherwise pollute the undo stack with a no-op entry.
   * @param {Event} e - The change event from the brush size slider.
   */
  function handleBrushSizeChange(e) {
    const newSize = parseInt(e.target.value)
    if (brushSizeFromValue !== newSize) {
      changeActionVectorBrushSize(vector, brushSizeFromValue, newSize)
      globalState.clearRedoStack()
    }
  }

  /**
   * Toggles the dither picker for this specific vector. If the picker
   * is already open for this vector, closes it and clears the target.
   * On open, the picker's offset control is synced to the vector's
   * current offset before the dialog opens so the control visually
   * reflects the stored state from the moment it appears.
   */
  function handleDitherClick() {
    if (
      globalState.ui.ditherPickerOpen &&
      appState.ditherVectorTarget === vector
    ) {
      appState.ditherVectorTarget = null
      globalState.ui.ditherPickerOpen = false
    } else {
      appState.ditherVectorTarget = vector
      const ox = vector.ditherOffsetX ?? 0
      const oy = vector.ditherOffsetY ?? 0
      if (dom.ditherPickerContainer) {
        applyDitherOffset(dom.ditherPickerContainer, ox, oy)
        const wrap = dom.ditherPickerContainer.querySelector(
          '.dither-offset-control-wrap',
        )
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

<SettingsPopout
  class="vector-settings"
  {pos}
  {onclose}
  title="Vector Settings"
  excludeClasses={['gear']}
  excludeSelectors={['.dither-picker-container', '.picker-container']}
>
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
</SettingsPopout>
