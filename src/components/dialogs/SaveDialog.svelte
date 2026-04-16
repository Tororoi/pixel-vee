<script>
  import { onMount } from 'svelte'
  import { getVersion, bump } from '../../hooks/appState.svelte.js'
  import { globalState } from '../../Context/state.js'
  import { saveDrawing, computeFileSizePreview } from '../../Save/savefile.js'
  import { measureTextWidth } from '../../utils/measureHelpers.js'
  import { initializeDragger } from '../../utils/drag.js'

  let ref = $state(null)
  let fileSize = $state('')

  const isOpen = $derived(getVersion() >= 0 && globalState.ui.saveDialogOpen)
  const settings = $derived(getVersion() >= 0 ? globalState.ui.saveSettings : {})

  // Recompute filesize whenever dialog opens or settings change
  $effect(() => {
    if (!isOpen) return
    // track settings fields
    settings.preserveHistory
    settings.includePalette
    settings.includeReferenceLayers
    settings.includeRemovedActions
    fileSize = 'Calculating...'
    computeFileSizePreview().then((s) => { fileSize = s })
  })

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })

  function handleClose() {
    globalState.ui.saveDialogOpen = false
    bump()
  }

  function handleFileNameInput(e) {
    globalState.ui.saveSettings.saveAsFileName = e.target.value
    const w = measureTextWidth(e.target.value, "16px '04Font'") + 2
    e.target.style.width = w + 'px'
  }

  function handlePreserveHistory(e) {
    globalState.ui.saveSettings.preserveHistory = e.target.checked
    bump()
  }

  function handleIncludePalette(e) {
    globalState.ui.saveSettings.includePalette = e.target.checked
    bump()
  }

  function handleIncludeReferenceLayers(e) {
    globalState.ui.saveSettings.includeReferenceLayers = e.target.checked
    bump()
  }

  function handleIncludeRemovedActions(e) {
    globalState.ui.saveSettings.includeRemovedActions = e.target.checked
    bump()
  }

  function handleSubmit(e) {
    e.preventDefault()
    saveDrawing()
    globalState.ui.saveDialogOpen = false
    bump()
  }

  const advancedDisabled = $derived(settings.preserveHistory)
</script>

<div
  bind:this={ref}
  class="save-container dialog-box v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
>
  <div id="save-header" class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    <span>Save Options</span>
    <button type="button" class="close-btn" aria-label="Close" data-tooltip="Close" onclick={handleClose}></button>
  </div>
  <div class="collapsible">
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
        <label
          for="preserve-history-toggle"
          id="preserve-history"
          class="toggle"
          data-tooltip="Preserve all actions in history, palette, and reference images"
        >
          <input
            type="checkbox"
            id="preserve-history-toggle"
            name="preserve-history"
            checked={settings.preserveHistory}
            onchange={handlePreserveHistory}
          />
          <span class="checkmark"></span>
          <span>Preserve Entire History</span>
        </label>
      </div>

      <div
        class="advanced-options{advancedDisabled ? ' disabled' : ''}"
        id="save-advanced-options"
      >
        <div class="save-setting">
          <label
            for="include-palette-toggle"
            id="include-palette"
            class="toggle"
            data-tooltip="Save colors in palette"
          >
            <input
              type="checkbox"
              id="include-palette-toggle"
              name="include-palette"
              checked={settings.includePalette}
              onchange={handleIncludePalette}
            />
            <span class="checkmark"></span>
            <span>Palette</span>
          </label>
        </div>

        <div class="save-setting">
          <label
            for="include-reference-layers-toggle"
            id="include-reference-layers"
            class="toggle"
            data-tooltip="Save all reference images, including any transformations applied to them."
          >
            <input
              type="checkbox"
              id="include-reference-layers-toggle"
              name="include-reference-layers"
              checked={settings.includeReferenceLayers}
              onchange={handleIncludeReferenceLayers}
            />
            <span class="checkmark"></span>
            <span>Reference Layers</span>
          </label>
        </div>

        <div class="save-setting">
          <label
            for="include-removed-actions-toggle"
            id="include-removed-actions"
            class="toggle"
            data-tooltip="If a layer or vector was trashed or layer was cleared, those actions are still recoverable by using undo. If you're certain those actions won't be missed, you can remove them permanently by unchecking this box."
          >
            <input
              type="checkbox"
              id="include-removed-actions-toggle"
              name="include-removed-actions"
              checked={settings.includeRemovedActions}
              onchange={handleIncludeRemovedActions}
            />
            <span class="checkmark"></span>
            <span>Removed Actions</span>
          </label>
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
  </div>
</div>
