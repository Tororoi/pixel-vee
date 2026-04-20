<script>
  import { onMount } from 'svelte'
  import { portal } from '../../utils/portal.js'

  let {
    pos,
    onclose,
    title,
    class: extraClass = '',
    excludeClasses = [],
    excludeSelectors = [],
    children,
  } = $props()

  let ref = $state(null)

  onMount(() => {
    function handleOutside(e) {
      if (!ref || ref.contains(e.target)) return
      if (excludeClasses.some((cls) => e.target.classList.contains(cls))) return
      if (excludeSelectors.some((sel) => e.target.closest(sel))) return
      onclose()
    }
    document.addEventListener('pointerdown', handleOutside)
    return () => document.removeEventListener('pointerdown', handleOutside)
  })
</script>

<div
  use:portal={document.body}
  bind:this={ref}
  class="{extraClass} dialog-box"
  style="display:flex; position:fixed; top:{pos.top}px; left:{pos.left}px; transform:translateY(-50%); z-index:1000"
>
  <div class="header">
    <div class="drag-btn locked"><div class="grip"></div></div>
    {title}
    <button
      type="button"
      class="close-btn"
      aria-label="Close"
      data-tooltip="Close"
      onclick={onclose}
    ></button>
  </div>
  {@render children()}
</div>
