<script>
  import { globalState } from '../../../context/state.js'
  import { swatches } from '../../../context/swatch.js'
  import {
    customBrushStamp,
    customBrushData,
    updateCustomStamp,
  } from '../../../context/brushStamps.js'
  import DialogBox from '../DialogBox.svelte'

  const STAMP_SIZE = 32
  const CELL_SIZE = 10
  const GRID_COLOR = '#333333'

  const editorPixels = new Map()

  let containerRef = $state(null)
  let editorCanvasRef = $state(null)
  let previewCanvasRef = $state(null)

  const isOpen = $derived(globalState.ui.stampEditorOpen)

  let uiPaintMode = $state('draw')
  let isDragging = $state(false)
  let paintMode = 'draw'
  let lastMoveCellX = 0
  let lastMoveCellY = 0

  const editorCursor = $derived(
    uiPaintMode === 'move' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair',
  )

  $effect(() => {
    if (isOpen) {
      editorPixels.clear()
      for (const [key, color] of customBrushData.colorMap) {
        editorPixels.set(key, color)
      }
      uiPaintMode = 'draw'
      renderEditorCanvas()
      renderPreviewCanvas()
    }
  })

  function renderEditorCanvas() {
    const canvas = editorCanvasRef
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const [key, color] of editorPixels) {
      const [x, y] = key.split(',').map(Number)
      ctx.fillStyle = color
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
    }

    ctx.strokeStyle = GRID_COLOR
    ctx.lineWidth = 0.5
    for (let i = 0; i <= STAMP_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, STAMP_SIZE * CELL_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(STAMP_SIZE * CELL_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }
  }

  function renderPreviewCanvas() {
    const canvas = previewCanvasRef
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const [key, color] of editorPixels) {
      const [x, y] = key.split(',').map(Number)
      ctx.fillStyle = color
      ctx.fillRect(x, y, 1, 1)
    }
  }

  function getEditorCoords(e) {
    const canvas = editorCanvasRef
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      ex: (e.clientX - rect.left) * scaleX,
      ey: (e.clientY - rect.top) * scaleY,
    }
  }

  function paintCell(ex, ey, mode) {
    const x = Math.floor(ex / CELL_SIZE)
    const y = Math.floor(ey / CELL_SIZE)
    if (x < 0 || x >= STAMP_SIZE || y < 0 || y >= STAMP_SIZE) return
    const key = `${x},${y}`
    if (mode === 'erase') {
      editorPixels.delete(key)
    } else {
      editorPixels.set(key, swatches.primary.color.color)
    }
    renderEditorCanvas()
    renderPreviewCanvas()
  }

  function movePixels(dx, dy) {
    if (dx === 0 && dy === 0) return
    const moved = new Map()
    for (const [key, color] of editorPixels) {
      const [x, y] = key.split(',').map(Number)
      const nx = (((x + dx) % STAMP_SIZE) + STAMP_SIZE) % STAMP_SIZE
      const ny = (((y + dy) % STAMP_SIZE) + STAMP_SIZE) % STAMP_SIZE
      moved.set(`${nx},${ny}`, color)
    }
    editorPixels.clear()
    for (const [key, color] of moved) {
      editorPixels.set(key, color)
    }
    renderEditorCanvas()
    renderPreviewCanvas()
  }

  function mirrorH() {
    const mirrored = new Map()
    for (const [key, color] of editorPixels) {
      const [x, y] = key.split(',').map(Number)
      mirrored.set(`${STAMP_SIZE - 1 - x},${y}`, color)
    }
    editorPixels.clear()
    for (const [key, color] of mirrored) {
      editorPixels.set(key, color)
    }
    renderEditorCanvas()
    renderPreviewCanvas()
  }

  function mirrorV() {
    const mirrored = new Map()
    for (const [key, color] of editorPixels) {
      const [x, y] = key.split(',').map(Number)
      mirrored.set(`${x},${STAMP_SIZE - 1 - y}`, color)
    }
    editorPixels.clear()
    for (const [key, color] of mirrored) {
      editorPixels.set(key, color)
    }
    renderEditorCanvas()
    renderPreviewCanvas()
  }

  function applyStamp() {
    customBrushStamp.pixels = []
    customBrushData.pixelSet = new Set()
    customBrushData.colorMap = new Map()
    for (const [key, color] of editorPixels) {
      const [x, y] = key.split(',').map(Number)
      customBrushStamp.pixels.push({ x, y })
      customBrushData.pixelSet.add((y << 16) | x)
      customBrushData.colorMap.set(key, color)
    }
    updateCustomStamp()
    globalState.ui.stampEditorOpen = false
  }

  function clearStamp() {
    editorPixels.clear()
    renderEditorCanvas()
    renderPreviewCanvas()
  }

  function handlePointerDown(e) {
    e.preventDefault()
    isDragging = true
    editorCanvasRef.setPointerCapture(e.pointerId)
    const { ex, ey } = getEditorCoords(e)
    if (uiPaintMode === 'move') {
      lastMoveCellX = Math.floor(ex / CELL_SIZE)
      lastMoveCellY = Math.floor(ey / CELL_SIZE)
    } else {
      paintMode = e.button === 2 ? 'erase' : uiPaintMode
      paintCell(ex, ey, paintMode)
    }
  }

  function handlePointerMove(e) {
    if (!isDragging) return
    const { ex, ey } = getEditorCoords(e)
    if (uiPaintMode === 'move') {
      const cellX = Math.floor(ex / CELL_SIZE)
      const cellY = Math.floor(ey / CELL_SIZE)
      const dx = cellX - lastMoveCellX
      const dy = cellY - lastMoveCellY
      if (dx !== 0 || dy !== 0) {
        movePixels(dx, dy)
        lastMoveCellX = cellX
        lastMoveCellY = cellY
      }
    } else {
      paintCell(ex, ey, paintMode)
    }
  }

  function handlePointerUp() {
    isDragging = false
  }

  function handleClose() {
    globalState.ui.stampEditorOpen = false
  }
