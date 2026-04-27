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
  import { onMount } from 'svelte'
  import { portal } from '../../../utils/portal.js'

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

  /**
   * Attaches a document-level pointerdown listener for outside-click
   * detection. pointerdown is used rather than click so the popout
   * dismisses on the initial press instead of after a full click-
   * release cycle, giving tighter perceived responsiveness. Class and
   * selector exclusions let parents whitelist elements that should not
   * trigger a close — the gear button that opened the popout needs
   * `excludeClasses`, while sibling dialogs that should coexist while
   * open need `excludeSelectors`. The listener is returned as a cleanup
   * function so Svelte removes it when the component is destroyed.
   */
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
