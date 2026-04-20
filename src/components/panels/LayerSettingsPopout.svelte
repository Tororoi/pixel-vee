<script>
  import { updateActiveLayerState } from '../../DOM/render.js'
  import { renderCanvas } from '../../Canvas/render.js'
  import SettingsPopout from '../shared/SettingsPopout.svelte'

  let { layer = $bindable(), pos, onclose } = $props()

  const initialTitle = layer.title ?? ''
  let opacity = $state(Math.round((layer.opacity ?? 1) * 255))

  function handleTitleChange(e) {
    layer.title = e.target.value.slice(0, 12)
    updateActiveLayerState()
  }

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
