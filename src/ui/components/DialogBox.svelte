<script>
  /**
   * @component
   * Base panel/dialog container used throughout the application. Renders
   * a header with a drag grip, title, and either a close button (when
   * `onclose` is provided), a collapse toggle (when `collapsible` is
   * true), or nothing. Drag and collapse behaviors are initialized
   * imperatively via utility functions on mount rather than declaratively
   * because they need direct DOM access to attach pointer listeners.
   */
  import { onMount } from 'svelte'
  import { initializeDragger, initializeCollapser } from '../../utils/drag.js'

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

  /**
   * Registers drag and collapse behaviors with the panel element.
   * Deferred to onMount because both utilities attach pointer listeners
   * that require a live DOM node. The cleanup deletes `data-dragInitialized`
   * so the dragger can be re-registered if the component is remounted
   * (e.g. in a keyed block) without the guard inside initializeDragger
   * treating it as already initialized and skipping setup.
   */
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
