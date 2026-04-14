<script>
  import { onMount } from 'svelte'
  import { getVersion, bump } from '../../hooks/appState.svelte.js'
  import { swatches } from '../../Context/swatch.js'
  import { initializeDragger, initializeCollapser } from '../../utils/drag.js'
  import { initializeColorPicker } from '../../Swatch/events.js'
  import { DEFAULT_PALETTES, PRESETS } from '../../utils/palettes.js'
  import { renderPaletteToDOM, renderPalettePresetsToDOM } from '../../DOM/renderPalette.js'

  let ref = $state(null)
  let primarySwatchRef = $state(null)
  let secondarySwatchRef = $state(null)
  let presetsOpen = $state(false)

  const palette = $derived(getVersion() >= 0 ? swatches.palette : [])
  const paletteMode = $derived(getVersion() >= 0 ? swatches.paletteMode : 'select')
  const currentPreset = $derived(getVersion() >= 0 ? swatches.currentPreset : '')
  const customPalettes = $derived(getVersion() >= 0 ? swatches.customPalettes : {})
  const presetLabel = $derived(
    currentPreset in DEFAULT_PALETTES
      ? (PRESETS.find((p) => p.id === currentPreset)?.label ?? currentPreset)
      : (customPalettes[currentPreset]?.label ?? currentPreset),
  )
  const selectedPaletteIndex = $derived(
    getVersion() >= 0 ? swatches.selectedPaletteIndex : -1,
  )

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    initializeCollapser(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })

  // Register React-rendered swatch DOM elements with swatches context
  onMount(() => {
    if (primarySwatchRef) {
      primarySwatchRef.color = swatches.primary.color
      swatches.primary.swatch = primarySwatchRef
    }
    if (secondarySwatchRef) {
      secondarySwatchRef.color = swatches.secondary.color
      swatches.secondary.swatch = secondarySwatchRef
    }
  })

  // Close presets dropdown on outside click
  $effect(() => {
    if (!presetsOpen) return
    function handleOutsideClick() { presetsOpen = false }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  })

  function onPaletteModified() {
    const id = swatches.currentPreset
    if (id in DEFAULT_PALETTES) {
      const base = PRESETS.find((p) => p.id === id)?.label ?? id
      const existingCount = Object.keys(swatches.customPalettes).filter((k) =>
        k.startsWith(`custom_${id}_`),
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
      `${swatches.primary.color.r},${swatches.primary.color.g},${swatches.primary.color.b}`,
    )
    document.documentElement.style.setProperty(
      '--primary-swatch-alpha',
      `${swatches.primary.color.a / 255}`,
    )
    swatches.secondary.color = temp
    if (swatches.secondary.swatch) swatches.secondary.swatch.color = temp
    document.documentElement.style.setProperty(
      '--secondary-swatch-color',
      `${temp.r},${temp.g},${temp.b}`,
    )
    document.documentElement.style.setProperty(
      '--secondary-swatch-alpha',
      `${temp.a / 255}`,
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
    presetsOpen = !presetsOpen
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
    presetsOpen = false
    renderPaletteToDOM()
    renderPalettePresetsToDOM()
  }

  function handlePaletteColorClick(color, index) {
    if (swatches.paletteMode === 'edit') {
      swatches.activePaletteIndex = index
      initializeColorPicker({ color })
    } else if (swatches.paletteMode === 'remove') {
      swatches.palette.splice(index, 1)
      onPaletteModified()
      swatches.paletteMode = 'select'
      renderPaletteToDOM()
    } else {
      if (index === swatches.selectedPaletteIndex) {
        swatches.activePaletteIndex = index
        initializeColorPicker({ color })
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
    initializeColorPicker({ color: swatches.primary.color })
  }
</script>

<div
  bind:this={ref}
  class="palette-interface dialog-box draggable v-drag settings-box smooth-shift"
  style={presetsOpen ? 'z-index: 201' : undefined}
>
  <div class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    Palette
    <label for="palette-collapse-btn" class="collapse-btn" data-tooltip="Collapse/ Expand">
      <input
        type="checkbox"
        aria-label="Collapse or Expand"
        class="collapse-checkbox"
        id="palette-collapse-btn"
      />
      <span class="arrow"></span>
    </label>
  </div>
  <div class="collapsible">
    <div class="colors">
      <div
        bind:this={primarySwatchRef}
        class="primary swatch btn"
        data-tooltip="Primary Swatch&#10;&#10;(R) to randomize&#10;&#10;Click to open Color Picker"
        onclick={handlePrimarySwatchClick}
      >
        <div class="swatch-color"></div>
      </div>
      <div
        bind:this={secondarySwatchRef}
        class="secondary back-swatch btn"
        data-tooltip="Secondary Swatch&#10;&#10;Click to open Color Picker"
        onclick={handleSecondarySwatchClick}
      >
        <div class="swatch-color"></div>
      </div>
    </div>
    <button
      type="button"
      class="switch color-switch custom-shape"
      id="color-switch"
      aria-label="Switch primary/ secondary colors"
      data-tooltip="Switch primary/ secondary colors"
      onclick={handleColorSwitch}
    ></button>
    <div class="palette-container">
      <div class="palette-tools">
        <button
          type="button"
          class="palette-edit{paletteMode === 'edit' ? ' selected' : ''}"
          aria-label="Edit Palette Color (Hold K)"
          data-tooltip="Edit Palette Color (Hold K)"
          onclick={handlePaletteEditClick}
        ></button>
        <button
          type="button"
          class="palette-remove{paletteMode === 'remove' ? ' selected' : ''}"
          aria-label="Remove Palette Color (Hold X)"
          data-tooltip="Remove Palette Color (Hold X)"
          onclick={handlePaletteRemoveClick}
        ></button>
      </div>
      <div class="palette-presets{presetsOpen ? ' open' : ''}">
        <button
          type="button"
          class="palette-presets-btn"
          aria-label="Palette Presets"
          data-tooltip="Palette Presets"
          onclick={handlePresetsToggle}
        >
          {presetLabel}
        </button>
        <ul class="palette-presets-list" role="listbox">
          {#each PRESETS as preset (preset.id)}
            <li
              role="option"
              data-id={preset.id}
              class={currentPreset === preset.id ? 'selected' : ''}
              onclick={(e) => { e.stopPropagation(); handlePresetSelect(preset.id) }}
            >
              {preset.label}
            </li>
          {/each}
          {#each Object.entries(customPalettes) as [id, p] (id)}
            <li
              role="option"
              data-id={id}
              class={currentPreset === id ? 'selected' : ''}
              onclick={(e) => { e.stopPropagation(); handlePresetSelect(id) }}
            >
              {p.label}
            </li>
          {/each}
        </ul>
      </div>
      <div class="palette-colors">
        {#each palette as color, index (index)}
          <button
            type="button"
            class="palette-color{index === selectedPaletteIndex ? ' selected' : ''}"
            aria-label="Color {index + 1}"
            data-tooltip={color.color}
            onclick={() => handlePaletteColorClick(color, index)}
          >
            <div
              class="swatch"
              style="background-color: {color.color}; width: 100%; height: 100%"
            ></div>
          </button>
        {/each}
        <button
          type="button"
          class="add-color plus"
          aria-label="Add Color"
          data-tooltip="Add current primary color to palette"
          onclick={handleAddColor}
        ></button>
      </div>
    </div>
  </div>
</div>
