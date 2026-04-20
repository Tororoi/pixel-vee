<script>
  import { onMount } from 'svelte'
  import { initializeDragger, initializeCollapser } from '../utils/drag.js'

  let {
    title,
    class: extraClass = '',
    style = undefined,
    collapsible = false,
    onclose = null,
    locked = false,
    ref = $bindable(null),
    children,
  } = $props()

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    if (collapsible) initializeCollapser(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })
</script>

<div bind:this={ref} class="dialog-box {extraClass}" {style}>
  <div class="header dragger">
    <div class="drag-btn{locked ? ' locked' : ''}">
      <div class="grip"></div>
    </div>
    {title}
    {#if onclose}
      <button
        type="button"
        class="close-btn"
        aria-label="Close"
        data-tooltip="Close"
        onclick={onclose}
      ></button>
    {:else if collapsible}
      <label class="collapse-btn" data-tooltip="Collapse/ Expand">
        <input
          type="checkbox"
          aria-label="Collapse or Expand"
          class="collapse-checkbox"
        />
        <span class="arrow"></span>
      </label>
    {/if}
  </div>
  <div class="collapsible">
    {@render children?.()}
  </div>
</div>