</script>

<DialogBox
  bind:ref={containerRef}
  title="Stamp Editor"
  class="stamp-editor-container draggable v-drag h-drag free"
  style="display: {isOpen ? 'flex' : 'none'}"
  onclose={handleClose}
>
  <div class="stamp-editor-interface">
    <canvas
      bind:this={editorCanvasRef}
      id="stamp-editor-canvas"
      width="320"
      height="320"
      style:cursor={editorCursor}
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerUp}
      oncontextmenu={(e) => e.preventDefault()}
    ></canvas>
    <div class="stamp-editor-footer">
      <div class="stamp-editor-tools">
        <div class="stamp-tool-group">
          <button
            type="button"
            class="stamp-tool brush"
            class:selected={uiPaintMode === 'draw'}
            aria-label="Draw"
            data-tooltip="Draw"
            onclick={() => (uiPaintMode = 'draw')}
          ></button>
          <button
            type="button"
            class="stamp-tool eraser"
            class:selected={uiPaintMode === 'erase'}
            aria-label="Erase"
            data-tooltip="Erase"
            onclick={() => (uiPaintMode = 'erase')}
          ></button>
          <button
            type="button"
            class="stamp-tool move"
            class:selected={uiPaintMode === 'move'}
            aria-label="Move"
            data-tooltip="Move"
            onclick={() => (uiPaintMode = 'move')}
          ></button>
        </div>
        <div class="stamp-tool-group">
          <button
            type="button"
            class="stamp-tool mirrorX"
            aria-label="Mirror Horizontal"
            data-tooltip="Mirror Horizontal"
            onclick={mirrorH}
          ></button>
          <button
            type="button"
            class="stamp-tool mirrorY"
            aria-label="Mirror Vertical"
            data-tooltip="Mirror Vertical"
            onclick={mirrorV}
          ></button>
          <button
            type="button"
            class="stamp-tool clear"
            aria-label="Clear"
            data-tooltip="Clear"
            onclick={clearStamp}
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
        <button type="button" onclick={applyStamp}>Apply</button>
      </div>
    </div>
  </div>
</DialogBox>
