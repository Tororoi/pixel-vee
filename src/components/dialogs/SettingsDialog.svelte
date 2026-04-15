<script>
  import { onMount } from 'svelte'
  import { getVersion, bump } from '../../hooks/appState.svelte.js'
  import { globalState } from '../../Context/state.js'
  import { vectorGui } from '../../GUI/vector.js'
  import { initializeDragger } from '../../utils/drag.js'

  let ref = $state(null)

  const isOpen = $derived(getVersion() >= 0 && globalState.ui.settingsOpen)
  const gridEnabled = $derived(getVersion() >= 0 && vectorGui.grid)
  const gridSpacing = $derived(getVersion() >= 0 ? vectorGui.gridSpacing : 1)

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })

  function handleClose() {
    globalState.ui.settingsOpen = false
    bump()
  }

  function handleTooltips(e) {
    globalState.ui.showTooltips = e.target.checked
    bump()
  }

  function handleGrid(e) {
    vectorGui.grid = e.target.checked
    vectorGui.render()
    bump()
  }

  function handleGridSpacingInput(e) {
    let val = parseInt(e.target.value)
    if (val < 1) val = 1
    else if (val > 64) val = 64
    vectorGui.gridSpacing = val
    vectorGui.render()
    bump()
  }

  function handleGridSpacingSpin(e) {
    const id = e.target.id || e.target.closest('[id]')?.id
    if (id === 'inc') {
      vectorGui.gridSpacing = Math.min(64, vectorGui.gridSpacing + 1)
    } else if (id === 'dec') {
      vectorGui.gridSpacing = Math.max(1, vectorGui.gridSpacing - 1)
    }
    vectorGui.render()
    bump()
  }

  function handleCursorPreview(e) {
    vectorGui.showCursorPreview = e.target.checked
  }
</script>

<div
  bind:this={ref}
  class="settings-container dialog-box draggable v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
>
  <div id="settings-header" class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    Settings
    <button type="button" class="close-btn" data-tooltip="Close" onclick={handleClose}></button>
  </div>
  <div class="collapsible">
    <div class="settings-interface">
      <div class="settings-group">
        <div class="settings-section-header">Display</div>
        <div class="settings-options">
          <label
            for="tooltips-toggle"
            id="tooltips"
            class="toggle"
            data-tooltip="Toggle tooltips (T)"
          >
            <input
              type="checkbox"
              id="tooltips-toggle"
              checked={true}
              onchange={handleTooltips}
            />
            <span class="checkmark"></span>
            <span>Tooltips</span>
          </label>
          <label
            for="grid-toggle"
            id="grid"
            class="toggle"
            data-tooltip="Toggle grid (G)\n\nDisplays at higher zoom levels only."
          >
            <input
              type="checkbox"
              id="grid-toggle"
              checked={gridEnabled}
              onchange={handleGrid}
            />
            <span class="checkmark"></span>
            <span>Grid</span>
          </label>
          <div class="grid-spacing-container">
            <label for="grid-spacing">
              <span>Subgrid Spacing:&nbsp;</span>
              <input
                type="number"
                id="grid-spacing"
                min="1"
                max="64"
                value={gridSpacing}
                oninput={handleGridSpacingInput}
              />
              <span
                class="grid-spacing-spin spin-btn"
                onpointerdown={handleGridSpacingSpin}
              >
                <span id="inc" class="channel-btn">
                  <span class="spin-content">+</span>
                </span>
                <span id="dec" class="channel-btn">
                  <span class="spin-content">-</span>
                </span>
              </span>
            </label>
          </div>
          <label
            for="cursor-preview-toggle"
            id="cursor-preview"
            class="toggle"
            data-tooltip="Show brush color preview under cursor instead of an outline"
          >
            <input
              type="checkbox"
              id="cursor-preview-toggle"
              checked={true}
              onchange={handleCursorPreview}
            />
            <span class="checkmark"></span>
            <span>Cursor Preview</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</div>
