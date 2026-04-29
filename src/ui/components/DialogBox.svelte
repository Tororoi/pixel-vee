<script>
  /**
   * @component
   * Base panel/dialog container used throughout the application. Renders
   * a header with a drag grip, title, and either a close button (when
   * `onclose` is provided), a collapse toggle (when `collapsible` is
   * true), or nothing. Drag behavior is wired via Svelte event handlers
   * on the dragger element; collapse is local reactive state.
   */
  import { untrack } from 'svelte'
  import { dragStart, dragStop, dragMove } from '../../utils/drag.js'

  let {
    title,
    class: extraClass = '',
    style = undefined,
    collapsible = false,
    startCollapsed = false,
    onclose = null,
    locked = false,
    ref = $bindable(null),
    children,
  } = $props()

  let collapsed = $state(untrack(() => startCollapsed))
</script>

<div
  bind:this={ref}
  class="dialog-box {extraClass}"
  style:min-height={collapsed ? '20px' : null}
  style:flex-grow={collapsed ? '0' : null}
  {style}
>
  <div
    class="header dragger"
    role="presentation"
    onpointerdown={(e) => dragStart(e, ref)}
    onpointerup={dragStop}
    onpointerout={dragStop}
    onpointermove={dragMove}
  >
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
          bind:checked={collapsed}
        />
        <span class="arrow"></span>
      </label>
    {/if}
  </div>
  <div class="collapsible" style:display={collapsed ? 'none' : null}>
    {@render children?.()}
  </div>
</div>
