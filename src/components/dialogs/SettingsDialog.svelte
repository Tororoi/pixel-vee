<script>
  import { globalState } from '../../Context/state.js'
  import { vectorGui } from '../../GUI/vector.js'
  import DialogBox from '../DialogBox.svelte'
  import SpinInput from '../shared/SpinInput.svelte'
  import ToggleCheckbox from '../shared/ToggleCheckbox.svelte'

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
          <ToggleCheckbox
            id="tooltips-toggle"
            labelId="tooltips"
            label="Tooltips"
            checked={globalState.ui.showTooltips}
            onchange={handleTooltips}
            tooltip="Toggle tooltips (T)"
          />
          <ToggleCheckbox
            id="grid-toggle"
            labelId="grid"
            label="Grid"
            checked={gridEnabled}
            onchange={handleGrid}
            tooltip="Toggle grid (G)\n\nDisplays at higher zoom levels only."
          />
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
              <SpinInput
                bind:value={gridSpacing}
                min={1}
                max={64}
                class="grid-spacing-spin"
                onspin={(val) => { vectorGui.gridSpacing = val; vectorGui.render() }}
              />
            </label>
          </div>
          <ToggleCheckbox
            id="cursor-preview-toggle"
            labelId="cursor-preview"
            label="Cursor Preview"
            checked={vectorGui.showCursorPreview ?? true}
            onchange={handleCursorPreview}
            tooltip="Show brush color preview under cursor instead of an outline"
          />
        </div>
      </div>
    </div>
</DialogBox>
