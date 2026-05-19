<script>
  /**
   * @component
   * Popout settings panel for a single layer, positioned near the gear
   * button that opened it. Edits the layer's display title (capped at
   * 12 chars) and opacity (0–255 slider mapped to a 0–1 float stored
   * on the layer object). Does not own its own open/close logic — the
   * parent mounts and unmounts this component directly.
   */
  import { updateActiveLayerState } from '../../../canvas/layers.js'
  import { renderCanvas } from '../../../canvas/render.js'
  import { globalState } from '../../../context/state.js'
  import { actionInvertMask } from '../../../actions/modifyTimeline/modifyTimeline.js'
  import { TOOLTIPS } from '../../../utils/tooltips.js'
  import SettingsPopout from '../shared/SettingsPopout.svelte'
  import ToggleCheckbox from '../shared/ToggleCheckbox.svelte'

  let { layer = $bindable(), pos, onclose } = $props()

  const initialTitle = layer.title ?? ''
  let opacity = $state(Math.round((layer.opacity ?? 1) * 255))
  // Local mirrors of mask flags so the toggles update immediately even
  // before Svelte's reactive cycle settles after the canvas re-renders.
  // Every raster layer ships with a mask; the popout assumes it exists.
  let maskEnabled = $state(layer.mask?.enabled ?? true)
  let maskOverlayVisible = $state(layer.mask?.overlayVisible ?? true)
  let maskInverted = $state(layer.mask?.inverted ?? false)
  let maskEditing = $state(
    globalState.maskEdit.active && globalState.maskEdit.layerId === layer.id,
  )

  /**
   * Toggle whether the mask gates drawing on the layer. When
   * disabled the mask pixels and the other toggle states are
   * preserved — the gate, overlay, and edit routing just treat the
   * mask as if it weren't there. Re-enabling restores the prior
   * Edit / Show / Invert state without any extra clicks.
   */
  function handleEnableMaskClick() {
    if (!layer.mask) return
    maskEnabled = !maskEnabled
    layer.mask.enabled = maskEnabled
    renderCanvas(layer)
  }

  /**
   * Toggle whether the red overlay is composited onto the layer's
   * onscreen canvas. The mask still gates drawing when hidden — this
   * controls only the visual indicator.
   * @param {Event} e - The change event from the overlay checkbox.
   */
  function handleOverlayVisibleChange(e) {
    if (!layer.mask) return
    maskOverlayVisible = e.target.checked
    layer.mask.overlayVisible = maskOverlayVisible
    renderCanvas(layer)
  }

  /**
   * Toggle the mask's inverted flag. The blockedSet is left alone
   * (so out-of-bounds work survives), the canvas is repainted in
   * the mode's color, and the gate flips its interpretation of
   * the set. Recorded on the timeline for undo/redo.
   * @param {Event} e - The change event from the invert checkbox.
   */
  function handleInvertMaskChange(e) {
    if (!layer.mask) return
    maskInverted = e.target.checked
    actionInvertMask(layer)
    globalState.clearRedoStack()
    renderCanvas(layer)
  }

  /**
   * Toggle mask-edit mode for this layer. Enabling routes subsequent
   * strokes to the layer's mask canvas; disabling returns drawing to
   * the layer's content.
   * @param {Event} e - The change event from the edit-mask checkbox.
   */
  function handleEditMaskChange(e) {
    if (!layer.mask) {
      maskEditing = false
      return
    }
    maskEditing = e.target.checked
    if (maskEditing) {
      globalState.maskEdit.active = true
      globalState.maskEdit.layerId = layer.id
    } else {
      globalState.clearMaskEdit()
    }
    renderCanvas(layer)
  }

  /**
   * Updates the layer's display title on every keystroke. The slice
   * mirrors the input's maxlength attribute as a defensive guard — the
   * attribute prevents typing past 12 chars but does not block
   * programmatic paste, which could exceed the limit.
   * @param {Event} e - The native input event from the name field.
   */
  function handleTitleChange(e) {
    layer.title = e.target.value.slice(0, 12)
    updateActiveLayerState()
  }

  /**
   * Converts the 0–255 slider value to a 0–1 float and applies it to
   * the layer's opacity, then re-renders. The local `opacity` mirror is
   * updated so the numeric readout stays in sync without waiting for a
   * reactive re-render cycle to propagate the change back from the layer.
   * @param {Event} e - The input event from the opacity range slider.
   */
  function handleOpacityChange(e) {
    const val = parseInt(e.target.value)
    opacity = val
    layer.opacity = val / 255
    renderCanvas(layer)
  }
</script>

<SettingsPopout
  class="layer-settings"
  {pos}
  {onclose}
  title="Layer Settings"
  excludeClasses={['gear']}
>
  <div class="layer-name-label">
    <label for="layer-name" class="input-label">Name</label>
    <input
      id="layer-name"
      type="text"
      maxlength="12"
      placeholder={initialTitle}
      oninput={handleTitleChange}
    />
  </div>
  <div class="layer-opacity-label">
    <span class="input-label"
      >Opacity: <span
        style="display:inline-block;min-width:3ch;text-align:right"
        >{opacity}</span
      ></span
    >
    <input
      type="range"
      class="slider"
      min="0"
      max="255"
      value={opacity}
      oninput={handleOpacityChange}
    />
  </div>
  <div class="mask-section">
    <button
      type="button"
      class="mode colorMask mask-enable-btn{maskEnabled ? ' selected' : ''}"
      aria-label={TOOLTIPS.enableMask.label}
      data-tooltip={TOOLTIPS.enableMask.tooltip}
      data-tooltip-position="center"
      onclick={handleEnableMaskClick}
    ></button>
    {#if maskEnabled}
      <ToggleCheckbox
        id="layer-mask-edit"
        label="Edit Mask"
        checked={maskEditing}
        onchange={handleEditMaskChange}
        tooltip={TOOLTIPS.editMask.tooltip}
        tooltipPosition="center"
      />
      <ToggleCheckbox
        id="layer-mask-overlay"
        label="Show Overlay"
        checked={maskOverlayVisible}
        onchange={handleOverlayVisibleChange}
        tooltip={TOOLTIPS.showMaskOverlay.tooltip}
        tooltipPosition="center"
      />
      <ToggleCheckbox
        id="layer-mask-invert"
        label="Invert Mask"
        checked={maskInverted}
        onchange={handleInvertMaskChange}
        tooltip={TOOLTIPS.invertMask.tooltip}
        tooltipPosition="center"
      />
    {/if}
  </div>
</SettingsPopout>
