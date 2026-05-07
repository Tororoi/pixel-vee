<script>
  /**
   * @component
   * Top navigation bar containing File and Edit menus, a contextual
   * tool options bar, and the settings gear button. Handles all file
   * I/O (open/save/import/export), selection and clipboard operations,
   * canvas resize, flip/rotate transforms, and tool option toggles.
   * The File and Edit menus use a CSS :focus-within dropdown approach
   * with a small JS layer for click-to-close toggling.
   */
  import { globalState } from '../../context/state.js'
  import { canvas } from '../../context/canvas.js'
  import { vectorGui } from '../../gui/vector.js'
  import { activateResizeOverlay } from '../../canvas/resizeOverlay.js'
  import {
    actionSelectAll,
    actionDeselect,
    actionDeleteSelection,
  } from '../../actions/nonPointer/selectionActions.js'
  import {
    actionCutSelection,
    actionPasteSelection,
    actionCopySelection,
  } from '../../actions/nonPointer/clipboardActions.js'
  import {
    actionFlipPixels,
    actionRotatePixels,
  } from '../../actions/transform/rasterTransform.js'
  import { tools } from '../../tools/index.js'
  import { NAVIGATOR_ENABLED } from '../../utils/constants.js'

  /**
   * Converts a camelCase option key into a space-separated display
   * label with a capitalised first letter. Used to render tool option
   * names from the options object without requiring separate label
   * strings per option.
   * @param {string} str - A camelCase string (e.g. 'snapToGrid').
   * @returns {string} A human-readable label (e.g. 'Snap To Grid').
   */
  function camelCaseToWords(str) {
    let result = str.replace(/([A-Z])/g, ' $1')
    return (result.charAt(0).toUpperCase() + result.slice(1)).trim()
  }

  const hasPaste = $derived(!!canvas.pastedLayer)
  const hasRasterSelection = $derived(
    globalState.selection.boundaryBox.xMin !== null,
  )
  const hasVectorSelection = $derived(
    globalState.vector.currentIndex !== null ||
      globalState.vector.selectedIndices.size > 0,
  )
  const hasSelection = $derived(
    !hasPaste && (hasRasterSelection || hasVectorSelection),
  )
  const hasClipboard = $derived(
    !hasPaste &&
      (globalState.clipboard.select.canvas !== null ||
        Object.keys(globalState.clipboard.select.vectors).length > 0),
  )
  const canFlipRotate = $derived(hasPaste || hasVectorSelection)
  const toolName = $derived(globalState.tool.current?.name ?? '')
  const toolOptions = $derived(globalState.tool.current?.options ?? {})
  const showOptions = $derived(
    ['curve', 'ellipse', 'polygon', 'select'].includes(toolName),
  )

  /**
   * Toggles a tool option and re-renders the vector GUI. Written to
   * both the reactive proxy and the underlying tool singleton to prevent
   * divergence across tool-switch cycles. The vector GUI re-render
   * applies the option's visual effect immediately rather than waiting
   * for the next pointer event.
   * @param {string} optionName - The option key on the tool's options map.
   * @param {boolean} checked - The new active state for the option.
   */
  function handleOptionChange(optionName, checked) {
    if (globalState.tool.current.options[optionName]) {
      globalState.tool.current.options[optionName].active = checked
      const underlying = tools[globalState.tool.selectedName]
      if (underlying?.options?.[optionName]) {
        underlying.options[optionName].active = checked
      }
    }
    vectorGui.render()
  }

  /**
   * Reads a `.pxv` save file and loads it into the application. The
   * save module is lazily imported to avoid including it in the initial
   * bundle. The file input value is cleared after reading so selecting
   * the same file again re-triggers the change event.
   * @param {Event} e - The change event from the file input.
   */
  function handleLoadDrawing(e) {
    if (!e.target.files?.[0]) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      import('../../save/savefile.js').then(({ loadDrawing }) =>
        loadDrawing(ev.target.result),
      )
    }
    reader.readAsText(e.target.files[0])
    e.target.value = null
  }

  /**
   * Open save dialog box
   * TODO: (Low Priority) initialize save dialog box with default settings?
   */
  export function handleSaveAs() {
    globalState.ui.saveDialogOpen = true
  }

  /**
   * Imports a raster image as a paste layer. The image is decoded into
   * a temporary canvas, the clipboard's select state is temporarily
   * overwritten with the image's geometry and pixel data, and
   * `actionPasteSelection` commits it as a floating paste. The original
   * clipboard state is restored immediately after so the import does
   * not replace whatever the user had previously copied. `willReadFrequently`
   * is set on the temp context because `getImageData` is called once
   * immediately after drawing.
   * @param {Event} e - The change event from the import file input.
   */
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
        prev.selectProperties = {
          ...globalState.clipboard.select.selectProperties,
        }
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
        globalState.clipboard.select.imageData = ctx.getImageData(
          0,
          0,
          img.width,
          img.height,
        )
        actionPasteSelection()
        globalState.clipboard.select = prev
      }
    }
    reader.readAsDataURL(e.target.files[0])
    e.target.value = null
  }

  /**
   * Consolidates all layers into a composite then opens the export
   * dialog. Consolidation runs before the dialog opens so the export
   * always reflects the fully merged artwork. The layers module is
   * lazily imported for the same bundle-size reason as `handleLoadDrawing`.
   */
  function handleExport() {
    import('../../canvas/layers.js').then(({ consolidateLayers }) => {
      consolidateLayers()
      globalState.ui.exportOpen = true
    })
  }

  /**
   * Opens the canvas size dialog and activates the drag-handle resize
   * overlay together. Both must be activated as a pair — the dialog
   * manages the numeric inputs while the overlay manages the on-canvas
   * drag handles; neither is useful without the other.
   */
  function handleCanvasSize() {
    if (hasPaste) return
    globalState.ui.canvasSizeOpen = true
    activateResizeOverlay()
  }

  /**
   * Toggles the navigator dialog open and closed.
   */
  function handleNavigator() {
    globalState.ui.navigatorOpen = !globalState.ui.navigatorOpen
  }

  /**
   * Toggles the settings dialog open and closed.
   */
  function handleSettings() {
    globalState.ui.settingsOpen = !globalState.ui.settingsOpen
  }

  /**
   * Handles clicks on the top menu bar to toggle the `.active` class
   * on focused menu folder items. The menus use CSS `:focus-within` for
   * their dropdowns; this class toggle provides the click-to-close
   * behavior that `:focus-within` alone cannot express — without it,
   * clicking an already-open folder would not close it.
   */
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

  /**
   * Removes the `.active` class when a menu folder loses focus,
   * ensuring the folder's expanded state is cleared even when the user
   * dismisses the menu by tabbing away rather than clicking elsewhere.
   * @param {FocusEvent} e - The blur event from the menu folder element.
   */
  function handleMenuFolderBlur(e) {
    e.currentTarget.classList.remove('active')
  }

  /**
   * Activates a menu item via keyboard by forwarding Enter/Space to a
   * `.click()` call. Menu items use `onclick` rather than being `button`
   * elements, so keyboard activation must be wired manually.
   * @param {KeyboardEvent} e - The keydown event from a menu item.
   */
  function handleMenuKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') e.currentTarget.click()
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
        <img src="/pixel-vee.png" alt="Github Repo" />
      </a>
    </div>
    <ul
      role="menu"
      aria-label="functions"
      id="top-menu"
      onclick={handleTopMenuClick}
      onkeydown={handleTopMenuClick}
    >
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
            <label for="drawing-upload" data-tooltip="Open saved drawing"
              >Open</label
            >
            <input
              type="file"
              accept=".pxv"
              id="drawing-upload"
              onchange={handleLoadDrawing}
              onclick={(e) => {
                e.target.value = null
              }}
            />
          </li>
          <li
            role="menuitem"
            id="save"
            data-tooltip="Open dialog box to download file with current progress"
            onclick={handleSaveAs}
            onkeydown={handleMenuKeydown}
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
            onkeydown={handleMenuKeydown}
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
        tabindex="0"
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
            onkeydown={handleMenuKeydown}
          >
            Resize Canvas...
          </li>
          <li
            role="menuitem"
            id="select-all"
            class={hasPaste ? 'disabled' : ''}
            data-tooltip="Select entire canvas (Cmd + A)"
            onclick={hasPaste ? undefined : actionSelectAll}
            onkeydown={handleMenuKeydown}
          >
            Select All (Cmd + A)
          </li>
          <li
            role="menuitem"
            id="deselect"
            class={!hasSelection ? 'disabled' : ''}
            data-tooltip="Deselect selection area (Cmd + D)"
            onclick={hasSelection ? actionDeselect : undefined}
            onkeydown={handleMenuKeydown}
          >
            Deselect (Cmd + D)
          </li>
          <li
            role="menuitem"
            id="cut-selection"
            class={!hasSelection ? 'disabled' : ''}
            data-tooltip="Cut selection (Cmd + X)"
            onclick={hasSelection ? actionCutSelection : undefined}
            onkeydown={handleMenuKeydown}
          >
            Cut (Cmd + X)
          </li>
          <li
            role="menuitem"
            id="copy-selection"
            class={!hasSelection ? 'disabled' : ''}
            data-tooltip="Copy selection (Cmd + C)"
            onclick={hasSelection ? actionCopySelection : undefined}
            onkeydown={handleMenuKeydown}
          >
            Copy (Cmd + C)
          </li>
          <li
            role="menuitem"
            id="paste-selection"
            class={!hasClipboard ? 'disabled' : ''}
            data-tooltip="Paste copied selection (Cmd + V)"
            onclick={hasClipboard ? actionPasteSelection : undefined}
            onkeydown={handleMenuKeydown}
          >
            Paste (Cmd + V)
          </li>
          <li
            role="menuitem"
            id="delete-selection"
            class={!hasSelection ? 'disabled' : ''}
            data-tooltip="Delete selection (Backspace)"
            onclick={hasSelection ? actionDeleteSelection : undefined}
            onkeydown={handleMenuKeydown}
          >
            Clear (Backspace)
          </li>
          <li
            role="menuitem"
            id="flip-horizontal"
            class={!canFlipRotate ? 'disabled' : ''}
            data-tooltip="Flip selection horizontally (Cmd + F)"
            onclick={canFlipRotate ? () => actionFlipPixels(true) : undefined}
            onkeydown={handleMenuKeydown}
          >
            Flip Horizontal (Cmd + F)
          </li>
          <li
            role="menuitem"
            id="flip-vertical"
            class={!canFlipRotate ? 'disabled' : ''}
            data-tooltip="Flip selection vertically (Cmd + Shift + F)"
            onclick={canFlipRotate ? () => actionFlipPixels(false) : undefined}
            onkeydown={handleMenuKeydown}
          >
            Flip Vertical (Cmd + Shift + F)
          </li>
          <li
            role="menuitem"
            id="rotate-right"
            class={!canFlipRotate ? 'disabled' : ''}
            data-tooltip="Rotate selection 90 degrees clockwise (Cmd + R)"
            onclick={canFlipRotate ? actionRotatePixels : undefined}
            onkeydown={handleMenuKeydown}
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
      {#if NAVIGATOR_ENABLED}
        <button
          type="button"
          class="navigator-icon"
          id="navigator-btn"
          aria-label="Open navigator"
          data-tooltip="Open navigator"
          onclick={handleNavigator}
        ></button>
      {/if}
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
