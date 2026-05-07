<script>
  /**
   * @component
   * Primary toolbox panel containing undo/redo, recenter, clear, zoom,
   * and a two-column tool selector. Tools are either top-level buttons
   * or grouped into fly-out popouts (e.g. shapeTools, selectionTools).
   * A reactive `groupActiveTools` mirror tracks the last-selected tool
   * within each group so clicking a group button restores the correct
   * tool even after the popout has been closed.
   */
  import { globalState } from '../../context/state.js'
  import { canvas } from '../../context/canvas.js'
  import { toolGroups } from '../../tools/index.js'
  import { switchTool } from '../../tools/toolbox.js'
  import { handleUndo, handleRedo } from '../../actions/undoRedo/undoRedo.js'
  import { brush, rebuildBuildUpDensityMap } from '../../tools/brush.js'
  import { actionClear } from '../../actions/modifyTimeline/modifyTimeline.js'
  import {
    actionZoom,
    actionRecenter,
  } from '../../actions/untracked/viewActions.js'
  import { vectorGui } from '../../gui/vector.js'
  import { renderCanvas } from '../../canvas/render.js'

  import { ZOOM_LEVELS } from '../../utils/constants.js'
  import { TOOLTIPS, getTooltip } from '../../utils/tooltips.js'
  import DialogBox from './DialogBox.svelte'

  const COLUMN1_TOOLS = [
    'brush',
    'fill',
    'curve',
    'shapeTools',
    'selectionTools',
  ]
  const COLUMN2_TOOLS = ['eyedropper', 'grab', 'move']

  let openGroup = $state(null)

  const selectedName = $derived(globalState.tool.selectedName)
  const pastedLayer = $derived(!!canvas.pastedLayer)

  // `groupActiveTools` is a reactive mirror of each group's last-active
  // tool. The canonical `group.activeTool` is a plain property on a
  // plain object, so mutations to it do not trigger Svelte re-renders.
  // Without this mirror, clicking a tool inside a group popout would
  // update `group.activeTool` but leave the group button icon stale
  // after the popout closes. The $effect below keeps the mirror in sync
  // by writing to it whenever `selectedName` changes and the new tool
  // belongs to a group.
  let groupActiveTools = $state(
    Object.fromEntries(
      Object.entries(toolGroups).map(([k, v]) => [k, v.activeTool]),
    ),
  )

  $effect(() => {
    for (const [groupKey, group] of Object.entries(toolGroups)) {
      if (group.tools.includes(selectedName)) {
        groupActiveTools[groupKey] = selectedName
        break
      }
    }
  })

  /**
   * Undoes the last action and rebuilds the build-up density map when
   * build-up dither is active. The rebuild is necessary because undo
   * removes a stroke from history, changing the accumulated density that
   * subsequent strokes paint over; without a rebuild the density map
   * would reflect strokes that no longer exist.
   */
  function handleUndo_() {
    handleUndo()
    if (brush.modes.buildUpDither) rebuildBuildUpDensityMap()
  }

  /**
   * Redoes the last undone action and rebuilds the build-up density map
   * for the same reason as `handleUndo_` — the restored stroke must be
   * included in the accumulated density.
   */
  function handleRedo_() {
    handleRedo()
    if (brush.modes.buildUpDither) rebuildBuildUpDensityMap()
  }

  /**
   * Recenters the canvas in the viewport.
   */
  function handleRecenter() {
    actionRecenter()
  }

  /**
   * Clears the current layer's pixel data and resets all related state.
   * Guarded against paste state to prevent clearing while a paste commit
   * is pending. Selection point sets are nulled explicitly before
   * `globalState.reset` because they are not part of the global reset
   * scope. The vector GUI is reset before `actionClear` so the undo
   * entry captures a clean vector state.
   */
  function handleClear() {
    if (canvas.pastedLayer) return
    canvas.currentLayer.ctx.clearRect(
      0,
      0,
      canvas.offScreenCVS.width,
      canvas.offScreenCVS.height,
    )
    globalState.selection.pointsSet = null
    globalState.selection.seenPixelsSet = null
    globalState.timeline.clearPoints()
    vectorGui.reset()
    globalState.reset()
    actionClear(canvas.currentLayer)
    globalState.clearRedoStack()
    renderCanvas(canvas.currentLayer)
  }

  /**
   * Steps zoom in or out by one level via event delegation on the zoom
   * button pair. The current zoom's index in ZOOM_LEVELS is found with
   * `>=` rather than strict equality to handle cases where canvas.zoom
   * is set to a value not in the array; `-1` falls back to the last
   * level. The new offset is recomputed so the visual center of the
   * canvas stays fixed during the zoom rather than drifting.
   * @param {MouseEvent} e - The click event from the zoom button pair.
   */
  function handleZoom(e) {
    const zoomBtn = e.target.closest('.zoombtn')
    if (!zoomBtn) return
    let idx = ZOOM_LEVELS.findIndex((l) => l >= canvas.zoom)
    if (idx === -1) idx = ZOOM_LEVELS.length - 1
    const nextIdx = zoomBtn.id === 'minus' ? idx - 1 : idx + 1
    if (nextIdx < 0 || nextIdx >= ZOOM_LEVELS.length) return
    const targetZoom = ZOOM_LEVELS[nextIdx]
    const zoomRatio = targetZoom / canvas.zoom
    const zoomedX = (canvas.xOffset + canvas.offScreenCVS.width / 2) / zoomRatio
    const zoomedY =
      (canvas.yOffset + canvas.offScreenCVS.height / 2) / zoomRatio
    const nox = zoomedX - canvas.offScreenCVS.width / 2
    const noy = zoomedY - canvas.offScreenCVS.height / 2
    actionZoom(targetZoom, nox, noy)
  }

  /**
   * Switches to a tool and updates its group's remembered last-active
   * tool. Writing to `group.activeTool` (the canonical object) rather
   * than `groupActiveTools` (the reactive mirror) is intentional — the
   * $effect keeps the mirror in sync on the next tick, preventing a
   * double-write that could briefly show the wrong group icon.
   * @param {string} toolName - The name of the tool to activate.
   */
  function handleToolClick(toolName) {
    for (const [, group] of Object.entries(toolGroups)) {
      if (group.tools.includes(toolName)) {
        group.activeTool = toolName
        break
      }
    }
    switchTool(toolName)
    openGroup = null
  }

  /**
   * Activates the group's remembered last-active tool and toggles the
   * group's fly-out popout. The tool is activated even when the popout
   * is toggling closed so the group button always reflects the correct
   * active tool rather than reverting to the previous selection.
   * @param {string} groupKey - The key of the tool group to toggle.
   */
  function handleGroupBtnClick(groupKey) {
    const group = toolGroups[groupKey]
    switchTool(group.activeTool)
    openGroup = openGroup === groupKey ? null : groupKey
  }
