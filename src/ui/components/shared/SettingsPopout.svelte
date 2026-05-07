<script>
  /**
   * @component
   * Floating popout panel rendered into document.body via a portal,
   * positioned at a fixed (top, left) coordinate supplied by the
   * parent. Closes automatically when the user clicks outside it, with
   * optional class and selector exclusion lists for elements that should
   * not trigger a close — e.g. the gear button that opened the popout,
   * or linked dialogs that should coexist with it while open.
   */
  import { portal } from '../../../utils/portal.js'
  import { TOOLTIPS } from '../../../utils/tooltips.js'

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

  function handleOutside(e) {
    if (!ref || ref.contains(e.target)) return
    if (excludeClasses.some((cls) => e.target.classList.contains(cls))) return
    if (excludeSelectors.some((sel) => e.target.closest(sel))) return
    onclose()
  }
</script>

<svelte:document onpointerdown={handleOutside} />

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
      aria-label={TOOLTIPS.close.label}
      data-tooltip={TOOLTIPS.close.tooltip}
      onclick={onclose}
    ></button>
  </div>
  {@render children()}
</div>
