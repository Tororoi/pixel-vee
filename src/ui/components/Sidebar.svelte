<script>
  /**
   * @component
   * Sidebar shell that stacks the four main panel components —
   * BrushPanel, PalettePanel, LayersPanel, and VectorsPanel — inside a
   * shared collapsible DialogBox. Contains no logic of its own; all
   * behaviour lives in the individual panels.
   */
  import DialogBox from './DialogBox.svelte'
  import BrushPanel from './panels/BrushPanel.svelte'
  import PalettePanel from './panels/PalettePanel.svelte'
  import LayersPanel from './panels/LayersPanel.svelte'
  import VectorsPanel from './panels/VectorsPanel.svelte'
</script>

<DialogBox title="Tools" class="sidebar h-drag free locked" collapsible locked>
  <BrushPanel />
  <PalettePanel />
  <LayersPanel />
  <VectorsPanel />
</DialogBox>
