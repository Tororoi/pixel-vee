<script>
  import { globalState } from '../../Context/state.js'
  import { vectorGui } from '../../GUI/vector.js'
  import DialogBox from '../DialogBox.svelte'

  const isOpen = $derived(globalState.ui.settingsOpen)

  // Local state mirrors for non-reactive vectorGui properties
  let gridEnabled = $state(vectorGui.grid ?? false)
  let gridSpacing = $state(vectorGui.gridSpacing ?? 8)

  // Sync from vectorGui when dialog opens
  $effect(() => {
    if (isOpen) {
      gridEnabled = vectorGui.grid ?? false
      gridSpacing = vectorGui.gridSpacing ?? 8
    }
  })

  function handleClose() {
    globalState.ui.settingsOpen = false
  }

  function handleTooltips(e) {
    globalState.ui.showTooltips = e.target.checked
  }

  function handleGrid(e) {
    gridEnabled = e.target.checked
    vectorGui.grid = gridEnabled
    vectorGui.render()
  }

  function handleGridSpacingInput(e) {
    let val = parseInt(e.target.value)
    if (val < 1) val = 1
    else if (val > 64) val = 64
    gridSpacing = val
    vectorGui.gridSpacing = val
    vectorGui.render()
  }

  function handleGridSpacingSpin(e) {
    const action =
      e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action
    if (action === 'inc') {
      gridSpacing = Math.min(64, gridSpacing + 1)
    } else if (action === 'dec') {
      gridSpacing = Math.max(1, gridSpacing - 1)
    }
    vectorGui.gridSpacing = gridSpacing
    vectorGui.render()
  }

  function handleCursorPreview(e) {
    vectorGui.showCursorPreview = e.target.checked
  }
</script>

<DialogBox
  title="Settings"
  class="settings-container draggable v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
  onclose={handleClose}
>
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
              checked={globalState.ui.showTooltips}
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
                role="group"
                onpointerdown={handleGridSpacingSpin}
              >
                <span data-action="inc" class="channel-btn">
                  <span class="spin-content">+</span>
                </span>
                <span data-action="dec" class="channel-btn">
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
              checked={vectorGui.showCursorPreview ?? true}
              onchange={handleCursorPreview}
            />
            <span class="checkmark"></span>
            <span>Cursor Preview</span>
          </label>
        </div>
      </div>
    </div>
</DialogBox>
