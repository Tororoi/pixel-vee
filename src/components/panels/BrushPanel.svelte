<script>
  import { onMount } from 'svelte'
  import { getVersion, bump } from '../../hooks/appState.svelte.js'
  import { globalState } from '../../Context/state.js'
  import { brushStamps, customBrushStamp } from '../../Context/brushStamps.js'
  import { brush, rebuildBuildUpDensityMap } from '../../Tools/brush.js'
  import { toggleMode } from '../../Tools/toolbox.js'
  import { initializeDragger, initializeCollapser } from '../../utils/drag.js'
  import { initDitherPicker } from '../../DOM/renderBrush.js'
  import { updateDitherPickerColors } from '../../DOM/render.js'
  import { openStampEditor } from '../../DOM/stampEditor.js'
  import BrushDitherPreview from './BrushDitherPreview.svelte'

  const DITHER_TOOLS = ['brush', 'curve', 'ellipse', 'polygon']
  const STAMP_TOOLS = ['brush']
  const BRUSH_TOOLS = ['brush', 'curve', 'ellipse', 'polygon', 'select']

  const MODE_BTN_INFO = {
    line:        { cls: 'line',        label: 'Line',              tools: ['curve'] },
    quadCurve:   { cls: 'quadCurve',   label: 'Quadratic Curve',   tools: ['curve'] },
    cubicCurve:  { cls: 'cubicCurve',  label: 'Cubic Curve',       tools: ['curve'] },
    eraser:      { cls: 'eraser',      label: 'Eraser (E)',        tools: ['brush', 'curve', 'ellipse', 'polygon'] },
    inject:      { cls: 'inject',      label: 'Inject (I)',        tools: ['brush', 'curve', 'ellipse', 'polygon'] },
    perfect:     { cls: 'perfect',     label: 'Pixel Perfect (Y)', tools: ['brush'] },
    colorMask:   { cls: 'colorMask',   label: 'Color Mask (M)',    tools: ['brush'] },
  }

  let ref = $state(null)

  const tool = $derived(getVersion() >= 0 ? globalState.tool.current : null)
  const toolName = $derived(tool?.name ?? '')
  const brushSize = $derived(tool?.brushSize ?? 1)
  const brushType = $derived(tool?.brushType ?? 'circle')
  const showBrushControls = $derived(BRUSH_TOOLS.includes(toolName))
  const showStamp = $derived(STAMP_TOOLS.includes(toolName))
  const showDither = $derived(DITHER_TOOLS.includes(toolName))
  const isBrushDisabled = $derived(tool?.brushDisabled ?? false)
  const isCustomBrush = $derived(brushType === 'custom')

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    initializeCollapser(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })

  function buildBrushStampSVGData(t) {
    if (!t) return null
    const bt = t.brushType ?? 'circle'
    const bs = t.brushSize ?? 1
    const stamp = brushStamps[bt]?.[bs]
    const pixels =
      stamp?.['0,0'] ?? (bt === 'custom' ? customBrushStamp.pixels : null)
    if (!pixels || pixels.length === 0) return null

    const cellSize = 2
    let minX, minY, spanW, spanH
    if (bt === 'custom') {
      minX = Math.min(...pixels.map((p) => p.x))
      minY = Math.min(...pixels.map((p) => p.y))
      const maxX = Math.max(...pixels.map((p) => p.x))
      const maxY = Math.max(...pixels.map((p) => p.y))
      spanW = maxX - minX + 1
      spanH = maxY - minY + 1
    } else {
      minX = 0
      minY = 0
      spanW = bs
      spanH = bs
    }

    const offsetX = (64 - spanW * cellSize) / 2
    const offsetY = (64 - spanH * cellSize) / 2
    let pathData = ''
    for (const px of pixels) {
      const x = offsetX + (px.x - minX) * cellSize
      const y = offsetY + (px.y - minY) * cellSize
      pathData += `M${x} ${y}h${cellSize}v${cellSize}h${-cellSize}z`
    }
    return pathData
  }

  const stampPathData = $derived(buildBrushStampSVGData(tool))

  function handleBrushTypeClick() {
    const current = tool.brushType
    if (current === 'circle') {
      tool.brushType = 'square'
    } else if (current === 'square') {
      tool.brushType = customBrushStamp.pixels.length === 0 ? 'circle' : 'custom'
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
    if (
      !stampEditorContainer.style.display ||
      stampEditorContainer.style.display === 'none'
    ) {
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
</script>

<div
  bind:this={ref}
  class="brush-container dialog-box draggable v-drag settings-box smooth-shift"
>
  <div class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    Brush
    <label for="brush-collapse-btn" class="collapse-btn" data-tooltip="Collapse/ Expand">
      <input
        type="checkbox"
        aria-label="Collapse or Expand"
        class="collapse-checkbox"
        id="brush-collapse-btn"
      />
      <span class="arrow"></span>
    </label>
  </div>
  <div class="collapsible">
    {#if showBrushControls}
      <div
        class="brush-preview btn"
        data-tooltip="Click to switch brush"
        onclick={handleBrushTypeClick}
      >
        {#if stampPathData}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            shape-rendering="crispEdges"
            style="display:block;width:64px;height:64px"
          >
            <path fill="rgba(255,255,255,255)" d={stampPathData} />
          </svg>
        {/if}
      </div>
      <div class="brush-size">
        <span id="line-weight">{isCustomBrush ? 32 : brushSize}px</span>
      </div>
      <input
        type="range"
        class="slider"
        id="brush-size"
        min="1"
        max="32"
        value={isCustomBrush ? 32 : brushSize}
        disabled={isBrushDisabled || isCustomBrush}
        oninput={handleSizeChange}
      />
    {/if}
    <span class="modes-title">Modes</span>
    <div class="modes-container">
      {#each Object.entries(MODE_BTN_INFO) as [key, info] (key)}
        {#if info.tools.includes(toolName)}
          {@const isActive = tool?.modes?.[key] ?? false}
          <button
            id={key}
            type="button"
            class="mode {info.cls}{isActive ? ' selected' : ''}"
            aria-label={info.label}
            data-tooltip={info.label}
            onclick={() => handleModeClick(key)}
          ></button>
        {/if}
      {/each}
    </div>
    <div class="stamp-dither-row">
      {#if showStamp}
        <div class="stamp-options">
          <span class="modes-title">Stamp</span>
          <div class="stamp-type-row">
            <button
              type="button"
              id="custom-brush-type-btn"
              class="mode stamp{isCustomBrush ? ' active' : ''}"
              aria-label="Custom Stamp"
              data-tooltip="Custom Stamp"
              onclick={handleStampBtnClick}
            ></button>
          </div>
        </div>
      {/if}
      {#if showDither && tool}
        <div class="dither-options">
          <span class="modes-title">Dither</span>
          <BrushDitherPreview {tool} onclick={handleDitherPreviewClick} />
        </div>
      {/if}
    </div>
  </div>
</div>
