<script>
  /**
   * @component
   * Dialog for configuring and triggering an offline `.pxv` file save.
   * Exposes toggles for what to include (history, palette, reference
   * layers, removed actions) and shows a live filesize preview that
   * updates whenever settings change. "Preserve Entire History" is a
   * superset of the advanced options and disables them when active,
   * since turning it on already includes everything they control.
   */
  import { globalState } from '../../../context/state.js'
  import {
    saveDrawing,
    computeFileSizePreview,
  } from '../../../save/savefile.js'
  import { measureTextWidth } from '../../../utils/measureHelpers.js'
  import DialogBox from '../DialogBox.svelte'
  import ToggleCheckbox from '../shared/ToggleCheckbox.svelte'

  let fileSize = $state('')

  const isOpen = $derived(globalState.ui.saveDialogOpen)
  const settings = $derived(globalState.ui.saveSettings)

  // Recompute the filesize preview whenever the dialog opens or any
  // save setting changes. The bare reads of each settings field are
  // intentional: Svelte tracks reactive dependency accesses, and these
  // reads are the only way to make the effect re-run when a nested
  // property changes without watching the entire settings object.
  // 'Calculating...' is shown immediately because computeFileSizePreview
  // is async — setting it before the await prevents a stale size from
  // persisting visibly while the new value is being computed.
  $effect(() => {
    if (!isOpen) return
    // track settings fields
    settings.preserveHistory
    settings.includePalette
    settings.includeReferenceLayers
    settings.includeRemovedActions
    fileSize = 'Calculating...'
    computeFileSizePreview().then((s) => {
      fileSize = s
    })
  })

  /**
   * Closes the save dialog without writing a file.
   */
  function handleClose() {
    globalState.ui.saveDialogOpen = false
  }

  /**
   * Updates the filename setting and resizes the input to fit the new
   * text. The width is measured using the actual font ('04Font') rather
   * than a fixed em value so the input stays visually tight even with a
   * monospaced pixel font whose metrics differ from browser defaults.
   * @param {Event} e - The native input event from the filename field.
   */
  function handleFileNameInput(e) {
    globalState.ui.saveSettings.saveAsFileName = e.target.value
    const w = measureTextWidth(e.target.value, "16px '04Font'") + 2
    e.target.style.width = w + 'px'
  }

  /**
   * Toggles the "Preserve Entire History" setting. When enabled this is
   * a superset of the advanced options, so the template disables them to
   * prevent the user from toggling redundant sub-settings.
   * @param {Event} e - The change event from the checkbox input.
   */
  function handlePreserveHistory(e) {
    globalState.ui.saveSettings.preserveHistory = e.target.checked
  }

  /**
   * Toggles whether the color palette is included in the save file.
   * @param {Event} e - The change event from the checkbox input.
   */
  function handleIncludePalette(e) {
    globalState.ui.saveSettings.includePalette = e.target.checked
  }

  /**
   * Toggles whether reference layer data is included in the save file.
   * @param {Event} e - The change event from the checkbox input.
   */
  function handleIncludeReferenceLayers(e) {
    globalState.ui.saveSettings.includeReferenceLayers = e.target.checked
  }

  /**
   * Toggles whether removed (trashed or cleared) actions are retained in
   * the save file. Excluding them reduces file size but permanently
   * drops undo history for those actions after reload.
   * @param {Event} e - The change event from the checkbox input.
   */
  function handleIncludeRemovedActions(e) {
    globalState.ui.saveSettings.includeRemovedActions = e.target.checked
  }

  /**
   * Triggers the file save and closes the dialog on form submission.
   * `saveDrawing` handles the actual serialisation and download; closing
   * after the call (not before) ensures the dialog stays visible if
   * `saveDrawing` throws, rather than silently disappearing on error.
   * @param {SubmitEvent} e - The form submit event.
   */
  function handleSubmit(e) {
    e.preventDefault()
    saveDrawing()
    globalState.ui.saveDialogOpen = false
  }

  const advancedDisabled = $derived(settings.preserveHistory)
</script>

<DialogBox
  title="Save Options"
  class="save-container v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
  onclose={handleClose}
>
  <form id="save-interface" class="save-interface" onsubmit={handleSubmit}>
    <div class="save-setting">
      <label for="save-file-name" class="save-file-name-label">
        <span class="input-label">Save As:</span>
        <input
          type="text"
          id="save-file-name"
          name="save-file-name"
          placeholder="my drawing"
          maxlength="24"
          value={settings.saveAsFileName ?? ''}
          oninput={handleFileNameInput}
        />
        <span>.pxv</span>
      </label>
    </div>

    <div id="filesize-preview" class="save-setting">
      <span>Filesize:&nbsp;</span>
      <span id="savefile-size">{fileSize}</span>
    </div>

    <div class="save-setting">
      <ToggleCheckbox
        id="preserve-history-toggle"
        labelId="preserve-history"
        name="preserve-history"
        label="Preserve Entire History"
        checked={settings.preserveHistory}
        onchange={handlePreserveHistory}
        tooltip="Preserve all actions in history, palette, and reference images"
      />
    </div>

    <div
      class="advanced-options{advancedDisabled ? ' disabled' : ''}"
      id="save-advanced-options"
    >
      <div class="save-setting">
        <ToggleCheckbox
          id="include-palette-toggle"
          labelId="include-palette"
          name="include-palette"
          label="Palette"
          checked={settings.includePalette}
          onchange={handleIncludePalette}
          tooltip="Save colors in palette"
        />
      </div>

      <div class="save-setting">
        <ToggleCheckbox
          id="include-reference-layers-toggle"
          labelId="include-reference-layers"
          name="include-reference-layers"
          label="Reference Layers"
          checked={settings.includeReferenceLayers}
          onchange={handleIncludeReferenceLayers}
          tooltip="Save all reference images, including any transformations applied to them."
        />
      </div>

      <div class="save-setting">
        <ToggleCheckbox
          id="include-removed-actions-toggle"
          labelId="include-removed-actions"
          name="include-removed-actions"
          label="Removed Actions"
          checked={settings.includeRemovedActions}
          onchange={handleIncludeRemovedActions}
          tooltip="If a layer or vector was trashed or layer was cleared, those actions are still recoverable by using undo. If you're certain those actions won't be missed, you can remove them permanently by unchecking this box."
        />
      </div>
    </div>

    <div class="save-buttons">
      <button
        type="submit"
        id="save-button"
        class="btn"
        aria-label="Save offline as a .pxv file"
        data-tooltip="Save offline as a .pxv file"
      >
        Save
      </button>
      <button
        type="button"
        id="cancel-save-button"
        class="btn"
        aria-label="Close save dialog box"
        onclick={handleClose}
      >
        Cancel
      </button>
    </div>
  </form>
</DialogBox>
