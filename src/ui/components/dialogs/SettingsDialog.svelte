<script>
  /**
   * @component
   * Application settings dialog. Currently exposes display settings:
   * tooltips, the pixel grid (toggle and subgrid spacing), and cursor
   * preview. Grid state is mirrored into local `$state` variables
   * because `vectorGui` is a plain object, not a reactive Svelte store,
   * so its properties do not trigger re-renders on their own; the local
   * mirrors allow the UI to reflect the current values and keep them in
   * sync when written back.
   */
  import { globalState } from '../../../context/state.js'
  import { vectorGui } from '../../../gui/vector.js'
  import DialogBox from '../DialogBox.svelte'
  import SpinInput from '../shared/SpinInput.svelte'
  import ToggleCheckbox from '../shared/ToggleCheckbox.svelte'

  const isOpen = $derived(globalState.ui.settingsOpen)

  // Local state mirrors for non-reactive vectorGui properties
  let gridEnabled = $state(vectorGui.grid ?? false)
  let gridSpacing = $state(vectorGui.gridSpacing ?? 8)

  // Re-read grid state from vectorGui whenever the dialog opens. Because
  // vectorGui is not reactive, its grid properties can drift from the
  // local mirrors if another code path mutates them while the dialog is
  // closed. Reading on open rather than continuously avoids constant
  // polling; the dialog's own handlers are the only writers while it is
  // visible, so the mirrors stay valid for the entire open session.
  $effect(() => {
    if (isOpen) {
      gridEnabled = vectorGui.grid ?? false
      gridSpacing = vectorGui.gridSpacing ?? 8
    }
  })

  /**
   * Closes the settings dialog.
   */
  function handleClose() {
    globalState.ui.settingsOpen = false
  }

  /**
   * Toggles tooltip visibility globally. The setting lives in reactive
   * state so all tooltip-reading components pick up the change without
   * an explicit render call.
   * @param {Event} e - The change event from the checkbox input.
   */
  function handleTooltips(e) {
    globalState.ui.showTooltips = e.target.checked
  }

  /**
   * Toggles the pixel grid and re-renders the vector GUI immediately.
   * The local mirror is updated first so the checkbox reflects the new
   * value before the render call, preventing a one-frame flash where the
   * toggle appears unchanged while the canvas already shows the grid.
   * @param {Event} e - The change event from the checkbox input.
   */
  function handleGrid(e) {
    gridEnabled = e.target.checked
    vectorGui.grid = gridEnabled
    vectorGui.render()
  }

  /**
   * Updates the subgrid spacing and re-renders. The value is clamped
   * on input rather than on blur so the grid never renders at an invalid
   * spacing even briefly; a blank field or out-of-range value always
   * resolves to a valid pixel spacing before the render call.
   * @param {Event} e - The input event from the spacing number field.
   */
  function handleGridSpacingInput(e) {
    let val = parseInt(e.target.value)
    if (val < 1) val = 1
    else if (val > 64) val = 64
    gridSpacing = val
    vectorGui.gridSpacing = val
    vectorGui.render()
  }

  /**
   * Toggles the brush cursor preview on the vector GUI. Written directly
   * to `vectorGui` rather than reactive state because the preview is read
   * by the GUI renderer imperatively at render time, not via a binding.
   * @param {Event} e - The change event from the checkbox input.
   */
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
              onspin={(val) => {
                vectorGui.gridSpacing = val
                vectorGui.render()
              }}
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
