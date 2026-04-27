<script>
  /**
   * @component
   * Dialog for exporting the canvas as a PNG at a chosen pixel scale.
   * Consolidates all layers into a single composite before export so the
   * downloaded image reflects the fully merged artwork rather than any
   * single layer. Offers 1×, 2×, 4×, and 8× scales via dedicated buttons
   * so pixel-art work can be upscaled to a useful display size without
   * interpolation artifacts.
   */
  import { globalState } from '../../../context/state.js'
  import { canvas } from '../../../context/canvas.js'
  import { consolidateLayers } from '../../../canvas/layers.js'
  import DialogBox from '../DialogBox.svelte'

  const SCALES = [1, 2, 4, 8]

  const isOpen = $derived(globalState.ui.exportOpen)

  /**
   * Closes the export dialog without triggering an export.
   */
  function handleClose() {
    globalState.ui.exportOpen = false
  }

  /**
   * Exports the canvas as a PNG download at the requested pixel scale.
   * Layers are consolidated first so the export captures the composite
   * image, not an individual layer. A temporary off-screen canvas is
   * used for scaling rather than CSS transforms so the exported pixels
   * match the upscaled canvas resolution exactly. `imageSmoothingEnabled`
   * is forced off to prevent the browser from blurring pixel edges when
   * drawing at integer multiples. The hidden-anchor click pattern is the
   * standard technique for triggering a file download from a data URL
   * without navigating away from the page.
   * @param {number} scale - Integer multiplier for the exported dimensions.
   */
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
