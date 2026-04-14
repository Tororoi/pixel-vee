<script>
  import { getVersion, bump } from '../hooks/appState.svelte.js'
  import { globalState } from '../Context/state.js'
  import { canvas } from '../Context/canvas.js'
  import { vectorGui } from '../GUI/vector.js'
  import { activateResizeOverlay } from '../Canvas/resizeOverlay.js'
  import {
    actionSelectAll,
    actionDeselect,
    actionDeleteSelection,
  } from '../Actions/nonPointer/selectionActions.js'
  import {
    actionCutSelection,
    actionPasteSelection,
    actionCopySelection,
  } from '../Actions/nonPointer/clipboardActions.js'
  import {
    actionFlipPixels,
    actionRotatePixels,
  } from '../Actions/transform/rasterTransform.js'
  import { openSaveDialogBox } from '../Menu/events.js'

  function camelCaseToWords(str) {
    let result = str.replace(/([A-Z])/g, ' $1')
    return (result.charAt(0).toUpperCase() + result.slice(1)).trim()
  }

  // getVersion() >= 0 is always true — it's here to subscribe to bump() updates
  const hasPaste = $derived(getVersion() >= 0 && !!canvas.pastedLayer)
  const hasRasterSelection = $derived(
    getVersion() >= 0 && globalState.selection.boundaryBox.xMin !== null,
  )
  const hasVectorSelection = $derived(
    getVersion() >= 0 &&
      (globalState.vector.currentIndex !== null || globalState.vector.selectedIndices.size > 0),
  )
  const hasSelection = $derived(!hasPaste && (hasRasterSelection || hasVectorSelection))
  const hasClipboard = $derived(
    getVersion() >= 0 &&
      !hasPaste &&
      (globalState.clipboard.select.canvas !== null ||
        Object.keys(globalState.clipboard.select.vectors).length > 0),
  )
  const canFlipRotate = $derived(hasPaste || hasVectorSelection)
  const toolName = $derived(getVersion() >= 0 ? (globalState.tool.current?.name ?? '') : '')
  const toolOptions = $derived(
    getVersion() >= 0 ? (globalState.tool.current?.options ?? {}) : {},
  )
  const showOptions = $derived(
    ['curve', 'ellipse', 'polygon', 'select'].includes(toolName),
  )

  function handleOptionChange(optionName, checked) {
    if (globalState.tool.current.options[optionName]) {
      globalState.tool.current.options[optionName].active = checked
    }
    vectorGui.render()
    bump()
  }

  function handleLoadDrawing(e) {
    if (!e.target.files?.[0]) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      import('../Save/savefile.js').then(({ loadDrawing }) =>
        loadDrawing(ev.target.result),
      )
    }
    reader.readAsText(e.target.files[0])
    e.target.value = null
  }

  function handleImport(e) {
    if (!e.target.files?.[0]) return
    const reader = new FileReader()
    const img = new Image()
    reader.onload = (ev) => {
      img.src = ev.target.result
      img.onload = () => {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = img.width
        tempCanvas.height = img.height
        const ctx = tempCanvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)
        const prev = { ...globalState.clipboard.select }
        prev.selectProperties = { ...globalState.clipboard.select.selectProperties }
        globalState.clipboard.select.selectProperties = {
          px1: 0,
          py1: 0,
          px2: img.width,
          py2: img.height,
        }
        globalState.clipboard.select.boundaryBox = {
          xMin: 0,
          yMin: 0,
          xMax: img.width,
          yMax: img.height,
        }
        globalState.clipboard.select.canvas = tempCanvas
        globalState.clipboard.select.imageData = ctx.getImageData(0, 0, img.width, img.height)
        actionPasteSelection()
        globalState.clipboard.select = prev
      }
    }
    reader.readAsDataURL(e.target.files[0])
    e.target.value = null
  }

  function handleExport() {
    import('../Canvas/layers.js').then(({ consolidateLayers }) => {
      consolidateLayers()
      globalState.ui.exportOpen = true
      bump()
    })
  }

  function handleCanvasSize() {
    if (hasPaste) return
    globalState.ui.canvasSizeOpen = true
    activateResizeOverlay()
  }

  function handleSettings() {
    globalState.ui.settingsOpen = !globalState.ui.settingsOpen
    bump()
  }

  function handleTopMenuClick() {
    const activeEl = document.activeElement
    if (activeEl?.classList.contains('menu-folder')) {
      if (activeEl.classList.contains('active')) {
        activeEl.classList.remove('active')
      } else {
        activeEl.classList.add('active')
      }
    }
  }

  function handleMenuFolderBlur(e) {
    e.currentTarget.classList.remove('active')
  }
</script>

