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
  import SettingsPopout from '../shared/SettingsPopout.svelte'

  let { layer = $bindable(), pos, onclose } = $props()

  const initialTitle = layer.title ?? ''
  let opacity = $state(Math.round((layer.opacity ?? 1) * 255))

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
</SettingsPopout>
