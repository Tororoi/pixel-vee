<script>
  import { onMount } from 'svelte'
  import { initializeDragger, initializeCollapser } from '../utils/drag.js'
  import BrushPanel from './panels/BrushPanel.svelte'
  import PalettePanel from './panels/PalettePanel.svelte'
  import LayersPanel from './panels/LayersPanel.svelte'
  import VectorsPanel from './panels/VectorsPanel.svelte'

  let ref = $state(null)

  onMount(() => {
    if (!ref) return
    initializeDragger(ref)
    initializeCollapser(ref)
    return () => {
      delete ref?.dataset.dragInitialized
    }
  })
</script>

<div bind:this={ref} class="sidebar dialog-box h-drag free locked">
  <div id="sidebar-header" class="header dragger">
    <div class="drag-btn locked">
      <div class="grip"></div>
    </div>
    Tools
    <label
      for="sidebar-collapse-btn"
      class="collapse-btn"
      data-tooltip="Collapse/ Expand"
    >
      <input
        type="checkbox"
        aria-label="Collapse or Expand"
        class="collapse-checkbox"
        id="sidebar-collapse-btn"
      />
      <span class="arrow"></span>
    </label>
  </div>
  <div class="collapsible">
    <BrushPanel />
    <PalettePanel />
    <LayersPanel />
    <VectorsPanel />
  </div>
</div>
