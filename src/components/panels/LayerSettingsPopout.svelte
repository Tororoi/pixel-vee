<script>
  import { onMount } from 'svelte'
  import { portal } from '../../utils/portal.js'
  import { updateActiveLayerState } from '../../DOM/render.js'
  import { renderCanvas } from '../../Canvas/render.js'

  const { layer, pos, onclose } = $props()

  const initialTitle = layer.title ?? ''
  let opacity = $state(Math.round((layer.opacity ?? 1) * 255))
  let ref = $state(null)

  onMount(() => {
    function handleOutside(e) {
      if (
        ref &&
        !ref.contains(e.target) &&
        !e.target.classList.contains('gear')
      ) {
        onclose()
      }
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  })

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

<div
  use:portal={document.body}
  bind:this={ref}
  class="layer-settings dialog-box"
  style="display:flex; position:fixed; top:{pos.top}px; left:{pos.left}px; transform:translateY(-50%); z-index:1000"
>
  <div class="header">
    <div class="drag-btn locked"><div class="grip"></div></div>
    Layer Settings
    <button
      type="button"
      class="close-btn"
      aria-label="Close"
      data-tooltip="Close"
      onclick={onclose}
    ></button>
  </div>
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
</div>
