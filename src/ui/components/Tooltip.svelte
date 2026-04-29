<script>
  import { uiStore } from '../stores/ui.svelte.js'
  import { toolStore } from '../stores/tool.svelte.js'
  import { canvas } from '../../context/canvas.js'

  const PASTE_WARNING =
    '\n\nCannot use with temporary pasted layer. Selecting will confirm pasted pixels.'

  let tooltipEl = $state(null)
  let eligible = $state(false)
  let x = $state(0)
  let y = $state(0)
  let location = $state('left')

  let visible = $derived(uiStore.showTooltips && eligible)

  function getMessage(target) {
    let message = target.dataset?.tooltip
    if (
      message &&
      canvas.currentLayer?.isPreview &&
      target.classList.contains('deactivate-paste')
    ) {
      message += PASTE_WARNING
    }
    return message || null
  }

  function position(message, target) {
    tooltipEl.innerText = message

    const targetRect = target.getBoundingClientRect()
    const targetCenter = targetRect.left + targetRect.width / 2

    if (window.innerWidth * (2 / 3) < targetCenter) {
      location = 'right'
    } else if (window.innerWidth / 3 < targetCenter) {
      location = 'center'
    } else {
      location = 'left'
    }

    const tooltipRect = tooltipEl.getBoundingClientRect()
    if (location === 'right') {
      x = targetRect.left - tooltipRect.width
    } else if (location === 'center') {
      x = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
    } else {
      x = targetRect.left + targetRect.width
    }
    y = targetRect.top + targetRect.height + 16
  }

  function onmouseover(e) {
    if (toolStore.touch) return
    const message = getMessage(e.target)
    if (message) position(message, e.target)
    eligible = !!message
  }

  function onclick(e) {
    if (!toolStore.touch) {
      eligible = false
    } else {
      const previousTarget = uiStore.tooltipTarget
      const message = getMessage(e.target)
      uiStore.tooltipTarget = e.target
      if (message && e.target !== previousTarget) {
        position(message, e.target)
        eligible = true
      } else {
        eligible = false
        uiStore.tooltipTarget = null
      }
    }
  }
</script>

<svelte:body {onmouseover} {onclick} />

<div
  bind:this={tooltipEl}
  class="tooltip"
  class:visible
  class:page-left={location === 'left'}
  class:page-center={location === 'center'}
  style:top="{y}px"
  style:left="{x}px"
></div>
