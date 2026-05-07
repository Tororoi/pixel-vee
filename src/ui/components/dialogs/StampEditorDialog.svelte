<script>
  /**
   * @component
   * Pixel editor for authoring a custom brush stamp. Provides a zoomed
   * 32×32 canvas where the user can draw, erase, or drag-move pixels,
   * plus mirror and clear operations. A 1:1 preview canvas shows the
   * stamp at its true size. Applying commits the working pixel state to
   * the global custom brush; cancelling discards unsaved edits. The
   * editor's working state is a local Map that is loaded from the
   * committed brush on each open and pushed back only on Apply.
   */
  import { globalState } from '../../../context/state.js'
  import { swatches } from '../../../context/swatch.js'
  import {
    customBrushStamp,
    customBrushData,
    updateCustomStamp,
  } from '../../../context/brushStamps.js'
  import DialogBox from '../DialogBox.svelte'
  import { TOOLTIPS } from '../../../utils/tooltips.js'

  const STAMP_SIZE = 32
  const CELL_SIZE = 10
  const GRID_COLOR = '#333333'

  // eslint-disable-next-line svelte/prefer-svelte-reactivity
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

  // Reset the editor to the committed brush state each time the dialog
  // opens. The guard runs only on open (not close) so unsaved edits are
  // never discarded mid-session by a spurious isOpen false-then-true
  // transition. uiPaintMode is reset to 'draw' so every session starts
  // from a known mode rather than resuming whatever was active last time.
  $effect(() => {
    if (isOpen) {
      editorPixels.clear()
      for (const [key, color] of customBrushData.colorMap) {
        editorPixels.set(key, color)
      }
      // Reset to draw mode so every session starts from a known state.
      uiPaintMode = 'draw'
      renderEditorCanvas()
      renderPreviewCanvas()
    }
  })

  /**
   * Draws the current pixel state onto the large zoomed editor canvas.
   * Grid lines are rendered after pixels so they remain visible on top
   * of any filled cell, giving the user a clear cell boundary even when
   * a pixel colour fills to the edge of its cell.
   */
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

    // Draw grid on top so lines are never obscured by pixel fills.
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

  /**
   * Renders the stamp at its true 1-px-per-cell scale in the preview
   * canvas. The preview canvas is sized to STAMP_SIZE × STAMP_SIZE so
   * each fillRect(x, y, 1, 1) call maps one logical pixel of the stamp
   * to exactly one canvas pixel, producing a 1:1 preview.
   */
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

  /**
   * Converts a pointer event's client position to canvas-space pixel
   * coordinates, accounting for any CSS scaling applied to the element.
   * getBoundingClientRect reflects the rendered display size; dividing
   * by it normalises the offset back to the canvas's intrinsic
   * resolution so coordinate math in callers can use canvas pixels
   * directly.
   * @param {PointerEvent} e - The pointer event to convert.
   * @returns {{ ex: number, ey: number }} Canvas-space x/y coordinates.
   */
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

  /**
   * Paints or erases the grid cell under canvas point (ex, ey). The
   * bounds check is a hard guard because pointer capture keeps delivering
   * events even after the pointer leaves the canvas element, making
   * out-of-range coordinates possible during a drag. The primary swatch
   * colour is sampled at call time so a mid-stroke colour change applies
   * to subsequent cells immediately.
   * @param {number} ex - Canvas-space x coordinate.
   * @param {number} ey - Canvas-space y coordinate.
   * @param {'draw'|'erase'} mode - Whether to paint or remove the cell.
   */
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

  /**
   * Shifts every painted pixel by (dx, dy) cells with toroidal wrapping
   * so pixels that exit one edge reappear on the opposite side. A fresh
   * accumulator Map is built before the source is cleared to prevent
   * overwrite collisions: two source pixels could map to the same target
   * key, and clearing the original first would lose pixels not yet
   * processed in the loop.
   * @param {number} dx - Horizontal shift in cells (negative = left).
   * @param {number} dy - Vertical shift in cells (negative = up).
   */
  function movePixels(dx, dy) {
    if (dx === 0 && dy === 0) return
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const moved = new Map()
    for (const [key, color] of editorPixels) {
      const [x, y] = key.split(',').map(Number)
      // Double-modulo keeps the result non-negative when dx/dy is
      // negative, since JS's % operator can return negative remainders.
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

  /**
   * Reflects all pixels horizontally around the vertical centre axis.
   * A separate accumulator Map is built before the source is cleared to
   * prevent mid-iteration aliasing: if two source pixels collide on the
   * same reflected key, the accumulator lets JS resolve the last-write-
   * wins conflict cleanly before any key is removed from the live map.
   */
  function mirrorH() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
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

  /**
   * Reflects all pixels vertically around the horizontal centre axis.
   * Uses the same separate-accumulator pattern as mirrorH to avoid
   * mid-iteration aliasing when two source pixels map to the same
   * reflected key.
   */
  function mirrorV() {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
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

  /**
   * Commits the editor's working pixel state to the global custom brush
   * and closes the dialog. All three brush data structures — the pixels
   * array, the bitpacked pixelSet, and the colorMap — are rebuilt from
   * scratch rather than diffed to guarantee they stay in sync even if
   * the prior committed state was inconsistent.
   */
  function applyStamp() {
    customBrushStamp.pixels = []
    customBrushData.pixelSet = new Set()
    customBrushData.colorMap = new Map()
    for (const [key, color] of editorPixels) {
      const [x, y] = key.split(',').map(Number)
      customBrushStamp.pixels.push({ x, y })
      // Bitpack coordinates into a single integer for fast membership
      // checks: y occupies the upper 16 bits, x the lower 16.
      customBrushData.pixelSet.add((y << 16) | x)
      customBrushData.colorMap.set(key, color)
    }
    updateCustomStamp()
    globalState.ui.stampEditorOpen = false
  }

  /**
   * Removes all pixels from the editor and re-renders both canvases.
   * Does not affect the committed brush — Apply must be called to push
   * the cleared state through to the global brush.
   */
  function clearStamp() {
    editorPixels.clear()
    renderEditorCanvas()
    renderPreviewCanvas()
  }

  /**
   * Begins a paint or move gesture on pointer press. Pointer capture is
   * acquired immediately so move and up events keep firing on this canvas
   * even if the pointer leaves its bounds mid-gesture. Right-click
   * (button 2) forces erase mode regardless of the active tool, matching
   * common pixel-editor conventions. In move mode the starting cell is
   * recorded instead of painting, enabling delta-based dragging in
   * handlePointerMove.
   * @param {PointerEvent} e - The triggering pointer event.
   */
  function handlePointerDown(e) {
    e.preventDefault()
    isDragging = true
    editorCanvasRef.setPointerCapture(e.pointerId)
    const { ex, ey } = getEditorCoords(e)
    if (uiPaintMode === 'move') {
      lastMoveCellX = Math.floor(ex / CELL_SIZE)
      lastMoveCellY = Math.floor(ey / CELL_SIZE)
    } else {
      // Snapshot mode into a plain variable so a mid-stroke tool switch
      // in the UI does not change the current stroke's behaviour.
      paintMode = e.button === 2 ? 'erase' : uiPaintMode
      paintCell(ex, ey, paintMode)
    }
  }

  /**
   * Continues a paint or move gesture as the pointer travels. In move
   * mode, movement is quantised to whole cells: pixels shift only when
   * the pointer crosses a cell boundary, preventing visual thrash from
   * sub-cell pointer jitter. In draw/erase mode every event repaints the
   * cell under the cursor, producing continuous stroke coverage even at
   * fast pointer speeds.
   * @param {PointerEvent} e - The triggering pointer event.
   */
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

  /**
   * Ends the active paint or move gesture. The browser automatically
   * releases pointer capture when pointerup fires, so no explicit
   * releasePointerCapture call is needed here.
   */
  function handlePointerUp() {
    isDragging = false
  }

  /**
   * Closes the stamp editor without committing changes. The next open
   * will reload editor state from the committed brush via the $effect,
   * discarding any unsaved edits from this session.
   */
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
            aria-label={TOOLTIPS.stampDraw.label}
            data-tooltip={TOOLTIPS.stampDraw.tooltip}
            onclick={() => (uiPaintMode = 'draw')}
          ></button>
          <button
            type="button"
            class="stamp-tool eraser"
            class:selected={uiPaintMode === 'erase'}
            aria-label={TOOLTIPS.stampErase.label}
            data-tooltip={TOOLTIPS.stampErase.tooltip}
            onclick={() => (uiPaintMode = 'erase')}
          ></button>
          <button
            type="button"
            class="stamp-tool move"
            class:selected={uiPaintMode === 'move'}
            aria-label={TOOLTIPS.stampMove.label}
            data-tooltip={TOOLTIPS.stampMove.tooltip}
            onclick={() => (uiPaintMode = 'move')}
          ></button>
        </div>
        <div class="stamp-tool-group">
          <button
            type="button"
            class="stamp-tool mirrorX"
            aria-label={TOOLTIPS.mirrorHorizontal.label}
            data-tooltip={TOOLTIPS.mirrorHorizontal.tooltip}
            onclick={mirrorH}
          ></button>
          <button
            type="button"
            class="stamp-tool mirrorY"
            aria-label={TOOLTIPS.mirrorVertical.label}
            data-tooltip={TOOLTIPS.mirrorVertical.tooltip}
            onclick={mirrorV}
          ></button>
          <button
            type="button"
            class="stamp-tool clear"
            aria-label={TOOLTIPS.stampClear.label}
            data-tooltip={TOOLTIPS.stampClear.tooltip}
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
        <button type="button" id="stamp-editor-apply-btn" onclick={applyStamp}
          >Apply</button
        >
      </div>
    </div>
  </div>
</DialogBox>
