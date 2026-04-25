<script>
  import { globalState } from '../../Context/state.js'
  import { saveDrawing, computeFileSizePreview } from '../../Save/savefile.js'
  import { measureTextWidth } from '../../utils/measureHelpers.js'
  import DialogBox from '../DialogBox.svelte'
  import ToggleCheckbox from '../shared/ToggleCheckbox.svelte'

  let fileSize = $state('')

  const isOpen = $derived(globalState.ui.saveDialogOpen)
  const settings = $derived(globalState.ui.saveSettings)

  // Recompute filesize whenever dialog opens or settings change
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

  function handleClose() {
    globalState.ui.saveDialogOpen = false
  }

  function handleFileNameInput(e) {
    globalState.ui.saveSettings.saveAsFileName = e.target.value
    const w = measureTextWidth(e.target.value, "16px '04Font'") + 2
    e.target.style.width = w + 'px'
  }

  function handlePreserveHistory(e) {
    globalState.ui.saveSettings.preserveHistory = e.target.checked
  }

  function handleIncludePalette(e) {
    globalState.ui.saveSettings.includePalette = e.target.checked
  }

  function handleIncludeReferenceLayers(e) {
    globalState.ui.saveSettings.includeReferenceLayers = e.target.checked
  }

  function handleIncludeRemovedActions(e) {
    globalState.ui.saveSettings.includeRemovedActions = e.target.checked
  }

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