<div id="options" class="nav">
  <div class="nav-menu" style="align-self: stretch">
    <div class="title">
      <a
        href="https://github.com/Tororoi/pixel-vee"
        target="_blank"
        rel="noreferrer"
        aria-label="Visit the Github Repo in a new tab"
      >
        <img src="./public/pixel-vee.png" alt="Github Repo" />
      </a>
    </div>
    <ul role="menu" aria-label="functions" id="top-menu" onclick={handleTopMenuClick}>
      <!-- File menu -->
      <li
        role="menuitem"
        aria-haspopup="true"
        class="menu-folder"
        tabindex="0"
        onblur={handleMenuFolderBlur}
      >
        <span class="menu-folder-title">File</span>
        <ul role="menu" id="file-submenu">
          <li role="menuitem" class="open-save">
            <label for="drawing-upload" data-tooltip="Open saved drawing">Open</label>
            <input
              type="file"
              accept=".pxv"
              id="drawing-upload"
              onchange={handleLoadDrawing}
              onclick={(e) => { e.target.value = null }}
            />
          </li>
          <li
            role="menuitem"
            id="save"
            data-tooltip="Open dialog box to download file with current progress"
            onclick={openSaveDialogBox}
          >
            Save As... (Cmd + S)
          </li>
          <li role="menuitem" class="import-image{hasPaste ? ' disabled' : ''}">
            <label for="import" data-tooltip="Import image">Import</label>
            <input
              type="file"
              accept="image/*"
              id="import"
              onchange={handleImport}
              disabled={hasPaste}
            />
          </li>
          <li
            role="menuitem"
            id="export"
            data-tooltip="Download as .png"
            onclick={handleExport}
          >
            Export
          </li>
        </ul>
      </li>
      <!-- Edit menu -->
      <li
        role="menuitem"
        aria-haspopup="true"
        class="menu-folder"
        tabindex="1"
        onblur={handleMenuFolderBlur}
      >
        <span class="menu-folder-title">Edit</span>
        <ul role="menu" id="edit-submenu">
          <li
            role="menuitem"
            id="canvas-size"
            class={hasPaste ? 'disabled' : ''}
            data-tooltip="Open dialog box to resize canvas area"
            onclick={handleCanvasSize}
          >
            Resize Canvas...
          </li>
          <li
            role="menuitem"
            id="select-all"
            class={hasPaste ? 'disabled' : ''}
            data-tooltip="Select entire canvas (Cmd + A)"
            onclick={hasPaste ? undefined : actionSelectAll}
          >
            Select All (Cmd + A)
          </li>
          <li
            role="menuitem"
            id="deselect"
            class={!hasSelection ? 'disabled' : ''}
            data-tooltip="Deselect selection area (Cmd + D)"
            onclick={hasSelection ? actionDeselect : undefined}
          >
            Deselect (Cmd + D)
          </li>
          <li
            role="menuitem"
            id="cut-selection"
            class={!hasSelection ? 'disabled' : ''}
            data-tooltip="Cut selection (Cmd + X)"
            onclick={hasSelection ? actionCutSelection : undefined}
          >
            Cut (Cmd + X)
          </li>
          <li
            role="menuitem"
            id="copy-selection"
            class={!hasSelection ? 'disabled' : ''}
            data-tooltip="Copy selection (Cmd + C)"
            onclick={hasSelection ? actionCopySelection : undefined}
          >
            Copy (Cmd + C)
          </li>
          <li
            role="menuitem"
            id="paste-selection"
            class={!hasClipboard ? 'disabled' : ''}
            data-tooltip="Paste copied selection (Cmd + V)"
            onclick={hasClipboard ? actionPasteSelection : undefined}
          >
            Paste (Cmd + V)
          </li>
          <li
            role="menuitem"
            id="delete-selection"
            class={!hasSelection ? 'disabled' : ''}
            data-tooltip="Delete selection (Backspace)"
            onclick={hasSelection ? actionDeleteSelection : undefined}
          >
            Clear (Backspace)
          </li>
          <li
            role="menuitem"
            id="flip-horizontal"
            class={!canFlipRotate ? 'disabled' : ''}
            data-tooltip="Flip selection horizontally (Cmd + F)"
            onclick={canFlipRotate ? () => actionFlipPixels(true) : undefined}
          >
            Flip Horizontal (Cmd + F)
          </li>
          <li
            role="menuitem"
            id="flip-vertical"
            class={!canFlipRotate ? 'disabled' : ''}
            data-tooltip="Flip selection vertically (Cmd + Shift + F)"
            onclick={canFlipRotate ? () => actionFlipPixels(false) : undefined}
          >
            Flip Vertical (Cmd + Shift + F)
          </li>
          <li
            role="menuitem"
            id="rotate-right"
            class={!canFlipRotate ? 'disabled' : ''}
            data-tooltip="Rotate selection 90 degrees clockwise (Cmd + R)"
            onclick={canFlipRotate ? actionRotatePixels : undefined}
          >
            Rotate Right (Cmd + R)
          </li>
        </ul>
      </li>
    </ul>
  </div>
  <div class="nav-items">
    <!-- Tool Options Bar -->
    {#if showOptions}
      <div class="tool-options">
        {#each Object.entries(toolOptions) as [optionName, option] (optionName)}
          <label
            for="{optionName}-toggle"
            id={optionName}
            class="toggle"
            data-tooltip={option.tooltip}
          >
            <input
              type="checkbox"
              id="{optionName}-toggle"
              checked={!!option.active}
              onchange={(e) => handleOptionChange(optionName, e.target.checked)}
            />
            <span class="checkmark"></span>
            {camelCaseToWords(optionName)}
          </label>
        {/each}
      </div>
    {:else}
      <div class="tool-options"></div>
    {/if}
    <div class="settings">
      <button
        type="button"
        class="gear"
        id="settings-btn"
        aria-label="Open settings menu"
        data-tooltip="Open settings menu"
        onclick={handleSettings}
      ></button>
    </div>
  </div>
</div>
