<script>
  import { globalState } from '../../Context/state.js'
  import { canvas } from '../../Context/canvas.js'
  import { consolidateLayers } from '../../Canvas/layers.js'
  import DialogBox from '../DialogBox.svelte'

  const SCALES = [1, 2, 4, 8]

  const isOpen = $derived(globalState.ui.exportOpen)

  function handleClose() {
    globalState.ui.exportOpen = false
  }

  function handleExport(scale) {
    consolidateLayers()
    const scaledCanvas = document.createElement('canvas')
    scaledCanvas.width = canvas.offScreenCVS.width * scale
    scaledCanvas.height = canvas.offScreenCVS.height * scale
    const ctx = scaledCanvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      canvas.offScreenCVS,
      0,
      0,
      scaledCanvas.width,
      scaledCanvas.height,
    )
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = scaledCanvas.toDataURL()
    a.download = 'pixelvee.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
</script>

<DialogBox
  title="Export"
  class="export-container v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
  onclose={handleClose}
>
  <div id="export-interface" class="export-interface">
    {#each SCALES as scale (scale)}
      <button type="button" class="btn" onclick={() => handleExport(scale)}>
        {scale}x
      </button>
    {/each}
  </div>
</DialogBox>
