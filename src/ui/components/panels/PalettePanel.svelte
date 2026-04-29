<script>
  /**
   * @component
   * Panel showing primary/secondary color swatches, a row of palette
   * color slots, and a preset selector. Editing a color in a built-in
   * preset automatically forks it into a new numbered custom palette so
   * the original is preserved. Supports select, edit, and remove
   * interaction modes on individual palette slots.
   */
  import { onMount } from 'svelte'
  import { swatches } from '../../../context/swatch.js'
  import { initializeColorPicker } from '../../../swatch/events.js'
  import DialogBox from '../DialogBox.svelte'
  import { DEFAULT_PALETTES, PRESETS } from '../../../utils/palettes.js'

  let primarySwatchRef = $state(null)
  let secondarySwatchRef = $state(null)
  let presetsOpen = $state(false)

  const palette = $derived([...swatches.palette])
  const paletteMode = $derived(swatches.paletteMode)
  const currentPreset = $derived(swatches.currentPreset)
  const customPalettes = $derived({ ...swatches.customPalettes })
  const presetLabel = $derived(
    currentPreset in DEFAULT_PALETTES
      ? (PRESETS.find((p) => p.id === currentPreset)?.label ?? currentPreset)
      : (customPalettes[currentPreset]?.label ?? currentPreset),
  )
  const selectedPaletteIndex = $derived(swatches.selectedPaletteIndex)

  /**
   * Wires the DOM swatch elements into the swatches context so the
   * Picker can update their visual state imperatively. The `.color`
   * property is set directly on the DOM element (not a reactive binding)
   * because the Picker reads and writes it outside Svelte's reactive
   * system. Deferred to `onMount` because bind:this refs are null
   * during component initialization.
   */
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

  function handleOutsideClick() {
    if (!presetsOpen) return
    presetsOpen = false
  }

  /**
   * Forks the current preset into a new custom palette on the first
   * edit, then updates that custom palette in place on subsequent edits.
   * Forking preserves built-in presets from accidental mutation while
   * still auto-saving user changes. The numbered suffix scheme allows
   * multiple independent forks of the same built-in to coexist.
   */
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
      swatches.customPalettes[id].colors = swatches.palette.map((c) => ({
        ...c,
      }))
    }
  }

  /**
   * Opens the color picker for the primary swatch. Propagation is
   * stopped to prevent the document-level outside-click listener from
   * immediately interpreting this click as an "outside" event and
   * closing any currently open dropdown.
   * @param {MouseEvent} e - The click event from the primary swatch.
   */
  function handlePrimarySwatchClick(e) {
    e.stopPropagation()
    initializeColorPicker(swatches.primary.swatch)
  }

  /**
   * Opens the color picker for the secondary swatch. Mirrors
   * `handlePrimarySwatchClick` — see that function for the propagation
   * rationale.
   * @param {MouseEvent} e - The click event from the secondary swatch.
   */
  function handleSecondarySwatchClick(e) {
    e.stopPropagation()
    initializeColorPicker(swatches.secondary.swatch)
  }

  /**
   * Atomically swaps primary and secondary colors. CSS custom properties
   * are updated alongside the swatch objects so CSS-variable-driven
   * color previews throughout the UI stay in sync immediately, without
   * waiting for a reactive re-render cycle to propagate the change.
   * @param {MouseEvent} e - The click event from the switch button.
   */
  function handleColorSwitch(e) {
    e.stopPropagation()
    const temp = { ...swatches.primary.color }
    swatches.primary.color = swatches.secondary.color
    if (swatches.primary.swatch)
      swatches.primary.swatch.color = swatches.secondary.color
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
  }

  /**
   * Toggles palette edit mode. A second click reverts to select mode
   * so edit mode is self-cancelling rather than requiring a separate
   * cancel action.
   */
  function handlePaletteEditClick() {
    swatches.paletteMode = swatches.paletteMode === 'edit' ? 'select' : 'edit'
  }

  /**
   * Toggles palette remove mode. Mirrors `handlePaletteEditClick` — a
   * second click reverts to select mode.
   */
  function handlePaletteRemoveClick() {
    swatches.paletteMode =
      swatches.paletteMode === 'remove' ? 'select' : 'remove'
  }

  /**
   * Toggles the presets dropdown. Propagation is stopped so the
   * document-level outside-click listener does not immediately close
   * the dropdown that was just opened by this same click event.
   * @param {MouseEvent} e - The click event from the presets button.
   */
  function handlePresetsToggle(e) {
    e.stopPropagation()
    presetsOpen = !presetsOpen
  }

  /**
   * Loads a preset palette by deep-copying its colors so the live
   * palette array cannot mutate the stored preset. Returns early for
   * unknown IDs rather than clearing the palette, to avoid a blank
   * palette if an ID is ever passed that doesn't match any known preset.
   * @param {string} id - The preset ID to load.
   */
  function handlePresetSelect(id) {
    if (id in DEFAULT_PALETTES) {
      swatches.palette = DEFAULT_PALETTES[id].map((c) => ({ ...c }))
    } else if (id in swatches.customPalettes) {
      swatches.palette = swatches.customPalettes[id].colors.map((c) => ({
        ...c,
      }))
    } else {
      return
    }
    swatches.currentPreset = id
    presetsOpen = false
  }

  /**
   * Dispatches palette color clicks to one of three behaviors based on
   * the active palette mode. In edit mode opens the picker for that
   * slot. In remove mode splices the color out and forks the preset,
   * then returns to select mode. In select mode a second click on the
   * already-selected index opens the picker; a first click sets the
   * color as primary and updates the CSS custom property immediately.
   * @param {object} color - The color object at the clicked slot.
   * @param {number} index - The zero-based palette index.
   */
  function handlePaletteColorClick(color, index) {
    if (swatches.paletteMode === 'edit') {
      swatches.activePaletteIndex = index
      initializeColorPicker({ color })
    } else if (swatches.paletteMode === 'remove') {
      swatches.palette.splice(index, 1)
      onPaletteModified()
      swatches.paletteMode = 'select'
    } else {
      if (index === swatches.selectedPaletteIndex) {
        swatches.activePaletteIndex = index
        initializeColorPicker({ color })
      } else {
        const { r, g, b, a } = color
        document.documentElement.style.setProperty(
          '--primary-swatch-color',
          `${r},${g},${b}`,
        )
        document.documentElement.style.setProperty(
          '--primary-swatch-alpha',
          `${a / 255}`,
        )
        swatches.primary.color = color
        if (swatches.primary.swatch) swatches.primary.swatch.color = color
        swatches.selectedPaletteIndex = index
      }
    }
  }

  /**
   * Opens the color picker to add a new palette slot. Setting
   * `activePaletteIndex` to the current palette length positions the
   * picker to append rather than overwrite an existing slot on confirm.
   * @param {MouseEvent} e - The click event from the add-color button.
   */
  function handleAddColor(e) {
    e.stopPropagation()
    swatches.activePaletteIndex = swatches.palette.length
    initializeColorPicker({ color: swatches.primary.color })
  }
