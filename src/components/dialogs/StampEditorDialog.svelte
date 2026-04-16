<script>
  import { onMount } from 'svelte'
  import { dom } from '../../Context/dom.js'
  import { initializeDragger } from '../../utils/drag.js'
  import { initStampEditor } from '../../DOM/stampEditor.js'

  let containerRef = $state(null)
  let editorCanvasRef = $state(null)
  let previewCanvasRef = $state(null)
  let applyBtnRef = $state(null)
  let clearBtnRef = $state(null)
  let drawBtnRef = $state(null)
  let eraseBtnRef = $state(null)
  let moveBtnRef = $state(null)
  let mirrorHBtnRef = $state(null)
  let mirrorVBtnRef = $state(null)

  onMount(() => {
    // Patch dom references — dom.js queried these at module load before Svelte rendered
    dom.stampEditorContainer = containerRef
    dom.stampEditorCanvas = editorCanvasRef
    dom.stampPreviewCanvas = previewCanvasRef
    dom.stampEditorApplyBtn = applyBtnRef
    dom.stampEditorClearBtn = clearBtnRef
    dom.stampDrawBtn = drawBtnRef
    dom.stampEraseBtn = eraseBtnRef
    dom.stampMoveBtn = moveBtnRef
    dom.stampMirrorHBtn = mirrorHBtnRef
    dom.stampMirrorVBtn = mirrorVBtnRef

    initializeDragger(containerRef)
    initStampEditor()
  })

  function handleClose() {
    if (containerRef) containerRef.style.display = 'none'
  }
</script>

<div
  bind:this={containerRef}
  id="stamp-editor"
  class="stamp-editor-container dialog-box draggable v-drag h-drag free"
>
  <div class="header dragger">
    <div class="drag-btn">
      <div class="grip"></div>
    </div>
    Stamp Editor
    <button
      type="button"
      class="close-btn"
      aria-label="Close"
      data-tooltip="Close"
      onclick={handleClose}
    ></button>
  </div>
  <div class="stamp-editor-interface">
    <canvas
      bind:this={editorCanvasRef}
      id="stamp-editor-canvas"
      width="320"
      height="320"
    ></canvas>
    <div class="stamp-editor-footer">
      <div class="stamp-editor-tools">
        <div class="stamp-tool-group">
          <button
            bind:this={drawBtnRef}
            id="stamp-draw-btn"
            type="button"
            class="stamp-tool brush selected"
            aria-label="Draw"
            data-tooltip="Draw"
          ></button>
          <button
            bind:this={eraseBtnRef}
            id="stamp-erase-btn"
            type="button"
            class="stamp-tool eraser"
            aria-label="Erase"
            data-tooltip="Erase"
          ></button>
          <button
            bind:this={moveBtnRef}
            id="stamp-move-btn"
            type="button"
            class="stamp-tool move"
            aria-label="Move"
            data-tooltip="Move"
          ></button>
        </div>
        <div class="stamp-tool-group">
          <button
            bind:this={mirrorHBtnRef}
            id="stamp-mirror-h-btn"
            type="button"
            class="stamp-tool mirrorX"
            aria-label="Mirror Horizontal"
            data-tooltip="Mirror Horizontal"
          ></button>
          <button
            bind:this={mirrorVBtnRef}
            id="stamp-mirror-v-btn"
            type="button"
            class="stamp-tool mirrorY"
            aria-label="Mirror Vertical"
            data-tooltip="Mirror Vertical"
          ></button>
          <button
            bind:this={clearBtnRef}
            id="stamp-editor-clear-btn"
            type="button"
            class="stamp-tool clear"
            aria-label="Clear"
            data-tooltip="Clear"
          ></button>
        </div>
      </div>
      <div class="stamp-editor-preview-col">
        <canvas
          bind:this={previewCanvasRef}
          id="stamp-preview-canvas"
          width="32"
          height="32"
        ></canvas>
        <button
          bind:this={applyBtnRef}
          id="stamp-editor-apply-btn"
          type="button"
        >
          Apply
        </button>
      </div>
    </div>
  </div>
</div>
