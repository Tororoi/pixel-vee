<script>
  import { onMount } from 'svelte'
  import { getVersion, bump } from '../../hooks/appState.svelte.js'
  import { globalState } from '../../Context/state.js'
  import { canvas } from '../../Context/canvas.js'
  import { consolidateLayers } from '../../Canvas/layers.js'
  import { initializeDragger } from '../../utils/drag.js'

  const SCALES = [1, 2, 4, 8]

  let ref = $state(null)

  const isOpen = $derived(getVersion() >= 0 && globalState.ui.exportOpen)

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })

  function handleClose() {
    globalState.ui.exportOpen = false
    bump()
  }

  function handleExport(scale) {
    consolidateLayers()
    const scaledCanvas = document.createElement('canvas')
    scaledCanvas.width = canvas.offScreenCVS.width * scale
    scaledCanvas.height = canvas.offScreenCVS.height * scale
    const ctx = scaledCanvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(canvas.offScreenCVS, 0, 0, scaledCanvas.width, scaledCanvas.height)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = scaledCanvas.toDataURL()
    a.download = 'pixelvee.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
</script>

<div
  bind:this={ref}
  class="export-container dialog-box v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
>
  <div id="export-header" class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    <span>Export</span>
    <button type="button" class="close-btn" aria-label="Close" data-tooltip="Close" onclick={handleClose}></button>
  </div>
  <div class="collapsible">
    <div id="export-interface" class="export-interface">
      {#each SCALES as scale (scale)}
        <button type="button" class="btn" onclick={() => handleExport(scale)}>
          {scale}x
        </button>
      {/each}
    </div>
  </div>
</div>