</script>

<svelte:document onclick={handleOutsideClick} />

<DialogBox
  title="Palette"
  class="palette-interface draggable v-drag settings-box smooth-shift"
  style={presetsOpen ? 'z-index: 201' : undefined}
  collapsible
>
  <div class="colors">
    <div
      bind:this={primarySwatchRef}
      class="primary swatch btn"
      role="button"
      tabindex="0"
      data-tooltip="Primary Swatch&#10;&#10;(R) to randomize&#10;&#10;Click to open Color Picker"
      onclick={handlePrimarySwatchClick}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handlePrimarySwatchClick(e)
      }}
    >
      <div class="swatch-color"></div>
    </div>
    <div
      bind:this={secondarySwatchRef}
      class="secondary back-swatch btn"
      role="button"
      tabindex="0"
      data-tooltip="Secondary Swatch&#10;&#10;Click to open Color Picker"
      onclick={handleSecondarySwatchClick}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleSecondarySwatchClick(e)
      }}
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
            aria-selected={currentPreset === preset.id}
            data-id={preset.id}
            class={currentPreset === preset.id ? 'selected' : ''}
            onclick={(e) => {
              e.stopPropagation()
              handlePresetSelect(preset.id)
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                handlePresetSelect(preset.id)
              }
            }}
          >
            {preset.label}
          </li>
        {/each}
        {#each Object.entries(customPalettes) as [id, p] (id)}
          <li
            role="option"
            aria-selected={currentPreset === id}
            data-id={id}
            class={currentPreset === id ? 'selected' : ''}
            onclick={(e) => {
              e.stopPropagation()
              handlePresetSelect(id)
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                handlePresetSelect(id)
              }
            }}
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
          class="palette-color{index === selectedPaletteIndex
            ? ' selected'
            : ''}"
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
</DialogBox>
