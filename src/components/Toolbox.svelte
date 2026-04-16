<script>
  import { onMount } from 'svelte'
  import { getVersion } from '../hooks/appState.svelte.js'
  import { globalState } from '../Context/state.js'
  import { canvas } from '../Context/canvas.js'
  import { toolGroups } from '../Tools/index.js'
  import { switchTool } from '../Tools/toolbox.js'
  import { handleUndo, handleRedo } from '../Actions/undoRedo/undoRedo.js'
  import { brush, rebuildBuildUpDensityMap } from '../Tools/brush.js'
  import { actionClear } from '../Actions/modifyTimeline/modifyTimeline.js'
  import {
    actionZoom,
    actionRecenter,
  } from '../Actions/untracked/viewActions.js'
  import { vectorGui } from '../GUI/vector.js'
  import { renderCanvas } from '../Canvas/render.js'
  import { renderVectorsToDOM } from '../DOM/renderVectors.js'
  import { ZOOM_LEVELS } from '../utils/constants.js'
  import { initializeDragger, initializeCollapser } from '../utils/drag.js'

  const COLUMN1_TOOLS = [
    'brush',
    'fill',
    'curve',
    'shapeTools',
    'selectionTools',
  ]
  const COLUMN2_TOOLS = ['eyedropper', 'grab', 'move']

  let ref = $state(null)
  let openGroup = $state(null)

  const selectedName = $derived(
    getVersion() >= 0 ? globalState.tool.selectedName : '',
  )
  const pastedLayer = $derived(getVersion() >= 0 && !!canvas.pastedLayer)

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    initializeCollapser(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })

  function handleUndo_() {
    handleUndo()
    if (brush.modes.buildUpDither) rebuildBuildUpDensityMap()
  }

  function handleRedo_() {
    handleRedo()
    if (brush.modes.buildUpDither) rebuildBuildUpDensityMap()
  }

  function handleRecenter() {
    actionRecenter()
  }

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
    renderVectorsToDOM()
  }

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

  function handleGroupBtnClick(groupKey) {
    const group = toolGroups[groupKey]
    switchTool(group.activeTool)
    openGroup = openGroup === groupKey ? null : groupKey
  }

  const LABELS = {
    brush: 'Brush (B)',
    fill: 'Fill (F)',
    curve: 'Curve (V)',
    eyedropper: 'Eyedropper (Hold Alt)',
    grab: 'Grab (Hold Space)',
    move: 'Move',
  }
  const TOOLTIPS = { ...LABELS }

  const GROUP_LABELS = {
    shapeTools: 'Shapes',
    selectionTools: 'Select (S)',
  }

  const TOOL_INFO = {
    ellipse: {
      label: 'Ellipse (O) Hold Shift to maintain circle',
      tooltip: 'Ellipse (O)\n\nHold Shift to maintain circle',
    },
    polygon: {
      label: 'Polygon (P) Hold Shift to maintain square',
      tooltip: 'Polygon (P)\n\nHold Shift to maintain square',
    },
    select: { label: 'Select (S)', tooltip: 'Select (S)' },
    magicWand: { label: 'Magic Wand (W)', tooltip: 'Magic Wand (W)' },
  }
</script>

<div bind:this={ref} class="toolbox dialog-box h-drag free locked">
  <div id="toolbox-header" class="header dragger">
    <div class="drag-btn locked">
      <div class="grip"></div>
    </div>
    Toolbox
    <label
      for="toolbox-collapse-btn"
      id="toolbox-collapser"
      class="collapse-btn"
      data-tooltip="Collapse/ Expand"
    >
      <input
        type="checkbox"
        aria-label="Collapse or Expand"
        class="collapse-checkbox"
        id="toolbox-collapse-btn"
      />
      <span class="arrow"></span>
    </label>
  </div>
  <div class="collapsible">
    <div class="btn-pair">
      <button
        type="button"
        class="tool undo custom-shape"
        id="undo"
        aria-label="Undo (Cmd + Z)"
        data-tooltip="Undo (Cmd + Z)"
        onclick={handleUndo_}
      ></button>
      <button
        type="button"
        class="tool redo custom-shape"
        id="redo"
        aria-label="Redo (Cmd + Shift + Z)"
        data-tooltip="Redo (Cmd + Shift + Z)"
        onclick={handleRedo_}
      ></button>
    </div>
    <div class="btn-pair">
      <button
        type="button"
        class="tool recenter custom-shape"
        aria-label="Recenter Canvas"
        data-tooltip="Recenter Canvas"
        onclick={handleRecenter}
      ></button>
      <button
        type="button"
        class="tool clear custom-shape{pastedLayer ? ' disabled' : ''}"
        aria-label="Clear Canvas"
        data-tooltip="Clear Canvas"
        onclick={handleClear}
      ></button>
    </div>
    <div class="zoom btn-pair">
      <button
        type="button"
        id="minus"
        class="zoombtn minus"
        aria-label="Zoom Out (Mouse Wheel)"
        data-tooltip="Zoom Out (Mouse Wheel)"
        onclick={handleZoom}
      ></button>
      <button
        type="button"
        id="plus"
        class="zoombtn plus"
        aria-label="Zoom In (Mouse Wheel)"
        data-tooltip="Zoom In (Mouse Wheel)"
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
              {@const activeToolName = group.activeTool}
              {@const isGroupSelected = group.tools.includes(selectedName)}
              {@const groupBtnClass = isGroupSelected
                ? selectedName
                : activeToolName}
              {@const isOpen = openGroup === item}
              <div class="tool-group{isOpen ? ' open' : ''}" data-group={item}>
                <button
                  type="button"
                  class="tool-group-btn {groupBtnClass}{isGroupSelected
                    ? ' selected'
                    : ''}"
                  data-group={item}
                  aria-label={GROUP_LABELS[item] ?? item}
                  data-tooltip={GROUP_LABELS[item] ?? item}
                  onclick={() => handleGroupBtnClick(item)}
                ></button>
                {#if isOpen}
                  <div class="tool-group-popout">
                    {#each group.tools as toolName (toolName)}
                      {@const info = TOOL_INFO[toolName] ?? {
                        label: toolName,
                        tooltip: toolName,
                      }}
                      <button
                        type="button"
                        class="tool {toolName}{selectedName === toolName
                          ? ' selected'
                          : ''}"
                        id={toolName}
                        aria-label={info.label}
                        data-tooltip={info.tooltip}
                        onclick={() => handleToolClick(toolName)}
                      ></button>
                    {/each}
                  </div>
                {/if}
              </div>
            {:else}
              <button
                type="button"
                class="tool {item}{selectedName === item ? ' selected' : ''}"
                id={item}
                aria-label={LABELS[item] ?? item}
                data-tooltip={TOOLTIPS[item] ?? item}
                onclick={() => handleToolClick(item)}
              ></button>
            {/if}
          {/each}
        </div>
        <div class="column">
          {#each COLUMN2_TOOLS as name (name)}
            <button
              type="button"
              class="tool {name}{selectedName === name ? ' selected' : ''}"
              id={name}
              aria-label={LABELS[name] ?? name}
              data-tooltip={TOOLTIPS[name] ?? name}
              onclick={() => handleToolClick(name)}
            ></button>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>
