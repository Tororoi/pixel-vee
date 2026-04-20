<script>
  let { value = $bindable(), min, max, onspin, class: extraClass = '' } = $props()

  function handleSpin(e) {
    const action =
      e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action
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
