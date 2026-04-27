<script>
  /**
   * @component
   * Paired +/− increment buttons that adjust a bindable numeric value
   * within a [min, max] range. Uses a single pointerdown listener on
   * the parent span rather than individual onclick handlers on each
   * button, reducing listener count and avoiding re-wiring if the DOM
   * subtree re-renders. Fires the optional `onspin` callback with the
   * new value after each step for callers that need to react to spin
   * events separately from the reactive value change (e.g. to trigger
   * a canvas re-render or write to a non-reactive singleton).
   */
  let {
    value = $bindable(),
    min,
    max,
    onspin,
    class: extraClass = '',
  } = $props()

  /**
   * Resolves which button was pressed via event delegation and adjusts
   * the value within bounds. The `closest` fallback handles clicks on
   * the inner `.spin-content` span, which sits inside the action-
   * bearing element and would report no `data-action` on its own. The
   * value is floored before adjustment so floating-point drift from
   * external bindings doesn't accumulate across repeated spin events.
   * @param {PointerEvent} e - The pointerdown event bubbled from the
   *   spin button group.
   */
  function handleSpin(e) {
    const action =
      e.target.dataset.action ||
      e.target.closest('[data-action]')?.dataset.action
    let val = Math.floor(+value)
    if (action === 'inc' && val < max) val++
    else if (action === 'dec' && val > min) val--
    value = val
    onspin?.(val)
  }
</script>

<span
  class="spin-btn{extraClass ? ' ' + extraClass : ''}"
  role="group"
  onpointerdown={handleSpin}
>
  <span data-action="inc" class="channel-btn"
    ><span class="spin-content">+</span></span
  ><span data-action="dec" class="channel-btn"
    ><span class="spin-content">-</span></span
  >
</span>