</script>

<DialogBox
  title="Toolbox"
  class="toolbox h-drag free locked"
  collapsible
  locked
>
  <div class="btn-pair">
    <button
      type="button"
      class="tool undo custom-shape"
      id="undo"
      aria-label={TOOLTIPS.undo.label}
      data-tooltip={TOOLTIPS.undo.tooltip}
      onclick={handleUndo_}
    ></button>
    <button
      type="button"
      class="tool redo custom-shape"
      id="redo"
      aria-label={TOOLTIPS.redo.label}
      data-tooltip={TOOLTIPS.redo.tooltip}
      onclick={handleRedo_}
    ></button>
  </div>
  <div class="btn-pair">
    <button
      type="button"
      class="tool recenter custom-shape"
      aria-label={TOOLTIPS.recenter.label}
      data-tooltip={TOOLTIPS.recenter.tooltip}
      onclick={handleRecenter}
    ></button>
    <button
      type="button"
      class="tool clear custom-shape{pastedLayer ? ' disabled' : ''}"
      aria-label={TOOLTIPS.clearCanvas.label}
      data-tooltip={TOOLTIPS.clearCanvas.tooltip}
      onclick={handleClear}
    ></button>
  </div>
  <div class="zoom btn-pair">
    <button
      type="button"
      id="minus"
      class="zoombtn minus"
      aria-label={TOOLTIPS.zoomOut.label}
      data-tooltip={TOOLTIPS.zoomOut.tooltip}
      onclick={handleZoom}
    ></button>
    <button
      type="button"
      id="plus"
      class="zoombtn plus"
      aria-label={TOOLTIPS.zoomIn.label}
      data-tooltip={TOOLTIPS.zoomIn.tooltip}
      onclick={handleZoom}
    ></button>
  </div>
  <div class="tools">
    <h4>Tools</h4>
    <div class="columns">
      <div class="column">
        {#each COLUMN1_TOOLS as item (item)}
          {#if toolGroups[item]}
            {@const group = toolGroups[item]}
            {@const activeToolName = groupActiveTools[item]}
            {@const isGroupSelected = group.tools.includes(selectedName)}
            {@const groupBtnClass = isGroupSelected
              ? selectedName
              : activeToolName}
            {@const isOpen = openGroup === item}
            {@const groupTip = getTooltip(item)}
            <div class="tool-group{isOpen ? ' open' : ''}" data-group={item}>
              <button
                type="button"
                class="tool-group-btn {groupBtnClass}{isGroupSelected
                  ? ' selected'
                  : ''}"
                data-group={item}
                aria-label={groupTip.label}
                data-tooltip={groupTip.tooltip}
                onclick={() => handleGroupBtnClick(item)}
              ></button>
              {#if isOpen}
                <div class="tool-group-popout">
                  {#each group.tools as toolName (toolName)}
                    {@const tip = getTooltip(toolName)}
                    <button
                      type="button"
                      class="tool {toolName}{selectedName === toolName
                        ? ' selected'
                        : ''}"
                      id={toolName}
                      aria-label={tip.label}
                      data-tooltip={tip.tooltip}
                      onclick={() => handleToolClick(toolName)}
                    ></button>
                  {/each}
                </div>
              {/if}
            </div>
          {:else}
            {@const tip = getTooltip(item)}
            <button
              type="button"
              class="tool {item}{selectedName === item ? ' selected' : ''}"
              id={item}
              aria-label={tip.label}
              data-tooltip={tip.tooltip}
              onclick={() => handleToolClick(item)}
            ></button>
          {/if}
        {/each}
      </div>
      <div class="column">
        {#each COLUMN2_TOOLS as name (name)}
          {@const tip = getTooltip(name)}
          <button
            type="button"
            class="tool {name}{selectedName === name ? ' selected' : ''}"
            id={name}
            aria-label={tip.label}
            data-tooltip={tip.tooltip}
            onclick={() => handleToolClick(name)}
          ></button>
        {/each}
      </div>
    </div>
  </div>
</DialogBox>
